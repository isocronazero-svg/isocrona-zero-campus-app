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
    const closeMemberEndpoint = "/api/courses/course-1/members/member-2/close";
    const generateMemberDiplomaEndpoint = "/api/courses/course-2/members/member-3/diploma";
    const generateCourseDiplomasEndpoint = "/api/courses/course-1/diplomas/generate";
    const createCourseEndpoint = "/api/courses";
    const updateCourseEndpoint = "/api/courses/course-2";

    const anonymousUpdate = await anonymous.request("PATCH", memberEndpoint, { attendance: 75 }, true);
    assert.equal(anonymousUpdate.status, 401, "Un visitante no puede modificar asistencia");
    const anonymousClose = await anonymous.request("POST", closeMemberEndpoint, undefined, true);
    assert.equal(anonymousClose.status, 401, "Un visitante no puede cerrar el expediente academico");
    const anonymousDiploma = await anonymous.request("POST", generateMemberDiplomaEndpoint, undefined, true);
    assert.equal(anonymousDiploma.status, 401, "Un visitante no puede emitir diplomas");
    const anonymousCourseDiplomas = await anonymous.request("POST", generateCourseDiplomasEndpoint, undefined, true);
    assert.equal(anonymousCourseDiplomas.status, 401, "Un visitante no puede recalcular diplomas");
    const anonymousCourseCreate = await anonymous.request("POST", createCourseEndpoint, { title: "No" }, true);
    assert.equal(anonymousCourseCreate.status, 401, "Un visitante no puede crear cursos");
    const anonymousCourseUpdate = await anonymous.request("PATCH", updateCourseEndpoint, { title: "No" }, true);
    assert.equal(anonymousCourseUpdate.status, 401, "Un visitante no puede editar cursos");

    await login(member, "lucia@isocronazero.org", passwords.member);
    const memberUpdate = await member.request("PATCH", memberEndpoint, { attendance: 75 }, true);
    assert.equal(memberUpdate.status, 403, "Un socio no puede modificar el seguimiento academico");
    const memberClose = await member.request("POST", closeMemberEndpoint, undefined, true);
    assert.equal(memberClose.status, 403, "Un socio no puede cerrar el expediente academico");
    const memberDiploma = await member.request("POST", generateMemberDiplomaEndpoint, undefined, true);
    assert.equal(memberDiploma.status, 403, "Un socio no puede emitir diplomas");
    const memberCourseDiplomas = await member.request("POST", generateCourseDiplomasEndpoint, undefined, true);
    assert.equal(memberCourseDiplomas.status, 403, "Un socio no puede recalcular diplomas");
    const memberCourseCreate = await member.request("POST", createCourseEndpoint, { title: "No" }, true);
    assert.equal(memberCourseCreate.status, 403, "Un socio no puede crear cursos");
    const memberCourseUpdate = await member.request("PATCH", updateCourseEndpoint, { title: "No" }, true);
    assert.equal(memberCourseUpdate.status, 403, "Un socio no puede editar cursos");

    await login(admin, "admin@isocronazero.org", passwords.admin);
    const sharedEndpoint = "/api/courses/course-1/shared-test";
    assert.equal((await anonymous.request("GET", sharedEndpoint, undefined, true)).status, 401);
    assert.equal((await member.request("GET", sharedEndpoint, undefined, true)).status, 403);
    const linked = await admin.request("PATCH", "/api/courses/course-1", {
      sharedTestQuestionIds: ["shared-q1", "shared-q2", "shared-q1"], sharedTestPublished: false
    });
    assert.deepEqual(linked.body.course.sharedTestQuestionIds, ["shared-q1", "shared-q2"]);
    for (const ids of [["missing"], ["shared-inactive"], "bad", Array(201).fill("shared-q1")]) {
      assert.equal((await admin.request("PATCH", "/api/courses/course-1", { sharedTestQuestionIds: ids }, true)).status, 400);
    }
    const previewTest = (await admin.request("GET", sharedEndpoint)).body;
    const previewResult = await admin.request("POST", sharedEndpoint + "/results", {
      attemptId: randomUUID(), version: previewTest.version, questionIds: ["shared-q1", "shared-q2"], answers: [1, 2]
    });
    assert.equal(previewResult.body.preview, true);
    assert.equal((await admin.request("GET", "/api/state")).body.testZoneResults.length, 0);
    await admin.request("PATCH", "/api/courses/course-1", { sharedTestPublished: true });
    assert.equal((await member.request("GET", "/api/courses/course-2/shared-test", undefined, true)).status, 403);
    const sharedTest = (await member.request("GET", sharedEndpoint)).body;
    assert.equal(sharedTest.preview, false);
    assert.deepEqual(sharedTest.questions.map((q) => q.id), ["shared-q1", "shared-q2"]);
    assert.equal(JSON.stringify(sharedTest).includes("correctIndex"), false);
    assert.equal(JSON.stringify(sharedTest).includes("Explicación uno"), false);
    const attempt = { attemptId: randomUUID(), version: sharedTest.version, questionIds: ["shared-q1", "shared-q2"], answers: [1, 0], score: 999 };
    assert.equal((await member.request("POST", sharedEndpoint + "/results", { ...attempt, questionIds: ["shared-q1"], answers: [1] }, true)).status, 400);
    const result = await member.request("POST", sharedEndpoint + "/results", attempt);
    assert.equal(result.body.result.percentage, 50);
    assert.equal(result.body.result.courseId, "course-1");
    const retry = await member.request("POST", sharedEndpoint + "/results", attempt);
    assert.equal(retry.body.result.id, result.body.result.id);
    assert.equal((await member.request("POST", sharedEndpoint + "/results", { ...attempt, answers: [1, 2] }, true)).status, 409);
    let sharedState = (await admin.request("GET", "/api/state")).body;
    assert.equal(sharedState.testZoneResults.length, 1);
    assert.equal(sharedState.testZoneQuestions.length, 3, "Enlazar preguntas no duplica el banco");
    assert.equal(findCourse(sharedState, "course-1").evaluations["member-1"], "Apto", "La práctica no sustituye la evaluación académica");
    const live = await admin.request("POST", "/api/test-zone/live-sessions", { courseId: "course-1" });
    assert.equal(live.body.session.questionCount, 2);
    const liveJoin = await anonymous.request("POST", "/api/test-zone/live/join", { code: live.body.session.code, guestName: "Participante temporal" });
    assert.deepEqual(liveJoin.body.liveSession.questions.map((q) => q.id), ["shared-q1", "shared-q2"]);
    assert.equal(JSON.stringify(liveJoin.body).includes("correctIndex"), false);
    await admin.request("POST", `/api/test-zone/live-sessions/${live.body.session.id}/close`, {});
    await admin.request("PATCH", "/api/courses/course-1", { sharedTestQuestionIds: ["shared-q2"] });
    assert.equal((await member.request("POST", sharedEndpoint + "/results", { ...attempt, attemptId: randomUUID() }, true)).status, 409);
    await admin.request("PATCH", "/api/courses/course-1", { sharedTestQuestionIds: ["shared-q1", "shared-q2"] });

    const invalidCourse = await admin.request("POST", createCourseEndpoint, { title: "Curso incompleto" }, true);
    assert.equal(invalidCourse.status, 400, "No debe crear cursos sin los campos obligatorios");

    const createdCourse = await admin.request("POST", createCourseEndpoint, {
      course: {
        id: "course-managed",
        title: "Curso creado por endpoint",
        courseClass: "practico",
        type: "Practica operativa",
        status: "Planificacion",
        startDate: "2026-10-01",
        endDate: "2026-10-02",
        hours: 8,
        capacity: 12,
        modules: [{ id: "managed-module", title: "Modulo inicial", lessons: [] }],
        enrolledIds: ["member-4"],
        diplomaReady: ["member-4"],
        attendance: { "member-4": 100 }
      }
    });
    assert.equal(createdCourse.status, 201);
    assert.equal(createdCourse.body?.course?.id, "course-managed");
    assert.equal(createdCourse.body?.course?.courseClass, "practico");
    assert.deepEqual(createdCourse.body?.course?.enrolledIds, []);
    assert.deepEqual(createdCourse.body?.course?.diplomaReady, []);
    assert.deepEqual(createdCourse.body?.course?.attendance, {});

    const updatedCourse = await admin.request("PATCH", updateCourseEndpoint, {
      id: "course-hijack",
      title: "Curso editado por endpoint",
      capacity: 9,
      enrolledIds: ["member-4"],
      diplomaReady: ["member-4"],
      attendance: { "member-4": 100 }
    });
    assert.equal(updatedCourse.status, 200);
    assert.equal(updatedCourse.body?.course?.id, "course-2");
    assert.equal(updatedCourse.body?.course?.title, "Curso editado por endpoint");
    assert.equal(updatedCourse.body?.course?.capacity, 9);
    assert.deepEqual(updatedCourse.body?.course?.enrolledIds, ["member-3"]);
    assert.deepEqual(updatedCourse.body?.course?.diplomaReady, []);
    assert.equal(updatedCourse.body?.course?.attendance?.["member-3"], 100);
    assert.equal(updatedCourse.body?.course?.summary, "course-two-must-stay-untouched");

    const blockedDiploma = await admin.request(
      "POST",
      "/api/courses/course-1/members/member-4/diploma",
      undefined,
      true
    );
    assert.equal(blockedDiploma.status, 400);
    assert.ok(blockedDiploma.body?.blockers?.includes("DNI/NIE"), "No debe emitir un diploma sin DNI/NIE");

    const generatedMemberDiploma = await admin.request("POST", generateMemberDiplomaEndpoint);
    assert.equal(generatedMemberDiploma.status, 200);
    assert.equal(generatedMemberDiploma.body?.generated, true);
    assert.ok(generatedMemberDiploma.body?.course?.diplomaReady?.includes("member-3"));

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
    assert.deepEqual(bulkUpdate.body?.updatedMemberIds, ["member-1", "member-2", "member-4"]);
    assert.equal(bulkUpdate.body?.course?.attendance?.["member-1"], 100);
    assert.equal(bulkUpdate.body?.course?.attendance?.["member-2"], 100);
    assert.equal(bulkUpdate.body?.course?.attendance?.["member-3"], undefined);
    assert.equal(bulkUpdate.body?.course?.evaluations?.["member-3"], undefined);
    assert.ok(bulkUpdate.body?.course?.diplomaReady?.includes("member-1"));

    const waitingMemberClose = await admin.request(
      "POST",
      "/api/courses/course-1/members/member-3/close",
      undefined,
      true
    );
    assert.equal(waitingMemberClose.status, 400, "No debe cerrar a quien solo esta en espera");

    const closeMember = await admin.request("POST", closeMemberEndpoint);
    assert.equal(closeMember.status, 200);
    assert.deepEqual(closeMember.body?.blockers, []);
    assert.equal(closeMember.body?.course?.attendance?.["member-2"], 100);
    assert.equal(closeMember.body?.course?.evaluations?.["member-2"], "Apto");
    assert.ok(closeMember.body?.course?.contentProgress?.["member-2"]?.lessonIds?.includes("lesson-published"));
    assert.ok(!closeMember.body?.course?.contentProgress?.["member-2"]?.lessonIds?.includes("lesson-draft"));
    assert.ok(closeMember.body?.course?.contentProgress?.["member-2"]?.blockIds?.includes("block-required"));
    assert.ok(closeMember.body?.course?.contentProgress?.["member-2"]?.blockIds?.includes("block-optional"));
    assert.ok(!closeMember.body?.course?.contentProgress?.["member-2"]?.blockIds?.includes("block-draft"));
    assert.equal(
      closeMember.body?.course?.contentProgress?.["member-2"]?.quizAnswers?.["block-required"]?.["0"],
      "Respuesta conservada"
    );
    assert.ok(closeMember.body?.course?.diplomaReady?.includes("member-2"));

    const closeCourse = await admin.request("POST", "/api/courses/course-1/close");
    assert.equal(closeCourse.status, 200);
    assert.deepEqual(closeCourse.body?.updatedMemberIds, ["member-1", "member-2", "member-4"]);
    assert.equal(closeCourse.body?.course?.attendance?.["member-3"], undefined);
    assert.equal(closeCourse.body?.course?.contentProgress?.["member-3"], undefined);
    assert.ok(
      closeCourse.body?.blocked?.some(
        (entry) => entry.memberId === "member-4" && entry.blockers.includes("DNI/NIE")
      ),
      "El cierre no debe saltarse el requisito de DNI/NIE"
    );
    assert.ok(closeCourse.body?.course?.diplomaReady?.includes("member-1"));
    assert.ok(closeCourse.body?.course?.diplomaReady?.includes("member-2"));
    assert.ok(!closeCourse.body?.course?.diplomaReady?.includes("member-4"));

    const generatedCourseDiplomas = await admin.request("POST", generateCourseDiplomasEndpoint);
    assert.equal(generatedCourseDiplomas.status, 200);
    assert.ok(generatedCourseDiplomas.body?.course?.diplomaReady?.includes("member-1"));
    assert.ok(generatedCourseDiplomas.body?.course?.diplomaReady?.includes("member-2"));
    assert.ok(!generatedCourseDiplomas.body?.course?.diplomaReady?.includes("member-4"));

    let state = (await admin.request("GET", "/api/state")).body;
    assert.equal(findCourse(state, "course-1").title, "Curso academico protegido");
    assert.equal(findCourse(state, "course-2").summary, "course-two-must-stay-untouched");
    assert.equal(findCourse(state, "course-2").title, "Curso editado por endpoint");
    assert.ok(findCourse(state, "course-2").diplomaReady.includes("member-3"));
    assert.equal(findCourse(state, "course-managed").title, "Curso creado por endpoint");

    await stopServer(server);
    server = startServer(port, baseUrl);
    await waitForServer(baseUrl);

    const restartedAdmin = createClient(baseUrl);
    await login(restartedAdmin, "admin@isocronazero.org", passwords.admin);
    state = (await restartedAdmin.request("GET", "/api/state")).body;
    const persistedCourse = findCourse(state, "course-1");
    assert.deepEqual(persistedCourse.sharedTestQuestionIds, ["shared-q1", "shared-q2"]);
    assert.equal(persistedCourse.sharedTestPublished, true);
    assert.equal(state.testZoneQuestions.length, 3);
    assert.equal(state.testZoneResults.filter((item) => item.courseId === "course-1").length, 1);
    assert.equal(persistedCourse.attendance["member-1"], 100);
    assert.equal(persistedCourse.attendance["member-2"], 100);
    assert.equal(persistedCourse.evaluations["member-1"], "Apto");
    assert.equal(persistedCourse.evaluations["member-2"], "Apto");
    assert.ok(persistedCourse.diplomaReady.includes("member-1"));
    assert.ok(persistedCourse.diplomaReady.includes("member-2"));
    assert.ok(persistedCourse.contentProgress["member-2"].blockIds.includes("block-required"));
    assert.equal(findCourse(state, "course-2").summary, "course-two-must-stay-untouched");
    assert.equal(findCourse(state, "course-2").title, "Curso editado por endpoint");
    assert.ok(findCourse(state, "course-2").diplomaReady.includes("member-3"));
    assert.equal(findCourse(state, "course-managed").title, "Curso creado por endpoint");
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
