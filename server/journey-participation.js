const EnrollmentTime = require('../public/enrollment-time');
const DEFAULT_LABELS = ['Accidentes de tráfico', 'Rescate vertical', 'RIT', 'Incendios Estructurales', 'Riesgos Tecnológicos', 'Rescate en ríos', 'GOM'];
const normalize = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const typeId = label => 'journey-' + normalize(label).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const defaults = DEFAULT_LABELS.map(label => ({ id: typeId(label), label }));
function classifyJourney(source = {}, fallback = {}) {
  if (!Object.hasOwn(source, 'journeyTypeId')) return { journeyTypeId: fallback.journeyTypeId || '', journeyTypeLabel: fallback.journeyTypeLabel || '' };
  const id = String(source.journeyTypeId || '').trim();
  if (!id) return { journeyTypeId: '', journeyTypeLabel: '' };
  const known = defaults.find(type => type.id === id);
  const label = known?.label || String(source.journeyTypeLabel || '').trim().replace(/\s+/g, ' ');
  if (!label || label.length > 80 || !/^journey-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || typeId(label) !== id) throw Object.assign(new Error('Elige un tipo de jornada o indica un nombre válido de hasta 80 caracteres'), {statusCode:400});
  return { journeyTypeId: id, journeyTypeLabel: label };
}
function isJourney(course) {
  return Boolean(course.journeyTypeId) || normalize(course.type) === 'jornada intensiva' || normalize(course.contentTemplate) === 'intensivo';
}
function knownTypes(state) {
  const types = new Map(defaults.map(type => [type.id, type]));
  for (const course of state.courses || []) {
    try { const value = classifyJourney(course); if (value.journeyTypeId && !types.has(value.journeyTypeId)) types.set(value.journeyTypeId, {id:value.journeyTypeId,label:value.journeyTypeLabel}); } catch {}
  }
  return [...types.values()];
}
function performed(course, today) {
  return Boolean(course.id) && isJourney(course) && /^\d{4}-\d{2}-\d{2}$/.test(course.endDate || '') && Number.isFinite(Date.parse(course.endDate)) && new Date(course.endDate).toISOString().slice(0,10) === course.endDate && course.endDate <= today;
}
function validatedParticipants(course) {
  const waiting = new Set(course.waitingIds || []);
  return [...new Set(course.diplomaReady || [])].filter(id => {
    if (waiting.has(id)) return false;
    if (Object.hasOwn(course.attendance || {}, id) && Number(course.attendance[id]) < 75) return false;
    if (Object.hasOwn(course.evaluations || {}, id) && course.evaluations[id] !== 'Apto') return false;
    const latest = (course.enrollmentSubmissions || []).filter(s => s.memberId === id).at(-1);
    return !latest || !['rejected','cancelled'].includes(latest.status);
  });
}
function coursePeople(course) {
  return new Set([...(course.enrolledIds || []), ...(course.waitingIds || []), ...(course.diplomaReady || []), ...(course.enrollmentSubmissions || []).filter(s => s.status !== 'rejected' && s.status !== 'cancelled').map(s => s.memberId)].filter(Boolean));
}
function identityIndex(state) {
  const associates = state.associates || [], accounts = state.accounts || [];
  const people = new Map(), members = new Map();
  for (const associate of associates) {
    if (associate.status === 'Baja') continue;
    people.set('associate:'+associate.id,{key:'associate:'+associate.id,associateId:associate.id,memberIds:[],name:[associate.firstName,associate.lastName].filter(Boolean).join(' ').trim(),associateNumber:associate.associateNumber || null});
  }
  for (const member of state.members || []) {
    const account = accounts.find(a => a.memberId === member.id);
    const linked = associates.filter(a => a.linkedMemberId === member.id);
    const associate = associates.find(a => a.id === member.associateId) || associates.find(a => account?.associateId && a.id === account.associateId) || (linked.length === 1 ? linked[0] : null);
    const key = associate ? 'associate:'+associate.id : 'member:'+member.id;
    const person = people.get(key) || {key,associateId:associate?.id || '',memberIds:[],name:member.name || '',associateNumber:associate?.associateNumber || null};
    if (!person.name) person.name = member.name || '';
    if (!person.memberIds.includes(member.id)) person.memberIds.push(member.id);
    people.set(key,person);members.set(member.id,key);
  }
  return {people,members};
}
function buildJourneyReport(state, {type='',courseId='',mode='ranking',query='',order='asc',instructor=false,today=EnrollmentTime.calendarDateInMadrid(new Date())}={}) {
  const types = knownTypes(state), target = courseId ? (state.courses || []).find(c => c.id === courseId) : null;
  if (courseId && !target) throw Object.assign(new Error('Jornada no encontrada'),{statusCode:404});
  if (target && (!isJourney(target) || !target.journeyTypeId)) throw Object.assign(new Error('Selecciona el tipo de jornada en su ficha para consultar su historial'),{statusCode:400});
  const selectedType = target ? target.journeyTypeId : type;
  if (selectedType && !types.some(t => t.id === selectedType)) throw Object.assign(new Error('Tipo de jornada no válido'),{statusCode:400});
  const {people,members}=identityIndex(state), allowed=target ? coursePeople(target) : null;
  const allowedKeys = allowed ? new Set([...allowed].map(id=>members.get(id)).filter(Boolean)) : null;
  const rows = new Map([...people.values()].filter(p=>!allowedKeys || allowedKeys.has(p.key)).map(p=>[p.key,{memberId:p.memberIds[0] || '',name:p.name,associateNumber:p.associateNumber,journeyCount:0,lastDate:'',details:[],_seen:new Set()}]));
  const seenCourses = new Set();
  for (const course of state.courses || []) {
    if (seenCourses.has(course.id) || !performed(course,today) || (selectedType && course.journeyTypeId !== selectedType) || (target && course.id===target.id)) continue;
    seenCourses.add(course.id);
    for (const id of validatedParticipants(course)) {
      const row = rows.get(members.get(id));
      if (!row || row._seen.has(course.id)) continue;
      row._seen.add(course.id);row.journeyCount++;row.lastDate = row.lastDate > course.endDate ? row.lastDate : course.endDate;
      if (!instructor) row.details.push({courseId:course.id,title:course.title,date:course.endDate,typeLabel:course.journeyTypeLabel || 'Sin clasificar'});
    }
  }
  let result=[...rows.values()];
  if (mode==='attendees') {
    if (!target) throw Object.assign(new Error('Selecciona una edición para exportar sus asistentes'),{statusCode:400});
    const completed = new Set(performed(target,today) ? validatedParticipants(target).map(id=>members.get(id)) : []);
    result=[...rows.entries()].filter(([key])=>completed.has(key)).map(([,row])=>row);
  }
  const search=normalize(query);
  result=result.filter(row=>!search || normalize(row.name+' '+(row.associateNumber || '')).includes(search));
  result.sort((a,b)=>(order==='desc' ? b.journeyCount-a.journeyCount : a.journeyCount-b.journeyCount) || a.name.localeCompare(b.name,'es') || a.memberId.localeCompare(b.memberId));
  result=result.map(({_seen,...row})=>row);
  return {ok:true,types:instructor?types.filter(t=>t.id===selectedType):types,selectedType,editions:(instructor?[target]:(state.courses || []).filter(c=>isJourney(c)&&c.journeyTypeId&&(!selectedType||c.journeyTypeId===selectedType))).filter(Boolean).map(c=>({id:c.id,title:c.title,date:c.startDate})),unclassifiedCourses:instructor?[]:(state.courses || []).filter(c=>isJourney(c)&&!c.journeyTypeId).map(c=>({id:c.id,title:c.title})),course:target?{id:target.id,title:target.title,startDate:target.startDate,endDate:target.endDate}:null,mode,rows:result,unclassifiedCount:instructor?0:(state.courses || []).filter(c=>isJourney(c)&&!c.journeyTypeId).length};
}
function reportCsv(report) {
  const safe=value=>{let s=String(value??'');if (/^[\s]*[=+\-@]/.test(s)) s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  const header=['Nombre','Número de socio','Tipo de jornada',report.course?'Otras participaciones':'Participaciones realizadas','Última participación','Detalle de participaciones','Edición consultada','Fecha de edición'];
  return '\ufeff'+[header,...report.rows.map(row=>[row.name,row.associateNumber || '',report.types.find(t=>t.id===report.selectedType)?.label || 'Todas',row.journeyCount,row.lastDate,row.details.map(d=>d.date+' · '+d.title).join(' | '),report.course?.title || '',report.course?.startDate || ''])].map(row=>row.map(safe).join(';')).join('\r\n');
}
function createJourneyReportHandler({readState,requireAuthenticatedAccount,sendJson,sendJsonError}) {
  return async function handleJourneys(req,res,url) {
    if (!['/api/reports/journey-participation','/api/reports/journey-participation.csv'].includes(url.pathname) || req.method!=='GET') return false;
    res.setHeader('Cache-Control','private, no-store');
    try {
      const state=readState(),account=requireAuthenticatedAccount(req,res,state);if(!account)return true;
      const courseId=url.searchParams.get('courseId') || '',course=(state.courses || []).find(c=>c.id===courseId);
      if (account.role!=='admin' && !(account.role==='instructor' && courseId && account.associateId && (course?.instructorAssociateIds || []).includes(account.associateId))) {sendJson(res,403,{ok:false,error:'No tienes permiso para consultar este historial'});return true;}
      const report=buildJourneyReport(state,{courseId,type:url.searchParams.get('type') || '',mode:url.searchParams.get('mode')==='attendees'?'attendees':'ranking',query:(url.searchParams.get('q') || '').slice(0,120),order:url.searchParams.get('order')==='desc'?'desc':'asc',instructor:account.role!=='admin'});
      if (url.pathname.endsWith('.csv')) {res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="'+(report.mode==='attendees'?'asistentes-jornada':'historial-jornadas')+'.csv"'});res.end(reportCsv(report));}
      else sendJson(res,200,report);
    } catch(error){sendJsonError(res,error,'No se pudo consultar el historial de jornadas');}
    return true;
  };
}
module.exports={typeId,defaults,classifyJourney,isJourney,buildJourneyReport,reportCsv,createJourneyReportHandler};
