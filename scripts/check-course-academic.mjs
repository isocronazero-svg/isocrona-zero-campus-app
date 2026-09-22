import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const bundledDefaultStatePath = path.join(repoRoot, "data", "default-state.json");
const nodeModulesCandidates = [
  path.join(repoRoot, "node_modules"),
  path.join(path.dirname(repoRoot), "Isocrona Zero", "node_modules")
];
const nodeModulesPath = nodeModulesCandidates.find((candidate) => existsSync(candidate)) || "";
const tempRoot = mkdtempSync(path.join(os.tmpdir(), "iz-course-academic-check-"));
const tempDataDir = path.join(tempRoot, "data");
const tempDefaultStatePath = path.join(tempRoot, "default-state.json");
const serverOut = [];
const serverErr = [];
const passwords = {
  admin: `Admin-${randomUUID()}`,
  member: `Member-${randomUUID()}`
};

function buildSeedState() {
  const seed = JSON.parse(readFileSync(bundledDefaultStatePath, "utf8"));
  seed.accounts = (seed.accounts || []).map((account) => ({
    ...account,
    password: account.id === "account-1" ? passwords.admin : passwords.member,
    passwordHash: ""
  }));
  seed.settings.automation.autoRunOnSave = false;

  const course = seed.courses.find((item) => item.id === "course-1");
  course.title = "Curso academico protegido";
  course.enrolledIds = ["member-1", "member-2"];
  course.waitingIds = ["member-3"];
  course.attendance = { "member-1": 100, "member-2": 50 };
  course.evaluations = { "member-1": "Apto", "member-2": "Pendiente" };
  course.diplomaReady = ["member-1"];

  const untouchedCourse = seed.courses.find((item) => item.id === "course-2");
  untouchedCourse.summary = "course-two-must-stay-untouched";
  return seed;
}

async function getAvailablePort() {
  return await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function startServer(port, baseUrl) {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...(nodeModulesPath ? { NODE_PATH: nodeModulesPath } : {}),
      NODE_ENV: "test",
      PORT: String(port),
      IZ_BASE_URL: baseUrl,
      IZ_DATA_DIR: tempDataDir,
      IZ_DEFAULT_STATE_PATH: tempDefaultStatePath,
      AUTOMATION_INTERVAL_MS: "3600000",
      IZ_RECOVERY_ADMIN_PASSWORD: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.on("data", (chunk) => serverOut.push(String(chunk)));
  child.stderr.on("data", (chunk) => serverErr.push(String(chunk)));
  return child;
}

async function stopServer(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, 1000);
    timeout.unref();
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
    child.kill();
  });
}

async function waitForServer(baseUrl) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(new URL("/healthz", baseUrl));
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error(`Servidor no disponible.\nSTDOUT:\n${serverOut.join("")}\nSTDERR:\n${serverErr.join("")}`);
}

function createClient(baseUrl) {
  const cookies = new Map();
  return {
    async request(method, requestPath, body, allowFailure = false) {
      const headers = { Accept: "application/json" };
      const cookieHeader = Array.from(cookies.entries()).map(([name, value]) => `${name}=${value}`).join("; ");
      if (cookieHeader) headers.Cookie = cookieHeader;
      let requestBody;
      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        requestBody = JSON.stringify(body);
      }
      const response = await fetch(new URL(requestPath, baseUrl), { method, headers, body: requestBody });
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        const [cookiePair] = setCookie.split(";");
        const separator = cookiePair.indexOf("=");
        cookies.set(cookiePair.slice(0, separator), cookiePair.slice(separator + 1));
      }
      const text = await response.text();
      const parsedBody = text ? JSON.parse(text) : null;
      if (!response.ok && !allowFailure) {
        throw new Error(`${method} ${requestPath} -> ${response.status}: ${parsedBody?.error || text}`);
      }
      return { status: response.status, body: parsedBody };
    }
  };
}

async function login(client, email, password) {
  const response = await client.request("POST", "/api/login", { email, password });
  assert.equal(response.body?.ok, true);
}

function findCourse(state, courseId) {
  return (state.courses || []).find((course) => course.id === courseId);
}

async function main() {
  mkdirSync(tempDataDir, { recursive: true });
  writeFileSync(tempDefaultStatePath, JSON.stringify(buildSeedState(), null, 2));
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  let server = startServer(port, baseUrl);

  try {
    await waitForServer(baseUrl);
    const anonymous = createClient(baseUrl);
    const member = createClient(baseUrl);
    const admin = createClient(baseUrl);
    const memberEndpoint = "/api/courses/course-1/members/member-1/academic";

    const anonymousUpdate = await anonymous.request("PATCH", memberEndpoint, { attendance: 75 }, true);
    assert.equal(anonymousUpdate.status, 401, "Un visitante no puede modificar asistencia");

    await login(member, "lucia@isocronazero.org", passwords.member);
    const memberUpdate = await member.request("PATCH", memberEndpoint, { attendance: 75 }, true);
    assert.equal(memberUpdate.status, 403, "Un socio no puede modificar el seguimiento academico");

    await login(admin, "admin@isocronazero.org", passwords.admin);
    const invalidAttendance = await admin.request("PATCH", memberEndpoint, { attendance: 101 }, true);
    assert.equal(invalidAttendance.status, 400, "No debe aceptar asistencia superior al 100%");

    const emptyAttendance = await admin.request("PATCH", memberEndpoint, { attendance: "" }, true);
    assert.equal(emptyAttendance.status, 400, "No debe convertir una asistencia vacia en 0%");

    const invalidEvaluation = await admin.request("PATCH", memberEndpoint, { evaluation: "Sobresaliente" }, true);
    assert.equal(invalidEvaluation.status, 400, "No debe aceptar estados de evaluacion desconocidos");

    const emptyUpdate = await admin.request("PATCH", memberEndpoint, { title: "Curso alterado" }, true);
    assert.equal(emptyUpdate.status, 400, "Debe exigir al menos un campo academico");

    const waitingMemberUpdate = await admin.request(
      "PATCH",
      "/api/courses/course-1/members/member-3/academic",
      { attendance: 100 },
      true
    );
    assert.equal(waitingMemberUpdate.status, 400, "No debe modificar a quien solo esta en espera");

    const missingCourse = await admin.request(
      "PATCH",
      "/api/courses/no-existe/members/member-1/academic",
      { attendance: 100 },
      true
    );
    assert.equal(missingCourse.status, 404);

    const degraded = await admin.request("PATCH", memberEndpoint, {
      attendance: 0,
      evaluation: "No apto",
      title: "Curso alterado"
    });
    assert.equal(degraded.status, 200);
    assert.equal(degraded.body?.course?.attendance?.["member-1"], 0);
    assert.equal(degraded.body?.course?.evaluations?.["member-1"], "No apto");
    assert.equal(degraded.body?.course?.title, "Curso academico protegido");
    assert.ok(
      degraded.body?.course?.diplomaReady?.includes("member-1"),
      "Degradar requisitos no debe retirar un diploma ya emitido"
    );

    const attendanceOnly = await admin.request(
      "PATCH",
      "/api/courses/course-1/members/member-2/academic",
      { attendance: 82.5 }
    );
    assert.equal(attendanceOnly.body?.course?.attendance?.["member-2"], 82.5);
    assert.equal(attendanceOnly.body?.course?.evaluations?.["member-2"], "Pendiente");

    const evaluationOnly = await admin.request(
      "PATCH",
      "/api/courses/course-1/members/member-2/academic",
      { evaluation: "Apto" }
    );
    assert.equal(evaluationOnly.body?.course?.attendance?.["member-2"], 82.5);
    assert.equal(evaluationOnly.body?.course?.evaluations?.["member-2"], "Apto");

    const bulkUpdate = await admin.request("PATCH", "/api/courses/course-1/academic", {
      attendance: 100,
      evaluation: "Apto"
    });
    assert.deepEqual(bulkUpdate.body?.updatedMemberIds, ["member-1", "member-2"]);
    assert.equal(bulkUpdate.body?.course?.attendance?.["member-1"], 100);
    assert.equal(bulkUpdate.body?.course?.attendance?.["member-2"], 100);
    assert.equal(bulkUpdate.body?.course?.attendance?.["member-3"], undefined);
    assert.equal(bulkUpdate.body?.course?.evaluations?.["member-3"], undefined);
    assert.ok(bulkUpdate.body?.course?.diplomaReady?.includes("member-1"));

    let state = (await admin.request("GET", "/api/state")).body;
    assert.equal(findCourse(state, "course-1").title, "Curso academico protegido");
    assert.equal(findCourse(state, "course-2").summary, "course-two-must-stay-untouched");

    await stopServer(server);
    server = startServer(port, baseUrl);
    await waitForServer(baseUrl);

    const restartedAdmin = createClient(baseUrl);
    await login(restartedAdmin, "admin@isocronazero.org", passwords.admin);
    state = (await restartedAdmin.request("GET", "/api/state")).body;
    const persistedCourse = findCourse(state, "course-1");
    assert.equal(persistedCourse.attendance["member-1"], 100);
    assert.equal(persistedCourse.attendance["member-2"], 100);
    assert.equal(persistedCourse.evaluations["member-1"], "Apto");
    assert.equal(persistedCourse.evaluations["member-2"], "Apto");
    assert.ok(persistedCourse.diplomaReady.includes("member-1"));
    assert.equal(findCourse(state, "course-2").summary, "course-two-must-stay-untouched");
  } finally {
    await stopServer(server);
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

main()
  .then(() => console.log("Course academic endpoint check passed."))
  .catch((error) => {
    console.error(error);
    console.error(`STDOUT:\n${serverOut.join("")}\nSTDERR:\n${serverErr.join("")}`);
    rmSync(tempRoot, { recursive: true, force: true });
    process.exit(1);
  });
