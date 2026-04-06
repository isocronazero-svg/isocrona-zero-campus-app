import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.IZ_BASE_URL || "http://localhost:3210";
const now = new Date();
const reportPath = path.resolve(
  "C:/Users/charl/OneDrive/Desktop/Isocrona Zero/docs",
  `CHECKLIST-RESULTADO-${now.toISOString().slice(0, 10)}.md`
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function slug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pickAlternatePhone(currentPhone) {
  const digits = String(currentPhone || "").replace(/\D+/g, "");
  if (!digits) {
    return "600123456";
  }
  const lastDigit = Number(digits.slice(-1) || "0");
  const nextDigit = (lastDigit + 1) % 10;
  return `${digits.slice(0, -1)}${nextDigit}`;
}

class HttpClient {
  constructor(rootUrl) {
    this.rootUrl = rootUrl.replace(/\/+$/, "");
    this.cookies = [];
  }

  updateCookies(response) {
    const headerValues =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : [response.headers.get("set-cookie")].filter(Boolean);
    headerValues.forEach((cookieHeader) => {
      const cookiePair = String(cookieHeader || "").split(";")[0].trim();
      if (!cookiePair) {
        return;
      }
      const cookieName = cookiePair.split("=")[0];
      this.cookies = this.cookies.filter((item) => !item.startsWith(`${cookieName}=`));
      this.cookies.push(cookiePair);
    });
  }

  async request(method, pathname, options = {}) {
    const url = pathname.startsWith("http") ? pathname : `${this.rootUrl}${pathname}`;
    const headers = {
      ...(options.headers || {})
    };

    if (this.cookies.length) {
      headers.Cookie = this.cookies.join("; ");
    }

    let body = options.body;
    if (options.json !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.json);
    }

    const response = await fetch(url, {
      method,
      headers,
      body,
      redirect: "manual"
    });

    this.updateCookies(response);

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    let payload = null;
    if (options.raw) {
      payload = Buffer.from(await response.arrayBuffer());
    } else if (contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      payload = await response.text();
    }

    return {
      ok: response.ok,
      status: response.status,
      headers: response.headers,
      body: payload
    };
  }

  get(pathname, options = {}) {
    return this.request("GET", pathname, options);
  }

  post(pathname, options = {}) {
    return this.request("POST", pathname, options);
  }
}

function renderMarkdown(results) {
  const lines = [
    "# Resultado de checklist final",
    "",
    `Fecha: ${new Date().toISOString()}`,
    `Base URL: ${baseUrl}`,
    "",
    "## Resumen",
    `- Total checks: ${results.length}`,
    `- Correctos: ${results.filter((item) => item.ok).length}`,
    `- Fallidos: ${results.filter((item) => !item.ok).length}`,
    "",
    "## Detalle"
  ];

  results.forEach((item) => {
    lines.push(
      `- ${item.ok ? "OK" : "ERROR"} ${item.name}: ${item.detail || ""}`.trim()
    );
  });

  return `${lines.join("\n")}\n`;
}

async function main() {
  const results = [];
  const admin = new HttpClient(baseUrl);
  let baselineState = null;

  const record = (name, ok, detail) => {
    results.push({ name, ok, detail });
    const prefix = ok ? "[OK]" : "[ERROR]";
    console.log(`${prefix} ${name}${detail ? ` -> ${detail}` : ""}`);
  };

  try {
    const adminLogin = await admin.post("/api/login", {
      json: {
        email: "sal.ro.carlos@gmail.com",
        password: "IZ-carl-1"
      }
    });
    assert(adminLogin.ok && adminLogin.body?.ok, "No se pudo iniciar sesion como Carlos");
    record("Admin login", true, "Carlos ha iniciado sesion correctamente");

    const adminStateResponse = await admin.get("/api/state");
    assert(adminStateResponse.ok && adminStateResponse.body?.accounts, "No se pudo cargar /api/state");
    const adminState = adminStateResponse.body;
    baselineState = structuredClone(adminState);
    assert((adminState.associates || []).length >= 100, "El censo admin no trae socios reales");
    record("Censo admin", true, `${adminState.associates.length} socios visibles`);

    const adminSession = adminLogin.body.session || {};
    const selfStateResponse = await admin.get("/api/state?mode=self");
    assert(selfStateResponse.ok, "No se pudo cargar /api/state?mode=self");
    const selfState = selfStateResponse.body;
    assert((selfState.associates || []).length === 1, "La vista propia no se ha reducido al socio activo");
    record("Vista propia de socio", true, `${selfState.associates.length} ficha activa`);

    const selfAssociate = selfState.associates[0];
    const originalPhone = selfAssociate.phone || "";
    const updatedPhone = pickAlternatePhone(originalPhone);
    const directEdit = await admin.post("/api/associate-profile-requests", {
      json: {
        firstName: selfAssociate.firstName,
        lastName: selfAssociate.lastName,
        dni: selfAssociate.dni,
        phone: updatedPhone,
        email: selfAssociate.email,
        service: selfAssociate.service,
        note: ""
      }
    });
    assert(directEdit.ok && directEdit.body?.mode === "direct", "La autoedicion directa no ha funcionado");
    const selfAfterEdit = await admin.get("/api/state?mode=self");
    assert(selfAfterEdit.body.associates?.[0]?.phone === updatedPhone, "El telefono no se ha guardado en la ficha");
    record("Autoedicion de ficha", true, `Telefono temporal actualizado a ${updatedPhone}`);

    const revertEdit = await admin.post("/api/associate-profile-requests", {
      json: {
        firstName: selfAssociate.firstName,
        lastName: selfAssociate.lastName,
        dni: selfAssociate.dni,
        phone: originalPhone,
        email: selfAssociate.email,
        service: selfAssociate.service,
        note: ""
      }
    });
    assert(revertEdit.ok, "No se pudo revertir la prueba de telefono");
    record("Reversion de ficha", true, `Telefono restaurado a ${originalPhone || "vacio"}`);

    const associateId = adminSession.associateId || selfAssociate.id;
    if (associateId) {
      const welcomeResult = await admin.post(`/api/associates/${associateId}/send-welcome`, { json: {} });
      assert(welcomeResult.ok, "La accion de bienvenida ha fallado");
      record("Bienvenida campus", true, welcomeResult.body?.message || "Bienvenida procesada");
    }

    const publicClient = new HttpClient(baseUrl);
    const publicRegisterEmail = `checklist.publico.${Date.now()}@isocronazero.test`;
    const publicRegister = await publicClient.post("/api/public-campus/register", {
      json: {
        firstName: "Checklist",
        lastName: "Publico",
        email: publicRegisterEmail,
        phone: "600123123",
        password: "Checklist2026!"
      }
    });
    assert(publicRegister.ok && publicRegister.body?.ok, "No se pudo crear un acceso solo campus");
    const publicMemberId = publicRegister.body?.session?.memberId;
    assert(publicMemberId, "El acceso solo campus no ha devuelto memberId");
    record("Acceso solo campus", true, publicRegisterEmail);

    const publicStateBeforeEnroll = await publicClient.get("/api/state");
    assert((publicStateBeforeEnroll.body.associates || []).length === 0, "Un usuario externo no deberia ver socios");
    assert(
      (publicStateBeforeEnroll.body.courses || []).every((course) => course.accessScope === "public"),
      "Un usuario externo solo deberia ver cursos publicos"
    );
    record(
      "Catalogo publico externo",
      true,
      `${(publicStateBeforeEnroll.body.courses || []).length} curso(s) publico(s)`
    );

    const publicCourse = (publicStateBeforeEnroll.body.courses || []).find(
      (course) => course.id === "course-ventilacion-2026"
    );
    assert(publicCourse, "No se ha encontrado el curso publico de ventilacion");

    const externalEnroll = await publicClient.post(`/api/member/courses/${publicCourse.id}/enroll`, {
      json: {
        note: "Checklist prepublicacion"
      }
    });
    assert(externalEnroll.ok && externalEnroll.body?.ok, "La inscripcion publica ha fallado");
    record("Inscripcion externa", true, externalEnroll.body?.message || "Inscripcion registrada");

    const publicStateAfterEnroll = await publicClient.get("/api/state");
    assert(
      (publicStateAfterEnroll.body.courses || []).length === 1 &&
        publicStateAfterEnroll.body.courses[0]?.id === publicCourse.id,
      "Tras inscribirse, el externo deberia ver solo su curso"
    );
    record("Visibilidad externa tras inscripcion", true, "Solo ve su curso abierto");

    const adminStateAfterPublicEnroll = await admin.get("/api/state");
    const publicCourseAdmin = (adminStateAfterPublicEnroll.body.courses || []).find(
      (course) => course.id === publicCourse.id
    );
    const publicSubmission = (publicCourseAdmin?.enrollmentSubmissions || []).find(
      (submission) => submission.memberId === publicMemberId
    );
    assert(publicSubmission, "Administracion no ve la solicitud externa");
    record("Solicitud visible en admin", true, publicSubmission.status || "visible");

    const reviewPublicSubmission = await admin.post(
      `/api/courses/${publicCourse.id}/enrollment-submissions/${publicSubmission.id}/status`,
      {
        json: { status: "confirmed" }
      }
    );
    assert(reviewPublicSubmission.ok, "No se pudo confirmar la inscripcion externa");
    record("Revision de solicitud externa", true, reviewPublicSubmission.body?.message || "Confirmada");

    const adminStateBeforeDiploma = await admin.get("/api/state");
    const attachmentGroup = (adminStateBeforeDiploma.body.campusGroups || [])
      .flatMap((group) =>
        (group.modules || []).flatMap((module) =>
          ["documents", "practiceSheets", "videos", "links"].flatMap((category) =>
            (module[category] || []).map((entry) => ({
              group,
              module,
              category,
              entry
            }))
          )
        )
      )
      .find((item) => item.entry?.attachment?.transportUrl);

    if (attachmentGroup) {
      const attachmentResponse = await admin.get(attachmentGroup.entry.attachment.transportUrl, { raw: true });
      assert(attachmentResponse.ok, "El adjunto de grupos internos no se puede abrir");
      record(
        "Adjunto de grupo interno",
        true,
        `${attachmentGroup.group.name} / ${attachmentGroup.module.name}`
      );
    } else {
      record("Adjunto de grupo interno", true, "No habia adjuntos compactados que comprobar");
    }

    const workingState = structuredClone(adminStateBeforeDiploma.body);
    const courseId = `course-${Date.now()}`;
    const memberId = adminSession.memberId;
    assert(memberId, "Carlos no tiene memberId en sesion");
    const checklistCourse = {
      id: courseId,
      title: "Checklist de diploma controlado",
      courseClass: "teorico-practico",
      type: "Aprovechamiento",
      status: "Cierre pendiente",
      summary: "Curso temporal para validar el circuito de cierre y diploma.",
      startDate: "2026-03-01",
      endDate: "2026-03-02",
      hours: 8,
      capacity: 10,
      modality: "Presencial",
      audience: "Solo checklist",
      coordinator: "Checklist",
      contentTemplate: "operativo",
      objectives: [],
      sessions: [],
      modules: [],
      resources: [],
      materials: [],
      evaluationCriteria: [],
      contentStatus: "published",
      certificateCity: "Valencia",
      certificateContents: ["Prueba de circuito de cierre y diploma"],
      enrollmentFee: 0,
      enrollmentPaymentInstructions: "",
      enrollmentSubmissions: [],
      feedbackEnabled: false,
      feedbackRequiredForDiploma: false,
      feedbackTeachers: [],
      feedbackResponses: [],
      contentProgress: {
        [memberId]: {
          lessonIds: [],
          blockIds: [],
          updatedAt: now.toISOString()
        }
      },
      enrolledIds: [memberId],
      waitingIds: [],
      attendance: {
        [memberId]: 100
      },
      evaluations: {
        [memberId]: "Apto"
      },
      diplomaTemplate: "Aprovechamiento",
      diplomaReady: [],
      mailsSent: [],
      accessScope: "members",
      enrolledCount: 1,
      waitingCount: 0,
      diplomaReadyCount: 0,
      mailsSentCount: 0
    };
    workingState.courses = [...(workingState.courses || []), checklistCourse];
    const saveChecklistState = await admin.post("/api/state", { json: workingState });
    assert(saveChecklistState.ok, "No se pudo guardar el curso temporal de checklist");

    const automationResult = await admin.post("/api/automation/run", { json: {} });
    assert(automationResult.ok, "No se pudo ejecutar el motor automatico");
    record("Motor de automatizacion", true, automationResult.body?.message || "Ejecutado");

    const stateWithDiploma = await admin.get("/api/state");
    const checklistCourseAfterAutomation = (stateWithDiploma.body.courses || []).find((course) => course.id === courseId);
    assert(
      (checklistCourseAfterAutomation?.diplomaReady || []).includes(memberId),
      "El motor no ha generado el diploma listo para el curso controlado"
    );
    record("Generacion de diploma", true, "Diploma marcado como listo");

    const diplomaCode = `IZ-${checklistCourse.startDate.slice(0, 4)}-${courseId.split("-")[1]}-${memberId.split("-")[1]}`;
    const diplomaHtml = await admin.get(`/api/diplomas/${courseId}/${memberId}`);
    assert(diplomaHtml.ok && String(diplomaHtml.body || "").includes("CERTIFICADO"), "No se pudo abrir el diploma HTML");
    record("Diploma HTML", true, "HTML accesible");

    const diplomaPdf = await admin.get(`/api/diplomas/${courseId}/${memberId}.pdf`, { raw: true });
    assert(diplomaPdf.ok && diplomaPdf.body.length > 100, "No se pudo descargar el PDF del diploma");
    record("Diploma PDF", true, `${diplomaPdf.body.length} bytes`);

    const verifyJson = await admin.get(`/api/verify?code=${encodeURIComponent(diplomaCode)}`);
    assert(verifyJson.ok && verifyJson.body?.ok, "La validacion publica JSON ha fallado");
    record("Validacion publica JSON", true, diplomaCode);

    const verifyPdf = await admin.get(`/api/verify/pdf?code=${encodeURIComponent(diplomaCode)}`, { raw: true });
    assert(verifyPdf.ok && verifyPdf.body.length > 100, "La validacion publica PDF ha fallado");
    record("Validacion publica PDF", true, `${verifyPdf.body.length} bytes`);
  } catch (error) {
    record("Checklist global", false, error.message || "Error no controlado");
    throw error;
  } finally {
    if (baselineState) {
      try {
        await admin.post("/api/state", { json: baselineState });
        await admin.post("/api/automation/run", { json: {} });
        record("Restauracion del estado original", true, "Datos de prueba revertidos");
      } catch (restoreError) {
        record(
          "Restauracion del estado original",
          false,
          restoreError.message || "No se pudo restaurar el estado base"
        );
      }
    }

    const markdown = renderMarkdown(results);
    await fs.writeFile(reportPath, markdown, "utf8");
    console.log(`\nInforme guardado en: ${reportPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
