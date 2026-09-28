// Optional real-browser regression check. Supply a Playwright module and Chromium
// executable through IZ_PLAYWRIGHT_MODULE and IZ_CHROMIUM_EXECUTABLE if needed.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import net from 'node:net';
import {setTimeout as delay} from 'node:timers/promises';
const {chromium}=await import(process.env.IZ_PLAYWRIGHT_MODULE || 'playwright');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const temp=mkdtempSync(join(tmpdir(),'iz-portal-ui-'));
const screenshots=process.env.IZ_UI_SCREENSHOTS || join(temp,'screenshots');mkdirSync(screenshots,{recursive:true});
const seed=JSON.parse(readFileSync(join(root,'data/default-state.json'),'utf8'));
const password='QA-'+randomUUID();
for(const account of seed.accounts){account.password=password;account.passwordHash='';account.mustChangePassword=false;}
// Synthetic member profile: keep real production data completely out of this check.
seed.associates[0].email=seed.accounts[1].email;seed.associates[0].status='Activa';
seed.associates[0].yearlyFees={[new Date().getFullYear()]:150};
seed.associates[0].campusAccessStatus='active';
seed.settings.automation.autoRunOnSave=false;
writeFileSync(join(temp,'seed.json'),JSON.stringify(seed));
const port=await new Promise(resolvePort=>{const server=net.createServer();server.listen(0,'127.0.0.1',()=>{const port=server.address().port;server.close(()=>resolvePort(port));});});
const base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,NODE_ENV:'test',PORT:String(port),IZ_BASE_URL:base,IZ_DATA_DIR:join(temp,'data'),IZ_DEFAULT_STATE_PATH:join(temp,'seed.json'),IZ_RECOVERY_ADMIN_PASSWORD:'',AUTOMATION_INTERVAL_MS:'3600000'},stdio:'ignore'});
let browser;
try {
 let ready=false;for(let i=0;i<60;i++){try{if((await fetch(base+'/healthz')).ok){ready=true;break;}}catch{}await delay(250);}assert.ok(ready,'Server must start');
 browser=await chromium.launch({headless:true,executablePath:process.env.IZ_CHROMIUM_EXECUTABLE || undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 const errors=[];
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
 async function shot(name){await page.screenshot({path:join(screenshots,name+'.png'),fullPage:false,animations:'disabled'});}
 async function noOverflow(label){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' must fit viewport');}
 async function login(account){await page.fill('#loginEmail',account.email);await page.fill('#loginPassword',password);await page.locator('#loginForm button[type=submit]').click();await page.waitForFunction(()=>!document.getElementById('shell').hidden);}
 async function openMenu(){await page.locator('#mobileShellToggle').click();await page.waitForFunction(()=>document.getElementById('sidebar').getAttribute('aria-modal')==='true');}
 await page.goto(base);await page.locator('#loginForm').waitFor({state:'visible'});await shot('login-mobile');await noOverflow('Mobile login');
 const fieldBox=await page.locator('#loginEmail').boundingBox();const alternativesBox=await page.locator('.portal-decision-strip').boundingBox();assert.ok(fieldBox.y<alternativesBox.y,'Credentials must precede secondary routes');
 await page.setViewportSize({width:1440,height:1000});await shot('login-desktop');await noOverflow('Desktop login');
 await login(seed.accounts[0]);await page.locator('#nav .nav-main-button').first().waitFor();await shot('admin-desktop');await noOverflow('Desktop admin');
 assert.equal(await page.locator('#sidebar').evaluate(n=>n.inert),false);
 await page.setViewportSize({width:390,height:844});await shot('admin-mobile');await noOverflow('Mobile admin');
 assert.equal(await page.locator('#sidebar').evaluate(n=>n.inert),true,'Closed drawer must not receive focus');
 await openMenu();assert.equal(await page.locator('#content').evaluate(n=>n.inert),true);assert.equal(await page.evaluate(()=>document.activeElement.className),'ghost-button mobile-menu-close');
 await shot('menu-admin-mobile');
 await page.keyboard.press('Shift+Tab');assert.ok(await page.locator('#sidebar').evaluate(n=>n.contains(document.activeElement)),'Shift-Tab remains within menu');
 await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.className),'ghost-button mobile-menu-close','Tab wraps back to close');
 await page.keyboard.press('Escape');assert.equal(await page.locator('#content').evaluate(n=>n.inert),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'mobileShellToggle');
 await openMenu();await page.locator('#nav .nav-main-button[data-view=test]').click();await page.waitForFunction(()=>document.getElementById('mobileShellToggle').getAttribute('aria-expanded')==='false');await noOverflow('Test navigation');
 await openMenu();if(await page.locator('#nav .nav-toggle-button[data-view=test]').getAttribute('aria-expanded')==='false')await page.locator('#nav .nav-toggle-button[data-view=test]').click();await page.locator('#nav button[data-view="test-add"]').click();await page.locator('#mainPanel').getByText('Añadir preguntas',{exact:true}).first().waitFor();await noOverflow('Question contribution page');
 await openMenu();await page.setViewportSize({width:1440,height:1000});assert.equal(await page.locator('#content').evaluate(n=>n.inert),false);assert.equal(await page.locator('#sidebar').evaluate(n=>n.inert),false,'Desktop transition releases drawer');
 // Upload actual image files through the sponsor editor, then inspect desktop/mobile rendering.
 await page.locator('#nav .nav-main-button[data-view=reports]').click();await page.locator('button[data-action=set-reports-section-mode][data-mode=sponsors]').click();
 const logo=readFileSync(join(root,'public/assets/isocrona-brand.png'));
 await page.locator('[data-sponsor-batch]').setInputFiles(['Uno','Dos','Tres'].map(name=>({name:'Colaborador '+name+'.png',mimeType:'image/png',buffer:logo})));
 await page.waitForFunction(()=>document.querySelector('[data-banner-status]').textContent.includes('preparada'));
 await page.locator('[name=sponsorsEnabled]').check();await page.locator('[name=slots]').selectOption('2');
 await page.locator('#bannersForm button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('[data-banner-status]').textContent.includes('guardados y visibles'));
 await page.waitForFunction(()=>[...document.querySelectorAll('#portalSponsors img')].length===2&&[...document.querySelectorAll('#portalSponsors img')].every(n=>n.complete&&n.naturalWidth>0));
 await page.evaluate(()=>window.scrollTo(0,0));await shot('sponsors-desktop');
 await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.querySelectorAll('#portalSponsors img').length===1);await shot('sponsors-mobile');await noOverflow('Sponsor editor');
 await openMenu();await page.locator('#nav .nav-main-button[data-view=test]').click();assert.equal(await page.locator('#portalSponsors').evaluate(n=>n.hidden),true,'Sponsors stay hidden in tests');
 await page.setViewportSize({width:1440,height:1000});
 await page.locator('#roleSwitcher').selectOption('member-self');await page.waitForFunction(()=>document.querySelector('.portal-mode').textContent==='Modo socio');await shot('admin-as-member-desktop');assert.equal(await page.locator('#nav .nav-main-button').count(),4);
 await page.locator('#roleSwitcher').selectOption('admin');await page.waitForFunction(()=>document.querySelector('.portal-mode').textContent==='Administración');
 await page.locator('#logoutButton').click();await page.locator('#loginForm').waitFor({state:'visible'});assert.equal(await page.locator('#shell').evaluate(n=>n.hidden),true);
 await login(seed.accounts[1]);await page.waitForFunction(()=>document.querySelector('.portal-mode').textContent==='Mi portal');await shot('member-desktop');await noOverflow('Desktop member');
 await page.setViewportSize({width:390,height:844});await shot('member-mobile');await noOverflow('Mobile member');
 await openMenu();assert.equal(await page.locator('#nav .nav-main-button').count(),4);await page.locator('.mobile-menu-close').click();assert.equal(await page.locator('#mobileShellToggle').getAttribute('aria-expanded'),'false');
 await openMenu();await page.locator('.shell-mobile-backdrop').click({position:{x:380,y:400}});assert.equal(await page.locator('#mobileShellToggle').getAttribute('aria-expanded'),'false');
 await page.setViewportSize({width:320,height:740});await noOverflow('Small mobile member');await shot('member-small-mobile');
 await page.setViewportSize({width:390,height:844});await openMenu();await page.locator('#logoutButton').click();await page.locator('#loginForm').waitFor({state:'visible'});assert.equal(await page.locator('body').evaluate(n=>n.classList.contains('shell-mobile-lock')),false,'Logging out releases scroll');
 assert.deepEqual(errors,[],'No uncaught browser errors');
 console.log('Portal UI checks passed: real Chromium, desktop/mobile sign-in, admin/member views, keyboard focus, Escape/close/backdrop, navigation, role changes, viewport changes, logout and no overflow.');
 console.log('Screenshots: '+screenshots);
} catch(error) {
 if(browser){const page=browser.contexts()[0]?.pages()[0];if(page){await page.screenshot({path:join(screenshots,'failure.png'),fullPage:true});console.error((await page.locator('body').innerText()).slice(0,1800));console.error('Sponsor status:',await page.locator('[data-banner-status]').textContent().catch(()=>''));}}
 throw error;
} finally {await browser?.close();server.kill();await new Promise(resolveDone=>{if(server.exitCode!==null)resolveDone();else server.once('exit',resolveDone);});rmSync(temp,{recursive:true,force:true});}
