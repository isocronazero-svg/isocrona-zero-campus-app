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

const root = fileURLToPath(new URL('..', import.meta.url));
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
  console.log('Live quiz checks passed: permissions, room identity, concurrent answers, retries, timer, scoreboard, restart, course snapshots and final results.');
}finally{await stop();db?.close();rmSync(dir,{recursive:true,force:true});}
function hashToken(token){return createHash("sha256").update(token).digest("hex");}
