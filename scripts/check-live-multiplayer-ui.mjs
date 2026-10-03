// Optional real-browser check. Uses only a temporary local server and synthetic data.
// IZ_PLAYWRIGHT_MODULE / IZ_CHROMIUM_EXECUTABLE select an installed browser runtime.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
const { chromium } = await import(process.env.IZ_PLAYWRIGHT_MODULE || 'playwright');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = mkdtempSync(join(tmpdir(), 'iz-live-ui-'));
const screenshots = process.env.IZ_UI_SCREENSHOTS || join(temp, 'screenshots');
mkdirSync(screenshots, { recursive: true });
const seed = JSON.parse(readFileSync(join(root, 'data/default-state.json'), 'utf8'));
const password = 'QA-' + randomUUID();
for (const account of seed.accounts) {
  account.password = password; account.passwordHash = ''; account.mustChangePassword = false;
}
seed.settings.automation.autoRunOnSave = false;
for (let i = 1; i <= 2; i++) {
  const associate = { ...seed.associates[0], id: 'live-ui-associate-' + i,
    email: seed.accounts[i].email, status: 'Activa', campusAccessStatus: 'active',
    yearlyFees: { [new Date().getFullYear()]: 150 } };
  seed.associates.push(associate);
}
seed.testZoneQuestions = [0, 1, 2].map(i => ({
  id: 'multiplayer-q-' + i, prompt: 'Pregunta de ensayo ' + (i + 1),
  options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'], correctIndex: i,
  part: 'Ensayo', category: 'Multijugador', difficulty: 'media', explanation: 'Respuesta de ensayo.'
}));
seed.testZoneLiveSessions = []; seed.testZoneResults = [];
writeFileSync(join(temp, 'seed.json'), JSON.stringify(seed));
const port = await new Promise((resolvePort, reject) => {
  const probe = net.createServer(); probe.on('error', reject);
  probe.listen(0, '127.0.0.1', () => { const port = probe.address().port; probe.close(() => resolvePort(port)); });
});
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['server.js'], {
  cwd: root, env: { ...process.env, NODE_ENV: 'test', DATABASE_URL: '', PORT: String(port),
    IZ_BASE_URL: base, IZ_DATA_DIR: join(temp, 'data'), IZ_DEFAULT_STATE_PATH: join(temp, 'seed.json'),
    IZ_RECOVERY_ADMIN_PASSWORD: '', AUTOMATION_INTERVAL_MS: '3600000' }, stdio: 'ignore'
});
let browser;
const pages = [], errors = [];
async function waitText(page, text) { await page.getByText(text, { exact: false }).first().waitFor(); }
async function fit(page, label) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ' fits viewport');
}
try {
  let ready = false;
  for (let i = 0; i < 60; i++) { try { if ((await fetch(base + '/healthz')).ok) { ready = true; break; } } catch {} await delay(250); }
  assert.ok(ready, 'Local server starts');
  browser = await chromium.launch({ headless: true, executablePath: process.env.IZ_CHROMIUM_EXECUTABLE || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  async function newPage(width) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage(); pages.push(page);
    page.setDefaultTimeout(15000); page.on('pageerror', e => errors.push(e.message)); return page;
  }
  async function login(page, account) {
    await page.goto(base); await page.fill('#loginEmail', account.email); await page.fill('#loginPassword', password);
    await page.locator('#loginForm button[type=submit]').click(); await page.waitForFunction(() => !document.getElementById('shell').hidden);
  }
  async function openLive(page) {
    // The submenu is initially collapsed on the published portal.
    if (await page.locator('#nav .nav-toggle-button[data-view=test]').getAttribute('aria-expanded') === 'false')
      await page.locator('#nav .nav-toggle-button[data-view=test]').click();
    await page.locator('#nav button[data-view=tests]').click();
    await page.getByRole('link', { name: 'Abrir entrada de participantes' }).waitFor();
  }
  const admin = await newPage(1440); await login(admin, seed.accounts[0]); await openLive(admin);
  const create = admin.locator('[data-test-zone-live-form]');
  await create.locator('[name=title]').fill('Ensayo multijugador');
  await create.locator('[name=questionCount]').fill('3');
  await create.locator('[name=questionTimeLimitSeconds]').selectOption('30');
  const createdPromise = admin.waitForResponse(r => r.url().endsWith('/api/test-zone/live-sessions') && r.request().method() === 'POST');
  await create.locator('button[type=submit]').click();
  const created = await (await createdPromise).json(); assert.equal(created.ok, true);
  const session = created.session, livePath = '/api/test-zone/live-sessions/' + session.id;
  const card = () => admin.locator('.test-zone-mini-card').filter({ hasText: 'Ensayo multijugador' });
  await card().getByText('Sala de espera', { exact: false }).waitFor();
  async function adminState() {
    const response = await admin.request.get(base + '/api/test-zone/live-sessions');
    assert.equal(response.status(), 200); return (await response.json()).sessions.find(s => s.id === session.id);
  }
  const member = await newPage(1200); await login(member, seed.accounts[1]); await openLive(member);
  assert.equal(await member.locator('[data-public-live-controls]').count(), 0, 'Member has no host controls');
  const link = member.getByRole('link', { name: 'Abrir entrada de participantes' });
  const [memberPlayer] = await Promise.all([member.context().waitForEvent('page'), link.click()]);
  pages.push(memberPlayer); memberPlayer.setDefaultTimeout(15000); memberPlayer.on('pageerror', e => errors.push(e.message));
  await memberPlayer.setViewportSize({ width: 390, height: 844 });
  const guest = await newPage(320); await guest.goto(base + '/public-live-test.html');
  const second = await newPage(390); await login(second, seed.accounts[2]);
  await second.goto(base + '/public-live-test.html');
  const players = [memberPlayer, guest, second];
  const names = ['Socio de ensayo', 'Invitado de ensayo', 'Segundo socio'];
  const identities = [];
  for (let i = 0; i < players.length; i++) {
    const page = players[i]; await page.fill('[name=guestName]', names[i]); await page.fill('[name=code]', session.code);
    const joinedPromise = page.waitForResponse(r => r.url().endsWith('/api/test-zone/live/join'));
    await page.locator('#publicLiveJoinForm button').click();
    identities.push((await (await joinedPromise).json()).liveSession.participantId);
    await waitText(page, 'ya estás dentro'); await fit(page, names[i] + ' lobby');
  }
  await card().locator('[data-action=refresh-live-lobby]').click(); await waitText(admin, '3 participantes');
  assert.equal(new Set(identities).size, 3);
  await admin.screenshot({ path: join(screenshots, 'live-admin-lobby.png') });
  await card().locator('[data-action=start-live-session]').click();
  for (const page of players) await page.locator('#publicLiveQuestionForm').waitFor();
  console.log('PASS: administrator, two signed-in members and external participant enter the same room.');
  const first = await adminState();
  const correct = seed.testZoneQuestions.find(q => q.id === first.currentQuestionId).correctIndex;
  // A failed request must leave the selected answer available for retry.
  await guest.route('**/answer', route => route.abort(), { times: 1 });
  await guest.locator(`input[name=answerIndex][value="${(correct + 1) % 4}"]`).check();
  await guest.locator('#publicLiveQuestionForm button[type=submit]').click();
  await waitText(guest, 'No se pudo conectar');
  assert.equal(await guest.locator('input[name=answerIndex]:checked').inputValue(), String((correct + 1) % 4));
  await guest.locator('#publicLiveQuestionForm button[type=submit]').click(); await waitText(guest, 'Respuesta enviada');
  for (const page of [memberPlayer, second]) {
    await page.locator(`input[name=answerIndex][value="${correct}"]`).check();
    await page.locator('#publicLiveQuestionForm button[type=submit]').click(); await waitText(page, 'Respuesta enviada');
  }
  for (const page of players) { assert.equal(await page.getByText('Clasificación provisional', { exact: true }).count(), 0); await fit(page, 'Question'); }
  await memberPlayer.screenshot({ path: join(screenshots, 'live-member-answer.png') });
  // Reloading should resume the existing participant, without joining again or losing their answer.
  await memberPlayer.reload();
  await memberPlayer.locator('#publicLiveQuestionForm').waitFor();
  await waitText(memberPlayer, 'Respuesta enviada');
  assert.equal((await adminState()).participants.length, 3, 'Reload does not duplicate participants');
  console.log('PASS: retry, answer confirmation and participant reload.');
  await card().locator('[data-action=reveal-live-question]').click();
  for (const page of players) await waitText(page, 'Clasificación provisional');
  const ranking = (await adminState()).leaderboard;
  assert.equal(ranking.length, 3); assert.equal(ranking.at(-1).name, names[1]); assert.equal(ranking.at(-1).score, 0);
  assert.ok(ranking[0].score >= 100 && ranking[0].score <= 150);
  await guest.screenshot({ path: join(screenshots, 'live-guest-ranking.png') });
  // Host advances while one participant is offline; reconnect must pick up the current question.
  await second.context().setOffline(true);
  await card().locator('[data-action=next-live-question]').click();
  for (const page of [memberPlayer, guest]) await waitText(page, 'Pregunta 2 de 3');
  await second.context().setOffline(false); await waitText(second, 'Pregunta 2 de 3');
  const q2 = await adminState(); const correct2 = seed.testZoneQuestions.find(q => q.id === q2.currentQuestionId).correctIndex;
  for (const page of players) {
    await page.locator(`input[name=answerIndex][value="${correct2}"]`).check();
    await page.locator('#publicLiveQuestionForm button[type=submit]').click(); await waitText(page, 'Respuesta enviada');
  }
  await card().locator('[data-action=reveal-live-question]').click();
  for (const page of players) await waitText(page, 'Clasificación provisional');
  await card().locator('[data-action=next-live-question]').click();
  for (const page of players) await waitText(page, 'Pregunta 3 de 3');
  // Let the server deadline expire naturally; nobody answers the last question.
  await Promise.all(players.map(page => page.getByText('No enviaste respuesta antes del cierre.', { exact: false }).waitFor({ timeout: 40000 })));
  await card().locator('[data-action=refresh-live-lobby]').click();
  await card().locator('[data-action=finish-live-session]').click();
  for (const page of players) { await waitText(page, 'Podio final'); await waitText(page, 'Tu posición final:'); await fit(page, 'Final podium'); }
  await guest.reload(); await waitText(guest, 'Podio final');
  await guest.screenshot({ path: join(screenshots, 'live-guest-podium.png') });
  await admin.screenshot({ path: join(screenshots, 'live-admin-podium.png') });
  const finished = await adminState(); assert.equal(finished.status, 'finished');
  for (const page of players) for (const row of finished.leaderboard) await waitText(page, `${row.rank}. ${row.name}`);
  const late = await guest.request.post(base + '/api/test-zone/live/join', { data: { guestName: 'Llegada tardía', code: session.code } });
  assert.equal(late.status(), 404, 'Finished room refuses new players');
  assert.deepEqual(errors, [], 'No uncaught browser errors');
  console.log('PASS: synchronized questions, offline recovery, deadline, scores, ranking, final podium, mobile layout and no browser errors.');
} catch (error) {
  for (let i = 0; i < pages.length; i++) if (!pages[i].isClosed()) {
    await pages[i].screenshot({ path: join(screenshots, `failure-${i}.png`) }).catch(() => {});
    console.error('PAGE ' + i + ': ' + (await pages[i].locator('body').innerText().catch(() => '')).slice(-2000));
  }
  throw error;
} finally {
  await browser?.close(); server.kill();
  await new Promise(done => { if (server.exitCode !== null) done(); else server.once('exit', done); });
  rmSync(temp, { recursive: true, force: true });
}
