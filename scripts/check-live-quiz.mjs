import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import { randomUUID, createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { setTimeout as delay } from 'node:timers/promises';
import vm from 'node:vm';

const root = fileURLToPath(new URL('..', import.meta.url));
const testsView = readFileSync(path.join(root, 'public/assets/js/app/views/testsView.js'), 'utf8');
const liveMarkupStart = testsView.indexOf('function buildAdminLiveSessionsMarkup()');
const liveMarkupEnd = testsView.indexOf('function buildStudentLiveAnswerFeedbackMarkup(', liveMarkupStart);
assert.ok(liveMarkupStart >= 0 && liveMarkupEnd > liveMarkupStart);
for (const sessions of [[], [{ id: 'private-room', status: 'lobby' }]]) {
  const context = {
    testsViewState: { liveSessions: sessions }, escapeHtml: String,
    getLiveStatusLabel: String, buildLiveLeaderboardMarkup: () => ''
  };
  vm.runInNewContext(testsView.slice(liveMarkupStart, liveMarkupEnd), context);
  const adminMarkup = context.buildAdminLiveSessionsMarkup();
  assert.match(adminMarkup, /href="\/live-host.html"/, 'Host entry remains visible even without private rooms');
  assert.equal(adminMarkup.includes('data-session-id="private-room"'), sessions.length > 0);
  const memberMarkup = context.buildStudentLiveJoinMarkup();
  assert.match(memberMarkup, /href="\/play-live.html"/);
  assert.match(memberMarkup, /data-tests-student-form="live-join"/, 'Existing private live join is preserved');
  assert.doesNotMatch(memberMarkup, /live-host.html/);
}
const practiceView = readFileSync(path.join(root, 'public/assets/js/app/views/testView.js'), 'utf8');
assert.doesNotMatch(practiceView, /href="\/(live-host|play-live).html"/, 'Directed live belongs in the live view, not inside practice');
const dir = mkdtempSync(path.join(tmpdir(), 'iz-live-quiz-'));
const seed = JSON.parse(readFileSync(path.join(root, 'data/default-state.json'), 'utf8'));
seed.accounts = [
  { id:'quiz-admin', name:'Profesor', email:'quiz-admin@example.test', password:'Quiz-test-2026', role:'admin', memberId:'quiz-admin-member', associateId:'' },
  { id:'quiz-member', name:'Alumno', email:'quiz-member@example.test', password:'Quiz-test-2026', role:'member', memberId:'quiz-member-id', associateId:'' }
];
seed.members.push(...seed.accounts.map(a => ({id:a.memberId,name:a.name,email:a.email,role:a.role})));
seed.testZoneQuestions = [0,1,2].map(i => ({ id:`quiz-q${i}`, prompt:`Pregunta ${i}`, options:['A','B','C','D'], correctIndex:i, explanation:`Explicación privada ${i}`, active:true, published:true, part:'QUIZ', category:'Prueba', difficulty:'media' }));
seed.courses.push({id:'quiz-course',title:'Curso de prueba',sharedTestQuestionIds:['quiz-q2','quiz-q0'],enrolledIds:[],waitingIds:[],diplomaReady:[]});
writeFileSync(path.join(dir,'seed.json'), JSON.stringify(seed));
let child, origin, adminCookie, db;
async function start() {
  const probe = net.createServer(); probe.listen(0,'127.0.0.1'); await once(probe,'listening');
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  origin = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath,['server.js'], {cwd:root,env:{...process.env,PORT:String(port),HOST:'127.0.0.1',NODE_ENV:'test',IZ_DATA_DIR:dir,IZ_DEFAULT_STATE_PATH:path.join(dir,'seed.json'),DATABASE_URL:'',IZ_RECOVERY_ADMIN_EMAIL:'',IZ_RECOVERY_ADMIN_PASSWORD:'',IZ_BASE_URL:origin},stdio:['ignore','pipe','pipe']});
  let logs=''; child.stdout.on('data',chunk=>logs+=chunk);child.stderr.on('data',chunk=>logs+=chunk);
  for(let i=0;i<100;i++){if(child.exitCode!==null)throw new Error(logs);try{if((await fetch(origin+'/healthz')).ok)return;}catch{}await delay(100);}throw new Error(logs);
}
async function stop(){if(!child||child.exitCode!==null)return;const exited=once(child,'exit');child.kill();await exited;}
async function req(route,body,{cookie='',token='',headers={}}={}){
  const res=await fetch(origin+route,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Cookie:cookie,...(token?{'X-Live-Token':token}:{}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
  return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};
}
async function admin(route,body){return req(route,body,{cookie:adminCookie});}
async function view(id){const r=await admin(`/api/live-quiz/${id}/host`);assert.equal(r.status,200);return r.body.session;}
async function action(id,actionName,revision){return admin(`/api/live-quiz/${id}/action`,{action:actionName,revision});}
function changeStored(id,change){const row=db.prepare('SELECT value FROM live_quizzes WHERE id=?').get(id);const s=JSON.parse(row.value);change(s);db.prepare('UPDATE live_quizzes SET value=? WHERE id=?').run(JSON.stringify(s),id);}
try{
  await start(); db=new DatabaseSync(path.join(dir,'campus.db'));
  adminCookie=(await req('/api/login',{email:seed.accounts[0].email,password:seed.accounts[0].password,rememberMe:true})).cookie;
  const memberCookie=(await req('/api/login',{email:seed.accounts[1].email,password:seed.accounts[1].password})).cookie;
  const creation={requestId:randomUUID(),title:'Clase de prueba',questionCount:3,seconds:20,filters:{part:'QUIZ'}};
  assert.equal((await req('/api/live-quiz',creation)).status,401);
  assert.equal((await req('/api/live-quiz',creation,{cookie:memberCookie})).status,403);
  const created=await admin('/api/live-quiz',creation);assert.equal(created.status,201,JSON.stringify(created.body));
  const id=created.body.session.id,code=created.body.session.code;
  assert.equal((await admin('/api/live-quiz',creation)).body.session.id,id,'Creation retry must not duplicate a room');
  assert.equal((await action(id,'start',0)).status,400,'An empty room must not start');
  assert.equal((await admin('/api/live-quiz',{...creation,requestId:randomUUID(),seconds:0})).status,400);
  const one=randomUUID(),two=randomUUID(),intruder=randomUUID();
  const join=async(name,token)=>req('/api/live-quiz/join',{guestName:name,participantToken:token,code});
  const [p1,p2]=await Promise.all([join('Ana',one),join('Carlos',two)]);
  assert.equal(p1.status,200);assert.equal(p2.status,200);
  assert.equal((await join('Ana',one)).body.session.player.id,p1.body.session.player.id,'Rejoin keeps identity');
  assert.equal((await join('Ana',intruder)).status,409,'Duplicate display names need disambiguation');
  assert.equal((await req(`/api/live-quiz/${id}`,undefined,{token:intruder})).status,403);
  assert.equal((await req(`/api/live-quiz/${id}/host`,undefined,{token:one})).status,401);
  let s=(await action(id,'start',0)).body.session;assert.equal(s.phase,'question');
  assert.equal((await action(id,'start',0)).status,409,'Repeated start must not reset the clock');
  const q=s.question,correct=Number(q.id.slice(-1));
  const playerState=(await req(`/api/live-quiz/${id}`,undefined,{token:one})).body.session;
  assert.equal(playerState.question.correctIndex,undefined);assert.equal(playerState.question.explanation,undefined);
  assert.equal(playerState.questions,undefined);assert.equal(playerState.leaderboard.length,0);
  assert.equal((await req(`/api/live-quiz/${id}/answer`,{questionId:q.id,selectedIndex:null},{token:one})).status,400);
  assert.equal((await req(`/api/live-quiz/${id}/answer`,{questionId:'other-question',selectedIndex:0},{token:one})).status,409);
  const [a1,a2]=await Promise.all([req(`/api/live-quiz/${id}/answer`,{questionId:q.id,selectedIndex:correct},{token:one}),req(`/api/live-quiz/${id}/answer`,{questionId:q.id,selectedIndex:(correct+1)%4},{token:two})]);
  assert.equal(a1.body.accepted,true);assert.equal(a2.body.accepted,true);
  assert.equal(a1.body.session.player.answer,undefined,'Do not reveal correctness before closing');
  assert.equal(a1.body.session.player.score,undefined);
  assert.equal((await view(id)).answersCount,2,'Concurrent answers must both survive');
  const duplicate=await req(`/api/live-quiz/${id}/answer`,{questionId:q.id,selectedIndex:correct},{token:one});assert.equal(duplicate.body.accepted,true);
  assert.equal((await view(id)).answersCount,2);
  assert.equal((await req(`/api/live-quiz/${id}/answer`,{questionId:q.id,selectedIndex:(correct+1)%4},{token:one})).status,409);
  s=(await action(id,'reveal',s.revision)).body.session;assert.equal(s.phase,'reveal');assert.equal(s.question.correctIndex,correct);
  assert.equal(s.leaderboard[0].name,'Ana');assert.ok(s.leaderboard[0].score>=500&&s.leaderboard[0].score<=1000);
  const firstScore=s.leaderboard[0].score;
  assert.equal((await req(`/api/live-quiz/${id}/answer`,{questionId:q.id,selectedIndex:correct},{token:one})).body.accepted,true,'Lost response can be retried after reveal');
  assert.equal((await view(id)).leaderboard[0].score,firstScore);
  // The state export is not a transport for participant tokens or quiz answer keys.
  const publicState=JSON.stringify((await req('/api/state',undefined,{cookie:memberCookie})).body);
  assert.equal(publicState.includes(hashToken(one)),false);assert.equal(publicState.includes(id),false);
  await stop();await start();
  s=await view(id);assert.equal(s.phase,'reveal');assert.equal(s.leaderboard[0].score,firstScore);
  assert.equal((await req(`/api/live-quiz/${id}`,undefined,{token:one})).body.session.player.id,p1.body.session.player.id);
  s=(await action(id,'next',s.revision)).body.session;assert.equal(s.index,1);
  assert.equal((await action(id,'next',s.revision-1)).status,409,'Double next must not skip a question');
  // A fixed past deadline avoids millisecond clock skew between test/server processes.
  changeStored(id,x=>{x.deadline=1;});
  s=await view(id);assert.equal(s.phase,'reveal','Timer closes the question on the server');
  assert.equal((await req(`/api/live-quiz/${id}/answer`,{questionId:s.question.id,selectedIndex:0},{token:one})).status,409);
  s=(await action(id,'next',s.revision)).body.session;assert.equal(s.index,2);
  const course=await admin('/api/live-quiz',{...creation,requestId:randomUUID(),courseId:'quiz-course'});assert.equal(course.body.session.total,2);
  const courseRow=JSON.parse(db.prepare('SELECT value FROM live_quizzes WHERE id=?').get(course.body.session.id).value);
  assert.deepEqual(courseRow.questions.map(q=>q.id),['quiz-q2','quiz-q0'],'Course question order is preserved');
  assert.equal((await req(`/api/live-quiz/${course.body.session.id}`,undefined,{token:one})).status,403,'Token must be scoped to the room');
  const stateRow=JSON.parse(db.prepare("SELECT value FROM app_state WHERE key='campus_state'").get().value);
  stateRow.testZoneQuestions.forEach(q=>{q.prompt='Edited during class';q.correctIndex=3;});
  db.prepare("UPDATE app_state SET value=? WHERE key='campus_state'").run(JSON.stringify(stateRow));
  assert.equal((await view(id)).question.prompt.startsWith('Pregunta'),true,'The class uses its immutable question snapshot');
  const last=await view(id);await action(id,'reveal',last.revision);s=await view(id);s=(await action(id,'next',s.revision)).body.session;
  assert.equal(s.phase,'finished');assert.equal(s.leaderboard.length,2);assert.equal(s.leaderboard[0].score,firstScore);
  assert.equal((await join('Nuevo',intruder)).status,410);assert.equal((await join('Ana',one)).body.session.phase,'finished');
  assert.equal((await req('/api/live-quiz',{...creation,requestId:randomUUID()},{cookie:adminCookie,headers:{Origin:'https://attacker.example'}})).status,403);

  // Rooms saved before answers were separated must migrate once without losing scores or tokens.
  const legacy = (await admin('/api/live-quiz',{...creation,requestId:randomUUID()})).body.session;
  const legacyToken = randomUUID(), wrongToken = randomUUID();
  changeStored(legacy.id, room => {
    delete room.answerStorageVersion;
    room.phase = 'reveal'; room.index = 0;
    const question = room.questions[0];
    room.players = [
      {id:'legacy-one',name:'Anterior',tokenHash:hashToken(legacyToken),joinedAt:1,answers:{
        [question.id]:{selectedIndex:question.correctIndex,correct:true,points:731,submittedAt:1}
      }},
      {id:'legacy-two',name:'Sin puntos',tokenHash:hashToken(wrongToken),joinedAt:2,answers:{
        [question.id]:{selectedIndex:(question.correctIndex+1)%4,correct:false,points:0,submittedAt:2}
      }}
    ];
  });
  const migrated = await view(legacy.id);
  assert.equal(migrated.leaderboard[0].score,731);
  assert.equal(migrated.leaderboard[1].score,0);
  const migratedPlayer = (await req(`/api/live-quiz/${legacy.id}`,undefined,{token:legacyToken})).body.session.player;
  assert.equal(migratedPlayer.answer.correct,true);
  assert.equal((await req(`/api/live-quiz/${legacy.id}`,undefined,{token:wrongToken})).body.session.player.answer.correct,false);
  const migratedRow = JSON.parse(db.prepare('SELECT value FROM live_quizzes WHERE id=?').get(legacy.id).value);
  assert.equal(migratedRow.answerStorageVersion,1);
  assert.equal(migratedRow.players.some(p => Object.hasOwn(p,'answers')),false);
  assert.equal((await admin('/api/live-quiz',{...creation,requestId:migratedRow.requestId})).body.session.leaderboard[0].score,731);
  assert.equal((await req(`/api/live-quiz/${legacy.id}/answer`,{
    questionId:migrated.question.id,selectedIndex:migratedPlayer.selectedIndex
  },{token:legacyToken})).body.accepted,true);

  // Exercise a full classroom at the last question without a timing-dependent CI threshold.
  const loadRoom = (await admin('/api/live-quiz',{...creation,requestId:randomUUID(),seconds:120})).body.session;
  const tokens = Array.from({length:200},()=>randomUUID());
  changeStored(loadRoom.id, room => {
    room.questions = Array.from({length:100},(_,i)=>({id:`load-q${i}`,prompt:`Pregunta ${i}`,options:['A','B'],correctIndex:0}));
    room.players = tokens.map((token,i)=>({id:`load-p${i}`,name:`Alumno ${i}`,tokenHash:hashToken(token),joinedAt:i}));
    room.phase = 'question'; room.index = 99; room.deadline = Date.now()+120000;
  });
  const insert = db.prepare('INSERT INTO live_quiz_answers VALUES(?,?,?,?,?,?,?)');
  db.exec('BEGIN');
  for(let player=0;player<200;player++) {
    for(let question=0;question<99;question++) insert.run(loadRoom.id,`load-p${player}`,`load-q${question}`,0,1,500,1);
  }
  db.exec('COMMIT');
  db.exec(`CREATE TABLE check_live_snapshot_updates(session_id TEXT);
    CREATE TRIGGER check_live_snapshot_write AFTER UPDATE ON live_quizzes
    BEGIN INSERT INTO check_live_snapshot_updates VALUES(NEW.id); END;`);
  const beforeBurst = db.prepare('SELECT value FROM live_quizzes WHERE id=?').get(loadRoom.id).value;
  const started = Date.now();
  const burst = await Promise.all(tokens.map((token,i)=>req(`/api/live-quiz/${loadRoom.id}/answer`,{
    questionId:'load-q99',selectedIndex:i === 199 ? 1 : 0
  },{token})));
  const burstMs = Date.now()-started;
  burst.forEach(result=>{
    assert.equal(result.status,200,JSON.stringify(result.body));
    assert.equal(result.body.accepted,true);
    assert.equal(result.body.session.player.answer,undefined);
    assert.deepEqual(result.body.session.leaderboard,[]);
  });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM live_quiz_answers WHERE session_id=?').get(loadRoom.id).n,20000);
  const sameAnswer = {questionId:'load-q99',selectedIndex:0};
  const retries = await Promise.all([0,1].map(()=>req(`/api/live-quiz/${loadRoom.id}/answer`,sameAnswer,{token:tokens[0]})));
  retries.forEach(result=>assert.equal(result.body.accepted,true));
  assert.equal((await req(`/api/live-quiz/${loadRoom.id}/answer`,{...sameAnswer,selectedIndex:1},{token:tokens[0]})).status,409);
  assert.equal((await view(loadRoom.id)).answersCount,200);
  assert.equal(db.prepare('SELECT value FROM live_quizzes WHERE id=?').get(loadRoom.id).value,beforeBurst);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM check_live_snapshot_updates WHERE session_id=?').get(loadRoom.id).n,0,'Answers and polling must not rewrite the session blob');
  const finalLoad = (await action(loadRoom.id,'reveal',0)).body.session;
  assert.equal(finalLoad.leaderboard.length,200);
  assert.equal(finalLoad.leaderboard[0].answered,100);
  assert.equal(finalLoad.leaderboard[0].correct,100);
  assert.equal(finalLoad.leaderboard.at(-1).score,49500);
  assert.equal(finalLoad.leaderboard.at(-1).correct,99);
  await stop(); await start();
  assert.deepEqual((await view(loadRoom.id)).leaderboard,finalLoad.leaderboard,'Every score survives restart');
  assert.equal((await view(legacy.id)).leaderboard[0].score,731);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM live_quiz_answers WHERE session_id=?').get(legacy.id).n,2,'Reading migrated rooms must not duplicate answers');
  console.log(`Live quiz checks passed: permissions, retries, timer, ranking, legacy migration, restart and 200-answer burst (${burstMs}ms, zero session rewrites).`);
}finally{await stop();db?.close();rmSync(dir,{recursive:true,force:true});}
function hashToken(token){return createHash("sha256").update(token).digest("hex");}
