import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';

const root = fileURLToPath(new URL('../../', import.meta.url));

async function unusedPort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function createCampus() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'iz-browser-'));
  const baseURL = `http://127.0.0.1:${await unusedPort()}`;
  const password = `Synthetic-${randomUUID()}`;
  const nextPassword = `Changed-${randomUUID()}`;
  const seed = JSON.parse(fs.readFileSync(path.join(root, 'data/qa-private-seed.json'), 'utf8'));
  seed.accounts = [
    { id: 'qa-member', name: 'QA Browser Socio', email: 'qa-member@example.test', password,
      role: 'member', memberId: 'qa-member', associateId: 'qa-associate', mustChangePassword: false },
    { id: 'qa-admin', name: 'QA Browser Admin', email: 'qa-admin@example.test', password,
      role: 'admin', memberId: 'qa-admin', mustChangePassword: false }
  ];
  seed.members = [
    { id: 'qa-member', name: 'QA Browser Socio', email: 'qa-member@example.test',
      role: 'Socio', associateId: 'qa-associate', certifications: [] },
    { id: 'qa-admin', name: 'QA Browser Admin', email: 'qa-admin@example.test',
      role: 'Administración', certifications: [] }
  ];
  seed.associates = [{ id: 'qa-associate', name: 'QA Browser Socio', firstName: 'QA Browser',
    lastName: 'Socio', email: 'qa-member@example.test', status: 'Activo',
    linkedMemberId: 'qa-member', linkedAccountId: 'qa-member', campusAccessStatus: 'active' }];
  const seedPath = path.join(temp, 'seed.json');
  const outbox = path.join(temp, 'outbox.json');
  fs.writeFileSync(seedPath, JSON.stringify(seed));
  let child;
  let logs = '';
  // Do not inherit production credentials, mail settings, database URLs or data paths.
  const inherited = Object.fromEntries(['PATH', 'HOME', 'TMPDIR', 'SYSTEMROOT', 'NO_PROXY', 'no_proxy']
    .filter(key => process.env[key]).map(key => [key, process.env[key]]));
  async function stop() {
    if (child && child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill('SIGTERM');
      await exited;
    }
  }
  async function start() {
    child = spawn(process.execPath, ['server-entry.js'], {
      cwd: root, stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...inherited, NODE_ENV: 'test', NODE_USE_ENV_PROXY: '0',
        HOST: '127.0.0.1', PORT: new URL(baseURL).port, IZ_BASE_URL: baseURL,
        IZ_DATA_DIR: path.join(temp, 'data'), IZ_DEFAULT_STATE_PATH: seedPath,
        IZ_EMAIL_ENABLED: 'false', IZ_PASSWORD_RESET_TEST_OUTBOX: outbox,
        DATABASE_URL: '', AUTOMATION_INTERVAL_MS: '86400000' }
    });
    child.stdout.on('data', chunk => { logs += chunk; });
    child.stderr.on('data', chunk => { logs += chunk; });
    try {
      await expect.poll(async () => {
        try { return (await fetch(`${baseURL}/healthz`)).status; } catch { return 0; }
      }, { timeout: 15_000, message: 'Isolated campus must start' }).toBe(200);
    } catch (error) {
      throw new Error(`Isolated server did not start: ${logs}`, { cause: error });
    }
  }
  return { baseURL, password, nextPassword, outbox, start, stop,
    cleanup: () => fs.rmSync(temp, { recursive: true, force: true }) };
}

async function login(page, campus, email, password) {
  await page.goto(campus.baseURL);
  await page.locator('#loginEmail').fill(email);
  await page.locator('#loginPassword').fill(password);
  await page.locator('#loginRememberMe').check();
  await page.locator('#loginForm button[type="submit"]').click();
  await expect(page.locator('#loginScreen')).toBeHidden();
}

for (const viewport of [{ width: 1440, height: 1000 }, { width: 375, height: 812 }]) {
  test(`recovery, remembered sessions and bank notice at ${viewport.width}px`, async ({ browser }, testInfo) => {
    const campus = await createCampus();
    const contexts = [];
    const pageErrors = [];
    async function newPage() {
      const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
      contexts.push(context);
      // Every request stays in the synthetic loopback server; no third-party mail or services.
      await context.route('**/*', route => new URL(route.request().url()).origin === campus.baseURL
        ? route.continue() : route.abort());
      const page = await context.newPage();
      page.on('pageerror', error => pageErrors.push(error.message));
      return page;
    }
    async function evidence(page, name) {
      await testInfo.attach(`${viewport.width}-${name}`, { body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png' });
    }
    try {
      await campus.start();
      const remembered = await newPage();
      await login(remembered, campus, 'qa-member@example.test', campus.password);
      const oldCookies = await remembered.context().cookies();
      expect(oldCookies.some(cookie => cookie.expires > Date.now() / 1000)).toBe(true);
      await expect(remembered.locator('#courseFinanceNavButton')).toHaveCount(0);
      expect((await remembered.request.get(`${campus.baseURL}/api/course-finance`)).status()).toBe(403);

      const page = await newPage();
      await page.goto(campus.baseURL);
      await page.locator('#passwordRecoveryLink').click();
      await page.locator('#passwordRecoveryEmail').fill('qa-member@example.test');
      await page.locator('#passwordRecoveryRequestForm button[type="submit"]').click();
      await expect(page.locator('#passwordRecoveryRequestStatus')).toContainText('Si existe una cuenta');
      await expect.poll(() => {
        try { return JSON.parse(fs.readFileSync(campus.outbox, 'utf8')).length; } catch { return 0; }
      }).toBe(1);
      const message = JSON.parse(fs.readFileSync(campus.outbox, 'utf8'))[0];
      expect(message.text).not.toContain(campus.password);
      const token = message.text.match(/[?&]reset=([0-9a-f]{64})/i)?.[1];
      expect(token).toBeTruthy();
      const resetURL = `${campus.baseURL}/?reset=${token}`;
      await page.goto(resetURL);
      const submit = page.locator('#passwordRecoveryResetForm button[type="submit"]');
      await expect(submit).toBeEnabled();
      await expect(page.locator('#passwordRecoveryOverlay')).toBeVisible();
      const card = await page.locator('.iz-password-recovery-card').boundingBox();
      expect(card.x).toBeGreaterThanOrEqual(0);
      expect(card.x + card.width).toBeLessThanOrEqual(viewport.width + 1);

      await page.locator('#passwordRecoveryNew').fill(campus.nextPassword);
      await page.locator('#passwordRecoveryConfirm').fill(`${campus.nextPassword}-mismatch`);
      await submit.click();
      await expect(page.locator('#passwordRecoveryResetStatus')).toContainText('no coinciden');
      // HTML minlength accepts spaces; the server must reject the effective empty password.
      await page.locator('#passwordRecoveryNew').fill('        ');
      await page.locator('#passwordRecoveryConfirm').fill('        ');
      const invalidReset = page.waitForResponse(response => response.url().endsWith('/api/password-recovery/reset')
        && response.request().method() === 'POST');
      await submit.click();
      expect((await invalidReset).status()).toBe(400);
      await expect(page.locator('#passwordRecoveryResetStatus')).toHaveAttribute('data-tone', 'error');
      const valid = await page.request.get(`${campus.baseURL}/api/password-recovery/validate?token=${token}`);
      expect((await valid.json()).valid).toBe(true);
      await page.locator('#passwordRecoveryNew').fill(campus.nextPassword);
      await page.locator('#passwordRecoveryConfirm').fill(campus.nextPassword);
      await submit.click();
      await expect(page.locator('#passwordRecoveryResetStatus')).toContainText('actualizada');
      expect(new URL(page.url()).searchParams.has('reset')).toBe(false);
      await evidence(page, 'reset-completed');

      await remembered.reload();
      await expect(remembered.locator('#loginScreen')).toBeVisible();
      await page.getByRole('button', { name: 'Volver al acceso' }).click();
      await page.locator('#loginEmail').fill('qa-member@example.test');
      await page.locator('#loginPassword').fill(campus.password);
      await page.locator('#loginForm button[type="submit"]').click();
      await expect(page.locator('#loginStatus')).toContainText(/denegado|incorrect|inv[aá]lid/i);
      await login(page, campus, 'qa-member@example.test', campus.nextPassword);

      await campus.stop();
      await campus.start();
      await page.reload();
      await expect(page.locator('#loginScreen')).toBeHidden();
      // Reintroduce the pre-reset cookie to verify it stays revoked after restart.
      await remembered.context().addCookies(oldCookies);
      await remembered.reload();
      await expect(remembered.locator('#loginScreen')).toBeVisible();
      const used = await newPage();
      await used.goto(resetURL);
      await expect(used.locator('#passwordRecoveryResetStatus')).toContainText('ya se ha utilizado');
      await expect(used.locator('#passwordRecoveryResetForm button[type="submit"]')).toBeDisabled();
      await evidence(used, 'link-reuse-rejected');

      // Public joining notice survives the release, on both desktop and mobile.
      await used.goto(`${campus.baseURL}/join.html`);
      await expect(used.getByText('ES23 0073 0100 5905 0627 3646', { exact: true })).toBeVisible();
      await evidence(used, 'join-bank-notice');
      if (viewport.width > 600) {
        const admin = await newPage();
        await login(admin, campus, 'qa-admin@example.test', campus.password);
        await admin.locator('#courseFinanceNavButton').click();
        await expect(admin.locator('#courseFinanceDialog')).toBeVisible();
        await expect(admin.locator('#courseFinanceDialog')).toContainText('Pagos que requieren atención');
        await evidence(admin, 'admin-treasury');
      }
      expect(pageErrors).toEqual([]);
    } finally {
      await Promise.all(contexts.map(context => context.close()));
      await campus.stop();
      campus.cleanup();
    }
  });
}
