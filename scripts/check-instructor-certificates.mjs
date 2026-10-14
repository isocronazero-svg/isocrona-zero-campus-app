import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { request as httpRequest } from 'node:http';
import vm from 'node:vm';
import { buildInstructorPickerModel, addInstructorSelection, removeInstructorSelection } from '../public/assets/js/app/campus/instructorPicker.js';
const require = createRequire(import.meta.url);
const { reserveInstructorAssignments, assertInstructorAssignmentEditable, validateInstructorAssociateIds, canDownloadInstructorCertificate, isInstructorCertificateAvailable, buildInstructorCertificateModel } = require('../server/instructor-certificate');
const { buildActivityCertificate } = require('../server/activity-certificate');
const { buildDiplomaLayout } = require('../server/diploma-layout');
const { createOnboardingStateAccess } = require('../server/onboarding-state');
const releaseOne=reserveInstructorAssignments(['qa-one']);
const releaseTwo=reserveInstructorAssignments(['qa-one','qa-two']);
releaseOne();
assert.throws(()=>assertInstructorAssignmentEditable('qa-one'),error=>error.statusCode===409);
releaseTwo();
assert.doesNotThrow(()=>assertInstructorAssignmentEditable('qa-one'));
assert.doesNotThrow(()=>assertInstructorAssignmentEditable('qa-two'));
const releaseHistorical=reserveInstructorAssignments(['qa-history'],['qa-history']);
assert.doesNotThrow(()=>assertInstructorAssignmentEditable('qa-history'));
releaseHistorical();
// A writer paused during automation must not undo a later administrative flag change.
for (const enabled of [true,false]) {
  let stored={associates:[{id:'qa',instructorEnabled:!enabled}],settings:{}};
  const access=createOnboardingStateAccess({
    readState:()=>structuredClone(stored),writeState:state=>{stored=structuredClone(state);}
  });
  const slow=access.readState();
  const admin=access.readState();
  admin.associates[0].instructorEnabled=enabled;
  access.writeState(admin,{instructorUpdateId:'qa'});
  assert.equal(stored.associates[0].instructorEnabled,enabled,'Explicit administrative change persists');
  slow.associates[0].service='Unrelated update';
  access.writeState(slow);
  assert.equal(stored.associates[0].instructorEnabled,enabled,'Concurrent writer preserves eligibility');
  const staleSnapshot={...slow,associates:[{id:'qa',instructorEnabled:!enabled}]};
  access.writeState(staleSnapshot);
  assert.equal(stored.associates[0].instructorEnabled,enabled,'Whole-state snapshot cannot own eligibility');
  const unrelated=access.readState();
  unrelated.associates[0].instructorEnabled=!enabled;
  access.writeState(unrelated);
  assert.equal(stored.associates[0].instructorEnabled,enabled,'Only the administrative PATCH may change eligibility');
}
const password = randomUUID();
const seed = JSON.parse(readFileSync('data/default-state.json','utf8'));
seed.accounts = ['admin','member','adminwith','other','instructor','legacyemail','legacyname','nomember'].map(id => ({ id, name: id === 'admin' ? 'Admin sin ficha' : id, email: `${id}@example.test`, password,
  role: id.startsWith('admin') ? 'admin' : id === 'instructor' ? 'instructor' : 'member', memberId: id,
  associateId: id === 'member' ? 'socio-one' : id === 'adminwith' ? 'socio-two' : '' }));
for (const id of ['namesake','linkednamesake','ambiguous','dangling']) {
  seed.accounts.push({id,name:'Normal Docente Uno',email:`${id}@example.test`,password,role:'member',memberId:id,
    associateId:id==='namesake'?'namesake-own':id==='dangling'?'missing-associate':''});
}
seed.members = seed.accounts.map(a => ({ id:a.memberId, name:a.name, email:a.email, associateId:a.associateId }));
// A DB-migrated legacy member retains its server-owned campus provenance.
seed.accounts.find(a=>a.id==='legacyname').source='postgres';
seed.members.find(m=>m.id==='legacyname').source='campus';
seed.accounts.push({id:'freshdb',name:'Legacy Email',email:'freshdb@example.test',password,role:'member',
  memberId:'freshdb',associateId:'',source:'postgres'});
seed.members.push({id:'freshdb',name:'Legacy Email',email:'freshdb@example.test',associateId:'',source:'postgres'});
seed.associates = [{ id:'socio-one', firstName:'Normal', lastName:'Docente Uno', dni:'12345678Z', associateNumber:1, email:'member@example.test', linkedMemberId:'member',linkedAccountId:'member', instructorEnabled:true },
  { id:'socio-two', firstName:'Admin', lastName:'Docente Dos', dni:'87654321X', associateNumber:2, email:'adminwith@example.test', linkedMemberId:'adminwith',linkedAccountId:'adminwith', instructorEnabled:true }];
seed.associates.push({ id:'legacy-email',firstName:'Legacy Email',email:'legacyemail@example.test', instructorEnabled:true },
  { id:'legacy-name',firstName:'legacyname' }, { id:'unnamed',firstName:' ',lastName:'' },
  { id:'unassigned',firstName:'Sin docencia',associateNumber:5 },
  { id:'namesake-own',firstName:'Normal',lastName:'Docente Uno' },
  { id:'linkednamesake-own',firstName:'Normal',lastName:'Docente Uno',linkedMemberId:'linkednamesake' });
seed.members = seed.members.filter(member => member.id !== 'nomember');
for (const id of ['socio-one','socio-two','legacy-email']) {
  Object.assign(seed.associates.find(a=>a.id===id),{instructorEnabled:true,status:'Activa'});
}
seed.associates.push(
  {id:'enabled-three',firstName:'Docente Tres',associateNumber:6,status:'Activa',instructorEnabled:true},
  {id:'enabled-four',firstName:'Docente Cuatro',associateNumber:7,status:'Activa',instructorEnabled:true},
  {id:'enabled-five',firstName:'Docente Cinco',associateNumber:10,status:'Activa',instructorEnabled:true},
  {id:'not-enabled',firstName:'Socio normal',associateNumber:8,status:'Activa'},
  {id:'inactive-enabled',firstName:'Socio de baja',associateNumber:9,status:'Baja',instructorEnabled:false});
seed.accounts.find(account => account.id === 'nomember').memberId = '';
seed.settings.automation = { autoRunOnSave:false, autoGenerateDiplomas:false, autoSendDiplomas:false };
seed.settings.diplomaSignerA = 'QA Director'; seed.settings.diplomaSignerB = 'QA Presidente';
const course = { id:'course-teaching', title:'Curso docencia QA', type:'Curso', status:'Cerrado', startDate:'2026-10-01', endDate:'2026-10-02', hours:8, capacity:10,
  coordinator:'Persona legacy no certificable', instructorAssociateIds:['socio-one','socio-two'], enrolledIds:[], waitingIds:[], diplomaReady:[], modules:[], attendance:{}, evaluations:{} };
const blockedCourses = ['Planificacion','Inscripcion abierta','En curso','Cierre pendiente'].map((status,i) =>
  ({...course,id:`course-blocked-${i}`,status}));
blockedCourses.push({...course,id:'course-future',endDate:'2999-01-01'}, {...course,id:'course-no-date',endDate:''},
  {...course,id:'course-ends-today',endDate:new Date().toISOString().slice(0,10)});
seed.courses = [course, { ...course,id:'course-legacy',instructorAssociateIds:[] },
  {...course,id:'course-legacy-owners',accessScope:'members',instructorAssociateIds:['legacy-email','legacy-name']},
  {...course,id:'course-namesakes',instructorAssociateIds:['namesake-own','linkednamesake-own']},
  {...course,id:'course-historical-incomplete',instructorAssociateIds:['unnamed']}, ...blockedCourses];
assert.deepEqual(validateInstructorAssociateIds(seed,course.instructorAssociateIds),course.instructorAssociateIds);
for (const ids of [['admin'],['missing'],['member'],['Persona legacy no certificable'],['socio-one','socio-one'], 'socio-one']) assert.throws(() => validateInstructorAssociateIds(seed,ids), /socios|socio/);
assert.throws(() => validateInstructorAssociateIds(seed,['unnamed']), /nombre/);
assert.throws(() => validateInstructorAssociateIds(seed,['unassigned']), /habilitado/);
assert.deepEqual(validateInstructorAssociateIds(seed,['legacy-name'],['legacy-name']),['legacy-name']);
// DNI/NIE remains optional, as specified by #242; a person's name is required.
assert.deepEqual(validateInstructorAssociateIds(seed,['legacy-email']),['legacy-email']);
for (const id of ['not-enabled','inactive-enabled']) {
  assert.throws(()=>validateInstructorAssociateIds(seed,[id]),/habilitado/);
  assert.deepEqual(validateInstructorAssociateIds(seed,[id],[id]),[id],'Historical assignment is preserved');
}
const dates = { dateRange:'1–2 octubre 2026',issueDate:'11 octubre 2026' };
const model = buildInstructorCertificateModel(seed,course.id,'socio-one',dates);
assert.equal(model.member.name,'Normal Docente Uno');
assert.equal(model.documentId,'12345678Z');
assert.equal(buildInstructorCertificateModel(seed,'course-legacy','socio-one',dates),null);
for (const blocked of blockedCourses) {
  assert.equal(isInstructorCertificateAvailable(blocked),false);
  assert.equal(buildInstructorCertificateModel(seed,blocked.id,'socio-one',dates),null);
}
assert.equal(isInstructorCertificateAvailable({...course,endDate:'2026-02-31'}),false);
assert.equal(isInstructorCertificateAvailable(course,'2026-10-01'),false);
assert.equal(isInstructorCertificateAvailable(course,'2026-10-02'),false,'The entire final day is still blocked');
assert.equal(isInstructorCertificateAvailable(course,'2026-10-03'),true,'Available only after the final day');
assert.equal(buildActivityCertificate(seed,'member').totalHours,0);
assert.equal(buildActivityCertificate(seed,'member').activities.length,0);
const layout = buildDiplomaLayout(model,seed.settings,'');
assert.equal(layout.length,1);
const text = layout.flat().filter(x=>x.type==='text').map(x=>x.text).join('\n');
for (const value of ['INSTRUCTOR/A','Normal Docente Uno','12345678Z','Curso docencia QA','8 horas','QA Director','QA Presidente']) assert.ok(text.includes(value),value);
assert.ok(!text.includes('superado con aprovechamiento'));
assert.ok(!text.includes('Persona legacy'));
assert.equal(canDownloadInstructorCertificate(seed,seed.accounts[1],'socio-one'),true);
assert.equal(canDownloadInstructorCertificate(seed,seed.accounts[1],'socio-two'),false);
assert.equal(canDownloadInstructorCertificate(seed,seed.accounts[0],'socio-one'),true);
assert.equal(canDownloadInstructorCertificate(seed,seed.accounts[0],'admin'),false);
assert.equal(canDownloadInstructorCertificate(seed,seed.accounts.find(a=>a.id==='namesake'),'socio-one',seed.associates[0]),false,
  'A legacy match cannot override an explicit association');

// Real UI helpers: only association records are options; campus administrators without a record are absent.
const app = readFileSync('public/app.js','utf8');
const helpers = app.slice(app.indexOf('function renderInstructorSelector('),app.indexOf('function renderMemberDiplomas('));
const ui = vm.createContext({ state:seed,escapeHtml:s=>String(s),getCurrentAssociate:()=>seed.associates[0],
  buildInstructorPickerModel, addInstructorSelection, removeInstructorSelection,
  document:{ getElementById:()=>({dataset:{instructorIds:JSON.stringify(['socio-one','socio-two'])}}) } });
vm.runInContext(helpers,ui);
const html=vm.runInContext('renderInstructorSelector("qa", ["socio-two"])',ui);
assert.match(html,/value="socio-one"/);assert.match(html,/data-associate-id="socio-two"/);
assert.doesNotMatch(html,/value="socio-two"|value="not-enabled"|value="inactive-enabled"|multiple/);
assert.match(html,/Añadir instructor/);assert.match(html,/Quitar/);
assert.doesNotMatch(html,/Admin sin ficha|value="admin"|value="member"/);
assert.deepEqual(Array.from(vm.runInContext('readInstructorSelection("qa")',ui)),['socio-one','socio-two']);
const normalOption=seed.associates.find(a=>a.id==='not-enabled');
for (const enabled of [true,false,true,false]) {
  normalOption.instructorEnabled=enabled;
  assert.equal(vm.runInContext('renderInstructorSelector("qa")',ui).includes('value="not-enabled"'),enabled);
}
delete normalOption.instructorEnabled;
const picked={dataset:{instructorIds:'[]'}},candidate={value:'',focus(){}};
Object.defineProperty(picked,'outerHTML',{set:html=>{
  picked.dataset.instructorIds=html.match(/data-instructor-ids="(.*?)">/)[1];
}});
const originalDocument=ui.document;
ui.document={getElementById:id=>id==='qa'?picked:candidate};
const fiveIds=['socio-one','socio-two','enabled-three','enabled-four','enabled-five'];
for (const id of fiveIds) {
  candidate.value=id;
  vm.runInContext('updateInstructorSelection("qa","add-course-instructor")',ui);
  vm.runInContext('updateInstructorSelection("qa","add-course-instructor")',ui);
}
assert.deepEqual(JSON.parse(picked.dataset.instructorIds),fiveIds,'Adding twice never duplicates');
vm.runInContext('updateInstructorSelection("qa","remove-course-instructor","socio-two")',ui);
assert.deepEqual(JSON.parse(picked.dataset.instructorIds),fiveIds.filter(id=>id!=='socio-two'),'Removing one preserves the rest');
ui.document=originalDocument;
ui.course=course;ui.member=seed.members[1];
const ownerHtml=vm.runInContext('renderInstructorCertificates(course,member)',ui);
assert.match(ownerHtml,/socio-one.pdf/);assert.doesNotMatch(ownerHtml,/socio-two.pdf/);
for (const blocked of blockedCourses) {
  ui.blocked=blocked;
  assert.equal(vm.runInContext('renderInstructorCertificates(blocked)',ui),'');
  assert.equal(vm.runInContext('renderInstructorCertificates(blocked,member)',ui),'');
}
ui.Date=class extends Date {constructor(...args){super(...(args.length?args:['2026-10-02T23:59:59.999Z']));}};
assert.equal(vm.runInContext('renderInstructorCertificates(course)',ui),'');
assert.equal(vm.runInContext('renderInstructorCertificates(course,member)',ui),'');
ui.Date=class extends Date {constructor(...args){super(...(args.length?args:['2026-10-03T00:00:00.000Z']));}};
assert.match(vm.runInContext('renderInstructorCertificates(course,member)',ui),/socio-one.pdf/);
delete ui.Date;
ui.course=seed.courses.find(c=>c.id==='course-legacy-owners');
ui.getCurrentAssociate=()=>seed.associates.find(a=>a.id==='legacy-email');
ui.member=seed.members.find(m=>m.id==='legacyemail');
assert.match(vm.runInContext('renderInstructorCertificates(course,member)',ui),/legacy-email.pdf/);
assert.doesNotMatch(vm.runInContext('renderInstructorCertificates(course,member)',ui),/legacy-name.pdf/);

// Removing a synthetic associate removes only their teaching link, preserving the other instructor.
const serverSource = readFileSync('server.js','utf8');
const deletionStart = serverSource.indexOf('function deleteAssociateFromState(');
const deletionEnd = serverSource.indexOf('\nfunction ', deletionStart + 1);
const deletion = vm.createContext({ state:structuredClone(seed), context:{ associate:{id:'socio-one'}, linkedMemberId:'', linkedAccounts:[], applications:[] }, removeMemberCourseFootprint:()=>{} });
vm.runInContext(serverSource.slice(deletionStart,deletionEnd)+'\ndeleteAssociateFromState(state,context);',deletion);
assert.deepEqual(Array.from(deletion.state.courses[0].instructorAssociateIds),['socio-two']);
const impactSource = app.slice(app.indexOf('function getAssociateDeletionImpactSummary('),app.indexOf('function openAssociateDeleteDialog('));
const impactUi = vm.createContext({state:seed,associate:seed.associates.find(a=>a.id==='legacy-email')});
vm.runInContext(impactSource,impactUi);
assert.equal(vm.runInContext('getAssociateDeletionImpactSummary(associate).courses',impactUi),1);

const root=mkdtempSync(path.join(os.tmpdir(),'iz-instructor-cert-'));
writeFileSync(path.join(root,'seed.json'),JSON.stringify(seed));
const port=await new Promise(resolve=>{const probe=net.createServer();probe.listen(0,'127.0.0.1',()=>{const p=probe.address().port;probe.close(()=>resolve(p));});});
const base=`http://127.0.0.1:${port}`;
let child,smtp,logs='',smtpMessages=0,releaseSmtp;
let smtpDataReady;
let firstSmtpData=new Promise(resolve=>{smtpDataReady=resolve;});
async function stopServer() {
  if (!child) return;
  const done=new Promise(resolve=>child.once('exit',resolve));child.kill();await done;child=null;
}
async function request(url,cookie,body,method='GET') {
  return fetch(base+url,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
}
async function login(id){const r=await request('/api/login','',{email:`${id}@example.test`,password},'POST');assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];}
try {
  const env={...process.env,NODE_ENV:'test',DATABASE_URL:'',HOST:'127.0.0.1',PORT:String(port),IZ_DATA_DIR:path.join(root,'data'),IZ_DEFAULT_STATE_PATH:path.join(root,'seed.json'),IZ_BASE_URL:base,
    IZ_BOOTSTRAP_ADMIN_EMAIL:'',IZ_BOOTSTRAP_ADMIN_PASSWORD:'',AUTOMATION_INTERVAL_MS:'86400000'};
  for(const key of Object.keys(env))if(key.startsWith('SMTP_'))env[key]='';
  child=spawn(process.execPath,['server.js'],{env,stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);
  let ready=false;for(let i=0;i<100;i++){try{if((await request('/healthz')).ok){ready=true;break;}}catch{}await delay(100);}
  assert.ok(ready,logs);
  const admin=await login('admin'),member=await login('member'),other=await login('other'),instructor=await login('instructor'),adminwith=await login('adminwith');
  const registered=await request('/api/public-campus/register','',{
    firstName:'Admin',lastName:'Docente Dos',email:'public-impostor@example.test',password,
    source:'campus',associateId:'socio-two',role:'admin'
  },'POST');
  assert.equal(registered.status,200);
  const publicCookie=registered.headers.get('set-cookie').split(';')[0];
  assert.equal((await request('/api/courses/course-teaching/instructors/socio-two.pdf',publicCookie)).status,403,
    'Public signup cannot claim another instructor by display name');
  const publicPayload=await (await request('/api/state',publicCookie)).json();
  const publicState=publicPayload.state || publicPayload;
  assert.equal(publicState.associates.length,0,'No instructor identity/DNI in public campus state');
  assert.ok(!publicState.courses.some(c=>c.id==='course-teaching'),'No member-only course access via name');
  assert.equal(publicState.members[0].source,'public-campus');
  publicState.members[0].source='campus';
  publicState.accounts[0].source='';
  assert.equal((await request('/api/state',publicCookie,publicState,'POST')).status,200);
  assert.equal((await request('/api/courses/course-teaching/instructors/socio-two.pdf',publicCookie)).status,403,
    'Member state save cannot forge trusted legacy provenance');
  const freshDbCookie=await login('freshdb');
  assert.equal((await request('/api/courses/course-legacy-owners/instructors/legacy-email.pdf',freshDbCookie)).status,403,
    'New DB-origin account is not a migrated legacy identity');
  for (const id of ['namesake','linkednamesake','ambiguous','dangling']) {
    const cookie=await login(id);
    assert.equal((await request('/api/courses/course-teaching/instructors/socio-one.pdf',cookie)).status,403,
      'A shared name never overrides an explicit link or resolves an ambiguous legacy identity');
    const payload=await (await request('/api/state',cookie)).json();
    const scoped=payload.state || payload;
    assert.ok(!scoped.associates.some(a=>a.id==='socio-one'),'No unrelated identity/DNI in scoped state');
    if(id==='namesake'||id==='linkednamesake'){
      assert.equal((await request(`/api/courses/course-namesakes/instructors/${id}-own.pdf`,cookie)).status,200);
      assert.ok(scoped.associates.some(a=>a.id===id+'-own'));
    }
  }
  for (const [id,associateId] of [['legacyemail','legacy-email'],['legacyname','legacy-name']]) {
    const cookie=await login(id);
    assert.equal((await request(`/api/courses/course-legacy-owners/instructors/${associateId}.pdf`,cookie)).status,200);
    assert.equal((await request('/api/courses/course-teaching/instructors/socio-one.pdf',cookie)).status,403);
    const scopedPayload=await (await request('/api/state',cookie)).json();
    const scoped=scopedPayload.state || scopedPayload;
    const visible=scoped.courses.find(c=>c.id==='course-legacy-owners');
    assert.ok(visible,'Legacy owner can reach the certificate through member state');
    const ownerUi=vm.createContext({state:scoped,course:visible,member:scoped.members.find(m=>m.id===id),
      getCurrentAssociate:()=>scoped.associates.find(a=>a.id===associateId),escapeHtml:s=>String(s)});
    vm.runInContext(helpers,ownerUi);
    assert.match(vm.runInContext('renderInstructorCertificates(course,member)',ownerUi),new RegExp(associateId+'.pdf'));
  }
  const nomember=await login('nomember');
  assert.equal((await request('/api/courses/course-legacy-owners/instructors/legacy-email.pdf',nomember)).status,403);
  for (const cookie of [nomember,other]) {
    const scopedPayload=await (await request('/api/state',cookie)).json();
    assert.ok(!(scopedPayload.state || scopedPayload).courses.some(c=>c.id==='course-legacy-owners'));
  }
  for (const blocked of blockedCourses) {
    for (const cookie of [admin,member]) {
      const response=await request(`/api/courses/${blocked.id}/instructors/socio-one.pdf`,cookie);
      assert.equal(response.status,409,`${blocked.id}: ${await response.text()}`);
    }
  }
  const route=id=>`/api/courses/course-teaching/instructors/${id}.pdf`;
  for(const [cookie,id,status] of [[member,'socio-one',200],[member,'socio-two',403],[adminwith,'socio-two',200],[admin,'socio-one',200],[other,'socio-one',403],[instructor,'socio-one',403],[admin,'missing',403],['','socio-one',401]]){
    const r=await request(route(id),cookie);assert.equal(r.status,status,`${id}: ${await r.text()}`);
  }
  assert.equal((await request('/api/courses/%ZZ/instructors/socio-one.pdf',admin)).status,400);
  assert.equal((await request('/healthz')).status,200);
  const a=await request(route('socio-one'),admin),b=await request(route('socio-two'),admin);
  const pdfA=Buffer.from(await a.arrayBuffer()).toString('latin1'),pdfB=Buffer.from(await b.arrayBuffer()).toString('latin1');
  assert.match(pdfA,/Normal Docente Uno/);assert.doesNotMatch(pdfA,/Admin Docente Dos/);
  assert.match(pdfB,/Admin Docente Dos/);assert.doesNotMatch(pdfB,/Normal Docente Uno/);
  assert.match(pdfA,/CERTIFICADO DE INSTRUCTOR\/A/);assert.match(a.headers.get('cache-control'),/private.*no-store/);
  assert.equal((await request('/api/courses/course-legacy/instructors/socio-one.pdf',admin)).status,404);
  assert.equal((await request('/api/member/activity-certificate.pdf',member)).status,404);
  // New assignments require explicit, strictly boolean admin enablement; history survives disabling.
  async function currentState() {
    const result=await (await request('/api/state',admin)).json();
    return result.state || result;
  }
  const beforeEnable=await currentState();
  assert.equal(beforeEnable.associates.find(a=>a.id==='not-enabled').instructorEnabled,false);
  const normal=seed.associates.find(a=>a.id==='not-enabled');
  for (const method of ['POST','PATCH']) {
    assert.equal((await request('/api/associates/not-enabled',admin,{...normal,instructorEnabled:true},'PATCH')).status,200);
    const body=JSON.stringify({...course,id:'slow-course-'+method,instructorAssociateIds:['not-enabled']});
    let finishBody;
    const result=new Promise((resolve,reject)=>{
      const pending=httpRequest(base+(method==='POST'?'/api/courses':'/api/courses/course-legacy'),{
        method,headers:{Cookie:admin,'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}
      },res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});
      pending.on('error',reject);
      pending.write(body.slice(0,1));
      finishBody=()=>pending.end(body.slice(1));
    });
    await delay(100);
    assert.equal((await request('/api/associates/not-enabled',admin,{...normal,instructorEnabled:false},'PATCH')).status,200);
    finishBody();
    assert.equal(await result,400,'Eligibility is checked against current server state after receiving the body');
  }
  for (const cookie of [member,instructor]) {
    assert.equal((await request('/api/associates/not-enabled',cookie,{...normal,instructorEnabled:true},'PATCH')).status,403);
  }
  assert.equal((await request('/api/associates/not-enabled',admin,{...normal,instructorEnabled:'false'},'PATCH')).status,400);
  for (const id of ['not-enabled','inactive-enabled']) {
    assert.equal((await request('/api/courses',admin,{...course,id:`rejected-${id}`,instructorAssociateIds:[id]},'POST')).status,400);
    assert.equal((await request('/api/courses/course-legacy',admin,{instructorAssociateIds:[id]},'PATCH')).status,400);
  }
  const allIds=['socio-one','socio-two','enabled-three','enabled-four','enabled-five'];
  const manyCourses=[];
  for (let count=1;count<=allIds.length;count++) {
    const ids=allIds.slice(0,count);
    const response=await request('/api/courses',admin,{...course,id:`course-many-${count}`,title:`QA ${count} instructores`,instructorAssociateIds:ids},'POST');
    assert.equal(response.status,201);
    const added=(await response.json()).course;
    manyCourses.push(added.id);
    assert.deepEqual((await currentState()).courses.find(c=>c.id===added.id).instructorAssociateIds,ids);
  }
  assert.equal((await request('/api/courses/'+manyCourses[3],admin,{instructorAssociateIds:['socio-one','socio-one']},'PATCH')).status,400);
  assert.equal((await request('/api/courses/'+manyCourses[3],admin,{instructorAssociateIds:allIds.filter(id=>id!=='socio-two')},'PATCH')).status,200);
  assert.deepEqual((await currentState()).courses.find(c=>c.id===manyCourses[3]).instructorAssociateIds,['socio-one','enabled-three','enabled-four','enabled-five']);
  for (const id of allIds) assert.equal((await request(`/api/courses/${manyCourses[4]}/instructors/${id}.pdf`,admin)).status,200);
  assert.equal((await request('/api/associates/not-enabled',admin,{...normal,instructorEnabled:true},'PATCH')).status,200);
  assert.equal((await request('/api/associates/not-enabled',admin,{...normal,service:'Otro servicio'},'PATCH')).status,200);
  assert.equal((await currentState()).associates.find(a=>a.id==='not-enabled').instructorEnabled,true,'Omitted flag preserves current value');
  beforeEnable.courses=(await currentState()).courses;
  assert.equal((await request('/api/state',admin,beforeEnable,'POST')).status,200,'Old snapshot cannot disable newly enabled instructor');
  assert.equal((await currentState()).associates.find(a=>a.id==='not-enabled').instructorEnabled,true);
  const historyResponse=await request('/api/courses',admin,{...course,id:'course-flag-history',title:'QA historial habilitacion',instructorAssociateIds:['not-enabled']},'POST');
  assert.equal(historyResponse.status,201);
  const historyId=(await historyResponse.json()).course.id;
  const staleEnabled=await currentState();
  assert.equal((await request('/api/associates/not-enabled',admin,{...normal,instructorEnabled:false},'PATCH')).status,200);
  assert.equal((await request('/api/courses/'+historyId,admin,{title:'Historia conservada',instructorAssociateIds:['not-enabled']},'PATCH')).status,200);
  assert.equal((await request(`/api/courses/${historyId}/instructors/not-enabled.pdf`,admin)).status,200);
  assert.equal((await request('/api/courses',admin,{...course,id:'blocked-disabled',instructorAssociateIds:['not-enabled']},'POST')).status,400);
  staleEnabled.associates.find(a=>a.id==='unassigned').instructorEnabled=true;
  assert.equal((await request('/api/state',admin,staleEnabled,'POST')).status,200);
  let flags=await currentState();
  for (const id of ['not-enabled','unassigned']) assert.equal(flags.associates.find(a=>a.id===id).instructorEnabled,false,'State cannot grant eligibility or undo a disable');
  const selfState=await (await request('/api/state',member)).json();
  (selfState.state || selfState).associates.forEach(a=>a.instructorEnabled=false);
  assert.equal((await request('/api/state',member,selfState.state || selfState,'POST')).status,200);
  assert.equal((await currentState()).associates.find(a=>a.id==='socio-one').instructorEnabled,true);
  const disabledOwn=await currentState();
  assert.equal((await request('/api/associates/socio-one',admin,{...disabledOwn.associates.find(a=>a.id==='socio-one'),instructorEnabled:false},'PATCH')).status,200);
  const selfEnable=await (await request('/api/state',member)).json();
  (selfEnable.state || selfEnable).associates.forEach(a=>a.instructorEnabled=true);
  assert.equal((await request('/api/state',member,selfEnable.state || selfEnable,'POST')).status,200);
  assert.equal((await currentState()).associates.find(a=>a.id==='socio-one').instructorEnabled,false,'Member cannot self-enable');
  const proposal=await request('/api/associate-profile-requests',member,{
    firstName:'Normal',lastName:'Docente Uno',email:'member@example.test',note:'QA field isolation',instructorEnabled:true
  },'POST');
  assert.equal(proposal.status,200);
  assert.equal((await currentState()).associates.find(a=>a.id==='socio-one').instructorEnabled,false);
  assert.ok((await currentState()).associateProfileRequests.every(p=>!Object.hasOwn(p.proposedData || {},'instructorEnabled')));
  assert.equal((await request(route('socio-one'),member)).status,200,'Disabled instructor retains their own certificate');
  assert.equal((await request('/api/associates/socio-one',admin,{...disabledOwn.associates.find(a=>a.id==='socio-one'),instructorEnabled:true},'PATCH')).status,200);
  // Re-enabling restores new assignment eligibility without rewriting the historical course.
  assert.equal((await request('/api/associates/not-enabled',admin,{...normal,instructorEnabled:true},'PATCH')).status,200);
  assert.equal((await request('/api/courses',admin,{...course,id:'course-re-enabled',title:'QA rehabilitado',instructorAssociateIds:['not-enabled']},'POST')).status,201);
  assert.equal((await request('/api/associates/not-enabled',admin,{...normal,instructorEnabled:false},'PATCH')).status,200);
  const invalid=await request('/api/courses/course-teaching',admin,{instructorAssociateIds:['missing']},'PATCH');assert.equal(invalid.status,400);
  assert.equal((await request('/api/courses/course-teaching',admin,{instructorAssociateIds:['unnamed']},'PATCH')).status,400);
  assert.equal((await request('/api/courses/course-teaching',member,{instructorAssociateIds:['socio-one']},'PATCH')).status,403);
  const created=await request('/api/courses',admin,{...course,id:'course-created'},'POST');assert.equal(created.status,201,await created.text());
  const stateResponse=await request('/api/state',admin);const statePayload=await stateResponse.json();
  const state=statePayload.state || statePayload;
  const saved=state.courses.find(c=>c.id===course.id);
  assert.deepEqual(saved.instructorAssociateIds,['socio-one','socio-two']);assert.deepEqual(saved.diplomaReady,[]);assert.deepEqual(saved.enrolledIds,[]);
  assert.equal(buildActivityCertificate(state,'member').totalHours,0);
  assert.equal(buildActivityCertificate(state,'adminwith').activities.length,0);
  const spoof=structuredClone(state);spoof.courses.find(c=>c.id===course.id).instructorAssociateIds=['missing'];
  assert.equal((await request('/api/state',admin,spoof,'POST')).status,200);
  const ignoredIds=await (await request('/api/state',admin)).json();
  assert.deepEqual((ignoredIds.state || ignoredIds).courses.find(c=>c.id===course.id).instructorAssociateIds,['socio-one','socio-two'],
    'Whole-state instructor input is ignored; only the course API can change assignments');
  const refreshed=await request('/api/courses/course-teaching',admin,{instructorAssociateIds:['socio-two']},'PATCH');assert.equal(refreshed.status,200);
  assert.equal((await request(route('socio-one'),member)).status,404);
  assert.equal((await request(route('socio-two'),adminwith)).status,200);
  // Old whole-state saves must not resurrect an instructor removed by the course API.
  assert.equal((await request('/api/state',admin,state,'POST')).status,200);
  assert.equal((await request(route('socio-one'),member)).status,404);

  // Validate identity changes at the backend, including whole-state saves.
  const blank=await request('/api/associates/socio-two',admin,
    {...seed.associates[1],firstName:' ',lastName:''},'PATCH');
  assert.equal(blank.status,400);assert.match((await blank.json()).error,/nombre.*instructor/);
  let latestPayload=await (await request('/api/state',admin)).json();
  let identityState=latestPayload.state || latestPayload;
  assert.equal(identityState.associates.find(a=>a.id==='socio-two').firstName,'Admin');
  identityState.associates.find(a=>a.id==='socio-two').firstName='';
  identityState.associates.find(a=>a.id==='socio-two').lastName='';
  assert.equal((await request('/api/state',admin,identityState,'POST')).status,400);
  assert.equal((await request('/api/associates/unassigned',admin,
    {associateNumber:5,firstName:'',lastName:''},'PATCH')).status,200,'Unassigned editor rules are unchanged');
  assert.equal((await request('/api/associates/socio-two',admin,
    {...seed.associates[1],firstName:'Nuevo',lastName:'Nombre Valido'},'PATCH')).status,200);
  const renamed=await request(route('socio-two'),adminwith);
  assert.equal(renamed.status,200);
  assert.match(Buffer.from(await renamed.arrayBuffer()).toString('latin1'),/Nuevo Nombre Valido/);
  assert.equal((await request('/api/courses/course-historical-incomplete',admin,
    {title:'Cambio ajeno al instructor',instructorAssociateIds:['unnamed']},'PATCH')).status,200);
  latestPayload=await (await request('/api/state',admin)).json();
  assert.equal((await request('/api/state',admin,latestPayload.state || latestPayload,'POST')).status,200,
    'Historical incomplete assignment does not block unrelated saves');

  const deletionResponse=await request('/api/admin/associates/legacy-email',admin,{},'DELETE');
  assert.equal(deletionResponse.status,409);
  const deletionImpact=await deletionResponse.json();
  assert.equal(deletionImpact.requiresForce,true);assert.equal(deletionImpact.impacts.courses,1);
  assert.ok(deletionImpact.relatedCourses.some(c=>c.id==='course-legacy-owners'));
  assert.equal((await request('/api/courses/course-legacy-owners/instructors/legacy-email.pdf',admin)).status,200);
  assert.equal((await request('/api/admin/associates/legacy-email?force=true',admin,undefined,'DELETE')).status,200);
  latestPayload=await (await request('/api/state',admin)).json();
  assert.deepEqual((latestPayload.state || latestPayload).courses.find(c=>c.id==='course-legacy-owners').instructorAssociateIds,['legacy-name']);
  const staleSelection=latestPayload.state || latestPayload;
  staleSelection.courses.find(c=>c.id==='course-legacy-owners').instructorAssociateIds=['legacy-email','legacy-name'];
  assert.equal((await request('/api/state',admin,staleSelection,'POST')).status,200,
    'A deleted instructor ID in a stale course selection must not block unrelated saves');
  latestPayload=await (await request('/api/state',admin)).json();
  assert.deepEqual((latestPayload.state || latestPayload).courses.find(c=>c.id==='course-legacy-owners').instructorAssociateIds,['legacy-name']);

  // Isolated SMTP sink: exercise real delivery without external mail or production data.
  await stopServer();
  child=spawn(process.execPath,['server.js'],{env,stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);
  ready=false;for(let i=0;i<100;i++){try{if((await request('/healthz')).ok){ready=true;break;}}catch{}await delay(100);}
  assert.ok(ready,logs);
  const restartAdmin=await login('admin');
  const restoredPayload=await (await request('/api/state',restartAdmin)).json();
  const restored=restoredPayload.state || restoredPayload;
  assert.equal(restored.associates.find(a=>a.id==='not-enabled').instructorEnabled,false);
  assert.equal(restored.associates.find(a=>a.id==='socio-two').instructorEnabled,true);
  assert.deepEqual(restored.courses.find(c=>c.id===historyId).instructorAssociateIds,['not-enabled']);
  assert.equal((await request(`/api/courses/${historyId}/instructors/not-enabled.pdf`,restartAdmin)).status,200);
  assert.deepEqual(restored.courses.find(c=>c.id===manyCourses[4]).instructorAssociateIds,allIds,'Restart retains all five instructors');
  assert.equal((await request('/api/courses/'+historyId,restartAdmin,{instructorAssociateIds:[]},'PATCH')).status,200);
  assert.equal((await request(`/api/courses/${historyId}/instructors/not-enabled.pdf`,restartAdmin)).status,404,'Explicit removal revokes only that assignment');
  await stopServer();
  smtp=net.createServer(socket=>{
    socket.setEncoding('utf8');socket.write('220 localhost QA\r\n');
    let buffer='',data=false;
    socket.on('data',chunk=>{
      buffer+=chunk;
      while(buffer.includes('\r\n')){
        const end=buffer.indexOf('\r\n'),line=buffer.slice(0,end);buffer=buffer.slice(end+2);
        if(data){if(line==='.'){
          data=false;smtpMessages++;
          if(smtpMessages===1){releaseSmtp=()=>socket.write('250 queued QA\r\n');smtpDataReady();}
          else socket.write('250 queued QA\r\n');
        }continue;}
        if(line.startsWith('EHLO'))socket.write('250 localhost\r\n');
        else if(line==='DATA'){data=true;socket.write('354 send data\r\n');}
        else if(line==='QUIT')socket.end('221 bye\r\n');
        else socket.write('250 OK\r\n');
      }
    });
  });
  await new Promise(resolve=>smtp.listen(0,'127.0.0.1',resolve));
  const editorSeed=structuredClone(seed);
  editorSeed.settings.smtp={host:'127.0.0.1',port:smtp.address().port,secure:false,startTls:false,
    username:'',password:'',fromEmail:'qa@example.test'};
  editorSeed.settings.automation={autoRunOnSave:true,autoGenerateDiplomas:true,autoAdvanceCourseStatus:false,
    autoSendDiplomas:true,autoSendFeedbackReminders:false,autoSendFeeReminders:false};
  editorSeed.emailOutbox=[];
  Object.assign(editorSeed.courses.find(c=>c.id===course.id),{status:'Planificacion',endDate:'2999-01-01',
    diplomaReady:[],enrolledIds:['member'],attendance:{member:100},evaluations:{member:'Apto'},feedbackEnabled:false});
  const academicProgress={member:{lessonIds:[],blockIds:[],notes:'QA'.repeat(300000)}};
  editorSeed.courses.find(c=>c.id===course.id).contentProgress=academicProgress;
  writeFileSync(path.join(root,'editor-seed.json'),JSON.stringify(editorSeed));
  child=spawn(process.execPath,['server.js'],{env:{...env,IZ_DATA_DIR:path.join(root,'editor-data'),
    IZ_DEFAULT_STATE_PATH:path.join(root,'editor-seed.json')},stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);
  ready=false;for(let i=0;i<100;i++){try{if((await request('/healthz')).ok){ready=true;break;}}catch{}await delay(100);}
  assert.ok(ready,logs);
  const editorAdmin=await login('admin');
  assert.equal(smtpMessages,0,'Delivery is still pending before the editor action');

  // Execute the shipped editor branches, draft reader and persistence helper against the real API.
  const persistence = app.slice(app.indexOf('async function persistCourseEditorAndRender('),app.indexOf('async function persistAndRender('));
  const jsonAction = app.slice(app.indexOf('function setFormSaveStatus('),app.indexOf('function getAssociateDeletionImpactSummary('));
  const draftReader = app.slice(app.indexOf('function readCourseEditorDraft('),app.indexOf('function isAdminSession('));
  let sentRecord=null,actionIndex=0;
  for (const [action,selectedIds] of [
    ['generate-course-blueprint',allIds], ['apply-course-template',allIds],
    ['add-course-module',allIds], ['add-course-module',['missing']]
  ]) {
    const latest=await (await request('/api/state',editorAdmin)).json();
    const contextState=latest.state || latest;
    const draftCourse=contextState.courses.find(c=>c.id===course.id);
    if(!draftCourse.modules.length)draftCourse.modules.push({id:'qa-draft-module',title:'QA borrador',lessons:[]});
    const bankPrompt=`QA banco ${actionIndex}`;
    draftCourse.modules[0].lessons=[{id:'qa-draft-lesson',blocks:[{type:'evaluation',
      questions:[{id:'qa-source-question',prompt:bankPrompt,options:['A','B'],correctIndex:0}]}]}];
    const errors=[];const mutations=[];
    const form={dataset:{},elements:[],getAttribute:()=>null,setAttribute:()=>{},removeAttribute:()=>{},querySelector:()=>({})};
    const previousModules=contextState.courses.find(c=>c.id===course.id).modules.length;
    const context=vm.createContext({
      state:contextState,action,actionTarget:{dataset:{}},session:{name:'QA'},syncStatus:'',
      buildInstructorPickerModel, addInstructorSelection, removeInstructorSelection,
      isAdminSession:()=>true,getSelectedCourse:()=>context.state.courses.find(c=>c.id===course.id),
      document:{getElementById:id=>id==='courseEditForm' ? form :
        id==='editCourseInstructors' ? {dataset:{instructorIds:JSON.stringify(selectedIds)}} : null},
      normalizeCourse:c=>c,hasCourseModuleEditors:()=>false,hasCourseResourceEditors:()=>false,
      readCourseSharedTestSelection:()=>({}),readCourseTrimmedValue:(_,value)=>value,
      readCourseFieldValue:(id,value)=>id==='editCourseStatus'?'Cerrado':value,readCourseNumberValue:(_,value)=>value,
      buildCourseBlueprint:()=>({modules:[{id:'qa-module',title:action,lessons:[]}]}),applyBlueprintToCourse:(c,b)=>Object.assign(c,b),
      inferCourseTemplate:()=> 'operativo',getCourseTemplateLabel:v=>v,addActivity:()=>{},
      normalizeCourseModule:m=>m,courseCurriculumMode:'',render:()=>{},
      normalizeCourseQuestion:q=>q,getCourseQuestionFingerprint:q=>q.prompt,
      showToast:(message,kind)=>{if(kind==='error')errors.push(message);},
      readJsonResponse:response=>response.json(),
      fetch:(url,options)=>{mutations.push([url,options.method]);return request(url,editorAdmin,JSON.parse(options.body),options.method);},
      refreshState:async()=>{const response=await request('/api/state',editorAdmin);
        const payload=await response.json();context.state=payload.state || payload;},
      applySessionToState:()=>{},syncAssociateSelectionTargets:()=>{},
      persistAndRender:async()=>{assert.fail('Must never POST a stale whole-state snapshot after PATCH');}
    });
    const from=app.indexOf(`  if (action === "${action}" && isAdminSession()) {`);
    const to=app.indexOf('\n  if (',from+1);
    assert.ok(from>=0 && to>from,action);
    const bankFrom=app.indexOf('  if (action === "save-question-to-bank" && isAdminSession()) {');
    const bankTo=app.indexOf('\n  if (',bankFrom+1);
    vm.runInContext(helpers+draftReader+jsonAction+persistence+`
      globalThis.saveBankDraft = async () => { ${app.slice(bankFrom,bankTo)} };
      globalThis.runAction = async () => { ${app.slice(from,to)} };`,context);
    context.action='save-question-to-bank';
    context.actionTarget={dataset:{moduleIndex:'0',lessonIndex:'0',blockIndex:'0',questionId:'qa-source-question'}};
    await context.saveBankDraft();
    assert.ok(context.getSelectedCourse().questionBank.some(q=>q.prompt===bankPrompt));
    assert.equal(mutations.length,0,'Save-to-bank is still only a local draft');
    context.action=action;context.actionTarget={dataset:{}};
    if(actionIndex===0){
      const actionPending=context.runAction();
      try {
        await firstSmtpData;
        const duringPayload=await (await request('/api/state',editorAdmin)).json();
        const during=duringPayload.state || duringPayload;
        const concurrent=await request('/api/automation/run',editorAdmin,{},'POST');
        assert.equal(concurrent.status,200);
        assert.equal(smtpMessages,1,'Concurrent automation must not send the pending diploma twice');
        assert.equal(during.courses.find(c=>c.id===course.id).status,'Planificacion',
          'Uncommitted eligibility must not be exposed while SMTP is pending');
        const fifth=during.associates.find(a=>a.id==='enabled-five');
        const conflict=await request('/api/associates/enabled-five',editorAdmin,{...fifth,instructorEnabled:false},'PATCH');
        assert.equal(conflict.status,409,'Cannot revoke eligibility until the pending assignment completes');
        assert.match((await conflict.json()).error,/instructor.*guardando/);
        assert.equal((await request('/api/associates/enabled-five',editorAdmin,{...fifth,firstName:'',lastName:''},'PATCH')).status,409);
        assert.equal((await request('/api/admin/associates/enabled-five?force=true',editorAdmin,undefined,'DELETE')).status,409);
      } finally {releaseSmtp?.();await actionPending;}
      const current=await (await request('/api/state',editorAdmin)).json();
      const fifth=(current.state || current).associates.find(a=>a.id==='enabled-five');
      assert.equal((await request('/api/associates/enabled-five',editorAdmin,{...fifth,instructorEnabled:false},'PATCH')).status,200,
        'Reservation is released after the course save');
    } else await context.runAction();
    assert.deepEqual(mutations,[[`/api/courses/${course.id}`,'PATCH']],'One mutation/automation per editor action');
    if(selectedIds.includes('missing')){
      assert.match(errors[0],/socio/);
      assert.deepEqual(Array.from(context.getSelectedCourse().instructorAssociateIds),selectedIds,'Keep failed draft');
    }else{
      assert.equal(errors.length,0,errors.join('\n'));
      const persisted=await (await request('/api/state',editorAdmin)).json();
      const savedState=persisted.state || persisted;
      const savedCourse=savedState.courses.find(c=>c.id===course.id);
      assert.deepEqual(savedCourse.contentProgress,academicProgress,'Server-owned academic data is untouched');
      assert.ok(savedCourse.questionBank.some(q=>q.prompt===bankPrompt),'Edited question bank survives subaction/refetch');
      assert.deepEqual(savedCourse.instructorAssociateIds,selectedIds,action);
      assert.equal(savedCourse.modules.length,action==='add-course-module'?previousModules+1:1,'Subaction content is persisted');
      assert.equal(savedState.associates.find(a=>a.id==='enabled-five').instructorEnabled,false,
        'Concurrent disable is retained without invalidating an already committed assignment');
      assert.equal(savedState.emailOutbox.length,1,'Delivery record survives the editor save');
      assert.equal(savedState.emailOutbox[0].status,'sent');
      assert.equal(savedState.emailOutbox[0].attemptCount,1);
      if(sentRecord)assert.deepEqual(savedState.emailOutbox[0],sentRecord,'Existing delivery is not lost or rolled back');
      sentRecord=savedState.emailOutbox[0];
      assert.equal(savedState.automationMeta.lastReason,'Actualizacion de curso');
      assert.equal(savedState.automationMeta.lastSummary.sentDiplomas,actionIndex===0?1:0);
      assert.equal(smtpMessages,1,'The pending diploma was sent only once');
      assert.deepEqual(context.state.emailOutbox,savedState.emailOutbox,'Refreshed UI has current outbox');
      actionIndex++;
      assert.deepEqual(Array.from(context.getSelectedCourse().instructorAssociateIds),selectedIds,'Selection survives response/re-render');
    }
  }
  // Creation reserves new assignments without publishing the course before automation finishes.
  await stopServer();
  smtpMessages=0;
  firstSmtpData=new Promise(resolve=>{smtpDataReady=resolve;});
  const createSeed=structuredClone(editorSeed);
  Object.assign(createSeed.courses.find(c=>c.id===course.id),{status:'Cerrado',endDate:'2020-01-01',diplomaReady:['member']});
  writeFileSync(path.join(root,'create-seed.json'),JSON.stringify(createSeed));
  child=spawn(process.execPath,['server.js'],{env:{...env,IZ_DATA_DIR:path.join(root,'create-data'),
    IZ_DEFAULT_STATE_PATH:path.join(root,'create-seed.json')},stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);
  ready=false;for(let i=0;i<100;i++){try{if((await request('/healthz')).ok){ready=true;break;}}catch{}await delay(100);}
  assert.ok(ready,logs);
  const createAdmin=await login('admin');
  const creation=request('/api/courses',createAdmin,{...course,id:'smtp-create',title:'QA creation boundary',instructorAssociateIds:allIds},'POST');
  let createdDuring;
  try {
    await firstSmtpData;
    const payload=await (await request('/api/state',createAdmin)).json();
    const during=payload.state || payload;
    createdDuring=during.courses.find(c=>c.title==='QA creation boundary');
    assert.equal(createdDuring,undefined,'POST is not visible before automation finishes');
    const fifth=during.associates.find(a=>a.id==='enabled-five');
    assert.equal((await request('/api/associates/enabled-five',createAdmin,{...fifth,instructorEnabled:false},'PATCH')).status,409);
  } finally {releaseSmtp?.();}
  assert.equal((await creation).status,201);
  const afterPayload=await (await request('/api/state',createAdmin)).json();
  const after=afterPayload.state || afterPayload;
  createdDuring=after.courses.find(c=>c.title==='QA creation boundary');
  assert.equal((await request('/api/associates/enabled-five',createAdmin,{...after.associates.find(a=>a.id==='enabled-five'),instructorEnabled:false},'PATCH')).status,200);
  assert.deepEqual(after.courses.find(c=>c.id===createdDuring.id).instructorAssociateIds,allIds);
  assert.equal(after.emailOutbox.length,1);assert.equal(after.emailOutbox[0].status,'sent');assert.equal(smtpMessages,1);
  assert.equal((await request(`/api/courses/${createdDuring.id}/instructors/enabled-five.pdf`,createAdmin)).status,200);
  assert.equal((await request('/api/courses',createAdmin,{...course,id:'disabled-after-smtp',title:'Blocked new assignment',instructorAssociateIds:['enabled-five']},'POST')).status,400);
  console.log('Instructor certificates PASS: completed-course gate, legacy UI/permissions, name invariants, deletion impact, single editor mutation/SMTP delivery, retained outbox, stale-state protection, reserved POST/PATCH eligibility during SMTP, no concurrent duplicate and learner hours unchanged.');
} catch(error){console.error(logs);throw error;} finally {await stopServer();if(smtp)await new Promise(resolve=>smtp.close(resolve));rmSync(root,{recursive:true,force:true});}
