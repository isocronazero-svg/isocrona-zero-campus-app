import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('..', import.meta.url));
const dir = mkdtempSync(path.join(tmpdir(), 'iz-contributions-'));
const seed = JSON.parse(readFileSync(path.join(root, 'data/default-state.json'), 'utf8'));
seed.accounts = [
  { id:'quiz-admin', name:'Profesor', email:'quiz-admin@example.test', password:'Quiz-test-2026', role:'admin', memberId:'', associateId:'' },
  { id:'quiz-member', name:'Alumno', email:'quiz-member@example.test', password:'Quiz-test-2026', role:'member', memberId:'quiz-member-id', associateId:'' }
];
seed.accounts.push({id:'second-member',name:'Otra socia',email:'other@example.test',password:'Quiz-test-2026',role:'member',memberId:'second-member-id'});
seed.settings.automation.autoRunOnSave=false;
seed.members.push(...seed.accounts.filter(a=>a.memberId).map(a => ({id:a.memberId,name:a.name,email:a.email,role:a.role})));
seed.testZoneQuestions = [0,1,2].map(i => ({ id:`quiz-q${i}`, prompt:`Pregunta ${i}`, options:['A','B','C','D'], correctIndex:i, explanation:`Explicación privada ${i}`, active:true, published:true, part:'QUIZ', category:'Prueba', difficulty:'media' }));
seed.courses.push({id:'quiz-course',title:'Curso de prueba',sharedTestQuestionIds:['quiz-q2','quiz-q0'],enrolledIds:[],waitingIds:[],diplomaReady:[]});
writeFileSync(path.join(dir,'seed.json'), JSON.stringify(seed));
let child, origin, adminCookie;
const question = prompt => ({prompt,options:['A','B','C','D'],correctIndex:2,part:'IVASPE',category:'Revisión',difficulty:'media',explanation:'Referencia de prueba'});
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

try {
  await start();
  const login=async index => (await req('/api/login',{email:seed.accounts[index].email,password:seed.accounts[index].password,rememberMe:true})).cookie;
  adminCookie=await login(0);const memberCookie=await login(1),otherCookie=await login(2);
  const member=(route,body)=>req(route,body,{cookie:memberCookie});
  const other=(route,body)=>req(route,body,{cookie:otherCookie});
  const list='/api/test-zone/contributions';
  assert.equal((await req(list)).status,401);
  assert.equal((await member(list,{question:question('Aportación uno')})).body.queued,1);
  assert.equal((await member(list,{question:question('Aportación uno')})).body.duplicate,true);
  let own=(await member(list)).body.items; assert.equal(own.length,1);
  assert.equal((await other(list)).body.total,0,'Other members cannot see an unreviewed answer key');
  assert.equal((await member('/api/state')).body.testZoneContributions,undefined);
  assert.equal((await member('/api/test-zone/questions')).body.questions.some(q=>q.prompt==='Aportación uno'),false);
  assert.equal((await member(`${list}/${own[0].id}`,{action:'approve',revision:1,question:question('Aportación uno')})).status,403);
  assert.equal((await member('/api/test-zone/questions',question('Saltar revisión'))).status,403);
  assert.equal((await member(list,{question:{...question('Inválida'),options:['A','B']}})).status,400);
  assert.equal((await member(list,{question:{...question('Inválida'),correctIndex:null}})).status,400);
  const changed={...own[0].question,prompt:'Aportación corregida',correctIndex:1};
  assert.equal((await admin(`${list}/${own[0].id}`,{action:'save',revision:1,question:changed})).body.item.revision,2);
  assert.equal((await admin(`${list}/${own[0].id}`,{action:'approve',revision:1,question:changed})).status,409,'Stale reviewer cannot overwrite a correction');
  const stale=(await admin('/api/state')).body;
  const approved=await admin(`${list}/${own[0].id}`,{action:'approve',revision:2,question:changed});
  assert.equal(approved.body.item.status,'approved');
  const published=(await admin('/api/test-zone/questions')).body.questions.find(q=>q.prompt===changed.prompt);
  assert.equal(published.correctIndex,1);
  assert.equal((await member('/api/test-zone/questions')).body.questions.find(q=>q.id===published.id).correctIndex,undefined);
  await admin('/api/state',stale);
  assert.equal((await member(list)).body.items[0].status,'approved','Whole-state stale saves must not undo moderation');
  assert.ok((await admin('/api/test-zone/questions')).body.questions.some(q=>q.id===published.id),'Stale saves must not erase a newly approved question');
  assert.equal((await admin(list,{question:question('Pregunta directa admin')})).body.published,true);
  assert.equal((await admin(list,{question:question('Pregunta admin como socio'),submitForReview:true})).body.queued,1);
  assert.equal((await admin(`${list}?mode=member`)).body.total,1,'Member view shows only own admin contributions');
  assert.equal((await admin('/api/test-zone/questions')).body.questions.some(q=>q.prompt==='Pregunta admin como socio'),false);
  const ownAdmin=(await admin(`${list}?mode=member`)).body.items[0];
  assert.equal((await admin(`${list}/${ownAdmin.id}`,{action:'reject',revision:1})).body.item.status,'rejected');
  assert.equal((await admin(`${list}/${ownAdmin.id}`,{action:'approve',revision:2,question:ownAdmin.question})).status,409);

  const info=(await member('/api/test-zone/import')).body;
  assert.equal(info.admin,false);assert.ok(info.template.startsWith('prompt,'));
  const csv=info.template.replace('Pregunta de ejemplo','CSV aportado por socio');
  const batch={part:'IVASPE',files:[{name:'aportacion.csv',csv}]};
  const preview=(await member('/api/test-zone/import/preview',batch)).body;
  assert.equal(preview.ready,1);assert.equal(preview.moderationRequired,true);
  const applied=(await member('/api/test-zone/import/apply',batch)).body;
  assert.equal(applied.ready,1);assert.equal(applied.moderationRequired,true);
  assert.equal((await member('/api/test-zone/import/apply',batch)).body.ready,0,'CSV retry does not duplicate pending contributions');
  assert.equal((await member('/api/test-zone/questions')).body.questions.some(q=>q.prompt==='CSV aportado por socio'),false);
  const csvOwn=(await member(list)).body.items.find(i=>i.question.prompt==='CSV aportado por socio');
  assert.equal(csvOwn.status,'pending');
  const invalid={...batch,files:[{name:'good.csv',csv:csv.replace('CSV aportado por socio','No guardar parcialmente')},{name:'bad.csv',csv:'invalid header\ninvalid row'}]};
  assert.equal((await member('/api/test-zone/import/apply',invalid)).status,400);
  assert.equal((await member(list)).body.items.some(i=>i.question.prompt==='No guardar parcialmente'),false);
  assert.equal((await member('/api/test-zone/import/preview',{part:'IVASPE',bundled:true})).status,403);
  const adminBatch={...batch,files:[{name:'admin.csv',csv:csv.replace('CSV aportado por socio','CSV aportado por admin')}]};
  assert.equal((await admin('/api/test-zone/import/apply',adminBatch)).body.moderationRequired,false);
  assert.ok((await admin('/api/test-zone/questions')).body.questions.some(q=>q.prompt==='CSV aportado por admin'));
  await admin('/api/state',stale);
  assert.ok((await admin('/api/test-zone/questions')).body.questions.some(q=>q.prompt==='CSV aportado por admin'),'Imported questions survive old tabs saving state');
  const savedMember=(await member('/api/state')).body;
  savedMember.testZoneContributions=[];
  assert.equal((await member('/api/state',savedMember)).status,200);
  assert.ok((await member(list)).body.items.some(i=>i.id===csvOwn.id));
  await stop(); await start();
  assert.equal((await member(list)).body.items.find(i=>i.id===csvOwn.id).status,'pending','Queue persists across restarts');
  const approvedCsv=(await admin(`${list}/${csvOwn.id}`,{action:'approve',revision:1,question:csvOwn.question})).body;
  assert.equal(approvedCsv.item.status,'approved');
  console.log('Community checks passed: moderated manual/CSV contributions, privacy, retries, revision conflicts, stale saves and persistence.');
} finally {await stop();rmSync(dir,{recursive:true,force:true});}
