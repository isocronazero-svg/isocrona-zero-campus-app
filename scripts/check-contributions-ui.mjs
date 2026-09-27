import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const bank=readFileSync(new URL('../public/question-bank.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('void boot();','');
const makeNode=()=>({innerHTML:'',textContent:'',disabled:false,dataset:{},children:[],elements:[],listeners:{},classList:{add:()=>{}},addEventListener(event,handler){this.listeners[event]=handler;},replaceChildren(...children){this.children=children;},append(child){this.children.push(child);},reset(){this.wasReset=true;}});
for(const realAdmin of [false,true]){
  const nodes=new Map(),calls=[];const get=id=>{if(!nodes.has(id))nodes.set(id,makeNode());return nodes.get(id);};
  const ctx={URLSearchParams,location:{search:'?embedded=1&mode=member'},AbortSignal,document:{body:makeNode(),getElementById:get,createElement:()=>makeNode()},FormData:class {get(key){return ({prompt:'Mi aportación',part:'IVASPE',category:'Tema',correctIndex:'1',difficulty:'media',explanation:'Explicación',option0:'A',option1:'B',option2:'C',option3:'D'})[key];}},fetch:async(path,options)=>{calls.push({path,body:options.body&&JSON.parse(options.body)});return {ok:true,json:async()=>path==='/api/test-zone/import'?{ok:true,admin:realAdmin,template:'prompt',blocks:[]}:options.method==='POST'?{ok:true,queued:1}:{ok:true,total:1,page:0,items:[{id:'c',status:'pending',revision:1,createdAt:'2026-09-26',question:{prompt:'<img onerror="bad">',part:'IVASPE',category:'Tema'}}]}};}};
  vm.createContext(ctx);vm.runInContext(bank,ctx);
  await vm.runInContext('refreshBank();',ctx);await vm.runInContext('refreshContributions();',ctx);
  assert.equal(get('manual-submit').textContent,'Enviar a revisión','Admin in member mode must see the contribution path');
  assert.equal(get('bundled-section').hidden,true);
  assert.ok(!get('contributions').innerHTML.includes('data-review-form'));
  assert.ok(!get('contributions').innerHTML.includes('<img'));
  await get('manual-form').listeners.submit({preventDefault(){},currentTarget:get('manual-form')});
  const sent=calls.find(c=>c.path==='/api/test-zone/contributions'&&c.body);
  assert.equal(sent.body.submitForReview,true);assert.equal(sent.body.question.options.length,4);
  assert.ok(get('manual-status').textContent.includes('pendiente de revisión'));
}

// A failed or in-flight request must preserve the form and prevent duplicate submissions.
{
  const nodes = new Map();
  const get = id => { if (!nodes.has(id)) nodes.set(id, makeNode()); return nodes.get(id); };
  const input = { disabled: false, value: 'Borrador que debe conservarse' };
  get('manual-form').elements = [input, get('manual-submit')];
  let rejectRequest, calls = 0;
  const ctx = { URLSearchParams, location:{search:'?mode=member'}, AbortSignal,
    document:{body:makeNode(),getElementById:get,createElement:()=>makeNode()},
    FormData:class { get(key) { return key === 'correctIndex' ? '1' : 'Dato de prueba'; } },
    fetch:() => { calls++; return new Promise((_resolve,reject) => { rejectRequest=reject; }); }
  };
  vm.createContext(ctx); vm.runInContext(bank,ctx);
  const submit = () => get('manual-form').listeners.submit({preventDefault(){}, currentTarget:get('manual-form')});
  const pending = submit();
  assert.equal(input.disabled,true);
  await submit(); assert.equal(calls,1,'Double click must not create another request');
  rejectRequest(new Error('Sin conexión')); await pending;
  assert.equal(input.disabled,false); assert.equal(input.value,'Borrador que debe conservarse');
  assert.equal(get('manual-form').wasReset,undefined,'Network error must not clear the draft');
  assert.match(get('manual-status').textContent,/Sin conexión/);
  ctx.fetch = async () => ({ok:true,json:async()=>({ok:true,queued:1,items:[],total:0,page:0})});
  await submit(); assert.equal(get('manual-form').wasReset,true,'Confirmed save can clear the draft');
}
console.log('Contribution UI checks passed: member/admin-as-member scoping, escaped content, preserved drafts, disabled pending form and safe retry.');
