import { test, expect, devices, webkit } from "@playwright/test";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

test.skip(process.env.IZ_V14_ACCEPTANCE !== "1", "V1.4 acceptance runs in its dedicated workflow");

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
      capacity: 8, hours: 8, enrollmentFee: 0 },
    { id: "history-qa", title: "Práctica realizada QA", courseClass: "practico", status: "Cerrado",
      startDate: dayFromNow(-15), endDate: dayFromNow(-15), hours: 8,
      capacity: 8, enrolledIds: ["member"], attendance: {}, evaluations: {}, feedbackEnabled: false,
      enrollmentSubmissions: [{ id: "history-enrollment", memberId: "member", status: "confirmed",
        amount: 0, paymentStatus: "not-required", participantType: "member" }] }
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
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.goto(campus.baseURL);
  await page.locator("#loginEmail").fill(email(user));
  await page.locator("#loginPassword").fill(campus.password);
  await page.locator('#loginForm button[type="submit"]').click();
  await expect(page.locator("#loginScreen")).toBeHidden();
  const panel = page.locator("#mainPanel");
  await expect.poll(async () => (await panel.innerText().catch(() => "")).trim().length, { timeout: 10_000 }).toBeGreaterThan(0);
  console.log(`[V1.4 QA ${user}] panel=${JSON.stringify((await panel.innerText()).slice(0, 1100))} errors=${JSON.stringify(browserErrors)}`);
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
        await expect(panel.getByRole("heading", { name: "Mi aula", exact: true })).toBeVisible();
        await expect(panel.getByText(noticeTitle)).toBeVisible();
        await expect(panel.getByText("2 curso(s) con inscripción abierta")).toBeVisible();

        for (const button of await nav.getByRole("button").all()) {
          const box = await button.boundingBox();
          if (!box) continue;
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(options.viewport.width + 1);
        }

        console.log(`[V1.4 QA notice] buttons=${JSON.stringify(await panel.getByRole("button").allTextContents())} notices=${await panel.locator(".member-notice").count()}`);
        console.log("[V1.4 QA notice] marking read");
        await panel.getByRole("button", { name: "Marcar como leido" }).click({ timeout: 12000 });
        console.log("[V1.4 QA notice] marked read");
        const notice = panel.locator(".member-notice").filter({ hasText: noticeTitle });
        await expect(notice).toContainText("La práctica comienza a las 09:30.");
        await expect(notice.locator(".notice-status")).toHaveText("Leido");
        await expect(panel.getByText("0 aviso(s) pendiente(s)")).toBeVisible();

        console.log("[V1.4 QA navigation] opening courses");
        await panel.locator('button[data-action="open-member-campus-mode"][data-mode="courses"]').click({ timeout: 12000 });
        console.log("[V1.4 QA navigation] courses opened");
        await expect(panel.getByText("Jornada pública QA", { exact: true }).first()).toBeVisible();
        if (options.isMobile) await page.getByRole("button", { name: "Abrir menú principal" }).click();
        await page.locator("#nav").getByRole("button", { name: "Mis diplomas", exact: true }).click({ timeout: 12000 });
        await expect(panel.locator("#campusSectionDiplomas")).toBeVisible();
        if (options.isMobile) await page.getByRole("button", { name: "Abrir menú principal" }).click();
        await page.locator("#nav").getByRole("button", { name: "Mi aula", exact: true }).click();
        console.log(`[V1.4 QA return home] ${JSON.stringify((await panel.innerText()).slice(0,1800))}`);
        await expect(panel.getByRole("heading", { name: "Mi aula", exact: true })).toBeVisible();
        await expect(panel.locator(".member-notice").filter({ hasText: noticeTitle }).locator(".notice-status")).toHaveText("Leido");
        await expect(panel.getByText("0 aviso(s) pendiente(s)")).toBeVisible();
        await testInfo.attach("Inicio con datos ficticios", {
          body: await page.screenshot({ fullPage: true }), contentType: "image/png"
        });

        if (options.isMobile) {
          await page.getByRole("button", { name: "Abrir menú principal" }).click();
          await expect(page.locator("#nav").getByRole("button", { name: "Zona Test", exact: true })).toBeVisible();
          await page.keyboard.press("Escape");
          await expect(page.getByRole("button", { name: "Abrir menú principal" })).toBeFocused();
        }
      } finally {
        await page?.context().close();
        await webkitBrowser?.close();
        await campus.close();
      }
    });

    test("inscripción, justificante, cobro, acreditación, baja e historial con datos ficticios", async ({ browser }) => {
      const campus = await createCampus();
      let member;
      let admin;
      let other;
      let webkitBrowser;
      try {
        if (browserName === "webkit") webkitBrowser = await webkit.launch();
        const engine = webkitBrowser || browser;
        member = await openAs(engine, campus, "member", options);
        admin = await openAs(engine, campus, "admin", options);
        const panel = member.locator("#mainPanel");
        const nav = member.locator(options.isMobile ? "#memberQuickNav" : "#nav");
        const course = panel.locator('[data-course-card-id="public-qa"]');
        const certificatePath = `${campus.baseURL}/api/member/courses/public-qa/enrollment-certificate.pdf?download=1`;

        await panel.locator('button[data-action="open-member-campus-mode"][data-mode="courses"]').click();
        await course.getByRole("button", { name: "Inscribirme ahora" }).click();
        await expect(panel.locator("#courseEnrollmentForm")).toBeVisible();
        const enrollment = member.waitForResponse((response) =>
          response.url().endsWith("/courses/public-qa/enroll") && response.request().method() === "POST");
        await panel.getByRole("button", { name: "Confirmar inscripcion" }).click();
        expect((await enrollment).status()).toBe(200);
        await expect(panel.locator("#courseEnrollmentSubmissionState")).toContainText("Pendiente de justificante");
        expect((await member.request.get(certificatePath)).status()).toBe(404);

        if (options.isMobile) await member.getByRole("button", { name: "Abrir menú principal" }).click();
        await member.locator("#nav").getByRole("button", { name: "Campus", exact: true }).click();
        await panel.getByRole("button", { name: /^Mis cursos/ }).click();
        console.log(`[V1.4 QA enrolled] cards=${await panel.locator('[data-course-card-id="public-qa"]').count()} panel=${JSON.stringify((await panel.innerText()).slice(0,4000))}`);
        await expect(course).toContainText("Inscrito");
        console.log(`[V1.4 QA course controls] ${JSON.stringify(await course.getByRole("button").allTextContents())}`);
        await course.getByRole("button", { name: "Entrar al aula" }).click({ timeout: 12000 });
        console.log(`[V1.4 QA course detail] ${JSON.stringify((await panel.innerText()).slice(0,4000))}`);
        await panel.getByRole("button", { name: "Ver ficha del curso" }).click({ timeout: 12000 });
        console.log(`[V1.4 QA course enrollment details] ${JSON.stringify((await panel.innerText()).slice(0,6000))}`);
        await panel.getByRole("button", { name: "Ver inscripción", exact: true }).click({ timeout: 12000 });
        console.log(`[V1.4 QA enrollment tab] ${JSON.stringify((await panel.innerText()).slice(0,4000))}`);
        await expect(panel.locator("#courseEnrollmentProofUpdate")).toHaveCount(1);

        const proof = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRlcAAAAASUVORK5CYII=", "base64");
        await panel.locator("#courseEnrollmentProofUpdate").setInputFiles({
          name: "justificante-ficticio.png", mimeType: "image/png", buffer: proof
        });
        const proofResponse = member.waitForResponse((response) =>
          response.url().endsWith("/courses/public-qa/enrollment-proof") && response.request().method() === "POST");
        await panel.getByRole("button", { name: "Enviar justificante" }).click();
        expect((await proofResponse).status()).toBe(200);
        await expect(panel.locator("#courseEnrollmentSubmissionState")).toContainText("justificante-ficticio.png");

        const financeURL = `${campus.baseURL}/api/course-finance`;
        const financeBefore = await (await admin.request.get(financeURL)).json();
        const row = financeBefore.courses.find(({ id }) => id === "public-qa").rows[0];
        expect(row).toMatchObject({ amount: 30, paymentStatus: "pending", hasPaymentProof: true });
        const rowURL = `${financeURL}/courses/public-qa/submissions/${row.submissionId}`;
        const proofAccess = await admin.request.get(`${rowURL}/proof`);
        expect(proofAccess.status()).toBe(200);
        expect(await proofAccess.body()).toEqual(proof);
        expect((await member.request.get(`${rowURL}/proof`)).status()).toBe(403);
        expect((await member.request.patch(rowURL, { data: { paymentStatus: "validated" } })).status()).toBe(403);

        if (options.isMobile) await admin.getByRole("button", { name: "Abrir menú principal" }).click();
        await admin.locator("#courseFinanceNavButton").click();
        const financeDialog = admin.locator("#courseFinanceDialog");
        const financeRow = financeDialog.locator(".course-finance-row").filter({ hasText: "Socio QA V14" });
        admin.once("dialog", (dialog) => dialog.accept());
        const payment = admin.waitForResponse((response) => response.url() === rowURL && response.request().method() === "PATCH");
        await financeRow.getByRole("button", { name: "Validar pago" }).click();
        expect((await (await payment).json()).row.paymentStatus).toBe("validated");
        await financeDialog.locator("[data-finance-close]").click();
        expect((await member.request.get(certificatePath)).status()).toBe(404);

        await admin.reload();
        if (options.isMobile) await admin.getByRole("button", { name: "Abrir menú principal" }).click();
        await admin.locator("#nav").getByRole("button", { name: "Campus", exact: true }).click();
        await admin.locator('[data-course-card-id="public-qa"]').getByRole("button", { name: "Gestionar curso" }).click();
        await admin.getByRole("button", { name: /Inscripciones y pagos/ }).click();
        const ledger = admin.locator("#courseStudentsLedger");
        const validateEnrollment = ledger.getByRole("button", { name: "Validar", exact: true });
        await expect(validateEnrollment).toBeVisible();
        const status = admin.waitForResponse((response) => response.url().endsWith(`/${row.submissionId}/status`));
        await validateEnrollment.click();
        expect((await status).status()).toBe(200);
        await expect(ledger).toContainText("Confirmada");

        await member.reload();
        await nav.getByRole("button", { name: "Campus", exact: true }).click();
        await panel.getByRole("button", { name: /^Mis cursos/ }).click();
        await expect(course).toContainText("Inscrito");
        await course.getByRole("button", { name: "Entrar al aula" }).click();
        await panel.getByRole("button", { name: "Ver ficha del curso" }).click();
        await panel.getByRole("button", { name: "Ver inscripción", exact: true }).click();
        await expect(panel.locator("#courseEnrollmentSubmissionState")).toContainText("Confirmada");
        await panel.getByRole("button", { name: "Certificado de inscripción", exact: true }).click();
        const courseCertificate = panel.getByRole("link", { name: /Descargar certificado de inscripción/ });
        await expect(courseCertificate).toHaveAttribute("href", new URL(certificatePath).pathname + "?download=1");

        if (options.isMobile) await member.getByRole("button", { name: "Abrir menú principal" }).click();
        await nav.getByRole("button", { name: "Mis diplomas", exact: true }).click();
        const diplomas = panel.locator("#campusSectionDiplomas");
        await expect(diplomas.getByText("Jornada pública QA", { exact: true })).toBeVisible();
        await expect(diplomas.getByText("Pendiente de cierre").first()).toBeVisible();
        expect((await member.request.get(certificatePath)).status()).toBe(200);
        const downloadPromise = member.waitForEvent("download");
        await member.evaluate((href) => { const link = document.createElement("a"); link.href = href; link.download = "certificado-inscripcion.pdf"; document.body.append(link); link.click(); link.remove(); }, new URL(certificatePath, campus.baseURL).toString());
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe("certificado-inscripcion.pdf");
        expect((await readFile(await download.path())).subarray(0, 4).toString()).toBe("%PDF");

        other = await openAs(engine, campus, "external", options);
        expect((await other.request.get(certificatePath)).status()).toBe(404);
        const diplomaURL = `${campus.baseURL}/api/diplomas/history-qa/member.pdf`;
        expect((await member.request.get(diplomaURL)).status()).toBe(403);
        const academic = `${campus.baseURL}/api/courses/history-qa/members/member`;
        const attendance = await admin.request.patch(`${academic}/academic`, { data: { attendance: 100, evaluation: "Apto" } });
        expect(attendance.status(), await attendance.text()).toBe(200);
        const generate = await admin.request.post(`${academic}/diploma`);
        expect(generate.status(), await generate.text()).toBe(200);
        expect((await other.request.get(diplomaURL)).status()).toBe(403);
        await member.reload();
        if (options.isMobile) await member.getByRole("button", { name: "Abrir menú principal" }).click();
        await nav.getByRole("button", { name: "Mis diplomas", exact: true }).click();
        const diploma = panel.locator("article.table-card").filter({ hasText: "Práctica realizada QA" });
        await expect(diploma).toContainText("100% asistencia");
        const diplomaPromise = member.waitForEvent("download");
        await diploma.getByRole("link", { name: "Descargar PDF", exact: true }).click();
        const diplomaBytes = await readFile(await (await diplomaPromise).path());
        expect(diplomaBytes.subarray(0, 4).toString()).toBe("%PDF");
        expect(diplomaBytes.includes(Buffer.from("CERTIFICADO DE APROVECHAMIENTO"))).toBe(true);
        await expect(panel.getByRole("link", { name: "Descargar PDF acumulado" })).toBeVisible();

        await ledger.locator(".course-ledger-risk-actions").getByText("Otras acciones").click();
        await ledger.getByRole("button", { name: "Dar de baja" }).click();
        const cancellationForm = admin.getByRole("dialog", { name: "Dar de baja al alumno" });
        await expect(cancellationForm).toBeVisible();
        await cancellationForm.locator('textarea[name="reason"]').fill("Baja ficticia QA");
        await cancellationForm.locator('input[name="amount"]').fill("30");
        const cancel = admin.waitForResponse((response) => response.url().endsWith(`/${row.submissionId}/cancel`));
        await cancellationForm.getByRole("button", { name: "Confirmar baja" }).click();
        expect((await cancel).status()).toBe(200);
        await expect(cancellationForm).toHaveCount(0);
        await expect(ledger).toContainText("Baja registrada");
        expect((await member.request.get(certificatePath)).status()).toBe(404);
        admin.once("dialog", (dialog) => dialog.accept());
        const refund = admin.waitForResponse((response) => response.url().endsWith(`/${row.submissionId}/refund-confirm`));
        await ledger.getByRole("button", { name: /Confirmar devolución/ }).click();
        expect((await refund).status()).toBe(200);
        await expect(ledger).toContainText("Devueltos 30.00 €");
        const financeAfter = await (await admin.request.get(financeURL)).json();
        expect(financeAfter.courses.find(({ id }) => id === "public-qa")).toMatchObject({
          grossPaid: 30, refundsCompleted: 30, netPaid: 0
        });

        await member.reload();
        if (options.isMobile) await member.getByRole("button", { name: "Abrir menú principal" }).click();
        await nav.getByRole("button", { name: "Mis diplomas", exact: true }).click();
        await expect(panel.locator("#campusSectionDiplomas").getByRole("link", { name: /Descargar certificado de inscripción/ })).toHaveCount(0);
        await nav.getByRole("button", { name: "Campus", exact: true }).click();
        await panel.getByRole("button", { name: /^Historial/ }).click();
        await expect(course.locator(".member-course-status")).toContainText("Baja registrada");
        await expect(course.locator(".member-course-status")).toContainText("Devolución registrada");
        await expect(panel.locator('[data-course-card-id="history-qa"]')).toContainText("100 %");
      } finally {
        await Promise.allSettled([member?.context().close(), admin?.context().close(), other?.context().close()]);
        await Promise.allSettled([webkitBrowser?.close(), campus.close()]);
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
    await expect(external.locator("#mainPanel").getByText("1 curso(s) con inscripción abierta")).toBeVisible();
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
    await expect(admin.locator("#mainPanel").getByRole("heading", { name: "Mi aula", exact: true })).toBeVisible();
    await expect(admin.locator("#courseFinanceNavButton")).toHaveCount(0);
    await admin.locator("#roleSwitcher").selectOption("admin");
    await expect(admin.locator("#courseFinanceNavButton")).toBeVisible();
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
    await campus.close();
  }
});
