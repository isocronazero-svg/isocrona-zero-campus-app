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
const tempRoot = mkdtempSync(path.join(os.tmpdir(), "iz-course-journey-check-"));
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

  seed.members = (seed.members || []).map((member) =>
    ["member-1", "member-2", "member-3"].includes(member.id)
      ? { ...member, dni: member.dni || "12345678A" }
      : member
  );

  const course = seed.courses.find((item) => item.id === "course-1");
  course.title = "Curso academico protegido";
  course.enrolledIds = ["member-1", "member-2", "member-4"];
  course.waitingIds = ["member-3"];
  course.attendance = { "member-1": 100, "member-2": 50, "member-4": 0 };
  course.evaluations = { "member-1": "Apto", "member-2": "Pendiente", "member-4": "Pendiente" };
  course.diplomaReady = ["member-1"];
  course.feedbackEnabled = false;
  course.feedbackRequiredForDiploma = false;
  course.modules = [
    {
      id: "module-published",
      title: "Modulo publicado",
      lessons: [
        {
          id: "lesson-published",
          title: "Leccion publicada",
          publicationStatus: "published",
          blocks: [
            { id: "block-required", title: "Bloque obligatorio", required: true },
            { id: "block-optional", title: "Bloque opcional", required: false }
          ]
        },
        {
          id: "lesson-draft",
          title: "Leccion borrador",
          publicationStatus: "draft",
          blocks: [{ id: "block-draft", title: "Bloque borrador", required: true }]
        }
      ]
    }
  ];
  course.contentProgress = {
    "member-2": {
      lessonIds: [],
      blockIds: [],
      quizAnswers: { "block-required": { 0: "Respuesta conservada" } },
      updatedAt: ""
    }
  };

  const untouchedCourse = seed.courses.find((item) => item.id === "course-2");
  untouchedCourse.summary = "course-two-must-stay-untouched";
  untouchedCourse.enrolledIds = ["member-3"];
  untouchedCourse.waitingIds = [];
  untouchedCourse.attendance = { "member-3": 100 };
  untouchedCourse.evaluations = { "member-3": "Apto" };
  untouchedCourse.modules = [];
  untouchedCourse.contentProgress = {};
  untouchedCourse.feedbackEnabled = false;
  untouchedCourse.feedbackRequiredForDiploma = false;
  untouchedCourse.diplomaReady = [];
  seed.testZoneQuestions = [
    { id: "shared-q1", prompt: "Pregunta común uno", options: ["A", "B", "C", "D"], correctIndex: 1, explanation: "Explicación uno", category: "Incendios", difficulty: "facil" },
    { id: "shared-q2", prompt: "Pregunta común dos", options: ["A", "B", "C", "D"], correctIndex: 2, explanation: "Explicación dos", category: "Rescate", difficulty: "media" },
    { id: "shared-inactive", prompt: "Retirada", options: ["A", "B"], correctIndex: 0, active: false }
  ];
  seed.testZoneResults = [];
  const associate = seed.associates[0];
  associate.annualAmount = 0;
  seed.members.find((item) => item.id === "member-1").associateId = associate.id;
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
      const parsedBody = response.headers.get("content-type")?.includes("application/json") ? (text ? JSON.parse(text) : null) : text;
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
  writeFileSync(tempDefaultStatePath, JSON.stringify(buildSeedState()));
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  let server = startServer(port, baseUrl);
  try {
    await waitForServer(baseUrl);
    const admin = createClient(baseUrl), member = createClient(baseUrl), guest = createClient(baseUrl), waiting = createClient(baseUrl);
    await login(admin, "admin@isocronazero.org", passwords.admin);
    await login(member, "lucia@isocronazero.org", passwords.member);
    const courseId = "course-journey";
    const coursePath = `/api/courses/${courseId}`;
    const enrollPath = `/api/member/courses/${courseId}/enroll`;
    await admin.request("POST", "/api/courses", { course: {
      id: courseId, title: "Recorrido completo temporal", courseClass: "practico", type: "Practica",
      status: "Planificacion", startDate: "2099-01-01", endDate: "2099-01-02", hours: 4, capacity: 1,
      accessScope: "public", enrollmentFee: 0, feedbackEnabled: false, feedbackRequiredForDiploma: false,
      sharedTestQuestionIds: ["shared-q1", "shared-q2"], sharedTestPublished: true,
      modules: [{ id: "journey-module", title: "Modulo", lessons: [{ id: "journey-lesson", title: "Leccion", publicationStatus: "published", blocks: [{ id: "journey-block", type: "text", title: "Contenido", body: "Contenido temporal de prueba", required: true }] }] }]
    }});
    assert.equal((await member.request("POST", enrollPath, {}, true)).status, 403, "No inscribirse en planificación");
    assert.equal((await member.request("GET", coursePath + "/shared-test", undefined, true)).status, 403);
    await admin.request("PATCH", coursePath, { status: "Inscripcion abierta" });
    await member.request("POST", enrollPath, {});
    await member.request("POST", enrollPath, {});
    let full = (await admin.request("GET", "/api/state")).body;
    let course = findCourse(full, courseId);
    assert.deepEqual(course.enrolledIds, ["member-1"], "Inscripción repetida sin duplicados");
    assert.equal(course.enrollmentSubmissions.length, 1);
    assert.equal(course.enrollmentSubmissions[0].status, "confirmed");
    await login(waiting, "javier@isocronazero.org", passwords.member);
    await waiting.request("POST", enrollPath, {});
    course = findCourse((await admin.request("GET", "/api/state")).body, courseId);
    assert.deepEqual(course.enrolledIds, ["member-1"]);
    assert.deepEqual(course.waitingIds, ["member-2"]);
    assert.equal(course.enrollmentSubmissions.find(item => item.memberId === "member-2").status, "waiting");
    assert.equal((await waiting.request("GET", coursePath + "/shared-test", undefined, true)).status, 403, "Estar en espera no da acceso al test");
    let own = (await member.request("GET", "/api/state")).body;
    const ownCourse = findCourse(own, courseId);
    assert.equal(ownCourse.modules[0].lessons[0].blocks[0].body, "Contenido temporal de prueba");
    ownCourse.contentProgress = { "member-1": { lessonIds: ["journey-lesson"], blockIds: ["journey-block"] } };
    await member.request("POST", "/api/state", own);
    own = (await member.request("GET", "/api/state")).body;
    assert.deepEqual(findCourse(own, courseId).contentProgress["member-1"].blockIds, ["journey-block"]);
    const test = (await member.request("GET", coursePath + "/shared-test")).body;
    const attempt = { attemptId: randomUUID(), version: test.version, questionIds: test.questions.map(q => q.id), answers: [1, 2] };
    const result = (await member.request("POST", coursePath + "/shared-test/results", attempt)).body.result;
    assert.equal(result.percentage, 100);
    assert.equal((await member.request("GET", coursePath + "/shared-test")).body.results[0].id, result.id);
    assert.equal((await member.request("POST", coursePath + "/shared-test/results", attempt)).body.result.id, result.id);
    const pdfPath = `/api/diplomas/${courseId}/member-1.pdf`;
    assert.notEqual((await member.request("GET", pdfPath, undefined, true)).status, 200, "El test no emite diploma automáticamente");
    await admin.request("PATCH", coursePath + "/members/member-1/academic", { attendance: 100, evaluation: "Apto" });
    const diploma = (await admin.request("POST", coursePath + "/members/member-1/diploma")).body;
    assert.equal(diploma.generated, true);
    const pdf = await member.request("GET", pdfPath);
    assert.ok(pdf.body.startsWith("%PDF-"), "Descarga real de PDF");
    assert.equal((await guest.request("GET", pdfPath, undefined, true)).status, 401);
    assert.equal((await member.request("GET", `/api/diplomas/course-2/member-3.pdf`, undefined, true)).status, 403);
    const verified = await guest.request("GET", "/api/verify?code=IZ-2099-journey-1");
    assert.equal(verified.body.diploma.courseTitle, "Recorrido completo temporal");
    const live = (await admin.request("POST", "/api/test-zone/live-sessions", { courseId })).body.session;
    const joined = (await guest.request("POST", "/api/test-zone/live/join", { code: live.code, guestName: "Alumno temporal" })).body.liveSession;
    assert.deepEqual(joined.questions.map(q => q.id), attempt.questionIds);
    const livePath = `/api/test-zone/live-sessions/${live.id}`;
    const liveResult = await guest.request("POST", livePath + "/attempt", { code: live.code, guestName: "Alumno temporal", questionIds: attempt.questionIds, answers: [1, 2] });
    assert.equal(liveResult.body.result.percentage, 100);
    await admin.request("POST", livePath + "/close", {});
    assert.equal((await guest.request("POST", "/api/test-zone/live/join", { code: live.code, guestName: "Alumno temporal" }, true)).status, 404);
    await stopServer(server);
    server = startServer(port, baseUrl);
    await waitForServer(baseUrl);
    const restarted = createClient(baseUrl);
    await login(restarted, "lucia@isocronazero.org", passwords.member);
    const restored = (await restarted.request("GET", "/api/state")).body;
    const restoredCourse = findCourse(restored, courseId);
    assert.deepEqual(restoredCourse.enrolledIds, ["member-1"]);
    assert.deepEqual(restoredCourse.contentProgress["member-1"].blockIds, ["journey-block"]);
    assert.ok(restoredCourse.diplomaReady.includes("member-1"));
    assert.equal((await restarted.request("GET", coursePath + "/shared-test")).body.results[0].id, result.id);
    assert.ok((await restarted.request("GET", pdfPath)).body.startsWith("%PDF-"));
  } finally { await stopServer(server); rmSync(tempRoot, { recursive: true, force: true }); }
}
main().then(() => console.log("Full member journey passed: enrollment, content, shared test, diploma PDF, public validation, live test and restart."))
  .catch(error => { console.error(error); console.error(serverErr.join("")); process.exitCode = 1; });
