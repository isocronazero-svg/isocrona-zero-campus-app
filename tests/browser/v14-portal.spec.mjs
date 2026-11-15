import { test, expect, devices, webkit } from "@playwright/test";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const email = (id) => `v14-${id}@example.test`;
const noticeTitle = "Cambio de horario de la jornada QA";

function dayFromNow(days) {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

async function createCampus() {
  const portProbe = createServer().listen(0, "127.0.0.1");
  await once(portProbe, "listening");
  const port = portProbe.address().port;
  await new Promise((resolve) => portProbe.close(resolve));
  const baseURL = `http://127.0.0.1:${port}`;
  const folder = await mkdtemp(join(tmpdir(), "iz-v14-"));
  const seedPath = join(folder, "seed.json");
  const seed = JSON.parse(await readFile(join(root, "data/qa-private-seed.json"), "utf8"));
  const password = `Synthetic-V14-${randomUUID()}`;
  const year = new Date().getUTCFullYear();
  const users = {
    member: { name: "Socio QA V14", associateId: "associate-member" },
    limited: { name: "Cuota pendiente QA", associateId: "associate-limited" },
    external: { name: "Participante QA" },
    admin: { name: "Administración QA", role: "admin" }
  };
  seed.accounts = Object.entries(users).map(([id, user]) => ({
    ...user, id: `account-${id}`, email: email(id), password, memberId: id,
    role: user.role || "member", mustChangePassword: false
  }));
  seed.members = seed.accounts.map(({ memberId, name, email, associateId }) => ({
    id: memberId, name, email, associateId, dni: "00000000T", certifications: []
  }));
  seed.associates = ["member", "limited"].map((id) => ({
    id: `associate-${id}`, firstName: users[id].name, lastName: "Sintético",
    email: email(id), status: "Activo", linkedMemberId: id, linkedAccountId: `account-${id}`,
    annualAmount: 50, campusAccessStatus: "active",
    yearlyFees: id === "member" ? { [year - 1]: 50, [year]: 50, [year + 1]: 50 } : {}
  }));
  seed.memberNotifications = [
    { id: "notice-qa-important", title: noticeTitle, body: "La práctica comienza a las 09:30.",
      targetType: "member", memberId: "member", priority: "important", createdAt: dayFromNow(0) }
  ];
  seed.courses = [
    { id: "public-qa", title: "Jornada pública QA", courseClass: "practico", accessScope: "public",
      status: "Inscripcion abierta", startDate: dayFromNow(10), endDate: dayFromNow(10),
      capacity: 10, hours: 8, enrollmentFee: 30, memberEnrollmentFee: 30, nonMemberEnrollmentFee: 60 },
    { id: "member-qa", title: "Jornada para socios QA", courseClass: "practico", accessScope: "members",
      status: "Inscripcion abierta", startDate: dayFromNow(15), endDate: dayFromNow(15),
      capacity: 8, hours: 8, enrollmentFee: 0 }
  ];
  await writeFile(seedPath, JSON.stringify(seed));
  const inherited = Object.fromEntries(["PATH", "HOME", "TMPDIR", "SYSTEMROOT"]
    .filter((key) => process.env[key]).map((key) => [key, process.env[key]]));
  const child = spawn(process.execPath, ["server-entry.js"], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...inherited, NODE_ENV: "test", TZ: "Europe/Madrid", HOST: "127.0.0.1", PORT: String(port),
      IZ_BASE_URL: baseURL, IZ_DATA_DIR: join(folder, "data"), IZ_DEFAULT_STATE_PATH: seedPath,
      IZ_QA_ISOLATED: "true", IZ_EMAIL_ENABLED: "false", DATABASE_URL: "", AUTOMATION_INTERVAL_MS: "86400000" }
  });
  const exited = once(child, "exit");
  let logs = "";
  child.stdout.on("data", (chunk) => { logs += chunk; });
  child.stderr.on("data", (chunk) => { logs += chunk; });
  async function close() {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
    await exited;
    await rm(folder, { force: true, recursive: true });
  }
  try {
    await expect.poll(async () => {
      try { return (await fetch(`${baseURL}/healthz`)).status; } catch { return 0; }
    }, { timeout: 15_000 }).toBe(200);
  } catch (cause) {
    await close();
    throw new Error(`El servidor QA no arrancó: ${logs}`, { cause });
  }
  return { baseURL, password, close };
}

async function openAs(browser, campus, user, options = {}) {
  const context = await browser.newContext({ ...options, reducedMotion: "reduce", serviceWorkers: "block" });
  await context.route("**/*", (route) => new URL(route.request().url()).origin === campus.baseURL
    ? route.continue() : route.abort());
  const page = await context.newPage();
  await page.goto(campus.baseURL);
  await page.locator("#loginEmail").fill(email(user));
  await page.locator("#loginPassword").fill(campus.password);
  await page.locator('#loginForm button[type="submit"]').click();
  await expect(page.locator("#loginScreen")).toBeHidden();
  return page;
}

const profiles = [
  { name: "Escritorio", browserName: "chromium", options: { viewport: { width: 1440, height: 1000 } } },
  { name: "Android emulado", browserName: "chromium", options: devices["Pixel 7"] },
  { name: "iPhone emulado", browserName: "webkit", options: devices["iPhone 13"] }
];

for (const { name, browserName, options } of profiles) {
  test.describe(name, () => {
    test.skip(browserName === "webkit" && process.env.IZ_SKIP_WEBKIT === "1", "WebKit no disponible en este entorno local");

    test("socio inicia, consulta un aviso y vuelve desde cursos y certificados", async ({ browser }, testInfo) => {
      const campus = await createCampus();
      let page;
      let webkitBrowser;
      try {
        if (browserName === "webkit") webkitBrowser = await webkit.launch();
        page = await openAs(webkitBrowser || browser, campus, "member", options);
        const panel = page.locator("#mainPanel");
        const nav = page.locator(options.isMobile ? "#memberQuickNav" : "#nav");
        await expect(panel.getByRole("heading", { name: "Inicio", exact: true })).toBeVisible();
        await expect(panel.getByText(noticeTitle)).toBeVisible();
        await expect(panel.getByRole("heading", { name: "Jornada pública QA" })).toBeVisible();
        await expect(nav.getByRole("button", { name: /^Avisos/ })).toContainText("1");

        for (const button of await nav.getByRole("button").all()) {
          const box = await button.boundingBox();
          if (!box) continue;
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(options.viewport.width + 1);
        }

        await nav.getByRole("button", { name: /^Avisos/ }).click();
        const notice = panel.locator(".member-notice").filter({ hasText: noticeTitle });
        await expect(notice).toContainText("La práctica comienza a las 09:30.");
        await notice.getByRole("button", { name: "Marcar como leido" }).click();
        await expect(notice.locator(".notice-status")).toHaveText("Leido");
        await expect(nav.locator(".notice-count")).toHaveCount(0);

        await nav.getByRole("button", { name: "Cursos", exact: true }).click();
        await expect(panel.getByRole("heading", { name: "Jornada pública QA" })).toBeVisible();
        await nav.getByRole("button", { name: "Mis certificados", exact: true }).click();
        await expect(panel.locator("#campusSectionDiplomas")).toBeVisible();
        await nav.getByRole("button", { name: "Inicio", exact: true }).click();
        await expect(nav.getByRole("button", { name: "Inicio", exact: true })).toHaveAttribute("aria-current", "page");
        await expect(panel.getByRole("heading", { name: "Inicio", exact: true })).toBeVisible();
        await expect(panel.getByText(noticeTitle)).toHaveCount(0);
        await testInfo.attach("Inicio con datos ficticios", {
          body: await page.screenshot({ fullPage: true }), contentType: "image/png"
        });

        if (options.isMobile) {
          await page.getByRole("button", { name: "Abrir menú principal" }).click();
          await expect(page.locator("#nav").getByRole("button", { name: "Grupos internos" })).toBeVisible();
          await page.keyboard.press("Escape");
          await expect(page.getByRole("button", { name: "Abrir menú principal" })).toBeFocused();
        }
      } finally {
        await page?.context().close();
        await webkitBrowser?.close();
        await campus.close();
      }
    });
  });
}

test("la navegación aplica los accesos de socio, externo, cuota pendiente y administración", async ({ browser }) => {
  const campus = await createCampus();
  const contexts = [];
  try {
    const external = await openAs(browser, campus, "external");
    contexts.push(external.context());
    await expect(external.locator("#nav").getByRole("button", { name: "Grupos internos" })).toHaveCount(0);
    await expect(external.locator("#nav").getByRole("button", { name: "Zona Test" })).toHaveCount(0);
    await expect(external.locator("#mainPanel").getByText(noticeTitle)).toHaveCount(0);
    await expect(external.locator("#mainPanel").getByText("Jornada para socios QA")).toHaveCount(0);
    await expect(external.locator("#mainPanel").getByText("Jornada pública QA")).toBeVisible();
    expect((await external.request.get(`${campus.baseURL}/api/course-finance`)).status()).toBe(403);

    const limited = await openAs(browser, campus, "limited");
    contexts.push(limited.context());
    await expect(limited.locator("#mainPanel").getByRole("heading", { name: "Mi perfil", exact: true })).toBeVisible();
    await expect(limited.locator("#nav").getByRole("button")).toHaveCount(1);
    await expect(limited.locator("#memberQuickNav")).toBeHidden();

    const admin = await openAs(browser, campus, "admin");
    contexts.push(admin.context());
    await expect(admin.locator("#courseFinanceNavButton")).toBeVisible();
    await expect(admin.locator("#memberQuickNav")).toBeHidden();
    await admin.locator("#roleSwitcher").selectOption("member-self");
    await expect(admin.locator("#mainPanel").getByRole("heading", { name: "Inicio", exact: true })).toBeVisible();
    await expect(admin.locator("#courseFinanceNavButton")).toHaveCount(0);
    await admin.locator("#roleSwitcher").selectOption("admin");
    await expect(admin.locator("#courseFinanceNavButton")).toBeVisible();
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
    await campus.close();
  }
});
