import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const bundledDefaultStatePath = path.join(repoRoot, "data", "default-state.json");
const nodeModulesCandidates = [
  path.join(repoRoot, "node_modules"),
  path.join(path.dirname(repoRoot), "Isocrona Zero", "node_modules")
];
const nodeModulesPath = nodeModulesCandidates.find((candidate) => existsSync(candidate)) || "";
const tempRoot = mkdtempSync(path.join(os.tmpdir(), "iz-notice-attachments-check-"));
const tempDataDir = path.join(tempRoot, "data");
const tempDefaultStatePath = path.join(tempRoot, "default-state.json");
const serverOut = [];
const serverErr = [];

async function getAvailablePort() {
  return await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
}

function buildSeedState() {
  const seed = JSON.parse(readFileSync(bundledDefaultStatePath, "utf8"));
  seed.memberNotifications = [];
  seed.manualCampusNotices = [];
  seed.settings.smtp = {};
  seed.settings.automation = { ...seed.settings.automation, autoRunOnSave: false };
  seed.associates = [{ id: 'notice-associate', linkedMemberId: 'member-1', email: 'lucia@isocronazero.org', status: 'Activa', annualAmount: 50, yearlyFees: { [new Date().getFullYear()]: 50 } }];
  seed.members = seed.members.map(member => ({ ...member, associateId: member.id === 'member-1' ? 'notice-associate' : '' }));
  seed.accounts = seed.accounts.map(account => ({ ...account, associateId: account.memberId === 'member-1' ? 'notice-associate' : '' }));
  seed.courses[0].enrolledIds = ['member-1'];
  seed.courses[0].waitingIds = [];
  seed.courses[0].diplomaReady = [];
  return seed;
}

function createJsonClient(label, baseUrl) {
  const cookies = new Map();

  return {
    async request(method, requestPath, body, options = {}) {
      const headers = { Accept: "application/json", ...(options.headers || {}) };
      const cookieHeader = Array.from(cookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");

      if (cookieHeader) {
        headers.Cookie = cookieHeader;
      }

      let payload;
      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        payload = JSON.stringify(body);
      }

      const response = await fetch(new URL(requestPath, baseUrl), {
        method,
        headers,
        body: payload
      });

      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        const cookiePair = setCookie.split(";")[0];
        const separator = cookiePair.indexOf("=");
        if (separator > 0) {
          cookies.set(cookiePair.slice(0, separator), cookiePair.slice(separator + 1));
        }
      }

      const text = await response.text();
      const parsedBody = options.raw ? text : text ? JSON.parse(text) : null;
      if (!response.ok && options.allowFailure !== true) {
        throw new Error(`${label} ${method} ${requestPath} -> ${response.status}: ${parsedBody?.error || text}`);
      }

      return {
        status: response.status,
        headers: Object.fromEntries(response.headers),
        body: parsedBody
      };
    }
  };
}

function startServer(port, baseUrl) {
  mkdirSync(tempDataDir, { recursive: true });
  writeFileSync(tempDefaultStatePath, JSON.stringify(buildSeedState(), null, 2));

  const child = spawn(process.execPath, ["server.js"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...(nodeModulesPath ? { NODE_PATH: nodeModulesPath } : {}),
      PORT: String(port),
      IZ_BASE_URL: baseUrl,
      IZ_DATA_DIR: tempDataDir,
      IZ_DEFAULT_STATE_PATH: tempDefaultStatePath,
      AUTOMATION_INTERVAL_MS: "3600000",
      IZ_RECOVERY_ADMIN_PASSWORD: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk) => {
    serverOut.push(String(chunk));
  });
  child.stderr.on("data", (chunk) => {
    serverErr.push(String(chunk));
  });

  return child;
}

async function waitForServer(baseUrl, attempts = 40) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(new URL("/healthz", baseUrl));
      if (response.ok) {
        return;
      }
    } catch (error) {
    }
    await delay(250);
  }

  throw new Error(`Servidor no disponible.\nSTDOUT:\n${serverOut.join("")}\nSTDERR:\n${serverErr.join("")}`);
}

async function login(client, email, password) {
  const response = await client.request("POST", "/api/login", {
    email,
    password
  });
  assert.equal(response.body?.ok, true, `Login esperado para ${email}`);
}

function assertNoPrivateNotificationFields(notifications, label) {
  for (const notification of notifications || []) {
    assert.equal(Object.prototype.hasOwnProperty.call(notification, "readByMemberIds"), false, `${label} no debe exponer readByMemberIds`);
    assert.equal(Object.prototype.hasOwnProperty.call(notification, "memberId"), false, `${label} no debe exponer memberId`);
    assert.equal(Object.prototype.hasOwnProperty.call(notification, "createdByMemberId"), false, `${label} no debe exponer createdByMemberId`);
  }
}

function countUnreadNotifications(notifications = []) {
  return notifications.filter((notification) => notification?.read !== true).length;
}

async function main() {
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = startServer(port, baseUrl);

  try {
    await waitForServer(baseUrl);

    const adminClient = createJsonClient("admin", baseUrl);
    const memberClient = createJsonClient("member", baseUrl);
    const secondMemberClient = createJsonClient("member-2", baseUrl);

    await login(adminClient, "admin@isocronazero.org", "campus123");
    await login(memberClient, "lucia@isocronazero.org", "bomberos123");
    await login(secondMemberClient, "javier@isocronazero.org", "bomberos123");

    const adminStateResponse = await adminClient.request("GET", "/api/state");
    const memberOne = (adminStateResponse.body?.members || []).find((member) => member.email === "lucia@isocronazero.org");
    const memberTwo = (adminStateResponse.body?.members || []).find((member) => member.email === "javier@isocronazero.org");
    assert.ok(memberOne?.id, "Debe existir Lucia en el state de prueba");
    assert.ok(memberTwo?.id, "Debe existir Javier en el state de prueba");

    const anonymous = createJsonClient("anonymous", baseUrl);
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
    const pdf = Buffer.from('%PDF-1.4\nAviso de prueba\n%%EOF').toString('base64');
    const attachments = [{ name: 'imagen.png', contentBase64: png }, { name: 'Documento.pdf', contentBase64: pdf }];
    const payload = { title: 'Aviso con archivos', detail: 'Documentación de entrenamiento', audience: 'all', attachments, clientRequestId: 'notice-check-request-0001' };
    const stale = adminStateResponse.body;
    let result = await adminClient.request('POST', '/api/campus-notices', payload);
    const notice = result.body.notice;
    assert.equal(notice.attachments.length, 2);
    assert.ok(!JSON.stringify(result.body).includes('contentBase64'));
    const route = `/api/notices/campus/${notice.id}`;
    const fileRoute = notice.attachments[1].transportUrl;
    assert.equal((await anonymous.request('GET', route, undefined, { allowFailure: true })).status, 401);
    assert.equal((await anonymous.request('GET', fileRoute, undefined, { allowFailure: true })).status, 401);
    assert.equal((await memberClient.request('POST', '/api/campus-notices', payload, { allowFailure: true })).status, 403);
    assert.equal((await memberClient.request('GET', route)).body.notice.title, payload.title);
    const file = await memberClient.request('GET', fileRoute, undefined, { raw: true });
    assert.equal(file.body, Buffer.from(pdf, 'base64').toString());
    assert.equal(file.headers['cache-control'], 'private, no-store');
    assert.equal(file.headers['x-content-type-options'], 'nosniff');
    assert.match(file.headers['content-disposition'], /^inline/);
    assert.match((await memberClient.request('GET', `${fileRoute}?download=1`, undefined, { raw: true })).headers['content-disposition'], /^attachment/);
    result = await adminClient.request('POST', '/api/campus-notices', payload);
    assert.equal(result.body.notice.id, notice.id, 'Retries cannot publish twice');
    assert.equal(result.body.duplicate, true);
    const personal = (await adminClient.request('POST', '/api/member-notifications', {
      title: 'Solo Lucía', body: 'Documento privado', targetType: 'member', memberId: memberOne.id, attachments,
      clientRequestId: 'personal-check-request-0001'
    })).body.notification;
    const personalRoute = `/api/notices/member/${personal.id}`;
    assert.equal((await memberClient.request('GET', personalRoute)).status, 200);
    assert.equal((await secondMemberClient.request('GET', personalRoute, undefined, { allowFailure: true })).status, 404);
    assert.equal((await secondMemberClient.request('GET', personal.attachments[0].transportUrl, undefined, { allowFailure: true })).status, 404);
    const word = (await adminClient.request('POST', '/api/campus-notices', { ...payload, clientRequestId: 'word-check-request-0001',
      attachments: [{ name: 'Guía.docx', contentBase64: Buffer.from('504b0304', 'hex').toString('base64') }] })).body.notice;
    assert.match((await memberClient.request('GET', word.attachments[0].transportUrl, undefined, { raw: true })).headers['content-disposition'], /^attachment/);
    for (const badFiles of [
      [{ name: 'test.svg', contentBase64: Buffer.from('<svg/>').toString('base64') }],
      [{ name: 'fake.png', contentBase64: pdf }],
      [{ name: 'empty.pdf', contentBase64: '' }],
      Array(6).fill(attachments[0]),
      [{ name: 'large.pdf', contentBase64: Buffer.alloc(5 * 1024 * 1024 + 1).toString('base64') }]
    ]) {
      assert.equal((await adminClient.request('POST', '/api/campus-notices', { ...payload, clientRequestId: undefined, attachments: badFiles }, { allowFailure: true })).status, 400);
    }
    for (const audience of ['associates', 'active-associates', 'course', 'campus-only']) {
      const scoped = (await adminClient.request('POST', '/api/campus-notices', { ...payload, clientRequestId: undefined, audience, courseId: stale.courses[0].id })).body.notice;
      const ownAllowed = audience !== 'campus-only';
      assert.equal((await memberClient.request('GET', `/api/notices/campus/${scoped.id}`, undefined, { allowFailure: true })).status, ownAllowed ? 200 : 404, audience);
      assert.equal((await secondMemberClient.request('GET', scoped.attachments[1].transportUrl, undefined, { allowFailure: true, raw: ownAllowed ? false : true })).status, ownAllowed ? 404 : 200, audience);
      const oneState = (await memberClient.request('GET', '/api/state')).body;
      assert.equal(oneState.manualCampusNotices.some(item => item.id === scoped.id), ownAllowed, 'JSON state must respect audience');
      assert.ok(!JSON.stringify(oneState).includes(png), 'File data must never travel in general state');
    }
    const queued = (await adminClient.request('POST', '/api/campus-notices', { ...payload, clientRequestId: 'mail-check-request-0001', sendEmail: true })).body;
    assert.ok(queued.queuedEmails > 0);
    await adminClient.request('POST', '/api/campus-notices', { ...payload, clientRequestId: 'mail-check-request-0001', sendEmail: true });
    const mailedState = (await adminClient.request('GET', '/api/state')).body;
    assert.equal(mailedState.emailOutbox.filter(mail => mail.manualNoticeId === queued.notice.id).length, queued.queuedEmails);
    await memberClient.request('POST', `/api/member-notifications/${personal.id}/read`, {});
    await adminClient.request('POST', '/api/state', stale);
    const preserved = (await adminClient.request('GET', '/api/state')).body;
    assert.equal(preserved.emailOutbox.filter(mail => mail.manualNoticeId === queued.notice.id).length, queued.queuedEmails);
    assert.ok(preserved.manualCampusNotices.some(item => item.id === notice.id), 'Old desktop state cannot remove a new mobile notice');
    assert.ok(preserved.memberNotifications.find(item => item.id === personal.id).readByMemberIds.includes(memberOne.id));
    assert.equal((await memberClient.request('GET', fileRoute, undefined, { raw: true })).body, file.body);
    await adminClient.request('PATCH', route, { active: false });
    assert.equal((await memberClient.request('GET', fileRoute, undefined, { allowFailure: true })).status, 404);
    await adminClient.request('PATCH', route, { active: true });
    assert.equal((await memberClient.request('GET', route)).status, 200);
    await adminClient.request('DELETE', route);
    await adminClient.request('POST', '/api/state', preserved);
    assert.equal((await memberClient.request('GET', fileRoute, undefined, { allowFailure: true })).status, 404, 'Deleted notices must not be resurrected');
    if (process.env.NOTICE_BROWSER === '1') await browserChecks(baseUrl, png, pdf);
    console.log('Notice checks passed: attachments, access, audiences, idempotency, email queue and concurrent state preservation.');
  } finally {
    server.kill("SIGTERM");
    await delay(250);
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  rmSync(tempRoot, { recursive: true, force: true });
  process.exit(1);
});

async function browserChecks(baseUrl, png, pdf) {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined, args: ['--no-sandbox'] });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => errors.push(error.message));
  const loginUI = async (target, email, password) => {
    await target.locator('#loginEmail').fill(email);
    await target.locator('#loginPassword').fill(password);
    await target.locator('#loginForm button[type="submit"]').click();
  };
  try {
    console.log("Browser: login and create");
    await page.goto(baseUrl);
    await loginUI(page, 'admin@isocronazero.org', 'campus123');
    await page.locator('#loginScreen').waitFor({ state: 'hidden' });
    await page.locator('[data-action="nav"][data-view="campus"]').first().click();
    await page.locator('[data-action="set-campus-section-mode"][data-mode="alerts"]').first().click();
    await page.locator('#manualNoticeTitle').fill('Práctica de rescate · documentos e imágenes');
    await page.locator('#manualNoticeDetail').fill('Revisa el documento antes de la práctica.\nTrae tu equipo personal.');
    await page.locator('#manualNoticeAttachments').setInputFiles([
      { name: 'Cartel-de-la-proxima-practica-con-nombre-largo.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') },
      { name: 'Programa.pdf', mimeType: 'application/pdf', buffer: Buffer.from(pdf, 'base64') }
    ]);
    let loseResponse = true;
    await page.route('**/api/campus-notices', async route => {
      if (loseResponse && route.request().method() === 'POST') {
        loseResponse = false;
        await route.fetch();
        await route.abort('failed');
      } else await route.continue();
    });
    console.log('Browser: publish');
    await page.locator('[data-action="publish-manual-campus-notice"]').click();
    await page.waitForFunction(() => !document.querySelector('[data-action="publish-manual-campus-notice"]').disabled);
    assert.equal(await page.locator('#manualNoticeTitle').inputValue(), 'Práctica de rescate · documentos e imágenes');
    assert.equal(await page.locator('#manualNoticeAttachments').evaluate(input => input.files.length), 2, 'Files survive a failed confirmation');
    console.log('Browser: publish');
    await page.locator('[data-action="publish-manual-campus-notice"]').click();
    await page.waitForFunction(() => document.querySelector('#manualNoticeTitle')?.value === '');
    const saved = await page.evaluate(async () => (await (await fetch('/api/state')).json()).manualCampusNotices.filter(item => item.title.startsWith('Práctica de rescate')));
    assert.equal(saved.length, 1, 'Retry from UI must not duplicate the notice');
    const card = page.locator('#automationSectionNotices .timeline-item').filter({ hasText: 'Práctica de rescate' });
    assert.equal(await card.locator('img').count(), 1);
    assert.ok(await card.locator('img').evaluate(img => img.complete && img.naturalWidth > 0));
    const share = new URL(await card.locator('a[href^="https://wa.me/"]').getAttribute('href'));
    assert.ok(share.searchParams.get('text').includes('Práctica de rescate'));
    assert.ok(!share.searchParams.get('text').includes('Trae tu equipo'), 'Share only title and link');
    const directLink = await card.getByRole('link', { name: 'Abrir aviso', exact: true }).getAttribute('href');
    assert.ok(share.searchParams.get('text').includes(directLink));
    const screenshots = process.env.NOTICE_SCREENSHOTS || tempRoot;
    mkdirSync(screenshots, { recursive: true });
    await card.screenshot({ path: path.join(screenshots, 'notice-admin.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.getElementById('sidebar').getBoundingClientRect().right <= 0);
    await page.locator('#manualNoticeTitle').fill('Aviso publicado desde móvil');
    await page.locator('#manualNoticeDetail').fill('Publicación de prueba desde una pantalla de 390 píxeles.');
    await page.locator('#manualNoticeAttachments').setInputFiles({ name: 'Foto.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
    await page.locator('[data-action="publish-manual-campus-notice"]').click();
    await page.waitForFunction(() => document.querySelector('#manualNoticeTitle')?.value === '');
    await card.scrollIntoViewIfNeeded();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Mobile portal must fit');
    await page.screenshot({ path: path.join(screenshots, 'notice-admin-mobile.png'), animations: 'disabled' });
    const memberContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const member = await memberContext.newPage();
    member.setDefaultTimeout(15000);
    member.on('pageerror', error => errors.push(error.message));
    await member.goto(directLink);
    await member.getByRole('link', { name: 'Iniciar sesión', exact: true }).click();
    await loginUI(member, 'lucia@isocronazero.org', 'bomberos123');
    await member.waitForURL(directLink);
    await member.getByRole('heading', { name: 'Práctica de rescate · documentos e imágenes' }).waitFor();
    assert.equal(await member.locator('.notice-file').count(), 2);
    const downloadPromise = member.waitForEvent('download');
    await member.getByRole('link', { name: 'Descargar', exact: true }).last().click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'Programa.pdf');
    for (const width of [320, 390, 1440]) {
      await member.setViewportSize({ width, height: 900 });
      assert.ok(await member.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Notice must fit ${width}px`);
    }
    await member.setViewportSize({ width: 390, height: 844 });
    await member.screenshot({ path: path.join(screenshots, 'notice-member-mobile.png'), fullPage: true });
    await member.goto(baseUrl);
    await member.locator('#loginScreen').waitFor({ state: 'hidden' });
    await member.locator('[data-action="open-member-campus-mode"][data-mode="alerts"]').first().click();
    await member.getByRole('link', { name: 'Abrir aviso', exact: true }).first().waitFor();
    const htmlPayload = { title: '<img src=x onerror=alert(1)>', detail: '<script>alert(1)</script>', audience: 'all' };
    const xss = await page.evaluate(async body => (await (await fetch('/api/campus-notices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json()).notice, htmlPayload);
    await page.goto(`${baseUrl}/aviso.html?kind=campus&id=${xss.id}`);
    await page.getByRole('heading', { name: htmlPayload.title, exact: true }).waitFor();
    assert.equal(await page.locator('#noticeContent script, #noticeContent img').count(), 0);
    assert.deepEqual(errors, []);
    console.log('Browser checks passed: mobile/desktop publication, lost response retry, login return, images, downloads and WhatsApp link (no messages sent).');
  } finally { await browser.close(); }
}
