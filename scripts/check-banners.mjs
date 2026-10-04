import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createBannerCarousel, renderBanners, renderBannerSettings, bindBannerSettings, readBannerSettings, invalidateBanners } from '../public/assets/js/app/ui/banners.js';
const {normalizeBanners,normalizeDisplay,publicBanners} = createRequire(import.meta.url)('../server/banners.js');
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aHZkAAAAASUVORK5CYII=';
assert.deepEqual(publicBanners(),[]); assert.equal(normalizeDisplay().enabled,false);
for(const imageUrl of ['javascript:alert(1)','data:text/html,bad','data:image/svg+xml;base64,PHN2Zz4=','//evil.test/x','/\\evil.test/x','https://user:password@evil.test/x','http://evil.test/x','data:image/png;base64,YmFk']) {
 assert.throws(()=>normalizeBanners([{enabled:true,title:'QA',imageUrl}]));
}
assert.throws(()=>normalizeBanners(Array(11).fill({})));assert.throws(()=>normalizeDisplay({slots:3}));assert.throws(()=>normalizeDisplay({intervalSeconds:1}));
assert.equal(normalizeBanners([{enabled:true,title:'Logo',imageUrl:png}])[0].imageUrl,png);
assert.throws(()=>normalizeBanners([{enabled:true,title:'Logo',imageUrl:'data:image/png;base64,'+Buffer.alloc(500001).toString('base64')}]));
const attack='<img src=x onerror="alert(1)">';assert.ok(!renderBannerSettings([{title:attack,imageUrl:png}]).includes(attack));assert.ok(!renderBannerSettings([{imageUrl:png}]).includes(png),'Image bytes must not be embedded in input attributes');

class Node {
 constructor(tag='div'){this.tag=tag;this.children=[];this.events={};this.dataset={};this.attributes={};this.isConnected=true;this.value='';this.checked=false;}
 append(...items){for(const item of items){this.children.push(item);item.parent=this;}}
 replaceChildren(...items){for(const child of this.children)child.parent=null;this.children=[];this.append(...items);}
 contains(item){return item===this||this.children.some(child=>child.contains(item));}
 addEventListener(name,fn){(this.events[name] ||= new Set()).add(fn);}
 removeEventListener(name,fn){this.events[name]?.delete(fn);}
 fire(name,event={}){return Promise.all([...(this.events[name]||[])].map(fn=>fn(event)));}
 setAttribute(name,value){this.attributes[name]=value;}
 removeAttribute(name){delete this.attributes[name];}
 get innerHTML(){return '';}
 set innerHTML(_){throw new Error('Banners must not inject HTML');}
}
const globals=['fetch','document','location','matchMedia','setTimeout','clearTimeout','FormData'];
const original=Object.fromEntries(globals.map(name=>[name,globalThis[name]]));
const timers=new Map();let timerId=0;
const media=new Map();
const tick=()=>{const [id,fn]=timers.entries().next().value||[];assert.ok(fn,'A rotation timer should exist');timers.delete(id);fn();};
const doc=new Node('document');doc.createElement=tag=>new Node(tag);doc.hidden=false;
const payload={revision:1,display:{enabled:true,slots:2,intervalSeconds:6},banners:Array.from({length:10},(_,i)=>({id:String(i),enabled:true,title:`Logo ${i}`,imageUrl:png,targetUrl:i?'https://sponsor.example.test/':'javascript:bad'}))};
try {
 Object.assign(globalThis,{document:doc,location:{origin:'https://local.test'},setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id),matchMedia:query=>{if(!media.has(query)){const value=new Node();value.matches=false;media.set(query,value);}return media.get(query);}});
 const container=new Node('section');const carousel=createBannerCarousel(container,payload);
 const grid=container.children[1],controls=container.children[0].children[1];
 const image=()=>grid.children[0].children[0].children[0];
 assert.equal(grid.children.length,2);assert.equal(image().alt,'Logo 0');assert.equal(grid.children[0].children[0].tag,'div','Unsafe links cannot become anchors');
 assert.equal(grid.children[0].tag,'article','Unsafe destinations must not be clickable');
 const linkedCard=grid.children[1];assert.equal(linkedCard.tag,'a');assert.equal(linkedCard.href,'https://sponsor.example.test/');
 assert.equal(linkedCard.target,'_blank');assert.equal(linkedCard.rel,'noopener noreferrer sponsored');
 assert.equal(linkedCard.children[1].textContent,'Logo 1','Sponsor name and image share the same link');
 const seen=new Set();for(let i=0;i<5;i++){for(const card of grid.children)seen.add(card.children[0].children[0].alt);tick();}assert.equal(seen.size,10,'All ten sponsors must rotate');
 await container.fire('mouseenter');assert.equal(timers.size,0);await container.fire('mouseleave');assert.equal(timers.size,1);
 await container.fire('focusin');assert.equal(timers.size,0);await container.fire('focusout',{relatedTarget:null});assert.equal(timers.size,1);
 doc.hidden=true;await doc.fire('visibilitychange');assert.equal(timers.size,0);doc.hidden=false;await doc.fire('visibilitychange');
 await controls.children[1].fire('click');assert.equal(timers.size,0);await controls.children[2].fire('click');assert.equal(image().alt,'Logo 2');
 const reduced=media.get('(prefers-reduced-motion: reduce)');reduced.matches=true;await reduced.fire('change');assert.equal(timers.size,0);
 const compact=media.get('(max-width: 640px)');compact.matches=true;await compact.fire('change');assert.equal(grid.children.length,1);
 for(let i=0;i<10;i++)await image().fire('error');assert.equal(container.hidden,true);assert.equal(timers.size,0);carousel.destroy();assert.equal(doc.events.visibilitychange.size,0);
 reduced.matches=false;compact.matches=false;
 const removed=new Node();const removable=createBannerCarousel(removed,payload);removed.isConnected=false;tick();assert.equal(doc.events.visibilitychange.size,0);removable.destroy();
 // A pending fetch must never show sponsors after navigating into a test.
 let resolveFetch;globalThis.fetch=()=>new Promise(resolve=>resolveFetch=resolve);invalidateBanners();
 const pendingSlot=new Node();const loading=renderBanners(pendingSlot);await renderBanners(pendingSlot,{visible:false});
 resolveFetch({ok:true,json:async()=>payload});await loading;assert.equal(pendingSlot.hidden,true);assert.equal(pendingSlot.children.length,0);
 // Failures are isolated from portal rendering.
 globalThis.fetch=async()=>{throw new Error('offline');};invalidateBanners();await renderBanners(pendingSlot);assert.equal(pendingSlot.hidden,true);
 // Form data survives failed saves, duplicate submissions are blocked, and retry uses the new revision.
 const form=new Node('form'),fields=new Map(),special=new Map();
 const field=name=>{if(!fields.has(name)){const value=new Node('input');value.name=name;fields.set(name,value);}return fields.get(name);};
 for(let i=0;i<10;i++)for(const name of ['enabled','title','imageUrl','targetUrl'])field(`${name}-${i}`);
 field('sponsorsEnabled').checked=true;field('slots').value='2';field('intervalSeconds').value='6';field('title-0').value='Mi logo';field('enabled-0').checked=true;
 form.elements=[...fields.values()];form.elements.namedItem=field;form.querySelector=selector=>{if(!special.has(selector))special.set(selector,new Node());return special.get(selector);};
 globalThis.FormData=class{constructor(){ }get(name){return field(name).value;}has(name){return field(name).checked;}};
 let saved=0, uploads=0, failUpload=false;bindBannerSettings(form,{banners:[{imageUrl:png}],revision:4,onSaved:()=>saved++,imageReader:async()=>{uploads++;if(failUpload&&uploads===2)throw new Error('Imagen dañada');return png;}});
 let rejectSave,calls=0;globalThis.fetch=()=>{calls++;return new Promise((_resolve,reject)=>{rejectSave=reject;});};
 const submit=()=>form.fire('submit',{preventDefault(){},stopPropagation(){}});const sending=submit();assert.ok(form.elements.every(input=>input.disabled));await submit();assert.equal(calls,1);
 rejectSave(new Error('offline'));await sending;assert.equal(field('title-0').value,'Mi logo');assert.equal(readBannerSettings(form).banners[0].imageUrl,png);assert.ok(form.elements.every(input=>!input.disabled));
 globalThis.fetch=async()=>({ok:true,json:async()=>({ok:true,banners:[],display:payload.display,revision:5})});await submit();assert.equal(saved,1);assert.equal(readBannerSettings(form).expectedRevision,5);
 // Batch preparation is atomic: a damaged file leaves all existing slots intact.
 const batch=new Node('input');batch.matches=()=>true;batch.hasAttribute=()=>false;
 batch.files=[{name:'Segundo.png'},{name:'Tercero.png'}];batch.value='selected';failUpload=true;
 await form.fire('change',{target:batch});assert.equal(readBannerSettings(form).banners[1].imageUrl,'');assert.equal(field('title-1').value,'');assert.equal(batch.value,'');assert.equal(readBannerSettings(form).banners[0].imageUrl,png);
 failUpload=false;uploads=0;await form.fire('change',{target:batch});assert.equal(uploads,2);assert.equal(readBannerSettings(form).banners[1].imageUrl,png);assert.equal(field('title-1').value,'Segundo');assert.equal(field('enabled-2').checked,true);
 batch.files=Array.from({length:8},()=>({name:'Extra.png'}));await form.fire('change',{target:batch});assert.equal(uploads,2,'Overflow must be rejected before reading any files');assert.ok(form.elements.every(input=>!input.disabled));
 console.log('Sponsor checks passed: ten-image limits, safe uploads and links, complete rotation, pause/focus/visibility, reduced motion, responsive slots, failure cleanup, navigation races and preserved form retries.');
} finally {Object.assign(globalThis,original);}
