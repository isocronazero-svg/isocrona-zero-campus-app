import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import path from 'node:path';
import net from 'node:net';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const {typeId,defaults,classifyJourney,buildJourneyReport,reportCsv}=require('../server/journey-participation');
const {createOnboardingStateAccess}=require('../server/onboarding-state');
const traffic=defaults[0],vertical=defaults[1];
const person=(id,name,number)=>({id:'a-'+id,firstName:name,lastName:'QA',associateNumber:number,status:'Activa',linkedMemberId:id});
const fixture={settings:{},accounts:[],members:[{id:'zero',name:'=Cero QA'},{id:'five',name:'Cinco',associateId:'a-five'},{id:'alias',name:'Cinco antiguo',associateId:'a-five'},{id:'one',name:'Uno',associateId:'a-one'},{id:'teacher',name:'Docente',associateId:'a-teacher'},{id:'unrelated',name:'Privado no participante'}],associates:[person('five','Cinco',5),person('one','Uno',1),person('teacher','Docente',2)],courses:[]};
const course=(id,type=traffic,ids=['five'],extra={})=>({id,title:'Edición '+id,type:'Jornada intensiva',journeyTypeId:type.id,journeyTypeLabel:type.label,courseClass:'practico',status:'Cerrado',startDate:'2000-01-01',endDate:'2000-01-01',hours:1,capacity:10,enrolledIds:ids,waitingIds:[],diplomaReady:ids,attendance:Object.fromEntries(ids.map(id=>[id,100])),evaluations:Object.fromEntries(ids.map(id=>[id,'Apto'])),...extra});
for(let i=0;i<5;i++)fixture.courses.push(course('course-traffic-'+i));
fixture.courses[0].diplomaReady.push('five','alias');
fixture.courses.push(structuredClone(fixture.courses[0]));
for(let i=0;i<7;i++)fixture.courses.push(course('course-vertical-'+i,vertical));
fixture.courses.push(course('course-one',traffic,['one']));
fixture.courses.push(course('course-normal',traffic,['one'],{journeyTypeId:'',journeyTypeLabel:'',type:'Curso',contentTemplate:'operativo'}),course('course-waiting',traffic,['one'],{waitingIds:['one']}),course('course-absent',traffic,['one'],{attendance:{one:0}}),course('course-not-passed',traffic,['one'],{evaluations:{one:'No apto'}}),course('course-rejected',traffic,['one'],{enrollmentSubmissions:[{memberId:'one',status:'rejected'}]}),course('course-pending',traffic,['one'],{diplomaReady:[]}),course('course-future',traffic,['one'],{endDate:'2999-01-01'}),course('course-invalid-date',traffic,['one'],{endDate:'2000-02-31'}),course('course-teacher-only',traffic,[],{instructorAssociateIds:['a-teacher']}));
const target=course('course-target',traffic,['zero','five','one','teacher'],{status:'Inscripcion abierta',endDate:'2999-01-01',diplomaReady:[],instructorAssociateIds:['a-teacher']});fixture.courses.push(target);
const before=JSON.stringify(fixture);
const global=buildJourneyReport(fixture,{type:traffic.id});
assert.equal(global.rows.find(r=>r.memberId==='five').journeyCount,5);
assert.equal(global.rows.find(r=>r.memberId==='one').journeyCount,1);
assert.equal(global.rows.find(r=>r.memberId==='zero').journeyCount,0);
assert.equal(global.rows.find(r=>r.memberId==='teacher').journeyCount,0);
assert.equal(buildJourneyReport(fixture,{type:vertical.id}).rows.find(r=>r.memberId==='five').journeyCount,7);
assert.equal(buildJourneyReport(fixture,{type:vertical.id}).rows.find(r=>r.memberId==='one').journeyCount,0);
assert.equal(global.rows.filter(r=>r.associateNumber===5).length,1,'Alias member IDs for the same associate dedupe');
assert.equal(buildJourneyReport(fixture,{type:traffic.id,order:'desc'}).rows[0].journeyCount,5);
assert.equal(buildJourneyReport(fixture,{type:traffic.id,query:'cinco'}).rows.length,1);
assert.equal(buildJourneyReport(fixture,{type:traffic.id,query:'5'}).rows[0].associateNumber,5);
assert.equal(JSON.stringify(fixture),before,'A report must never mutate academic state');
const scoped=buildJourneyReport(fixture,{courseId:target.id,instructor:true});assert.equal(scoped.rows.length,4);assert.ok(scoped.rows.every(r=>r.memberId!=='unrelated'));assert.ok(scoped.rows.every(r=>r.details.length===0));assert.equal(scoped.unclassifiedCourses.length,0);
const historical=buildJourneyReport(fixture,{courseId:'course-traffic-0',mode:'attendees'});assert.equal(historical.rows.length,1);assert.equal(historical.rows[0].journeyCount,4);
assert.equal(buildJourneyReport(fixture,{courseId:target.id,mode:'attendees'}).rows.length,0);
const csv=reportCsv(global);assert.ok(csv.startsWith('\ufeff'));assert.match(csv,/"'\=Cero QA"/);for(const row of global.rows)assert.ok(csv.includes('"'+row.journeyCount+'"'));
assert.throws(()=>classifyJourney({journeyTypeId:'fake',journeyTypeLabel:'Bad'}));
assert.equal(classifyJourney({journeyTypeId:traffic.id,journeyTypeLabel:'Otro nombre'}).journeyTypeLabel,traffic.label);
const customLabel='Rescate en espacios confinados';const custom={journeyTypeId:typeId(customLabel),journeyTypeLabel:customLabel};assert.deepEqual(classifyJourney(custom),custom);
assert.deepEqual(classifyJourney({},custom),custom);
const renamed=structuredClone(fixture);renamed.courses[0].title='Otro título, mismo tipo';assert.equal(buildJourneyReport(renamed,{type:traffic.id}).rows.find(r=>r.memberId==='five').journeyCount,5);
const unclassified=structuredClone(fixture);unclassified.courses.push(course('course-unclassified',traffic,['one'],{journeyTypeId:'',journeyTypeLabel:''}));assert.equal(buildJourneyReport(unclassified,{type:traffic.id}).rows.find(r=>r.memberId==='one').journeyCount,1);assert.equal(buildJourneyReport(unclassified).unclassifiedCount,1);
// Asynchronous writers and older snapshots cannot roll back a later classification.
let saved={courses:[{id:'qa',...custom}],associates:[]};const access=createOnboardingStateAccess({readState:()=>structuredClone(saved),writeState:s=>{saved=structuredClone(s);}});const slow=access.readState();const current=access.readState();current.courses[0]={id:'qa',journeyTypeId:traffic.id,journeyTypeLabel:traffic.label};access.writeState(current);slow.courses[0].summary='Unrelated';access.writeState(slow);assert.equal(saved.courses[0].journeyTypeId,traffic.id);access.writeState({courses:[{id:'qa'}],associates:[]});assert.equal(saved.courses[0].journeyTypeId,traffic.id);
const app=readFileSync('public/app.js','utf8');const extract=name=>{const a=app.indexOf('function '+name+'(');const b=app.indexOf('\nfunction ',a+1);assert.ok(a>=0&&b>a);return app.slice(a,b);};
const clientType=vm.runInNewContext(extract('journeyTypeIdForLabel')+'\njourneyTypeIdForLabel;',{});for(const type of defaults)assert.equal(clientType(type.label),type.id);
for(const role of ['member','admin','instructor']){const html=vm.runInNewContext(extract('renderJourneyHistory')+'\nrenderJourneyHistory();',{session:{role,accountId:'qa'},journeyReport:{...scoped,accountId:'qa'},journeyReportFilters:{courseId:target.id,type:traffic.id,q:'',order:'asc'},isAdminView:()=>role==='admin',escapeHtml:v=>String(v??'').replaceAll('"','&quot;').replaceAll('<','&lt;'),formatDate:String,URLSearchParams});if(role==='member')assert.equal(html,'');else{assert.match(html,/Asistentes validados/);assert.match(html,/Historial de jornadas/);if(role==='instructor')assert.doesNotMatch(html,/id="journeyHistoryType"/);}}
console.log('Journey report unit checks passed: 0/1/5/7 by type, valid attendance, aliases, scoped privacy, CSV and concurrent classification.');
// Exercise the real authenticated routes, including CSV parity and stored classification.
const root=mkdtempSync(path.join(tmpdir(),'iz-journey-'));const seed=JSON.parse(readFileSync('data/default-state.json','utf8'));for(const key of Object.keys(seed))if(Array.isArray(seed[key]))seed[key]=[];Object.assign(seed,structuredClone(fixture));seed.settings.automation={autoRunOnSave:false,autoSendDiplomas:false};seed.settings.agent={enabled:false};const password=randomUUID();seed.accounts=[{id:'admin',name:'Admin QA',email:'admin@example.test',role:'admin',password},{id:'teacher',name:'Instructor QA',email:'teacher@example.test',role:'instructor',memberId:'teacher',associateId:'a-teacher',password},{id:'other',name:'Otro QA',email:'other@example.test',role:'instructor',memberId:'unrelated',associateId:'a-other',password},{id:'member',name:'Socio QA',email:'member@example.test',role:'member',memberId:'zero',password}];writeFileSync(path.join(root,'seed.json'),JSON.stringify(seed));
let server,log='';
try {
 const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));const base='http://127.0.0.1:'+port;
 server=spawn(process.execPath,['server.js'],{env:{PATH:process.env.PATH,NODE_PATH:process.env.NODE_PATH||path.resolve('node_modules'),NODE_ENV:'test',PORT:String(port),IZ_BASE_URL:base,IZ_DATA_DIR:path.join(root,'data'),IZ_DEFAULT_STATE_PATH:path.join(root,'seed.json'),IZ_EMAIL_ENABLED:'false',IZ_EMAIL_PROVIDER:'disabled',AUTOMATION_INTERVAL_MS:'86400000'},stdio:['ignore','pipe','pipe']});server.stdout.on('data',c=>log+=c);server.stderr.on('data',c=>log+=c);
 for(let i=0;i<80;i++){try{if((await fetch(base+'/healthz')).ok)break;}catch{}if(i===79)throw Error(log);await new Promise(r=>setTimeout(r,100));}
 async function login(id){const r=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:id+'@example.test',password})});assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];}
 const admin=await login('admin'),teacher=await login('teacher'),other=await login('other'),member=await login('member');
 const request=(url,cookie,method='GET',body)=>fetch(base+url,{method,headers:{...(cookie?{Cookie:cookie}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const route='/api/reports/journey-participation';assert.equal((await request(route)).status,401);assert.equal((await request(route,member)).status,403);assert.equal((await request(route,teacher)).status,403);assert.equal((await request(route+'?courseId='+target.id,other)).status,403);
 const own=await request(route+'?courseId='+target.id,teacher);assert.equal(own.status,200);const ownData=await own.json();assert.ok(ownData.rows.every(r=>r.memberId!=='unrelated'));assert.ok(ownData.rows.every(r=>r.details.length===0));
 const json=await request(route+'?type='+traffic.id,admin);assert.equal(json.status,200);const body=await json.json();const download=await request(route+'.csv?type='+traffic.id,admin);assert.equal(download.status,200);assert.match(download.headers.get('cache-control'),/private.*no-store/);assert.equal(await download.text(),reportCsv(body).replace(/^\ufeff/,''));
 assert.equal((await request(route+'.csv?courseId='+target.id,member)).status,403);assert.equal((await request(route+'.csv?courseId='+target.id,teacher)).status,200);
 const created=await request('/api/courses',admin,'POST',{course:{...course('course-custom',traffic,[]),...custom}});assert.equal(created.status,201);assert.deepEqual(classifyJourney((await created.json()).course),custom);
 const changed=await request('/api/courses/course-custom',admin,'PATCH',{title:'Título cambiado'});assert.equal(changed.status,200);assert.equal((await changed.json()).course.journeyTypeId,custom.journeyTypeId);
 assert.equal((await request('/api/courses/course-custom',admin,'PATCH',{journeyTypeId:'malformed',journeyTypeLabel:'No'})).status,400);
 assert.equal((await request('/api/courses/course-custom',teacher,'PATCH',{journeyTypeId:traffic.id})).status,403);
 const legacy=(await (await request('/api/state',admin)).json());for(const c of legacy.courses){delete c.journeyTypeId;delete c.journeyTypeLabel;}assert.equal((await request('/api/state',admin,'POST',legacy)).status,200);const retained=(await (await request('/api/state',admin)).json()).courses.find(c=>c.id==='course-custom');assert.equal(retained.journeyTypeId,custom.journeyTypeId);
 console.log('Journey report HTTP checks passed: admin/global, assigned instructor/context, member/foreign denial, JSON/CSV parity, custom types and legacy snapshot preservation.');
} finally {if(server)server.kill();rmSync(root,{recursive:true,force:true});}
