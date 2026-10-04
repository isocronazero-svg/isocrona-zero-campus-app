// Optional real-browser QA with temporary synthetic data only.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
const { chromium } = await import(process.env.IZ_PLAYWRIGHT_MODULE || 'playwright');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = mkdtempSync(join(tmpdir(), 'iz-campus-access-ui-'));
const screenshots = process.env.IZ_UI_SCREENSHOTS || join(temp, 'screenshots');
mkdirSync(screenshots, { recursive: true });
const seed = JSON.parse(readFileSync(join(root, 'data/default-state.json'), 'utf8'));
const password = 'QA-' + randomUUID();
for (const account of seed.accounts) {
  account.password = password; account.passwordHash = ''; account.mustChangePassword = false; account.associateId = '';
}
seed.associates = [];
seed.members.forEach(member => member.associateId = '');
seed.settings.automation.autoRunOnSave = false;
seed.settings.smtp = {};
seed.manualCampusNotices = [{ id: 'campus-qa-notice', title: 'Aviso integrado QA', detail: 'Conservamos los avisos al integrar Campus', audience: 'all', active: true, publishedAt: new Date().toISOString() }];
seed.campusGroups = [{ id: 'group-qa', title: 'Grupo interno QA', modules: [] }];
seed.courses = [{ ...seed.courses[0], id: 'internal-course-qa', title: 'Curso interno QA', status: 'Inscripcion abierta', accessScope: 'members', audience: 'Socios',
  startDate: '2099-02-01', endDate: '2099-02-02', enrollmentOpensAt: '', capacity: 1, enrollmentFee: 25,
  enrolledIds: [], waitingIds: [], diplomaReady: [], enrollmentSubmissions: [], modules: [] }];
writeFileSync(join(temp, 'seed.json'), JSON.stringify(seed));
const port = await new Promise((resolvePort, reject) => {
  const probe = net.createServer(); probe.on('error', reject);
  probe.listen(0, '127.0.0.1', () => { const value = probe.address().port; probe.close(() => resolvePort(value)); });
});
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['server.js'], {
  cwd: root, env: { ...process.env, NODE_ENV: 'test', DATABASE_URL: '', PORT: String(port),
    IZ_BASE_URL: base, IZ_DATA_DIR: join(temp, 'data'), IZ_DEFAULT_STATE_PATH: join(temp, 'seed.json'),
    IZ_RECOVERY_ADMIN_PASSWORD: '', AUTOMATION_INTERVAL_MS: '3600000' }, stdio: 'ignore'
});
let browser;
const errors = [];
try {
  let ready = false;
  for (let i = 0; i < 60; i++) { try { if ((await fetch(base + '/healthz')).ok) { ready = true; break; } } catch {} await delay(250); }
  assert.ok(ready);
  const smoke = spawnSync(process.execPath, ['scripts/smoke-campus-test.mjs'], { cwd: root, env: { ...process.env, IZ_BASE_URL: base }, encoding: 'utf8' });
  assert.equal(smoke.status, 0, smoke.stdout + smoke.stderr);
  browser = await chromium.launch({ headless: true, executablePath: process.env.IZ_CHROMIUM_EXECUTABLE || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  async function login(width, account) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message));
    await page.goto(base); await page.fill('#loginEmail', account.email); await page.fill('#loginPassword', password);
    await page.locator('#loginForm button[type=submit]').click(); await page.locator('#loginScreen').waitFor({ state: 'hidden' });
    return page;
  }
  const admin = await login(1440, seed.accounts[0]);
  await admin.locator('#roleSwitcher').selectOption('member-self');
  await admin.waitForFunction(() => document.querySelector('#roleSwitcher')?.value === 'member-self' && !document.querySelector('#roleSwitcher').disabled);
  const accountBefore = await (await admin.request.get(base + '/api/state?mode=self')).json();
  const ownMember = accountBefore.selectedMemberId;
  assert.ok(accountBefore.courses.some(course => course.id === 'internal-course-qa'));
  await admin.locator('#nav .nav-main-button[data-view="campus"]').click();
  await admin.locator('[data-action="set-campus-section-mode"][data-mode="groups"]').first().click();
  await admin.getByText('Grupo interno QA', { exact: false }).first().waitFor();
  await admin.locator('[data-action="set-campus-section-mode"][data-mode="alerts"]').first().click();
  await admin.getByText('Aviso integrado QA', { exact: true }).first().waitFor();
  await admin.locator('[data-action="set-campus-section-mode"][data-mode="courses"]').first().click();
  await admin.locator('[data-action="prepare-course-enrollment"][data-course-id="internal-course-qa"]').first().click();
  const form = admin.locator('#mainPanel #courseEnrollmentForm');
  await form.locator('#courseEnrollmentAmount').fill('25');
  await form.locator('#courseEnrollmentMethod').selectOption('Bizum');
  await form.locator('#courseEnrollmentNote').fill('Justificante de prueba conservado');
  const proof = Buffer.from('%PDF-1.4\nDocumento sintético QA\n%%EOF');
  await form.locator('#courseEnrollmentProof').setInputFiles({ name: 'justificante-qa.pdf', mimeType: 'application/pdf', buffer: proof });
  let fail = true;
  await admin.route('**/api/member/courses/internal-course-qa/enroll', async route => {
    if (fail) { fail = false; await route.abort('failed'); } else await route.continue();
  });
  admin.on('dialog', dialog => dialog.accept());
  await form.locator('button[type=submit]').click();
  await admin.waitForFunction(() => !document.querySelector('#courseEnrollmentForm button[type=submit]')?.disabled);
  assert.equal(await form.locator('#courseEnrollmentNote').inputValue(), 'Justificante de prueba conservado');
  assert.equal(await form.locator('#courseEnrollmentProof').evaluate(input => input.files.length), 1);
  const enrollmentResponse = admin.waitForResponse(response => response.url().endsWith('/internal-course-qa/enroll'));
  await form.locator('button[type=submit]').click();
  assert.equal((await enrollmentResponse).status(), 200);
  await admin.waitForFunction(() => !document.querySelector('#courseEnrollmentForm'));
  const after = await (await admin.request.get(base + '/api/state')).json();
  assert.deepEqual(after.courses[0].enrolledIds, [ownMember]);
  assert.deepEqual(after.associates, []);
  const submission = after.courses[0].enrollmentSubmissions[0];
  assert.equal(submission.memberId, ownMember);
  assert.equal(submission.method, 'Bizum');
  assert.equal(submission.note, 'Justificante de prueba conservado');
  assert.equal(submission.paymentProof.contentBase64, proof.toString('base64'));
  await admin.screenshot({ path: join(screenshots, 'admin-own-enrollment.png'), animations: 'disabled' });
  const external = await login(390, seed.accounts[1]);
  await external.locator('#mobileShellToggle').click();
  await external.locator('#nav .nav-main-button[data-view="campus"]').click();
  await external.locator('[data-action="set-campus-section-mode"][data-mode="alerts"]').first().click();
  await external.getByText('Aviso integrado QA', { exact: true }).first().waitFor();
  assert.equal(await external.locator('[data-action="set-campus-section-mode"][data-mode="groups"]').count(), 0);
  const scoped = await (await external.request.get(base + '/api/state')).json();
  assert.deepEqual(scoped.campusGroups, []);
  assert.ok(!scoped.courses.some(course => course.id === 'internal-course-qa'));
  assert.ok(await external.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await external.screenshot({ path: join(screenshots, 'external-campus-notices-mobile.png'), animations: 'disabled' });
  assert.deepEqual(errors, []);
  console.log('Campus UI PASS: own admin learning/enrollment, proof and draft recovery, internal groups, external restrictions, notices, mobile fit and smoke routes.');
} finally {
  await browser?.close(); server.kill('SIGTERM'); await delay(200); rmSync(temp, { recursive: true, force: true });
}
