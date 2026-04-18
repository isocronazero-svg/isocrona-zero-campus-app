const SESSION_KEY = "iz-campus-session";
const VIEW_ROLE_KEY = "iz-campus-view-role";
const SESSION_BACKUP_KEY = "iz-campus-session-backup";
const VIEW_ROLE_BACKUP_KEY = "iz-campus-view-role-backup";
const UI_SNAPSHOT_KEY = "iz-campus-ui-snapshot";

const OVERVIEW_SECTION_LINKS = [
  { id: "overviewSectionDashboard", label: "Dashboard" },
  { id: "overviewSectionAttention", label: "Atencion hoy" },
  { id: "overviewSectionCourses", label: "Cursos" },
  { id: "overviewSectionAssociates", label: "Seguimiento" },
  { id: "overviewSectionGuide", label: "Guia admin" },
  { id: "overviewSectionActivity", label: "Auditoria" }
];

const ASSOCIATE_SECTION_LINKS = [
  { id: "associateSectionSummary", label: "Resumen" },
  { id: "associateSectionWorkbench", label: "Ficha activa" },
  { id: "associateSectionMigration", label: "Migracion" },
  { id: "associateSectionLegacyReview", label: "Revision legacy" },
  { id: "associateSectionPendingFees", label: "Cuotas pendientes" },
  { id: "associateSectionQuickReview", label: "Validacion" },
  { id: "associateSectionFilters", label: "Filtros" },
  { id: "associateSectionApplications", label: "Solicitudes" },
  { id: "associateSectionPayments", label: "Cuotas" },
  { id: "associateSectionProfiles", label: "Cambios" },
  { id: "associateSectionAssociates", label: "Socios" }
];

const VALIDATION_SECTION_LINKS = [
  { id: "validationSectionApplications", label: "Altas" },
  { id: "validationSectionProfiles", label: "Cambios" },
  { id: "validationSectionPayments", label: "Cuotas" }
];

const MEMBER_SECTION_LINKS = [
  { id: "memberSectionWorkbench", label: "Ficha activa" },
  { id: "memberSectionCreate", label: "Alta" },
  { id: "memberSectionImport", label: "Importacion" },
  { id: "memberSectionDirectory", label: "Listado" }
];

const COURSE_SECTION_LINKS = [
  { id: "courseSectionWorkbench", label: "Curso activo" },
  { id: "courseSectionCreate", label: "Alta curso" },
  { id: "courseSectionImport", label: "Importacion" },
  { id: "courseSectionCatalog", label: "Catalogo" }
];

const CAMPUS_SECTION_LINKS = [
  { id: "campusSectionAlerts", label: "Avisos" },
  { id: "campusSectionCourses", label: "Cursos" },
  { id: "campusSectionOperations", label: "Operativa" },
  { id: "campusSectionDiplomas", label: "Diplomas" },
  { id: "campusSectionGroups", label: "Grupos internos" }
];

const COURSE_ACCESS_SCOPE_LABELS = {
  members: "Solo socios",
  public: "Todo el mundo"
};

const OPERATION_SECTION_LINKS = [
  { id: "operationsSectionSummary", label: "Resumen" },
  { id: "operationsSectionAttendance", label: "Asistencia" }
];

const DIPLOMA_SECTION_LINKS = [
  { id: "diplomaSectionActions", label: "Acciones" },
  { id: "diplomaSectionDocuments", label: "Documentos" }
];

const REPORT_SECTION_LINKS = [
  { id: "reportSectionExports", label: "Exportaciones" },
  { id: "reportSectionValidation", label: "Validacion" },
  { id: "reportSectionStorage", label: "Almacenamiento" },
  { id: "reportSectionAgent", label: "Agente" }
];

const ACTIVITY_SECTION_LINKS = [{ id: "activitySectionTimeline", label: "Registro" }];

const AUTOMATION_SECTION_LINKS = [
  { id: "automationSectionStatus", label: "Motor" },
  { id: "automationSectionNotices", label: "Novedades" },
  { id: "automationSectionNext", label: "Siguiente tarea" },
  { id: "automationSectionInbox", label: "Bandeja" },
  { id: "automationSectionOutbox", label: "Salida" },
  { id: "automationSectionHistory", label: "Historial" }
];

const navItems = [
  { id: "overview", label: "Vision general", sections: OVERVIEW_SECTION_LINKS },
  { id: "join", label: "Hazte socio" },
  { id: "associates", label: "Socios y cuotas", sections: ASSOCIATE_SECTION_LINKS },
  { id: "members", label: "Personas y accesos", sections: MEMBER_SECTION_LINKS },
  { id: "campus", label: "Campus", sections: CAMPUS_SECTION_LINKS },
  { id: "reports", label: "Informes y validacion", sections: REPORT_SECTION_LINKS },
  { id: "automation", label: "Asistente y automatizacion", sections: AUTOMATION_SECTION_LINKS }
];

const VIEW_SECTION_MODES = {
  associates: {
    associateSectionSummary: "all",
    associateSectionWorkbench: "workbench",
    associateSectionMigration: "migration",
    associateSectionLegacyReview: "legacy",
    associateSectionPendingFees: "fees",
    associateSectionQuickReview: "applications",
    associateSectionFilters: "filters",
    associateSectionApplications: "applications",
    associateSectionPayments: "fees",
    associateSectionProfiles: "profiles",
    associateSectionAssociates: "directory"
  },
  members: {
    memberSectionWorkbench: "workbench",
    memberSectionCreate: "create",
    memberSectionImport: "import",
    memberSectionDirectory: "directory"
  },
  campus: {
    campusSectionAlerts: "alerts",
    campusSectionCourses: "courses",
    campusSectionOperations: "operations",
    campusSectionDiplomas: "diplomas",
    campusSectionGroups: "groups"
  },
  courses: {
    courseSectionWorkbench: "workbench",
    courseSectionCreate: "create",
    courseSectionImport: "import",
    courseSectionCatalog: "catalog"
  },
  operations: {
    operationsSectionSummary: "summary",
    operationsSectionAttendance: "attendance"
  },
  diplomas: {
    diplomaSectionActions: "actions",
    diplomaSectionDocuments: "documents"
  },
  reports: {
    reportSectionExports: "exports",
    reportSectionValidation: "validation",
    reportSectionStorage: "storage",
    reportSectionAgent: "agent"
  },
  automation: {
    automationSectionStatus: "status",
    automationSectionNotices: "notices",
    automationSectionNext: "next",
    automationSectionInbox: "inbox",
    automationSectionOutbox: "outbox",
    automationSectionHistory: "history"
  }
};

const MANUAL_NOTICE_AUDIENCE_LABELS = {
  all: "Todo el campus",
  "active-associates": "Socios activos",
  associates: "Solo socios",
  "campus-only": "Solo externos",
  course: "Alumnado de un curso"
};

const MANUAL_NOTICE_TONE_LABELS = {
  info: "Informativo",
  warning: "Importante",
  success: "Resuelto"
};

const CAMPUS_ACCOUNT_ROLE_LABELS = {
  member: "Socio / alumno",
  admin: "Administracion"
};

const ADMIN_ONLY_VIEWS = new Set(["associates", "validations", "members", "reports", "activity", "automation"]);

function buildDefaultCampusGroups() {
  return [
    {
      id: "campus-group-structural-fires",
      title: "Incendios Estructurales",
      summary: "Material interno para intervencion, tactica, seguridad y practicas en incendios estructurales.",
      modules: [
        {
          id: "group-module-structural-fires-lines",
          title: "Gestion de tendidos",
          summary: "Tendidos, abastecimiento, organizacion de lineas y despliegue interior.",
          documents: [],
          practiceSheets: [],
          videos: [],
          links: []
        },
        {
          id: "group-module-structural-fires-ventilation",
          title: "Ventilacion",
          summary: "Ventilacion operativa, control de humos y coordinacion con ataque interior.",
          documents: [],
          practiceSheets: [],
          videos: [],
          links: []
        },
        {
          id: "group-module-structural-fires-sar",
          title: "Busqueda y rescate interior",
          summary: "Busqueda, localizacion de victimas y seguridad en ambiente hostil.",
          documents: [],
          practiceSheets: [],
          videos: [],
          links: []
        }
      ]
    },
    {
      id: "campus-group-traffic",
      title: "Accidentes de Trafico",
      summary: "Procedimientos, fichas y recursos internos para rescate en siniestros viales.",
      modules: [
        {
          id: "group-module-traffic-stabilization",
          title: "Estabilizacion y seguridad",
          summary: "Aseguramiento del escenario, estabilizacion y trabajo con vehiculo siniestrado.",
          documents: [],
          practiceSheets: [],
          videos: [],
          links: []
        },
        {
          id: "group-module-traffic-extrication",
          title: "Excarcelacion",
          summary: "Secuencias de liberacion, herramientas y coordinacion sanitaria.",
          documents: [],
          practiceSheets: [],
          videos: [],
          links: []
        }
      ]
    },
    {
      id: "campus-group-vertical",
      title: "Rescate Vertical",
      summary: "Biblioteca de maniobras, fichas de practica, videos y referencias de rescate vertical.",
      modules: [
        {
          id: "group-module-vertical-progressions",
          title: "Progresion y acceso",
          summary: "Progresion vertical, acceso por cuerda y maniobras base.",
          documents: [],
          practiceSheets: [],
          videos: [],
          links: []
        },
        {
          id: "group-module-vertical-anchors",
          title: "Anclajes y cabeceras",
          summary: "Montaje de cabeceras, triangulacion y reparto de cargas.",
          documents: [],
          practiceSheets: [],
          videos: [],
          links: []
        }
      ]
    },
    {
      id: "campus-group-technological",
      title: "Riesgos Tecnologicos",
      summary: "Recursos internos para incidentes NRBQ, fugas, derrames y escenarios tecnologicos.",
      modules: [
        {
          id: "group-module-tech-hazmat",
          title: "NRBQ y materias peligrosas",
          summary: "Reconocimiento de sustancias, zonas, control de escena y proteccion.",
          documents: [],
          practiceSheets: [],
          videos: [],
          links: []
        },
        {
          id: "group-module-tech-leaks",
          title: "Fugas y derrames",
          summary: "Contencion, control inicial y coordinacion ante incidentes tecnologicos.",
          documents: [],
          practiceSheets: [],
          videos: [],
          links: []
        }
      ]
    },
    {
      id: "campus-group-multidisciplinary",
      title: "Multidisciplinar",
      summary: "Contenidos transversales, coordinacion, liderazgo, comunicaciones y trabajo conjunto.",
      modules: [
        {
          id: "group-module-multi-door-entry",
          title: "Apertura de puertas",
          summary: "Tecnicas, criterios de seguridad, herramientas y secuencia de apertura.",
          documents: [],
          practiceSheets: [],
          videos: [],
          links: []
        },
        {
          id: "group-module-multi-elevators",
          title: "Ascensores",
          summary: "Procedimiento de rescate, bloqueo, liberacion y seguridad en hueco.",
          documents: [],
          practiceSheets: [],
          videos: [],
          links: []
        },
        {
          id: "group-module-multi-suicide",
          title: "Tentativas de suicidio",
          summary: "Intervencion, aproximacion, comunicacion y coordinacion interviniente.",
          documents: [],
          practiceSheets: [],
          videos: [],
          links: []
        }
      ]
    }
  ];
}

const fallbackState = {
  role: "admin",
  activeView: "overview",
  selectedCourseId: null,
  selectedMemberId: null,
  selectedAssociateApplicationId: null,
  selectedAssociatePaymentSubmissionId: null,
  selectedAssociateProfileRequestId: null,
  selectedAssociateId: null,
  selectedCampusGroupId: null,
  accounts: [],
  activityLog: [],
  agentLog: [],
  automationInbox: [],
  manualCampusNotices: [],
  automationMeta: {
    lastRunAt: "",
    lastReason: "",
    lastSummary: null
  },
  emailOutbox: [],
  associateApplications: [],
  associatePaymentSubmissions: [],
  associateProfileRequests: [],
  associates: [],
  campusGroups: buildDefaultCampusGroups(),
  settings: {
    organization: "Asociacion de Bomberos Isocrona Zero",
    certificateCity: "Madrid",
    diplomaSignerA: "Direccion de Formacion",
    diplomaSignerB: "Presidencia de la Asociacion",
    emailTemplate: "",
    automationTone: "",
    automation: {
      autoGenerateDiplomas: true,
      autoPromoteWaitlist: true,
      autoAdvanceCourseStatus: true,
      autoSendDiplomas: true,
      autoDetectRenewals: true,
      autoDetectFailedEmails: true,
      autoRunOnSave: true
    },
    agent: {
      enabled: true,
      canResolveInbox: true,
      canSendDiplomas: true,
      canCloseCourses: true,
      notes:
        "No modificar apto/no apto ni asistencia sin validacion humana. Puede resolver bandeja automatica y preparar trabajo."
    },
    associates: {
      defaultAnnualAmount: 50,
      nextAssociateNumber: 1,
      autoCreateCampusAccess: true,
      autoSendWelcomeEmail: true,
      autoSendApplicationReceipt: true,
      autoSendApplicationInfoRequest: true,
      autoSendApplicationDecision: true,
      autoSendApplicantReplyNotification: true,
      autoSendApplicantReplyReceipt: true,
      defaultMemberRole: "Socio",
      applicationFormNotice:
        "La solicitud queda registrada y pasa a revision administrativa antes de activar el numero de socio."
    },
    smtp: {
      host: "",
      port: 465,
      secure: true,
      startTls: false,
      username: "",
      password: "",
      fromEmail: "",
      fromName: "Isocrona Zero Campus",
      testTo: ""
    }
  },
  members: [],
  courses: []
};

let state = structuredClone(fallbackState);
let session = null;
let viewRole = "admin";
let campusAttachmentPreview = null;
let campusPdfJsPromise = null;
let campusPreviewRenderToken = 0;

const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const requestUrl =
    typeof input === "string"
      ? input
      : input instanceof Request
        ? input.url
        : String(input?.url || "");
  const isSameOriginRequest =
    !requestUrl ||
    requestUrl.startsWith("/") ||
    requestUrl.startsWith(window.location.origin);

  if (!isSameOriginRequest) {
    return nativeFetch(input, init);
  }

  const requestCredentials = init.credentials || (input instanceof Request ? input.credentials : undefined);
  if (requestCredentials || !session?.accountId) {
    return nativeFetch(input, init);
  }

  return nativeFetch(input, {
    ...init,
    credentials: "same-origin"
  });
};

const ASSOCIATE_PAGE_SIZE = {
  applications: 8,
  payments: 8,
  profiles: 8,
  directory: 25
};
let associateFilters = {
  query: "",
  service: "all",
  review: "all",
  readiness: "all",
  quota: "all",
  migration: "all"
};
let selectedAssociateApplicationIds = [];
let selectedAssociatePaymentSubmissionIds = [];
let selectedAssociateProfileRequestIds = [];
let associateWorkbookPreview = null;
let associateWorkbookDraftFile = null;
let associateWorkbookImportStatus = "";
let storageImportDraftFile = null;
let storageImportStatus = "";
let storageExportStatus = "";
let hasLoaded = false;
let syncStatus = "Cargando datos...";
let loginStatus = "Introduce tus credenciales para entrar.";
let passwordChangeStatus = "Debes cambiar la contrasena temporal para entrar al campus.";
let saveSequence = Promise.resolve();
let storageMeta = null;
let associatePages = {
  applications: 1,
  payments: 1,
  profiles: 1,
  directory: 1
};
let expandedNavViews = new Set(["associates"]);
let associatesSectionMode = "directory";
let membersSectionMode = "directory";
let campusSectionMode = "courses";
let campusGroupContentMode = "documents";
let campusGroupSearchQuery = "";
let campusGroupResourceFilter = "all";
let selectedCampusGroupModuleId = "";
let coursesSectionMode = "catalog";
let courseWorkbenchMode = "overview";
let courseCurriculumMode = "modules";
let learnerCourseDetailsMode = "overview";
let learnerEnrollmentIntent = false;
let learnerCourseWorkspaceMode = "roadmap";
let learnerRoadmapSelection = {};
let operationsSectionMode = "summary";
let diplomasSectionMode = "actions";
let reportsSectionMode = "exports";
let automationSectionMode = "status";
let pendingInputFocusRestore = null;
let pendingViewAnchorId = "";
let reportValidationCode = "";
let reportValidationResult = null;
let toastMessage = "";
let toastType = "success";
let toastTimer = null;
let campusGroupAttachmentDrafts = {};
let pendingCampusGroupFileTarget = null;
let pendingCampusGroupDraftClearGroupId = "";
let publicCampusCourses = [];
let publicCampusStatus = "Cargando cursos abiertos...";
const ADMIN_ONLY_TOP_LEVEL_VIEWS = new Set(["associates", "validations", "members", "reports", "automation", "activity"]);

const navElement = document.getElementById("nav");
const metricsElement = document.getElementById("metrics");
const mainPanel = document.getElementById("mainPanel");
const sidePanel = document.getElementById("sidePanel");
const roleSwitcher = document.getElementById("roleSwitcher");
const memberSwitcher = document.getElementById("memberSwitcher");
const resetButton = document.getElementById("resetData");
const logoutButton = document.getElementById("logoutButton");
const assistantSummary = document.getElementById("assistantSummary");
const globalFilePicker = document.getElementById("globalFilePicker");
const syncStatusElement = document.getElementById("syncStatus");
const sessionStatusElement = document.getElementById("sessionStatus");
const toastLayer = document.getElementById("toastLayer");
const loginScreen = document.getElementById("loginScreen");
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginStatusElement = document.getElementById("loginStatus");
const publicCourseList = document.getElementById("publicCourseList");
const publicCampusStatusElement = document.getElementById("publicCampusStatus");
const publicCampusRegisterForm = document.getElementById("publicCampusRegisterForm");
const publicCampusFirstName = document.getElementById("publicCampusFirstName");
const publicCampusLastName = document.getElementById("publicCampusLastName");
const publicCampusEmail = document.getElementById("publicCampusEmail");
const publicCampusPhone = document.getElementById("publicCampusPhone");
const publicCampusPassword = document.getElementById("publicCampusPassword");
const passwordScreen = document.getElementById("passwordScreen");
const changePasswordForm = document.getElementById("changePasswordForm");
const currentPasswordInput = document.getElementById("currentPassword");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const changePasswordStatusElement = document.getElementById("changePasswordStatus");
const passwordLogoutButton = document.getElementById("passwordLogout");
const shellElement = document.getElementById("shell");
const sidebarElement = document.getElementById("sidebar");
const sidebarAssistantCard = document.getElementById("sidebarAssistantCard");
const contentElement = document.getElementById("content");
const heroElement = document.getElementById("hero");
const workspaceElement = document.getElementById("workspace");
const isLocalEnvironment = ["localhost", "127.0.0.1"].includes(window.location.hostname);

function getFrontendBridge() {
  return window.__IZ_FRONTEND_APP__ || null;
}

function getFrontendRole() {
  return isAdminView() ? "admin" : "member";
}

function buildFrontendCurrentUser() {
  if (!session) {
    return null;
  }

  return {
    id: session.memberId || session.accountId || session.email || session.name,
    memberId: session.memberId || "",
    email: session.email || "",
    name: session.name || ""
  };
}

function syncFrontendStore(overrides = {}) {
  const bridge = getFrontendBridge();
  if (!bridge?.store?.setState) {
    return null;
  }

  return bridge.store.setState({
    currentUser: buildFrontendCurrentUser(),
    role: getFrontendRole(),
    activeView: state.activeView,
    campusSectionMode,
    ...overrides
  });
}

function saveUiSnapshot() {
  try {
    const snapshot = {
      activeView: String(state.activeView || "").trim(),
      associatesSectionMode: String(associatesSectionMode || "").trim(),
      selectedAssociateId: String(state.selectedAssociateId || "").trim(),
      selectedCampusGroupId: String(state.selectedCampusGroupId || "").trim(),
      selectedCampusGroupModuleId: String(selectedCampusGroupModuleId || "").trim(),
      campusSectionMode: String(campusSectionMode || "").trim()
    };
    sessionStorage.setItem(UI_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch (error) {
  }
}

function restoreUiSnapshot() {
  try {
    const raw = sessionStorage.getItem(UI_SNAPSHOT_KEY);
    if (!raw) {
      return;
    }

    const snapshot = JSON.parse(raw);
    const requestedView = resolveCampusAliasView(String(snapshot?.activeView || "").trim());
    if (requestedView && isViewAllowed(requestedView)) {
      state.activeView = requestedView;
    }

    const nextAssociatesSectionMode = String(snapshot?.associatesSectionMode || "").trim();
    if (nextAssociatesSectionMode) {
      associatesSectionMode = nextAssociatesSectionMode;
    }

    const nextCampusSectionMode = String(snapshot?.campusSectionMode || "").trim();
    if (nextCampusSectionMode) {
      campusSectionMode = nextCampusSectionMode;
    }

    const selectedAssociateId = String(snapshot?.selectedAssociateId || "").trim();
    if (selectedAssociateId && findAssociate(selectedAssociateId)) {
      state.selectedAssociateId = selectedAssociateId;
    }

    const selectedGroupId = String(snapshot?.selectedCampusGroupId || "").trim();
    const selectedGroup =
      (selectedGroupId && state.campusGroups.find((group) => group.id === selectedGroupId)) || null;
    if (selectedGroup) {
      state.selectedCampusGroupId = selectedGroup.id;
    }

    const selectedModuleId = String(snapshot?.selectedCampusGroupModuleId || "").trim();
    const activeGroup = getSelectedCampusGroup();
    const selectedModule =
      activeGroup && selectedModuleId
        ? (activeGroup.modules || []).find((module) => module.id === selectedModuleId) || null
        : null;
    if (selectedModule) {
      selectedCampusGroupModuleId = selectedModule.id;
    }
  } catch (error) {
  }
}

function navigateWithFrontendRouter(view) {
  const bridge = getFrontendBridge();
  if (!bridge?.router?.navigateTo) {
    return null;
  }

  syncFrontendStore();
  return bridge.router.navigateTo(view);
}

function renderFrontendTestView() {
  const bridge = getFrontendBridge();
  const renderTest = bridge?.views?.test;

  if (typeof renderTest !== "function") {
    mainPanel.innerHTML = '<div class="empty-state">La vista de test todavia no esta disponible.</div>';
    return;
  }

  syncFrontendStore({ activeView: "test" });
  mainPanel.innerHTML = "";
  renderTest(mainPanel, getFrontendRole());
}

document.querySelectorAll(".local-only").forEach((element) => {
  element.hidden = !isLocalEnvironment;
});

document.addEventListener("iz:frontend-app-ready", () => {
  syncFrontendStore();
  if (session && state.activeView === "test") {
    render();
  }
});

function updateRoleSwitcherOptions() {
  if (!roleSwitcher) {
    return;
  }
  const adminOption = roleSwitcher.querySelector('option[value="admin"]');
  const selfOption = roleSwitcher.querySelector('option[value="member-self"]');
  const previewOption = roleSwitcher.querySelector('option[value="member-preview"]');
  if (adminOption) {
    adminOption.textContent = "Administracion";
  }
  if (selfOption) {
    selfOption.textContent = "Mi perfil socio y alumno";
  }
  if (previewOption) {
    previewOption.textContent = "Previsualizar otra persona";
  }
}

roleSwitcher.addEventListener("change", async (event) => {
  if (!isAdminSession()) {
    return;
  }

  const wasMemberView = !isAdminView();
  const requestedRole = event.target.value;
  if (requestedRole === "member-self" && !session?.memberId) {
    viewRole = "admin";
    syncStatus = "Tu cuenta admin no esta vinculada a una ficha de socio real";
    showToast("Primero vincula tu cuenta admin a una ficha de socio para usar Mi perfil socio", "warning");
  } else if (requestedRole === "member-preview") {
    viewRole = "member-preview";
  } else if (requestedRole === "member-self") {
    viewRole = "member-self";
    state.activeView = "overview";
  } else {
    viewRole = "admin";
  }
  persistViewRole();
  if (requestedRole === "admin" && wasMemberView) {
    await refreshState({ forceAdminState: true });
  } else if (!isAdminView()) {
    await refreshState();
  }
  applySessionToState();
  if (requestedRole !== "member-self" || session?.memberId) {
    syncStatus =
      viewRole === "member-preview"
        ? "Vista alumno activada para previsualizar cambios"
        : viewRole === "member-self"
        ? "Mi perfil socio activado"
        : "Vista administracion recuperada";
  }
  render();
});

memberSwitcher.addEventListener("change", async (event) => {
  state.selectedMemberId = event.target.value;
  await persistAndRender("Persona activa actualizada");
});

resetButton?.addEventListener("click", async () => {
  if (!isAdminSession()) {
    return;
  }

  syncStatus = "Restableciendo entorno local...";
  render();

  const response = await fetch("/api/reset", { method: "POST" });
  state = normalizeState(await response.json());
  applySessionToState();
  hasLoaded = true;
  syncStatus = "Entorno local restablecido";
  showToast("Entorno local restablecido", "success");
  render();
});

logoutButton.addEventListener("click", async () => {
  try {
    await fetch("/api/logout", { method: "POST" });
  } catch (error) {
  }
  clearSession();
  loginStatus = "Sesion cerrada. Introduce tus credenciales.";
  render();
});

passwordLogoutButton.addEventListener("click", async () => {
  try {
    await fetch("/api/logout", { method: "POST" });
  } catch (error) {
  }
  clearSession();
  loginStatus = "Sesion cerrada. Introduce tus credenciales.";
  passwordChangeStatus = "Debes cambiar la contrasena temporal para entrar al campus.";
  render();
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  loginStatus = "Validando acceso...";
  render();

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: loginEmail.value.trim(),
        password: loginPassword.value
      })
    });

    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(
        `${payload.error || "Acceso denegado"}. Si ya cambiaste la contrasena, la temporal del correo ya no sirve.`
      );
    }

    session = payload.session;
    persistSession();
    viewRole = session.role === "admin" ? "admin" : "member-self";
    persistViewRole();
    await refreshState();
    if (session.role === "admin") {
      await ensureAdminStateLoaded();
    }
    applySessionToState();
    loginPassword.value = "";
    passwordChangeStatus = session.mustChangePassword
      ? "Tu cuenta usa una contrasena temporal. Actualizala para continuar."
      : "";
    addActivity(session.role === "admin" ? "admin" : "member", session.name, "Ha iniciado sesion");
    loginStatus = "Acceso correcto.";
    showToast("Acceso correcto", "success");
  } catch (error) {
    loginStatus = error.message || "No se pudo iniciar sesion.";
    showToast(loginStatus, "error");
  }

  render();
});

publicCampusRegisterForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  publicCampusStatus = "Creando acceso solo campus...";
  render();

  try {
    const response = await fetch("/api/public-campus/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: publicCampusFirstName?.value.trim() || "",
        lastName: publicCampusLastName?.value.trim() || "",
        email: publicCampusEmail?.value.trim() || "",
        phone: publicCampusPhone?.value.trim() || "",
        password: publicCampusPassword?.value || ""
      })
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "No se pudo crear el acceso al campus");
    }

    session = payload.session;
    viewRole = "member-self";
    persistSession();
    persistViewRole();
    await refreshState();
    applySessionToState();
    publicCampusRegisterForm.reset();
    publicCampusStatus = "Acceso solo campus creado correctamente.";
    loginStatus = payload.message || "Acceso correcto.";
    showToast(payload.message || "Acceso solo campus creado correctamente", "success");
  } catch (error) {
    publicCampusStatus = error.message || "No se pudo crear el acceso solo campus";
    showToast(publicCampusStatus, "error");
  }

  render();
});

document.addEventListener("click", (event) => {
  const routeCard = event.target.closest("[data-focus-target]");
  if (!routeCard || routeCard.closest("[data-action]")) {
    return;
  }

  const selector = routeCard.dataset.focusTarget;
  if (!selector) {
    return;
  }

  const target = document.querySelector(selector);
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "center" });
  if (typeof target.focus === "function") {
    window.setTimeout(() => target.focus(), 220);
  }
});

document.addEventListener("keydown", (event) => {
  const routeCard = event.target.closest("[data-focus-target]");
  if (!routeCard) {
    return;
  }

  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  routeCard.click();
});

document.addEventListener("click", async (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget || !hasLoaded || !session) {
    return;
  }

  event.preventDefault();

  const action = actionTarget.dataset.action;
  const courseId = actionTarget.dataset.courseId;
  const memberId = actionTarget.dataset.memberId;
  let shouldPersist = false;

  if (action === "nav") {
    const requestedView = actionTarget.dataset.view;
    const requestedAnchorId = String(actionTarget.dataset.anchor || "").trim();
    const effectiveRequestedView = resolveCampusAliasView(requestedView);
    const navItem = navItems.find((item) => item.id === effectiveRequestedView);

    if (isAdminSession() && ADMIN_ONLY_TOP_LEVEL_VIEWS.has(effectiveRequestedView) && !isAdminView()) {
      const wasMemberView = !isAdminView();
      viewRole = "admin";
      persistViewRole();
      if (wasMemberView) {
        await refreshState();
      }
      applySessionToState();
      syncStatus = "Vista administracion recuperada";
    }

    if (isAdminSession() && isAdminView() && ADMIN_ONLY_TOP_LEVEL_VIEWS.has(effectiveRequestedView)) {
      try {
        await ensureAdminStateLoaded();
      } catch (error) {
        syncStatus = error.message || "No se pudo recargar el estado de administracion";
        showToast(syncStatus, "error");
      }
    }

    if (isCurrentMemberLimitedToAssociateProfile() && effectiveRequestedView !== "join") {
      state.activeView = "join";
      pendingViewAnchorId = "";
      syncStatus = "Tienes la cuota pendiente. Por ahora solo puedes revisar tu ficha de socio.";
      showToast(syncStatus, "warning");
      render();
      return;
    }

    if (requestedView === state.activeView && effectiveRequestedView === "overview") {
      expandedNavViews.add("overview");
      pendingViewAnchorId = "";
      render();
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
      saveUiSnapshot();
      return;
    }

    if (requestedView === state.activeView && navItem?.sections?.length) {
      if (expandedNavViews.has(requestedView)) {
        expandedNavViews.delete(requestedView);
      } else {
        expandedNavViews.add(requestedView);
      }
      renderNav();
      saveUiSnapshot();
      return;
    }

    if (requestedView === "test") {
      const routeResult = navigateWithFrontendRouter("test");
      pendingViewAnchorId = "";
      state.activeView = routeResult?.activeView || "test";
      setFocusedViewMode(state.activeView);
      render();
      return;
    }

    if (!isAdminView() && requestedView === "join") {
      syncMemberContextSelection("join");
      state.activeView = "join";
      pendingViewAnchorId = requestedAnchorId;
    } else if (!isAdminView() && requestedView === "courses") {
      pendingViewAnchorId = "";
      activateMemberCampusMode("courses", { focusCatalog: true });
    } else if (!isAdminView() && requestedView === "diplomas") {
      pendingViewAnchorId = "";
      activateMemberCampusMode("diplomas");
    } else if (requestedView === "courses") {
      pendingViewAnchorId = "";
      state.activeView = "campus";
      campusSectionMode = "courses";
    } else if (requestedView === "operations") {
      pendingViewAnchorId = "";
      state.activeView = "campus";
      campusSectionMode = "operations";
    } else if (requestedView === "diplomas") {
      pendingViewAnchorId = "";
      state.activeView = "campus";
      campusSectionMode = "diplomas";
    } else {
      pendingViewAnchorId = requestedAnchorId;
      state.activeView = requestedView;
      setFocusedViewMode(state.activeView);
    }

    if (effectiveRequestedView === "associates" && isAdminView()) {
      associatesSectionMode = "directory";
      associateFilters = {
        query: "",
        service: "all",
        review: "all",
        readiness: "all",
        quota: "all",
        migration: "all"
      };
      resetAssociatePages();
    }

    const activeNavItem = navItems.find((item) => item.id === state.activeView);
    if (activeNavItem?.sections?.length) {
      expandedNavViews.add(state.activeView);
    }
    if (courseId) {
      state.selectedCourseId = courseId;
    }
    if (memberId) {
      state.selectedMemberId = memberId;
    }
    saveUiSnapshot();
    render();
    return;
  }

  if (action === "toggle-nav-group") {
    const viewId = actionTarget.dataset.view;
    if (!viewId) {
      return;
    }

    if (expandedNavViews.has(viewId)) {
      expandedNavViews.delete(viewId);
    } else {
      expandedNavViews.add(viewId);
    }
    renderNav();
    return;
  }

  if (action === "set-associate-section-mode") {
    associatesSectionMode = actionTarget.dataset.mode || "directory";
    if (associatesSectionMode === "all") {
      associatesSectionMode = "directory";
    }
    saveUiSnapshot();
    render();
    if (associatesSectionMode === "workbench" && !findAssociate(state.selectedAssociateId)) {
      requestAnimationFrame(() => document.getElementById("associateSearchFilter")?.focus({ preventScroll: true }));
    }
    return;
  }

  if (action === "set-associate-page") {
    const pageKey = actionTarget.dataset.pageKey;
    const nextPage = Number(actionTarget.dataset.page || 1);
    if (!pageKey || !Object.prototype.hasOwnProperty.call(associatePages, pageKey)) {
      return;
    }
    associatePages[pageKey] = Math.max(1, nextPage || 1);
    render();
    return;
  }

  if (action === "return-to-admin-view" && isAdminSession()) {
    const wasMemberView = !isAdminView();
    viewRole = "admin";
    persistViewRole();
    if (wasMemberView) {
      await refreshState();
    }
    await ensureAdminStateLoaded();
    applySessionToState();
    syncStatus = "Vista administracion recuperada";
    showToast(syncStatus, "success");
    render();
    return;
  }

  if (action === "set-member-section-mode") {
    membersSectionMode = actionTarget.dataset.mode || "all";
    render();
    return;
  }

    if (action === "set-campus-section-mode") {
      const nextMode = actionTarget.dataset.mode || "all";
      if (isAdminView()) {
        state.activeView = "campus";
        campusSectionMode = nextMode;
        if (campusSectionMode === "groups" && !getSelectedCampusGroup()) {
          state.selectedCampusGroupId = state.campusGroups[0]?.id || null;
          selectedCampusGroupModuleId = state.campusGroups[0]?.modules?.[0]?.id || "";
        }
      } else {
        activateMemberCampusMode(nextMode, {
          focusCatalog: nextMode === "courses",
          focusWorkbench: nextMode === "courses" && actionTarget.dataset.focus === "workbench"
        });
      }
      saveUiSnapshot();
      render();
      return;
    }

    if (action === "set-campus-group-content-mode") {
      campusGroupContentMode = actionTarget.dataset.mode || "documents";
      render();
      return;
    }

    if (action === "set-campus-group-resource-filter") {
      campusGroupResourceFilter = actionTarget.dataset.filter || "all";
      render();
      return;
    }

    if (action === "preview-campus-attachment") {
      const previewSrc = String(actionTarget.dataset.previewSrc || "").trim();
      const previewName = String(actionTarget.dataset.previewName || "Recurso").trim();
      const previewKind = String(actionTarget.dataset.previewKind || "document").trim();
      if (!previewSrc) {
        return;
      }
      clearCampusAttachmentPreview();
      let resolvedSrc = previewSrc;
      let objectUrl = "";
      if (previewKind === "pdf" && previewSrc.startsWith("data:")) {
        try {
          const blob = dataUrlToBlob(previewSrc);
          objectUrl = URL.createObjectURL(blob);
          resolvedSrc = objectUrl;
        } catch (error) {
          showToast(error.message || "No se pudo preparar el PDF", "error");
          return;
        }
      } else if (previewKind !== "pdf" && previewKind !== "office" && !previewSrc.startsWith("data:")) {
        try {
          const response = await fetch(previewSrc, { credentials: "same-origin" });
          if (!response.ok) {
            throw new Error("No se pudo abrir el recurso");
          }
          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);
          resolvedSrc = objectUrl;
        } catch (error) {
          showToast(error.message || "No se pudo abrir el recurso", "error");
          return;
        }
      }
      campusAttachmentPreview = {
        src: resolvedSrc,
        originalSrc: previewSrc,
        name: previewName,
        kind: previewKind,
        objectUrl
      };
      render();
      return;
    }

    if (action === "close-campus-attachment-preview") {
      clearCampusAttachmentPreview();
      render();
      return;
    }

    if (action === "pick-campus-group-file" && isAdminSession()) {
      const group = getSelectedCampusGroup();
      const selectedModule = getSelectedCampusGroupModule(group) || group?.modules?.[0] || null;
      const category = actionTarget.dataset.category || "";
      const entryId = actionTarget.dataset.entryId || "";
      if (!group || !selectedModule || !category || !entryId || !globalFilePicker) {
        return;
      }
      pendingCampusGroupFileTarget = {
        groupId: group.id,
        moduleId: selectedModule.id,
        category,
        entryId
      };
      globalFilePicker.accept = getCampusGroupFileAccept(category);
      globalFilePicker.value = "";
      globalFilePicker.click();
      return;
    }

    if (action === "select-campus-group-module") {
      selectedCampusGroupModuleId = actionTarget.dataset.moduleId || "";
      saveUiSnapshot();
      render();
      return;
    }

    if (action === "open-member-campus-mode") {
      activateMemberCampusMode(actionTarget.dataset.mode || "courses", {
        focusCatalog: true
      });
      render();
      return;
    }

  if (action === "set-course-section-mode") {
    const nextMode = actionTarget.dataset.mode || "all";
    if (!isAdminView()) {
      const preferredCourse = syncMemberContextSelection("courses");
      const memberId = state.selectedMemberId;
      const hasOwnPreferredCourse = Boolean(
        preferredCourse &&
          memberId &&
          (preferredCourse.enrolledIds.includes(memberId) || preferredCourse.waitingIds.includes(memberId))
      );
      if (nextMode === "workbench" && !hasOwnPreferredCourse) {
        coursesSectionMode = "all";
        learnerCourseDetailsMode = "overview";
        syncStatus = "Todavia no tienes un aula activa. Te mostramos tus cursos visibles.";
      } else if (nextMode === "details" && !preferredCourse) {
        coursesSectionMode = "all";
        learnerCourseDetailsMode = "overview";
      } else {
        coursesSectionMode = nextMode;
      }
    } else {
      coursesSectionMode = nextMode;
    }
    render();
    return;
  }

  if (action === "set-course-workbench-mode") {
    courseWorkbenchMode = actionTarget.dataset.mode || "overview";
    if (courseWorkbenchMode === "curriculum") {
      courseCurriculumMode = "modules";
    }
    render();
    requestAnimationFrame(() => {
      if (actionTarget.dataset.scrollTarget) {
        focusElementById(actionTarget.dataset.scrollTarget);
        return;
      }
      focusCoursesWorkbench();
    });
    return;
  }

  if (action === "set-course-preview-member" && isAdminSession() && courseId && memberId) {
    const member = findMember(memberId);
    state.selectedCourseId = courseId;
    state.selectedMemberId = memberId;
    viewRole = "member-preview";
    persistViewRole();
    applySessionToState();
    state.activeView = "campus";
    campusSectionMode = "courses";
    coursesSectionMode = "workbench";
    courseWorkbenchMode = actionTarget.dataset.mode || "learner";
    if (courseWorkbenchMode === "learner") {
      learnerCourseWorkspaceMode = "roadmap";
    }
    expandedNavViews.add("campus");
    syncStatus = member
      ? `Vista alumno preparada para ${member.name}`
      : "Vista alumno preparada";
    render();
    requestAnimationFrame(() => {
      if (actionTarget.dataset.scrollTarget) {
        focusElementById(actionTarget.dataset.scrollTarget);
        return;
      }
      focusCoursesWorkbench();
    });
    return;
  }

  if (action === "set-course-curriculum-mode") {
    courseCurriculumMode = actionTarget.dataset.mode || "modules";
    render();
    requestAnimationFrame(() => focusCoursesWorkbench());
    return;
  }

  if (action === "set-learner-course-workspace-mode") {
    learnerCourseWorkspaceMode = actionTarget.dataset.mode || "roadmap";
    render();
    requestAnimationFrame(() => focusLearnerWorkspaceSection(learnerCourseWorkspaceMode));
    return;
  }

  if (action === "set-learner-roadmap-module" && courseId) {
    const requestedIndex = Math.max(0, Number(actionTarget.dataset.index || 0));
    const course = state.courses.find((item) => item.id === courseId);
    if (course && courseWorkbenchMode === "learner") {
      const memberId = state.selectedMemberId;
      const maxUnlockedIndex = getLearnerUnlockedModuleIndex(course, memberId);
      if (requestedIndex > maxUnlockedIndex) {
        const nextStep = getNextLearnerStep(course, memberId);
        syncStatus = nextStep
          ? `Primero completa ${nextStep.block?.title || nextStep.lessonTitle || "el paso actual"} para avanzar al siguiente modulo.`
          : "Primero completa el modulo actual para avanzar.";
        render();
        return;
      }
    }
    learnerRoadmapSelection[courseId] = requestedIndex;
    render();
    return;
  }

  if (action === "set-learner-course-details-mode") {
    learnerCourseDetailsMode = actionTarget.dataset.mode || "overview";
    if (learnerCourseDetailsMode !== "status") {
      learnerEnrollmentIntent = false;
    }
    render();
    requestAnimationFrame(() => {
      if (actionTarget.dataset.scrollTarget) {
        focusElementById(actionTarget.dataset.scrollTarget);
        return;
      }
      focusCourseDetailsSection(learnerCourseDetailsMode);
    });
    return;
  }

  if (action === "open-course-workbench-tab" && courseId) {
    state.selectedCourseId = courseId;
    state.activeView = "campus";
    campusSectionMode = "courses";
    coursesSectionMode = "workbench";
    courseWorkbenchMode = actionTarget.dataset.mode || "ficha";
    if (courseWorkbenchMode === "learner") {
      learnerCourseWorkspaceMode = "roadmap";
    }
    expandedNavViews.add("campus");
    syncStatus = "Curso abierto en la zona central";
    render();
    requestAnimationFrame(() => focusCoursesWorkbench());
    return;
  }

  if (action === "open-linked-associate" && memberId) {
    const member = findMember(memberId);
    const associate =
      (member?.associateId && findAssociate(member.associateId)) ||
      state.associates.find((item) => item.linkedMemberId === memberId) ||
      null;
    if (!associate) {
      return;
    }

    state.selectedAssociateId = associate.id;
    state.activeView = "associates";
    associatesSectionMode = "workbench";
    expandedNavViews.add("associates");
    syncStatus = "Ficha de socio cargada en la zona central";
    saveUiSnapshot();
    render();
    requestAnimationFrame(() => focusAssociatesWorkbench());
    return;
  }

  if (action === "set-operations-section-mode") {
    operationsSectionMode = actionTarget.dataset.mode || "all";
    render();
    return;
  }

  if (action === "set-diplomas-section-mode") {
    diplomasSectionMode = actionTarget.dataset.mode || "all";
    render();
    return;
  }

  if (action === "set-reports-section-mode") {
    reportsSectionMode = actionTarget.dataset.mode || "all";
    render();
    return;
  }

  if (action === "set-automation-section-mode") {
    automationSectionMode = actionTarget.dataset.mode || "all";
    render();
    return;
  }

  if (action === "publish-manual-campus-notice" && isAdminView()) {
    const title = String(document.getElementById("manualNoticeTitle")?.value || "").trim();
    const detail = String(document.getElementById("manualNoticeDetail")?.value || "").trim();
    const audience = String(document.getElementById("manualNoticeAudience")?.value || "all").trim();
    const tone = String(document.getElementById("manualNoticeTone")?.value || "info").trim();
    const courseId = String(document.getElementById("manualNoticeCourseId")?.value || "").trim();
    const expiresAtRaw = String(document.getElementById("manualNoticeExpiresAt")?.value || "").trim();
    const actionLabel = String(document.getElementById("manualNoticeActionLabel")?.value || "").trim();
    const sendEmail = Boolean(document.getElementById("manualNoticeSendEmail")?.checked);

    if (!title || !detail) {
      showToast("Escribe un titulo y un mensaje para la novedad", "error");
      return;
    }
    if (audience === "course" && !courseId) {
      showToast("Si eliges alumnado de un curso, selecciona el curso", "error");
      return;
    }

    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;
    if (expiresAtRaw && (!expiresAt || Number.isNaN(expiresAt.getTime()))) {
      showToast("La fecha de caducidad no es valida", "error");
      return;
    }

    state.manualCampusNotices = state.manualCampusNotices || [];
    const notice = normalizeManualCampusNotice({
      id: `manual-notice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      detail,
      audience,
      tone,
      courseId,
      actionLabel,
      channels: {
        campus: true,
        email: sendEmail,
        whatsapp: false
      },
      expiresAt: expiresAt ? expiresAt.toISOString() : "",
      publishedAt: new Date().toISOString(),
      active: true
    });
    state.manualCampusNotices.unshift(notice);
    const queuedEmails = sendEmail ? queueManualNoticeEmails(notice) : 0;
    addActivity("admin", session?.name || "Administracion", `Publica novedad manual: ${title}`);
    automationSectionMode = "notices";
    await persistAndRender(
      queuedEmails
        ? `Novedad publicada y ${queuedEmails} correo(s) registrados en salida`
        : "Novedad publicada en el campus"
    );
    return;
  }

  if (action === "toggle-manual-campus-notice" && isAdminView()) {
    const noticeId = String(actionTarget.dataset.noticeId || "").trim();
    const notice = (state.manualCampusNotices || []).find((item) => item.id === noticeId);
    if (!notice) {
      return;
    }
    notice.active = notice.active === false;
    addActivity(
      "admin",
      session?.name || "Administracion",
      `${notice.active === false ? "Oculta" : "Vuelve a publicar"} la novedad: ${notice.title}`
    );
    automationSectionMode = "notices";
    await persistAndRender(notice.active === false ? "Novedad oculta" : "Novedad publicada de nuevo");
    return;
  }

  if (action === "delete-manual-campus-notice" && isAdminView()) {
    const noticeId = String(actionTarget.dataset.noticeId || "").trim();
    const notice = (state.manualCampusNotices || []).find((item) => item.id === noticeId);
    state.manualCampusNotices = (state.manualCampusNotices || []).filter((item) => item.id !== noticeId);
    if (notice) {
      addActivity("admin", session?.name || "Administracion", `Elimina la novedad: ${notice.title}`);
    }
    automationSectionMode = "notices";
    await persistAndRender("Novedad eliminada");
    return;
  }

  if (action === "nav-section") {
    const viewId = actionTarget.dataset.view;
    const sectionId = actionTarget.dataset.sectionId;
    if (!viewId || !sectionId) {
      return;
    }

    scrollToViewSection(viewId, sectionId);
    return;
  }

  if (action === "associate-section") {
    const sectionId = actionTarget.dataset.sectionId;
    if (!sectionId) {
      return;
    }
    scrollToViewSection("associates", sectionId);
    return;
  }

    if (action === "select-campus-group") {
      const groupId = actionTarget.dataset.groupId;
      if (!groupId) {
        return;
      }
      state.selectedCampusGroupId = groupId;
      const group = loadCampusDraft(groupId) || state.campusGroups.find((item) => item.id === groupId);
      selectedCampusGroupModuleId = group?.modules?.[0]?.id || "";
      state.activeView = "campus";
      campusSectionMode = "groups";
      campusGroupContentMode = campusGroupContentMode || "documents";
      expandedNavViews.add("campus");
      syncStatus = "Grupo interno cargado";
      saveUiSnapshot();
      render();
      return;
    }

    if (action === "add-campus-group-module" && isAdminSession()) {
      const group = getSelectedCampusGroup();
      if (!group) {
        return;
      }
      const draft = readCampusGroupEditorDraft(group) || group;
      const nextModules = [
        ...(draft.modules || []),
        normalizeCampusGroupModule(
          {
            title: `Modulo ${(draft.modules || []).length + 1}`,
            summary: "",
            documents: [],
            practiceSheets: [],
            videos: [],
            links: []
          },
          draft.id,
          (draft.modules || []).length
        )
      ];
      const nextGroup = normalizeCampusGroup({
        ...draft,
        modules: nextModules
      });
      state.campusGroups = state.campusGroups.map((item) => (item.id === group.id ? nextGroup : item));
      state.selectedCampusGroupId = nextGroup.id;
      selectedCampusGroupModuleId = nextModules[nextModules.length - 1]?.id || "";
      saveCampusDraft(nextGroup.id, nextGroup);
      render();
      return;
    }

  if (action === "add-campus-group-entry" && isAdminSession()) {
    const group = getSelectedCampusGroup();
    const category = actionTarget.dataset.category;
    if (!group || !["documents", "practiceSheets", "videos", "links"].includes(category)) {
      return;
    }
    const draft = readCampusGroupEditorDraft(group) || group;
    const selectedModule = getSelectedCampusGroupModule(draft) || draft.modules?.[0];
    if (!selectedModule) {
      return;
    }
    const nextModules = (draft.modules || []).map((module, moduleIndex) =>
      module.id === selectedModule.id
        ? normalizeCampusGroupModule(
            {
              ...module,
              [category]: [
                ...(module[category] || []),
                {
                  title: "",
                  url: "",
                  note: "",
                  attachment: null
                }
              ]
            },
            draft.id,
            moduleIndex
          )
        : module
    );
    const nextGroup = normalizeCampusGroup({
      ...draft,
      modules: nextModules
    });
    state.campusGroups = state.campusGroups.map((item) => (item.id === group.id ? nextGroup : item));
    state.selectedCampusGroupId = nextGroup.id;
    selectedCampusGroupModuleId = selectedModule.id;
    saveCampusDraft(nextGroup.id, nextGroup);
    render();
    return;
  }

  if (action === "remove-campus-group-entry" && isAdminSession()) {
    const group = getSelectedCampusGroup();
    const category = actionTarget.dataset.category;
    const entryId = actionTarget.dataset.entryId;
    if (!group || !entryId || !["documents", "practiceSheets", "videos", "links"].includes(category)) {
      return;
    }
    const draft = readCampusGroupEditorDraft(group) || group;
    const selectedModule = getSelectedCampusGroupModule(draft) || draft.modules?.[0];
    if (!selectedModule) {
      return;
    }
    const draftKey = getCampusGroupAttachmentDraftKey(group.id, selectedModule.id, category, entryId);
    delete campusGroupAttachmentDrafts[draftKey];
    const nextModules = (draft.modules || []).map((module, moduleIndex) =>
      module.id === selectedModule.id
        ? normalizeCampusGroupModule(
            {
              ...module,
              [category]: (module[category] || []).filter((entry) => entry.id !== entryId)
            },
            draft.id,
            moduleIndex
          )
        : module
    );
    const nextGroup = normalizeCampusGroup({
      ...draft,
      modules: nextModules
    });
    state.campusGroups = state.campusGroups.map((item) => (item.id === group.id ? nextGroup : item));
    state.selectedCampusGroupId = nextGroup.id;
    selectedCampusGroupModuleId = selectedModule.id;
    saveCampusDraft(nextGroup.id, nextGroup);
    render();
    return;
  }

  if (action === "save-campus-group" && isAdminSession()) {
    const group = getSelectedCampusGroup();
    if (!group) {
      return;
    }
    const draft = readCampusGroupEditorDraft(group);
    if (!draft) {
      return;
    }
    state.campusGroups = state.campusGroups.map((item) => (item.id === group.id ? draft : item));
    pendingCampusGroupDraftClearGroupId = group.id;
    shouldPersist = true;
    syncStatus = "Guardando grupo interno...";
  }

  if (action === "select-course") {
    state.selectedCourseId = courseId;
    state.activeView = "campus";
    campusSectionMode = "courses";
    learnerEnrollmentIntent = false;
    if (isAdminView()) {
      coursesSectionMode = "workbench";
      courseWorkbenchMode = "ficha";
    } else {
      coursesSectionMode = "details";
      learnerCourseDetailsMode = "overview";
    }
    expandedNavViews.add("campus");
    syncStatus = "Curso cargado en la zona central";
    render();
    requestAnimationFrame(() => {
      if (isAdminView()) {
        focusCoursesWorkbench();
        return;
      }
      focusCourseDetails();
    });
    return;
  }

  if (action === "prepare-course-enrollment" && courseId) {
      state.selectedCourseId = courseId;
      state.activeView = "campus";
      campusSectionMode = "courses";
    coursesSectionMode = "details";
    learnerCourseDetailsMode = "status";
    learnerEnrollmentIntent = true;
    expandedNavViews.add("campus");
    syncStatus = "Inscripcion abierta para este curso";
    render();
      requestAnimationFrame(() => focusCourseEnrollment());
      return;
    }

  if (action === "switch-to-member-self" && isAdminSession()) {
    let targetAccount =
      session?.memberId && session?.associateId
        ? state.accounts.find((item) => item.id === session.accountId)
        : null;

    if (!targetAccount) {
      targetAccount =
        state.accounts.find(
          (item) =>
            item.memberId === state.selectedMemberId &&
            item.associateId &&
            String(item.email || "").trim()
        ) || null;
    }

    if (!targetAccount) {
      syncStatus = "La persona seleccionada no tiene una cuenta de socio real vinculada";
      showToast(syncStatus, "error");
      render();
      return;
    }

    session = {
      accountId: targetAccount.id,
      name: targetAccount.name,
      email: targetAccount.email,
      role: targetAccount.role,
      memberId: targetAccount.memberId,
      associateId: targetAccount.associateId || "",
      mustChangePassword: Boolean(targetAccount.mustChangePassword)
    };
    persistSession();
    viewRole = "member-self";
    persistViewRole();
    await refreshState();
    applySessionToState();
    state.activeView = "overview";
    syncStatus = `Mi panel activado para ${targetAccount.name}`;
    showToast(syncStatus, "success");
    render();
    return;
  }

  if (action === "focus-course-bucket") {
    const targetId = actionTarget.dataset.targetId;
    if (!targetId) {
      return;
    }
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

  if (action === "set-enrollment-submission-status" && isAdminView() && courseId) {
    const submissionId = actionTarget.dataset.submissionId;
    const nextStatus = actionTarget.dataset.status;
    if (!submissionId || !nextStatus) {
      return;
    }
    try {
      syncStatus = "Actualizando inscripcion...";
      render();
      const response = await fetch(`/api/courses/${courseId}/enrollment-submissions/${submissionId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      const payload = await readJsonResponse(response, "No se pudo actualizar la inscripcion.");
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || "No se pudo actualizar la inscripcion.");
      }
      await refreshState();
      applySessionToState();
      syncStatus = payload.message || "Inscripcion actualizada";
      showToast(syncStatus, "success");
      render();
    } catch (error) {
      syncStatus = error.message || "No se pudo actualizar la inscripcion";
      showToast(syncStatus, "error");
      render();
    }
    return;
  }

  if (action === "prefill-report-validation" && isAdminView()) {
    reportValidationCode = String(actionTarget.dataset.code || "").trim();
    reportValidationResult = null;
    syncStatus = reportValidationCode ? `Codigo preparado para validar: ${reportValidationCode}` : "Introduce un codigo para validar";
    render();
    requestAnimationFrame(() => {
      const input = document.getElementById("reportValidationCode");
      if (input) {
        input.focus();
        input.select();
      }
    });
    return;
  }

  if (action === "run-report-validation" && isAdminView()) {
    const input = document.getElementById("reportValidationCode");
    reportValidationCode = String(input?.value || reportValidationCode || "").trim();
    if (!reportValidationCode) {
      syncStatus = "Introduce un codigo de diploma para validar";
      showToast(syncStatus, "error");
      render();
      return;
    }

    try {
      syncStatus = `Validando el codigo ${reportValidationCode}...`;
      render();
      const response = await fetch(`/api/verify?code=${encodeURIComponent(reportValidationCode)}`);
      const payload = await readJsonResponse(response, "No se pudo validar el codigo.");
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || "No se pudo validar el diploma.");
      }
      reportValidationResult = payload.diploma || null;
      syncStatus = "Codigo validado correctamente";
      showToast(syncStatus, "success");
      render();
    } catch (error) {
      reportValidationResult = { error: error.message || "No se pudo validar el diploma." };
      syncStatus = reportValidationResult.error;
      showToast(syncStatus, "error");
      render();
    }
    return;
  }

  if (action === "generate-course-blueprint" && isAdminSession()) {
    const course = getSelectedCourse();
    if (!course) {
      return;
    }

    Object.assign(course, readCourseEditorDraft(course));
    const blueprint = buildCourseBlueprint(course, actionTarget.dataset.template || course.contentTemplate);
    applyBlueprintToCourse(course, blueprint);
    addActivity("admin", session.name, `Ha generado la estructura base del curso ${course.title}`);
    await persistAndRender("Estructura base del curso generada");
    return;
  }

  if (action === "apply-course-template" && isAdminSession()) {
    const course = getSelectedCourse();
    if (!course) {
      return;
    }

    Object.assign(course, readCourseEditorDraft(course));
    const template = actionTarget.dataset.template || inferCourseTemplate(course);
    const blueprint = buildCourseBlueprint(course, template);
    applyBlueprintToCourse(course, blueprint);
    addActivity("admin", session.name, `Ha aplicado la plantilla ${getCourseTemplateLabel(template)} a ${course.title}`);
    await persistAndRender(`Plantilla ${getCourseTemplateLabel(template)} aplicada`);
    return;
  }

  if (action === "apply-course-starter" && isAdminSession()) {
    const preset = buildCourseStarterPreset(actionTarget.dataset.preset || "ventilation");
    const setValue = (id, value) => {
      const element = document.getElementById(id);
      if (element) {
        element.value = value;
      }
    };

    setValue("courseTitle", preset.title);
    setValue("courseClass", preset.courseClass);
    setValue("courseTemplate", preset.contentTemplate);
    setValue("courseType", preset.type);
    setValue("courseStart", preset.startDate);
    setValue("courseEnd", preset.endDate);
    setValue("courseHours", String(preset.hours));
    setValue("courseCapacity", String(preset.capacity));
    setValue("courseCoordinator", preset.coordinator);
    setValue("courseAudience", preset.audience);
    setValue("courseAccessScope", preset.accessScope || "members");
    syncStatus = `Base de alta cargada para ${preset.title}`;
    showToast(syncStatus, "success");
    return;
  }

  if (action === "add-course-module" && isAdminSession()) {
    const course = getSelectedCourse();
    if (!course) {
      return;
    }

    Object.assign(course, readCourseEditorDraft(course));
    course.modules = course.modules || [];
    course.modules.push(
      normalizeCourseModule(
        {
          title: `Modulo ${course.modules.length + 1}`,
          goal: "Definir el objetivo principal de este bloque.",
          format: "Sesion guiada",
          deliverable: "Evidencia o resultado esperado del modulo",
          lessons: [
            {
              title: "Nueva leccion",
              type: "Practica",
              duration: 1,
              resource: "Material pendiente",
              instructions: "Describe aqui el contenido o la dinamica."
            }
          ]
        },
        course.modules.length
      )
    );
    course.contentStatus = course.modules.length ? "outline" : course.contentStatus;
    await persistAndRender("Modulo anadido al curso");
    return;
  }

  if (action === "remove-course-module" && isAdminSession()) {
    const course = getSelectedCourse();
    const moduleIndex = Number(actionTarget.dataset.moduleIndex || -1);
    if (!course || moduleIndex < 0) {
      return;
    }

    Object.assign(course, readCourseEditorDraft(course));
    course.modules.splice(moduleIndex, 1);
    await persistAndRender("Modulo eliminado del curso");
    return;
  }

  if (action === "add-course-lesson" && isAdminSession()) {
    const course = getSelectedCourse();
    const moduleIndex = Number(actionTarget.dataset.moduleIndex || -1);
    Object.assign(course, readCourseEditorDraft(course));
    const module = course?.modules?.[moduleIndex];
    if (!module) {
      return;
    }

    module.lessons = module.lessons || [];
    module.lessons.push(
      normalizeCourseLesson(
        {
          title: `Leccion ${module.lessons.length + 1}`,
          type: "Practica",
          duration: 1,
          resource: "",
          instructions: "",
          body: "",
          activity: "",
          takeaway: "",
          assetLabel: "",
          assetUrl: "",
          publicationStatus: "draft",
          blocks: []
        },
        moduleIndex,
        module.lessons.length
      )
    );
    await persistAndRender("Leccion anadida al modulo");
    return;
  }

  if (action === "generate-course-content-pack" && isAdminSession()) {
    const course = getSelectedCourse();
    if (!course) {
      return;
    }

    Object.assign(course, readCourseEditorDraft(course));
    course.modules = (course.modules || []).map((module, moduleIndex) =>
      normalizeCourseModule(
        {
          ...module,
          lessons: (module.lessons || []).map((lesson, lessonIndex) =>
            normalizeCourseLesson(
              applyLessonScaffold(course, module, normalizeCourseLesson(lesson, moduleIndex, lessonIndex)),
              moduleIndex,
              lessonIndex
            )
          )
        },
        moduleIndex
      )
    );
    addActivity("admin", session.name, `Ha generado el pack editorial del curso ${course.title}`);
    await persistAndRender("Pack editorial generado para el curso");
    return;
  }

  if (action === "generate-lesson-content" && isAdminSession()) {
    const course = getSelectedCourse();
    const moduleIndex = Number(actionTarget.dataset.moduleIndex || -1);
    const lessonIndex = Number(actionTarget.dataset.lessonIndex || -1);
    if (!course || moduleIndex < 0 || lessonIndex < 0) {
      return;
    }

    Object.assign(course, readCourseEditorDraft(course));
    const module = course.modules?.[moduleIndex];
    const lesson = module?.lessons?.[lessonIndex];
    if (!module || !lesson) {
      return;
    }

    applyLessonScaffold(course, module, lesson);
    await persistAndRender("Leccion enriquecida con contenido base");
    return;
  }

  if (action === "publish-lesson-content" && isAdminSession()) {
    const course = getSelectedCourse();
    const moduleIndex = Number(actionTarget.dataset.moduleIndex || -1);
    const lessonIndex = Number(actionTarget.dataset.lessonIndex || -1);
    if (!course || moduleIndex < 0 || lessonIndex < 0) {
      return;
    }

    Object.assign(course, readCourseEditorDraft(course));
    const module = course.modules?.[moduleIndex];
    const lesson = module?.lessons?.[lessonIndex];
    if (!module || !lesson) {
      return;
    }

    applyLessonScaffold(course, module, lesson, { publicationStatus: "published" });
    if (course.contentStatus === "draft") {
      course.contentStatus = "outline";
    }
    await persistAndRender("Leccion marcada como publicada");
    return;
  }

  if (action === "toggle-lesson-complete" && courseId && memberId) {
    if (isMemberPreviewSession()) {
      syncStatus = "La vista alumno de previsualizacion no altera progreso real.";
      render();
      return;
    }

    if (!session || (session.role !== "member" && !isAdminSession())) {
      return;
    }

    const course = state.courses.find((item) => item.id === courseId);
    const lessonId = actionTarget.dataset.lessonId;
    if (!course || !lessonId) {
      return;
    }

    toggleLessonCompletion(course, memberId, lessonId);
    await persistAndRender("Progreso de leccion actualizado");
    return;
  }

  if (action === "toggle-block-complete" && courseId && memberId) {
    if (isMemberPreviewSession()) {
      syncStatus = "La vista alumno de previsualizacion no altera progreso real.";
      render();
      return;
    }

    if (!session || (session.role !== "member" && !isAdminSession())) {
      return;
    }

    const course = state.courses.find((item) => item.id === courseId);
    const lessonId = actionTarget.dataset.lessonId;
    const blockId = actionTarget.dataset.blockId;
    if (!course || !lessonId || !blockId) {
      return;
    }

    toggleBlockCompletion(course, memberId, lessonId, blockId);
    await persistAndRender("Progreso de bloque actualizado");
    return;
  }

  if (action === "add-course-resource" && isAdminSession()) {
    const course = getSelectedCourse();
    if (!course) {
      return;
    }

    Object.assign(course, readCourseEditorDraft(course));
    course.resources = course.resources || [];
    course.resources.push(
      normalizeCourseResource(
        {
          label: `Recurso ${course.resources.length + 1}`,
          type: "Documento",
          url: "",
          description: "",
          visibility: "alumnado"
        },
        course.resources.length
      )
    );
    await persistAndRender("Recurso anadido al curso");
    return;
  }

  if (action === "remove-course-resource" && isAdminSession()) {
    const course = getSelectedCourse();
    const resourceIndex = Number(actionTarget.dataset.resourceIndex || -1);
    if (!course || resourceIndex < 0) {
      return;
    }

    Object.assign(course, readCourseEditorDraft(course));
    course.resources.splice(resourceIndex, 1);
    await persistAndRender("Recurso eliminado del curso");
    return;
  }

  if (action === "sync-course-resources" && isAdminSession()) {
    const course = getSelectedCourse();
    if (!course) {
      return;
    }

    Object.assign(course, readCourseEditorDraft(course));
    const linkedResources = buildCourseResourcesFromLessons(course);
    const existing = collectCourseResourcesFromForm();
    const merged = [...existing];
    const keys = new Set(
      merged.map((resource) => `${String(resource.label || "").toLowerCase()}|${String(resource.url || "").toLowerCase()}`)
    );

    linkedResources.forEach((resource) => {
      const key = `${String(resource.label || "").toLowerCase()}|${String(resource.url || "").toLowerCase()}`;
      if (!keys.has(key)) {
        merged.push(resource);
        keys.add(key);
      }
    });

    course.resources = merged.map((resource, resourceIndex) => normalizeCourseResource(resource, resourceIndex));
    await persistAndRender("Biblioteca del curso sincronizada con las lecciones");
    return;
  }

  if (action === "remove-course-lesson" && isAdminSession()) {
    const course = getSelectedCourse();
    const moduleIndex = Number(actionTarget.dataset.moduleIndex || -1);
    const lessonIndex = Number(actionTarget.dataset.lessonIndex || -1);
    Object.assign(course, readCourseEditorDraft(course));
    const module = course?.modules?.[moduleIndex];
    if (!module || lessonIndex < 0) {
      return;
    }

    module.lessons.splice(lessonIndex, 1);
    await persistAndRender("Leccion eliminada del modulo");
    return;
  }

  if (action === "add-lesson-block" && isAdminSession()) {
    const course = getSelectedCourse();
    const moduleIndex = Number(actionTarget.dataset.moduleIndex || -1);
    const lessonIndex = Number(actionTarget.dataset.lessonIndex || -1);
    if (!course || moduleIndex < 0 || lessonIndex < 0) {
      return;
    }

    Object.assign(course, readCourseEditorDraft(course));
    const lesson = course.modules?.[moduleIndex]?.lessons?.[lessonIndex];
    if (!lesson) {
      return;
    }

    lesson.blocks = lesson.blocks || [];
    const blockType = actionTarget.dataset.blockType || "document";
    lesson.blocks.push(
      normalizeCourseBlock(
        {
          ...buildDefaultLessonBlock(blockType, lesson.blocks.length),
          title: buildDefaultLessonBlock(blockType, lesson.blocks.length).title
        },
        moduleIndex,
        lessonIndex,
        lesson.blocks.length
      )
    );
    await persistAndRender("Bloque anadido a la leccion");
    return;
  }

  if (action === "remove-lesson-block" && isAdminSession()) {
    const course = getSelectedCourse();
    const moduleIndex = Number(actionTarget.dataset.moduleIndex || -1);
    const lessonIndex = Number(actionTarget.dataset.lessonIndex || -1);
    const blockIndex = Number(actionTarget.dataset.blockIndex || -1);
    if (!course || moduleIndex < 0 || lessonIndex < 0 || blockIndex < 0) {
      return;
    }

    Object.assign(course, readCourseEditorDraft(course));
    const lesson = course.modules?.[moduleIndex]?.lessons?.[lessonIndex];
    if (!lesson) {
      return;
    }

    lesson.blocks.splice(blockIndex, 1);
    await persistAndRender("Bloque eliminado de la leccion");
    return;
  }

  if (action === "select-member") {
    state.selectedMemberId = memberId;
    membersSectionMode = "workbench";
    syncStatus = "Ficha de persona cargada en la zona central";
    render();
    requestAnimationFrame(() => focusMembersWorkbench());
    return;
  }

  if (action === "select-associate-application") {
    state.selectedAssociateApplicationId = actionTarget.dataset.applicationId;
    associatesSectionMode = "applications";
    render();
    requestAnimationFrame(() => scrollToAssociateSection("associateSectionApplications"));
    return;
  }

  if (action === "select-next-associate-application" && isAdminSession()) {
    const nextApplication = getNextPendingAssociateApplication(state.selectedAssociateApplicationId);
    if (nextApplication) {
      state.selectedAssociateApplicationId = nextApplication.id;
      syncStatus = `Siguiente solicitud lista: ${getAssociateApplicantName(nextApplication)}`;
    } else {
      syncStatus = "No hay mas solicitudes pendientes por revisar";
    }
    render();
    return;
  }

  if (action === "select-associate-payment-submission") {
    state.selectedAssociatePaymentSubmissionId = actionTarget.dataset.submissionId;
    const submission = findAssociatePaymentSubmission(actionTarget.dataset.submissionId);
    if (submission?.associateId) {
      state.selectedAssociateId = submission.associateId;
    }
    associatesSectionMode = "fees";
    render();
    requestAnimationFrame(() => scrollToAssociateSection("associateSectionPayments"));
    return;
  }

  if (action === "select-associate-profile-request") {
    state.selectedAssociateProfileRequestId = actionTarget.dataset.requestId;
    const request = findAssociateProfileRequest(actionTarget.dataset.requestId);
    if (request?.associateId) {
      state.selectedAssociateId = request.associateId;
    }
    associatesSectionMode = "profiles";
    render();
    requestAnimationFrame(() => scrollToAssociateSection("associateSectionProfiles"));
    return;
  }

  if (action === "select-associate") {
    state.selectedAssociateId = actionTarget.dataset.associateId;
    associatesSectionMode = "workbench";
    syncStatus = "Ficha de socio cargada en la zona central";
    saveUiSnapshot();
    render();
    requestAnimationFrame(() => focusAssociatesWorkbench());
    return;
  }

  if (action === "clear-associate-filters") {
    associateFilters = {
      query: "",
      service: "all",
      review: "all",
      readiness: "all",
      quota: "all",
      migration: "all"
    };
    associatesSectionMode = "directory";
    resetAssociatePages();
    render();
    requestAnimationFrame(() => scrollToAssociateSection("associateSectionAssociates"));
    return;
  }

  if (action === "set-associate-filter-preset") {
    const preset = actionTarget.dataset.preset || "census";
    syncStatus = applyAssociateFilterPreset(preset);
    showToast(syncStatus, "success");
    render();
    requestAnimationFrame(() => scrollToAssociateSection("associateSectionAssociates"));
    return;
  }

  if (action === "run-associate-search") {
    openAssociateFromSearch(associateFilters.query || "");
    return;
  }

  if (action === "select-all-visible-associate-applications" && isAdminSession()) {
    const visiblePendingIds = getAssociatePageMeta(getFilteredAssociateCollections().applications, "applications")
      .items.filter((item) => isAssociateApplicationPending(item) && getAssociateApplicationReadiness(item).ready)
      .map((item) => item.id);
    selectedAssociateApplicationIds = [...new Set(visiblePendingIds)];
    render();
    return;
  }

  if (action === "clear-selected-associate-applications" && isAdminSession()) {
    selectedAssociateApplicationIds = [];
    render();
    return;
  }

  if (action === "select-all-visible-associate-payments" && isAdminSession()) {
    const visiblePendingIds = getAssociatePageMeta(getFilteredAssociateCollections().paymentSubmissions, "payments")
      .items.filter((item) => item.status === "Pendiente de revision")
      .map((item) => item.id);
    selectedAssociatePaymentSubmissionIds = [...new Set(visiblePendingIds)];
    render();
    return;
  }

  if (action === "clear-selected-associate-payments" && isAdminSession()) {
    selectedAssociatePaymentSubmissionIds = [];
    render();
    return;
  }

  if (action === "select-all-visible-associate-profile-requests" && isAdminSession()) {
    const visiblePendingIds = getAssociatePageMeta(getFilteredAssociateCollections().profileRequests, "profiles")
      .items.filter((item) => item.status === "Pendiente de revision")
      .map((item) => item.id);
    selectedAssociateProfileRequestIds = [...new Set(visiblePendingIds)];
    render();
    return;
  }

  if (action === "clear-selected-associate-profile-requests" && isAdminSession()) {
    selectedAssociateProfileRequestIds = [];
    render();
    return;
  }

  if (action === "preview-associate-workbook-import" && isAdminSession()) {
    try {
        const selectedWorkbook = await readFileInput(document.getElementById("associateWorkbookFile"), {
          maxBytes: 8_000_000,
          label: "El Excel de socios"
        });
      if (selectedWorkbook) {
        associateWorkbookDraftFile = selectedWorkbook;
      }
      syncStatus = "Analizando el Excel actual de socios...";
      associateWorkbookImportStatus = "Analizando el Excel actual de socios...";
      render();

      const response = await fetch("/api/import/associate-workbook/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workbookFile: associateWorkbookDraftFile })
      });
      const payload = await readJsonResponse(
        response,
        "No se pudo leer la respuesta del analisis del Excel."
      );
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || "No se pudo analizar el Excel de socios");
      }
      associateWorkbookPreview = payload.preview || null;
      syncStatus = payload.message || "Analisis completado";
      associateWorkbookImportStatus = payload.message || "Analisis completado";
    } catch (error) {
      syncStatus = error.message || "No se pudo analizar el Excel de socios";
      associateWorkbookImportStatus = syncStatus;
    }

    render();
    return;
  }

  if (action === "commit-associate-workbook-import" && isAdminSession()) {
    try {
        const selectedWorkbook = await readFileInput(document.getElementById("associateWorkbookFile"), {
          maxBytes: 8_000_000,
          label: "El Excel de socios"
        });
      if (selectedWorkbook) {
        associateWorkbookDraftFile = selectedWorkbook;
      }
      syncStatus = "Importando socios desde el Excel legacy...";
      associateWorkbookImportStatus = "Importando socios desde el Excel legacy...";
      render();

      const response = await fetch("/api/import/associate-workbook/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workbookFile: associateWorkbookDraftFile })
      });
      const payload = await readJsonResponse(
        response,
        "No se pudo leer la respuesta de la importacion del Excel."
      );
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || "No se pudo importar el Excel de socios");
      }

      associateWorkbookPreview = payload.preview || null;
      associateWorkbookDraftFile = null;
      await refreshState();
      applySessionToState();
      syncAssociateSelectionTargets();
      associateFilters.migration = "legacy-review";
      resetAssociatePages();
      syncStatus = payload.message || "Importacion completada";
      associateWorkbookImportStatus = syncStatus;
    } catch (error) {
      syncStatus = error.message || "No se pudo importar el Excel de socios";
      associateWorkbookImportStatus = syncStatus;
    }

    render();
    return;
  }

  if (action === "import-storage-state" && isAdminSession()) {
    try {
      const snapshotFile = await readFileInput(document.getElementById("storageStateSnapshotFile"), {
        maxBytes: 35_000_000,
        label: "El state.json del campus"
      });
      if (!snapshotFile) {
        throw new Error("Selecciona primero el state.json real del campus.");
      }

      storageImportDraftFile = snapshotFile;
      storageImportStatus = "Importando el state.json real en la web de prueba...";
      syncStatus = storageImportStatus;
      render();

      const response = await fetch("/api/storage/import-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshotFile })
      });
      const payload = await readJsonResponse(
        response,
        "No se pudo leer la respuesta de la importacion del state.json."
      );
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || "No se pudo importar el state.json del campus");
      }

      storageMeta = payload.storage || null;
      storageImportDraftFile = null;
      storageImportStatus =
        payload.message ||
        "Estado real importado correctamente. Vuelve a entrar con tus credenciales reales.";
      syncStatus = storageImportStatus;
      showToast("Estado real importado correctamente", "success");
      clearSession();
      state = structuredClone(fallbackState);
      loginStatus = storageImportStatus;
    } catch (error) {
      storageImportStatus = error.message || "No se pudo importar el state.json del campus";
      syncStatus = storageImportStatus;
      showToast(storageImportStatus, "error");
    }

    render();
    return;
  }

  if (action === "export-storage-state" && isAdminSession()) {
    try {
      storageExportStatus = "Preparando copia descargable del campus...";
      syncStatus = storageExportStatus;
      render();

      const response = await fetch("/api/storage/export-state");
      if (!response.ok) {
        const payload = await readJsonResponse(
          response,
          "No se pudo descargar la copia del campus."
        );
        throw new Error(payload.error || "No se pudo descargar la copia del campus.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `campus-backup-${timestamp}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);

      storageExportStatus = "Copia descargada correctamente.";
      syncStatus = storageExportStatus;
      showToast("Copia del campus descargada", "success");
    } catch (error) {
      storageExportStatus = error.message || "No se pudo descargar la copia del campus.";
      syncStatus = storageExportStatus;
      showToast(storageExportStatus, "error");
    }

    render();
    return;
  }

  if (action === "prepare-clean-prepublication" && isAdminSession()) {
    const confirmText = window.prompt(
      "Esto vaciara cursos, socios, alumnado, solicitudes, avisos y datos demo de la web de prueba. Conserva solo cuentas administradoras. Escribe PREPUBLICACION LIMPIA para continuar."
    );
    if (String(confirmText || "").trim() !== "PREPUBLICACION LIMPIA") {
      syncStatus = "Limpieza cancelada";
      render();
      return;
    }

    try {
      storageImportStatus = "Preparando web de prueba limpia...";
      syncStatus = storageImportStatus;
      render();
      const response = await fetch("/api/storage/prepare-prepublication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmText })
      });
      const payload = await readJsonResponse(response, "No se pudo leer la respuesta de limpieza.");
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || "No se pudo preparar la prepublicacion limpia");
      }

      storageMeta = payload.storage || null;
      storageImportStatus = payload.message || "Prepublicacion limpia preparada.";
      syncStatus = storageImportStatus;
      showToast("Prepublicacion limpia preparada", "success");
      await refreshState({ forceAdminState: true });
      applySessionToState();
    } catch (error) {
      storageImportStatus = error.message || "No se pudo preparar la prepublicacion limpia";
      syncStatus = storageImportStatus;
      showToast(storageImportStatus, "error");
    }

    render();
    return;
  }

  if (action === "bulk-approve-associate-applications" && isAdminSession()) {
    const applicationIds = [...new Set(selectedAssociateApplicationIds)];
    if (!applicationIds.length) {
      syncStatus = "Selecciona al menos una solicitud para aprobar por lote";
      render();
      return;
    }

    syncStatus = `Aprobando ${applicationIds.length} solicitud(es)...`;
    render();

    let approvedCount = 0;
    const failedApplications = [];
    for (const applicationId of applicationIds) {
      try {
        const response = await fetch(`/api/associates/applications/${applicationId}/approve`, {
          method: "POST"
        });
        const payload = await response.json();
        if (!response.ok || payload.ok === false) {
          throw new Error(payload.error || `No se pudo aprobar la solicitud ${applicationId}`);
        }
        approvedCount += 1;
      } catch (error) {
        const application = findAssociateApplication(applicationId);
        failedApplications.push(
          `${getAssociateApplicantName(application || { firstName: applicationId })}: ${error.message || "bloqueada"}`
        );
      }
    }

    selectedAssociateApplicationIds = [];
    await refreshState();
    applySessionToState();
    syncAssociateSelectionTargets();
    syncStatus = failedApplications.length
      ? `${approvedCount} solicitud(es) aprobada(s). Revisar: ${failedApplications.join(" | ")}`
      : `${approvedCount} solicitud(es) aprobada(s)`;
    render();
    return;
  }

  if (action === "bulk-approve-associate-payments" && isAdminSession()) {
    const submissionIds = [...new Set(selectedAssociatePaymentSubmissionIds)];
    if (!submissionIds.length) {
      syncStatus = "Selecciona al menos un justificante para aprobar por lote";
      render();
      return;
    }

    syncStatus = `Aprobando ${submissionIds.length} justificante(s)...`;
    render();

    let approvedCount = 0;
    const failedSubmissions = [];

    for (const submissionId of submissionIds) {
      try {
        const response = await fetch(`/api/associate-payments/${submissionId}/approve`, {
          method: "POST"
        });
        const result = await response.json();
        if (!response.ok || result.ok === false) {
          throw new Error(result.error || "Aprobacion rechazada");
        }
        approvedCount += 1;
      } catch (error) {
        const submission = findAssociatePaymentSubmission(submissionId);
        failedSubmissions.push(
          `${submission ? getAssociateFullName(findAssociate(submission.associateId) || { firstName: submission.associateId, lastName: "" }) : submissionId}: ${error.message}`
        );
      }
    }

    selectedAssociatePaymentSubmissionIds = [];
    await refreshState();
    applySessionToState();
    syncAssociateSelectionTargets();
    syncStatus = failedSubmissions.length
      ? `${approvedCount} justificante(s) aprobado(s). Revisar: ${failedSubmissions.join(" | ")}`
      : `${approvedCount} justificante(s) aprobado(s)`;
    showToast(syncStatus, failedSubmissions.length ? "warning" : "success");
    render();
    return;
  }

  if (action === "bulk-approve-associate-profile-requests" && isAdminSession()) {
    const requestIds = [...new Set(selectedAssociateProfileRequestIds)];
    if (!requestIds.length) {
      syncStatus = "Selecciona al menos un cambio de ficha para aprobar por lote";
      render();
      return;
    }

    syncStatus = `Aprobando ${requestIds.length} cambio(s) de ficha...`;
    render();

    let approvedCount = 0;
    const failedRequests = [];

    for (const requestId of requestIds) {
      try {
        const response = await fetch(`/api/associate-profile-requests/${requestId}/approve`, {
          method: "POST"
        });
        const result = await response.json();
        if (!response.ok || result.ok === false) {
          throw new Error(result.error || "Aprobacion rechazada");
        }
        approvedCount += 1;
      } catch (error) {
        const request = findAssociateProfileRequest(requestId);
        const associate = request ? findAssociate(request.associateId) : null;
        failedRequests.push(
          `${associate ? getAssociateFullName(associate) : requestId}: ${error.message}`
        );
      }
    }

    selectedAssociateProfileRequestIds = [];
    await refreshState();
    applySessionToState();
    syncAssociateSelectionTargets();
    syncStatus = failedRequests.length
      ? `${approvedCount} cambio(s) aprobado(s). Revisar: ${failedRequests.join(" | ")}`
      : `${approvedCount} cambio(s) aprobado(s)`;
    showToast(syncStatus, failedRequests.length ? "warning" : "success");
    render();
    return;
  }

  if (action === "delete-associate-payment" && isAdminSession()) {
    const associate = findAssociate(actionTarget.dataset.associateId || state.selectedAssociateId);
    const paymentId = actionTarget.dataset.paymentId;
    if (!associate || !paymentId) {
      return;
    }
    associate.payments = (associate.payments || []).filter((payment) => payment.id !== paymentId);
    syncAssociatePaymentTotals(associate);
    addActivity(
      "admin",
      session.name,
      `Ha eliminado un movimiento de cuota del socio #${associate.associateNumber} ${getAssociateFullName(associate)}`
    );
    await persistAndRender("Movimiento de cuota eliminado");
    return;
  }

  if (action === "approve-associate" && isAdminSession()) {
    const applicationId = actionTarget.dataset.applicationId;
    await invokeServerAction(`/api/associates/applications/${applicationId}/approve`, "Solicitud aprobada");
    return;
  }

  if (action === "request-associate-info" && isAdminSession()) {
    const applicationId = actionTarget.dataset.applicationId;
    const application = findAssociateApplication(applicationId);
    const messageField = document.getElementById("associateApplicationInfoMessage");
    const draftMessage = messageField?.value.trim() || application?.infoRequestMessage || "";
    const message =
      draftMessage ||
      window.prompt(
        "Indica la documentacion o aclaracion que debe aportar la persona solicitante:",
        application?.infoRequestMessage || ""
      ) ||
      "";

    if (!String(message).trim()) {
      syncStatus = "Escribe la documentacion o aclaracion solicitada antes de continuar";
      render();
      return;
    }

    await invokeJsonAction(
      `/api/associates/applications/${applicationId}/request-info`,
      { message: String(message).trim() },
      "Solicitud pasada a pendiente de documentacion"
    );
    return;
  }

  if (action === "approve-associate-payment" && isAdminSession()) {
    const submissionId = actionTarget.dataset.submissionId;
    await invokeServerAction(`/api/associate-payments/${submissionId}/approve`, "Justificante aprobado");
    return;
  }

  if (action === "reject-associate-payment" && isAdminSession()) {
    const submissionId = actionTarget.dataset.submissionId;
    await invokeServerAction(`/api/associate-payments/${submissionId}/reject`, "Justificante rechazado");
    return;
  }

  if (action === "notify-associate-payment" && isAdminSession()) {
    const submissionId = actionTarget.dataset.submissionId;
    await invokeServerAction(
      `/api/associate-payments/${submissionId}/notify`,
      "Aviso de justificante reenviado"
    );
    return;
  }

  if (action === "approve-associate-profile-request" && isAdminSession()) {
    const requestId = actionTarget.dataset.requestId;
    const reviewNote = window.prompt(
      "Comentario para aprobar el cambio de ficha (opcional).",
      "Solicitud validada y aplicada sobre la ficha del socio"
    );
    if (reviewNote === null) {
      return;
    }
    await invokeJsonAction(
      `/api/associate-profile-requests/${requestId}/approve`,
      { comentario_admin: String(reviewNote || "").trim() },
      "Actualizacion de ficha aprobada"
    );
    return;
  }

  if (action === "reject-associate-profile-request" && isAdminSession()) {
    const requestId = actionTarget.dataset.requestId;
    const reviewNote = window.prompt(
      "Comentario para rechazar el cambio de ficha.",
      "Solicitud revisada. Mantener datos actuales hasta nueva revision"
    );
    if (reviewNote === null) {
      return;
    }
    await invokeJsonAction(
      `/api/associate-profile-requests/${requestId}/reject`,
      { comentario_admin: String(reviewNote || "").trim() },
      "Actualizacion de ficha rechazada"
    );
    return;
  }

  if (action === "notify-associate-profile-request" && isAdminSession()) {
    const requestId = actionTarget.dataset.requestId;
    await invokeServerAction(
      `/api/associate-profile-requests/${requestId}/notify`,
      "Aviso de actualizacion reenviado"
    );
    return;
  }

  if (action === "reject-associate" && isAdminSession()) {
    const applicationId = actionTarget.dataset.applicationId;
    await invokeServerAction(`/api/associates/applications/${applicationId}/reject`, "Solicitud rechazada");
    return;
  }

  if (action === "reopen-associate-application" && isAdminSession()) {
    const applicationId = actionTarget.dataset.applicationId;
    const noteField = document.getElementById("associateApplicationReopenNote");
    const note = noteField?.value.trim() || "";
    await invokeJsonAction(
      `/api/associates/applications/${applicationId}/reopen`,
      { note },
      "Solicitud reabierta para revision"
    );
    return;
  }

  if (action === "notify-associate-application" && isAdminSession()) {
    const applicationId = actionTarget.dataset.applicationId;
    await invokeServerAction(
      `/api/associates/applications/${applicationId}/notify`,
      "Correo de solicitud procesado"
    );
    return;
  }

  if (action === "notify-associate-application-reply" && isAdminSession()) {
    const applicationId = actionTarget.dataset.applicationId;
    await invokeServerAction(
      `/api/associates/applications/${applicationId}/notify-reply`,
      "Aviso interno de respuesta procesado"
    );
    return;
  }

  if (action === "send-associate-welcome" && isAdminSession()) {
    const associateId = actionTarget.dataset.associateId;
    await invokeServerAction(`/api/associates/${associateId}/send-welcome`, "Bienvenida procesada");
    return;
  }

  if (action === "reset-associate-campus-password" && isAdminSession()) {
    const associateId = actionTarget.dataset.associateId;
    const associate = findAssociate(associateId);
    const associateName = associate ? getAssociateFullName(associate) : "este socio";
    if (
      !window.confirm(
        `Se generara una nueva contrasena temporal para ${associateName}. La contrasena anterior dejara de funcionar.`
      )
    ) {
      return;
    }
    state.selectedAssociateId = associateId;
    associatesSectionMode = "workbench";
    await invokeServerAction(
      `/api/associates/${associateId}/reset-password`,
      "Contrasena temporal restablecida"
    );
    requestAnimationFrame(() => focusAssociatesWorkbench());
    return;
  }

  if (
    (action === "create-associate-campus-access" || action === "create-associate-campus-admin-access") &&
    isAdminSession()
  ) {
    const associateId = actionTarget.dataset.associateId;
    state.selectedAssociateId = associateId;
    associatesSectionMode = "workbench";
    await invokeJsonAction(
      `/api/associates/${associateId}/create-access`,
      { role: action === "create-associate-campus-admin-access" ? "admin" : "member" },
      "Acceso al campus preparado"
    );
    requestAnimationFrame(() => focusAssociatesWorkbench());
    return;
  }

  if (action === "mark-associate-reviewed" && isAdminSession()) {
    const associateId = actionTarget.dataset.associateId;
    state.selectedAssociateId = associateId;
    associatesSectionMode = "workbench";
    await invokeServerAction(
      `/api/associates/${associateId}/mark-reviewed`,
      "Revision legacy cerrada"
    );
    requestAnimationFrame(() => focusAssociatesWorkbench());
    return;
  }

  if (action === "mark-associate-paid" && isAdminSession()) {
    const associate = findAssociate(actionTarget.dataset.associateId || state.selectedAssociateId);
    if (!associate) {
      return;
    }

    const year = String(actionTarget.dataset.year || new Date().getFullYear());
    const pendingAmount = Math.max(
      0,
      Number(associate.annualAmount || 0) - getAssociateFeeForYear(associate, year)
    );

    if (!pendingAmount) {
      syncStatus = `El socio #${associate.associateNumber} ya esta al corriente en ${year}`;
      render();
      return;
    }

    state.selectedAssociateId = associate.id;
    associatesSectionMode = "workbench";
    associate.payments = associate.payments || [];
    associate.payments.unshift({
      id: `associate-payment-${Date.now()}`,
      date: getTodayDateInput(),
      year,
      amount: pendingAmount,
      method: "Ajuste manual",
      note: `Regularizacion rapida de cuota ${year}`,
      createdAt: new Date().toISOString(),
      createdBy: session.name
    });
    syncAssociatePaymentTotals(associate);
    addActivity(
      "admin",
      session.name,
      `Ha marcado como pagada la cuota ${year} del socio #${associate.associateNumber} ${getAssociateFullName(associate)}`
    );
    await persistAndRender(`Cuota ${year} marcada como pagada`);
    requestAnimationFrame(() => focusAssociatesWorkbench());
    return;
  }

  if (action === "settle-all-visible-associate-fees" && isAdminSession()) {
    const visiblePendingAssociates = getFilteredAssociateCollections()
      .associates
      .filter((associate) => getAssociateQuotaGap(associate) > 0);

    if (!visiblePendingAssociates.length) {
      syncStatus = "No hay cuotas visibles pendientes en este filtro";
      render();
      return;
    }

    const year = String(new Date().getFullYear());
    visiblePendingAssociates.forEach((associate) => {
      const pendingAmount = Math.max(
        0,
        Number(associate.annualAmount || 0) - getAssociateFeeForYear(associate, year)
      );
      if (!pendingAmount) {
        return;
      }
      associate.payments = associate.payments || [];
      associate.payments.unshift({
        id: `associate-payment-${Date.now()}-${associate.id}`,
        date: getTodayDateInput(),
        year,
        amount: pendingAmount,
        method: "Ajuste manual",
        note: `Regularizacion masiva de cuota ${year}`,
        createdAt: new Date().toISOString(),
        createdBy: session.name
      });
      syncAssociatePaymentTotals(associate);
    });

    addActivity(
      "admin",
      session.name,
      `Ha regularizado en lote ${visiblePendingAssociates.length} cuota(s) visibles del ${year}`
    );
    await persistAndRender(`Cuotas visibles marcadas como pagadas (${visiblePendingAssociates.length})`);
    requestAnimationFrame(() => focusAssociatesWorkbench());
    return;
  }

  if (action === "delete-member" && isAdminSession() && memberId) {
    if (!window.confirm("Se eliminara la persona y su rastro en cursos. Continuar?")) {
      return;
    }
    const member = findMember(memberId);
    deleteMember(memberId);
    if (member) {
      addActivity("admin", session.name, `Ha eliminado la ficha de ${member.name}`);
    }
    membersSectionMode = "directory";
    shouldPersist = true;
  }

  if (action === "delete-associate" && isAdminSession()) {
    const associateId = actionTarget.dataset.associateId;
    if (!associateId) {
      return;
    }
    const associate = findAssociate(associateId);
    if (!associate) {
      syncStatus = "No encuentro ese socio para eliminarlo";
      render();
      return;
    }
    const expectedText = "ELIMINAR SOCIO";
    const confirmation = window.prompt(
      `Vas a eliminar al socio #${associate.associateNumber} (${getAssociateFullName(associate)}). Escribe ${expectedText} para continuar.`
    );
    if (String(confirmation || "").trim().toUpperCase() !== expectedText) {
      syncStatus = "Eliminacion de socio cancelada";
      render();
      return;
    }
    deleteAssociate(associateId);
    addActivity("admin", session.name, `Ha eliminado el socio #${associate.associateNumber} ${getAssociateFullName(associate)}`);
    associatesSectionMode = "directory";
    shouldPersist = true;
  }

  if (action === "delete-course" && isAdminSession() && courseId) {
    const course = state.courses.find((item) => item.id === courseId);
    if (!course) {
      syncStatus = "No encuentro ese curso para eliminarlo";
      render();
      return;
    }
    const expectedText = "ELIMINAR CURSO";
    const confirmation = window.prompt(
      `Vas a eliminar "${course.title}" y todo su rastro de alumnado, diplomas, avisos y correos pendientes. Escribe ${expectedText} para continuar.`
    );
    if (String(confirmation || "").trim().toUpperCase() !== expectedText) {
      syncStatus = "Eliminacion de curso cancelada";
      render();
      return;
    }
    deleteCourse(courseId);
    addActivity("admin", session.name, `Ha eliminado el curso ${course.title}`);
    coursesSectionMode = state.courses.length ? "all" : "create";
    courseWorkbenchMode = state.courses.length ? "ficha" : "overview";
    campusSectionMode = "courses";
    state.activeView = "campus";
    syncStatus = `Curso eliminado: ${course.title}`;
    shouldPersist = true;
  }

  if (action === "enroll" && courseId) {
    const course = state.courses.find((item) => item.id === courseId);
    const member = findMember(state.selectedMemberId);
    if (isMemberPreviewSession()) {
      syncStatus = "La vista alumno de administracion es solo de previsualizacion";
      render();
      return;
    }
    if (isAdminView()) {
      enrollCurrentMember(courseId);
      if (course && member) {
        addActivity("member", member.name, `Se ha inscrito en ${course.title}`);
      }
      shouldPersist = true;
    } else {
      if (!window.confirm(`Vas a solicitar la inscripcion en ${course?.title || "este curso"}. Quieres continuar?`)) {
        return;
      }
      await invokeServerAction(`/api/member/courses/${courseId}/enroll`, "Inscripcion registrada");
      return;
    }
  }

  if (action === "move-waiting" && isAdminSession() && courseId && memberId) {
    const course = state.courses.find((item) => item.id === courseId);
    const member = findMember(memberId);
    moveWaitingToEnrolled(courseId, memberId);
    if (course && member) {
      addActivity("admin", session.name, `Ha pasado a ${member.name} desde espera a inscritos en ${course.title}`);
    }
    shouldPersist = true;
  }

  if (action === "mark-attendance" && isAdminSession() && courseId && memberId) {
    cycleAttendance(courseId, memberId);
    const course = state.courses.find((item) => item.id === courseId);
    const member = findMember(memberId);
    if (course && member) {
      addActivity("admin", session.name, `Ha actualizado la asistencia de ${member.name} en ${course.title}`);
    }
    shouldPersist = true;
  }

  if (action === "set-member-attendance" && isAdminSession() && courseId && memberId) {
    const course = state.courses.find((item) => item.id === courseId);
    const member = findMember(memberId);
    const nextValue = Number(actionTarget.dataset.value || 0);
    setAttendanceValue(courseId, memberId, nextValue);
    if (course && member) {
      addActivity("admin", session.name, `Ha fijado la asistencia de ${member.name} en ${course.title} al ${nextValue}%`);
    }
    await persistAndRender(member ? `Asistencia actualizada para ${member.name}` : "Asistencia actualizada");
    return;
  }

  if (action === "cycle-eval" && isAdminSession() && courseId && memberId) {
    cycleEvaluation(courseId, memberId);
    const course = state.courses.find((item) => item.id === courseId);
    const member = findMember(memberId);
    if (course && member) {
      addActivity("admin", session.name, `Ha actualizado la evaluacion de ${member.name} en ${course.title}`);
    }
    shouldPersist = true;
  }

  if (action === "set-member-evaluation" && isAdminSession() && courseId && memberId) {
    const course = state.courses.find((item) => item.id === courseId);
    const member = findMember(memberId);
    const nextValue = actionTarget.dataset.value || "Pendiente";
    setEvaluationValue(courseId, memberId, nextValue);
    if (course && member) {
      addActivity("admin", session.name, `Ha fijado la evaluacion de ${member.name} en ${course.title} como ${nextValue}`);
    }
    await persistAndRender(member ? `Evaluacion actualizada para ${member.name}` : "Evaluacion actualizada");
    return;
  }

  if (action === "close-member-course" && isAdminSession() && courseId && memberId) {
    const { course, member, blockers } = prepareMemberForDiploma(courseId, memberId);
    if (!course || !member) {
      return;
    }
    generateDiplomas(courseId);
    const generated = (course.diplomaReady || []).includes(memberId);
    const closureLabel = getCourseClosureLabel(course);
    addActivity("admin", session.name, `Ha cerrado academicamente a ${member.name} en ${course.title}`);
    syncStatus = blockers.length
      ? `${member.name} queda cerrado en ${closureLabel}, asistencia, evaluacion y contenido. Aun falta: ${blockers.join(", ")}`
      : generated
        ? `${member.name} ya queda cerrado y con diploma generado en ${course.title}`
        : `${member.name} ya queda listo para emitir diploma en ${course.title}`;
    if (!blockers.length) {
      state.selectedCourseId = courseId;
      state.selectedMemberId = memberId;
      state.activeView = "campus";
      campusSectionMode = "diplomas";
      expandedNavViews.add("campus");
    }
    await persistAndRender(syncStatus);
    if (!blockers.length) {
      requestAnimationFrame(() => focusElementById("diplomaPreviewPanel"));
    }
    return;
  }

  if (action === "answer-quiz-question" && courseId && memberId) {
    const course = state.courses.find((item) => item.id === courseId);
    const blockId = actionTarget.dataset.blockId || "";
    const lessonId = actionTarget.dataset.lessonId || "";
    const questionIndex = Number(actionTarget.dataset.questionIndex || -1);
    const answer = actionTarget.dataset.answer || "";
    if (!course || !blockId || questionIndex < 0 || !memberId) {
      return;
    }
    if (isAdminView() || isMemberPreviewSession()) {
      syncStatus = "La vista previa del aula no guarda respuestas reales del test.";
      render();
      return;
    }
    setCourseQuizAnswer(course, memberId, blockId, questionIndex, answer);
    const block = getCourseBlockList(course).find((item) => item.id === blockId);
    const progress = block ? getQuizBlockProgress(course, memberId, block) : null;
    if (block) {
      const entry = getCourseProgressEntry(course, memberId);
      if (progress?.complete) {
        if (!entry.blockIds.includes(blockId)) {
          entry.blockIds = [...entry.blockIds, blockId];
        }
      } else {
        entry.blockIds = entry.blockIds.filter((id) => id !== blockId);
      }
      const lesson = getCourseLessonList(course).find((item) => item.id === lessonId);
      if (lesson) {
        const lessonBlockIds = (lesson.blocks || []).map((item) => item.id);
        if (lessonBlockIds.length && lessonBlockIds.every((id) => entry.blockIds.includes(id))) {
          entry.lessonIds = [...new Set([...entry.lessonIds, lesson.id])];
        } else {
          entry.lessonIds = entry.lessonIds.filter((id) => id !== lesson.id);
        }
      }
      setCourseProgressEntry(course, memberId, entry);
    }
    await persistAndRender(progress?.complete ? "Test completado correctamente" : "Respuesta guardada");
    return;
  }

  if (action === "set-all-attendance" && isAdminSession() && courseId) {
    const course = state.courses.find((item) => item.id === courseId);
    if (!course) {
      return;
    }
    (course.enrolledIds || []).forEach((currentMemberId) => {
      setAttendanceValue(courseId, currentMemberId, 100);
    });
    addActivity("admin", session.name, `Ha marcado al 100% la asistencia del curso ${course.title}`);
    await persistAndRender("Asistencia de todo el curso actualizada");
    return;
  }

  if (action === "set-all-evaluations-apt" && isAdminSession() && courseId) {
    const course = state.courses.find((item) => item.id === courseId);
    if (!course) {
      return;
    }
    (course.enrolledIds || []).forEach((currentMemberId) => {
      setEvaluationValue(courseId, currentMemberId, "Apto");
    });
    addActivity("admin", session.name, `Ha marcado como apto al alumnado del curso ${course.title}`);
    await persistAndRender("Evaluaciones del curso actualizadas");
    return;
  }

  if (action === "close-all-member-courses" && isAdminSession() && courseId) {
    const course = state.courses.find((item) => item.id === courseId);
    if (!course) {
      return;
    }
    const closureLabel = getCourseClosureLabel(course);
    const enrolledMembers = (course.enrolledIds || []).map(findMember).filter(Boolean);
    const stillBlocked = [];
    enrolledMembers.forEach((member) => {
      const { blockers } = prepareMemberForDiploma(courseId, member.id);
      if (blockers.length) {
        stillBlocked.push(`${member.name}: ${blockers.join(", ")}`);
      }
    });
    generateDiplomas(courseId);
    const generatedCount = (course.diplomaReady || []).length;
    addActivity("admin", session.name, `Ha preparado el cierre academico del ${closureLabel} ${course.title}`);
    syncStatus = stillBlocked.length
      ? `Cierre aplicado. Aun faltan requisitos en ${stillBlocked.length} alumno(s): ${stillBlocked.slice(0, 2).join(" | ")}${stillBlocked.length > 2 ? "..." : ""}`
      : `Cierre aplicado. ${generatedCount} diploma(s) ya quedan generados en ${course.title}`;
    if (generatedCount || !stillBlocked.length) {
      state.selectedCourseId = courseId;
      state.activeView = "campus";
      campusSectionMode = "diplomas";
      expandedNavViews.add("campus");
    }
    await persistAndRender(syncStatus);
    return;
  }

  if (action === "generate-diplomas" && isAdminSession() && courseId) {
    const course = state.courses.find((item) => item.id === courseId);
    generateDiplomas(courseId);
    if (course) {
      addActivity("admin", session.name, `Ha regenerado los diplomas del curso ${course.title}`);
      if ((course.diplomaReady || []).length) {
        syncStatus = `Diplomas actualizados: ${(course.diplomaReady || []).length} generado(s) en ${course.title}`;
      } else {
        const sampleMemberId = (course.enrolledIds || [])[0];
        const sampleMember = sampleMemberId ? findMember(sampleMemberId) : null;
        const sampleBlockers = sampleMemberId ? getMemberDiplomaBlockingLabels(course, sampleMemberId) : [];
        syncStatus = sampleMember
          ? `Todavia no hay diplomas listos en ${course.title}. Por ejemplo, ${sampleMember.name} tiene pendiente: ${sampleBlockers.join(", ")}`
          : `Todavia no hay diplomas listos en ${course.title}. Revisa asistencia, evaluacion, contenido, valoracion y DNI/NIE.`;
      }
    }
    await persistAndRender(syncStatus || "Diplomas actualizados");
    return;
  }

  if (action === "generate-member-diploma" && isAdminSession() && courseId && memberId) {
    const course = state.courses.find((item) => item.id === courseId);
    const member = findMember(memberId);
    if (!course || !member) {
      return;
    }
    const blockers = getMemberDiplomaBlockingLabels(course, memberId);
    if (blockers.length) {
      syncStatus = `Todavia no puedes generar el diploma de ${member.name}. Falta: ${blockers.join(", ")}`;
      render();
      return;
    }
    generateDiplomas(courseId);
    state.selectedCourseId = courseId;
    state.selectedMemberId = memberId;
    state.activeView = "campus";
    campusSectionMode = "diplomas";
    expandedNavViews.add("campus");
    addActivity("admin", session.name, `Ha generado el diploma de ${member.name} en ${course.title}`);
    syncStatus = `Diploma generado para ${member.name} en ${course.title}`;
    await persistAndRender(syncStatus);
    requestAnimationFrame(() => focusElementById("diplomaPreviewPanel"));
    return;
  }

  if (action === "open-member-diploma-preview" && isAdminSession() && courseId && memberId) {
    const course = state.courses.find((item) => item.id === courseId);
    const member = findMember(memberId);
    if (!course || !member) {
      return;
    }
    generateDiplomas(courseId);
    state.selectedCourseId = courseId;
    state.selectedMemberId = memberId;
    state.activeView = "campus";
    campusSectionMode = "diplomas";
    expandedNavViews.add("campus");
    const ready = isMemberReadyForDiploma(course, memberId);
    const generated = (course.diplomaReady || []).includes(memberId);
    syncStatus = ready
      ? generated
        ? `El diploma de ${member.name} ya esta generado y listo para revisar`
        : `El diploma de ${member.name} esta listo para emitir`
      : `Aun faltan requisitos para emitir el diploma de ${member.name}`;
    await persistAndRender(syncStatus);
    requestAnimationFrame(() => focusElementById("diplomaPreviewPanel"));
    return;
  }

  if (action === "prepare-diploma-batch" && isAdminSession() && courseId) {
    const course = state.courses.find((item) => item.id === courseId);
    if (!course) {
      return;
    }
    generateDiplomas(courseId);
    sendDiplomaMails(courseId);
    addActivity("admin", session.name, `Ha preparado el lote de diplomas del curso ${course.title}`);
    await persistAndRender("Lote de diplomas preparado");
    return;
  }

  if (action === "send-mails" && isAdminSession() && courseId) {
    const course = state.courses.find((item) => item.id === courseId);
    sendDiplomaMails(courseId);
    if (course) {
      addActivity("admin", session.name, `Ha registrado envios manuales de diplomas para ${course.title}`);
    }
    shouldPersist = true;
  }

  if (action === "smtp-send-course" && isAdminSession() && courseId) {
    await invokeServerAction(`/api/courses/${courseId}/send-pending`, "Envio SMTP por lote completado");
    return;
  }

  if (action === "smtp-send-member" && isAdminSession() && courseId && memberId) {
    await invokeServerAction(
      `/api/courses/${courseId}/send-member/${memberId}`,
      "Envio SMTP individual completado"
    );
    return;
  }

  if (action === "send-single" && isAdminSession() && courseId && memberId) {
    const course = state.courses.find((item) => item.id === courseId);
    const member = findMember(memberId);
    queueEmailForMember(courseId, memberId, true);
    if (course && member) {
      addActivity("admin", session.name, `Ha registrado un envio manual para ${member.name} en ${course.title}`);
    }
    shouldPersist = true;
  }

  if (action === "resend-mail" && isAdminSession()) {
    const mailId = actionTarget.dataset.mailId;
    await invokeServerAction(`/api/emails/${mailId}/send`, "Correo reenviado por SMTP");
    return;
  }

  if (action === "smtp-test" && isAdminSession()) {
    await invokeServerAction("/api/smtp/test", "Correo de prueba SMTP enviado");
    return;
  }

  if (action === "send-queued-emails" && isAdminSession()) {
    await invokeServerAction("/api/emails/send-queued", "Bandeja SMTP procesada");
    return;
  }

  if (action === "automation-run" && isAdminSession()) {
    await invokeServerAction("/api/automation/run", "Automatizaciones ejecutadas");
    return;
  }

  if (action === "resolve-all-inbox" && isAdminSession()) {
    await invokeServerAction("/api/automation/resolve-all", "Bandeja automatica procesada");
    return;
  }

  if (action === "agent-resolve-next" && isAdminSession()) {
    await invokeServerAction("/api/agent/resolve-next", "Agente ejecutado");
    return;
  }

  if (action === "resolve-inbox" && isAdminSession()) {
    const itemId = actionTarget.dataset.itemId;
    await invokeServerAction(`/api/automation/inbox/${itemId}/resolve`, "Tarea automatica resuelta");
    return;
  }

  if (action === "fill-demo-settings") {
    document.getElementById("settingCertificateCity").value = "Madrid";
    document.getElementById("settingSignerA").value = "Coordinacion Academica";
    document.getElementById("settingSignerB").value = "Presidencia";
    document.getElementById("settingTemplate").value =
      'Hola {{name}}, su diploma del curso "{{course}}" ya esta disponible. Puede descargarlo desde su area privada o usar el adjunto de este mensaje.';
    document.getElementById("settingSmtpFromName").value = "Isocrona Zero Campus";
    document.getElementById("settingSmtpFromEmail").value = "campus@isocronazero.org";
    document.getElementById("settingSmtpTestTo").value = "admin@isocronazero.org";
    return;
  }

  if (shouldPersist) {
    await persistAndRender("Cambios guardados en el servidor");
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "associateSearchFilter") {
      associateFilters.query = event.target.value || "";
      resetAssociatePages();
    pendingInputFocusRestore = {
      id: event.target.id,
      start: typeof event.target.selectionStart === "number" ? event.target.selectionStart : null,
      end: typeof event.target.selectionEnd === "number" ? event.target.selectionEnd : null
    };
    render();
  }

  if (event.target.id === "campusGroupSearchQuery") {
    campusGroupSearchQuery = event.target.value || "";
    pendingInputFocusRestore = {
      id: event.target.id,
      start: typeof event.target.selectionStart === "number" ? event.target.selectionStart : null,
      end: typeof event.target.selectionEnd === "number" ? event.target.selectionEnd : null
    };
    render();
  }

  if (
    [
      "campusGroupTitle",
      "campusGroupSummary",
      "campusGroupModuleTitle",
      "campusGroupModuleSummary"
    ].includes(event.target.id) ||
    event.target.dataset.campusGroupField === "title" ||
    event.target.dataset.campusGroupField === "url" ||
    event.target.dataset.campusGroupField === "note"
  ) {
    const group = getSelectedCampusGroup();
    const draft = readCampusGroupEditorDraft(group);
    if (draft?.id) {
      saveCampusDraft(draft.id, draft);
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.target.id !== "associateSearchFilter" || event.key !== "Enter") {
      return;
    }

  event.preventDefault();
  openAssociateFromSearch(event.target.value || "");
});

document.addEventListener("change", (event) => {
  if (event.target.id === "campusGroupResourceFilter") {
    campusGroupResourceFilter = event.target.value || "all";
    render();
    return;
  }

  if (event.target.dataset.campusGroupFileInput === "true" && isAdminSession()) {
    (async () => {
      try {
        const group = getSelectedCampusGroup();
        const selectedModule = getSelectedCampusGroupModule(group) || group?.modules?.[0] || null;
        const category = event.target.dataset.category || "";
        const entryId = event.target.dataset.entryId || "";
        if (!group || !selectedModule || !category || !entryId) {
          return;
        }

        pendingCampusGroupFileTarget = {
          groupId: group.id,
          moduleId: selectedModule.id,
          category,
          entryId
        };

        const file = await readFileInput(event.target, {
          maxBytes: getCampusGroupFileMaxBytes(category),
          label: category === "practiceSheets" ? "La ficha de practica" : "El documento interno"
        });
        if (!file) {
          pendingCampusGroupFileTarget = null;
          return;
        }

        await applyCampusGroupFileSelection(file);
      } catch (error) {
        syncStatus = error.message || "No se pudo cargar el archivo";
        showToast(syncStatus, "error");
        pendingCampusGroupFileTarget = null;
      } finally {
        event.target.value = "";
      }
    })();
    return;
  }

  if (event.target.id === "globalFilePicker") {
    (async () => {
      try {
        const file = await readFileInput(event.target);
        if (!file) {
          pendingCampusGroupFileTarget = null;
          return;
        }
        await applyCampusGroupFileSelection(file);
      } catch (error) {
        syncStatus = error.message || "No se pudo cargar el archivo";
        showToast(syncStatus, "error");
        pendingCampusGroupFileTarget = null;
      }
    })();
    return;
  }

  if (event.target.dataset.action === "toggle-associate-application-selection") {
    const applicationId = event.target.dataset.applicationId;
    if (!applicationId) {
      return;
    }

    if (event.target.checked) {
      selectedAssociateApplicationIds = [...new Set([...selectedAssociateApplicationIds, applicationId])];
    } else {
      selectedAssociateApplicationIds = selectedAssociateApplicationIds.filter((id) => id !== applicationId);
    }
    render();
    return;
  }

  if (event.target.dataset.action === "toggle-associate-payment-selection") {
    const submissionId = event.target.dataset.submissionId;
    if (!submissionId) {
      return;
    }

    if (event.target.checked) {
      selectedAssociatePaymentSubmissionIds = [...new Set([...selectedAssociatePaymentSubmissionIds, submissionId])];
    } else {
      selectedAssociatePaymentSubmissionIds = selectedAssociatePaymentSubmissionIds.filter((id) => id !== submissionId);
    }
    render();
    return;
  }

  if (event.target.dataset.action === "toggle-associate-profile-request-selection") {
    const requestId = event.target.dataset.requestId;
    if (!requestId) {
      return;
    }

    if (event.target.checked) {
      selectedAssociateProfileRequestIds = [...new Set([...selectedAssociateProfileRequestIds, requestId])];
    } else {
      selectedAssociateProfileRequestIds = selectedAssociateProfileRequestIds.filter((id) => id !== requestId);
    }
    render();
    return;
  }

  if (event.target.id === "associateServiceFilter") {
    associateFilters.service = event.target.value || "all";
    resetAssociatePages();
    render();
    return;
  }

  if (event.target.id === "associateReviewFilter") {
    associateFilters.review = event.target.value || "all";
    resetAssociatePages();
    render();
    return;
  }

  if (event.target.id === "associateReadinessFilter") {
    associateFilters.readiness = event.target.value || "all";
    resetAssociatePages();
    render();
    return;
  }

  if (event.target.id === "associateQuotaFilter") {
    associateFilters.quota = event.target.value || "all";
    resetAssociatePages();
    render();
    return;
  }

  if (event.target.id === "associateMigrationFilter") {
    associateFilters.migration = event.target.value || "all";
    resetAssociatePages();
    render();
    return;
  }

  if (event.target.id === "associateWorkbookFile") {
    const [file] = event.target.files || [];
    if (!file) {
      associateWorkbookDraftFile = null;
      syncStatus = "Selecciona un Excel de socios para analizarlo o importarlo desde ese fichero.";
      associateWorkbookImportStatus = syncStatus;
      render();
    }
    return;
  }
});

document.addEventListener("submit", async (event) => {
  if (!hasLoaded || !session) {
    return;
  }

  if (event.target.id === "changePasswordForm") {
    event.preventDefault();

    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (newPassword.length < 8) {
      passwordChangeStatus = "La nueva contrasena debe tener al menos 8 caracteres.";
      render();
      return;
    }

    if (newPassword !== confirmPassword) {
      passwordChangeStatus = "La confirmacion de contrasena no coincide.";
      render();
      return;
    }

    passwordChangeStatus = "Actualizando contrasena...";
    render();

    try {
      const response = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: session.accountId,
          currentPassword,
          newPassword,
          confirmPassword
        })
      });

      const payload = await response.json();
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || "No se pudo actualizar la contrasena");
      }

      session = payload.session;
      persistSession();
      currentPasswordInput.value = "";
      newPasswordInput.value = "";
      confirmPasswordInput.value = "";
      passwordChangeStatus = payload.message || "Contrasena actualizada correctamente.";
      await refreshState();
      applySessionToState();
      showToast(payload.message || "Contrasena actualizada", "success");
      render();
    } catch (error) {
      passwordChangeStatus = error.message || "No se pudo actualizar la contrasena.";
      showToast(passwordChangeStatus, "error");
      render();
    }
    return;
  }

  if (event.target.id === "associatePaymentSubmissionForm" && !isAdminView()) {
    event.preventDefault();

    try {
      syncStatus = "Enviando justificante de cuota...";
      render();
        const proofFile = await readFileInput(document.getElementById("associatePaymentProof"), {
          maxBytes: 50_000_000,
          label: "El justificante de cuota"
        });
      const response = await fetch("/api/associate-payments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: document.getElementById("associatePaymentSubmissionYear").value,
          amount: Number(document.getElementById("associatePaymentSubmissionAmount").value || 0),
          method: document.getElementById("associatePaymentSubmissionMethod").value,
          note: document.getElementById("associatePaymentSubmissionNote").value.trim(),
          proofFile
        })
      });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || "No se pudo enviar el justificante");
      }
      event.target.reset();
      await refreshState();
      applySessionToState();
      syncStatus = payload.message || "Justificante enviado para revision";
      showToast(syncStatus, "success");
      render();
    } catch (error) {
      syncStatus = error.message || "No se pudo enviar el justificante";
      showToast(syncStatus, "error");
      render();
    }
    return;
  }

  if (event.target.id === "associateProfileRequestForm" && !isAdminView()) {
      event.preventDefault();

      try {
        const currentMember = getCurrentMember();
        const currentAssociate = getCurrentAssociate();
        const snapshot = getAssociatePortalSnapshot(currentAssociate, currentMember);
        syncStatus = "Enviando solicitud de actualizacion...";
        render();
        const form = event.target;
        const readField = (selector) => form.querySelector(selector)?.value?.trim() || "";
        const firstName = readField("#associateProfileFirstName") || snapshot.firstName || "";
        const lastName = readField("#associateProfileLastName") || snapshot.lastName || "";
        const dni = readField("#associateProfileDni") || snapshot.dni || "";
        const phone = readField("#associateProfilePhone") || snapshot.phone || "";
        const email = readField("#associateProfileEmail") || snapshot.email || "";
        const service = readField("#associateProfileService") || snapshot.service || "";
        const note = readField("#associateProfileNote");
        const normalizeValue = (value) => String(value || "").trim();
        const normalizeEmailValue = (value) => normalizeValue(value).toLowerCase();
        const normalizeDniValue = (value) => normalizeValue(value).toUpperCase();
        const hasRealChange =
          normalizeValue(firstName) !== normalizeValue(snapshot.firstName) ||
          normalizeValue(lastName) !== normalizeValue(snapshot.lastName) ||
          normalizeDniValue(dni) !== normalizeDniValue(snapshot.dni) ||
          normalizeValue(phone) !== normalizeValue(snapshot.phone) ||
          normalizeEmailValue(email) !== normalizeEmailValue(snapshot.email) ||
          normalizeValue(service) !== normalizeValue(snapshot.service);
        if (!note && !hasRealChange) {
          syncStatus = "Tu ficha ya tiene esos datos. Cambia algun campo o anade una nota para enviar la solicitud.";
          showToast(syncStatus, "warning");
          render();
          return;
        }
        const response = await fetch("/api/associate-profile-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName,
            lastName,
            dni,
            phone,
            email,
            service,
            note
          })
        });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || "No se pudo enviar la solicitud");
      }
      await refreshState();
      applySessionToState();
      syncStatus = payload.message || "Solicitud de actualizacion enviada";
      showToast(syncStatus, "success");
      render();
    } catch (error) {
      syncStatus = error.message || "No se pudo enviar la solicitud";
      showToast(syncStatus, "error");
      render();
    }
    return;
  }

  if (event.target.id === "courseEnrollmentProofUpdateForm" && !isAdminView()) {
    event.preventDefault();

    const course = getSelectedCourse();
    if (!course || isMemberPreviewSession()) {
      return;
    }

    try {
      syncStatus = "Enviando justificante...";
      render();
        const paymentProof = await readFileInput(document.getElementById("courseEnrollmentProofUpdate"), {
          maxBytes: 50_000_000,
          label: "El justificante de inscripcion"
        });
      const response = await fetch(`/api/member/courses/${course.id}/enrollment-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: document.getElementById("courseEnrollmentProofUpdateNote")?.value.trim() || "",
          paymentProof
        })
      });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || "No se pudo adjuntar el justificante");
      }
      await refreshState();
      applySessionToState();
      syncStatus = payload.message || "Justificante enviado";
      showToast(syncStatus, "success");
      learnerCourseDetailsMode = "status";
      render();
    } catch (error) {
      syncStatus = error.message || "No se pudo adjuntar el justificante";
      showToast(syncStatus, "error");
      render();
    }
    return;
  }

  if (event.target.id === "courseEnrollmentForm" && !isAdminView()) {
      event.preventDefault();

    const course = getSelectedCourse();
    if (!course || isMemberPreviewSession()) {
      return;
    }

    if (!window.confirm(`Vas a solicitar la inscripcion en ${course.title}. Quieres continuar?`)) {
      return;
    }

    try {
      syncStatus = "Registrando inscripcion...";
      render();
        const paymentProof = await readFileInput(document.getElementById("courseEnrollmentProof"), {
          maxBytes: 50_000_000,
          label: "El justificante de inscripcion"
        });
      const response = await fetch(`/api/member/courses/${course.id}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(document.getElementById("courseEnrollmentAmount")?.value || course.enrollmentFee || 0),
          method: document.getElementById("courseEnrollmentMethod")?.value || "Transferencia",
          note: document.getElementById("courseEnrollmentNote")?.value.trim() || "",
          paymentProof
        })
      });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || "No se pudo completar la inscripcion");
      }
      await refreshState();
      applySessionToState();
      syncStatus = payload.message || "Inscripcion registrada";
      showToast(syncStatus, "success");
      learnerCourseDetailsMode = "status";
      learnerEnrollmentIntent = false;
      render();
    } catch (error) {
      syncStatus = error.message || "No se pudo completar la inscripcion";
      showToast(syncStatus, "error");
      render();
    }
    return;
  }

  if (event.target.id === "courseFeedbackForm" && !isAdminView()) {
    event.preventDefault();

    const course = getSelectedCourse();
    const memberId = session?.memberId || state.selectedMemberId;
    if (!course || !memberId || isMemberPreviewSession()) {
      return;
    }

    const nextResponse = {
      id: getCourseFeedbackResponse(course, memberId)?.id || `feedback-${Date.now()}`,
      memberId,
      submittedAt: new Date().toISOString(),
      activityScore: Number(document.getElementById("courseFeedbackactivity")?.value || 5),
      contentsScore: Number(document.getElementById("courseFeedbackcontents")?.value || 5),
      organizationScore: Number(document.getElementById("courseFeedbackorganization")?.value || 5),
      teacherClarityScore: Number(document.getElementById("courseFeedbackteacherClarity")?.value || 5),
      teacherUsefulnessScore: Number(document.getElementById("courseFeedbackteacherUsefulness")?.value || 5),
      teacherSupportScore: Number(document.getElementById("courseFeedbackteacherSupport")?.value || 5),
      recommendationScore: Number(document.getElementById("courseFeedbackrecommendation")?.value || 5),
      comment: document.getElementById("courseFeedbackComment")?.value.trim() || "",
      teacherComment: document.getElementById("courseFeedbackTeacherComment")?.value.trim() || ""
    };

    course.feedbackResponses = [
      ...(course.feedbackResponses || []).filter((response) => response.memberId !== memberId),
      nextResponse
    ];

    addActivity("member", session.name, `Ha enviado la valoracion del curso ${course.title}`);
    await persistAndRender("Valoracion enviada correctamente");
    learnerCourseWorkspaceMode = "feedback";
    return;
  }

  if (event.target.id === "smtpSettingsForm" && isAdminSession()) {
    event.preventDefault();
    state.settings.smtp = {
      host: document.getElementById("smtpConfigHost").value.trim(),
      port: Number(document.getElementById("smtpConfigPort").value || 0),
      secure: document.getElementById("smtpConfigSecure").checked,
      startTls: document.getElementById("smtpConfigStartTls").checked,
      username: document.getElementById("smtpConfigUser").value.trim(),
      password: document.getElementById("smtpConfigPassword").value,
      fromEmail: document.getElementById("smtpConfigFromEmail").value.trim(),
      fromName: document.getElementById("smtpConfigFromName").value.trim(),
      testTo: document.getElementById("smtpConfigTestTo").value.trim()
    };
    addActivity("admin", session.name, "Ha actualizado la configuracion SMTP del campus");
    await persistAndRender("SMTP guardado");
    return;
  }

  if (event.target.id === "settingsForm" && isAdminSession()) {
    event.preventDefault();
    state.settings.certificateCity = document.getElementById("settingCertificateCity").value.trim();
    state.settings.diplomaSignerA = document.getElementById("settingSignerA").value.trim();
    state.settings.diplomaSignerB = document.getElementById("settingSignerB").value.trim();
    state.settings.emailTemplate = document.getElementById("settingTemplate").value.trim();
    state.settings.automationTone = document.getElementById("settingAutomation").value.trim();
    state.settings.smtp = {
      host: document.getElementById("settingSmtpHost").value.trim(),
      port: Number(document.getElementById("settingSmtpPort").value || 0),
      secure: document.getElementById("settingSmtpSecure").checked,
      startTls: document.getElementById("settingSmtpStartTls").checked,
      username: document.getElementById("settingSmtpUser").value.trim(),
      password: document.getElementById("settingSmtpPassword").value,
      fromEmail: document.getElementById("settingSmtpFromEmail").value.trim(),
      fromName: document.getElementById("settingSmtpFromName").value.trim(),
      testTo: document.getElementById("settingSmtpTestTo").value.trim()
    };
    state.settings.automation = {
      autoGenerateDiplomas: document.getElementById("settingAutoDiplomas").checked,
      autoPromoteWaitlist: document.getElementById("settingAutoWaitlist").checked,
      autoAdvanceCourseStatus: document.getElementById("settingAutoAdvanceCourseStatus").checked,
      autoSendDiplomas: document.getElementById("settingAutoSendDiplomas").checked,
      autoDetectRenewals: document.getElementById("settingAutoRenewals").checked,
      autoDetectFailedEmails: document.getElementById("settingAutoFailedEmails").checked,
      autoRunOnSave: document.getElementById("settingAutoRunOnSave").checked
    };
    state.settings.agent = {
      enabled: document.getElementById("settingAgentEnabled").checked,
      canResolveInbox: document.getElementById("settingAgentResolveInbox").checked,
      canSendDiplomas: document.getElementById("settingAgentSendDiplomas").checked,
      canCloseCourses: document.getElementById("settingAgentCloseCourses").checked,
      notes: document.getElementById("settingAgentNotes").value.trim()
    };
    state.settings.associates = {
      defaultAnnualAmount: Number(document.getElementById("settingAssociateAnnual").value || 0),
      nextAssociateNumber: Number(document.getElementById("settingAssociateNextNumber").value || 1),
      autoCreateCampusAccess: document.getElementById("settingAssociateAutoCampus").checked,
      autoSendWelcomeEmail: document.getElementById("settingAssociateWelcomeEmail").checked,
      autoSendApplicationReceipt: document.getElementById("settingAssociateApplicationReceipt").checked,
      autoSendApplicationInfoRequest: document.getElementById("settingAssociateApplicationInfoRequest").checked,
      autoSendApplicationDecision: document.getElementById("settingAssociateApplicationDecision").checked,
      autoSendApplicantReplyNotification: document.getElementById("settingAssociateApplicantReplyNotification").checked,
      autoSendApplicantReplyReceipt: document.getElementById("settingAssociateApplicantReplyReceipt").checked,
      defaultMemberRole: document.getElementById("settingAssociateDefaultRole").value.trim(),
      applicationFormNotice: document.getElementById("settingAssociateNotice").value.trim()
    };
    addActivity("admin", session.name, "Ha actualizado la configuracion general del campus");
    await persistAndRender("Configuracion guardada");
  }

  if (event.target.id === "courseForm" && isAdminSession()) {
    event.preventDefault();
    const title = document.getElementById("courseTitle").value.trim();
    const courseClass = document.getElementById("courseClass").value;
    const type = document.getElementById("courseType").value.trim();
    const startDate = document.getElementById("courseStart").value;
    const endDate = document.getElementById("courseEnd").value;
    const hours = Number(document.getElementById("courseHours").value);
    const capacity = Number(document.getElementById("courseCapacity").value);
    const coordinator = document.getElementById("courseCoordinator").value.trim();
    const audience = document.getElementById("courseAudience").value.trim();
    const accessScope = normalizeCourseAccessScope(document.getElementById("courseAccessScope")?.value, audience);
    const enrollmentOpensAt = normalizeDateTimeLocalInput(document.getElementById("courseEnrollmentOpensAt")?.value || "");
    const contentTemplate = document.getElementById("courseTemplate").value || "operativo";

    if (!title || !courseClass || !type || !startDate || !endDate || !hours || !capacity) {
      return;
    }

    const id = `course-${Date.now()}`;
    const draftCourse = normalizeCourse({
      id,
      title,
      courseClass,
      type,
      status: "Planificacion",
      startDate,
      endDate,
      hours,
      capacity,
      coordinator,
      audience,
      accessScope,
      enrollmentOpensAt,
      contentTemplate,
      diplomaTemplate: "Aprovechamiento"
    });
    const blueprint = buildCourseBlueprint(draftCourse, contentTemplate);
    state.courses.unshift({
      ...draftCourse,
      summary: blueprint.summary,
      modality: blueprint.modality,
      audience: blueprint.audience,
      accessScope,
      objectives: blueprint.objectives,
      sessions: blueprint.sessions,
      modules: blueprint.modules,
      materials: blueprint.materials,
      evaluationCriteria: blueprint.evaluationCriteria,
      contentTemplate: blueprint.contentTemplate,
      contentStatus: blueprint.contentStatus
    });
    state.activeView = "campus";
    campusSectionMode = "courses";
    state.selectedCourseId = id;
    coursesSectionMode = "workbench";
    courseWorkbenchMode = "ficha";
    addActivity("admin", session.name, `Ha creado el curso ${title}`);
    event.target.reset();
    await persistAndRender("Curso creado y guardado");
    requestAnimationFrame(() => focusCoursesWorkbench());
  }

  if (event.target.id === "memberForm" && isAdminSession()) {
    event.preventDefault();
    const name = document.getElementById("memberName").value.trim();
    const role = document.getElementById("memberRole").value.trim();
    const email = document.getElementById("memberEmail").value.trim();
    const certifications = document
      .getElementById("memberCertifications")
      .value.split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const renewalsDue = Number(document.getElementById("memberRenewals").value || 0);
    const accessPassword = document.getElementById("memberAccessPassword").value.trim();
    const accessRole = document.getElementById("memberAccessRole").value;

    if (!name || !role || !email) {
      return;
    }

    const now = Date.now();
    const memberId = `member-${now}`;
    state.members.unshift({
      id: memberId,
      name,
      role,
      email,
      certifications,
      renewalsDue
    });

    if (accessPassword) {
      state.accounts.push({
        id: `account-${now + 1}`,
        name,
        email,
        password: accessPassword,
        role: accessRole,
        memberId
      });
    }

    state.selectedMemberId = memberId;
    membersSectionMode = "workbench";
    addActivity("admin", session.name, `Ha creado la ficha de ${name}`);
    event.target.reset();
    await persistAndRender("Persona creada y guardada");
    requestAnimationFrame(() => focusMembersWorkbench());
  }

  if (event.target.id === "memberImportForm" && isAdminSession()) {
    event.preventDefault();
    const csv = document.getElementById("memberImportCsv").value.trim();
    if (!csv) {
      return;
    }

    await invokeJsonAction(
      "/api/import/csv",
      { kind: "members", csv },
      "Importacion de personas completada"
    );
    membersSectionMode = "directory";
    event.target.reset();
  }

  if (event.target.id === "memberEditForm" && isAdminSession()) {
    event.preventDefault();
    const member = findMember(state.selectedMemberId);
    if (!member) {
      return;
    }

    const name = document.getElementById("editMemberName").value.trim();
    const role = document.getElementById("editMemberRole").value.trim();
    const email = document.getElementById("editMemberEmail").value.trim();
    const certifications = document
      .getElementById("editMemberCertifications")
      .value.split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const renewalsDue = Number(document.getElementById("editMemberRenewals").value || 0);
    const accountRole = document.getElementById("editMemberAccessRole")?.value || "member";
    const accountPassword = document.getElementById("editMemberAccessPassword")?.value.trim() || "";
    const hasAccess = document.getElementById("editMemberHasAccess")?.checked;
    const account = findAccountByMember(member.id);

    if (!name || !role || !email) {
      return;
    }

    member.name = name;
    member.role = role;
    member.email = email;
    member.certifications = certifications;
    member.renewalsDue = renewalsDue;

    if (hasAccess) {
      if (account) {
        account.name = name;
        account.email = email;
        account.role = accountRole;
        if (accountPassword) {
          account.password = accountPassword;
        }
      } else {
        state.accounts.push({
          id: `account-${Date.now()}`,
          name,
          email,
          password: accountPassword || "cambiar123",
          role: accountRole,
          memberId: member.id
        });
      }
    } else if (account) {
      state.accounts = state.accounts.filter((item) => item.id !== account.id);
    }

    if (session?.memberId === member.id) {
      if (!hasAccess) {
        clearSession();
        loginStatus = "El acceso de esta persona ha sido retirado. Inicia sesion de nuevo.";
      } else {
        session.name = name;
        session.email = email;
        session.role = accountRole;
        persistSession();
        applySessionToState();
      }
    }

    addActivity("admin", session.name, `Ha actualizado la ficha de ${name}`);
    await persistAndRender("Ficha de persona actualizada");
    requestAnimationFrame(() => focusMembersWorkbench());
  }

  if (event.target.id === "courseEditForm" && isAdminSession()) {
    event.preventDefault();
    const course = getSelectedCourse();
    if (!course) {
      return;
    }

    const title = readCourseTrimmedValue("editCourseTitle", course.title);
    const courseClass = readCourseFieldValue("editCourseClass", course.courseClass);
    const type = readCourseTrimmedValue("editCourseType", course.type);
    const status = readCourseFieldValue("editCourseStatus", course.status);
    const startDate = readCourseFieldValue("editCourseStart", course.startDate);
    const endDate = readCourseFieldValue("editCourseEnd", course.endDate);
    const hours = readCourseNumberValue("editCourseHours", course.hours);
    const capacity = readCourseNumberValue("editCourseCapacity", course.capacity);
    const diplomaTemplate = readCourseTrimmedValue("editCourseDiploma", course.diplomaTemplate);
    const summary = readCourseTrimmedValue("editCourseSummary", course.summary);
    const modality = readCourseTrimmedValue("editCourseModality", course.modality || "Presencial");
    const enrollmentFee = readCourseNumberValue("editCourseEnrollmentFee", course.enrollmentFee || 0);
    const enrollmentPaymentInstructions = readCourseTrimmedValue(
      "editCourseEnrollmentInstructions",
      course.enrollmentPaymentInstructions || ""
    );
    const audience = readCourseTrimmedValue("editCourseAudience", course.audience || "Socios y voluntariado operativo");
    const accessScope = normalizeCourseAccessScope(
      readCourseFieldValue("editCourseAccessScope", course.accessScope || "members"),
      audience
    );
    const enrollmentOpensAt = normalizeDateTimeLocalInput(
      readCourseFieldValue("editCourseEnrollmentOpensAt", course.enrollmentOpensAt || "")
    );
    const coordinator = readCourseTrimmedValue("editCourseCoordinator", course.coordinator || "");
    const contentTemplate = readCourseFieldValue("editCourseTemplate", course.contentTemplate || inferCourseTemplate(course));
    const contentStatus = readCourseFieldValue("editCourseContentStatus", course.contentStatus || "draft");
    const objectives = document.getElementById("editCourseObjectives")
      ? parseTextareaList(document.getElementById("editCourseObjectives").value)
      : course.objectives || [];
    const sessions = document.getElementById("editCourseSessions")
      ? parseSessions(document.getElementById("editCourseSessions").value)
      : course.sessions || [];
    const modules = hasCourseModuleEditors() ? collectCourseModulesFromForm() : course.modules || [];
    const resources = hasCourseResourceEditors() ? collectCourseResourcesFromForm() : course.resources || [];
    const materials = document.getElementById("editCourseMaterials")
      ? parseTextareaList(document.getElementById("editCourseMaterials").value)
      : course.materials || [];
    const evaluationCriteria = document.getElementById("editCourseEvaluationCriteria")
      ? parseTextareaList(document.getElementById("editCourseEvaluationCriteria").value)
      : course.evaluationCriteria || [];
    const certificateCity = readCourseTrimmedValue("editCourseCertificateCity", course.certificateCity || "");
    const certificateContents = document.getElementById("editCourseCertificateContents")
      ? parseTextareaList(document.getElementById("editCourseCertificateContents").value)
      : course.certificateContents || [];
    const feedbackEnabled = readCourseFieldValue("editCourseFeedbackEnabled", String(course.feedbackEnabled)) !== "false";
    const feedbackRequiredForDiploma =
      readCourseFieldValue("editCourseFeedbackRequired", String(course.feedbackRequiredForDiploma)) === "true";
    const feedbackTeachers = document.getElementById("editCourseFeedbackTeachers")
      ? parseTextareaList(document.getElementById("editCourseFeedbackTeachers").value)
      : course.feedbackTeachers || [];

    if (!title || !courseClass || !type || !status || !startDate || !endDate || !hours || !capacity) {
      return;
    }

    course.title = title;
    course.courseClass = courseClass;
    course.type = type;
    course.status = status;
    course.startDate = startDate;
    course.endDate = endDate;
    course.hours = hours;
    course.capacity = capacity;
    course.diplomaTemplate = diplomaTemplate || "Aprovechamiento";
    course.summary = summary;
    course.modality = modality || "Presencial";
    course.enrollmentFee = enrollmentFee;
    course.enrollmentPaymentInstructions = enrollmentPaymentInstructions;
    course.audience = audience || "Socios y voluntariado operativo";
    course.accessScope = accessScope;
    course.enrollmentOpensAt = enrollmentOpensAt;
    course.coordinator = coordinator;
    course.contentTemplate = contentTemplate || inferCourseTemplate(course);
    course.contentStatus = contentStatus || "draft";
    course.objectives = objectives;
    course.sessions = sessions;
    course.modules = modules.length ? modules : course.modules?.length ? course.modules : buildModulesFromSessions(sessions);
    course.resources = resources.length ? resources : course.resources || [];
    course.materials = materials;
    course.evaluationCriteria = evaluationCriteria;
    course.certificateCity = certificateCity;
    course.certificateContents = certificateContents;
    course.feedbackEnabled = feedbackEnabled;
    course.feedbackRequiredForDiploma = feedbackRequiredForDiploma;
    course.feedbackTeachers = feedbackTeachers;

    addActivity("admin", session.name, `Ha actualizado el curso ${title}`);
    await persistAndRender("Curso actualizado");
    state.activeView = "campus";
    campusSectionMode = "courses";
    coursesSectionMode = "workbench";
    courseWorkbenchMode = "ficha";
    requestAnimationFrame(() => focusCoursesWorkbench());
  }

  if (event.target.id === "associateEditForm" && isAdminSession()) {
    event.preventDefault();
    const associate = findAssociate(state.selectedAssociateId);
    if (!associate) {
      return;
    }

    associate.associateNumber = Number(document.getElementById("editAssociateNumber").value || 0);
    associate.status = document.getElementById("editAssociateStatus").value;
    associate.firstName = document.getElementById("editAssociateFirstName").value.trim();
    associate.lastName = document.getElementById("editAssociateLastName").value.trim();
    associate.dni = document.getElementById("editAssociateDni").value.trim().toUpperCase();
    associate.phone = document.getElementById("editAssociatePhone").value.trim();
    associate.email = document.getElementById("editAssociateEmail").value.trim().toLowerCase();
    associate.service = document.getElementById("editAssociateService").value.trim();
    associate.lastQuotaMonth = document.getElementById("editAssociateLastQuotaMonth").value.trim();
    associate.annualAmount = Number(document.getElementById("editAssociateAnnual").value || 0);
    associate.observations = document.getElementById("editAssociateObservations").value.trim();
    refreshAssociateLegacyObservationSummary(associate);
    associate.manualYearlyFees = {
      "2024": Number(document.getElementById("editAssociateFee2024").value || 0),
      "2025": Number(document.getElementById("editAssociateFee2025").value || 0),
      "2026": Number(document.getElementById("editAssociateFee2026").value || 0),
      "2027": Number(document.getElementById("editAssociateFee2027").value || 0)
    };

    const linkedAccount = findAccountByAssociate(associate.id);
    const nextAccountRole = normalizeCampusAccountRole(document.getElementById("editAssociateAccountRole")?.value);
    if (linkedAccount && nextAccountRole && linkedAccount.id !== session?.accountId) {
      linkedAccount.role = nextAccountRole;
    }

    state.settings.associates.nextAssociateNumber = Math.max(
      Number(state.settings.associates.nextAssociateNumber || 1),
      associate.associateNumber + 1
    );
    syncAssociatePaymentTotals(associate);
    syncAssociateLinkedIdentityLocally(associate);

    addActivity(
      "admin",
      session.name,
      `Ha actualizado la ficha del socio #${associate.associateNumber} ${associate.firstName} ${associate.lastName}`.trim()
    );
    await persistAndRender("Ficha de socio actualizada");
  }

  if (event.target.id === "associatePaymentForm" && isAdminSession()) {
    event.preventDefault();
    const associate = findAssociate(state.selectedAssociateId);
    if (!associate) {
      return;
    }

    const date = document.getElementById("associatePaymentDate").value;
    const amount = Number(document.getElementById("associatePaymentAmount").value || 0);
    const year = String(document.getElementById("associatePaymentYear").value || "");
    const method = document.getElementById("associatePaymentMethod").value.trim();
    const note = document.getElementById("associatePaymentNote").value.trim();

    if (!date || !amount || !year || !method) {
      return;
    }

    associate.payments = associate.payments || [];
    associate.payments.unshift({
      id: `associate-payment-${Date.now()}`,
      date,
      year,
      amount,
      method,
      note,
      createdAt: new Date().toISOString(),
      createdBy: session.name
    });
    syncAssociatePaymentTotals(associate);

    addActivity(
      "admin",
      session.name,
      `Ha registrado un pago de ${formatCurrency(amount)} para el socio #${associate.associateNumber} ${getAssociateFullName(associate)}`
    );
    event.target.reset();
    document.getElementById("associatePaymentDate").value = getTodayDateInput();
    document.getElementById("associatePaymentYear").value = String(new Date().getFullYear());
    await persistAndRender("Pago de socio registrado");
  }

  if (event.target.id === "courseImportForm" && isAdminSession()) {
    event.preventDefault();
    const csv = document.getElementById("courseImportCsv").value.trim();
    if (!csv) {
      return;
    }

    await invokeJsonAction(
      "/api/import/csv",
      { kind: "courses", csv },
      "Importacion de cursos completada"
    );
    coursesSectionMode = "catalog";
    courseWorkbenchMode = "overview";
    event.target.reset();
  }
});

bootstrap();

async function bootstrap() {
  const bootUrl = new URL(window.location.href);
  const recoveredFromRecoveryPage = bootUrl.searchParams.get("recovered") === "1";
  render();
  await loadPublicCampusCourses();

  restoreSession();
  restoreViewRole();
  await syncSessionWithServer({
    clearInvalid: true,
    force: recoveredFromRecoveryPage || Boolean(session)
  });

  try {
    await refreshState();
    storageMeta = await loadStorageMeta();
    restoreSession();
    restoreViewRole();
    applySessionToState();
    restoreUiSnapshot();
    if (isAdminSession() && isAdminView()) {
      await ensureAdminStateLoaded();
    }
    saveUiSnapshot();
    hasLoaded = true;
    syncStatus = "Datos cargados";
  } catch (error) {
    state = structuredClone(fallbackState);
    storageMeta = null;
    hasLoaded = true;
    if (!session) {
      clearSession();
      syncStatus = "Inicia sesion para cargar el campus";
    } else {
      syncStatus = error.message || "No se pudo cargar el campus. Reintenta en unos segundos.";
    }
  }

  if (recoveredFromRecoveryPage) {
    bootUrl.searchParams.delete("recovered");
    bootUrl.searchParams.delete("t");
    window.history.replaceState({}, "", `${bootUrl.pathname}${bootUrl.search}${bootUrl.hash}`);
  }

  render();
}

async function syncSessionWithServer(options = {}) {
  const clearInvalid = Boolean(options.clearInvalid);
  const force = Boolean(options.force);
  const hadStoredSession = Boolean(session?.accountId);

  if (!force && !hadStoredSession) {
    return false;
  }

  const recovered = await recoverSessionFromServer();
  if (recovered) {
    return true;
  }

  if (clearInvalid && hadStoredSession) {
    clearSession();
  }

  return false;
}

async function loadPublicCampusCourses() {
  try {
    const response = await fetch("/api/public-campus/courses");
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "No se pudieron cargar los cursos abiertos");
    }
  publicCampusCourses = Array.isArray(payload.courses)
      ? payload.courses.map((course) => normalizeCourse(course))
      : [];
    publicCampusStatus = publicCampusCourses.length
      ? `${publicCampusCourses.length} curso(s) visible(s) ahora para acceso abierto desde el portal.`
      : "Ahora mismo no hay cursos abiertos a participantes externos.";
  } catch (error) {
    publicCampusCourses = [];
    publicCampusStatus = error.message || "No se pudieron cargar los cursos abiertos";
  }
}

async function recoverSessionFromServer() {
  try {
    const response = await fetch("/api/session", { credentials: "include" });
    const payload = await response.json();
    if (!response.ok || !payload?.ok || !payload.session) {
      return false;
    }
    session = payload.session;
    viewRole = session.role === "admin" ? "admin" : "member-self";
    persistSession();
    persistViewRole();
    return true;
  } catch (error) {
    return false;
  }
}

function restoreSession() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) {
      session = null;
      return;
    }

    const parsed = JSON.parse(stored);
    const account = Array.isArray(state.accounts)
      ? state.accounts.find((item) => item.id === parsed.accountId)
      : null;
      session = account
        ? {
            accountId: account.id,
            name: account.name,
            email: account.email,
            role: account.role,
            memberId: account.memberId,
            associateId: account.associateId || "",
            mustChangePassword: Boolean(account.mustChangePassword)
          }
        : {
            accountId: String(parsed.accountId || ""),
            name: String(parsed.name || ""),
            email: String(parsed.email || ""),
            role: parsed.role === "admin" ? "admin" : "member",
            memberId: String(parsed.memberId || ""),
            associateId: String(parsed.associateId || ""),
            mustChangePassword: Boolean(parsed.mustChangePassword)
          };
  } catch (error) {
    session = null;
  }
}

function restoreViewRole() {
  if (!session) {
    viewRole = "admin";
    return;
  }

  if (session.role !== "admin") {
    viewRole = "member-self";
    persistViewRole();
    return;
  }

  try {
    const stored =
      sessionStorage.getItem(VIEW_ROLE_KEY) ||
      (() => {
        try {
          return localStorage.getItem(VIEW_ROLE_BACKUP_KEY);
        } catch (error) {
          return null;
        }
      })();
    viewRole =
      stored === "member-preview" || stored === "member-self" || stored === "member"
        ? stored === "member" ? "member-preview" : stored
        : "admin";
  } catch (error) {
    viewRole = "admin";
  }
}

function persistSession() {
  if (!session) {
    sessionStorage.removeItem(SESSION_KEY);
    try {
      localStorage.removeItem(SESSION_BACKUP_KEY);
    } catch (error) {
    }
    return;
  }

  const serialized = JSON.stringify({
    accountId: String(session.accountId || ""),
    name: String(session.name || ""),
    email: String(session.email || ""),
    role: session.role === "admin" ? "admin" : "member",
    memberId: String(session.memberId || ""),
    associateId: String(session.associateId || ""),
    mustChangePassword: Boolean(session.mustChangePassword)
  });
  sessionStorage.setItem(SESSION_KEY, serialized);
  try {
    localStorage.removeItem(SESSION_BACKUP_KEY);
  } catch (error) {
  }
}

function persistViewRole() {
  try {
    if (!session) {
      sessionStorage.removeItem(VIEW_ROLE_KEY);
      try {
        localStorage.removeItem(VIEW_ROLE_BACKUP_KEY);
      } catch (error) {
      }
      return;
    }

    const nextRole = session.role === "admin" ? viewRole : "member-self";
    sessionStorage.setItem(VIEW_ROLE_KEY, nextRole);
    try {
      localStorage.setItem(VIEW_ROLE_BACKUP_KEY, nextRole);
    } catch (error) {
    }
  } catch (error) {
  }
}

function clearSession() {
  session = null;
  viewRole = "admin";
  persistSession();
  persistViewRole();
  try {
    sessionStorage.removeItem(UI_SNAPSHOT_KEY);
  } catch (error) {
  }
}

function applySessionToState() {
  if (!session) {
    return;
  }

  const account = state.accounts.find((item) => item.id === session.accountId);
    if (account) {
      session.name = account.name;
      session.email = account.email;
      session.role = account.role;
      session.memberId = account.memberId;
      session.associateId = account.associateId || "";
      session.mustChangePassword = Boolean(account.mustChangePassword);
      persistSession();
    }

  if (session.role !== "admin") {
    viewRole = "member-self";
    if (coursesSectionMode === "all") {
      coursesSectionMode = "workbench";
    }
  }

  state.role = getEffectiveRole();
  if (session.memberId && isSelfMemberSession()) {
    state.selectedMemberId = session.memberId;
  }
  if (isSelfMemberSession()) {
    const currentAssociate = getCurrentAssociate();
    if (currentAssociate?.id) {
      state.selectedAssociateId = currentAssociate.id;
    }
  }
  if (session.memberId && !isMemberPreviewSession()) {
    const selectedCourse = state.courses.find((course) => course.id === state.selectedCourseId);
    const hasSelectedOwnCourse =
      selectedCourse &&
      (selectedCourse.enrolledIds.includes(session.memberId) ||
        selectedCourse.waitingIds.includes(session.memberId));
    const primaryCourse = getPrimaryMemberCourse(session.memberId);
    if (!hasSelectedOwnCourse && primaryCourse) {
      state.selectedCourseId = primaryCourse.id;
    }
  }
  if (!isViewAllowed(state.activeView)) {
    state.activeView = isCurrentMemberLimitedToAssociateProfile() ? "join" : "overview";
  }
  if (!state.selectedCourseId && state.courses[0]) {
    state.selectedCourseId = state.courses[0].id;
  }
}

function getPreferredMemberCourseForMode(mode = "courses") {
  const memberId = session?.memberId || state.selectedMemberId;
  if (!memberId) {
    return null;
  }

  const ownCourses = (state.courses || []).filter(
    (course) => course.enrolledIds.includes(memberId) || course.waitingIds.includes(memberId)
  );
  const primaryCourse = getPrimaryMemberCourse(memberId);
  const openCourses = (state.courses || []).filter(
    (course) => !ownCourses.some((entry) => entry.id === course.id) && isCourseOpenForEnrollment(course)
  );
  const diplomaCourses = ownCourses.filter((course) => (course.diplomaReady || []).includes(memberId));

  if (mode === "diplomas") {
    return diplomaCourses[0] || ownCourses[0] || primaryCourse || openCourses[0] || null;
  }

  if (mode === "alerts") {
    return primaryCourse || ownCourses[0] || openCourses[0] || null;
  }

  return primaryCourse || ownCourses[0] || openCourses[0] || null;
}

function syncMemberContextSelection(mode = "courses") {
  if (isAdminView()) {
    return null;
  }

  if (session?.memberId) {
    state.selectedMemberId = session.memberId;
  }

  const currentAssociate = getCurrentAssociate();
  if (currentAssociate?.id) {
    state.selectedAssociateId = currentAssociate.id;
  }

  const preferredCourse = getPreferredMemberCourseForMode(mode);
  if (preferredCourse?.id) {
    state.selectedCourseId = preferredCourse.id;
  }

  return preferredCourse;
}

function activateMemberCampusMode(mode = "courses", options = {}) {
  const normalizedMode =
    campusOnlySession && mode === "groups"
      ? "courses"
      : ["courses", "diplomas", "alerts", "groups", "all"].includes(mode)
        ? mode
        : "courses";
  const preferredCourse = syncMemberContextSelection(normalizedMode);
  const memberId = state.selectedMemberId;
  const hasOwnPreferredCourse = Boolean(
    preferredCourse &&
      memberId &&
      (preferredCourse.enrolledIds.includes(memberId) || preferredCourse.waitingIds.includes(memberId))
  );

  state.activeView = "campus";
  campusSectionMode = normalizedMode;
  learnerEnrollmentIntent = false;

  if (normalizedMode === "groups") {
    if (!getSelectedCampusGroup()) {
      state.selectedCampusGroupId = state.campusGroups[0]?.id || null;
      selectedCampusGroupModuleId = state.campusGroups[0]?.modules?.[0]?.id || "";
    }
    return preferredCourse;
  }

  if (normalizedMode === "diplomas" || normalizedMode === "alerts") {
    learnerCourseDetailsMode = "overview";
    return preferredCourse;
  }

  if (normalizedMode === "all") {
    coursesSectionMode = "all";
    learnerCourseDetailsMode = "overview";
    return preferredCourse;
  }

  if (options.focusWorkbench && hasOwnPreferredCourse) {
    coursesSectionMode = "workbench";
    learnerCourseWorkspaceMode = "roadmap";
    learnerCourseDetailsMode = "overview";
    return preferredCourse;
  }

  if (options.focusStatus && preferredCourse) {
    coursesSectionMode = "details";
    learnerCourseDetailsMode = "status";
    return preferredCourse;
  }

  if (options.focusCatalog || !hasOwnPreferredCourse) {
    coursesSectionMode = "all";
    learnerCourseDetailsMode = "overview";
    return preferredCourse;
  }

  coursesSectionMode = options.sectionMode || "details";
  learnerCourseDetailsMode = "overview";
  return preferredCourse;
}

function normalizeState(data) {
  const nextState = {
    ...structuredClone(fallbackState),
    ...data
  };

  if (["courses", "operations", "diplomas"].includes(nextState.activeView)) {
    nextState.activeView = "campus";
  }

  if (!nextState.selectedCourseId && nextState.courses[0]) {
    nextState.selectedCourseId = nextState.courses[0].id;
  }

  nextState.campusGroups = (
    Array.isArray(nextState.campusGroups) && nextState.campusGroups.length
      ? nextState.campusGroups
      : buildDefaultCampusGroups()
  ).map((group, index) =>
    normalizeCampusGroup(group, index)
  );
  if (!nextState.selectedCampusGroupId && nextState.campusGroups[0]) {
    nextState.selectedCampusGroupId = nextState.campusGroups[0].id;
  }
  const normalizedSelectedGroup =
    nextState.campusGroups.find((group) => group.id === nextState.selectedCampusGroupId) ||
    nextState.campusGroups[0] ||
    null;
  if (!selectedCampusGroupModuleId && normalizedSelectedGroup?.modules?.[0]) {
    selectedCampusGroupModuleId = normalizedSelectedGroup.modules[0].id;
  }

  if (!nextState.selectedMemberId && nextState.members[0]) {
    nextState.selectedMemberId = nextState.members[0].id;
  }

  nextState.accounts = nextState.accounts || [];
  nextState.activityLog = nextState.activityLog || [];
  nextState.agentLog = nextState.agentLog || [];
  nextState.automationInbox = nextState.automationInbox || [];
  nextState.manualCampusNotices = (nextState.manualCampusNotices || []).map((notice, index) =>
    normalizeManualCampusNotice(notice, index)
  );
  nextState.associateApplications = nextState.associateApplications || [];
  nextState.associatePaymentSubmissions = nextState.associatePaymentSubmissions || [];
  nextState.associateProfileRequests = nextState.associateProfileRequests || [];
  nextState.associates = nextState.associates || [];
  nextState.courses = (nextState.courses || []).map((course) => normalizeCourse(course));
  nextState.selectedAssociatePaymentSubmissionId =
    nextState.selectedAssociatePaymentSubmissionId || null;
  nextState.selectedAssociateProfileRequestId =
    nextState.selectedAssociateProfileRequestId || null;
  nextState.automationMeta = {
    ...structuredClone(fallbackState.automationMeta),
    ...(nextState.automationMeta || {})
  };
  nextState.emailOutbox = nextState.emailOutbox || [];
  nextState.settings = {
    ...structuredClone(fallbackState.settings),
    ...(nextState.settings || {}),
    automation: {
      ...structuredClone(fallbackState.settings.automation),
      ...(nextState.settings?.automation || {})
    },
    agent: {
      ...structuredClone(fallbackState.settings.agent),
      ...(nextState.settings?.agent || {})
    },
    associates: {
      ...structuredClone(fallbackState.settings.associates),
      ...(nextState.settings?.associates || {})
    },
    smtp: {
      ...structuredClone(fallbackState.settings.smtp),
      ...(nextState.settings?.smtp || {})
    }
  };
  if (!nextState.selectedAssociateApplicationId && nextState.associateApplications[0]) {
    nextState.selectedAssociateApplicationId = nextState.associateApplications[0].id;
  }
  if (!nextState.selectedAssociatePaymentSubmissionId && nextState.associatePaymentSubmissions[0]) {
    nextState.selectedAssociatePaymentSubmissionId = nextState.associatePaymentSubmissions[0].id;
  }
  if (!nextState.selectedAssociateProfileRequestId && nextState.associateProfileRequests[0]) {
    nextState.selectedAssociateProfileRequestId = nextState.associateProfileRequests[0].id;
  }
  if (!nextState.selectedAssociateId && nextState.associates[0]) {
    nextState.selectedAssociateId = nextState.associates[0].id;
  }
  return nextState;
}

async function persistAndRender(successMessage) {
  syncStatus = "Guardando cambios...";
  render();

  saveSequence = saveSequence.then(async () => {
    let payloadState = {
      ...state,
      role: isAdminSession() ? "admin" : getEffectiveRole()
    };

    if (session?.role === "admin" && !isAdminView()) {
      const fullStateResponse = await fetch("/api/state");
      const fullStatePayload = await fullStateResponse.json();
      const fullState = normalizeState(fullStatePayload);
      const scopedMemberId =
        (isMemberPreviewSession() ? state.selectedMemberId : session?.memberId) || state.selectedMemberId;
      payloadState = mergeScopedMemberChangesIntoFullState(fullState, state, scopedMemberId);
      payloadState.role = "admin";
    }

      const response = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadState)
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || payload?.message || "No se pudieron guardar los cambios");
      }

      if (payload.state) {
        state = normalizeState(payload.state);
        applySessionToState();
      }

      if (pendingCampusGroupDraftClearGroupId) {
        Object.keys(campusGroupAttachmentDrafts).forEach((key) => {
          if (key.startsWith(`${pendingCampusGroupDraftClearGroupId}::`)) {
            delete campusGroupAttachmentDrafts[key];
          }
        });
        clearCampusDraft(pendingCampusGroupDraftClearGroupId);
        pendingCampusGroupDraftClearGroupId = "";
      }

      storageMeta = await loadStorageMeta();
      syncStatus = payload.message || successMessage;
      showToast(payload.message || successMessage, "success");
    });

    try {
      await saveSequence;
    } catch (error) {
      pendingCampusGroupDraftClearGroupId = "";
      syncStatus = error?.message || "Error al guardar";
      showToast(error?.message || "Error al guardar", "error");
    }

  render();
}

function mergeScopedMemberChangesIntoFullState(fullState, scopedState, memberId) {
  if (!memberId) {
    return {
      ...fullState,
      selectedCourseId: scopedState.selectedCourseId || fullState.selectedCourseId
    };
  }

  const scopedCoursesById = new Map((scopedState.courses || []).map((course) => [course.id, course]));
  const mergedCourses = (fullState.courses || []).map((course) => {
    const scopedCourse = scopedCoursesById.get(course.id);
    if (!scopedCourse) {
      return course;
    }

    const nextContentProgress = {
      ...(course.contentProgress || {})
    };
    if (Object.prototype.hasOwnProperty.call(scopedCourse.contentProgress || {}, memberId)) {
      nextContentProgress[memberId] = structuredClone(scopedCourse.contentProgress[memberId]);
    }

    const nextFeedbackResponses = [
      ...((course.feedbackResponses || []).filter((response) => response.memberId !== memberId)),
      ...((scopedCourse.feedbackResponses || []).filter((response) => response.memberId === memberId))
    ];

    return {
      ...course,
      contentProgress: nextContentProgress,
      feedbackResponses: nextFeedbackResponses
    };
  });

  return {
    ...fullState,
    selectedCourseId: scopedState.selectedCourseId || fullState.selectedCourseId,
    selectedMemberId: memberId,
    courses: mergedCourses
  };
}

async function refreshState(options = {}) {
  const forceAdminState = Boolean(options.forceAdminState);
  const retryAfterSessionSync = options.retryAfterSessionSync !== false;
  const stateUrl = new URL("/api/state", window.location.origin);
  if (!forceAdminState && session?.role === "admin" && viewRole === "member-self" && session?.memberId) {
    stateUrl.searchParams.set("mode", "self");
  } else if (!forceAdminState && session?.role === "admin" && viewRole === "member-preview" && state.selectedMemberId) {
    stateUrl.searchParams.set("mode", "preview");
    stateUrl.searchParams.set("memberId", state.selectedMemberId);
  }
  const stateResponse = await fetch(`${stateUrl.pathname}${stateUrl.search}`);
  let payload = null;
  try {
    payload = await stateResponse.json();
  } catch (error) {
    payload = null;
  }
  if (stateResponse.status === 401) {
    const recovered = retryAfterSessionSync
      ? await syncSessionWithServer({ clearInvalid: true, force: true })
      : false;
    if (recovered) {
      return refreshState({ ...options, retryAfterSessionSync: false });
    }
    clearSession();
    throw new Error("La sesion ha caducado. Vuelve a entrar.");
  }
  if (!stateResponse.ok || (payload && payload.ok === false)) {
    throw new Error(payload?.error || "No se pudo cargar el estado del campus");
  }
  state = normalizeState(payload);
  storageMeta = await loadStorageMeta();
}

async function ensureAdminStateLoaded() {
  if (!isAdminSession() || !isAdminView()) {
    return;
  }
  if ((state.associates?.length || 0) > 0 && (state.members?.length || 0) > 0) {
    return;
  }
  await refreshState({ forceAdminState: true });
  applySessionToState();
}

function syncSelectedAssociateApplication() {
  const applications = state.associateApplications || [];
  if (!applications.length) {
    state.selectedAssociateApplicationId = null;
    return;
  }

  const stillExists = applications.some((item) => item.id === state.selectedAssociateApplicationId);
  const nextPending = applications.find((item) => isAssociateApplicationPending(item));
  const nextReviewTarget = nextPending || applications[0];

  if (!stillExists || !isAssociateApplicationPending(findAssociateApplication(state.selectedAssociateApplicationId))) {
    state.selectedAssociateApplicationId = nextReviewTarget.id;
  }
}

function syncSelectedAssociatePaymentSubmission() {
  const submissions = state.associatePaymentSubmissions || [];
  if (!submissions.length) {
    state.selectedAssociatePaymentSubmissionId = null;
    return;
  }

  const stillExists = submissions.some((item) => item.id === state.selectedAssociatePaymentSubmissionId);
  const nextPending = submissions.find((item) => item.status === "Pendiente de revision");
  const fallbackTarget = nextPending || submissions[0];

  if (!stillExists || findAssociatePaymentSubmission(state.selectedAssociatePaymentSubmissionId)?.status !== "Pendiente de revision") {
    state.selectedAssociatePaymentSubmissionId = fallbackTarget.id;
  }
}

function syncSelectedAssociateProfileRequest() {
  const requests = state.associateProfileRequests || [];
  if (!requests.length) {
    state.selectedAssociateProfileRequestId = null;
    return;
  }

  const stillExists = requests.some((item) => item.id === state.selectedAssociateProfileRequestId);
  const nextPending = requests.find((item) => item.status === "Pendiente de revision");
  const fallbackTarget = nextPending || requests[0];

  if (!stillExists || findAssociateProfileRequest(state.selectedAssociateProfileRequestId)?.status !== "Pendiente de revision") {
    state.selectedAssociateProfileRequestId = fallbackTarget.id;
  }
}

function syncAssociateSelectionTargets() {
  syncSelectedAssociateApplication();
  syncSelectedAssociatePaymentSubmission();
  syncSelectedAssociateProfileRequest();
}

function getNextPendingAssociateApplication(currentId) {
  const pendingApplications = (state.associateApplications || []).filter((item) =>
    isAssociateApplicationPending(item)
  );
  if (!pendingApplications.length) {
    return null;
  }

  const currentIndex = pendingApplications.findIndex((item) => item.id === currentId);
  if (currentIndex === -1) {
    return pendingApplications[0];
  }

  return pendingApplications[currentIndex + 1] || null;
}

async function invokeServerAction(url, successMessage) {
  syncStatus = "Procesando accion en servidor...";
  render();

  try {
    const response = await fetch(url, { method: "POST" });
    const payload = await response.json();
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || "Accion rechazada");
    }

    await refreshState();
    applySessionToState();
    syncAssociateSelectionTargets();
    syncStatus = payload.message || successMessage;
    showToast(payload.message || successMessage, "success");
  } catch (error) {
    syncStatus = error.message || "Error en accion de servidor";
    showToast(syncStatus, "error");
  }

  render();
}

async function invokeJsonAction(url, payload, successMessage) {
  syncStatus = "Procesando lote en servidor...";
  render();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok || result.ok === false) {
      throw new Error(result.error || "Accion rechazada");
    }

    await refreshState();
    applySessionToState();
    syncAssociateSelectionTargets();
    syncStatus = result.message || successMessage;
    showToast(result.message || successMessage, "success");
  } catch (error) {
    syncStatus = error.message || "Error en proceso por lotes";
    showToast(syncStatus, "error");
  }

  render();
}

function render() {
  const hasOwnMemberProfile = Boolean(session?.memberId);
  const currentAssociate = getCurrentAssociate();
  if (isSelfMemberSession() && currentAssociate) {
    const staleSelfMessages = [
      /no tiene una ficha de socio vinculada/i,
      /mi perfil socio activado/i,
      /la persona seleccionada no tiene una cuenta de socio real vinculada/i
    ];
    if (staleSelfMessages.some((pattern) => pattern.test(String(syncStatus || "")))) {
      syncStatus = `Ficha de socio #${currentAssociate.associateNumber || "-"} cargada correctamente`;
    }
  }
  roleSwitcher.querySelector('option[value="member-self"]')?.toggleAttribute("hidden", !hasOwnMemberProfile);
  roleSwitcher.querySelector('option[value="member-preview"]')?.toggleAttribute("hidden", !isAdminSession());
  roleSwitcher.closest(".switcher")?.toggleAttribute("hidden", !isAdminSession());
  updateRoleSwitcherOptions();
  memberSwitcher.closest(".switcher")?.toggleAttribute("hidden", isSelfMemberSession());
  roleSwitcher.value = isAdminView() ? "admin" : isMemberPreviewSession() ? "member-preview" : "member-self";
  roleSwitcher.disabled = !isAdminSession();
  if (resetButton) {
    resetButton.disabled = !isAdminSession();
  }
  logoutButton.disabled = !session;
  renderMemberSwitcher();
  renderLoginOverlay();
  syncStatusElement.textContent = syncStatus;
  toastLayer.innerHTML = toastMessage
    ? `<div class="toast ${toastType === "error" ? "error" : "success"}">${escapeHtml(toastMessage)}</div>`
    : "";
  const previewMember = getCurrentMember();
  sessionStatusElement.textContent = session
    ? `Sesion: ${session.name} | ${session.role === "admin" ? "administracion" : "alumno"}${
        isSelfMemberSession() && previewMember
          ? ` | modo socio y alumno de ${previewMember.name}`
          : isMemberPreviewSession() && previewMember
          ? ` | previsualizando a ${previewMember.name}`
          : ""
      }${session.mustChangePassword ? " | cambio de contrasena pendiente" : ""}`
    : "Sin sesion activa";
  renderSidebarContextCard();
  renderNav();
  renderMetrics();
  syncFrontendStore();
  renderMainPanel();
  if (pendingViewAnchorId) {
    const anchorId = pendingViewAnchorId;
    pendingViewAnchorId = "";
    requestAnimationFrame(() => focusElementById(anchorId));
  }
  renderSidePanel();
  applyChromeProfile();
  if (pendingInputFocusRestore?.id) {
    const focusState = pendingInputFocusRestore;
    pendingInputFocusRestore = null;
    requestAnimationFrame(() => {
      const input = document.getElementById(focusState.id);
      if (!input) {
        return;
      }
      input.focus({ preventScroll: true });
      if (typeof focusState.start === "number" && typeof focusState.end === "number") {
        try {
          input.setSelectionRange(focusState.start, focusState.end);
        } catch (error) {
          // Ignore selection restoration errors for unsupported input states.
        }
      }
    });
  }
}

function getChromeProfile() {
  const isMemberLike = !isAdminView() || isMemberPreviewSession();
  const isOverview = state.activeView === "overview";
  const isJoin = state.activeView === "join";
  const isCampusGroups = state.activeView === "campus" && campusSectionMode === "groups";
  const focusedWorkspaceViews = ["associates", "members", "campus", "reports", "activity", "automation"];

  return {
    compactSidebar: true,
    hideAssistantCard: false,
    hideHero: Boolean(session),
    hideMetrics: !isAdminView() || !isOverview || state.activeView === "campus",
    hideSidePanel: isMemberLike || isJoin || isOverview || isCampusGroups,
    singleWorkspace: (isOverview && isMemberLike) || isJoin || isCampusGroups || focusedWorkspaceViews.includes(state.activeView)
  };
}

function applyChromeProfile() {
  const profile = getChromeProfile();
  shellElement?.classList.toggle("shell-compact", profile.compactSidebar);
  sidebarElement?.classList.toggle("sidebar-compact", profile.compactSidebar);
  contentElement?.classList.toggle("content-compact", profile.compactSidebar);
  heroElement?.classList.toggle("hero-hidden", profile.hideHero);
  metricsElement?.classList.toggle("metrics-hidden", profile.hideMetrics);
  sidePanel?.classList.toggle("panel-side-hidden", profile.hideSidePanel);
  workspaceElement?.classList.toggle("workspace-single", profile.singleWorkspace || profile.hideSidePanel);
  sidebarAssistantCard?.classList.toggle("sidebar-card-hidden", profile.hideAssistantCard);
}

function renderPublicCampusCourseList() {
  if (!publicCourseList) {
    return;
  }

  if (!publicCampusCourses.length) {
    publicCourseList.innerHTML = `<p class="muted">Ahora mismo no hay cursos abiertos al publico general.</p>`;
    return;
  }

  publicCourseList.innerHTML = publicCampusCourses
    .map((course) => {
      const seatsLabel =
        Number(course.seatsAvailable || 0) > 0
          ? `${course.seatsAvailable} plaza(s) libres`
          : "Acceso por lista de espera";
      const enrollmentCall = getCourseEnrollmentCall(course);
      return `
        <article class="login-public-course-card">
          <div class="row-between">
            <strong>${escapeHtml(course.title || "Curso abierto")}</strong>
            <span class="small-chip">${escapeHtml(COURSE_ACCESS_SCOPE_LABELS[course.accessScope] || "Abierto")}</span>
          </div>
          <p class="muted">${escapeHtml(course.summary || "Curso abierto con acceso desde el portal de Isocrona Zero.")}</p>
          <div class="compact-course-meta">
            <span>${escapeHtml(formatDate(course.startDate) || "Fecha por anunciar")}</span>
            <span>${Number(course.hours || 0)} h</span>
            <span>${escapeHtml(seatsLabel)}</span>
            ${Number(course.enrollmentFee || 0) > 0 ? `<span>${formatCurrency(course.enrollmentFee)}</span>` : `<span>Sin coste</span>`}
          </div>
          <span class="eyebrow">${escapeHtml(enrollmentCall.helperLabel || "Accede creando tu cuenta solo campus o entrando con tu usuario actual.")}</span>
          <a class="inline-button button-link" href="#publicCampusRegisterForm">Quiero apuntarme</a>
        </article>
      `;
    })
    .join("");
}

function renderLoginOverlay() {
  loginScreen.classList.toggle("visible", !session);
  loginStatusElement.textContent = loginStatus;
  loginStatusElement.classList.toggle("warning", /inval|deneg|no se pudo/i.test(loginStatus));
  if (publicCampusStatusElement) {
    publicCampusStatusElement.textContent = publicCampusStatus;
    publicCampusStatusElement.classList.toggle("warning", /error|no se pudo|inval|existe/i.test(publicCampusStatus));
  }
  renderPublicCampusCourseList();
  passwordScreen.classList.toggle("visible", Boolean(session?.mustChangePassword));
  changePasswordStatusElement.textContent = passwordChangeStatus;
  changePasswordStatusElement.classList.toggle(
    "warning",
    /no coincide|no se pudo|minimo|distinta|actual/i.test(passwordChangeStatus)
  );
}

function renderMemberSwitcher() {
  const availableMembers = isSelfMemberSession()
    ? state.members.filter((member) => member.id === session?.memberId)
    : isAdminSession()
    ? state.members
    : state.members.filter((member) => member.id === session?.memberId);

  memberSwitcher.innerHTML = availableMembers
    .map(
      (member) => `
        <option value="${member.id}" ${state.selectedMemberId === member.id ? "selected" : ""}>
          ${member.name}
        </option>
      `
    )
    .join("");

  memberSwitcher.disabled =
    !availableMembers.length || !session || Boolean(session?.mustChangePassword) || isSelfMemberSession();
}

function renderSidebarContextCard() {
  if (!sidebarAssistantCard) {
    return;
  }

  if (!hasLoaded) {
    sidebarAssistantCard.innerHTML = `
      <p class="eyebrow">Contexto</p>
      <h2>Sincronizando</h2>
      <p class="sidebar-support">Preparando datos del campus para empezar a trabajar.</p>
    `;
    return;
  }

  if (!session) {
    sidebarAssistantCard.innerHTML = `
      <p class="eyebrow">Acceso</p>
      <h2>Panel inactivo</h2>
      <p class="sidebar-support">Introduce tus credenciales para cargar el campus y su contexto.</p>
      <div class="sidebar-toolbar">
        <a class="primary-button" href="/join.html">Hazte socio</a>
      </div>
    `;
    return;
  }

  const previewMember = getCurrentMember();
  const currentAssociate = getCurrentAssociate();
  const selectedCourse = getSelectedCourse();
  const selectedGroup = getSelectedCampusGroup();
  const viewLabelMap = {
    overview: isAdminView() ? "Panel general" : "Mi panel",
    join: isAdminView() ? "Alta y seguimiento" : "Mi ficha de socio",
    associates: "Socios y cuotas",
    members: "Personas y accesos",
    campus: "Campus",
    reports: "Informes",
    activity: "Auditoria",
    automation: "Automatizacion"
  };
  const campusSectionLabelMap = {
    all: "Mapa general",
    courses: "Cursos",
    operations: "Operativa",
    diplomas: "Diplomas",
    groups: "Grupos internos"
  };
  const currentViewLabel = viewLabelMap[state.activeView] || "Campus";
  const currentSectionLabel =
    state.activeView === "campus" ? campusSectionLabelMap[campusSectionMode] || "Campus" : "";
  const currentQuotaGap = currentAssociate ? getAssociateQuotaGap(currentAssociate) : 0;
  const sessionModeLabel = isSelfMemberSession()
    ? "Sesion real de socio"
    : isMemberPreviewSession()
      ? "Vista previa de alumno"
      : session.role === "admin"
        ? "Sesion administrativa"
        : "Sesion de alumno";
  const contextChips = [
    currentSectionLabel || currentViewLabel,
    previewMember?.name || session.name || "",
    selectedCourse?.title || "",
    selectedGroup?.title || "",
    currentAssociate
      ? currentQuotaGap > 0
        ? `Pendiente ${formatCurrency(currentQuotaGap)}`
        : "Cuota al dia"
      : ""
  ].filter(Boolean);

  sidebarAssistantCard.innerHTML = `
    <p class="eyebrow">Contexto</p>
    <h2>${escapeHtml(currentViewLabel)}</h2>
    <p class="sidebar-support">${escapeHtml(buildAssistantSummary())}</p>
    <p class="sidebar-support">${escapeHtml(sessionModeLabel)}</p>
    ${
      contextChips.length
        ? `
          <div class="chip-row compact-chip-row">
            ${contextChips.map((chip) => `<span class="small-chip">${escapeHtml(chip)}</span>`).join("")}
          </div>
        `
        : ""
    }
  `;
}

function renderNav() {
  const campusOnlySession = isCampusOnlySession();
  const memberLabels = {
    overview: "Mi panel",
    join: campusOnlySession ? "Hazte socio" : "Mi ficha de socio",
    campus: "Campus",
    test: "Test"
  };
  navElement.innerHTML = navItems
    .filter((item) => isViewAllowed(item.id))
    .map(
      (item) => `
        <div class="nav-item-group ${state.activeView === item.id ? "active" : ""}">
          <div class="nav-item-row">
            <button class="nav-main-button ${state.activeView === item.id ? "active" : ""}" type="button" data-action="nav" data-view="${item.id}">
              ${!isAdminView() && memberLabels[item.id] ? memberLabels[item.id] : item.label}
            </button>
            ${
              item.sections?.length
                ? `
                    <button
                      class="nav-toggle-button ${isNavGroupExpanded(item.id) ? "expanded" : ""}"
                      type="button"
                      data-action="toggle-nav-group"
                      data-view="${item.id}"
                      aria-expanded="${isNavGroupExpanded(item.id) ? "true" : "false"}"
                      title="${isNavGroupExpanded(item.id) ? "Ocultar subapartados" : "Mostrar subapartados"}"
                    >
                      <span>${isNavGroupExpanded(item.id) ? "&#9662;" : "&#9656;"}</span>
                    </button>
                  `
                : ""
            }
          </div>
          ${
            item.sections?.length && isNavGroupExpanded(item.id)
              ? `
                  <div class="nav-submenu">
                    ${item.sections
                      .map(
                        (section) => `
                          <button class="nav-subbutton" type="button" data-action="nav-section" data-view="${item.id}" data-section-id="${section.id}">
                            ${section.label}
                          </button>
                        `
                      )
                      .join("")}
                  </div>
                `
              : ""
          }
        </div>
      `
    )
    .join("");
}

function renderMetrics() {
  if (!isAdminView()) {
    const currentMember = getCurrentMember();
    const currentAssociate = getCurrentAssociate();
    const enrolledCourses = state.courses.filter((course) => course.enrolledIds.includes(currentMember?.id)).length;
    const availableDiplomas = state.courses.filter((course) => course.diplomaReady.includes(currentMember?.id)).length;
    const averageProgress = enrolledCourses
      ? Math.round(
          state.courses
            .filter((course) => course.enrolledIds.includes(currentMember?.id))
            .reduce((sum, course) => sum + getLearnerCourseContentStats(course, currentMember?.id).blockProgress, 0) /
            enrolledCourses
        )
      : 0;
    const currentYearPaid = currentAssociate ? formatCurrency(getAssociateCurrentYearFee(currentAssociate)) : "-";

    const metrics = [
      { label: "Cursos inscritos", value: enrolledCourses, hint: "Formaciones activas en tu ficha" },
      { label: "Progreso contenido", value: `${averageProgress}%`, hint: "Avance medio en bloques y lecciones" },
      { label: "Diplomas", value: availableDiplomas, hint: "Disponibles para descarga" },
      { label: "Cuota anual", value: currentYearPaid, hint: currentAssociate ? currentAssociate.status : "Sin ficha de socio" }
    ];

    metricsElement.innerHTML = metrics
      .map(
        (metric) => `
          <article class="metric-card">
            <p class="eyebrow">${metric.label}</p>
            <strong>${metric.value}</strong>
            <span class="muted">${metric.hint}</span>
          </article>
        `
      )
      .join("");
    return;
  }

  const totalCourses = state.courses.length;
  const totalEnrolled = state.courses.reduce((sum, course) => sum + course.enrolledIds.length, 0);
  const pendingDiplomas = state.courses.reduce(
    (sum, course) => sum + getCoursePendingDiplomaDeliveries(course),
    0
  );
  const renewalsDue = state.members.reduce((sum, member) => sum + member.renewalsDue, 0);
  const pendingAssociateApplications = countPendingAssociateApplications();
  const activeAssociates = state.associates.filter((item) => item.status === "Activa").length;
  const totalPublishedLessons = state.courses.reduce((sum, course) => sum + getPublishedLessonCount(course), 0);

  const metrics = [
    { label: "Solicitudes socios", value: pendingAssociateApplications, hint: "Pendientes o en subsanacion" },
    { label: "Socios activos", value: activeAssociates, hint: "Alta completada y en seguimiento" },
    { label: "Contenido publicado", value: totalPublishedLessons, hint: "Lecciones listas para alumnado" },
    { label: "Diplomas pendientes", value: pendingDiplomas, hint: "Listos para enviar o revisar" },
    { label: "Renovaciones", value: renewalsDue, hint: "Certificaciones proximas a vencer" }
  ];

  metricsElement.innerHTML = metrics
    .map(
      (metric) => `
        <article class="metric-card">
          <p class="eyebrow">${metric.label}</p>
          <strong>${metric.value}</strong>
          <span class="muted">${metric.hint}</span>
        </article>
      `
    )
    .join("");
}

function renderMainPanel() {
  if (!hasLoaded) {
    mainPanel.innerHTML = `<div class="empty-state">Cargando campus...</div>`;
    return;
  }

  if (!session) {
    mainPanel.innerHTML = `<div class="empty-state">Introduce tus credenciales para empezar.</div>`;
    return;
  }

  const selectedCourse = getSelectedCourse();
  if (state.activeView === "test") {
    renderFrontendTestView();
    mainPanel.insertAdjacentHTML("beforeend", renderCampusAttachmentPreviewModal());
    return;
  }

  const views = {
    overview: renderOverview,
    join: renderJoinView,
    associates: renderAssociates,
    validations: renderValidations,
    members: renderMembers,
    campus: renderCampus,
    courses: renderCourses,
    operations: () => renderOperations(selectedCourse),
    diplomas: () => renderDiplomas(selectedCourse),
    reports: renderReports,
    activity: renderActivity,
    automation: renderAutomation
  };
  mainPanel.innerHTML = views[state.activeView]() + renderCampusAttachmentPreviewModal();
}

function isNavGroupExpanded(viewId) {
  return expandedNavViews.has(viewId);
}

function getDefaultSectionModeForView(viewId) {
  const defaults = {
    overview: "overview",
    associates: "directory",
    members: "directory",
    campus: "courses",
    courses: "catalog",
    operations: "summary",
    diplomas: "actions",
    reports: "exports",
    activity: "timeline",
    automation: "status"
  };

  return defaults[viewId] || "all";
}

function setFocusedViewMode(viewId) {
  const nextMode = getDefaultSectionModeForView(viewId);

  if (viewId === "associates") {
    associatesSectionMode = nextMode;
  }

  if (viewId === "members") {
    membersSectionMode = nextMode;
  }

  if (viewId === "campus") {
    campusSectionMode = nextMode;
  }

  if (viewId === "courses") {
    coursesSectionMode = nextMode;
  }

  if (viewId === "operations") {
    operationsSectionMode = nextMode;
  }

  if (viewId === "diplomas") {
    diplomasSectionMode = nextMode;
  }

  if (viewId === "reports") {
    reportsSectionMode = nextMode;
  }

  if (viewId === "automation") {
    automationSectionMode = nextMode;
  }
}

function resolveCampusAliasView(viewId) {
  if (["courses", "operations", "diplomas"].includes(viewId)) {
    return "campus";
  }
  return viewId;
}

function applyViewSectionMode(viewId, sectionId) {
  const effectiveViewId = resolveCampusAliasView(viewId);
  const mode = VIEW_SECTION_MODES[viewId]?.[sectionId];
  if (!mode) {
    return;
  }

  if (effectiveViewId === "associates") {
    associatesSectionMode = mode;
  }

  if (effectiveViewId === "campus") {
    if (["courses", "operations", "diplomas"].includes(viewId)) {
      campusSectionMode = viewId;
    } else {
      campusSectionMode = mode;
    }
  }

  if (viewId === "courses") {
    coursesSectionMode = mode;
  }

  if (viewId === "members") {
    membersSectionMode = mode;
  }

  if (viewId === "operations") {
    operationsSectionMode = mode;
  }

  if (viewId === "diplomas") {
    diplomasSectionMode = mode;
  }

  if (viewId === "reports") {
    reportsSectionMode = mode;
  }

  if (viewId === "automation") {
    automationSectionMode = mode;
  }
}

function scrollToViewSection(viewId, sectionId) {
  const effectiveViewId = resolveCampusAliasView(viewId);
  applyViewSectionMode(viewId, sectionId);

  if (state.activeView !== effectiveViewId) {
    state.activeView = effectiveViewId;
    expandedNavViews.add(effectiveViewId);
    saveUiSnapshot();
    render();
    requestAnimationFrame(() => scrollToViewSection(effectiveViewId, sectionId));
    return;
  }

  expandedNavViews.add(effectiveViewId);
  saveUiSnapshot();
  render();
  requestAnimationFrame(() => {
    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function scrollToAssociateSection(sectionId) {
  scrollToViewSection("associates", sectionId);
}

function focusAssociatesSidePanel() {
  sidePanel.scrollTo({ top: 0, behavior: "smooth" });
  sidePanel.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
}

function focusAssociatesWorkbench() {
  const target = document.getElementById("associateSectionWorkbench");
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function focusMembersWorkbench() {
  const target = document.getElementById("memberSectionWorkbench");
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function focusCoursesWorkbench() {
  const target = document.getElementById("courseSectionWorkbench");
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function focusElementById(targetId) {
  if (!targetId) {
    return;
  }

  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function focusCoursesCatalog() {
  const target = document.getElementById("courseSectionCatalog");
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function focusCourseDetails() {
  const target = document.getElementById("courseSectionDetails");
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function focusCourseEnrollment() {
  const target = document.getElementById("courseEnrollmentPanel") || document.getElementById("courseSectionDetails");
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function focusCourseDetailsSection(mode) {
  const targetId = ({
    overview: "courseDetailModeOverview",
    sessions: "courseDetailModeSessions",
    resources: "courseDetailModeResources",
    certificate: "courseDetailModeCertificate",
    status: "courseDetailModeStatus"
  })[mode] || "courseDetailModeOverview";
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function focusLearnerWorkspaceSection(mode) {
  const targetId = ({
    roadmap: "learnerCourseModeRoadmap",
    sessions: "learnerCourseModeSessions",
    resources: "learnerCourseModeResources",
    certificate: "learnerCourseModeCertificate",
    feedback: "learnerCourseModeFeedback"
  })[mode] || "learnerCourseModeRoadmap";
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showToast(message, type = "success") {
  if (!message) {
    return;
  }

  toastMessage = message;
  toastType = type;
  render();
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  toastTimer = setTimeout(() => {
    toastMessage = "";
    render();
  }, 2600);
}

function renderSidePanel() {
  if (!hasLoaded) {
    sidePanel.innerHTML = `<div class="empty-state">Preparando panel...</div>`;
    return;
  }

  if (!session) {
    sidePanel.innerHTML = `<div class="empty-state">El panel se activara al iniciar sesion.</div>`;
    return;
  }

  const selectedCourse = getSelectedCourse();
  const selectedMember = findMember(state.selectedMemberId);
  if (state.activeView === "test") {
    sidePanel.className = "panel panel-side";
    sidePanel.innerHTML = `
      <div class="stack gap-md">
        <p class="eyebrow">Entrenamiento</p>
        <h3>Vista Test</h3>
        <p class="muted">Practica una pregunta cada vez, con cronometro, correccion inmediata y puntuacion en directo.</p>
        <div class="chip-row">
          <button class="ghost-button" type="button" data-action="nav" data-view="overview">Volver al panel</button>
          <button class="ghost-button" type="button" data-action="nav" data-view="campus">Ir al campus</button>
        </div>
      </div>
    `;
    return;
  }

  const sideViews = {
    overview: () =>
      isAdminView()
        ? renderTimeline(selectedCourse)
        : renderMemberTimeline(getPrimaryMemberCourse(state.selectedMemberId) || selectedCourse),
    join: renderJoinSide,
    associates: renderAssociatesSide,
    members: () => renderSelectedMember(selectedMember),
    campus: renderCampusSide,
    courses: () => renderSelectedCourse(selectedCourse),
    operations: () => renderOperationsSummary(selectedCourse),
    diplomas: () => renderDiplomaPreview(selectedCourse),
    validations: renderValidationsSide,
    reports: renderReportsSide,
    activity: renderActivitySide,
    automation: renderSettings
  };
  sidePanel.className = `panel panel-side ${["associates", "campus"].includes(state.activeView) ? "panel-side-sticky" : ""}`;
  sidePanel.innerHTML = sideViews[state.activeView]();
}

function renderOverview() {
  if (!isAdminView()) {
    return renderMemberOverview();
  }

  const recentCourses = state.courses.slice(0, 3);
  const selectedMember = findMember(state.selectedMemberId);
  const currentYear = String(new Date().getFullYear());
  const pendingAssociateApplications = state.associateApplications.filter((item) =>
    isAssociateApplicationPending(item)
  );
  const pendingPaymentSubmissions = state.associatePaymentSubmissions.filter(
    (item) => item.status === "Pendiente de revision"
  );
  const pendingProfileRequests = state.associateProfileRequests.filter(
    (item) => item.status === "Pendiente de revision"
  );
  const pendingQuotaAssociates = state.associates
    .filter((item) => getAssociateQuotaGap(item) > 0)
    .sort((a, b) => getAssociateQuotaGap(b) - getAssociateQuotaGap(a))
    .slice(0, 5);
  const pendingWelcomeAssociates = state.associates
    .filter((item) => item.linkedAccountId && item.welcomeEmailStatus !== "sent")
    .slice(0, 5);
  const pendingLegacyReviewAssociates = state.associates
    .filter(
      (item) =>
        item.status === "Revisar documentacion" &&
        /Importado desde Excel legacy/i.test(String(item.observations || ""))
    )
    .slice(0, 5);
  const closableCourses = state.courses
    .filter((course) => course.status === "Cierre pendiente")
    .slice(0, 5);
  const pendingDiplomaCourses = state.courses
    .filter((course) => getCoursePendingDiplomaDeliveries(course) > 0)
    .slice(0, 5);
  const storageSeemsEmpty = !isDemoSession() && (state.associates?.length || 0) === 0 && (state.courses?.length || 0) === 0;
  const nextAgentItem = pickNextAgentItem();
  const recentActivity = [...state.activityLog]
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, 5);
  const startSummary = nextAgentItem?.detail
    ? nextAgentItem.detail
    : pendingAssociateApplications.length
      ? "Empieza por las altas de socio pendientes."
      : pendingProfileRequests.length
        ? "Revisa los cambios de ficha que han enviado los socios."
        : pendingPaymentSubmissions.length
          ? "Valida justificantes y cuotas antes de seguir."
          : closableCourses.length
            ? "Hay cursos listos para cerrar y emitir diplomas."
            : "No hay bloqueos fuertes ahora mismo. Puedes revisar cursos, socios o actividad reciente.";

  return `
    <div class="panel-stack">
      <div class="panel-header associate-anchor" id="overviewSectionDashboard">
        <div>
          <p class="eyebrow">Panel de administracion</p>
          <h3>Empieza por aqui</h3>
          ${
            selectedMember
              ? `<p class="muted">Trabajando con la ficha de ${selectedMember.name}.</p>`
              : `<p class="muted">${escapeHtml(startSummary)}</p>`
          }
        </div>
        <div class="chip-row">
          <button class="primary-button" data-action="nav" data-view="associates">Socios y cuotas</button>
          <button class="ghost-button" data-action="nav" data-view="courses">Campus</button>
          <button class="ghost-button" data-action="nav" data-view="reports">Informes</button>
        </div>
      </div>

      <div class="status-note info associate-anchor" id="overviewSectionAttention">
        Altas pendientes: ${pendingAssociateApplications.length}. Cambios de ficha: ${pendingProfileRequests.length}. Justificantes: ${pendingPaymentSubmissions.length}. Cursos por cerrar: ${closableCourses.length}. Diplomas pendientes: ${pendingDiplomaCourses.length}.
      </div>

      <div class="status-note ${storageMeta && (state.associates?.length || 0) > 0 ? "success" : "warning"} associate-anchor" id="overviewSectionStorageStatus">
        <strong>Almacenamiento activo:</strong>
        ${
          storageMeta
            ? ` Base ${escapeHtml(storageMeta.dbPath)} | Snapshot ${escapeHtml(storageMeta.snapshotPath)} | Actualizado ${storageMeta.updatedAt ? escapeHtml(formatDateTime(storageMeta.updatedAt)) : "sin fecha"} | Socios ${state.associates?.length || 0} | Cursos ${state.courses?.length || 0}.`
            : " No se ha podido leer la ruta del almacenamiento de este servicio."
        }
      </div>

      ${
        storageSeemsEmpty
          ? `
      <div class="status-note danger associate-anchor" id="overviewSectionStorageMismatch">
        <strong>Atencion:</strong> este despliegue ahora mismo esta vacio o leyendo otro almacenamiento. Tus datos locales no tienen por que haberse perdido.
        Revisa <strong>Informes y validacion > Almacenamiento</strong>, descarga una copia del estado actual y, si hace falta, vuelve a importar el
        <strong>state.json</strong> real del campus en esta web.
      </div>
      `
          : ""
      }

      <div class="course-grid overview-admin-main">
        <div class="mail-card compact-panel">
          <div class="panel-header">
            <div>
              <h4>Atencion de hoy</h4>
              <p class="muted">Lo primero que conviene resolver para que el campus siga fluyendo.</p>
            </div>
            ${
              nextAgentItem
                ? `<button class="primary-button" data-action="agent-resolve-next">Resolver siguiente</button>`
                : `<span class="small-chip">Sin tarea automatica prioritaria</span>`
            }
          </div>
          <div class="stack compact-list">
            <div class="timeline-item compact-card">
              <span class="eyebrow">Siguiente tarea</span>
              <strong>${escapeHtml(nextAgentItem?.title || "Sin prioridades bloqueantes")}</strong>
              <p>${escapeHtml(startSummary)}</p>
            </div>
            <div class="timeline-item compact-card">
              <span class="eyebrow">Bienvenidas pendientes</span>
              <strong>${pendingWelcomeAssociates.length}</strong>
              <p>${pendingWelcomeAssociates.length ? `${escapeHtml(getAssociateFullName(pendingWelcomeAssociates[0]))} y ${Math.max(pendingWelcomeAssociates.length - 1, 0)} mas` : "Todos los accesos con bienvenida al dia."}</p>
            </div>
            <div class="timeline-item compact-card">
              <span class="eyebrow">Cursos por cerrar</span>
              <strong>${closableCourses.length}</strong>
              <p>${closableCourses.length ? `${escapeHtml(closableCourses[0].title)} y ${Math.max(closableCourses.length - 1, 0)} mas` : "No hay cierres pendientes."}</p>
            </div>
          </div>
        </div>

        <div class="mail-card compact-panel associate-anchor" id="overviewSectionAssociates">
          <div class="panel-header">
            <div>
              <h4>Socios que requieren seguimiento</h4>
              <p class="muted">Pendientes por cuota, bienvenida o revision de socios legacy.</p>
            </div>
            <div class="chip-row">
              <button class="mini-button" data-action="nav" data-view="associates">Abrir modulo</button>
              <button class="mini-button" data-action="set-associate-filter-preset" data-preset="incidents">Solo incidencias</button>
            </div>
          </div>
          ${
            pendingQuotaAssociates.length || pendingWelcomeAssociates.length || pendingLegacyReviewAssociates.length
              ? [
                  ...pendingQuotaAssociates.map(
                    (associate) => `
                      <div class="timeline-item compact-card">
                        <strong>${escapeHtml(getAssociateFullName(associate))}</strong>
                        <p>Socio #${associate.associateNumber} | ${escapeHtml(associate.service || "-")}</p>
                        <p class="muted">Pendiente ${formatCurrency(getAssociateQuotaGap(associate))} del ${currentYear} | Estado ${escapeHtml(associate.status)}</p>
                      </div>
                    `
                  ),
                  ...pendingLegacyReviewAssociates
                    .filter(
                      (associate) =>
                        !pendingQuotaAssociates.some((item) => item.id === associate.id) &&
                        !pendingWelcomeAssociates.some((item) => item.id === associate.id)
                    )
                    .slice(0, 3)
                    .map(
                      (associate) => `
                        <div class="timeline-item compact-card">
                          <strong>${escapeHtml(getAssociateFullName(associate))}</strong>
                          <p>Socio #${associate.associateNumber} | ${escapeHtml(associate.service || "Sin servicio")}</p>
                          <p class="muted">Revision legacy abierta | Campus ${escapeHtml(associate.campusAccessStatus || "sin acceso")}</p>
                        </div>
                      `
                    ),
                  ...pendingWelcomeAssociates
                    .filter(
                      (associate) =>
                        !pendingQuotaAssociates.some((item) => item.id === associate.id) &&
                        !pendingLegacyReviewAssociates.some((item) => item.id === associate.id)
                    )
                    .slice(0, 3)
                    .map(
                      (associate) => `
                        <div class="timeline-item compact-card">
                          <strong>${escapeHtml(getAssociateFullName(associate))}</strong>
                          <p>Socio #${associate.associateNumber} | ${escapeHtml(associate.email)}</p>
                          <p class="muted">Bienvenida ${escapeHtml(associate.welcomeEmailStatus || "pending")} | Acceso ${escapeHtml(associate.campusAccessStatus || "pending")}</p>
                        </div>
                      `
                    )
                ].join("")
              : `<p class="muted">No hay socios con incidencias prioritarias ahora mismo.</p>`
          }
        </div>
      </div>

      <div class="course-grid overview-admin-main">
        <div class="mail-card compact-panel associate-anchor" id="overviewSectionCourses">
          <div class="panel-header">
            <div>
              <h4>Cursos que mover hoy</h4>
              <p class="muted">Cierres, diplomas e inscripciones que conviene revisar.</p>
            </div>
            <button class="mini-button" data-action="nav" data-view="courses">Ir a cursos</button>
          </div>
          ${
            closableCourses.length || pendingDiplomaCourses.length
              ? [
                  ...closableCourses.map(
                    (course) => `
                      <div class="timeline-item compact-card">
                        <strong>${escapeHtml(course.title)}</strong>
                        <p>${escapeHtml(describeCourseType(course))} | ${formatDate(course.endDate)}</p>
                        <p class="muted">Cierre pendiente con ${getCourseEnrolledCount(course)} inscrito(s).</p>
                      </div>
                    `
                  ),
                  ...pendingDiplomaCourses
                    .filter((course) => !closableCourses.some((item) => item.id === course.id))
                    .slice(0, 3)
                    .map(
                      (course) => `
                        <div class="timeline-item compact-card">
                          <strong>${escapeHtml(course.title)}</strong>
                          <p>${escapeHtml(describeCourseType(course))} | ${course.hours} h</p>
                          <p class="muted">${getCoursePendingDiplomaDeliveries(course)} diploma(s) pendientes de enviar.</p>
                        </div>
                      `
                    )
                ].join("")
              : `<p class="muted">Cursos al dia: no hay cierres ni envios urgentes.</p>`
          }
        </div>

        <div class="mail-card compact-panel associate-anchor" id="overviewSectionActivity">
        <div class="panel-header">
          <div>
            <h4>Atencion hoy</h4>
            <p class="muted">Ultimos movimientos del campus para entender que ha pasado.</p>
          </div>
          <button class="mini-button" data-action="nav" data-view="activity">Abrir auditoria</button>
        </div>
        ${
          recentActivity.length
            ? recentActivity
                .map(
                  (item) => `
                    <div class="timeline-item compact-card">
                      <strong>${escapeHtml(item.actor)}</strong>
                      <p>${escapeHtml(item.message)}</p>
                      <p class="muted">${escapeHtml(item.type)} | ${formatDateTime(item.at)}</p>
                    </div>
                  `
                )
                .join("")
            : `<p class="muted">Todavia no hay actividad registrada en el campus.</p>`
        }
        </div>

        <div class="mail-card compact-panel associate-anchor" id="overviewSectionGuide">
          <div class="panel-header">
            <div>
              <h4>Guia rapida de administracion</h4>
              <p class="muted">Los pasos clave para gestionar socios, cursos y diplomas sin perderte.</p>
            </div>
          </div>
          <div class="compact-list">
            <div class="timeline-item compact-card">
              <strong>1. Importa o revisa socios</strong>
              <p class="muted">Socios y cuotas → Migracion. Analiza el Excel y pulsa Importar socios validos.</p>
            </div>
            <div class="timeline-item compact-card">
              <strong>2. Crea o limpia cursos</strong>
              <p class="muted">Campus → Crear y abrir estudio. Define fechas, plazas y responsable.</p>
            </div>
            <div class="timeline-item compact-card">
              <strong>3. Publica inscripciones</strong>
              <p class="muted">Campus → Curso activo → Abrir inscripcion cuando todo este listo.</p>
            </div>
            <div class="timeline-item compact-card">
              <strong>4. Cierra y emite diplomas</strong>
              <p class="muted">Operativa → Asistencia, aptos y diplomas → Generar y enviar.</p>
            </div>
            <div class="timeline-item compact-card">
              <strong>5. Comunica y exporta</strong>
              <p class="muted">Avisos manuales y reportes CSV para enviar a socios activos.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderMemberOverview() {
  const member = getCurrentMember();
  const associate = getCurrentAssociate();
  const ownCourses = state.courses.filter(
    (course) => course.enrolledIds.includes(member?.id) || course.waitingIds.includes(member?.id)
  );
  const primaryCourse = getPrimaryMemberCourse(member?.id);
  const history = member ? getMemberHistory(member.id) : [];
  const payments = getAssociatePayments(associate);
  const visibleManualNotices = member ? getVisibleManualCampusNotices(member.id, ownCourses) : [];
  const featuredNotice = visibleManualNotices[0] || null;

  return `
    <div class="panel-stack">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Tu area personal</p>
          <h3>Resumen de campus y socio</h3>
          <p class="muted">Aqui solo ves tu informacion operativa y administrativa basica.</p>
        </div>
        <div class="chip-row">
          <button class="primary-button" type="button" data-action="nav" data-view="join">Mi ficha de socio</button>
          <button class="ghost-button" type="button" data-action="open-member-campus-mode" data-mode="courses">Ver cursos</button>
          <button class="ghost-button" type="button" data-action="open-member-campus-mode" data-mode="diplomas">Ver diplomas</button>
        </div>
      </div>

      <div class="status-note info">
        ${escapeHtml(member?.name || "Sin ficha vinculada")} | ${escapeHtml(member?.email || "-")} | Estado socio ${
          escapeHtml(associate?.status || "Sin ficha de socio")
        } | Socio #${escapeHtml(associate?.associateNumber || "-")} | Cuota ${new Date().getFullYear()}: ${
          associate ? `${formatCurrency(getAssociateCurrentYearFee(associate))} / ${formatCurrency(associate.annualAmount || 0)}` : "-"
        }.
      </div>

      ${
        featuredNotice
          ? `
            <div class="status-note ${featuredNotice.tone === "warning" ? "warning" : featuredNotice.tone === "success" ? "success" : "info"}">
              <strong>${escapeHtml(featuredNotice.title)}</strong>: ${escapeHtml(featuredNotice.detail)}
              ${
                featuredNotice.courseId
                  ? ` <button class="mini-button" type="button" data-action="select-course" data-course-id="${featuredNotice.courseId}">${escapeHtml(featuredNotice.actionLabel || "Abrir curso")}</button>`
                  : ` <button class="mini-button" type="button" data-action="open-member-campus-mode" data-mode="alerts">Ver avisos</button>`
              }
            </div>
          `
          : ""
      }

      ${member ? renderMemberAlerts(member.id) : ""}

      ${
        primaryCourse && member
          ? `
            <div class="mail-card">
              <h4>Tu siguiente paso en el campus</h4>
              ${renderLearnerJourneyCard(primaryCourse, member.id)}
            </div>
          `
          : ""
      }

      <div class="mail-card">
        <h4>Tus cursos y progreso</h4>
        ${
          ownCourses.length
            ? ownCourses
                .map((course) => {
                  const progress = getLearnerCourseContentStats(course, member?.id);
                  return `
                    <div class="timeline-item">
                      <strong>${escapeHtml(course.title)}</strong>
                      <p>${escapeHtml(describeCourseType(course))} | ${formatDate(course.startDate)} - ${formatDate(course.endDate)}</p>
                      <p class="muted">${
                        course.enrolledIds.includes(member?.id)
                          ? "Inscrito"
                          : "En lista de espera"
                      }</p>
                      <p class="muted">Contenido ${progress.blockProgress}% | ${progress.blocksCompleted}/${progress.blocksTotal} bloque(s) completados | ${progress.lessonsCompleted}/${progress.lessonsTotal} leccion(es)</p>
                      <div class="progress"><span style="width:${progress.blockProgress}%"></span></div>
                      <p class="muted">${progress.updatedAt ? `Actualizado ${formatDateTime(progress.updatedAt)}` : "Sin actividad de contenido todavia"}</p>
                    </div>
                  `;
                })
                .join("")
            : `<p class="muted">Todavia no estas inscrito en ninguna formacion.</p>`
        }
      </div>

      <div class="mail-card">
        <h4>Historial formativo</h4>
        ${renderMemberHistory(history)}
      </div>

      <div class="mail-card">
        <h4>Tu historial de cuotas</h4>
        ${
          payments.length
            ? payments
                .slice(0, 8)
                .map(
                  (payment) => `
                    <div class="timeline-item">
                      <strong>${formatCurrency(payment.amount)} | ${escapeHtml(payment.method)}</strong>
                      <p>${escapeHtml(payment.year)} | ${escapeHtml(formatDate(payment.date))}</p>
                      <p class="muted">${escapeHtml(payment.note || "Movimiento registrado")}</p>
                    </div>
                  `
                )
                .join("")
            : `<p class="muted">Todavia no hay pagos registrados en tu ficha.</p>`
        }
      </div>
    </div>
  `;
}

function renderJoinView() {
  if (!isAdminView()) {
    const associate = getCurrentAssociate();
    const member = getCurrentMember();
    if (!associate) {
      return `
        <div class="panel-stack">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Hazte socio</p>
              <h3>Tu acceso actual es solo campus</h3>
              <p class="muted">Puedes inscribirte en cursos abiertos al publico general, pero la ficha de socio, las cuotas y el conocimiento interno solo se activan cuando formes parte de la asociacion.</p>
            </div>
          </div>

          <div class="course-grid">
            <div class="mail-card">
              <h4>Tu acceso actual</h4>
              <p class="muted"><strong>Participante:</strong> ${escapeHtml(member?.name || session?.name || "Sin nombre")}</p>
              <p class="muted"><strong>Email:</strong> ${escapeHtml(member?.email || session?.email || "-")}</p>
              <p class="muted"><strong>Tipo:</strong> Acceso solo campus para cursos abiertos.</p>
            </div>
            <div class="mail-card">
              <h4>Que ganas al hacerte socio</h4>
              <p class="muted">Alta en la asociacion, ficha propia, seguimiento de cuotas, acceso al portal del socio, campus completo y grupos internos de trabajo.</p>
              <div class="chip-row">
                <a class="primary-button button-link" href="/join.html">Hazte socio</a>
                <button class="ghost-button" type="button" data-action="set-campus-section-mode" data-mode="courses">Ver cursos abiertos</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    const snapshot = getAssociatePortalSnapshot(associate, member);
    const payments = getAssociatePayments(associate);
    const feeHistory = getAssociateFeeHistoryRows(associate);
    const submissions = getAssociatePaymentSubmissionsForCurrentAssociate();
    const profileRequests = getAssociateProfileRequestsForCurrentAssociate();
    const reviewIssues = getAssociateLegacyReviewIssues(associate);
    const currentYear = String(new Date().getFullYear());
    const quotaGap = associate ? getAssociateQuotaGap(associate) : 0;
    const previewOnly = isMemberPreviewSession();
    const activeModuleLessons = activeModule?.lessons || [];
    const activeLessonIndex = Math.max(0, activeModuleLessons.findIndex((lesson) => lesson.id === activeLessonId));
    const activeLesson = activeModuleLessons[activeLessonIndex] || activeModuleLessons[0] || null;
    const nextLesson = activeModuleLessons[activeLessonIndex + 1] || null;
    const activeLessonMarkup = activeLesson
      ? (() => {
          const lessonBlocks = activeLesson.blocks || [];
          const firstPendingBlock = lessonBlocks.find((block) => !entry.blockIds.includes(block.id)) || null;
          return `
            <div class="lesson-roadmap-item lesson-roadmap-item-active">
              <div class="row-between">
                <strong>${escapeHtml(activeLesson.title || "Leccion")}</strong>
                <div class="chip-row">
                  <span class="small-chip">${escapeHtml(activeLesson.type || "Practica")}</span>
                  <span class="small-chip">ahora</span>
                  ${entry.lessonIds.includes(activeLesson.id) ? `<span class="small-chip">completada</span>` : ""}
                </div>
              </div>
              <p class="muted">${escapeHtml(activeLesson.duration ? `${activeLesson.duration} h` : "Duracion pendiente")} | ${escapeHtml(activeLesson.resource || "Recurso pendiente")}</p>
              <p class="muted">${escapeHtml(activeLesson.body || "Contenido pendiente de desarrollar")}</p>
              <p class="muted"><strong>Actividad:</strong> ${escapeHtml(activeLesson.activity || "Pendiente")}</p>
              <p class="muted"><strong>Aprendizaje:</strong> ${escapeHtml(activeLesson.takeaway || "Pendiente")}</p>
              <p class="muted"><strong>Indicaciones:</strong> ${escapeHtml(activeLesson.instructions || "Indicaciones pendientes")}</p>
              ${
                interactive
                  ? `
                    <div class="chip-row">
                      <button class="${entry.lessonIds.includes(activeLesson.id) ? "ghost-button" : "mini-button"}" data-action="toggle-lesson-complete" data-course-id="${course.id}" data-member-id="${memberId}" data-lesson-id="${activeLesson.id}">
                        ${entry.lessonIds.includes(activeLesson.id) ? "Marcar pendiente" : "Marcar completa"}
                      </button>
                    </div>
                  `
                  : previewOnly
                    ? `<p class="muted">Vista previa de progreso: sin cambios reales.</p>`
                    : ""
              }
              ${
                lessonBlocks.length
                  ? `
                    <div class="block-preview-list">
                      ${lessonBlocks
                        .map((block) => {
                          const blockDone = entry.blockIds.includes(block.id);
                          const isLockedBlock = firstPendingBlock && !blockDone && block.id !== firstPendingBlock.id;
                          return `
                            <div class="block-preview-item">
                              <div class="row-between">
                                <strong>${escapeHtml(block.title || "Bloque")}</strong>
                                <div class="chip-row">
                                  <span class="small-chip">${escapeHtml(block.type || "document")}</span>
                                  ${block.required ? `<span class="small-chip">obligatorio</span>` : ""}
                                  ${blockDone ? `<span class="small-chip">hecho</span>` : ""}
                                  ${isLockedBlock ? `<span class="small-chip">despues</span>` : ""}
                                </div>
                              </div>
                              <div class="chip-row">
                                ${
                                  interactive && !isLockedBlock
                                    ? `<button class="${blockDone ? "ghost-button" : "mini-button"}" data-action="toggle-block-complete" data-course-id="${course.id}" data-member-id="${memberId}" data-lesson-id="${activeLesson.id}" data-block-id="${block.id}">
                                        ${blockDone ? "Pendiente" : "Completar bloque"}
                                      </button>`
                                    : ""
                                }
                              </div>
                              ${
                                isLockedBlock
                                  ? `<p class="muted learner-lock-copy">Completa antes ${escapeHtml(firstPendingBlock?.title || "el bloque actual")} para abrir este contenido.</p>`
                                  : `
                                      <p class="muted">${escapeHtml(block.content || "Sin contenido")}</p>
                                      ${block.url ? `<p class="muted">${escapeHtml(block.url)}</p>` : ""}
                                      ${renderLessonBlockPreview(block, {
                                        course,
                                        memberId,
                                        lessonId: activeLesson.id,
                                        interactive,
                                        previewOnly
                                      })}
                                    `
                              }
                            </div>
                          `;
                        })
                        .join("")}
                    </div>
                  `
                  : ""
              }
              ${
                activeLesson.assetLabel || activeLesson.assetUrl
                  ? `<p class="muted"><strong>Recurso:</strong> ${escapeHtml(activeLesson.assetLabel || "Archivo")}${activeLesson.assetUrl ? ` - ${escapeHtml(activeLesson.assetUrl)}` : ""}</p>`
                  : ""
              }
            </div>
          `;
        })()
      : `<p class="muted">Modulo sin lecciones todavia.</p>`;
    const nextLessonMarkup = nextLesson
      ? `
          <div class="lesson-roadmap-item lesson-roadmap-upnext">
            <div class="row-between">
              <strong>Despues vendra</strong>
              <span class="small-chip">${escapeHtml(nextLesson.type || "Leccion")}</span>
            </div>
            <p class="muted"><strong>${escapeHtml(nextLesson.title || "Siguiente leccion")}</strong></p>
            <p class="muted">Se abrira cuando marques como completa la leccion actual.</p>
          </div>
        `
      : "";

    return `
      <div class="panel-stack">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Estado de socio</p>
            <h3>Tu acceso nace desde la ficha de socio</h3>
            <p class="muted">El alta, las cuotas y el acceso al campus quedan vinculados en un unico proceso.</p>
          </div>
        </div>

      <div class="status-note info">
          Estado ${escapeHtml(snapshot.status)} · ${escapeHtml(snapshot.associateNumber)} · ${
            profileRequests.filter((item) => item.status === "Pendiente de revision").length
          } cambio(s) pendiente(s) · ${
            quotaGap > 0 ? `Cuota pendiente ${formatCurrency(quotaGap)}` : `${submissions.length} justificante(s) enviados`
          }.
        </div>

        <div class="chip-row member-quick-links">
          <button class="ghost-button" type="button" data-action="nav" data-view="join" data-anchor="joinSectionProfileStatus">Resumen</button>
          <button class="ghost-button" type="button" data-action="nav" data-view="join" data-anchor="joinSectionProfileEditor">Datos y cambios</button>
          <button class="ghost-button" type="button" data-action="nav" data-view="join" data-anchor="joinSectionPaymentProof">Cuota y justificante</button>
          <button class="ghost-button" type="button" data-action="open-member-campus-mode" data-mode="courses">Mis cursos</button>
          <button class="ghost-button" type="button" data-action="open-member-campus-mode" data-mode="diplomas">Mis diplomas</button>
        </div>

        <div class="course-grid associate-anchor" id="joinSectionProfileStatus">
          <div class="mail-card">
            <h4>Estado de tu ficha</h4>
            <p class="muted"><strong>Situacion:</strong> ${escapeHtml(snapshot.status)}</p>
            <p class="muted"><strong>Cuota ${currentYear}:</strong> ${associate ? `${formatCurrency(getAssociateCurrentYearFee(associate))} / ${formatCurrency(associate.annualAmount || 0)}` : "-"}</p>
            <p class="muted"><strong>Campus:</strong> ${escapeHtml(snapshot.campusAccessStatus)}</p>
            ${
              reviewIssues.length
                ? `<p class="muted"><strong>Falta revisar:</strong> ${escapeHtml(reviewIssues.join(" | "))}</p>`
                : `<p class="muted">Tu ficha no tiene incidencias documentales abiertas.</p>`
            }
            ${
              quotaGap > 0
                ? `<p class="muted"><strong>Pendiente de cuota:</strong> ${formatCurrency(quotaGap)}</p>`
                : `<p class="muted">Tu cuota actual esta al dia.</p>`
            }
          </div>
          <div class="mail-card">
            <h4>Siguiente paso</h4>
            ${
              reviewIssues.length
                ? `<p class="muted">Tu alta sigue en revision. Lo mas util ahora es enviar un cambio de ficha con los datos que faltan y, si procede, adjuntar justificante de cuota.</p>`
                : quotaGap > 0
                  ? `<p class="muted">Tu ficha esta bien, pero todavia queda cuota pendiente. Puedes enviar el justificante desde aqui mismo.</p>`
                  : `<p class="muted">Tu ficha de socio esta operativa. Desde aqui puedes mantener datos y justificantes al dia.</p>`
            }
          </div>
        </div>

        <div class="table-card">
          <table>
            <tbody>
              <tr><td>Estado</td><td>${escapeHtml(snapshot.status)}</td></tr>
              <tr><td>Numero de socio</td><td>${escapeHtml(snapshot.associateNumber)}</td></tr>
              <tr><td>Nombre</td><td>${escapeHtml(snapshot.name)}</td></tr>
              <tr><td>DNI/NIE</td><td>${escapeHtml(snapshot.dni || "-")}</td></tr>
              <tr><td>Telefono</td><td>${escapeHtml(snapshot.phone || "-")}</td></tr>
              <tr><td>Email</td><td>${escapeHtml(snapshot.email || "-")}</td></tr>
              <tr><td>Servicio</td><td>${escapeHtml(snapshot.service || "-")}</td></tr>
              <tr><td>Campus</td><td>${escapeHtml(snapshot.campusAccessStatus)}</td></tr>
              <tr><td>Bienvenida</td><td>${escapeHtml(snapshot.welcomeStatus)}</td></tr>
            </tbody>
          </table>
        </div>

        <div class="mail-card associate-anchor" id="joinSectionProfileEditor">
          <h4>Solicitar cambio de ficha</h4>
          <p class="muted">Puedes proponer cambios de DNI/NIE, telefono, email, servicio o nombre. Administracion los revisa antes de aplicarlos en tu ficha oficial.</p>
          ${
            previewOnly
              ? `
                <div class="status-note warning">
                  Estas en <strong>vista previa de alumno</strong>. Por eso el formulario esta bloqueado y no puedes escribir aqui.
                  Si quieres editar de verdad tu DNI/NIE o telefono, cambia a <strong>Mi perfil socio</strong>.
                </div>
                <p><button class="ghost-button" type="button" data-action="switch-to-member-self">Cambiar a Mi perfil socio</button></p>
              `
              : `<div class="status-note info">No puedes cambiar directamente numero de socio, rol, estado ni cuotas. Esos datos los valida administracion.</div>`
          }
          <form id="associateProfileRequestForm" class="stack">
            <fieldset ${previewOnly ? "disabled" : ""}>
            <label class="inline-field">
              Nombre
              <input id="associateProfileFirstName" value="${escapeHtml(snapshot.firstName)}" />
            </label>
            <label class="inline-field">
              Apellidos
              <input id="associateProfileLastName" value="${escapeHtml(snapshot.lastName)}" />
            </label>
            <label class="inline-field">
              DNI/NIE
              <input id="associateProfileDni" value="${escapeHtml(snapshot.dni)}" />
            </label>
            <label class="inline-field">
              Telefono
              <input id="associateProfilePhone" value="${escapeHtml(snapshot.phone)}" />
            </label>
            <label class="inline-field">
              Email
              <input id="associateProfileEmail" type="email" value="${escapeHtml(snapshot.email)}" />
            </label>
            <label class="inline-field">
              Servicio
              <input id="associateProfileService" value="${escapeHtml(snapshot.service)}" />
            </label>
            <label class="inline-field">
              Nota
              <textarea id="associateProfileNote" placeholder="Explica brevemente que hay que corregir o actualizar"></textarea>
            </label>
            <button class="primary-button" type="submit">Enviar solicitud de cambio</button>
            </fieldset>
          </form>
        </div>

        <div class="mail-card">
          <h4>Ultimos pagos registrados</h4>
          ${
            payments.length
              ? payments
                  .slice(0, 5)
                  .map(
                    (payment) => `
                      <div class="timeline-item">
                        <strong>${formatCurrency(payment.amount)} | ${escapeHtml(payment.method)}</strong>
                        <p>${escapeHtml(payment.year)} | ${escapeHtml(formatDate(payment.date))}</p>
                        <p class="muted">${escapeHtml(payment.note || "Sin detalle adicional")}</p>
                      </div>
                    `
                  )
                  .join("")
              : `<p class="muted">Todavia no hay movimientos de cuota registrados.</p>`
          }
        </div>

        <div class="mail-card">
          <h4>Cuotas registradas por anio</h4>
          ${
            feeHistory.length
              ? `
                  <div class="table-card">
                    <table>
                      <tbody>
                        ${feeHistory
                          .map(
                            (row) => `
                              <tr>
                                <td>${escapeHtml(row.year)}</td>
                                <td>${formatCurrency(row.amount)}</td>
                                <td>${formatCurrency(row.annualAmount)}</td>
                                <td>${row.amount >= row.annualAmount && row.annualAmount > 0 ? "Pagada" : row.amount > 0 ? "Parcial" : "Pendiente"}</td>
                              </tr>
                            `
                          )
                          .join("")}
                      </tbody>
                    </table>
                  </div>
                `
              : `<p class="muted">Todavia no hay cuotas heredadas o registradas por anio en tu ficha.</p>`
          }
        </div>

        <div class="mail-card associate-anchor" id="joinSectionPaymentProof">
          <h4>Enviar justificante de cuota</h4>
          ${previewOnly ? `<p class="muted">Vista previa de alumno: este formulario esta bloqueado para evitar envios reales desde administracion.</p>` : ""}
          <form id="associatePaymentSubmissionForm" class="stack">
            <fieldset ${previewOnly ? "disabled" : ""}>
            <label class="inline-field">
              Anio
              <input id="associatePaymentSubmissionYear" type="number" min="2024" value="${new Date().getFullYear()}" />
            </label>
            <label class="inline-field">
              Importe
              <input id="associatePaymentSubmissionAmount" type="number" min="1" step="1" placeholder="50" />
            </label>
            <label class="inline-field">
              Metodo
              <select id="associatePaymentSubmissionMethod">
                ${["Transferencia", "Bizum", "Efectivo", "TPV", "Otro"].map((method) => `<option value="${method}">${method}</option>`).join("")}
              </select>
            </label>
            <label class="inline-field">
              Nota
              <input id="associatePaymentSubmissionNote" placeholder="Ej. cuota anual, segundo pago, regularizacion..." />
            </label>
            <label class="inline-field">
              Justificante
              <input id="associatePaymentProof" type="file" accept=".pdf,image/*" />
            </label>
            <button class="primary-button" type="submit">Enviar a revision</button>
            </fieldset>
          </form>
        </div>

        <div class="mail-card">
          <h4>Justificantes enviados</h4>
          ${
            submissions.length
              ? submissions
                  .map(
                    (submission) => `
                      <div class="timeline-item">
                        <strong>${formatCurrency(submission.amount)} | ${escapeHtml(submission.method)}</strong>
                        <p>${escapeHtml(submission.year)} | ${escapeHtml(formatDateTime(submission.submittedAt))}</p>
                        <p class="muted">Estado: ${escapeHtml(submission.status)} | Aviso: ${escapeHtml(submission.notificationStatus || "pending")}</p>
                        ${submission.reviewNote ? `<p class="muted">${escapeHtml(submission.reviewNote)}</p>` : ""}
                      </div>
                    `
                  )
                  .join("")
              : `<p class="muted">Todavia no has enviado justificantes de cuota desde el portal.</p>`
          }
        </div>

        <div class="mail-card">
          <h4>Solicitudes de actualizacion</h4>
          ${
            profileRequests.length
              ? profileRequests
                  .map(
                    (request) => `
                      <div class="timeline-item">
                        <strong>${escapeHtml(request.firstName)} ${escapeHtml(request.lastName)}</strong>
                          <p>${escapeHtml(request.dni || "-")} | ${escapeHtml(request.email)} | ${escapeHtml(request.phone)} | ${escapeHtml(request.service)}</p>
                        <p class="muted">Estado: ${escapeHtml(request.status)} | Aviso: ${escapeHtml(request.notificationStatus || "pending")}</p>
                        ${request.note ? `<p class="muted">${escapeHtml(request.note)}</p>` : ""}
                        ${request.reviewNote ? `<p class="muted">${escapeHtml(request.reviewNote)}</p>` : ""}
                      </div>
                    `
                  )
                  .join("")
              : `<p class="muted">Todavia no has pedido cambios sobre tu ficha de socio.</p>`
          }
        </div>
      </div>
    `;
  }

  return `
    <div class="panel-stack">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Alta de socios</p>
          <h3>Hazte socio de Isocrona Zero</h3>
          <p class="muted">
            Hemos dejado una entrada dedicada para que el alta no dependa ya de Google Forms ni de pasar datos a mano al Excel.
          </p>
        </div>
        <a class="primary-button" href="/join.html">Ir al formulario</a>
      </div>

      <div class="assistant-card">
        <h4>Que se registra en el alta</h4>
        <p>Nombre, apellidos, DNI, telefono, email, servicio, justificantes y seguimiento administrativo completo. Una vez aprobada la solicitud, desde aqui nace tambien el acceso al campus.</p>
      </div>

      <div class="course-grid">
        <div class="timeline-item">
          <span class="eyebrow">Paso 01</span>
          <strong>Solicitud web</strong>
          <p>La persona completa el formulario y adjunta justificantes.</p>
        </div>
        <div class="timeline-item">
          <span class="eyebrow">Paso 02</span>
          <strong>Revision interna</strong>
          <p>Administracion valida documentacion, pago y datos clave.</p>
        </div>
        <div class="timeline-item">
          <span class="eyebrow">Paso 03</span>
          <strong>Alta de socio y acceso</strong>
          <p>Se asigna numero de socio y se genera la identidad interna que da paso al campus y al resto de modulos.</p>
        </div>
        <div class="timeline-item">
          <span class="eyebrow">Paso 04</span>
          <strong>Gestion continua</strong>
          <p>La ficha queda integrada con cuotas, observaciones y trazabilidad.</p>
        </div>
      </div>

      <div class="mail-card">
        <h4>Accesos rapidos</h4>
        <div class="chip-row">
          <a class="primary-button" href="/join.html">Abrir formulario de alta</a>
          <button class="ghost-button" data-action="nav" data-view="associates">Ir a socios y cuotas</button>
          <a class="button-link" href="/api/reports/associate-applications.csv">Exportar solicitudes</a>
        </div>
      </div>
    </div>
  `;
}

function normalizeSearchValue(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesAssociateSearch(values, query) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) => normalizeSearchValue(value).includes(normalizedQuery));
}

function getAssociateQuickSearchMatches(query, limit = 8) {
  const associates = (state.associates || [])
    .slice()
    .sort((a, b) => {
      const numberA = Number(a.associateNumber || 0);
      const numberB = Number(b.associateNumber || 0);
      if (numberA && numberB && numberA !== numberB) {
        return numberA - numberB;
      }
      return getAssociateFullName(a).localeCompare(getAssociateFullName(b), "es", { sensitivity: "base" });
    });

  if (!String(query || "").trim()) {
    return associates.slice(0, limit);
  }

  return associates
    .filter((associate) =>
      matchesAssociateSearch(
        [
          associate.associateNumber,
          associate.firstName,
          associate.lastName,
          getAssociateFullName(associate),
          associate.email,
          associate.phone,
          associate.dni,
          associate.service,
          associate.status
        ],
        query
      )
    )
    .slice(0, limit);
}

function openAssociateFromSearch(query) {
  const normalizedQuery = String(query || associateFilters.query || "").trim();
  if (!normalizedQuery) {
    syncStatus = "Escribe un nombre, numero o dato antes de buscar un socio";
    showToast(syncStatus, "error");
    render();
    requestAnimationFrame(() => document.getElementById("associateSearchFilter")?.focus({ preventScroll: true }));
    return;
  }

  const firstMatch = getAssociateQuickSearchMatches(normalizedQuery, 1)[0];
  if (!firstMatch) {
    syncStatus = "No se ha encontrado ningun socio con esa busqueda";
    showToast(syncStatus, "error");
    render();
    requestAnimationFrame(() => document.getElementById("associateSearchFilter")?.focus({ preventScroll: true }));
    return;
  }

  state.selectedAssociateId = firstMatch.id;
  associatesSectionMode = "workbench";
  syncStatus = "Ficha de socio cargada desde el buscador";
  saveUiSnapshot();
  render();
  requestAnimationFrame(() => focusAssociatesWorkbench());
}

function matchesReviewFilter(status, review) {
  if (review === "all") {
    return true;
  }

  const isPending = ["pendiente de revision", "pendiente de documentacion"].includes(
    String(status || "").toLowerCase()
  );
  return review === "pending" ? isPending : !isPending;
}

function matchesAssociateReadinessFilter(application, readinessFilter) {
  if (readinessFilter === "all" || !isAssociateApplicationPending(application)) {
    return true;
  }

  const ready = getAssociateApplicationReadiness(application).ready;
  return readinessFilter === "ready" ? ready : !ready;
}

function matchesAssociateQuotaFilter(associate, quota) {
  if (quota === "all") {
    return true;
  }

  const hasPendingQuota = getAssociateQuotaGap(associate) > 0;
  return quota === "pending" ? hasPendingQuota : !hasPendingQuota;
}

function isLegacyImportedAssociate(associate) {
  return /Importado desde Excel legacy/i.test(String(associate?.observations || ""));
}

function matchesAssociateMigrationFilter(associate, migration) {
  if (migration === "all") {
    return true;
  }

  const isLegacy = isLegacyImportedAssociate(associate);
  if (migration === "legacy") {
    return isLegacy;
  }

  if (migration === "legacy-review") {
    return isLegacy && associate?.status === "Revisar documentacion";
  }

  return true;
}

const associateManagedPendingNotes = new Set([
  "sin telefono",
  "sin dni/nie",
  "sin servicio",
  "sin email",
  "email con formato dudoso"
]);

function getAssociateCurrentReviewIssues(associate) {
  const issues = [];
  if (!associate) {
    return issues;
  }

  if (!associate.phone) {
    issues.push("sin telefono");
  }
  if (!associate.dni) {
    issues.push("sin DNI/NIE");
  }
  if (!associate.service) {
    issues.push("sin servicio");
  }
  if (!associate.email) {
    issues.push("sin email");
  } else if (!isLikelyEmail(associate.email)) {
    issues.push("email con formato dudoso");
  }

  return issues;
}

function getAssociateObservationPendingExtras(associate) {
  const observationText = String(associate?.observations || "");
  const pendingMatch = observationText.match(/Pendientes:\s*([^|]+)/i);
  if (!pendingMatch?.[1]) {
    return [];
  }

  return pendingMatch[1]
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !associateManagedPendingNotes.has(String(item || "").trim().toLowerCase()));
}

function refreshAssociateLegacyObservationSummary(associate) {
  if (!associate) {
    return;
  }

  const baseParts = String(associate.observations || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !/^Pendientes:\s*/i.test(item));

  const nextPending = [
    ...getAssociateCurrentReviewIssues(associate),
    ...getAssociateObservationPendingExtras(associate)
  ];

  if (nextPending.length && isLegacyImportedAssociate(associate)) {
    baseParts.push(`Pendientes: ${[...new Set(nextPending)].join(", ")}`);
  }

  associate.observations = baseParts.join(" | ");
}

function getAssociateLegacyReviewIssues(associate) {
  return [
    ...getAssociateCurrentReviewIssues(associate),
    ...getAssociateObservationPendingExtras(associate)
  ];
}

function canCloseAssociateLegacyReview(associate) {
  if (!associate || /baja/i.test(String(associate.status || ""))) {
    return false;
  }

  return Boolean(
    String(associate.firstName || "").trim() &&
      String(associate.lastName || "").trim() &&
      String(associate.email || "").trim() &&
      isLikelyEmail(String(associate.email || "").trim()) &&
      String(associate.service || "").trim()
  );
}

function getAssociateFilterServices() {
  return [...new Set(
    [
      ...state.associates.map((item) => item.service),
      ...state.associateApplications.map((item) => item.service),
      ...state.associateProfileRequests.map((item) => item.service)
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "es"));
}

function resetAssociatePages() {
  associatePages = {
    applications: 1,
    payments: 1,
    profiles: 1,
    directory: 1
  };
}

function getAssociatePageMeta(items, key) {
  const pageSize = ASSOCIATE_PAGE_SIZE[key] || 10;
  const totalItems = Array.isArray(items) ? items.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(Number(associatePages[key] || 1), 1), totalPages);
  associatePages[key] = currentPage;
  const startIndex = totalItems ? (currentPage - 1) * pageSize : 0;
  const pageItems = totalItems ? items.slice(startIndex, startIndex + pageSize) : [];
  return {
    key,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    startIndex,
    endIndex: totalItems ? startIndex + pageItems.length : 0,
    items: pageItems
  };
}

function getAssociatePaginationWindow(currentPage, totalPages) {
  const pages = [];
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages, currentPage + 1);

  if (start > 1) {
    pages.push(1);
  }
  if (start > 2) {
    pages.push("ellipsis-left");
  }
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  if (end < totalPages - 1) {
    pages.push("ellipsis-right");
  }
  if (end < totalPages) {
    pages.push(totalPages);
  }

  return pages;
}

function renderAssociatePagination(meta, label) {
  if (!meta || meta.totalPages <= 1) {
    return "";
  }

  return `
    <div class="list-pagination">
      <p class="muted">
        ${escapeHtml(label)} ${meta.startIndex + 1}-${meta.endIndex} de ${meta.totalItems}
      </p>
      <div class="chip-row">
        <button class="mini-button" data-action="set-associate-page" data-page-key="${meta.key}" data-page="${meta.currentPage - 1}" ${meta.currentPage === 1 ? "disabled" : ""}>Anterior</button>
        ${getAssociatePaginationWindow(meta.currentPage, meta.totalPages)
          .map((page) =>
            String(page).startsWith("ellipsis")
              ? `<span class="small-chip">...</span>`
              : `<button class="${meta.currentPage === page ? "mini-button is-active" : "mini-button"}" data-action="set-associate-page" data-page-key="${meta.key}" data-page="${page}">${page}</button>`
          )
          .join("")}
        <button class="mini-button" data-action="set-associate-page" data-page-key="${meta.key}" data-page="${meta.currentPage + 1}" ${meta.currentPage === meta.totalPages ? "disabled" : ""}>Siguiente</button>
      </div>
    </div>
  `;
}

function applyAssociateFilterPreset(preset) {
  if (preset === "incidents") {
    associateFilters = {
      query: "",
      service: "all",
      review: "pending",
      readiness: "all",
      quota: "pending",
      migration: "all"
    };
    associatesSectionMode = "directory";
    resetAssociatePages();
    return "Mostrando socios con incidencias o cuota pendiente";
  }

  associateFilters = {
    query: "",
    service: "all",
    review: "all",
    readiness: "all",
    quota: "all",
    migration: "all"
  };
  associatesSectionMode = "directory";
  resetAssociatePages();
  return "Mostrando todo el censo de socios";
}

function getFilteredAssociateCollections() {
  const query = associateFilters.query || "";
  const selectedService = associateFilters.service || "all";
  const review = associateFilters.review || "all";
  const readinessFilter = associateFilters.readiness || "all";
  const quota = associateFilters.quota || "all";
  const migration = associateFilters.migration || "all";

  const applications = state.associateApplications.filter((item) => {
    const matchesService = selectedService === "all" || item.service === selectedService;
    return (
      matchesService &&
      matchesReviewFilter(item.status, review) &&
      matchesAssociateReadinessFilter(item, readinessFilter) &&
      matchesAssociateSearch(
        [
          item.firstName,
          item.lastName,
          item.email,
          item.phone,
          item.dni,
          item.service,
          item.status,
          item.infoRequestMessage,
          item.applicantReplyNote,
          ...(item.applicantReplyDocuments || [])
        ],
        query
      )
    );
  });

  const associates = state.associates.filter((item) => {
    const matchesService = selectedService === "all" || item.service === selectedService;
    const pendingState =
      getAssociateQuotaGap(item) > 0 ||
      /pendiente|revision|solicitud/i.test(String(item.status || ""));
    const matchesReview =
      review === "all" ? true : review === "pending" ? pendingState : !pendingState;
    return (
      matchesService &&
      matchesReview &&
      matchesAssociateQuotaFilter(item, quota) &&
      matchesAssociateMigrationFilter(item, migration) &&
      matchesAssociateSearch(
        [
          item.associateNumber,
          item.firstName,
          item.lastName,
          item.email,
          item.phone,
          item.dni,
          item.service,
          item.status
        ],
        query
      )
    );
  });

  const paymentSubmissions = state.associatePaymentSubmissions.filter((item) => {
    const associate = findAssociate(item.associateId);
    const matchesService =
      selectedService === "all" || associate?.service === selectedService;
    return (
      matchesService &&
      matchesReviewFilter(item.status, review) &&
      matchesAssociateSearch(
        [
          associate?.associateNumber,
          associate ? getAssociateFullName(associate) : item.associateId,
          associate?.email,
          associate?.phone,
          associate?.service,
          item.year,
          item.method,
          item.status,
          item.amount
        ],
        query
      )
    );
  });

  const profileRequests = state.associateProfileRequests.filter((item) => {
    const associate = findAssociate(item.associateId);
    const matchesService = selectedService === "all" || item.service === selectedService;
    return (
      matchesService &&
      matchesReviewFilter(item.status, review) &&
      matchesAssociateSearch(
        [
          associate?.associateNumber,
          item.firstName,
          item.lastName,
          item.email,
          item.phone,
          item.service,
          item.status
        ],
        query
      )
    );
  });

  return {
    applications,
    associates,
    paymentSubmissions,
    profileRequests
  };
}

function renderAssociates() {
  if (!isAdminView()) {
    if (isAdminSession()) {
      return `
        <div class="empty-state">
          <p>Estas dentro con una cuenta de administracion, pero la interfaz sigue en modo socio/alumno.</p>
          <p><button class="primary-button" type="button" data-action="return-to-admin-view">Cambiar a administracion</button></p>
        </div>
      `;
    }
    return `<div class="empty-state">La gestion de socios solo esta disponible para administracion.</div>`;
  }

  const filterServices = getAssociateFilterServices();
  const filteredCollections = getFilteredAssociateCollections();
  const pendingApplications = state.associateApplications.filter((item) =>
    isAssociateApplicationPending(item)
  );
  const pendingPaymentSubmissions = state.associatePaymentSubmissions.filter(
    (item) => item.status === "Pendiente de revision"
  );
  const pendingProfileRequests = state.associateProfileRequests.filter(
    (item) => item.status === "Pendiente de revision"
  );
  const activeAssociates = state.associates.filter((item) => item.status === "Activa");
  const pendingQuotaAssociates = state.associates.filter((item) => getAssociateQuotaGap(item) > 0);
  const pagedApplications = getAssociatePageMeta(filteredCollections.applications, "applications");
  const pagedPaymentSubmissions = getAssociatePageMeta(filteredCollections.paymentSubmissions, "payments");
  const pagedProfileRequests = getAssociatePageMeta(filteredCollections.profileRequests, "profiles");
  const pagedAssociates = getAssociatePageMeta(filteredCollections.associates, "directory");
  const filteredApplicationIds = new Set(filteredCollections.applications.map((item) => item.id));
  selectedAssociateApplicationIds = selectedAssociateApplicationIds.filter((id) =>
    filteredApplicationIds.has(id)
  );
  const filteredPaymentSubmissionIds = new Set(filteredCollections.paymentSubmissions.map((item) => item.id));
  selectedAssociatePaymentSubmissionIds = selectedAssociatePaymentSubmissionIds.filter((id) =>
    filteredPaymentSubmissionIds.has(id)
  );
  const filteredProfileRequestIds = new Set(filteredCollections.profileRequests.map((item) => item.id));
  selectedAssociateProfileRequestIds = selectedAssociateProfileRequestIds.filter((id) =>
    filteredProfileRequestIds.has(id)
  );
  const selectableApplications = filteredCollections.applications.filter((item) =>
    isAssociateApplicationPending(item)
  );
  const selectedApplicationCount = selectedAssociateApplicationIds.length;
  const pendingFilteredPaymentSubmissions = filteredCollections.paymentSubmissions.filter(
    (item) => item.status === "Pendiente de revision"
  );
  const pendingFilteredProfileRequests = filteredCollections.profileRequests.filter(
    (item) => item.status === "Pendiente de revision"
  );
  const pendingVisiblePaymentSubmissions = pagedPaymentSubmissions.items.filter(
    (item) => item.status === "Pendiente de revision"
  );
  const pendingVisibleProfileRequests = pagedProfileRequests.items.filter(
    (item) => item.status === "Pendiente de revision"
  );
  const selectedPaymentSubmissionCount = selectedAssociatePaymentSubmissionIds.length;
  const selectedProfileRequestCount = selectedAssociateProfileRequestIds.length;
  const approvableApplicationCount = pendingApplications.filter((item) =>
    getAssociateApplicationReadiness(item).ready
  ).length;
  const blockedApplicationCount = pendingApplications.length - approvableApplicationCount;
  const urgentApplications = pendingApplications
    .sort((a, b) => String(a.submittedAt || "").localeCompare(String(b.submittedAt || "")))
    .slice(0, 5);
  const workbookPreviewRows = associateWorkbookPreview?.rows || [];
  const workbookPreviewSummary = associateWorkbookPreview?.summary || {
    totalRows: 0,
    readyRows: 0,
    reviewRows: 0,
    blockedRows: 0
  };
  const workbookPreviewIssues = workbookPreviewRows
    .filter((item) => item.importStatus !== "ready")
    .slice(0, 6);
  const legacyImportedAssociates = state.associates.filter((item) => isLegacyImportedAssociate(item));
  const legacyReviewAssociates = legacyImportedAssociates.filter(
    (item) => item.status === "Revisar documentacion"
  );
  const legacyReadyToClose = legacyReviewAssociates.filter((item) =>
    canCloseAssociateLegacyReview(item)
  );
  const legacyWithoutCampusAccess = legacyReviewAssociates.filter((item) => !item.linkedAccountId).length;
  const legacyMissingPhone = legacyReviewAssociates.filter((item) => !item.phone).length;
  const legacyMissingDni = legacyReviewAssociates.filter((item) => !item.dni).length;
  const urgentLegacyReviewAssociates = legacyReviewAssociates
    .slice()
    .sort((a, b) => Number(a.associateNumber || 0) - Number(b.associateNumber || 0))
    .slice(0, 6);
  const workbookPreviewDuplicateRows = workbookPreviewRows.filter((item) =>
    (item.blockers || []).some((blocker) => String(blocker).includes("ya existe en socios"))
  ).length;
  const urgentPendingQuotaAssociates = pendingQuotaAssociates
    .slice()
    .sort((a, b) => getAssociateQuotaGap(b) - getAssociateQuotaGap(a))
    .slice(0, 8);
  const selectedAssociate = findAssociate(state.selectedAssociateId);
  const selectedAssociateAccount = selectedAssociate ? findAccountByAssociate(selectedAssociate.id) : null;
  const selectedAssociateMember = selectedAssociate?.linkedMemberId
    ? findMember(selectedAssociate.linkedMemberId)
    : null;
  const selectedAssociatePayments = getAssociatePayments(selectedAssociate);
  const selectedAssociateIssues = selectedAssociate ? getAssociateLegacyReviewIssues(selectedAssociate) : [];
  const selectedAssociatePendingProfileRequests = selectedAssociate
    ? (state.associateProfileRequests || []).filter(
        (item) => item.associateId === selectedAssociate.id && item.status === "Pendiente de revision"
      )
    : [];
  const selectedAssociateQuotaGap = selectedAssociate ? getAssociateQuotaGap(selectedAssociate) : 0;
  const quickAssociateMatches = getAssociateQuickSearchMatches(associateFilters.query, 8);
  const currentYear = String(new Date().getFullYear());
      const showAssociateSection = (section) => associatesSectionMode === "all" || associatesSectionMode === section;
  const showAssociateFiltersSection = ["migration", "legacy", "fees", "applications", "profiles", "directory"].includes(
      associatesSectionMode
    );
  const isAssociateWorkbenchMode = associatesSectionMode === "workbench";
  const associateHeaderTitle = isAssociateWorkbenchMode ? "Ficha de socio" : "Alta web, revision administrativa y seguimiento anual";
  const associateHeaderDescription = isAssociateWorkbenchMode
    ? "Busca un socio y trabaja su ficha desde aqui."
    : "Este modulo sustituye el paso Google Forms + Excel por un flujo unico dentro del sistema.";

  return `
    <div class="panel-stack">
      <div class="panel-header associate-anchor" id="associateSectionSummary">
        <div>
          <p class="eyebrow">Socios y cuotas</p>
          <h3>${associateHeaderTitle}</h3>
          <p class="muted">${associateHeaderDescription}</p>
        </div>
        ${
          isAssociateWorkbenchMode
            ? `
              <div class="chip-row">
                <details class="tools-disclosure">
                  <summary>Herramientas</summary>
                  <div class="tools-disclosure-body">
                    <a class="button-link" target="_blank" rel="noreferrer" href="/join.html">Abrir formulario publico</a>
                    <a class="button-link" href="/api/reports/associates.csv">Exportar socios</a>
                    <a class="button-link" href="/api/reports/associate-payments.csv">Exportar pagos</a>
                  </div>
                </details>
              </div>
            `
            : `
              <div class="chip-row">
                <a class="button-link" target="_blank" rel="noreferrer" href="/join.html">Abrir formulario publico</a>
                <details class="tools-disclosure">
                  <summary>Exportaciones</summary>
                  <div class="tools-disclosure-body">
                    <a class="button-link" href="/api/reports/associate-applications.csv">Solicitudes</a>
                    <a class="button-link" href="/api/reports/associates.csv">Socios</a>
                    <a class="button-link" href="/api/reports/associates-legacy-review.csv">Legacy en revision</a>
                    <a class="button-link" href="/api/reports/associate-payments.csv">Pagos</a>
                    <a class="button-link" href="/api/reports/associate-profile-requests.csv">Cambios de ficha</a>
                  </div>
                </details>
              </div>
            `
        }
      </div>

      <div class="mail-card">
        <div class="panel-header">
          <div>
            <h4>Buscador de socios</h4>
            <p class="muted">Busca un socio y abre su ficha al momento.</p>
          </div>
          ${
            selectedAssociate
              ? `<span class="small-chip">Ficha activa: ${escapeHtml(getAssociateFullName(selectedAssociate))}</span>`
              : `<span class="small-chip">Sin ficha activa</span>`
          }
        </div>
        <div class="course-grid associate-search-grid">
          <label class="inline-field">
            Buscar socio
            <input id="associateSearchFilter" value="${escapeHtml(associateFilters.query)}" placeholder="Ej. Carlos, socio 1, DNI, telefono, CPBC..." />
          </label>
          <div class="associate-search-panel">
            <div class="chip-row">
              <button class="ghost-button" type="button" data-action="set-associate-filter-preset" data-preset="census">Ver todo el censo</button>
              <button class="ghost-button" type="button" data-action="set-associate-filter-preset" data-preset="incidents">Solo incidencias</button>
              <button class="primary-button" type="button" data-action="run-associate-search">Buscar</button>
            </div>
            <p class="muted">
              ${
                String(associateFilters.query || "").trim()
                  ? `${quickAssociateMatches.length} resultado(s) rapido(s). Pulsa uno o usa Enter para abrir la primera ficha.`
                  : "Empieza a escribir y abre la ficha al instante."
              }
            </p>
            <div class="chip-row">
              <span class="small-chip">Censo: ${state.associates.length}</span>
              <span class="small-chip">Filtrados: ${filteredCollections.associates.length}</span>
            </div>
            <div class="associate-search-results">
                ${
                  String(associateFilters.query || "").trim()
                    ? quickAssociateMatches.length
                      ? quickAssociateMatches
                          .map(
                            (associate) => `
                            <button class="ghost-button associate-search-result" type="button" data-action="select-associate" data-associate-id="${associate.id}">
                              <strong>#${escapeHtml(String(associate.associateNumber || "-"))} ${escapeHtml(getAssociateFullName(associate))}</strong>
                              <span>${escapeHtml(
                                [
                                  associate.service || "Sin servicio",
                                  associate.status || "Sin estado",
                                  getAssociateLegacyReviewIssues(associate).length
                                    ? getAssociateLegacyReviewIssues(associate).join(" | ")
                                    : associate.email || associate.phone || "Sin detalle"
                                ].join(" • ")
                              )}</span>
                            </button>
                          `
                          )
                          .join("")
                      : `<p class="status-note warning">No hay socios que coincidan con esa busqueda.</p>`
                    : `<p class="muted">Busca por nombre, numero, email, telefono, DNI o servicio.</p>`
                }
            </div>
          </div>
        </div>
      </div>

      <div class="chip-row">
        ${
          isAssociateWorkbenchMode
            ? `
              <button class="primary-button" data-action="set-associate-section-mode" data-mode="workbench">Ficha</button>
              <button class="ghost-button" data-action="set-associate-section-mode" data-mode="directory">Socios</button>
              <button class="ghost-button" data-action="set-associate-section-mode" data-mode="fees">Cuotas</button>
              <button class="ghost-button" data-action="set-associate-section-mode" data-mode="applications">Solicitudes</button>
              <button class="ghost-button" data-action="set-associate-section-mode" data-mode="profiles">Cambios</button>
            `
            : `
              <button class="${associatesSectionMode === "workbench" ? "primary-button" : "ghost-button"}" data-action="set-associate-section-mode" data-mode="workbench">Ficha</button>
              <button class="${associatesSectionMode === "migration" ? "primary-button" : "ghost-button"}" data-action="set-associate-section-mode" data-mode="migration">Migracion</button>
              <button class="${associatesSectionMode === "legacy" ? "primary-button" : "ghost-button"}" data-action="set-associate-section-mode" data-mode="legacy">Legacy</button>
              <button class="${associatesSectionMode === "fees" ? "primary-button" : "ghost-button"}" data-action="set-associate-section-mode" data-mode="fees">Cuotas</button>
              <button class="${associatesSectionMode === "applications" ? "primary-button" : "ghost-button"}" data-action="set-associate-section-mode" data-mode="applications">Solicitudes</button>
              <button class="${associatesSectionMode === "profiles" ? "primary-button" : "ghost-button"}" data-action="set-associate-section-mode" data-mode="profiles">Cambios</button>
              <button class="${associatesSectionMode === "directory" ? "primary-button" : "ghost-button"}" data-action="set-associate-section-mode" data-mode="directory">Socios</button>
            `
        }
      </div>

      ${
        showAssociateSection("workbench")
          ? `
      <div class="mail-card associate-anchor" id="associateSectionWorkbench">
        <div class="panel-header">
          <div>
            <h4>Ficha activa del socio</h4>
            <p class="muted">Abre cualquier socio desde el listado o desde las colas y trabaja aqui mismo sin depender del lateral.</p>
          </div>
          ${
            selectedAssociate
              ? `<span class="small-chip">#${escapeHtml(String(selectedAssociate.associateNumber || "-"))} ${escapeHtml(getAssociateFullName(selectedAssociate))}</span>`
              : `<span class="small-chip">Sin socio seleccionado</span>`
          }
        </div>
        ${
          selectedAssociate
            ? renderAssociateWorkbench(
                selectedAssociate,
                selectedAssociateAccount,
                selectedAssociateMember,
                selectedAssociatePayments,
                currentYear
              )
            : `<p class="muted">Pulsa "Abrir ficha" en cualquier socio para cargar aqui su ficha, sus cuotas y sus acciones principales.</p>`
        }
      </div>
      `
          : ""
      }

      ${
        showAssociateSection("migration")
          ? `
      <div class="mail-card associate-anchor" id="associateSectionMigration">
        <div class="panel-header">
          <div>
            <h4>Migracion del Excel actual</h4>
            <p class="muted">Analiza el fichero legacy de cuotas y decide despues si importamos los socios al sistema.</p>
          </div>
          <div class="chip-row">
            <button type="button" class="ghost-button" data-action="preview-associate-workbook-import">Analizar Excel actual</button>
            <button type="button" class="primary-button" data-action="commit-associate-workbook-import" ${associateWorkbookPreview && (workbookPreviewSummary.readyRows || workbookPreviewSummary.reviewRows) ? "" : "disabled"}>Importar socios validos</button>
          </div>
        </div>
        <label class="inline-field">
          Excel de socios
          <input id="associateWorkbookFile" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
        </label>
        <p class="muted">${
          associateWorkbookDraftFile
            ? `Archivo retenido para importacion: ${escapeHtml(associateWorkbookDraftFile.name)}`
            : "Puedes elegir un .xlsx manualmente o dejar que el sistema use el de Descargas."
        }</p>
        ${
          associateWorkbookImportStatus
            ? `<p class="status-note ${associateWorkbookImportStatus.toLowerCase().includes("no se pudo") || associateWorkbookImportStatus.toLowerCase().includes("error") ? "warning" : ""}">${escapeHtml(associateWorkbookImportStatus)}</p>`
            : ""
        }
        <p class="status-note">
          ${
            associateWorkbookPreview
              ? `Origen: ${escapeHtml(associateWorkbookPreview.sourcePath || "-")} | ${workbookPreviewSummary.totalRows} fila(s), ${workbookPreviewSummary.readyRows} lista(s), ${workbookPreviewSummary.reviewRows} para revisar y ${workbookPreviewSummary.blockedRows} bloqueada(s).`
              : "Selecciona un .xlsx si quieres usar otro fichero. Si no eliges nada, el sistema intentara leer el Excel por defecto de Descargas."
          }
        </p>
        ${
          associateWorkbookPreview && workbookPreviewDuplicateRows
            ? `<p class="status-note">El analisis detecta ${workbookPreviewDuplicateRows} fila(s) que ya existen en el campus. Eso es normal si el Excel ya se ha migrado antes.</p>`
            : ""
        }
        ${
          associateWorkbookPreview
            ? `
              <div class="course-grid">
                <div class="timeline-item">
                  <span class="eyebrow">Filas detectadas</span>
                  <strong>${workbookPreviewSummary.totalRows}</strong>
                  <p>Hoja leida: ${escapeHtml(associateWorkbookPreview.sheetName || "-")}</p>
                </div>
                <div class="timeline-item">
                  <span class="eyebrow">Listas</span>
                  <strong>${workbookPreviewSummary.readyRows}</strong>
                  <p>Entrarian como socio activo sin observaciones de migracion.</p>
                </div>
                <div class="timeline-item">
                  <span class="eyebrow">Para revisar</span>
                  <strong>${workbookPreviewSummary.reviewRows}</strong>
                  <p>Se importarian con estado de revision documental.</p>
                </div>
                <div class="timeline-item">
                  <span class="eyebrow">Bloqueadas</span>
                  <strong>${workbookPreviewSummary.blockedRows}</strong>
                  <p>No se importarian hasta corregir email, nombre o duplicados.</p>
                </div>
              </div>
              ${
                workbookPreviewIssues.length
                  ? `
                    <div class="table-card">
                      <table>
                        <thead>
                          <tr>
                            <th>Fila</th>
                            <th>N.&ordm; socio</th>
                            <th>Socio</th>
                            <th>Estado</th>
                            <th>Detalle</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${workbookPreviewIssues
                            .map(
                              (item) => `
                                <tr>
                                  <td>${escapeHtml(String(item.sourceRow || "-"))}</td>
                                  <td>${escapeHtml(String(item.associateNumber || "-"))}</td>
                                  <td>${escapeHtml([item.firstName, item.lastName].filter(Boolean).join(" ") || item.email || "-")}</td>
                                  <td>${escapeHtml(item.importStatus === "blocked" ? "Bloqueada" : "Revisar")}</td>
                                  <td>${escapeHtml([...(item.blockers || []), ...(item.notes || [])].join(" - "))}</td>
                                </tr>
                              `
                            )
                            .join("")}
                        </tbody>
                      </table>
                    </div>
                  `
                  : `<p class="muted">La vista previa no ha detectado incidencias en las primeras filas revisadas.</p>`
              }
            `
            : ""
        }
      </div>
      `
          : ""
      }

      ${
        showAssociateSection("legacy")
          ? `
      <div class="mail-card associate-anchor" id="associateSectionLegacyReview">
        <div class="panel-header">
          <div>
            <h4>Revision postmigracion</h4>
            <p class="muted">Socios heredados del Excel que aun necesitan repaso antes de darlos por cerrados.</p>
          </div>
          <div class="chip-row">
            <span class="small-chip">${legacyReviewAssociates.length} legacy en revision</span>
            <span class="small-chip">${legacyReadyToClose.length} listos para cerrar</span>
          </div>
        </div>
        <div class="course-grid">
          <div class="timeline-item">
            <span class="eyebrow">Sin acceso</span>
            <strong>${legacyWithoutCampusAccess}</strong>
            <p>Socios legacy en revision que aun no tienen cuenta de campus.</p>
          </div>
          <div class="timeline-item">
            <span class="eyebrow">Sin telefono</span>
            <strong>${legacyMissingPhone}</strong>
            <p>Fichas importadas donde falta telefono de contacto.</p>
          </div>
          <div class="timeline-item">
            <span class="eyebrow">Sin DNI</span>
            <strong>${legacyMissingDni}</strong>
            <p>Fichas importadas donde falta DNI o necesita repaso.</p>
          </div>
        </div>
        ${
          urgentLegacyReviewAssociates.length
            ? urgentLegacyReviewAssociates
                .map((associate) => {
                  const issues = getAssociateLegacyReviewIssues(associate);
                  const canClose = canCloseAssociateLegacyReview(associate);
                  const hasAccess = Boolean(associate.linkedAccountId);
                  return `
                    <div class="timeline-item">
                      <div class="row-between">
                        <strong>#${escapeHtml(String(associate.associateNumber || "-"))} ${escapeHtml(getAssociateFullName(associate))}</strong>
                        <span class="small-chip">${escapeHtml(associate.service || "Sin servicio")}</span>
                      </div>
                      <p>${escapeHtml(associate.email || "Sin email")} | ${escapeHtml(associate.phone || "Sin telefono")}</p>
                      <p class="muted">Campus: ${escapeHtml(associate.campusAccessStatus || "sin acceso")} | Estado: ${escapeHtml(associate.status)}</p>
                      <p class="status-note ${issues.length ? "warning" : ""}">
                        ${
                          issues.length
                        ? escapeHtml(issues.join(" - "))
                            : "Sin incidencias abiertas de migracion"
                        }
                      </p>
                      <div class="chip-row">
                        <button class="mini-button" data-action="select-associate" data-associate-id="${associate.id}">Abrir ficha</button>
                        ${
                          hasAccess
                            ? `<button class="mini-button" data-action="send-associate-welcome" data-associate-id="${associate.id}">Enviar bienvenida</button>`
                            : `<button class="mini-button" data-action="create-associate-campus-access" data-associate-id="${associate.id}" ${associate.email ? "" : "disabled"}>Crear acceso</button>`
                        }
                        <button class="mini-button" data-action="mark-associate-reviewed" data-associate-id="${associate.id}" ${canClose ? "" : "disabled"}>Cerrar revision</button>
                      </div>
                    </div>
                  `;
                })
                .join("")
            : `<p class="status-note">No quedan socios legacy en revision documental.</p>`
        }
      </div>
      `
          : ""
      }

      ${
        showAssociateSection("fees")
          ? `
      <div class="mail-card associate-anchor" id="associateSectionPendingFees">
        <div class="panel-header">
          <div>
            <h4>Cuotas pendientes</h4>
            <p class="muted">Entra directo a los socios pendientes y regulariza la cuota sin perder tiempo.</p>
          </div>
          <div class="chip-row">
            <span class="small-chip">${pendingQuotaAssociates.length} con cuota pendiente</span>
            <button class="ghost-button" data-action="settle-all-visible-associate-fees" ${urgentPendingQuotaAssociates.length ? "" : "disabled"}>Marcar visibles pagadas</button>
          </div>
        </div>
        <p class="status-note info">
          Hay <strong>${pendingQuotaAssociates.length}</strong> socio(s) con cuota pendiente y en la lista visible suman
          <strong>${formatCurrency(urgentPendingQuotaAssociates.reduce((sum, associate) => sum + getAssociateQuotaGap(associate), 0))}</strong>.
          ${selectedAssociate ? `La ficha activa es <strong>${escapeHtml(getAssociateFullName(selectedAssociate))}</strong>.` : "Abre una ficha si quieres trabajar un socio concreto."}
        </p>
        ${
          urgentPendingQuotaAssociates.length
            ? urgentPendingQuotaAssociates
                .slice(0, 12)
                .map(
                  (associate) => `
                    <div class="timeline-item">
                      <div class="row-between">
                        <strong>#${escapeHtml(String(associate.associateNumber || "-"))} ${escapeHtml(getAssociateFullName(associate))}</strong>
                        <span class="small-chip">${formatCurrency(getAssociateQuotaGap(associate))} pendiente</span>
                      </div>
                      <p>${escapeHtml(associate.email || "Sin email")} | ${escapeHtml(associate.service || "Sin servicio")}</p>
                      <p class="muted">Estado: ${escapeHtml(associate.status)} | Cuota ${new Date().getFullYear()}: ${formatCurrency(getAssociateCurrentYearFee(associate))} / ${formatCurrency(associate.annualAmount || 0)}</p>
                      <div class="chip-row">
                        <button class="mini-button" data-action="select-associate" data-associate-id="${associate.id}">Abrir ficha</button>
                        <button class="mini-button" data-action="mark-associate-paid" data-associate-id="${associate.id}" data-year="${new Date().getFullYear()}">Marcar pagado</button>
                      </div>
                    </div>
                  `
                )
                .join("")
            : `<p class="status-note">No hay cuotas pendientes ahora mismo.</p>`
        }
        ${
          urgentPendingQuotaAssociates.length > 12
            ? `<p class="muted">Mostrando 12 de ${urgentPendingQuotaAssociates.length} socios con cuota pendiente. Usa "Socios" o la ficha activa para seguir trabajando el resto.</p>`
            : ""
        }
      </div>
      `
          : ""
      }

      ${
        showAssociateSection("applications")
          ? `
      <div class="mail-card associate-anchor" id="associateSectionQuickReview">
        <div class="panel-header">
          <div>
            <h4>Cola rapida de revision</h4>
            <p class="muted">Solicitudes de alta pendientes listas para abrir, pedir documentacion o aprobar.</p>
          </div>
          <button class="ghost-button" data-action="nav" data-view="associates">Ver todo</button>
        </div>
        <p class="status-note">${approvableApplicationCount} lista(s) para aprobar y ${blockedApplicationCount} bloqueada(s) por datos o validacion.</p>
        ${
          urgentApplications.length
            ? urgentApplications
                .map(
                  (item) => {
                    const readiness = getAssociateApplicationReadiness(item);
                    const ready = readiness.ready;
                    return `
                    <div class="timeline-item">
                      <strong>${escapeHtml(getAssociateApplicantName(item))}</strong>
                      <p>${escapeHtml(item.email)} | ${escapeHtml(item.phone)} | ${escapeHtml(item.service || "Sin servicio")}</p>
                      <p class="muted">${escapeHtml(formatDateTime(item.submittedAt))} | ${escapeHtml(item.status)}</p>
                      <p class="status-note ${ready ? "" : "warning"}">${ready ? "Lista para aprobar" : escapeHtml(readiness.blockers.join(" - "))}</p>
                      ${renderAssociateApplicationValidationChips(item)}
                      <div class="chip-row">
                        <button class="mini-button" data-action="select-associate-application" data-application-id="${item.id}">Abrir</button>
                        <button class="mini-button" data-action="request-associate-info" data-application-id="${item.id}">Pedir doc.</button>
                        <button class="mini-button" data-action="approve-associate" data-application-id="${item.id}" ${ready ? "" : "disabled"}>Aprobar</button>
                      </div>
                    </div>
                  `;
                  }
                )
                .join("")
            : `<p class="status-note">No hay solicitudes pendientes en este momento.</p>`
        }
      </div>
      `
          : ""
      }

      ${
        showAssociateFiltersSection
          ? `
      <div class="mail-card associate-anchor" id="associateSectionFilters">
        <div class="panel-header">
          <div>
            <h4>Filtros</h4>
            <p class="muted">Afina la lista por servicio, revision, cuota o migracion.</p>
          </div>
          <button class="ghost-button" data-action="clear-associate-filters">Limpiar filtros</button>
        </div>
        <div class="course-grid">
          <label class="inline-field">
            Servicio
            <select id="associateServiceFilter">
              <option value="all">Todos</option>
              ${filterServices.map((service) => `<option value="${escapeHtml(service)}" ${associateFilters.service === service ? "selected" : ""}>${escapeHtml(service)}</option>`).join("")}
            </select>
          </label>
          <label class="inline-field">
            Revision
            <select id="associateReviewFilter">
              <option value="all" ${associateFilters.review === "all" ? "selected" : ""}>Todas</option>
              <option value="pending" ${associateFilters.review === "pending" ? "selected" : ""}>Pendientes</option>
              <option value="resolved" ${associateFilters.review === "resolved" ? "selected" : ""}>Resueltas</option>
            </select>
          </label>
          <label class="inline-field">
            Aprobacion
            <select id="associateReadinessFilter">
              <option value="all" ${associateFilters.readiness === "all" ? "selected" : ""}>Todas</option>
              <option value="ready" ${associateFilters.readiness === "ready" ? "selected" : ""}>Listas para aprobar</option>
              <option value="blocked" ${associateFilters.readiness === "blocked" ? "selected" : ""}>Bloqueadas</option>
            </select>
          </label>
          <label class="inline-field">
            Cuota
            <select id="associateQuotaFilter">
              <option value="all" ${associateFilters.quota === "all" ? "selected" : ""}>Todas</option>
              <option value="pending" ${associateFilters.quota === "pending" ? "selected" : ""}>Pendiente</option>
              <option value="settled" ${associateFilters.quota === "settled" ? "selected" : ""}>Al corriente</option>
            </select>
          </label>
          <label class="inline-field">
            Migracion
            <select id="associateMigrationFilter">
              <option value="all" ${associateFilters.migration === "all" ? "selected" : ""}>Todos</option>
              <option value="legacy" ${associateFilters.migration === "legacy" ? "selected" : ""}>Importados desde Excel</option>
              <option value="legacy-review" ${associateFilters.migration === "legacy-review" ? "selected" : ""}>Legacy en revision</option>
            </select>
          </label>
        </div>
        <div class="chip-row">
          <span class="small-chip">${filteredCollections.associates.length} socio(s)</span>
          <span class="small-chip">${filteredCollections.applications.length} solicitud(es)</span>
          <span class="small-chip">${filteredCollections.paymentSubmissions.length} justificante(s)</span>
          <span class="small-chip">${filteredCollections.profileRequests.length} cambio(s)</span>
          <span class="small-chip">Legacy: ${legacyReviewAssociates.length} en revision</span>
        </div>
      </div>
      `
          : ""
      }

      ${
        showAssociateSection("profiles")
          ? `
      <div class="table-card associate-anchor" id="associateSectionProfiles">
        <div class="panel-header">
          <div>
            <h4>Cambios de ficha</h4>
            <p class="muted">Selecciona varios cambios pendientes para resolverlos de una vez.</p>
          </div>
          <div class="chip-row">
            <span class="small-chip">${selectedProfileRequestCount}/${pendingFilteredProfileRequests.length} seleccionada(s)</span>
            <button class="ghost-button" data-action="select-all-visible-associate-profile-requests">Seleccionar pendientes</button>
            <button class="ghost-button" data-action="clear-selected-associate-profile-requests">Limpiar seleccion</button>
            <button class="primary-button" data-action="bulk-approve-associate-profile-requests" ${selectedProfileRequestCount ? "" : "disabled"}>Aprobar seleccionadas (${selectedProfileRequestCount})</button>
          </div>
        </div>
        <p class="status-note info">
          Hay <strong>${pendingFilteredProfileRequests.length}</strong> cambio(s) pendiente(s) y en esta pagina ves
          <strong>${pagedProfileRequests.items.length}</strong> solicitud(es).
        </p>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Socio</th>
              <th>Envio</th>
              <th>Datos propuestos</th>
              <th>Estado</th>
              <th>Notificacion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${
              pagedProfileRequests.items.length
                ? pagedProfileRequests.items
                    .map((item) => {
                      const associate = findAssociate(item.associateId);
                      const proposed = getAssociateProfileRequestProposedData(item);
                      return `
                        <tr>
                          <td>
                            ${
                              item.status === "Pendiente de revision"
                                ? `<input type="checkbox" data-action="toggle-associate-profile-request-selection" data-request-id="${item.id}" ${selectedAssociateProfileRequestIds.includes(item.id) ? "checked" : ""} />`
                                : ""
                            }
                          </td>
                          <td>${escapeHtml(associate ? getAssociateFullName(associate) : item.associateId)}</td>
                          <td>${escapeHtml(formatDateTime(item.submittedAt))}</td>
                            <td>${escapeHtml(proposed.email || "-")}<br><span class="muted">${escapeHtml(proposed.dni || "-")} | ${escapeHtml(proposed.phone || "-")} | ${escapeHtml(proposed.service || "-")}</span></td>
                          <td>${escapeHtml(item.status)}</td>
                          <td>${escapeHtml(item.notificationStatus || "pending")}</td>
                          <td>
                            <div class="chip-row">
                              <button class="mini-button" data-action="select-associate-profile-request" data-request-id="${item.id}">Ver</button>
                              ${
                                item.status === "Pendiente de revision"
                                  ? `
                                    <button class="mini-button" data-action="approve-associate-profile-request" data-request-id="${item.id}">Aprobar</button>
                                    <button class="mini-button" data-action="reject-associate-profile-request" data-request-id="${item.id}">Rechazar</button>
                                  `
                                  : `<button class="mini-button" data-action="notify-associate-profile-request" data-request-id="${item.id}">Reenviar aviso</button>`
                              }
                            </div>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")
                : `<tr><td colspan="7">No hay solicitudes de actualizacion que coincidan con los filtros.</td></tr>`
            }
          </tbody>
        </table>
        ${renderAssociatePagination(pagedProfileRequests, "Cambios")}
      </div>
      `
          : ""
      }

      ${
        showAssociateSection("fees")
          ? `
      <div class="table-card associate-anchor" id="associateSectionPayments">
        <div class="panel-header">
          <div>
            <h4>Justificantes de cuota</h4>
            <p class="muted">Revisa y aprueba varios justificantes pendientes sin salir de la bandeja.</p>
          </div>
          <div class="chip-row">
            <span class="small-chip">${selectedPaymentSubmissionCount}/${pendingFilteredPaymentSubmissions.length} seleccionada(s)</span>
            <button class="ghost-button" data-action="select-all-visible-associate-payments">Seleccionar pendientes</button>
            <button class="ghost-button" data-action="clear-selected-associate-payments">Limpiar seleccion</button>
            <button class="primary-button" data-action="bulk-approve-associate-payments" ${selectedPaymentSubmissionCount ? "" : "disabled"}>Aprobar seleccionados (${selectedPaymentSubmissionCount})</button>
          </div>
        </div>
        <p class="status-note info">
          Hay <strong>${pendingFilteredPaymentSubmissions.length}</strong> justificante(s) pendiente(s) y en esta pagina suman
          <strong>${formatCurrency(pagedPaymentSubmissions.items.reduce((sum, item) => sum + Number(item.amount || 0), 0))}</strong>.
        </p>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Socio</th>
              <th>Envio</th>
              <th>Importe</th>
              <th>Justificante</th>
              <th>Estado</th>
              <th>Notificacion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${
              pagedPaymentSubmissions.items.length
                ? pagedPaymentSubmissions.items
                    .map((item) => {
                      const associate = findAssociate(item.associateId);
                      return `
                        <tr>
                          <td>
                            ${
                              item.status === "Pendiente de revision"
                                ? `<input type="checkbox" data-action="toggle-associate-payment-selection" data-submission-id="${item.id}" ${selectedAssociatePaymentSubmissionIds.includes(item.id) ? "checked" : ""} />`
                                : ""
                            }
                          </td>
                          <td>${escapeHtml(associate ? getAssociateFullName(associate) : item.associateId)}<br><span class="muted">${escapeHtml(item.year)}</span></td>
                          <td>${escapeHtml(formatDateTime(item.submittedAt))}<br><span class="muted">${escapeHtml(item.method)}</span></td>
                          <td>${formatCurrency(item.amount)}</td>
                          <td>${
                            item.proofFile
                              ? `<a class="mini-button" target="_blank" rel="noreferrer" href="/api/associates/files/${encodeURIComponent(item.proofFile)}">Abrir justificante</a>`
                              : "-"
                          }</td>
                          <td>${escapeHtml(item.status)}</td>
                          <td>${escapeHtml(item.notificationStatus || "pending")}</td>
                          <td>
                            <div class="chip-row">
                              <button class="mini-button" data-action="select-associate-payment-submission" data-submission-id="${item.id}">Ver</button>
                              ${
                                item.status === "Pendiente de revision"
                                  ? `
                                    <button class="mini-button" data-action="approve-associate-payment" data-submission-id="${item.id}">Aprobar</button>
                                    <button class="mini-button" data-action="reject-associate-payment" data-submission-id="${item.id}">Rechazar</button>
                                  `
                                  : `<button class="mini-button" data-action="notify-associate-payment" data-submission-id="${item.id}">Reenviar aviso</button>`
                              }
                            </div>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")
                : `<tr><td colspan="8">No hay justificantes de cuota que coincidan con los filtros.</td></tr>`
            }
          </tbody>
        </table>
        ${renderAssociatePagination(pagedPaymentSubmissions, "Justificantes")}
      </div>
      `
          : ""
      }

      ${
        showAssociateSection("applications")
          ? `
      <div class="table-card associate-anchor" id="associateSectionApplications">
        <div class="panel-header">
          <div>
            <h4>Solicitudes de alta</h4>
            <p class="muted">Selecciona varias para aprobarlas de una vez cuando ya este todo correcto.</p>
          </div>
          <div class="chip-row">
            <span class="small-chip">${selectedApplicationCount}/${selectableApplications.length} seleccionada(s)</span>
            <button class="ghost-button" data-action="select-all-visible-associate-applications">Seleccionar aprobables</button>
            <button class="ghost-button" data-action="clear-selected-associate-applications">Limpiar seleccion</button>
            <button class="primary-button" data-action="bulk-approve-associate-applications" ${selectedApplicationCount ? "" : "disabled"}>Aprobar seleccionadas (${selectedApplicationCount})</button>
          </div>
        </div>
        <p class="status-note info">
          Hay <strong>${selectableApplications.length}</strong> solicitud(es) lista(s) para aprobar y
          <strong>${blockedFilteredApplications.length}</strong> bloqueada(s) por datos o documentacion.
        </p>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Solicitud</th>
              <th>Contacto</th>
              <th>Servicio</th>
              <th>Justificantes</th>
              <th>Estado</th>
              <th>Correos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${
              pagedApplications.items.length
                ? pagedApplications.items
                    .map(
                      (item) => {
                        const readiness = getAssociateApplicationReadiness(item);
                        const ready = readiness.ready;
                        const issues = readiness.blockers;
                        return `
                        <tr>
                          <td>
                            ${
                              isAssociateApplicationPending(item)
                                ? `<input type="checkbox" data-action="toggle-associate-application-selection" data-application-id="${item.id}" ${selectedAssociateApplicationIds.includes(item.id) ? "checked" : ""} ${ready ? "" : "disabled"} />`
                                : ""
                            }
                          </td>
                          <td>${escapeHtml(getAssociateApplicantName(item))}<br><span class="muted">${formatDateTime(item.submittedAt)}</span></td>
                          <td>${escapeHtml(item.email)}<br><span class="muted">${escapeHtml(item.phone)}</span></td>
                          <td>${escapeHtml(item.service || "-")}</td>
                          <td>
                            ${
                              item.paymentProof
                                ? `<a class="mini-button" target="_blank" rel="noreferrer" href="/api/associates/files/${encodeURIComponent(item.paymentProof)}">Abrir justificante</a>`
                                : "-"
                            }
                            ${
                              item.paymentProof2
                                ? `<br><a class="mini-button" target="_blank" rel="noreferrer" href="/api/associates/files/${encodeURIComponent(item.paymentProof2)}">Abrir justificante 2</a>`
                                : ""
                            }
                          </td>
                          <td>${escapeHtml(item.status)}<br><span class="muted">${ready ? "Lista para aprobar" : escapeHtml(issues.join(" - "))}</span>${renderAssociateApplicationValidationChips(item)}</td>
                          <td>
                            <span class="muted">Acuse: ${escapeHtml(item.receiptEmailStatus || "pending")}</span>
                            <br />
                            <span class="muted">Subsanacion: ${escapeHtml(item.infoRequestEmailStatus || "pending")}</span>
                            <br />
                            <span class="muted">Acuse respuesta: ${escapeHtml(item.applicantReplyReceiptStatus || "pending")}</span>
                            <br />
                            <span class="muted">Aviso admin: ${escapeHtml(item.applicantReplyNotificationStatus || "pending")}</span>
                            <br />
                            <span class="muted">Resolucion: ${escapeHtml(item.decisionEmailStatus || "pending")}</span>
                          </td>
                          <td>
                            <div class="chip-row">
                              <button class="mini-button" data-action="select-associate-application" data-application-id="${item.id}">Ver</button>
                              ${
                                item.status === "Pendiente de revision"
                                  ? `
                                    <button class="mini-button" data-action="approve-associate" data-application-id="${item.id}" ${ready ? "" : "disabled"}>Aprobar</button>
                                    <button class="mini-button" data-action="request-associate-info" data-application-id="${item.id}">Pedir doc.</button>
                                    <button class="mini-button" data-action="reject-associate" data-application-id="${item.id}">Rechazar</button>
                                    <button class="mini-button" data-action="notify-associate-application" data-application-id="${item.id}">Enviar acuse</button>
                                  `
                                  : item.status === "Pendiente de documentacion"
                                    ? `
                                      <button class="mini-button" data-action="reopen-associate-application" data-application-id="${item.id}">Reabrir revision</button>
                                      <button class="mini-button" data-action="approve-associate" data-application-id="${item.id}" ${ready ? "" : "disabled"}>Aprobar</button>
                                      <button class="mini-button" data-action="reject-associate" data-application-id="${item.id}">Rechazar</button>
                                      <button class="mini-button" data-action="notify-associate-application" data-application-id="${item.id}">Reenviar subsanacion</button>
                                    `
                                    : `
                                      <button class="mini-button" data-action="notify-associate-application" data-application-id="${item.id}">Reenviar correo</button>
                                      ${
                                        item.applicantReplyAt
                                          ? `<button class="mini-button" data-action="notify-associate-application-reply" data-application-id="${item.id}">Avisar admin</button>`
                                          : ""
                                      }
                                    `
                              }
                            </div>
                          </td>
                        </tr>
                      `;
                      }
                    )
                    .join("")
                : `<tr><td colspan="8">No hay solicitudes de alta que coincidan con los filtros.</td></tr>`
            }
          </tbody>
        </table>
        ${renderAssociatePagination(pagedApplications, "Solicitudes")}
      </div>
      `
          : ""
      }

      ${
        showAssociateSection("directory")
          ? `
      <div class="table-card associate-anchor" id="associateSectionAssociates">
        <div class="panel-header">
          <div>
            <h4>Censo de socios</h4>
            <p class="muted">Mostrando ${pagedAssociates.totalItems ? `${pagedAssociates.startIndex + 1}-${pagedAssociates.endIndex}` : "0"} de ${pagedAssociates.totalItems} socio(s) · Pagina ${pagedAssociates.currentPage} de ${pagedAssociates.totalPages}</p>
          </div>
          <div class="chip-row">
            <button class="ghost-button" data-action="set-associate-filter-preset" data-preset="census">Ver todo el censo</button>
            <button class="ghost-button" data-action="set-associate-filter-preset" data-preset="incidents">Solo incidencias</button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>N. socio</th>
              <th>Nombre</th>
              <th>Servicio</th>
              <th>Cuota ${new Date().getFullYear()}</th>
              <th>Campus</th>
              <th>Ultima cuota</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${
              pagedAssociates.items.length
                ? pagedAssociates.items
                    .map(
                      (item) => `
                        <tr>
                          <td>${item.associateNumber}</td>
                          <td>
                            ${escapeHtml(getAssociateFullName(item))}
                            <div class="inline-table-actions">
                              <button class="mini-button" data-action="select-associate" data-associate-id="${item.id}">Abrir ficha</button>
                              ${
                                getAssociateQuotaGap(item) > 0
                                  ? `<button class="mini-button" data-action="mark-associate-paid" data-associate-id="${item.id}" data-year="${new Date().getFullYear()}">Marcar pagado</button>`
                                  : ""
                              }
                              ${
                                !item.linkedAccountId && item.email
                                  ? `<button class="mini-button" data-action="create-associate-campus-access" data-associate-id="${item.id}">Crear acceso</button>`
                                  : ""
                              }
                            </div>
                          </td>
                          <td>${escapeHtml(item.service || "-")}</td>
                          <td>${formatCurrency(getAssociateCurrentYearFee(item))} / ${formatCurrency(item.annualAmount || 0)}</td>
                          <td>${escapeHtml(item.campusAccessStatus || "pending")}</td>
                          <td>${escapeHtml(item.lastQuotaMonth || "-")}</td>
                          <td>${escapeHtml(item.status)}</td>
                          <td>
                            <div class="chip-row">
                              <button class="mini-button" data-action="select-associate" data-associate-id="${item.id}">Ver ficha</button>
                              ${
                                !item.linkedAccountId && item.email
                                  ? `<button class="mini-button" data-action="create-associate-campus-access" data-associate-id="${item.id}">Crear acceso</button>`
                                  : ""
                              }
                              ${
                                item.status === "Revisar documentacion"
                                  ? `<button class="mini-button" data-action="mark-associate-reviewed" data-associate-id="${item.id}" ${canCloseAssociateLegacyReview(item) ? "" : "disabled"}>Cerrar revision</button>`
                                  : ""
                              }
                              ${
                                item.linkedAccountId
                                  ? `<button class="mini-button" data-action="send-associate-welcome" data-associate-id="${item.id}">Enviar bienvenida</button>`
                                  : ""
                              }
                              <button class="mini-button danger-button" data-action="delete-associate" data-associate-id="${item.id}">Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      `
                    )
                    .join("")
                : `<tr><td colspan="8">No hay socios que coincidan con los filtros. <button class="mini-button" type="button" data-action="set-associate-filter-preset" data-preset="census">Ver todo el censo</button></td></tr>`
            }
          </tbody>
        </table>
        ${renderAssociatePagination(pagedAssociates, "Socios")}
        <p class="muted">Mostrando ${pagedAssociates.items.length} socio(s) en esta pagina de ${pagedAssociates.totalItems} socio(s) filtrado(s).</p>
      </div>
      `
          : ""
      }
    </div>
  `;
}

function renderAssociatesSide() {
  if (!isAdminView()) {
    return `<div class="empty-state">Esta vista solo esta disponible para administracion.</div>`;
  }

  const application = findAssociateApplication(state.selectedAssociateApplicationId);
  const paymentSubmission = findAssociatePaymentSubmission(state.selectedAssociatePaymentSubmissionId);
  const profileRequest = findAssociateProfileRequest(state.selectedAssociateProfileRequestId);
  const associate = findAssociate(state.selectedAssociateId);
  const campusAccount = associate ? findAccountByAssociate(associate.id) : null;
  const campusMember = associate?.linkedMemberId ? findMember(associate.linkedMemberId) : null;
  const associatePayments = getAssociatePayments(associate);
  const currentYear = String(new Date().getFullYear());
  const applicationReadiness = application
    ? getAssociateApplicationReadiness(application)
    : { ready: false, blockers: [], flags: {} };
  const applicationReady = application ? applicationReadiness.ready : false;
  const nextPendingApplication = application ? getNextPendingAssociateApplication(application.id) : null;
  const legacyReviewAssociates = state.associates.filter(
    (item) =>
      item.status === "Revisar documentacion" &&
      /Importado desde Excel legacy/i.test(String(item.observations || ""))
  );
  const pendingApplications = state.associateApplications.filter((item) =>
    isAssociateApplicationPending(item)
  );
  const pendingPaymentSubmissions = state.associatePaymentSubmissions.filter(
    (item) => item.status === "Pendiente de revision"
  );
  const pendingProfileRequests = state.associateProfileRequests.filter(
    (item) => item.status === "Pendiente de revision"
  );
  const pendingQuotaAssociates = state.associates
    .filter((item) => getAssociateQuotaGap(item) > 0)
    .sort((a, b) => getAssociateQuotaGap(b) - getAssociateQuotaGap(a))
    .slice(0, 6);
  const quickFocusTitle = associate
    ? `Ficha activa: ${getAssociateFullName(associate)}`
    : application
      ? `Solicitud activa: ${getAssociateApplicantName(application)}`
      : paymentSubmission
        ? "Justificante activo"
        : profileRequest
          ? "Cambio de ficha activo"
          : "Sin ficha seleccionada";
  const quickFocusDetail = associate
    ? `Socio #${associate.associateNumber} | ${associate.status} | ${associate.service || "Sin servicio"}`
    : application
      ? `${application.status} | ${application.email}`
      : paymentSubmission
        ? `${paymentSubmission.status} | ${paymentSubmission.year} | ${formatCurrency(paymentSubmission.amount)}`
        : profileRequest
          ? `${profileRequest.status} | ${profileRequest.email}`
          : "Usa los accesos de la izquierda o los botones del listado para fijar contexto.";

  return `
    <div class="panel-stack">
      <div class="mail-card">
        <h4>Centro de control</h4>
        <p class="muted">Ve directo a la bandeja o ficha que necesitas trabajar ahora.</p>
        <div class="stack">
          ${ASSOCIATE_SECTION_LINKS.map(
            (section) => `
              <button class="ghost-button section-jump-button" data-action="associate-section" data-section-id="${section.id}">
                ${section.label}
              </button>
            `
          ).join("")}
        </div>
      </div>

      <div class="mail-card">
        <h4>Resumen</h4>
        <p class="status-note info">
          <strong>${pendingApplications.length}</strong> solicitud(es),
          <strong>${pendingPaymentSubmissions.length}</strong> justificante(s),
          <strong>${pendingProfileRequests.length}</strong> cambio(s),
          <strong>${pendingQuotaAssociates.length}</strong> cuota(s) y
          <strong>${legacyReviewAssociates.length}</strong> legacy en revision.
        </p>
      </div>

      <div class="mail-card">
        <h4>Foco actual</h4>
        <p><strong>${escapeHtml(quickFocusTitle)}</strong></p>
        <p class="muted">${escapeHtml(quickFocusDetail)}</p>
        <div class="chip-row">
          ${
            associate
              ? `<button class="mini-button" data-action="associate-section" data-section-id="associateSectionWorkbench">Ir a ficha activa</button>`
              : ""
          }
          <button class="mini-button" data-action="associate-section" data-section-id="associateSectionPendingFees">Ir a cuotas pendientes</button>
          ${
            associate
              ? `<button class="mini-button" data-action="associate-section" data-section-id="associateSectionAssociates">Ir a tabla de socios</button>`
              : ""
          }
          ${
            application
              ? `<button class="mini-button" data-action="associate-section" data-section-id="associateSectionApplications">Ir a solicitudes</button>`
              : ""
          }
          ${
            paymentSubmission
              ? `<button class="mini-button" data-action="associate-section" data-section-id="associateSectionPayments">Ir a cuotas</button>`
              : ""
          }
          ${
            profileRequest
              ? `<button class="mini-button" data-action="associate-section" data-section-id="associateSectionProfiles">Ir a cambios</button>`
              : ""
          }
          ${
            application && application.status !== "Aprobada" && application.status !== "Rechazada"
              ? `<button class="mini-button" data-action="approve-associate" data-application-id="${application.id}" ${applicationReady ? "" : "disabled"}>Aprobar solicitud</button>`
              : ""
          }
          ${
            paymentSubmission?.status === "Pendiente de revision"
              ? `<button class="mini-button" data-action="approve-associate-payment" data-submission-id="${paymentSubmission.id}">Aprobar justificante</button>`
              : ""
          }
          ${
            profileRequest?.status === "Pendiente de revision"
              ? `<button class="mini-button" data-action="approve-associate-profile-request" data-request-id="${profileRequest.id}">Aprobar cambio</button>`
              : ""
          }
        </div>
      </div>

      ${
        application || paymentSubmission || profileRequest || associate
          ? `
            <div class="mail-card">
              <h4>Accion seleccionada</h4>
              <p><strong>${escapeHtml(quickFocusTitle)}</strong></p>
              <p class="muted">${escapeHtml(quickFocusDetail)}</p>
              ${
                application
                  ? `<p class="status-note ${applicationReady ? "success" : "warning"}">${
                      applicationReady
                        ? "La solicitud esta lista para aprobar."
                        : escapeHtml(applicationReadiness.blockers.join(" | ") || "Todavia falta revisar documentacion.")
                    }</p>`
                  : ""
              }
              <div class="chip-row">
                ${
                  nextPendingApplication
                    ? `<button class="mini-button" data-action="select-next-associate-application">Siguiente pendiente</button>`
                    : ""
                }
                ${
                  associate
                    ? `<button class="mini-button" data-action="associate-section" data-section-id="associateSectionWorkbench">Ir a ficha activa</button>`
                    : ""
                }
                ${
                  application && application.status !== "Aprobada" && application.status !== "Rechazada"
                    ? `<button class="mini-button" data-action="approve-associate" data-application-id="${application.id}" ${applicationReady ? "" : "disabled"}>Aprobar solicitud</button>`
                    : ""
                }
                ${
                  paymentSubmission?.status === "Pendiente de revision"
                    ? `<button class="mini-button" data-action="approve-associate-payment" data-submission-id="${paymentSubmission.id}">Aprobar justificante</button>`
                    : ""
                }
                ${
                  profileRequest?.status === "Pendiente de revision"
                    ? `<button class="mini-button" data-action="approve-associate-profile-request" data-request-id="${profileRequest.id}">Aprobar cambio</button>`
                    : ""
                }
                ${
                  associate && getAssociateQuotaGap(associate) > 0
                    ? `<button class="mini-button" data-action="mark-associate-paid" data-associate-id="${associate.id}" data-year="${currentYear}">Marcar pagado</button>`
                    : ""
                }
              </div>
            </div>
          `
          : ""
      }
      ${profileRequest ? renderAssociateProfileRequestComparison(profileRequest) : ""}
    </div>
  `;
}

function renderAssociateWorkbench(associate, campusAccount, campusMember, associatePayments, currentYear) {
  if (!associate) {
    return `<p class="muted">Selecciona un socio para editar su ficha y cuotas.</p>`;
  }

  const smtpReady = Boolean(
    state.settings?.smtp?.host && state.settings?.smtp?.port && state.settings?.smtp?.fromEmail
  );
  const canSendWelcome = Boolean(campusAccount && associate.email);
  const welcomeActionLabel = canSendWelcome ? "Enviar bienvenida" : "Crear acceso";
  const welcomePreview = buildAssociateWelcomePreviewText(associate, campusAccount, campusMember);
  const legacyIssues = getAssociateLegacyReviewIssues(associate);
  const accountRole = normalizeCampusAccountRole(campusAccount?.role);
  const ownAccountRoleLocked = Boolean(campusAccount?.id && campusAccount.id === session?.accountId);
  const accountRoleLockedReason = ownAccountRoleLocked
    ? "Estas viendo tu propia cuenta admin. Cambia este rol desde otra cuenta administradora."
    : !campusAccount
      ? "Primero crea el acceso al campus de este socio."
      : "";
  const reviewReadyToClose =
    associate.status === "Revisar documentacion" &&
    canCloseAssociateLegacyReview(associate) &&
    !legacyIssues.length;

  return `
    <div class="stack">
      <div class="chip-row">
        <span class="small-chip">Estado: ${escapeHtml(associate.status)}</span>
        <span class="small-chip">Servicio: ${escapeHtml(associate.service || "Sin servicio")}</span>
        <span class="small-chip">Campus: ${escapeHtml(associate.campusAccessStatus || "pending")}</span>
        <span class="small-chip">Rol: ${campusAccount ? escapeHtml(formatCampusAccountRole(campusAccount.role)) : "Sin cuenta"}</span>
        <span class="small-chip">Pendiente: ${formatCurrency(getAssociateQuotaGap(associate))}</span>
      </div>

      ${
        reviewReadyToClose
          ? `
            <div class="status-note success">
              La ficha ya tiene DNI/NIE, telefono, email y servicio. Ya puedes cerrar la revision documental.
            </div>
          `
          : ""
      }

      <div class="chip-row">
        <button class="mini-button" data-action="associate-section" data-section-id="associateSectionWorkbench">Ficha</button>
        ${
          getAssociateQuotaGap(associate) > 0
            ? `<button class="mini-button" data-action="mark-associate-paid" data-associate-id="${associate.id}" data-year="${currentYear}">Marcar pagado</button>`
            : ""
        }
        ${
          campusAccount
            ? `
              <button class="mini-button" data-action="send-associate-welcome" data-associate-id="${associate.id}">${welcomeActionLabel}</button>
              <button class="mini-button" data-action="reset-associate-campus-password" data-associate-id="${associate.id}">Restablecer contrasena</button>
              ${
                accountRole !== "admin"
                  ? `<button class="mini-button" data-action="create-associate-campus-admin-access" data-associate-id="${associate.id}">Hacer admin</button>`
                  : ""
              }
            `
            : `
              <button class="mini-button" data-action="create-associate-campus-access" data-associate-id="${associate.id}" ${associate.email ? "" : "disabled"}>Crear acceso socio</button>
              <button class="mini-button" data-action="create-associate-campus-admin-access" data-associate-id="${associate.id}" ${associate.email ? "" : "disabled"}>Crear acceso admin</button>
            `
        }
        ${
          associate.status === "Revisar documentacion"
            ? `<button class="mini-button" data-action="mark-associate-reviewed" data-associate-id="${associate.id}" ${canCloseAssociateLegacyReview(associate) ? "" : "disabled"}>Cerrar revision</button>`
            : ""
        }
        <button class="mini-button" data-action="associate-section" data-section-id="associateSectionPendingFees">Cuotas</button>
        <button class="mini-button" data-action="associate-section" data-section-id="associateSectionProfiles">Cambios</button>
      </div>

      <form id="associateEditForm" class="stack">
        <div class="course-grid">
          <label class="inline-field">
            Numero de socio
            <input id="editAssociateNumber" type="number" min="1" value="${associate.associateNumber}" />
          </label>
          <label class="inline-field">
            Estado
            <select id="editAssociateStatus">
              ${["Activa", "Pendiente cuota", "Baja", "Revisar documentacion", "Solicitud recibida", "En revision", "Pendiente de pago"].map((status) => `<option value="${status}" ${associate.status === status ? "selected" : ""}>${status}</option>`).join("")}
            </select>
          </label>
          <label class="inline-field">
            Nombre
            <input id="editAssociateFirstName" value="${escapeHtml(associate.firstName)}" />
          </label>
          <label class="inline-field">
            Apellidos
            <input id="editAssociateLastName" value="${escapeHtml(associate.lastName)}" />
          </label>
          <label class="inline-field">
            DNI
            <input id="editAssociateDni" value="${escapeHtml(associate.dni)}" />
          </label>
          <label class="inline-field">
            Telefono
            <input id="editAssociatePhone" value="${escapeHtml(associate.phone)}" />
          </label>
          <label class="inline-field">
            E-mail
            <input id="editAssociateEmail" type="email" value="${escapeHtml(associate.email)}" />
          </label>
          <label class="inline-field">
            Servicio
            <input id="editAssociateService" value="${escapeHtml(associate.service)}" />
          </label>
          <label class="inline-field">
            Ultima cuota
            <input id="editAssociateLastQuotaMonth" value="${escapeHtml(associate.lastQuotaMonth || "")}" />
          </label>
          <label class="inline-field">
            Anual
            <input id="editAssociateAnnual" type="number" min="0" value="${associate.annualAmount || 0}" />
          </label>
          <label class="inline-field">
            Rol de acceso
            <select id="editAssociateAccountRole" ${campusAccount && !ownAccountRoleLocked ? "" : "disabled"} title="${escapeHtml(accountRoleLockedReason)}">
              ${Object.entries(CAMPUS_ACCOUNT_ROLE_LABELS)
                .map(
                  ([role, label]) =>
                    `<option value="${role}" ${accountRole === role ? "selected" : ""}>${label}</option>`
                )
                .join("")}
            </select>
            ${
              accountRoleLockedReason
                ? `<span class="field-help">${escapeHtml(accountRoleLockedReason)}</span>`
                : `<span class="field-help">Este rol define si entra como socio/alumno o como administracion.</span>`
            }
          </label>
        </div>

        <div class="course-grid">
          <label class="inline-field">
            2024
            <input id="editAssociateFee2024" type="number" min="0" value="${associate.manualYearlyFees?.["2024"] || 0}" />
          </label>
          <label class="inline-field">
            2025
            <input id="editAssociateFee2025" type="number" min="0" value="${associate.manualYearlyFees?.["2025"] || 0}" />
          </label>
          <label class="inline-field">
            2026
            <input id="editAssociateFee2026" type="number" min="0" value="${associate.manualYearlyFees?.["2026"] || 0}" />
          </label>
          <label class="inline-field">
            2027
            <input id="editAssociateFee2027" type="number" min="0" value="${associate.manualYearlyFees?.["2027"] || 0}" />
          </label>
        </div>

        <label class="inline-field">
          Observaciones
          <textarea id="editAssociateObservations">${escapeHtml(associate.observations || "")}</textarea>
        </label>
        <p class="muted">Persona interna: ${campusMember ? escapeHtml(campusMember.name) : "No vinculada"} | Cuenta: ${campusAccount ? `${escapeHtml(campusAccount.email)} (${escapeHtml(formatCampusAccountRole(campusAccount.role))})` : "No creada"} | Total ${currentYear}: ${formatCurrency(getAssociateFeeForYear(associate, currentYear))} / ${formatCurrency(associate.annualAmount || 0)}</p>
        ${
          campusAccount && ownAccountRoleLocked
            ? `<p class="status-note warning">Estas viendo tu propia cuenta. Para evitar bloquearte por error, el rol se cambia desde otra cuenta administradora.</p>`
            : !campusAccount
              ? `
                <p class="status-note warning">Crea primero el acceso al campus para poder asignar rol.</p>
                <div class="chip-row">
                  <button class="mini-button" type="button" data-action="create-associate-campus-access" data-associate-id="${associate.id}" ${associate.email ? "" : "disabled"}>Crear acceso socio</button>
                  <button class="mini-button" type="button" data-action="create-associate-campus-admin-access" data-associate-id="${associate.id}" ${associate.email ? "" : "disabled"}>Crear acceso admin</button>
                </div>
              `
              : `<p class="status-note">El rol define si esta cuenta entra como socio/alumno o como administracion.</p>`
        }
        <button class="primary-button" type="submit">Guardar ficha de socio</button>
      </form>

      <div class="course-grid">
        <div class="mail-card">
          <h4>Acceso al campus</h4>
          <p>Bienvenida: ${escapeHtml(associate.welcomeEmailStatus || "pending")}</p>
          ${
            !campusAccount
              ? `<p class="status-note warning">Todavia no existe acceso completo al campus. Primero hay que crear la cuenta del socio.</p>`
              : !smtpReady
                ? `<p class="status-note warning">Ahora mismo la bienvenida quedara en pendiente porque no hay SMTP configurado.</p>`
                : `<p class="status-note">La bienvenida se enviara al correo de la ficha del socio con el mensaje institucional del campus.</p>`
          }
          ${
            associate.temporaryPassword
              ? `<p class="muted">Contrasena temporal: ${escapeHtml(associate.temporaryPassword)}</p>`
              : ""
          }
          ${
            associate.lastQuotaReminderAt
              ? `<p class="muted">Ultimo recordatorio de cuota: ${escapeHtml(formatDateTime(associate.lastQuotaReminderAt))}</p>`
              : ""
          }
          <details class="welcome-preview">
            <summary>Ver mensaje de bienvenida</summary>
            <pre class="email-preview">${escapeHtml(welcomePreview)}</pre>
          </details>
        </div>

        <div class="mail-card">
          <h4>Registrar pago</h4>
          <form id="associatePaymentForm" class="stack">
            <label class="inline-field">
              Fecha
              <input id="associatePaymentDate" type="date" value="${getTodayDateInput()}" />
            </label>
            <label class="inline-field">
              Anio
              <input id="associatePaymentYear" type="number" min="2024" value="${currentYear}" />
            </label>
            <label class="inline-field">
              Importe
              <input id="associatePaymentAmount" type="number" min="1" step="1" placeholder="50" />
            </label>
            <label class="inline-field">
              Metodo
              <select id="associatePaymentMethod">
                ${["Transferencia", "Efectivo", "Bizum", "TPV", "Ajuste manual"].map((method) => `<option value="${method}">${method}</option>`).join("")}
              </select>
            </label>
            <label class="inline-field">
              Nota
              <input id="associatePaymentNote" placeholder="Ej. cuota anual, regularizacion, pago parcial..." />
            </label>
            <button class="primary-button" type="submit">Registrar pago</button>
          </form>
        </div>
      </div>

      <div class="mail-card">
        <h4>Historial de movimientos</h4>
        ${
          associatePayments.length
            ? associatePayments
                .map(
                  (payment) => `
                    <div class="timeline-item">
                      <div class="row-between">
                        <strong>${formatCurrency(payment.amount)} | ${escapeHtml(payment.method)}</strong>
                        <button class="mini-button" data-action="delete-associate-payment" data-associate-id="${associate.id}" data-payment-id="${payment.id}">Eliminar</button>
                      </div>
                      <p>${escapeHtml(payment.year)} | ${escapeHtml(formatDate(payment.date))}</p>
                      <p class="muted">${escapeHtml(payment.note || "Sin nota")} | ${escapeHtml(payment.createdBy || "Sistema")}</p>
                    </div>
                  `
                )
                .join("")
            : `<p class="muted">Todavia no hay pagos registrados para este socio.</p>`
        }
      </div>
    </div>
  `;
}

function buildAssociateWelcomePreviewText(associate, campusAccount, campusMember) {
  const organization = state.settings?.organization || "Isocrona Zero";
  const displayName =
    getAssociateFullName(associate) || campusAccount?.name || campusMember?.name || "socio";
  const loginEmail = campusAccount?.email || associate?.email || "";
  const hasTemporaryPassword = Boolean(campusAccount?.mustChangePassword);
  const tempPassword = hasTemporaryPassword ? associate?.temporaryPassword || campusAccount?.password || "" : "";
  const service = String(associate?.service || "").trim();
  const contactEmail = state.settings?.smtp?.fromEmail || "administracion@isocronazero.org";

  return [
    `Hola ${displayName},`,
    "",
    `Te damos la bienvenida a ${organization}. Tu alta como socio ya ha sido aprobada y tu acceso al campus ha quedado activado.`,
    "",
    `Nos alegra contar contigo en esta etapa. ${organization} quiere ser un espacio de colaboracion, cooperacion y solidaridad, donde sigamos creciendo juntos desde el aprendizaje comun, la formacion continua y el compromiso con el servicio.`,
    "",
    "Dentro del campus encontraras un punto de encuentro para tu vida dentro de la asociacion:",
    "- Tu ficha de socio y tu estado administrativo.",
    "- Cursos, inscripciones y seguimiento del aula virtual.",
    "- Diplomas y certificados disponibles.",
    "- Grupos internos con documentacion, fichas de practica, videos y enlaces de interes.",
    "",
    hasTemporaryPassword ? "Datos de acceso inicial:" : "Datos de acceso:",
    `- Usuario: ${loginEmail || "pendiente de configurar"}`,
    hasTemporaryPassword
      ? `- Contrasena temporal: ${tempPassword || "pendiente de generar"}`
      : "- Contrasena: usa la contrasena que ya configuraste en el campus.",
    service ? `- Servicio asociado: ${service}` : "",
    "",
    "Primeros pasos recomendados:",
    hasTemporaryPassword
      ? "1. Entra en el campus y cambia tu contrasena en el primer acceso."
      : "1. Entra en el campus con tu contrasena actual.",
    "2. Revisa que tu ficha de socio este correcta, especialmente DNI/NIE, telefono y email.",
    "3. Consulta los cursos disponibles e inscribete en aquellos que correspondan a tu actividad.",
    "4. Revisa tus grupos internos para acceder a material operativo y formativo.",
    "",
    "Como funcionamos:",
    "- La comunicacion administrativa se centraliza desde el campus y el correo asociado.",
    "- Las inscripciones a cursos pueden requerir validacion o justificante de pago segun la actividad.",
    "- Los diplomas se habilitan cuando constan la asistencia, la evaluacion y los requisitos de cierre.",
    "- Queremos que el campus sea una herramienta util para compartir conocimiento, coordinarnos mejor y avanzar juntos.",
    "",
    "Si detectas algun error en tus datos, puedes entrar en tu ficha y solicitar el cambio directamente desde el propio campus.",
    `Si necesitas apoyo o prefieres escribirnos, puedes hacerlo a ${contactEmail}.`,
    "",
    "Gracias por formar parte de este proyecto comun.",
    `Bienvenido a ${organization}.`,
    `Equipo de administracion y formacion - ${organization}`
  ]
    .filter(Boolean)
    .join("\n");
}

function renderJoinSide() {
  if (!isAdminView()) {
    const associate = getCurrentAssociate();
    const reviewIssues = getAssociateLegacyReviewIssues(associate);
    return `
      <div class="panel-stack">
        <div>
          <p class="eyebrow">Tu ficha de socio</p>
          <h3>Estado rapido</h3>
        </div>
        <div class="timeline-item">
          <p>Estado</p>
          <strong>${escapeHtml(associate?.status || "Sin ficha")}</strong>
        </div>
        <div class="timeline-item">
          <p>Numero de socio</p>
          <strong>${escapeHtml(associate?.associateNumber || "-")}</strong>
        </div>
        <div class="timeline-item">
          <p>Campus</p>
          <strong>${escapeHtml(associate?.campusAccessStatus || "activo")}</strong>
        </div>
        <div class="timeline-item">
          <p>Revision</p>
          <strong>${reviewIssues.length ? escapeHtml(reviewIssues.join(" | ")) : "Sin incidencias abiertas"}</strong>
        </div>
      </div>
    `;
  }

  return `
    <div class="panel-stack">
      <div class="assistant-card">
        <h4>Accion principal</h4>
        <p>Este acceso esta pensado para ponerlo luego visible tambien dentro de la web real de la asociacion.</p>
        <a class="primary-button" href="/join.html">Hazte socio ahora</a>
      </div>

      <div class="mail-card">
        <h4>Lo que ya hace el sistema</h4>
        <p>Recoge solicitud, guarda justificantes, pasa a revision, asigna numero de socio y deja trazabilidad.</p>
      </div>

      <div class="mail-card">
        <h4>Estado actual</h4>
        <p>Solicitudes pendientes: ${countPendingAssociateApplications()}</p>
        <p>Socios activos: ${state.associates.filter((item) => item.status === "Activa").length}</p>
        <div class="chip-row">
          <button class="ghost-button" data-action="nav" data-view="associates">Revisar solicitudes</button>
        </div>
      </div>
    </div>
  `;
}

function renderMembers() {
  const selectedMember = findMember(state.selectedMemberId);
  const showMemberSection = (section) => membersSectionMode === "all" || membersSectionMode === section;
  const membersWithAccess = state.members.filter((member) => findAccountByMember(member.id)).length;
  const membersWithoutAccess = state.members.length - membersWithAccess;
  const renewalsDueCount = state.members.filter((member) => Number(member.renewalsDue || 0) > 0).length;
  return `
    <div class="panel-stack">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Personas y accesos</p>
          <h3>Alta de bomberos, voluntariado y cuentas de acceso</h3>
        </div>
      </div>

      <div class="status-note info">
        ${membersWithAccess} con acceso, ${membersWithoutAccess} sin acceso y ${renewalsDueCount} con seguimiento. ${
          selectedMember
            ? `Tienes abierta la ficha de ${escapeHtml(selectedMember.name)}.`
            : "Busca una persona o abre la ficha desde el listado."
        }
      </div>

      <div class="chip-row">
        <button class="${membersSectionMode === "all" ? "primary-button" : "ghost-button"}" data-action="set-member-section-mode" data-mode="all">Todo</button>
        <button class="${membersSectionMode === "workbench" ? "primary-button" : "ghost-button"}" data-action="set-member-section-mode" data-mode="workbench">Ficha</button>
        <button class="${membersSectionMode === "create" ? "primary-button" : "ghost-button"}" data-action="set-member-section-mode" data-mode="create">Alta</button>
        <button class="${membersSectionMode === "import" ? "primary-button" : "ghost-button"}" data-action="set-member-section-mode" data-mode="import">Importacion</button>
        <button class="${membersSectionMode === "directory" ? "primary-button" : "ghost-button"}" data-action="set-member-section-mode" data-mode="directory">Listado</button>
      </div>

      ${
        showMemberSection("workbench")
          ? `
      <section class="mail-card associate-anchor" id="memberSectionWorkbench">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Ficha activa</p>
            <h4>${selectedMember ? escapeHtml(selectedMember.name) : "Selecciona una persona"}</h4>
          </div>
        </div>
        ${renderMemberWorkbench(selectedMember)}
      </section>
      `
          : ""
      }

      ${
        showMemberSection("create")
          ? `
      <section class="associate-anchor" id="memberSectionCreate">
      <form id="memberForm" class="table-card">
        <table>
          <tbody>
            <tr>
              <td><input id="memberName" placeholder="Nombre completo" /></td>
              <td><input id="memberRole" placeholder="Rol operativo" /></td>
            </tr>
            <tr>
              <td><input id="memberEmail" type="email" placeholder="correo@isocronazero.org" /></td>
              <td><input id="memberRenewals" type="number" min="0" placeholder="Renovaciones pendientes" /></td>
            </tr>
            <tr>
              <td colspan="2"><input id="memberCertifications" placeholder="Certificaciones separadas por comas" /></td>
            </tr>
            <tr>
              <td><input id="memberAccessPassword" placeholder="Contrasena de acceso opcional" /></td>
              <td>
                <select id="memberAccessRole">
                  <option value="member">Acceso alumno</option>
                  <option value="admin">Acceso administracion</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="toolbar" style="padding: 0 14px 14px;">
          <button class="primary-button" type="submit">Crear persona</button>
        </div>
      </form>
      </section>
      `
          : ""
      }

      ${
        showMemberSection("import")
          ? `
      <section class="associate-anchor" id="memberSectionImport">
      <form id="memberImportForm" class="mail-card">
        <h4>Importacion rapida de personas por CSV</h4>
        <p class="muted">Cabeceras admitidas: <code>name;role;email;certifications;renewalsDue;accessPassword;accessRole</code></p>
        <textarea
          id="memberImportCsv"
          placeholder="name;role;email;certifications;renewalsDue;accessPassword;accessRole&#10;Ana Lopez;Voluntaria;ana@isocronazero.org;ERA|Primeros auxilios;1;bomberos123;member"
        ></textarea>
        <div class="toolbar">
          <a class="button-link" href="/api/templates/members.csv">Descargar plantilla</a>
          <button class="ghost-button" type="submit">Importar personas</button>
        </div>
      </form>
      </section>
      `
          : ""
      }

      ${
        showMemberSection("directory")
          ? `
      <div class="table-card associate-anchor" id="memberSectionDirectory">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Listado operativo</p>
            <h4>Personas registradas</h4>
          </div>
        </div>
        <div class="compact-list">
          ${state.members
            .map((member) => {
              const account = findAccountByMember(member.id);
              const certifications = member.certifications || [];
              const associate = member.associateId ? findAssociate(member.associateId) : null;
              return `
                <article class="compact-person-row compact-person-row-stacked">
                  <div class="compact-person-main">
                    <strong>${escapeHtml(member.name)}</strong>
                    <p class="muted">${escapeHtml(member.email)} | ${escapeHtml(member.role)}</p>
                    <div class="chip-row">
                      <span class="chip">${account ? `Acceso ${escapeHtml(account.role)}` : "Sin acceso"}</span>
                      <span class="chip">${certifications.length} certificacion(es)</span>
                      <span class="chip">${member.renewalsDue || 0} renovacion(es)</span>
                      ${
                        associate
                          ? `<span class="chip">Socio #${escapeHtml(associate.number || "-")}</span>`
                          : ""
                      }
                    </div>
                  </div>
                  <div class="chip-row compact-person-actions">
                    <button class="mini-button" data-action="select-member" data-member-id="${member.id}">Ver ficha</button>
                    ${
                      associate
                        ? `<button class="mini-button" data-action="open-linked-associate" data-member-id="${member.id}">Abrir socio</button>`
                        : ""
                    }
                    <button class="mini-button" data-action="delete-member" data-member-id="${member.id}">Eliminar</button>
                  </div>
                </article>
              `;
            })
            .join("")}
        </div>
      </div>
      `
          : ""
      }
    </div>
  `;
}

function renderCampusGroupEntryList(entries, emptyMessage, options = {}) {
  const category = options.category || "";
  const editable = Boolean(options.editable);
  const categoryLabelMap = {
    documents: "Documento o PDF",
    practiceSheets: "Ficha de práctica",
    videos: "Video",
    links: "Enlace"
  };
  const categoryPlaceholderMap = {
    documents: "Pega una URL o sube un PDF/archivo local",
    practiceSheets: "Pega una URL o sube la ficha en PDF",
    videos: "Pega un enlace de YouTube, Vimeo o video interno",
    links: "Pega un enlace de interés"
  };
  if (!entries.length) {
    return `<div class="empty-state">${escapeHtml(emptyMessage)}</div>`;
  }

  return entries
    .map(
      (entry) => {
        const attachmentDraft =
          options.groupId && options.moduleId
            ? campusGroupAttachmentDrafts[getCampusGroupAttachmentDraftKey(options.groupId, options.moduleId, category, entry.id)] || null
            : null;
        const visibleAttachment = entry.attachment || attachmentDraft;
        const resourceLabel = getCampusGroupCategoryLabel(category);
        const resourceIcon = getCampusGroupCategoryIcon(category);
        const resourceMeta = getCampusGroupResourceMeta(entry, category, visibleAttachment);
        return `
        <article class="lesson-card ${editable ? "campus-group-editor-row" : "campus-library-card"}" ${editable ? `data-campus-group-category="${category}" data-entry-id="${escapeHtml(entry.id)}"` : ""}>
          ${
            editable
              ? `
                <div class="campus-library-card-topline">
                  <span class="small-chip campus-library-card-kind">${escapeHtml(resourceIcon)}</span>
                  <span class="eyebrow">${escapeHtml(resourceLabel)}</span>
                </div>
                <div class="lesson-grid">
                  <label class="inline-field">
                    Titulo
                    <input data-campus-group-field="title" value="${escapeHtml(entry.title)}" placeholder="${escapeHtml(categoryLabelMap[category] || "Recurso")}" />
                  </label>
                  <label class="inline-field">
                    URL / archivo
                    <input data-campus-group-field="url" value="${escapeHtml(entry.url)}" placeholder="${escapeHtml(categoryPlaceholderMap[category] || "URL del recurso")}" />
                  </label>
                  <label class="inline-field lesson-notes">
                    Nota
                    <textarea data-campus-group-field="note">${escapeHtml(entry.note || "")}</textarea>
                  </label>
                </div>
                <input type="hidden" data-campus-group-field="attachment" value="${visibleAttachment ? escapeHtml(JSON.stringify(visibleAttachment)) : ""}" />
                <div class="chip-row campus-group-entry-tools">
                  ${
                    ["documents", "practiceSheets"].includes(category)
                      ? `
                        <label class="inline-field file-input-field">
                          Archivo adjunto
                          <input
                            class="native-file-input"
                            type="file"
                            data-campus-group-file-input="true"
                            data-category="${category}"
                            data-entry-id="${escapeHtml(entry.id)}"
                            accept="${escapeHtml(getCampusGroupFileAccept(category))}"
                          />
                        </label>
                      `
                      : `<span class="small-chip">En esta categoria los recursos se guardan por enlace, no por archivo local</span>`
                  }
                  ${
                    visibleAttachment
                      ? `<span class="small-chip campus-group-attachment-name">${escapeHtml(visibleAttachment.name || "Archivo adjunto")}</span>${renderCampusGroupAttachmentActions(visibleAttachment)}`
                      : `<span class="small-chip">Sin archivo adjunto</span>`
                  }
                </div>
                <div class="chip-row">
                  <button class="mini-button" type="button" data-action="remove-campus-group-entry" data-category="${category}" data-entry-id="${entry.id}">Eliminar</button>
                </div>
              `
              : `
                <div class="campus-library-card-topline">
                  <span class="small-chip campus-library-card-kind">${escapeHtml(resourceIcon)}</span>
                  <span class="eyebrow">${escapeHtml(resourceLabel)}</span>
                </div>
                <strong>${escapeHtml(entry.title || "Sin titulo")}</strong>
                <div class="chip-row compact-chip-row campus-library-meta">
                  <span class="small-chip">${escapeHtml(resourceMeta)}</span>
                  ${
                    visibleAttachment
                      ? `<span class="small-chip campus-group-attachment-name">${escapeHtml(visibleAttachment.name || "Archivo adjunto")}</span>`
                      : ""
                  }
                </div>
                ${
                  visibleAttachment
                    ? `<p>${renderCampusGroupAttachmentActions(visibleAttachment)}</p>`
                    : entry.url
                      ? `<p><a class="button-link" href="${escapeHtml(entry.url)}" target="_blank" rel="noreferrer">Abrir recurso</a></p>`
                      : ""
                }
                ${!visibleAttachment && entry.url ? `<p class="muted">${escapeHtml(entry.url)}</p>` : ""}
                <p class="muted">${escapeHtml(entry.note || "Sin descripcion adicional.")}</p>
              `
          }
        </article>
      `;
      }
    )
    .join("");
}

function renderCampusGroupsSection() {
  const selectedGroup = getSelectedCampusGroup();
  const editable = isAdminView();
  const categoryConfig = [
    { key: "documents", label: "Documentos", emptyMessage: "Todavia no hay documentos internos en este grupo." },
    {
      key: "practiceSheets",
      label: "Fichas de practica",
      emptyMessage: "Todavia no hay fichas de practica internas en este grupo."
    },
    { key: "videos", label: "Videos", emptyMessage: "Todavia no hay videos internos en este grupo." },
    { key: "links", label: "Enlaces de interes", emptyMessage: "Todavia no hay enlaces internos en este grupo." }
  ];
  const activeCategory =
    categoryConfig.find((item) => item.key === campusGroupContentMode) || categoryConfig[0];
  const selectedModule = getSelectedCampusGroupModule(selectedGroup);
  const moduleCount = selectedGroup?.modules?.length || 0;
  const groupResourceCount = selectedGroup ? countCampusGroupResources(selectedGroup) : 0;
  const selectedCategoryEntries = selectedModule?.[activeCategory.key] || [];
  const visibleCategoryEntries = sortCampusGroupEntries(
    selectedCategoryEntries.filter(
      (entry) =>
        entryMatchesCampusGroupQuery(entry, activeCategory.key, campusGroupSearchQuery) &&
        entryMatchesCampusGroupResourceFilter(entry, campusGroupResourceFilter)
    )
  );
  const renderCategory = (title, category, entries, emptyMessage) => `
    <div class="content-module">
      <div class="module-head">
        <div>
          <p class="eyebrow">Modulo interno</p>
          <h4>${title}</h4>
          <p class="muted">${
            category === "documents"
              ? "Sube PDF o archivos internos y dejalos accesibles para el grupo."
              : category === "practiceSheets"
                ? "Reune fichas de practica y material de despliegue para el trabajo interno."
                : category === "videos"
                  ? "Guarda enlaces a videos tecnicos o clips internos del grupo."
                  : "Agrupa enlaces de interes, normativa o referencia externa."
          }</p>
        </div>
        ${
          editable
            ? `<button class="ghost-button" type="button" data-action="add-campus-group-entry" data-category="${category}">Anadir recurso</button>`
            : `<span class="small-chip">${entries.length} recurso(s)</span>`
        }
      </div>
      ${renderCampusGroupEntryList(entries, entries.length ? emptyMessage : (selectedCategoryEntries.length ? "No hay recursos que coincidan con la busqueda o el filtro actual." : emptyMessage), {
        editable,
        category,
        groupId: selectedGroup?.id || "",
        moduleId: selectedModule?.id || ""
      })}
    </div>
  `;

  return `
    <section class="panel-stack associate-anchor" id="campusSectionGroups">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Grupos internos</p>
          <h3>Bibliotecas internas por especialidad</h3>
          <p class="muted">Entra en un grupo y trabaja su contenido sin mezclarlo con el resto del campus.</p>
        </div>
      </div>

      <div class="group-selector-grid">
        ${state.campusGroups
          .map((baseGroup) => {
            const group = loadCampusDraft(baseGroup.id) || baseGroup;
            const totalItems = countCampusGroupResources(group);
            return `
              <button class="group-selector-card ${selectedGroup?.id === group.id ? "group-selector-card-active" : ""}" type="button" data-action="select-campus-group" data-group-id="${group.id}">
                <span class="eyebrow">Grupo interno</span>
                <strong>${escapeHtml(group.title)}</strong>
                <p>${escapeHtml(group.summary || "Sin resumen definido.")}</p>
                <span class="small-chip">${group.modules?.length || 0} modulo(s)</span>
                <span class="small-chip">${totalItems} recurso(s)</span>
              </button>
            `;
          })
          .join("")}
      </div>

      ${
        selectedGroup
          ? `
            <div class="panel-stack">
              <div class="content-module">
                <div class="module-head">
                  <div>
                    <p class="eyebrow">Grupo activo</p>
                    <h4>${escapeHtml(selectedGroup.title)}</h4>
                    <p class="muted">${escapeHtml(selectedGroup.summary || "Sin resumen todavia.")}</p>
                  </div>
                  <span class="small-chip">${moduleCount} modulo(s)</span>
                </div>
                <div class="chip-row compact-chip-row campus-group-meta-row">
                  <span class="small-chip">Modulos: ${moduleCount}</span>
                  <span class="small-chip">Recursos: ${groupResourceCount}</span>
                  <span class="small-chip">Modulo activo: ${escapeHtml(selectedModule?.title || "Sin modulo")}</span>
                  <span class="small-chip">${countCampusGroupModuleResources(selectedModule)} recurso(s) en trabajo</span>
                </div>
                ${
                  editable
                    ? `
                      <div class="studio-grid">
                        <label class="inline-field">
                          Nombre del grupo
                          <input id="campusGroupTitle" value="${escapeHtml(selectedGroup.title)}" />
                        </label>
                        <label class="inline-field studio-full">
                          Resumen
                          <textarea id="campusGroupSummary">${escapeHtml(selectedGroup.summary || "")}</textarea>
                        </label>
                      </div>
                    `
                    : ""
                }
                <div class="chip-row campus-module-strip">
                  ${(selectedGroup.modules || [])
                    .map(
                      (module) => `
                        <button class="${selectedModule?.id === module.id ? "primary-button" : "ghost-button"} campus-module-summary-card" type="button" data-action="select-campus-group-module" data-module-id="${module.id}">
                          ${escapeHtml(module.title)} (${countCampusGroupModuleResources(module)})
                        </button>
                      `
                    )
                    .join("")}
                  ${
                    editable
                      ? `<button class="ghost-button" type="button" data-action="add-campus-group-module">Anadir modulo</button>`
                      : ""
                  }
                </div>
                ${
                  selectedModule && editable
                    ? `
                      <div class="studio-grid">
                        <label class="inline-field">
                          Nombre del modulo
                          <input id="campusGroupModuleTitle" value="${escapeHtml(selectedModule.title)}" />
                        </label>
                        <label class="inline-field studio-full">
                          Resumen del modulo
                          <textarea id="campusGroupModuleSummary">${escapeHtml(selectedModule.summary || "")}</textarea>
                        </label>
                      </div>
                    `
                    : selectedModule
                      ? `<div class="timeline-item compact-timeline-item"><strong>${escapeHtml(selectedModule.title)}</strong><p class="muted">${escapeHtml(selectedModule.summary || "Sin resumen todavia.")}</p></div>`
                      : ""
                }
                <div class="chip-row compact-chip-row">
                  ${categoryConfig
                    .map(
                      (item) => `
                        <button class="${campusGroupContentMode === item.key ? "primary-button" : "ghost-button"}" type="button" data-action="set-campus-group-content-mode" data-mode="${item.key}">
                          ${item.label}
                        </button>
                      `
                    )
                    .join("")}
                </div>
                <div class="studio-grid campus-group-toolbar">
                  <label class="inline-field">
                    Buscar recurso
                    <input id="campusGroupSearchQuery" value="${escapeHtml(campusGroupSearchQuery)}" placeholder="Titulo, nota, URL, archivo..." />
                  </label>
                  <label class="inline-field">
                    Mostrar
                    <select id="campusGroupResourceFilter" data-action="set-campus-group-resource-filter">
                      <option value="all" ${campusGroupResourceFilter === "all" ? "selected" : ""}>Todos</option>
                      <option value="with-attachment" ${campusGroupResourceFilter === "with-attachment" ? "selected" : ""}>Con archivo</option>
                      <option value="links-only" ${campusGroupResourceFilter === "links-only" ? "selected" : ""}>Solo enlaces</option>
                    </select>
                  </label>
                </div>
                <div class="chip-row compact-chip-row campus-group-meta-row">
                  <span class="small-chip">Visibles: ${visibleCategoryEntries.length}</span>
                  <span class="small-chip">Totales en ${escapeHtml(activeCategory.label)}: ${selectedCategoryEntries.length}</span>
                  ${
                    campusGroupSearchQuery
                      ? `<span class="small-chip">Busqueda: ${escapeHtml(campusGroupSearchQuery)}</span>`
                      : ""
                  }
                </div>
                ${
                  editable
                    ? `
                      <div class="chip-row compact-chip-row">
                        <button class="primary-button" type="button" data-action="save-campus-group">Guardar grupo interno</button>
                        <span class="small-chip">Los cambios del grupo activo se guardan aqui</span>
                      </div>
                    `
                    : ""
                }
              </div>

              ${
                selectedModule
                  ? renderCategory(
                      `${activeCategory.label} · ${selectedModule.title}`,
                      activeCategory.key,
                      visibleCategoryEntries,
                      activeCategory.emptyMessage
                    )
                  : `<div class="empty-state">Selecciona o crea un modulo interno para empezar a ordenar recursos.</div>`
              }

              ${
                ""
              }
            </div>
          `
          : `<div class="empty-state">Selecciona un grupo interno para abrir su biblioteca.</div>`
      }
    </section>
  `;
}

function renderCampus() {
  const selectedCourse = getSelectedCourse();
  const selectedGroup = getSelectedCampusGroup();
  const selectedMember = findMember(state.selectedMemberId);
  const campusOnlySession = isCampusOnlySession();
  const effectiveCampusSectionMode =
    !isAdminView() && ["operations", ...(campusOnlySession ? ["groups"] : [])].includes(campusSectionMode)
      ? "courses"
      : campusSectionMode;
  const showCampusSection = (section) => effectiveCampusSectionMode === section;
  const pendingDiplomas = state.courses.reduce(
    (sum, course) => sum + Math.max((course.diplomaReady || []).length - (course.mailsSent || []).length, 0),
    0
  );
  const activeStudentCourseCount = state.courses.filter((course) => (course.enrolledIds || []).length > 0).length;
  const groupResourceCount = state.campusGroups.reduce(
    (sum, group) =>
      sum +
      (group.documents || []).length +
      (group.practiceSheets || []).length +
      (group.videos || []).length +
      (group.links || []).length,
    0
  );
  const memberBuckets = !isAdminView() && selectedMember ? getMemberCourseBuckets(selectedMember.id) : null;
  const memberCourses = !isAdminView() && selectedMember
    ? state.courses.filter(
        (course) =>
          course.enrolledIds.includes(selectedMember.id) ||
          course.waitingIds.includes(selectedMember.id) ||
          course.diplomaReady.includes(selectedMember.id)
      )
    : [];
  const nextSessionLabel =
    !isAdminView() && memberCourses.length
      ? memberCourses
          .flatMap((course) =>
            (course.sessions || []).map((session) => ({
              courseTitle: course.title,
              title: session.title || "Sesion",
              date: session.date || course.startDate || ""
            }))
          )
          .filter((session) => session.date)
          .sort((left, right) => String(left.date).localeCompare(String(right.date)))
          .slice(0, 1)
          .map((session) => `${session.courseTitle}: ${session.title}`)
          .join("")
      : "";
  const memberAlerts = !isAdminView() && selectedMember ? getMemberCampusAlerts(selectedMember.id) : [];
  const featuredManualNotice =
    !isAdminView() && selectedMember
      ? getVisibleManualCampusNotices(selectedMember.id, memberCourses)[0] || null
      : null;
  const renderCampusHub = () => `
    <section class="${isAdminView() ? "campus-overview-grid" : "campus-member-hub"}">
        ${
          isAdminView()
            ? `
              <div class="status-note info">
                Ahora mismo tienes <strong>${state.courses.length}</strong> curso(s), <strong>${activeStudentCourseCount}</strong> con alumnado, <strong>${pendingDiplomas}</strong> diploma(s) pendientes y <strong>${groupResourceCount}</strong> recurso(s) en bibliotecas internas.
              </div>
              <div class="chip-row">
                <button class="ghost-button" type="button" data-action="set-campus-section-mode" data-mode="courses">Cursos</button>
                <button class="ghost-button" type="button" data-action="set-campus-section-mode" data-mode="operations">Operativa</button>
                <button class="ghost-button" type="button" data-action="set-campus-section-mode" data-mode="diplomas">Diplomas</button>
                <button class="ghost-button" type="button" data-action="set-campus-section-mode" data-mode="groups">Grupos internos</button>
              </div>
            `
            : `
              <div class="status-note info">
                ${
                  memberAlerts.length
                    ? `Ahora mismo tienes <strong>${memberAlerts.length}</strong> aviso(s) y tu siguiente sesion es <strong>${escapeHtml(nextSessionLabel || "sin fecha cerrada")}</strong>.`
                    : `No tienes nada urgente pendiente. Tu siguiente sesion es <strong>${escapeHtml(nextSessionLabel || "sin fecha cerrada")}</strong>.`
                }
              </div>
              ${
                featuredManualNotice
                  ? `
                    <div class="status-note ${featuredManualNotice.tone === "warning" ? "warning" : featuredManualNotice.tone === "success" ? "success" : "info"}">
                      <strong>${escapeHtml(featuredManualNotice.title)}</strong>: ${escapeHtml(featuredManualNotice.detail)}
                      ${
                        featuredManualNotice.courseId
                          ? `<button class="mini-button" type="button" data-action="select-course" data-course-id="${featuredManualNotice.courseId}">${escapeHtml(featuredManualNotice.actionLabel || "Abrir curso")}</button>`
                          : `<button class="mini-button" type="button" data-action="set-campus-section-mode" data-mode="alerts">Ver avisos</button>`
                      }
                    </div>
                  `
                  : ""
              }
              <div class="chip-row">
                <button class="ghost-button" type="button" data-action="set-campus-section-mode" data-mode="alerts">Avisos</button>
                <button class="ghost-button" type="button" data-action="set-campus-section-mode" data-mode="courses">Mis cursos</button>
                <button class="ghost-button" type="button" data-action="set-campus-section-mode" data-mode="diplomas">Mis diplomas</button>
                ${
                  campusOnlySession
                    ? `<button class="ghost-button" type="button" data-action="nav" data-view="join">Hazte socio</button>`
                    : `<button class="ghost-button" type="button" data-action="set-campus-section-mode" data-mode="groups">Grupos internos</button>`
                }
              </div>
            `
        }
      </section>
    `;

  return `
    <div class="panel-stack">
      <div class="content-module campus-shell-head">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Campus</p>
            <h3>${
              effectiveCampusSectionMode === "groups"
                ? "Grupos internos"
                : effectiveCampusSectionMode === "alerts"
                  ? "Avisos"
                : effectiveCampusSectionMode === "diplomas"
                  ? isAdminView()
                    ? "Diplomas"
                    : "Mis diplomas"
                  : effectiveCampusSectionMode === "operations"
                    ? "Operativa"
                    : isAdminView()
                      ? "Cursos"
                      : "Tu campus"
            }</h3>
            <p class="muted">${
              effectiveCampusSectionMode === "groups"
                ? isAdminView()
                  ? "Bibliotecas internas por especialidad."
                  : "Material interno y recursos de apoyo."
                : effectiveCampusSectionMode === "alerts"
                  ? "Recordatorios y novedades relevantes para tu ficha y tus cursos."
                : effectiveCampusSectionMode === "diplomas"
                  ? isAdminView()
                    ? "Revision y entrega de documentos formativos."
                    : "Consulta tus documentos disponibles."
                  : effectiveCampusSectionMode === "operations"
                    ? "Asistencia, evaluacion y cierre."
                    : isAdminView()
                      ? "Cursos, plazas y aula desde un mismo espacio."
                      : getCurrentMember()
                        ? `Tu area de cursos y material interno como ${getCurrentMember().name}.`
                        : "Tu area de cursos y material interno."
            }</p>
          </div>
          <div class="chip-row compact-chip-row">
            <button class="${effectiveCampusSectionMode === "all" ? "primary-button" : "ghost-button"}" data-action="set-campus-section-mode" data-mode="all">Mapa</button>
            ${!isAdminView() ? `<button class="${effectiveCampusSectionMode === "alerts" ? "primary-button" : "ghost-button"}" data-action="set-campus-section-mode" data-mode="alerts">Avisos</button>` : ""}
            <button class="${effectiveCampusSectionMode === "courses" ? "primary-button" : "ghost-button"}" data-action="set-campus-section-mode" data-mode="courses">Cursos</button>
            ${isAdminView() ? `<button class="${effectiveCampusSectionMode === "operations" ? "primary-button" : "ghost-button"}" data-action="set-campus-section-mode" data-mode="operations">Operativa</button>` : ""}
            <button class="${effectiveCampusSectionMode === "diplomas" ? "primary-button" : "ghost-button"}" data-action="set-campus-section-mode" data-mode="diplomas">${isAdminView() ? "Diplomas" : "Mis diplomas"}</button>
            ${!campusOnlySession ? `<button class="${effectiveCampusSectionMode === "groups" ? "primary-button" : "ghost-button"}" data-action="set-campus-section-mode" data-mode="groups">Grupos internos</button>` : ""}
          </div>
        </div>
      </div>

      ${effectiveCampusSectionMode === "all" ? renderCampusHub() : ""}
      ${!isAdminView() && showCampusSection("alerts") ? `<section class="associate-anchor" id="campusSectionAlerts">${renderMemberAlerts(getCurrentMember()?.id, { anchor: true, sectionId: "campusSectionAlerts" })}</section>` : ""}
      ${showCampusSection("courses") ? `<section class="associate-anchor" id="campusSectionCourses">${renderCourses()}</section>` : ""}
      ${isAdminView() && showCampusSection("operations") ? `<section class="associate-anchor" id="campusSectionOperations">${renderOperations(selectedCourse)}</section>` : ""}
      ${
        showCampusSection("diplomas")
          ? `<section class="associate-anchor" id="campusSectionDiplomas">${
              isAdminView() ? renderDiplomas(selectedCourse) : renderMemberDiplomas(getCurrentMember())
            }</section>`
          : ""
      }
      ${!campusOnlySession && showCampusSection("groups") ? renderCampusGroupsSection() : ""}
    </div>
  `;
}

function renderCampusSide() {
  const selectedCourse = getSelectedCourse();
  const selectedGroup = getSelectedCampusGroup();
  const campusOnlySession = isCampusOnlySession();
  const effectiveCampusSectionMode =
    !isAdminView() && ["operations", ...(campusOnlySession ? ["groups"] : [])].includes(campusSectionMode)
      ? "courses"
      : campusSectionMode;
  const selectedGroupItems = selectedGroup
    ? (selectedGroup.documents || []).length +
      (selectedGroup.practiceSheets || []).length +
      (selectedGroup.videos || []).length +
      (selectedGroup.links || []).length
    : 0;
  const campusNavigator = `
    <div class="status-note info">
      ${isAdminView() ? "Salta entre cursos, operativa, diplomas y grupos internos desde este mismo espacio." : campusOnlySession ? "Salta entre tus cursos abiertos y diplomas desde este mismo espacio." : "Salta entre avisos, cursos, diplomas y grupos internos desde este mismo espacio."}
    </div>
    <div class="chip-row">
      ${CAMPUS_SECTION_LINKS.filter((section) => (isAdminView() || section.id !== "campusSectionOperations") && (!campusOnlySession || section.id !== "campusSectionGroups")).map(
        (section) => `
          <button class="ghost-button section-jump-button" data-action="nav-section" data-view="campus" data-section-id="${section.id}">
            ${section.label}
          </button>
        `
      ).join("")}
    </div>
  `;

  if (effectiveCampusSectionMode === "operations" && selectedCourse) {
    return `
      <div class="panel-stack">
        ${campusNavigator}
        ${renderOperationsSummary(selectedCourse)}
      </div>
    `;
  }

  if (effectiveCampusSectionMode === "diplomas") {
    return `
      <div class="panel-stack">
        ${campusNavigator}
        ${isAdminView() ? renderDiplomaPreview(selectedCourse) : renderMemberDiplomaSidebar(getCurrentMember())}
      </div>
    `;
  }

  if (effectiveCampusSectionMode === "alerts" && !isAdminView()) {
    return `
      <div class="panel-stack">
        ${campusNavigator}
        ${renderMemberAlerts(getCurrentMember()?.id, { compact: true })}
      </div>
    `;
  }

  if (effectiveCampusSectionMode === "groups") {
    return `
      <div class="panel-stack">
        ${campusNavigator}
        <div class="mail-card">
          <h4>Grupo activo</h4>
          ${
            selectedGroup
              ? `
                  <p class="muted"><strong>${escapeHtml(selectedGroup.title)}</strong></p>
                  <p class="muted">${escapeHtml(selectedGroup.summary || "Sin resumen definido todavia.")}</p>
                  <div class="status-note info">
                    ${selectedGroupItems} recurso(s) en total · ${(selectedGroup.documents || []).length} documento(s) · ${(selectedGroup.practiceSheets || []).length} ficha(s) · ${(selectedGroup.videos || []).length} video(s) · ${(selectedGroup.links || []).length} enlace(s).
                  </div>
                `
              : `<p class="muted">Selecciona un grupo para abrir su biblioteca.</p>`
          }
        </div>
      </div>
    `;
  }

  return `
    <div class="panel-stack">
      ${campusNavigator}
      ${renderSelectedCourse(selectedCourse)}
    </div>
  `;
}

function getCourseTemplateSummary(template) {
  if (template === "mixto") {
    return "Equilibra teoria, aula, practica y cierre evaluable para cursos largos o blended.";
  }
  if (template === "reciclaje") {
    return "Pensado para refrescos y recertificaciones con foco en agilidad, repaso y validacion.";
  }
  if (template === "intensivo") {
    return "Modelo de jornada o seminario concentrado con impacto rapido y material esencial.";
  }
  return "Base operativa completa con modulos, sesiones, recursos y certificado listo para desarrollar.";
}

function renderCourseTemplateShowcase(selectedTemplate = "operativo") {
  return `
    <div class="course-template-grid">
      ${Object.entries(COURSE_TEMPLATE_LABELS)
        .map(
          ([value, label]) => `
            <article class="course-template-card ${selectedTemplate === value ? "course-template-card-active" : ""}">
              <p class="eyebrow">Plantilla</p>
              <h4>${label}</h4>
              <p class="muted">${getCourseTemplateSummary(value)}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderCourseStudioNavigator(
  course,
  normalizedWorkbenchMode,
  readiness,
  deliverySessions,
  enrolledMembers,
  waitingMembers,
  certificateSections,
  publishedLessons,
  totalLessons
) {
  const isPracticalCourse = normalizeCourseClass(course.courseClass) === "practico";
  const cards = [
    {
      mode: "ficha",
      eyebrow: "Base",
      title: "Ficha",
      meta: `${escapeHtml(getCourseClassLabel(course.courseClass))} · ${escapeHtml(course.status)}`
    },
    {
      mode: "curriculum",
      eyebrow: isPracticalCourse ? "Documentacion" : "Contenido",
      title: isPracticalCourse ? "Documentacion" : "Contenido",
      meta: isPracticalCourse
        ? `${readiness.visibleResources} recurso(s) visibles`
        : `${publishedLessons}/${totalLessons} lecciones publicadas`
    },
    ...(!isPracticalCourse
      ? [{
          mode: "sessions",
          eyebrow: "Calendario",
          title: "Sesiones",
          meta: `${deliverySessions.length} jornada(s) previstas`
        }]
      : []),
    {
      mode: "students",
      eyebrow: "Alumnado",
      title: "Inscritos",
      meta: `${enrolledMembers.length} inscritos · ${waitingMembers.length} en espera`
    },
    {
      mode: "certificate",
      eyebrow: "Cierre",
      title: "Certificado",
      meta: `${certificateSections.length} bloque(s) acreditados`
    },
    {
      mode: "learner",
      eyebrow: "Experiencia",
      title: "Vista alumno",
      meta: isPracticalCourse ? `${readiness.visibleResources} recurso(s) para el alumno` : `${readiness.readiness}% listo para alumnado`
    }
  ];

  return `
    <div class="chip-row studio-summary-strip">
      ${cards
        .map(
          (card) => `
            <button
              class="${normalizedWorkbenchMode === card.mode ? "primary-button" : "ghost-button"}"
              type="button"
              data-action="set-course-workbench-mode"
              data-mode="${card.mode}"
            >
              ${card.title}
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderCourses() {
  const selectedMember = findMember(state.selectedMemberId);
  const selectedCourse = getSelectedCourse();
  const memberBuckets = !isAdminView() ? getMemberCourseBuckets(selectedMember?.id) : null;
  const memberPrimaryCourse = !isAdminView() ? getPrimaryMemberCourse(selectedMember?.id) : null;
  const memberCatalogCourse = !isAdminView() ? selectedCourse || memberPrimaryCourse : null;
  const memberActiveCourse = !isAdminView() ? memberPrimaryCourse : null;
  const memberCatalogIsPractical = Boolean(
    memberCatalogCourse && normalizeCourseClass(memberCatalogCourse.courseClass) === "practico"
  );
  const memberActiveIsPractical = Boolean(
    memberActiveCourse && normalizeCourseClass(memberActiveCourse.courseClass) === "practico"
  );
  const memberCourseSteps = !isAdminView()
    ? [
        {
          eyebrow: "Paso 1",
          title: memberBuckets?.enrollmentOpenCourses?.length ? "Ver cursos abiertos" : "Revisar mis cursos",
          target: memberBuckets?.enrollmentOpenCourses?.length ? "courseBucketOpen" : "courseBucketEnrolled",
          detail: memberBuckets?.enrollmentOpenCourses?.length
            ? `${memberBuckets.enrollmentOpenCourses.length} curso(s) con inscripcion visible o programada`
            : `${memberBuckets?.activeCourses?.length || 0} curso(s) ya dentro de tu area`
        },
        {
          eyebrow: "Paso 2",
          title: memberActiveCourse ? "Entrar al aula" : "Abrir resumen",
          target: memberActiveCourse ? "courseSectionWorkbench" : "courseSectionDetails",
          detail: memberActiveCourse
            ? `Curso actual: ${memberActiveCourse.title}`
            : "Revisa programa, sesiones y requisitos antes de inscribirte"
        },
        {
          eyebrow: "Paso 3",
          title: "Ver mis diplomas",
          target: "campusSectionDiplomas",
          detail: `${state.courses.filter((course) => course.diplomaReady.includes(selectedMember?.id)).length} diploma(s) disponibles o en camino`
        }
      ]
    : [];
  const effectiveSelectedCourse = isAdminView() ? selectedCourse : memberCatalogCourse || memberActiveCourse;
  const learnerStudyMode = !isAdminView() && coursesSectionMode === "workbench" && Boolean(memberActiveCourse);
  const showCourseSection = (section) => coursesSectionMode === "all" || coursesSectionMode === section;
  const totalLessons = state.courses.reduce((sum, course) => sum + getCourseLessonCount(course), 0);
  const totalPublishedLessons = state.courses.reduce((sum, course) => sum + getPublishedLessonCount(course), 0);
  return `
    <div class="panel-stack">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Campus · Cursos</p>
          <h3>${isAdminView() ? "Estudio de cursos, plazas y experiencia del aula" : "Aula, inscripciones e historial formativo"}</h3>
          ${
            !isAdminView() && selectedMember
              ? `<p class="muted">Sesion de ${selectedMember.name}.</p>`
              : isAdminView()
                ? `<p class="muted">Gestiona altas, plazas, aula y cierre desde un solo sitio.</p>`
              : ""
          }
        </div>
      </div>

      ${
        isAdminView()
          ? `
            <div class="status-note info course-admin-summary-row">
              ${state.courses.length} curso(s) en catalogo, ${state.courses.filter((course) => course.status === "Inscripcion abierta").length} con inscripcion abierta, ${totalPublishedLessons}/${totalLessons} leccion(es) publicadas y curso activo ${effectiveSelectedCourse ? escapeHtml(effectiveSelectedCourse.title) : "sin seleccionar"}.
            </div>

            <div class="chip-row">
              <button class="${coursesSectionMode === "all" ? "primary-button" : "ghost-button"}" data-action="set-course-section-mode" data-mode="all">Todo</button>
              <button class="${coursesSectionMode === "workbench" ? "primary-button" : "ghost-button"}" data-action="set-course-section-mode" data-mode="workbench">Curso activo</button>
              <button class="${coursesSectionMode === "create" ? "primary-button" : "ghost-button"}" data-action="set-course-section-mode" data-mode="create">Alta</button>
              <button class="${coursesSectionMode === "import" ? "primary-button" : "ghost-button"}" data-action="set-course-section-mode" data-mode="import">Importacion</button>
              <button class="${coursesSectionMode === "catalog" ? "primary-button" : "ghost-button"}" data-action="set-course-section-mode" data-mode="catalog">Catalogo</button>
            </div>

            ${
              showCourseSection("workbench")
                ? `
            <section class="mail-card associate-anchor" id="courseSectionWorkbench">
              <div class="panel-header">
                <div>
                  <p class="eyebrow">Curso activo</p>
                  <h4>${selectedCourse ? escapeHtml(selectedCourse.title) : "Selecciona un curso"}</h4>
                </div>
              </div>
              ${renderCourseWorkbench(selectedCourse)}
            </section>
            `
                : ""
            }
            `
          : ""
      }

      ${
        !isAdminView()
          ? `
            ${
              learnerStudyMode
                ? `
                  <div class="chip-row learner-study-toolbar">
                    <button class="ghost-button" data-action="set-course-section-mode" data-mode="catalog">Volver a cursos</button>
                    <button class="ghost-button" data-action="set-course-section-mode" data-mode="details">Resumen</button>
                    <button class="ghost-button" data-action="set-campus-section-mode" data-mode="diplomas">Mis diplomas</button>
                  </div>
                `
                : `
                  <div class="status-note info course-summary-row">
                    Aula actual: ${memberActiveCourse ? escapeHtml(memberActiveCourse.title) : "sin curso activo"} · Cursos inscritos: ${state.courses.filter((course) => course.enrolledIds.includes(selectedMember?.id)).length} · Diplomas disponibles: ${state.courses.filter((course) => course.diplomaReady.includes(selectedMember?.id)).length}.
                  </div>

                  <div class="chip-row">
                    <button class="${coursesSectionMode === "all" ? "primary-button" : "ghost-button"}" data-action="set-course-section-mode" data-mode="all">Todo</button>
                    <button class="${coursesSectionMode === "details" ? "primary-button" : "ghost-button"}" data-action="set-course-section-mode" data-mode="details">Resumen del curso</button>
                    <button class="${coursesSectionMode === "workbench" ? "primary-button" : "ghost-button"}" data-action="set-course-section-mode" data-mode="workbench">Mi aula</button>
                    <button class="${coursesSectionMode === "catalog" ? "primary-button" : "ghost-button"}" data-action="set-course-section-mode" data-mode="catalog">Cursos e historial</button>
                  </div>
                `
            }

            ${
              showCourseSection("all")
                ? `
                  <div class="panel-stack">
                    ${renderLearnerCourseCatalogOverview(memberBuckets)}
                    <div class="course-grid">
                     ${renderCompactCourseBucket(
                       "Mis matriculas",
                       "Cursos en los que ya estas inscrito o pendiente de plaza.",
                       memberBuckets?.activeCourses || [],
                       { role: "member", emptyMessage: "Todavia no tienes cursos activos.", sectionId: "courseBucketEnrolled" }
                     )}
                     ${renderCompactCourseBucket(
                       "Inscripcion abierta",
                       "Cursos disponibles para matricula inmediata.",
                       memberBuckets?.enrollmentOpenCourses || [],
                       { role: "member", emptyMessage: "No hay cursos abiertos ahora mismo.", quickEnroll: true, sectionId: "courseBucketOpen" }
                     )}
                     ${renderCompactCourseBucket(
                       "Proximos cursos",
                       "Formaciones anunciadas o cercanas al inicio.",
                       memberBuckets?.upcomingCourses || [],
                       { role: "member", emptyMessage: "No hay proximos cursos publicados.", sectionId: "courseBucketUpcoming" }
                     )}
                     ${renderCompactCourseBucket(
                       "Cursos cerrados e historial",
                       "Formaciones ya cerradas dentro de tu recorrido.",
                       memberBuckets?.historyCourses || [],
                       { role: "member", emptyMessage: "Todavia no tienes historial cerrado.", sectionId: "courseBucketHistory" }
                     )}
                    </div>
                  </div>
                `
                : ""
            }

            ${
              showCourseSection("details")
                ? `
                  <section class="mail-card associate-anchor" id="courseSectionDetails">
                    <div class="panel-header">
                      <div>
                        <p class="eyebrow">Resumen del curso</p>
                        <h4>${memberCatalogCourse ? escapeHtml(memberCatalogCourse.title) : "Selecciona un curso del catalogo"}</h4>
                        <p class="muted">${memberCatalogIsPractical ? "Revisa documentacion, requisitos y estado de matricula antes de entrar al practico." : "Revisa programa, objetivos, sesiones, recursos y estado de matricula antes de entrar al aula."}</p>
                      </div>
                    </div>
                    ${memberCatalogCourse ? renderSelectedCourse(memberCatalogCourse) : `<div class="empty-state">Selecciona un curso del catalogo para ver su resumen completo y la accion de matricula.</div>`}
                  </section>
                `
                : ""
            }

            ${
              showCourseSection("workbench")
                ? `
                  <section class="mail-card associate-anchor ${learnerStudyMode ? "learner-study-shell" : ""}" id="courseSectionWorkbench">
                    ${
                      learnerStudyMode
                        ? ""
                        : `
                          <div class="panel-header">
                            <div>
                              <p class="eyebrow">Mi aula actual</p>
                              <h4>${memberActiveCourse ? escapeHtml(memberActiveCourse.title) : "Sin curso activo"}</h4>
                              <p class="muted">${memberActiveIsPractical ? "Entra al practico como alumno: documentacion visible, estado del curso y requisitos reales del certificado." : "Entra al curso como alumno: siguiente paso, contenidos publicados, sesiones, recursos y requisitos reales del certificado."}</p>
                            </div>
                          </div>
                        `
                    }
                    ${memberActiveCourse ? renderMemberCourseWorkspace(memberActiveCourse, { focusMode: learnerStudyMode }) : `<div class="empty-state">Todavia no tienes un curso activo asignado.</div>`}
                  </section>
                `
                : ""
            }

            ${
              showCourseSection("catalog")
                ? `
                  <div class="mail-card compact-panel">
                    <h4>Catalogo del Campus</h4>
                    <p class="muted">Como en las plataformas grandes: primero ves que puedes cursar ahora, que viene despues y que ya forma parte de tu historial.</p>
                    ${renderLearnerCourseCatalogOverview(memberBuckets)}
                  </div>

                  ${renderMemberCourseListSection(
                    "Mis matriculas",
                    "Tus cursos activos o pendientes de plaza. Desde aqui entras al aula o revisas el estado de tu matricula.",
                    memberBuckets?.activeCourses || [],
                    {
                      role: "member",
                      emptyMessage: "Todavia no tienes cursos activos o en espera."
                    }
                  )}

                  ${renderMemberCourseListSection(
                    "Inscripcion abierta",
                    "Cursos que muestran matricula abierta y a los que puedes inscribirte ahora mismo.",
                    memberBuckets?.enrollmentOpenCourses || [],
                    {
                      role: "member",
                      emptyMessage: "Ahora mismo no hay cursos nuevos con inscripcion abierta."
                    }
                  )}

                  ${renderMemberCourseListSection(
                    "Proximos cursos",
                    "Formaciones anunciadas o proximas al inicio para que puedas verlas antes de que abran la matricula.",
                    memberBuckets?.upcomingCourses || [],
                    {
                      role: "member",
                      emptyMessage: "No hay proximos cursos anunciados en este momento."
                    }
                  )}

                  <div class="mail-card">
                    <h4>Historial de curso</h4>
                    <p class="muted">Linea temporal de tu recorrido: accesos, avances, cierres y movimientos de formacion dentro del campus.</p>
                    ${renderMemberHistory(memberBuckets?.timelineHistory || [])}
                  </div>

                  ${renderMemberCourseListSection(
                    "Cursos cerrados e historial",
                    "Formaciones finalizadas o cerradas con acceso a su ficha, resultados y estado final.",
                    memberBuckets?.historyCourses || [],
                    {
                      role: "member",
                      emptyMessage: "Todavia no tienes cursos cerrados en tu historial."
                    }
                  )}
                `
                : ""
            }
          `
          : ""
      }

      ${
        isAdminView()
          ? `
            ${
              showCourseSection("create")
                ? `
            <section class="associate-anchor" id="courseSectionCreate">
            <form id="courseForm" class="stack">
              <div class="content-module">
                <div class="module-head">
                  <div>
                    <p class="eyebrow">Nuevo curso del Campus</p>
                    <h4>Alta guiada del curso</h4>
                    <p class="muted">Crea primero la estructura maestra y despues entra al estudio del curso para desarrollarlo como un aula profesional.</p>
                  </div>
                  <div class="chip-row">
                    <span class="small-chip">Alta guiada</span>
                    <span class="small-chip">Plantillas docentes</span>
                  </div>
                </div>
                <div class="chip-row compact-chip-row">
                  <button class="mini-button" type="button" data-action="apply-course-starter" data-preset="ventilation">Cargar ejemplo: Ventilacion</button>
                  <button class="mini-button" type="button" data-action="apply-course-starter" data-preset="vertical">Cargar ejemplo: Rescate vertical</button>
                </div>
                ${renderCourseTemplateShowcase("operativo")}
                <div class="studio-grid">
                  <label class="inline-field studio-full">
                    Nombre del curso
                    <input id="courseTitle" placeholder="Nombre del curso" />
                  </label>
                  <label class="inline-field">
                    Clase del curso
                    <select id="courseClass">
                      ${Object.entries(COURSE_CLASS_LABELS)
                        .map(([value, label]) => `<option value="${value}" ${value === "teorico-practico" ? "selected" : ""}>${label}</option>`)
                        .join("")}
                    </select>
                  </label>
                  <label class="inline-field">
                    Plantilla de contenido
                    <select id="courseTemplate">
                      ${Object.entries(COURSE_TEMPLATE_LABELS)
                        .map(([value, label]) => `<option value="${value}" ${value === "operativo" ? "selected" : ""}>${label}</option>`)
                        .join("")}
                    </select>
                  </label>
                  <label class="inline-field studio-full">
                    Area o especialidad
                    <input id="courseType" placeholder="Area o especialidad del curso" />
                  </label>
                  <label class="inline-field">
                    Fecha inicio
                    <input id="courseStart" type="date" />
                  </label>
                  <label class="inline-field">
                    Fecha fin
                    <input id="courseEnd" type="date" />
                  </label>
                  <label class="inline-field">
                    Horas
                    <input id="courseHours" type="number" min="1" placeholder="Horas" />
                  </label>
                  <label class="inline-field">
                    Plazas
                    <input id="courseCapacity" type="number" min="1" placeholder="Plazas" />
                  </label>
                  <label class="inline-field">
                    Coordinacion o instructor responsable
                    <input id="courseCoordinator" placeholder="Coordinacion o instructor responsable" />
                  </label>
                  <label class="inline-field">
                    Publico objetivo
                    <input id="courseAudience" placeholder="Publico objetivo del curso" />
                  </label>
                  <label class="inline-field">
                    Quien puede inscribirse
                    <select id="courseAccessScope">
                      ${Object.entries(COURSE_ACCESS_SCOPE_LABELS)
                        .map(([value, label]) => `<option value="${value}" ${value === "members" ? "selected" : ""}>${label}</option>`)
                        .join("")}
                    </select>
                  </label>
                  <label class="inline-field studio-full">
                    Apertura de inscripcion
                    <input id="courseEnrollmentOpensAt" type="datetime-local" />
                    <span class="field-hint">Si lo dejas vacio, podras abrir la inscripcion en cuanto el curso pase a "Inscripcion abierta". Si lo rellenas, el curso sera visible pero no aceptara solicitudes hasta esa fecha y hora.</span>
                  </label>
                </div>
              </div>
              <div class="course-grid">
                <div class="timeline-item">
                  <span class="eyebrow">Lo que genera el campus</span>
                  <p>Resumen, objetivos, sesiones, modulos, lecciones y base de certificado para no arrancar desde cero.</p>
                </div>
                <div class="timeline-item">
                  <span class="eyebrow">Despues del alta</span>
                  <p>Al crear, el curso se abre en Curso activo para desarrollar contenido, recursos, sesiones, alumnado y certificado final.</p>
                </div>
              </div>
              <div class="chip-row">
                <button class="primary-button" type="submit">Crear y abrir estudio</button>
              </div>
            </form>
            </section>
            `
                : ""
            }

            ${
              showCourseSection("import")
                ? `
            <section class="associate-anchor" id="courseSectionImport">
            <form id="courseImportForm" class="mail-card">
              <h4>Importacion rapida de cursos por CSV</h4>
              <p class="muted">Cabeceras admitidas: <code>title;courseClass;type;status;summary;startDate;endDate;hours;capacity;diplomaTemplate</code></p>
              <textarea
                id="courseImportCsv"
                placeholder="title;courseClass;type;status;summary;startDate;endDate;hours;capacity;diplomaTemplate&#10;Reciclaje vehiculos;practico;Vehiculos y despliegue;Planificacion;Practica operativa;2026-06-10;2026-06-11;8;15;Asistencia"
              ></textarea>
              <div class="toolbar">
                <a class="button-link" href="/api/templates/courses.csv">Descargar plantilla</a>
                <button class="ghost-button" type="submit">Importar cursos</button>
              </div>
            </form>
            </section>
            `
                : ""
            }
          `
          : ""
      }

      ${
        !isAdminView() || showCourseSection("catalog")
          ? `
            <div class="course-list associate-anchor" id="courseSectionCatalog">
              ${
                isAdminView()
                  ? renderAdminCourseCatalog()
                  : renderMemberCourseListSection(
                      "Mis cursos",
                      "Cursos activos o en espera que tienes vinculados ahora mismo.",
                      memberBuckets?.activeCourses || [],
                      {
                        role: "member",
                        emptyMessage: "Todavia no tienes cursos activos o en espera."
                      }
                    )
              }
            </div>
          `
          : ""
      }
    </div>
  `;
}

function renderAdminCourseCatalog() {
  const plannedCourses = state.courses.filter((course) => course.status === "Planificacion");
  const openCourses = state.courses.filter((course) => course.status === "Inscripcion abierta");
  const closingCourses = state.courses.filter((course) => course.status === "Cierre pendiente");
  const closedCourses = state.courses.filter((course) => course.status === "Cerrado");

  return `
    <div class="panel-stack">
      ${renderMemberCourseListSection(
        "Inscripcion abierta",
        "Cursos visibles y listos para recibir alumnado ahora mismo.",
        openCourses,
        {
          role: "admin",
          emptyMessage: "No hay cursos con inscripcion abierta ahora mismo."
        }
      )}
      ${renderMemberCourseListSection(
        "Planificacion y borrador",
        "Cursos que todavia estan en construccion o pendientes de abrir.",
        plannedCourses,
        {
          role: "admin",
          emptyMessage: "No hay cursos en planificacion."
        }
      )}
      ${renderMemberCourseListSection(
        "Pendientes de cierre",
        "Cursos que ya han terminado y necesitan rematar asistencia, evaluacion o diplomas.",
        closingCourses,
        {
          role: "admin",
          emptyMessage: "No hay cursos pendientes de cierre."
        }
      )}
      ${renderMemberCourseListSection(
        "Cerrados",
        "Cursos ya finalizados y cerrados administrativamente.",
        closedCourses,
        {
          role: "admin",
          emptyMessage: "No hay cursos cerrados todavia."
        }
      )}
    </div>
  `;
}

function renderOperations(course) {
  if (!course) {
    return `<div class="empty-state">Selecciona un curso para ver asistencia y evaluacion.</div>`;
  }

  const enrolledMembers = course.enrolledIds.map(findMember).filter(Boolean);
  const showOperationsSection = (section) =>
    operationsSectionMode === "all" || operationsSectionMode === section;
  const averageAttendance = enrolledMembers.length
    ? Math.round(
        enrolledMembers.reduce((sum, member) => sum + Number(course.attendance[member.id] || 0), 0) /
          enrolledMembers.length
      )
    : 0;
  const approvedMembers = enrolledMembers.filter(
    (member) => String(course.evaluations[member.id] || "").toLowerCase() === "apto"
  ).length;
  const pendingEvaluations = enrolledMembers.filter(
    (member) =>
      !course.evaluations[member.id] ||
      String(course.evaluations[member.id] || "").toLowerCase() === "pendiente"
  ).length;
  const feedbackPendingMembers = enrolledMembers.filter(
    (member) => course.feedbackRequiredForDiploma && !getCourseFeedbackResponse(course, member.id)
  ).length;
  const diplomaEligibleMembers = enrolledMembers.filter((member) => {
    const attendance = Number(course.attendance?.[member.id] || 0);
    const evaluation = String(course.evaluations?.[member.id] || "").toLowerCase();
    const feedbackReady = !course.feedbackRequiredForDiploma || Boolean(getCourseFeedbackResponse(course, member.id));
    return attendance >= 75 && evaluation === "apto" && isMemberContentReadyForDiploma(course, member.id) && feedbackReady;
  }).length;
  const pendingDiplomaGeneration = Math.max(diplomaEligibleMembers - (course.diplomaReady || []).length, 0);

  return `
    <div class="panel-stack">
      <div class="panel-header associate-anchor" id="operationsSectionSummary">
        <div>
          <p class="eyebrow">Campus · Operativa</p>
          <h3>${course.title}</h3>
          <p class="muted">Cierra asistencia, aptos y diplomas desde una sola mesa de trabajo.</p>
        </div>
        <div class="chip-row">
          <span class="status-chip">${course.status}</span>
          ${
            isAdminView()
              ? `
                <button class="ghost-button" data-action="nav-section" data-view="campus" data-section-id="campusSectionCourses">Curso activo</button>
                <button class="ghost-button" data-action="set-campus-section-mode" data-mode="diplomas">Ir a diplomas</button>
              `
              : ""
          }
        </div>
      </div>

      ${
        isAdminView()
          ? `
            <div class="status-note info">
              Ahora mismo: ${enrolledMembers.length} inscrito(s), ${approvedMembers} apto(s), ${pendingEvaluations} evaluacion(es) pendiente(s) y ${pendingDiplomaGeneration} diploma(s) por generar.
            </div>
            <div class="chip-row">
              <button class="ghost-button" data-action="set-all-attendance" data-course-id="${course.id}" ${enrolledMembers.length ? "" : "disabled"}>Todo al 100%</button>
              <button class="ghost-button" data-action="set-all-evaluations-apt" data-course-id="${course.id}" ${enrolledMembers.length ? "" : "disabled"}>Marcar aptos</button>
              <button class="primary-button" data-action="close-all-member-courses" data-course-id="${course.id}" ${enrolledMembers.length ? "" : "disabled"}>Cerrar alumnado</button>
              <button class="ghost-button" data-action="set-campus-section-mode" data-mode="diplomas">Ir a diplomas</button>
            </div>
          `
          : ""
      }

      ${
        isAdminView()
          ? `
            <div class="table-card associate-anchor" id="operationsSectionAttendance">
              <table>
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th>Asistencia</th>
                    <th>Contenido</th>
                    <th>Evaluacion</th>
                    <th>Valoracion</th>
                    <th>Diploma</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    enrolledMembers.length
                      ? enrolledMembers
                          .map((member) => {
                            const attendance = course.attendance[member.id] ?? 0;
                            const evaluation = course.evaluations[member.id] ?? "Pendiente";
                            const progress = getLearnerCourseContentStats(course, member.id);
                            const feedbackSent = Boolean(getCourseFeedbackResponse(course, member.id));
                            const readyForDiploma =
                              attendance >= 75 &&
                              String(evaluation).toLowerCase() === "apto" &&
                              isMemberContentReadyForDiploma(course, member.id) &&
                              (!course.feedbackRequiredForDiploma || feedbackSent);
                            const diplomaGenerated = course.diplomaReady.includes(member.id);
                            const diplomaState = diplomaGenerated ? "Generado" : readyForDiploma ? "Listo" : "Falta cerrar";
                            const diplomaActionLabel = diplomaGenerated
                              ? "Ver diploma"
                              : readyForDiploma
                                ? "Emitir diploma"
                                : "Ver requisitos";
                            const diplomaAction = diplomaGenerated
                              ? "open-member-diploma-preview"
                              : readyForDiploma
                                ? "generate-member-diploma"
                                : "open-member-diploma-preview";
                            return `
                              <tr>
                                <td>${member.name}</td>
                                <td>${attendance}%</td>
                                <td>${progress.blockProgress}%<br><span class="muted">${progress.blocksCompleted}/${progress.blocksTotal} bloques</span></td>
                                <td>${evaluation}</td>
                                <td>${course.feedbackRequiredForDiploma ? (feedbackSent ? "Enviada" : "Pendiente") : "Opcional"}</td>
                                <td>${diplomaState}</td>
                                <td>
                                  <div class="chip-row">
                                    <button class="mini-button" data-action="set-course-preview-member" data-course-id="${course.id}" data-member-id="${member.id}" data-mode="learner">Abrir alumno</button>
                                    <button class="mini-button" data-action="close-member-course" data-course-id="${course.id}" data-member-id="${member.id}">Cerrar curso</button>
                                    <button class="mini-button" data-action="${diplomaAction}" data-course-id="${course.id}" data-member-id="${member.id}">${diplomaActionLabel}</button>
                                  </div>
                                </td>
                              </tr>
                            `;
                          })
                          .join("")
                      : `<tr><td colspan="7">Todavia no hay inscritos confirmados en este curso.</td></tr>`
                  }
                </tbody>
              </table>
            </div>
          `
          : renderMemberOperationCard(course)
      }
    </div>
  `;
}

function renderMemberOperationCard(course) {
  const member = findMember(state.selectedMemberId);
  if (!member) {
    return `<div class="empty-state">No hay persona activa para consultar.</div>`;
  }

  return renderLearnerJourneyCard(course, member.id);
}

function getLearnerPendingDiplomaReasons(course, memberJourney) {
  if (!course || !memberJourney || memberJourney.hasDiploma) {
    return [];
  }

  return [
    {
      label: "Asistencia",
      ok: Number(memberJourney.attendance || 0) >= 75,
      detail: `${Number(memberJourney.attendance || 0)}%`
    },
    {
      label: "Evaluacion",
      ok: String(memberJourney.evaluation || "").trim() === "Apto",
      detail: String(memberJourney.evaluation || "Pendiente")
    },
    {
      label: "Contenido",
      ok: Boolean(memberJourney.contentReady),
      detail: `${memberJourney.progress?.blocksCompleted || 0}/${memberJourney.progress?.blocksTotal || 0} bloques`
    },
    {
      label: "Valoracion final",
      ok: !course.feedbackRequiredForDiploma || Boolean(memberJourney.feedbackSubmitted),
      detail: course.feedbackRequiredForDiploma
        ? (memberJourney.feedbackSubmitted ? "Enviada" : "Pendiente")
        : "No requerida"
    },
    {
      label: "DNI/NIE",
      ok: Boolean(memberJourney.hasDocumentId),
      detail: memberJourney.hasDocumentId ? "Disponible en ficha" : "Pendiente en tu ficha"
    }
  ];
}

function renderMemberDiplomas(member) {
  if (!member) {
    return `<div class="empty-state">No hay persona activa para consultar tus diplomas.</div>`;
  }

  const memberCourses = state.courses.filter(
    (course) =>
      course.enrolledIds.includes(member.id) ||
      course.waitingIds.includes(member.id) ||
      course.diplomaReady.includes(member.id)
  );

  if (!memberCourses.length) {
    return `
      <div class="panel-stack">
        <div class="panel-header associate-anchor" id="diplomaSectionActions">
          <div>
            <p class="eyebrow">Campus · Mis diplomas</p>
            <h3>Todavia no tienes cursos vinculados</h3>
            <p class="muted">Cuando te inscribas o completes un curso, aqui veras su salida acreditativa.</p>
          </div>
        </div>
        <div class="empty-state">Todavia no hay diplomas ni cursos asociados a tu ficha.</div>
      </div>
    `;
  }

  const diplomaCards = memberCourses
    .map((course) => {
      const journey = getLearnerCourseJourney(course, member.id);
      const pendingReasons = getLearnerPendingDiplomaReasons(course, journey);
      const pendingItems = pendingReasons.filter((item) => !item.ok);
      const pendingSummary = pendingItems.length
        ? pendingItems.map((item) => item.label).join(", ")
        : "No queda nada pendiente";

      return `
        <article class="table-card">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Curso</p>
              <h4>${escapeHtml(course.title)}</h4>
              <p class="muted">${
                journey.hasDiploma
                  ? "Tu diploma ya esta disponible."
                  : pendingItems.length
                    ? `Todavia falta: ${escapeHtml(pendingSummary)}.`
                    : "El curso esta en revision final para emitir el diploma."
              }</p>
            </div>
            <div class="chip-row compact-chip-row">
              <span class="small-chip">${escapeHtml(journey.hasDiploma ? "Diploma disponible" : "Pendiente de cierre")}</span>
              <span class="small-chip">${escapeHtml(String(journey.evaluation || "Pendiente"))}</span>
              <span class="small-chip">${escapeHtml(`${Number(journey.attendance || 0)}% asistencia`)}</span>
            </div>
          </div>
          <div class="status-note ${journey.hasDiploma ? "success" : pendingItems.length ? "warning" : "info"}">
            ${
              journey.hasDiploma
                ? "Puedes abrirlo o descargarlo ahora mismo."
                : pendingItems.length
                  ? `Sigue pendiente: ${escapeHtml(pendingSummary)}.`
                  : "El curso esta en revision final para emitir el diploma."
            }
          </div>
          <div class="chip-row">
            ${
              journey.hasDiploma
                ? `
                    <a class="button-link" target="_blank" rel="noreferrer" href="/api/diplomas/${course.id}/${member.id}">Abrir diploma</a>
                    <a class="mini-button" href="/api/diplomas/${course.id}/${member.id}.pdf">Descargar PDF</a>
                    <a class="mini-button" href="/api/diplomas/${course.id}/${member.id}.docx">Descargar Word</a>
                  `
                : ""
            }
            <button class="${journey.hasDiploma ? "ghost-button" : "primary-button"}" data-action="select-course" data-course-id="${course.id}">
              ${journey.hasDiploma ? "Ver curso" : "Abrir ficha del curso"}
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  const availableDiplomas = memberCourses.filter((course) => course.diplomaReady.includes(member.id)).length;
  const pendingDiplomas = memberCourses.length - availableDiplomas;

  return `
    <div class="panel-stack">
      <div class="panel-header associate-anchor" id="diplomaSectionActions">
        <div>
          <p class="eyebrow">Campus · Mis diplomas</p>
          <h3>${escapeHtml(member.name)}</h3>
          <p class="muted">Aqui ves todos tus cursos con salida acreditativa: los diplomas disponibles y lo que falta en cada caso.</p>
        </div>
      </div>
      <div class="status-note info">
        Ahora mismo tienes <strong>${availableDiplomas}</strong> diploma(s) disponible(s) y
        <strong>${pendingDiplomas}</strong> curso(s) pendiente(s) de cierre.
      </div>
      <div class="panel-stack associate-anchor" id="diplomaSectionDocuments">
        ${diplomaCards}
      </div>
    </div>
  `;
}

function renderDiplomas(course) {
  if (!course) {
    return `<div class="empty-state">Selecciona un curso del Campus para ver diplomas y salidas.</div>`;
  }

  const isPracticalCourse = normalizeCourseClass(course.courseClass) === "practico";
  const memberJourney = !isAdminView() ? getLearnerCourseJourney(course, state.selectedMemberId) : null;
  const readyMembers = course.diplomaReady.map(findMember).filter(Boolean);
  const adminDocumentMembers = isAdminView()
    ? Array.from(new Map((course.enrolledIds || []).map((memberId) => {
        const member = findMember(memberId);
        return member ? [member.id, member] : null;
      }).filter(Boolean)).values())
    : [];
  const visibleMembers = isAdminView()
    ? adminDocumentMembers
    : readyMembers.filter((member) => member.id === state.selectedMemberId);
  const learnerPendingDiplomaReasons = getLearnerPendingDiplomaReasons(course, memberJourney);
  const learnerPendingDiplomaItems = learnerPendingDiplomaReasons.filter((item) => !item.ok);
  const showDiplomaSection = (section) =>
    diplomasSectionMode === "all" || diplomasSectionMode === section;
  const pendingDeliveries = getCoursePendingDiplomaDeliveries(course);
  const diplomaEligibleMembers = (course.enrolledIds || []).filter((memberId) => {
    const attendance = Number(course.attendance?.[memberId] || 0);
    const evaluation = String(course.evaluations?.[memberId] || "").toLowerCase();
    const feedbackReady = !course.feedbackRequiredForDiploma || Boolean(getCourseFeedbackResponse(course, memberId));
    return attendance >= 75 && evaluation === "apto" && isMemberContentReadyForDiploma(course, memberId) && feedbackReady;
  }).length;
  const pendingGeneration = Math.max(diplomaEligibleMembers - (course.diplomaReady || []).length, 0);
  const generatedDiplomas = (course.diplomaReady || []).length;

  return `
    <div class="panel-stack">
      <div class="panel-header associate-anchor" id="diplomaSectionActions">
        <div>
          <p class="eyebrow">Campus · Diplomas</p>
          <h3>${course.title}</h3>
          <p class="muted">${isPracticalCourse ? "Cierra el practico y deja listos los diplomas del alumnado." : "Actualiza, revisa y entrega los diplomas del curso."}</p>
        </div>
      ${
          isAdminView()
            ? `
              <div class="chip-row">
                <button class="ghost-button" data-action="nav-section" data-view="campus" data-section-id="campusSectionCourses">Curso activo</button>
                <button class="ghost-button" data-action="set-campus-section-mode" data-mode="operations">${isPracticalCourse ? "Cerrar practico" : "Cerrar alumnado"}</button>
                <button class="ghost-button" data-action="generate-diplomas" data-course-id="${course.id}">Emitir pendientes</button>
                <button class="primary-button" data-action="smtp-send-course" data-course-id="${course.id}">Enviar por SMTP</button>
              </div>
            `
            : ""
        }
      </div>

      ${
        isAdminView()
          ? `
            <div class="status-note info">
              Ahora mismo: ${generatedDiplomas} emitido(s), ${pendingGeneration} listo(s) para emitir y ${pendingDeliveries} pendiente(s) de enviar.
            </div>
          `
          : ""
      }

      ${
        !isAdminView()
          ? `
            <div class="mail-card">
              <h4>Tu situacion con el diploma</h4>
              ${
                memberJourney?.hasDiploma
                  ? `<p class="muted">Ya has llegado al diploma de este curso. Puedes abrirlo o descargarlo desde abajo.</p>`
                  : `<p class="muted">Todavia no tienes el diploma disponible. Debajo ves el siguiente paso y lo que te falta para desbloquearlo.</p>`
              }
              ${renderLearnerJourneyCard(course, state.selectedMemberId, { compact: true })}
            </div>
          `
          : ""
      }

      ${
        showDiplomaSection("documents")
          ? `
      <div class="table-card associate-anchor" id="diplomaSectionDocuments">
        ${
          !isAdminView() && memberJourney && !memberJourney.hasDiploma
            ? `
              <div class="status-note warning">
                Tu diploma de <strong>${escapeHtml(course.title)}</strong> todavia no esta disponible.
                ${
                  learnerPendingDiplomaItems.length
                    ? `Ahora mismo falta: ${escapeHtml(learnerPendingDiplomaItems.map((item) => item.label).join(", "))}.`
                    : "Todavia falta cerrar algun requisito final del curso."
                }
              </div>
              <div class="compact-list">
                ${learnerPendingDiplomaReasons
                  .map(
                    (item) => `
                      <div class="timeline-item compact-timeline-item">
                        <strong>${escapeHtml(item.label)}: ${item.ok ? "OK" : "Pendiente"}</strong>
                        <p class="muted">${escapeHtml(item.detail)}</p>
                      </div>
                    `
                  )
                  .join("")}
              </div>
              <div class="chip-row">
                <button class="primary-button" data-action="set-campus-section-mode" data-mode="courses">Volver a mis cursos</button>
                <button class="ghost-button" data-action="select-course" data-course-id="${course.id}">${memberJourney?.hasDiploma ? "Volver al curso" : "Abrir ficha del curso"}</button>
              </div>
            `
            : ""
        }
        <table>
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Resultado</th>
              <th>Codigo</th>
              <th>Envio</th>
              <th>Documento</th>
            </tr>
          </thead>
          <tbody>
            ${
              visibleMembers.length
                ? visibleMembers
                    .map(
                      (member) => {
                        const mail = getLatestMailForMemberCourse(course.id, member.id);
                        const registry = buildRegistryNumber(course, member);
                        const isReady = course.diplomaReady.includes(member.id);
                        return `
                        <tr>
                          <td>${member.name}</td>
                          <td>${isReady ? (course.evaluations[member.id] ?? "Apto") : `Pendiente | ${course.evaluations[member.id] ?? "Pendiente"}`}</td>
                          <td>${registry}<br><span class="muted">${buildDiplomaCode(course, member)}</span></td>
                          <td>${isReady ? (course.mailsSent.includes(member.id) ? "Enviado" : "Pendiente") : "Sin emitir"}</td>
                          <td>
                            <div class="chip-row">
                              <a class="button-link" target="_blank" rel="noreferrer" href="/api/diplomas/${course.id}/${member.id}">${isReady ? "Abrir diploma" : "Ver requisitos"}</a>
                              <a class="mini-button" href="/api/diplomas/${course.id}/${member.id}.pdf">Descargar PDF</a>
                              <a class="mini-button" href="/api/diplomas/${course.id}/${member.id}.docx">Descargar Word</a>
                              ${
                                isAdminView() && isReady
                                  ? `<button class="mini-button" data-action="smtp-send-member" data-course-id="${course.id}" data-member-id="${member.id}">Enviar SMTP</button>`
                                  : ""
                              }
                              ${
                                mail
                                  ? `<a class="mini-button" href="/api/emails/${mail.id}.eml">Descargar .eml</a>`
                                  : ""
                              }
                            </div>
                          </td>
                        </tr>
                      `;
                      }
                    )
                    .join("")
                : `<tr><td colspan="5">${isAdminView() ? "Todavia no hay diplomas disponibles para esta vista." : "Tu diploma aun no esta disponible. Completa el siguiente paso indicado arriba para desbloquearlo."}</td></tr>`
            }
          </tbody>
        </table>
      </div>
      `
          : ""
      }
    </div>
  `;
}

function renderReports() {
  if (!isAdminView()) {
    return `<div class="empty-state">Los informes globales y exportaciones solo estan disponibles para administracion.</div>`;
  }

  const selectedCourse = getSelectedCourse();
  const validationDemoCourse = (state.courses || []).find((course) => (course.diplomaReady || []).length) || selectedCourse;
  const previewMember = validationDemoCourse ? findMember(validationDemoCourse.diplomaReady[0]) : null;
  const previewCode = validationDemoCourse && previewMember ? buildDiplomaCode(validationDemoCourse, previewMember) : "";
  const previewRegistry = validationDemoCourse && previewMember ? buildRegistryNumber(validationDemoCourse, previewMember) : "";
  const showReportsSection = (section) => reportsSectionMode === "all" || reportsSectionMode === section;

  return `
    <div class="panel-stack">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Informes y validacion</p>
          <h3>Exportaciones y comprobacion publica de diplomas</h3>
        </div>
      </div>

      <div class="status-note info">
        ${state.courses.length} curso(s), ${state.courses.reduce((sum, course) => sum + course.diplomaReady.length, 0)} diploma(s) validables y ${
          state.emailOutbox.length
        } correo(s) registrados. ${previewCode ? `Codigo demo listo: ${escapeHtml(previewCode)}.` : "Puedes validar por codigo o exportar datos."}
      </div>

      <div class="chip-row">
        <button class="${reportsSectionMode === "all" ? "primary-button" : "ghost-button"}" data-action="set-reports-section-mode" data-mode="all">Todo</button>
        <button class="${reportsSectionMode === "exports" ? "primary-button" : "ghost-button"}" data-action="set-reports-section-mode" data-mode="exports">Exportaciones</button>
        <button class="${reportsSectionMode === "validation" ? "primary-button" : "ghost-button"}" data-action="set-reports-section-mode" data-mode="validation">Validacion</button>
        <button class="${reportsSectionMode === "storage" ? "primary-button" : "ghost-button"}" data-action="set-reports-section-mode" data-mode="storage">Almacenamiento</button>
        <button class="${reportsSectionMode === "agent" ? "primary-button" : "ghost-button"}" data-action="set-reports-section-mode" data-mode="agent">Agente</button>
      </div>

      ${
        showReportsSection("exports")
          ? `
      <div class="mail-card associate-anchor" id="reportSectionExports">
        <h4>Exportar CSV</h4>
        <div class="compact-list">
          <article class="compact-person-row compact-person-row-stacked">
            <div class="compact-person-main">
              <strong>Asociacion y socios</strong>
              <p class="muted">Solicitudes, socios, pagos y justificantes.</p>
            </div>
            <div class="chip-row compact-person-actions">
              <a class="button-link" href="/api/reports/associate-applications.csv">Solicitudes</a>
              <a class="button-link" href="/api/reports/associates.csv">Socios</a>
              <a class="button-link" href="/api/reports/associate-payments.csv">Pagos</a>
              <a class="button-link" href="/api/reports/associate-payment-submissions.csv">Justificantes</a>
            </div>
          </article>
          <article class="compact-person-row compact-person-row-stacked">
            <div class="compact-person-main">
              <strong>Formacion y auditoria</strong>
              <p class="muted">Cursos, diplomas, bandeja, actividad, automatizacion y agente.</p>
            </div>
            <div class="chip-row compact-person-actions">
              <a class="button-link" href="/api/reports/courses.csv">Cursos</a>
              <a class="button-link" href="/api/reports/diplomas.csv">Diplomas</a>
              <a class="button-link" href="/api/reports/outbox.csv">Bandeja</a>
              <a class="button-link" href="/api/reports/activity.csv">Auditoria</a>
              <a class="button-link" href="/api/reports/automation.csv">Automatizacion</a>
              <a class="button-link" href="/api/reports/agent.csv">Agente</a>
            </div>
          </article>
        </div>
      </div>
      `
          : ""
      }

        ${
          showReportsSection("validation")
            ? `
        <div class="mail-card associate-anchor" id="reportSectionValidation">
          <h4>Validacion publica</h4>
          <p>
            Cada diploma se puede validar por codigo. Esto ya deja preparada la pieza para
            llevarla luego a la web publica de la asociacion.
          </p>
          ${
            previewCode
              ? `
                <p><strong>Registro demo:</strong> ${previewRegistry}</p>
                <div class="chip-row compact-chip-row">
                  <button class="ghost-button" type="button" data-action="prefill-report-validation" data-code="${escapeHtml(previewCode)}">Usar codigo demo ${escapeHtml(previewCode)}</button>
                  <a class="button-link" target="_blank" rel="noreferrer" href="/verify.html?code=${encodeURIComponent(previewCode)}">Abrir validacion publica</a>
                  <a class="button-link" target="_blank" rel="noreferrer" href="/api/verify/pdf?code=${encodeURIComponent(previewCode)}">Descargar PDF demo</a>
                </div>
              `
              : `<p class="muted">No hay diplomas generados para probar la validacion.</p>`
          }
          <div class="studio-grid validation-workbench">
            <label class="inline-field">
              Codigo del diploma
              <input id="reportValidationCode" value="${escapeHtml(reportValidationCode || previewCode || "")}" placeholder="Ejemplo: IZ-2026-1-1" />
            </label>
            <div class="chip-row validation-workbench-actions">
              <button class="primary-button" type="button" data-action="run-report-validation">Validar ahora</button>
              ${
                previewCode
                  ? `<button class="ghost-button" type="button" data-action="prefill-report-validation" data-code="${escapeHtml(previewCode)}">Cargar demo</button>`
                  : ""
              }
            </div>
          </div>
          ${
            reportValidationResult
              ? reportValidationResult.error
                ? `<p class="status-note warning">${escapeHtml(reportValidationResult.error)}</p>`
                : `
                    <div class="table-card">
                      <table>
                        <tbody>
                          <tr><td>Codigo</td><td>${escapeHtml(reportValidationResult.code)}</td></tr>
                          <tr><td>Alumno</td><td>${escapeHtml(reportValidationResult.memberName)}</td></tr>
                          <tr><td>Curso</td><td>${escapeHtml(reportValidationResult.courseTitle)}</td></tr>
                          <tr><td>Tipo</td><td>${escapeHtml(reportValidationResult.courseType || "-")}</td></tr>
                          <tr><td>Horas</td><td>${escapeHtml(String(reportValidationResult.hours || "-"))}</td></tr>
                          <tr><td>Fecha fin</td><td>${formatDate(reportValidationResult.endDate)}</td></tr>
                        </tbody>
                      </table>
                      <div class="chip-row compact-chip-row">
                        <a class="button-link" target="_blank" rel="noreferrer" href="/verify.html?code=${encodeURIComponent(reportValidationResult.code)}">Abrir validacion publica</a>
                        <a class="button-link" target="_blank" rel="noreferrer" href="/api/verify/pdf?code=${encodeURIComponent(reportValidationResult.code)}">Descargar PDF validado</a>
                      </div>
                    </div>
                  `
              : ""
          }
        </div>
        `
            : ""
        }

      ${
        showReportsSection("storage")
          ? `
      <div class="mail-card associate-anchor" id="reportSectionStorage">
        <h4>Almacenamiento actual</h4>
        ${
          storageMeta
            ? `
              <p>Base local: ${storageMeta.dbPath}</p>
              <p>Snapshot legible: ${storageMeta.snapshotPath}</p>
              <p>Ultima actualizacion: ${storageMeta.updatedAt ? formatDateTime(storageMeta.updatedAt) : "Sin datos"}</p>
            `
            : `<p class="muted">No se ha podido leer la informacion del almacenamiento.</p>`
        }
        ${
          !isDemoSession() && (state.associates?.length || 0) === 0 && (state.courses?.length || 0) === 0
            ? `
              <div class="status-note danger">
                Este servicio aparece con <strong>0 socios</strong> y <strong>0 cursos</strong>. Normalmente eso significa que Railway esta leyendo una base nueva,
                otro disco o un despliegue sin los datos reales. Antes de tocar nada, descarga una copia y confirma la ruta mostrada arriba.
              </div>
            `
            : ""
        }
        <div class="stack gap-12">
          <div class="inline-actions">
            <a class="button-link" href="/api/storage/export-state">Descargar copia actual del campus</a>
          </div>
          ${
            storageExportStatus
              ? `<p class="muted">${escapeHtml(storageExportStatus)}</p>`
              : `<p class="muted">Descarga una copia del estado actual antes de limpiar, migrar o tocar Railway.</p>`
          }
          <div class="status-note warning">
            <strong>Prepublicacion limpia:</strong> usa esto solo en la web de prueba si quieres borrar socios demo,
            cursos demo, alumnado ficticio y avisos antes de cargar el Excel real.
          </div>
          <div class="inline-actions">
            <button type="button" class="ghost-button" data-action="prepare-clean-prepublication">Preparar web limpia para Excel real</button>
          </div>
          <p class="muted">
            Si la web de prueba sigue en modo demo, sube aqui el
            <strong>state.json</strong> real de tu equipo para cargar socios, cursos, diplomas y accesos reales.
          </p>
          <label class="field">
            <span>Snapshot real del campus</span>
            <input id="storageStateSnapshotFile" type="file" accept=".json,application/json" />
          </label>
          ${
            storageImportDraftFile
              ? `<p class="muted">Archivo preparado: ${storageImportDraftFile.name} (${formatFileSize(storageImportDraftFile.size)})</p>`
              : ""
          }
          ${
            storageImportStatus
              ? `<p class="muted">${storageImportStatus}</p>`
              : `<p class="muted">Despues de importarlo, el campus cerrara la sesion demo para que vuelvas a entrar con tus credenciales reales.</p>`
          }
          <div class="inline-actions">
            <button type="button" class="ghost-button" data-action="export-storage-state">Descargar state.json actual</button>
            <button type="button" data-action="import-storage-state">Importar state.json real</button>
          </div>
        </div>
      </div>
      `
          : ""
      }

      ${
        showReportsSection("agent")
          ? `
      <div class="mail-card associate-anchor" id="reportSectionAgent">
        <h4>Contexto para agente</h4>
        <p>
          El campus ya expone un contexto JSON con la bandeja automatica, politicas y resumen
          operativo para un futuro agente.
        </p>
        <a class="button-link" target="_blank" rel="noreferrer" href="/api/agent/context">Abrir contexto del agente</a>
      </div>

      <div class="mail-card">
        <h4>Formulario publico de socios</h4>
        <p>Esta pieza ya prepara la sustitucion del Google Form por un alta integrada dentro de la web.</p>
        <a class="button-link" target="_blank" rel="noreferrer" href="/join.html">Abrir alta de socio</a>
      </div>

      ${renderSmtpSettingsCard()}
      `
          : ""
      }
    </div>
  `;
}

function renderActivity() {
  if (!isAdminView()) {
    return `<div class="empty-state">La auditoria interna solo esta disponible para administracion.</div>`;
  }

  const recentItems = [...state.activityLog]
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, 20);
  const byType = state.activityLog.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});
  const latestItem = recentItems[0] || null;

  return `
    <div class="panel-stack associate-anchor" id="activitySectionTimeline">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Actividad y auditoria</p>
          <h3>Registro de acciones del campus</h3>
        </div>
        <a class="button-link" href="/api/reports/activity.csv">Descargar auditoria</a>
      </div>

      <div class="status-note info">
        ${state.activityLog.length} evento(s), ${byType.admin || 0} accion(es) de administracion, ${byType.member || 0} de alumnado y ${
          byType.system || 0
        } del sistema. ${latestItem ? `Ultimo movimiento: ${escapeHtml(latestItem.actor)} (${formatDateTime(latestItem.at)}).` : "Todavia no hay eventos."}
      </div>

      ${
        recentItems.length
          ? `<div class="compact-list">
              ${recentItems
                .map(
                  (item) => `
                  <div class="timeline-item compact-timeline-item">
                    <span class="eyebrow">${escapeHtml(item.type)}</span>
                    <strong>${escapeHtml(item.actor)}</strong>
                    <p>${escapeHtml(item.message)}</p>
                    <p class="muted">${formatDateTime(item.at)}</p>
                  </div>
                `
                )
                .join("")}
            </div>`
          : `<div class="empty-state">Todavia no hay actividad registrada.</div>`
      }
    </div>
  `;
}

function renderManualCampusNoticesManager() {
  const notices = [...(state.manualCampusNotices || [])].sort((left, right) =>
    String(right.publishedAt || "").localeCompare(String(left.publishedAt || ""))
  );

  return `
    <div class="mail-card associate-anchor" id="automationSectionNotices">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Buzon manual</p>
          <h4>Novedades del campus</h4>
          <p class="muted">Publica avisos visibles en <strong>Campus &gt; Avisos</strong> y en <strong>Mi panel</strong> para socios, externos o alumnado de un curso concreto. Email ya disponible; WhatsApp queda preparado para la siguiente fase.</p>
        </div>
      </div>

      <div class="studio-grid">
        <label class="inline-field studio-full">
          Titulo
          <input id="manualNoticeTitle" placeholder="Ej. Se ha publicado documentacion nueva" />
        </label>
        <label class="inline-field studio-full">
          Mensaje
          <textarea id="manualNoticeDetail" rows="4" placeholder="Explica la novedad o el siguiente paso para la persona destinataria"></textarea>
        </label>
        <label class="inline-field">
          Destinatarios
          <select id="manualNoticeAudience">
            ${Object.entries(MANUAL_NOTICE_AUDIENCE_LABELS)
              .map(([value, label]) => `<option value="${value}">${label}</option>`)
              .join("")}
          </select>
          <span class="field-hint">Para escribir a los socios importados desde el Excel, usa "Socios activos". No necesitan tener cuenta de campus creada.</span>
        </label>
        <label class="inline-field">
          Tono
          <select id="manualNoticeTone">
            ${Object.entries(MANUAL_NOTICE_TONE_LABELS)
              .map(([value, label]) => `<option value="${value}">${label}</option>`)
              .join("")}
          </select>
        </label>
        <label class="inline-field">
          Curso vinculado
          <select id="manualNoticeCourseId">
            <option value="">Sin curso</option>
            ${(state.courses || [])
              .map((course) => `<option value="${course.id}">${escapeHtml(course.title)}</option>`)
              .join("")}
          </select>
          <span class="field-hint">Si eliges un curso, el aviso servira tambien para abrirlo directamente desde el campus del alumno.</span>
        </label>
        <label class="inline-field">
          Caduca el
          <input id="manualNoticeExpiresAt" type="datetime-local" />
          <span class="field-hint">Opcional. Cuando pase esa fecha, el aviso deja de mostrarse.</span>
        </label>
        <label class="inline-field">
          Texto del boton
          <input id="manualNoticeActionLabel" placeholder="Ej. Abrir curso" />
          <span class="field-hint">Opcional. Si hay curso vinculado y lo dejas vacio, se usara "Abrir curso".</span>
        </label>
        <label class="inline-field">
          Salida adicional
          <label class="checkbox-inline">
            <input id="manualNoticeSendEmail" type="checkbox" />
            <span>Registrar tambien en salida de correo</span>
          </label>
          <span class="field-hint">No envia al instante si no hay SMTP. Lo deja preparado en la bandeja de salida.</span>
        </label>
      </div>

      <div class="chip-row">
        <button class="primary-button" type="button" data-action="publish-manual-campus-notice">Publicar novedad</button>
      </div>

      ${
        notices.length
          ? `
            <div class="compact-list">
              ${notices
                .map(
                  (notice) => `
                    <div class="timeline-item compact-timeline-item">
                      <div class="row-between">
                        <strong>${escapeHtml(notice.title || "Novedad sin titulo")}</strong>
                        <div class="chip-row">
                          <span class="small-chip">${escapeHtml(MANUAL_NOTICE_AUDIENCE_LABELS[notice.audience] || "Todo el campus")}</span>
                          <span class="small-chip">${escapeHtml(
                            notice.active === false ? "Oculto" : notice.expiresAt && !isManualCampusNoticeActive(notice) ? "Caducado" : "Publicado"
                          )}</span>
                          <span class="small-chip">${escapeHtml(
                            [
                              notice.channels?.campus ? "Campus" : "",
                              notice.channels?.email ? "Email" : "",
                              notice.channels?.whatsapp ? "WhatsApp" : ""
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Campus"
                          )}</span>
                        </div>
                      </div>
                      <p>${escapeHtml(notice.detail || "Sin detalle")}</p>
                      <p class="muted">
                        Publicado ${formatDateTime(notice.publishedAt)}${notice.courseId ? ` · Curso: ${escapeHtml(findCourse(notice.courseId)?.title || "Curso vinculado")}` : ""}${notice.expiresAt ? ` · Hasta ${formatDateTime(notice.expiresAt)}` : ""}
                      </p>
                      <div class="chip-row">
                        <button class="mini-button" type="button" data-action="toggle-manual-campus-notice" data-notice-id="${notice.id}">
                          ${notice.active === false ? "Publicar de nuevo" : "Ocultar"}
                        </button>
                        <button class="mini-button" type="button" data-action="delete-manual-campus-notice" data-notice-id="${notice.id}">Eliminar</button>
                      </div>
                    </div>
                  `
                )
                .join("")}
            </div>
          `
          : `<div class="empty-state">Todavia no hay novedades manuales publicadas.</div>`
      }
    </div>
  `;
}

function renderSmtpSettingsCard() {
  const smtp = state.settings?.smtp || {};
  const isHostingerLike = !smtp.host || String(smtp.host).includes("hostinger");
  return `
    <div class="mail-card associate-anchor" id="reportSectionSmtp">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Correo saliente</p>
          <h4>SMTP para avisos a socios</h4>
          <p class="muted">Configura un buzon real para enviar bienvenidas, novedades y avisos de cuota a socios activos.</p>
        </div>
        <span class="small-chip">${smtp.host && smtp.fromEmail ? "SMTP configurado" : "Pendiente"}</span>
      </div>

      <form id="smtpSettingsForm" class="stack">
        <div class="form-grid">
          <label class="field">
            <span>Servidor SMTP</span>
            <input id="smtpConfigHost" placeholder="smtp.hostinger.com" value="${escapeHtml(smtp.host || (isHostingerLike ? "smtp.hostinger.com" : ""))}" />
          </label>
          <label class="field">
            <span>Puerto</span>
            <input id="smtpConfigPort" type="number" min="1" placeholder="465" value="${smtp.port || 465}" />
          </label>
          <label class="field">
            <span>Usuario SMTP</span>
            <input id="smtpConfigUser" placeholder="campus@isocronazero.org" value="${escapeHtml(smtp.username || "")}" />
          </label>
          <label class="field">
            <span>Contrasena del buzon</span>
            <input id="smtpConfigPassword" type="password" autocomplete="new-password" placeholder="Contrasena del correo" value="${escapeHtml(smtp.password || "")}" />
          </label>
          <label class="field">
            <span>Correo remitente</span>
            <input id="smtpConfigFromEmail" type="email" placeholder="campus@isocronazero.org" value="${escapeHtml(smtp.fromEmail || "")}" />
          </label>
          <label class="field">
            <span>Nombre remitente</span>
            <input id="smtpConfigFromName" placeholder="Isocrona Zero Campus" value="${escapeHtml(smtp.fromName || "Isocrona Zero Campus")}" />
          </label>
          <label class="field">
            <span>Correo de prueba</span>
            <input id="smtpConfigTestTo" type="email" placeholder="tu-correo@ejemplo.org" value="${escapeHtml(smtp.testTo || "")}" />
          </label>
        </div>

        <div class="chip-row">
          <label class="inline-field"><span>SSL directo</span><input id="smtpConfigSecure" type="checkbox" ${smtp.secure !== false ? "checked" : ""} /></label>
          <label class="inline-field"><span>STARTTLS</span><input id="smtpConfigStartTls" type="checkbox" ${smtp.startTls ? "checked" : ""} /></label>
        </div>

        <div class="status-note info">
          Para Hostinger suele funcionar: servidor <strong>smtp.hostinger.com</strong>, puerto <strong>465</strong>, SSL directo activado y STARTTLS desactivado.
        </div>

        <div class="inline-actions">
          <button class="primary-button" type="submit">Guardar SMTP</button>
          <button class="ghost-button" type="button" data-action="smtp-test">Probar SMTP</button>
        </div>
      </form>
    </div>
  `;
}

function renderAutomation() {
  if (!isAdminView()) {
    return `<div class="empty-state">La automatizacion y la bandeja operativa solo estan disponibles para administracion.</div>`;
  }

  const closable = state.courses.filter((course) => course.status === "Cierre pendiente");
  const pendingMailCourses = state.courses.filter(
    (course) => getCoursePendingDiplomaDeliveries(course) > 0
  );
  const lastEmails = state.emailOutbox.slice(-4).reverse();
  const queuedEmailCount = (state.emailOutbox || []).filter(
    (mail) =>
      ["queued", "manual", "failed"].includes(String(mail.status || "").trim()) &&
      String(mail.to || "").trim()
  ).length;
  const agentItems = [...(state.agentLog || [])]
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, 6);
  const inboxItems = [...(state.automationInbox || [])]
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 8);
  const lastSummary = state.automationMeta?.lastSummary || null;
  const nextAgentItem = pickNextAgentItem();
  const showAutomationSection = (section) =>
    automationSectionMode === "all" || automationSectionMode === section;
  return `
    <div class="panel-stack">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Asistente y automatizacion</p>
          <h3>Bandeja, reglas y salida automatica</h3>
        </div>
        ${
          isAdminView()
            ? `
              <div class="chip-row">
                <button class="ghost-button" data-action="agent-resolve-next">Resolver siguiente del agente</button>
                <button class="ghost-button" data-action="resolve-all-inbox">Resolver todo lo seguro</button>
                <button class="primary-button" data-action="automation-run">Ejecutar reglas automaticas</button>
              </div>
            `
            : ""
        }
      </div>

      <div class="chip-row">
        <button class="${automationSectionMode === "all" ? "primary-button" : "ghost-button"}" data-action="set-automation-section-mode" data-mode="all">Todo</button>
        <button class="${automationSectionMode === "status" ? "primary-button" : "ghost-button"}" data-action="set-automation-section-mode" data-mode="status">Motor</button>
        <button class="${automationSectionMode === "notices" ? "primary-button" : "ghost-button"}" data-action="set-automation-section-mode" data-mode="notices">Novedades</button>
        <button class="${automationSectionMode === "next" ? "primary-button" : "ghost-button"}" data-action="set-automation-section-mode" data-mode="next">Siguiente</button>
        <button class="${automationSectionMode === "inbox" ? "primary-button" : "ghost-button"}" data-action="set-automation-section-mode" data-mode="inbox">Bandeja</button>
        <button class="${automationSectionMode === "outbox" ? "primary-button" : "ghost-button"}" data-action="set-automation-section-mode" data-mode="outbox">Salida</button>
        <button class="${automationSectionMode === "history" ? "primary-button" : "ghost-button"}" data-action="set-automation-section-mode" data-mode="history">Historial</button>
      </div>

      ${
        showAutomationSection("status")
          ? `
      <div class="assistant-card associate-anchor" id="automationSectionStatus">
        <h4>Resumen operativo</h4>
        <div class="status-note info">
          Ultima ejecucion:
          ${
            state.automationMeta?.lastRunAt
              ? `${formatDateTime(state.automationMeta.lastRunAt)} | ${escapeHtml(state.automationMeta.lastReason || "Sin motivo")}`
              : "todavia no registrada"
          }.
          Bandeja: ${inboxItems.length}. Salida: ${lastEmails.length}. Auto al guardar: ${
            state.settings.automation.autoRunOnSave ? "activo" : "manual"
          }. Envio auto: ${state.settings.automation.autoSendDiplomas ? "activo" : "manual"}.
        </div>
        ${
          lastSummary
            ? `
              <p class="muted">
                Ultimo balance: ${lastSummary.updatedDiplomas || 0} diploma(s), ${lastSummary.promotedWaitlist || 0} promocion(es),
                ${lastSummary.sentDiplomas || 0} envio(s), ${lastSummary.closedCourses || 0} cierre(s) y ${lastSummary.inboxItems || 0} aviso(s).
              </p>
            `
            : ""
        }
        <p class="muted">
          ${
            nextAgentItem
              ? `Siguiente tarea: ${escapeHtml(nextAgentItem.title)}.`
              : "No hay una tarea prioritaria abierta ahora mismo."
          }
          ${
            pendingMailCourses.length
              ? ` ${pendingMailCourses.length} curso(s) tienen diplomas pendientes de salida.`
              : " No hay salida urgente."
          }
        </p>
        <p class="muted">
          Limites del agente: ${escapeHtml(state.settings.agent.notes)} Activo: ${state.settings.agent.enabled ? "si" : "no"} |
          Resolver bandeja: ${state.settings.agent.canResolveInbox ? "si" : "no"} |
          Enviar diplomas: ${state.settings.agent.canSendDiplomas ? "si" : "no"} |
          Cerrar cursos: ${state.settings.agent.canCloseCourses ? "si" : "no"}.
        </p>
      </div>
      `
          : ""
      }

      ${
        showAutomationSection("notices")
          ? renderManualCampusNoticesManager()
          : ""
      }

      ${
        showAutomationSection("next")
          ? `
      <div class="assistant-card associate-anchor" id="automationSectionNext">
        <h4>Siguiente tarea del agente</h4>
        ${
          nextAgentItem
            ? `
              <p><strong>${escapeHtml(nextAgentItem.title)}</strong></p>
              <p>${escapeHtml(nextAgentItem.detail || "Sin detalle")}</p>
              <p class="muted">Tipo: ${escapeHtml(nextAgentItem.type)}</p>
            `
            : `<p class="muted">No hay tareas permitidas y resolubles para el agente en este momento.</p>`
        }
      </div>
      `
          : ""
      }

      ${
        showAutomationSection("inbox")
          ? `
      <div class="mail-card associate-anchor" id="automationSectionInbox">
        <h4>Bandeja automatica</h4>
        ${
          inboxItems.length
            ? `<div class="compact-list">
                ${inboxItems
                  .map(
                    (item) => `
                    <div class="timeline-item compact-timeline-item">
                      <span class="eyebrow">${escapeHtml(item.type)}</span>
                      <strong>${escapeHtml(item.title)}</strong>
                      <p>${escapeHtml(item.detail)}</p>
                      <p class="muted">${formatDateTime(item.createdAt)}</p>
                      ${
                        isAdminView() && getAutomationActionLabel(item)
                          ? `
                            <div class="chip-row">
                              <button class="mini-button" data-action="resolve-inbox" data-item-id="${item.id}">
                                ${getAutomationActionLabel(item)}
                              </button>
                            </div>
                          `
                          : ""
                      }
                    </div>
                  `
                  )
                  .join("")}
              </div>`
            : `<p>Todavia no hay items en la bandeja automatica.</p>`
        }
      </div>
      `
          : ""
      }

      ${
        showAutomationSection("outbox")
          ? `
      <div class="mail-card associate-anchor" id="automationSectionOutbox">
        <div class="row-between">
          <h4>Bandeja de salida</h4>
          <div class="chip-row">
            <span class="small-chip">${queuedEmailCount} pendiente(s)</span>
            ${
              isAdminView()
                ? `<button class="ghost-button" data-action="send-queued-emails" ${queuedEmailCount ? "" : "disabled"}>Enviar pendientes por SMTP</button>`
                : ""
            }
          </div>
        </div>
        ${
          lastEmails.length
            ? `<div class="compact-list">
                ${lastEmails
                  .map(
                    (mail) => `
                    <div class="timeline-item compact-timeline-item">
                      <strong>${mail.to}</strong>
                      <p>${mail.subject}</p>
                      <p>${formatDateTime(mail.sentAt)} | ${mail.status || "queued"} | ${mail.transport || "manual"}</p>
                      ${mail.deliveryError ? `<p class="muted">Error: ${mail.deliveryError}</p>` : ""}
                      <div class="chip-row">
                        <a class="mini-button" href="/api/emails/${mail.id}.eml">Descargar .eml</a>
                        ${
                          isAdminView()
                            ? `<button class="mini-button" data-action="resend-mail" data-mail-id="${mail.id}">Reenviar SMTP</button>`
                            : ""
                        }
                      </div>
                    </div>
                  `
                  )
                  .join("")}
              </div>`
            : `<p>Todavia no hay correos registrados en la bandeja de salida.</p>`
        }
      </div>
      `
          : ""
      }

      ${
        showAutomationSection("history")
          ? `
      <div class="mail-card associate-anchor" id="automationSectionHistory">
        <h4>Historial del agente</h4>
        ${
          agentItems.length
            ? `<div class="compact-list">
                ${agentItems
                  .map(
                    (item) => `
                    <div class="timeline-item compact-timeline-item">
                      <strong>${escapeHtml(item.target || item.itemType)}</strong>
                      <p>${escapeHtml(item.detail)}</p>
                      <p class="muted">${formatDateTime(item.at)} | ${escapeHtml(item.outcome)}</p>
                    </div>
                  `
                  )
                  .join("")}
              </div>`
            : `<p class="muted">Todavia no hay decisiones registradas por el agente.</p>`
        }
      </div>
      `
          : ""
      }
    </div>
  `;
}

function renderTimeline(course) {
  const selectedMember = findMember(state.selectedMemberId);
  const nextAgentItem = pickNextAgentItem();
  const pendingAssociateApplications = countPendingAssociateApplications();
  const pendingPaymentSubmissions = state.associatePaymentSubmissions.filter(
    (item) => item.status === "Pendiente de revision"
  ).length;
  const pendingProfileRequests = state.associateProfileRequests.filter(
    (item) => item.status === "Pendiente de revision"
  ).length;
  const pendingDiplomas = state.courses.reduce(
    (sum, entry) => sum + Math.max(entry.diplomaReady.length - entry.mailsSent.length, 0),
    0
  );

  return `
    <div class="panel-stack">
      <div>
        <p class="eyebrow">Estado del dia</p>
        <h3>Radar de operativa</h3>
      </div>
      <div class="status-note info">
        Altas pendientes: ${pendingAssociateApplications}. Justificantes: ${pendingPaymentSubmissions}. Cambios de ficha: ${pendingProfileRequests}. Diplomas por enviar: ${pendingDiplomas}.
      </div>
      <div class="timeline-item">
        <span class="eyebrow">Siguiente del agente</span>
        <p>${escapeHtml(nextAgentItem?.title || "Sin prioridad abierta en la bandeja automatica")}</p>
      </div>
      ${
        selectedMember
          ? `<div class="timeline-item"><span class="eyebrow">Persona activa</span><p>${selectedMember.name} | ${selectedMember.role}</p></div>`
          : ""
      }
      ${
        course
          ? `<div class="timeline-item"><span class="eyebrow">Curso seleccionado</span><p>${course.title} con ${getCourseEnrolledCount(course)} inscritos y ${getCourseWaitingCount(course)} en espera.</p></div>`
          : ""
      }
    </div>
  `;
}

function renderMemberTimeline(course) {
  const member = getCurrentMember();
  const associate = getCurrentAssociate();
  const primaryCourse = course || getPrimaryMemberCourse(member?.id);
  const journey = primaryCourse ? getLearnerCourseJourney(primaryCourse, member?.id) : null;
  const alerts = getMemberCampusAlerts(member?.id);

  return `
    <div class="panel-stack">
      <div>
        <p class="eyebrow">Tu panel rapido</p>
        <h3>Hoy en el campus</h3>
      </div>
      <div class="status-note info">
        ${escapeHtml(member?.name || "Sin ficha")} | ${escapeHtml(associate?.status || "Sin ficha de socio")} | ${
          primaryCourse ? escapeHtml(primaryCourse.title) : "Sin curso activo"
        }.
      </div>
      <div class="timeline-item">
        <p>Siguiente paso</p>
        <strong>${escapeHtml(journey?.nextStep?.block?.title || journey?.nextStep?.lessonTitle || (journey?.hasDiploma ? "Diploma disponible" : "Sin paso pendiente"))}</strong>
      </div>
      <div class="timeline-item">
        <p>Progreso y avisos</p>
        <strong>${journey ? `${journey.progress.blockProgress}%` : "0%"} | ${alerts.length} aviso(s)</strong>
      </div>
      ${
        alerts.length
          ? `<div class="timeline-item"><p>Prioridad</p><strong>${escapeHtml(alerts[0].title)}</strong></div>`
          : ""
      }
    </div>
  `;
}

function renderValidations() {
  if (!isAdminView()) {
    return `<div class="empty-state">Las validaciones solo estan disponibles para administracion.</div>`;
  }

  const pendingApplications = (state.associateApplications || []).filter((item) =>
    isAssociateApplicationPending(item)
  );
  const pendingProfileRequests = (state.associateProfileRequests || []).filter(
    (item) => item.status === "Pendiente de revision"
  );
  const pendingPaymentSubmissions = (state.associatePaymentSubmissions || []).filter(
    (item) => item.status === "Pendiente de revision"
  );

  return `
    <div class="panel-stack">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Validaciones</p>
          <h3>Altas, cambios y cuotas pendientes</h3>
          <p class="muted">Una vista rapida para que administracion resuelva lo pendiente sin perder contexto.</p>
        </div>
        <div class="chip-row">
          <button class="ghost-button" type="button" data-action="nav" data-view="associates">Socios y cuotas</button>
          <button class="ghost-button" type="button" data-action="nav" data-view="overview">Volver al panel</button>
        </div>
      </div>

      <div class="status-note info">
        ${pendingApplications.length} alta(s), ${pendingProfileRequests.length} cambio(s) y ${pendingPaymentSubmissions.length} justificante(s) pendientes.
      </div>

      <div class="course-grid">
        <div class="mail-card associate-anchor" id="validationSectionApplications">
          <div class="panel-header">
            <div>
              <h4>Solicitudes de alta</h4>
              <p class="muted">Nuevas solicitudes de socio pendientes de revisar.</p>
            </div>
            <button class="ghost-button" type="button" data-action="nav-section" data-view="associates" data-section-id="associateSectionApplications">Ver tabla completa</button>
          </div>
          ${
            pendingApplications.length
              ? `<div class="compact-list">
                  ${pendingApplications
                    .slice(0, 10)
                    .map((item) => {
                      const readiness = getAssociateApplicationReadiness(item);
                      return `
                        <div class="timeline-item compact-timeline-item">
                          <strong>${escapeHtml(getAssociateApplicantName(item))}</strong>
                          <p>${escapeHtml(item.email || "-")} | ${escapeHtml(item.service || "-")}</p>
                          <p class="muted">${formatDateTime(item.submittedAt)} | ${escapeHtml(item.status || "Pendiente")}</p>
                          <div class="chip-row">${renderAssociateApplicationValidationChips(item)}</div>
                          <div class="chip-row">
                            <button class="mini-button" type="button" data-action="approve-associate" data-application-id="${item.id}" ${readiness.ready ? "" : "disabled"}>Aprobar</button>
                            <button class="mini-button" type="button" data-action="reject-associate" data-application-id="${item.id}">Rechazar</button>
                          </div>
                        </div>
                      `;
                    })
                    .join("")}
                </div>`
              : `<p class="muted">No hay solicitudes de alta pendientes.</p>`
          }
        </div>

        <div class="mail-card associate-anchor" id="validationSectionProfiles">
          <div class="panel-header">
            <div>
              <h4>Cambios de ficha</h4>
              <p class="muted">Solicitudes enviadas por los socios para actualizar su ficha.</p>
            </div>
            <button class="ghost-button" type="button" data-action="nav-section" data-view="associates" data-section-id="associateSectionProfiles">Ver tabla completa</button>
          </div>
          ${
            pendingProfileRequests.length
              ? `<div class="compact-list">
                  ${pendingProfileRequests
                    .slice(0, 10)
                    .map((request) => {
                      const associate = findAssociate(request.associateId);
                      const changedRows = getAssociateProfileRequestComparisonRows(request)
                        .filter((row) => row.changed)
                        .slice(0, 3);
                      return `
                        <div class="timeline-item compact-timeline-item">
                          <strong>${escapeHtml(getAssociateFullName(associate) || request.email || "Cambio de ficha")}</strong>
                          <p class="muted">${formatDateTime(request.submittedAt)} | ${escapeHtml(request.status || "Pendiente de revision")}</p>
                          ${
                            changedRows.length
                              ? changedRows
                                  .map(
                                    (row) => `<p><strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.current)} → <strong>${escapeHtml(row.proposed)}</strong></p>`
                                  )
                                  .join("")
                              : `<p class="muted">Sin diferencias resumidas.</p>`
                          }
                          <div class="chip-row">
                            <button class="mini-button" type="button" data-action="approve-associate-profile-request" data-request-id="${request.id}">Aprobar</button>
                            <button class="mini-button" type="button" data-action="reject-associate-profile-request" data-request-id="${request.id}">Rechazar</button>
                          </div>
                        </div>
                      `;
                    })
                    .join("")}
                </div>`
              : `<p class="muted">No hay cambios de ficha pendientes.</p>`
          }
        </div>
      </div>

      <div class="mail-card associate-anchor" id="validationSectionPayments">
        <div class="panel-header">
          <div>
            <h4>Justificantes de cuota</h4>
            <p class="muted">Valida los pagos enviados para mantener el acceso de los socios al dia.</p>
          </div>
          <button class="ghost-button" type="button" data-action="nav-section" data-view="associates" data-section-id="associateSectionPayments">Ver tabla completa</button>
        </div>
        ${
          pendingPaymentSubmissions.length
            ? `<div class="compact-list">
                ${pendingPaymentSubmissions
                  .slice(0, 10)
                  .map((submission) => {
                    const associate = findAssociate(submission.associateId);
                    return `
                      <div class="timeline-item compact-timeline-item">
                        <strong>${escapeHtml(getAssociateFullName(associate) || "Socio")}</strong>
                        <p>${escapeHtml(submission.year || "-")} | ${formatCurrency(Number(submission.amount || 0))} | ${escapeHtml(submission.method || "-")}</p>
                        <p class="muted">${formatDateTime(submission.submittedAt)} | ${escapeHtml(submission.status || "Pendiente de revision")}</p>
                        ${submission.note ? `<p class="muted">${escapeHtml(submission.note)}</p>` : ""}
                        <div class="chip-row">
                          <button class="mini-button" type="button" data-action="approve-associate-payment" data-submission-id="${submission.id}">Aprobar</button>
                          <button class="mini-button" type="button" data-action="reject-associate-payment" data-submission-id="${submission.id}">Rechazar</button>
                        </div>
                      </div>
                    `;
                  })
                  .join("")}
              </div>`
            : `<p class="muted">No hay justificantes de cuota pendientes.</p>`
        }
      </div>
    </div>
  `;
}

function renderValidationsSide() {
  if (!isAdminView()) {
    return `<div class="empty-state">Las validaciones solo estan disponibles para administracion.</div>`;
  }

  const pendingApplications = (state.associateApplications || []).filter((item) =>
    isAssociateApplicationPending(item)
  ).length;
  const pendingProfileRequests = (state.associateProfileRequests || []).filter(
    (item) => item.status === "Pendiente de revision"
  ).length;
  const pendingPaymentSubmissions = (state.associatePaymentSubmissions || []).filter(
    (item) => item.status === "Pendiente de revision"
  ).length;

  return `
    <div class="panel-stack">
      <div>
        <p class="eyebrow">Resumen de validaciones</p>
        <h3>Operativa pendiente</h3>
      </div>
      <div class="status-note info">
        ${pendingApplications} alta(s), ${pendingProfileRequests} cambio(s) y ${pendingPaymentSubmissions} justificante(s) en cola.
      </div>
      <div class="chip-row">
        <button class="primary-button" type="button" data-action="nav-section" data-view="validations" data-section-id="validationSectionApplications">Altas</button>
        <button class="ghost-button" type="button" data-action="nav-section" data-view="validations" data-section-id="validationSectionProfiles">Cambios</button>
        <button class="ghost-button" type="button" data-action="nav-section" data-view="validations" data-section-id="validationSectionPayments">Cuotas</button>
      </div>
    </div>
  `;
}

function renderReportsSide() {
  const diplomaCount = state.courses.reduce((sum, course) => sum + course.diplomaReady.length, 0);
  return `
    <div class="panel-stack">
      <div>
        <p class="eyebrow">Resumen de salida</p>
        <h3>Datos exportables</h3>
      </div>
      <div class="status-note info">
        ${state.courses.length} curso(s), ${diplomaCount} diploma(s) y ${state.emailOutbox.length} correo(s). Motor ${
          storageMeta ? "SQLite local" : "no disponible"
        }.
      </div>
      <div class="chip-row">
        <button class="primary-button" data-action="nav-section" data-view="reports" data-section-id="reportSectionExports">Exportaciones</button>
        <button class="ghost-button" data-action="nav-section" data-view="reports" data-section-id="reportSectionValidation">Validacion</button>
        <button class="ghost-button" data-action="nav-section" data-view="reports" data-section-id="reportSectionAgent">Agente</button>
      </div>
    </div>
  `;
}

function renderActivitySide() {
  const byType = state.activityLog.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  return `
    <div class="panel-stack">
      <div>
        <p class="eyebrow">Resumen de actividad</p>
        <h3>Auditoria interna</h3>
      </div>
      <div class="status-note info">
        ${state.activityLog.length} evento(s), ${byType.admin || 0} admin, ${byType.member || 0} alumnado y ${byType.system || 0} sistema.
      </div>
    </div>
  `;
}

function renderMemberWorkbench(member) {
  if (!member) {
    return `<div class="empty-state">Selecciona una persona del listado para abrir su ficha de trabajo.</div>`;
  }

  const account = findAccountByMember(member.id);
  const history = getMemberHistory(member.id);
  const certifications = member.certifications || [];

  return `
    <div class="panel-stack">
      <div class="chip-row">
        <span class="chip">${escapeHtml(member.role || "Sin rol")}</span>
        <span class="chip">${account ? `Acceso ${escapeHtml(account.role)}` : "Sin acceso"}</span>
        <span class="chip">${member.renewalsDue || 0} renovacion(es)</span>
      </div>

      <form id="memberEditForm" class="stack">
        <label class="inline-field">
          Nombre
          <input id="editMemberName" value="${escapeHtml(member.name)}" />
        </label>
        <label class="inline-field">
          Rol
          <input id="editMemberRole" value="${escapeHtml(member.role)}" />
        </label>
        <label class="inline-field">
          Email
          <input id="editMemberEmail" type="email" value="${escapeHtml(member.email)}" />
        </label>
        <label class="inline-field">
          Certificaciones
          <input id="editMemberCertifications" value="${escapeHtml(certifications.join(", "))}" />
        </label>
        <label class="inline-field">
          Renovaciones pendientes
          <input id="editMemberRenewals" type="number" min="0" value="${member.renewalsDue}" />
        </label>
        <label class="inline-field">
          <span>Cuenta de acceso</span>
          <input id="editMemberHasAccess" type="checkbox" ${account ? "checked" : ""} />
        </label>
        <label class="inline-field">
          Rol de acceso
          <select id="editMemberAccessRole">
            <option value="member" ${account?.role === "member" ? "selected" : ""}>Alumno</option>
            <option value="admin" ${account?.role === "admin" ? "selected" : ""}>Administracion</option>
          </select>
        </label>
        <label class="inline-field">
          Nueva contrasena
          <input id="editMemberAccessPassword" placeholder="${account ? "Dejar vacia para mantener" : "Crear acceso"}" />
        </label>
        <div class="chip-row">
          <button class="primary-button" type="submit">Guardar ficha</button>
          <button class="ghost-button" type="button" data-action="nav-section" data-view="members" data-section-id="memberSectionDirectory">Volver al listado</button>
        </div>
      </form>

      <div class="mail-card">
        <h4>Historial formativo</h4>
        ${
          member.lastRenewalReminderAt
            ? `<p class="muted">Ultimo aviso de renovacion: ${formatDateTime(member.lastRenewalReminderAt)}</p>`
            : ""
        }
        ${renderMemberHistory(history)}
      </div>
    </div>
  `;
}

function renderSelectedMember(member) {
  if (!member) {
    return `<div class="empty-state">Selecciona una persona para ver su resumen.</div>`;
  }

  const account = findAccountByMember(member.id);
  const history = getMemberHistory(member.id);
  const certifications = member.certifications || [];

  return `
    <div class="panel-stack">
      <div>
        <p class="eyebrow">${isAdminView() ? "Resumen de persona" : "Ficha seleccionada"}</p>
        <h3>${member.name}</h3>
      </div>
      <div class="table-card">
        <table>
          <tbody>
            <tr><td>Rol</td><td>${member.role}</td></tr>
            <tr><td>Email</td><td>${member.email}</td></tr>
            <tr><td>Certificaciones</td><td>${certifications.join(", ") || "Sin certificaciones"}</td></tr>
            <tr><td>Renovaciones</td><td>${member.renewalsDue}</td></tr>
            <tr><td>Acceso</td><td>${account ? `${account.role} | ${account.email}` : "Sin acceso creado"}</td></tr>
          </tbody>
        </table>
      </div>
      ${
        isAdminView()
          ? `
            <div class="chip-row">
              <button class="primary-button" data-action="nav-section" data-view="members" data-section-id="memberSectionWorkbench">Abrir ficha activa</button>
              ${
                member.associateId
                  ? `<button class="ghost-button" data-action="open-linked-associate" data-member-id="${member.id}">Abrir socio</button>`
                  : ""
              }
              <button class="ghost-button" data-action="nav" data-view="courses">Ver cursos</button>
            </div>
          `
          : ""
      }
      <div class="mail-card">
        <h4>Historial formativo</h4>
        ${
          member.lastRenewalReminderAt
            ? `<p class="muted">Ultimo aviso de renovacion: ${formatDateTime(member.lastRenewalReminderAt)}</p>`
            : ""
        }
        ${renderMemberHistory(history)}
      </div>
    </div>
  `;
}

function renderCourseModuleEditor(module, moduleIndex) {
  return `
    <article class="content-module" data-course-module-index="${moduleIndex}" data-module-id="${escapeHtml(module.id)}">
      <div class="module-head">
        <div>
          <p class="eyebrow">Modulo ${moduleIndex + 1}</p>
          <h4>${escapeHtml(module.title || `Modulo ${moduleIndex + 1}`)}</h4>
        </div>
        <div class="chip-row">
          <button class="mini-button" type="button" data-action="add-course-lesson" data-module-index="${moduleIndex}">Anadir leccion</button>
          <button class="mini-button" type="button" data-action="remove-course-module" data-module-index="${moduleIndex}">Eliminar modulo</button>
        </div>
      </div>
      <div class="studio-grid">
        <label class="inline-field">
          Titulo del modulo
          <input data-module-field="title" value="${escapeHtml(module.title || "")}" />
        </label>
        <label class="inline-field">
          Formato
          <input data-module-field="format" value="${escapeHtml(module.format || "")}" />
        </label>
        <label class="inline-field studio-full">
          Objetivo del modulo
          <textarea data-module-field="goal">${escapeHtml(module.goal || "")}</textarea>
        </label>
        <label class="inline-field studio-full">
          Entregable o evidencia esperada
          <input data-module-field="deliverable" value="${escapeHtml(module.deliverable || "")}" />
        </label>
      </div>
      <div class="lesson-stack">
        ${
          module.lessons?.length
            ? module.lessons
                .map(
                  (lesson, lessonIndex) => `
                    <article class="lesson-card" data-course-lesson-index="${lessonIndex}" data-lesson-id="${escapeHtml(lesson.id)}">
                      <div class="row-between">
                        <div class="chip-row">
                          <strong>Leccion ${lessonIndex + 1}</strong>
                          <span class="small-chip">${escapeHtml(lesson.publicationStatus || "draft")}</span>
                        </div>
                        <div class="chip-row">
                          <button class="mini-button" type="button" data-action="generate-lesson-content" data-module-index="${moduleIndex}" data-lesson-index="${lessonIndex}">Generar base</button>
                          <button class="mini-button" type="button" data-action="publish-lesson-content" data-module-index="${moduleIndex}" data-lesson-index="${lessonIndex}">Publicar</button>
                          <button class="mini-button" type="button" data-action="remove-course-lesson" data-module-index="${moduleIndex}" data-lesson-index="${lessonIndex}">Eliminar</button>
                        </div>
                      </div>
                      <div class="lesson-grid">
                        <label class="inline-field">
                          Titulo
                          <input data-lesson-field="title" value="${escapeHtml(lesson.title || "")}" />
                        </label>
                        <label class="inline-field">
                          Tipo
                          <select data-lesson-field="type">
                            ${LESSON_TYPE_OPTIONS.map((type) => `<option value="${type}" ${lesson.type === type ? "selected" : ""}>${type}</option>`).join("")}
                          </select>
                        </label>
                        <label class="inline-field">
                          Duracion (h)
                          <input data-lesson-field="duration" type="number" min="0" step="0.5" value="${lesson.duration || 0}" />
                        </label>
                        <label class="inline-field">
                          Recurso principal
                          <input data-lesson-field="resource" value="${escapeHtml(lesson.resource || "")}" />
                        </label>
                        <label class="inline-field">
                          Estado editorial
                          <select data-lesson-field="publicationStatus">
                            ${LESSON_PUBLICATION_STATUSES.map((status) => `<option value="${status}" ${lesson.publicationStatus === status ? "selected" : ""}>${status}</option>`).join("")}
                          </select>
                        </label>
                        <label class="inline-field lesson-notes">
                          Desarrollo de la leccion
                          <textarea data-lesson-field="body">${escapeHtml(lesson.body || "")}</textarea>
                        </label>
                        <label class="inline-field">
                          Actividad o dinamica
                          <textarea data-lesson-field="activity">${escapeHtml(lesson.activity || "")}</textarea>
                        </label>
                        <label class="inline-field">
                          Aprendizaje esperado
                          <textarea data-lesson-field="takeaway">${escapeHtml(lesson.takeaway || "")}</textarea>
                        </label>
                        <label class="inline-field">
                          Etiqueta del recurso
                          <input data-lesson-field="assetLabel" value="${escapeHtml(lesson.assetLabel || "")}" />
                        </label>
                        <label class="inline-field">
                          URL o ruta del recurso
                          <input data-lesson-field="assetUrl" value="${escapeHtml(lesson.assetUrl || "")}" />
                        </label>
                        <label class="inline-field lesson-notes">
                          Indicaciones para instructor o alumno
                          <textarea data-lesson-field="instructions">${escapeHtml(lesson.instructions || "")}</textarea>
                        </label>
                      </div>
                      <div class="block-stack">
                        <div class="row-between">
                          <strong>Bloques de contenido</strong>
                          <div class="chip-row">
                            ${[
                              ["document", "PDF / Documento"],
                              ["video", "Video"],
                              ["evaluation", "Test"],
                              ["download", "Descarga"],
                              ["practice", "Practica"]
                            ]
                              .map(
                                ([type, label]) => `
                                  <button class="mini-button" type="button" data-action="add-lesson-block" data-module-index="${moduleIndex}" data-lesson-index="${lessonIndex}" data-block-type="${type}">
                                    ${label}
                                  </button>
                                `
                              )
                              .join("")}
                          </div>
                        </div>
                        ${
                          lesson.blocks?.length
                            ? lesson.blocks
                                .map(
                                  (block, blockIndex) => `
                                    <article class="block-card" data-lesson-block-index="${blockIndex}" data-block-id="${escapeHtml(block.id)}">
                                      <div class="row-between">
                                        <strong>Bloque ${blockIndex + 1}</strong>
                                        <button class="mini-button" type="button" data-action="remove-lesson-block" data-module-index="${moduleIndex}" data-lesson-index="${lessonIndex}" data-block-index="${blockIndex}">Eliminar</button>
                                      </div>
                                      <div class="lesson-grid">
                                        <label class="inline-field">
                                          Tipo
                                          <select data-block-field="type">
                                            ${LESSON_BLOCK_TYPES.map((type) => `<option value="${type}" ${block.type === type ? "selected" : ""}>${type}</option>`).join("")}
                                          </select>
                                        </label>
                                        <label class="inline-field">
                                          Titulo
                                          <input data-block-field="title" value="${escapeHtml(block.title || "")}" />
                                        </label>
                                        <label class="inline-field">
                                          URL o ruta
                                          <input data-block-field="url" value="${escapeHtml(block.url || "")}" />
                                        </label>
                                        <label class="inline-field">
                                          <span>Obligatorio</span>
                                          <input data-block-field="required" type="checkbox" ${block.required ? "checked" : ""} />
                                        </label>
                                        <label class="inline-field lesson-notes">
                                          Contenido del bloque
                                          <textarea data-block-field="content">${escapeHtml(block.content || "")}</textarea>
                                        </label>
                                        <label class="inline-field lesson-notes">
                                          Banco de preguntas
                                          <textarea data-block-field="questions" placeholder="Pregunta | opcion A ; opcion B ; opcion C | respuesta correcta | explicacion">${escapeHtml(serializeQuizQuestions(block.questions || []))}</textarea>
                                        </label>
                                      </div>
                                      <div class="block-admin-preview">
                                        ${renderLessonBlockPreview(block, { admin: true })}
                                      </div>
                                    </article>
                                  `
                                )
                                .join("")
                            : `<div class="empty-state">Todavia no hay bloques en esta leccion.</div>`
                        }
                      </div>
                    </article>
                  `
                )
                .join("")
            : `<div class="empty-state">Este modulo todavia no tiene lecciones.</div>`
        }
      </div>
    </article>
  `;
}

function getLearnerActiveModuleIndex(course, memberId, modules = getLearnerCourseModules(course)) {
  if (!modules.length) {
    return 0;
  }

  const maxUnlockedIndex = getLearnerUnlockedModuleIndex(course, memberId, modules);
  const storedIndex = learnerRoadmapSelection[course.id];
  if (
    Number.isInteger(storedIndex) &&
    storedIndex >= 0 &&
    storedIndex < modules.length &&
    storedIndex <= maxUnlockedIndex
  ) {
    return storedIndex;
  }

  const journey = getLearnerCourseJourney(course, memberId);
  const nextLessonId = journey?.nextStep?.lesson?.id;
  if (nextLessonId) {
    const moduleIndex = modules.findIndex((module) => (module.lessons || []).some((lesson) => lesson.id === nextLessonId));
    if (moduleIndex >= 0) {
      const resolvedIndex = Math.min(moduleIndex, maxUnlockedIndex);
      learnerRoadmapSelection[course.id] = resolvedIndex;
      return resolvedIndex;
    }
  }

  const entry = getCourseProgressEntry(course, memberId);
  const firstIncompleteModuleIndex = modules.findIndex((module) =>
    (module.lessons || []).some((lesson) => !entry.lessonIds.includes(lesson.id))
  );
  const resolvedIndex = Math.min(firstIncompleteModuleIndex >= 0 ? firstIncompleteModuleIndex : 0, maxUnlockedIndex);
  learnerRoadmapSelection[course.id] = resolvedIndex;
  return resolvedIndex;
}

function getLearnerUnlockedModuleIndex(course, memberId, modules = getLearnerCourseModules(course)) {
  if (!modules.length) {
    return 0;
  }

  const journey = getLearnerCourseJourney(course, memberId);
  const nextLessonId = journey?.nextStep?.lesson?.id;
  if (nextLessonId) {
    const nextModuleIndex = modules.findIndex((module) => (module.lessons || []).some((lesson) => lesson.id === nextLessonId));
    if (nextModuleIndex >= 0) {
      return nextModuleIndex;
    }
  }

  return Math.max(0, modules.length - 1);
}

function getLearnerActiveLessonId(course, memberId, modules = getLearnerCourseModules(course)) {
  const nextLessonId = getNextLearnerStep(course, memberId)?.lesson?.id;
  if (nextLessonId) {
    return nextLessonId;
  }

  const entry = getCourseProgressEntry(course, memberId);
  for (const module of modules) {
    for (const lesson of module.lessons || []) {
      if (!entry.lessonIds.includes(lesson.id)) {
        return lesson.id;
      }
    }
  }

  return modules[0]?.lessons?.[0]?.id || "";
}

function renderLearnerActionStrip(course, memberId, options = {}) {
  const journey = getLearnerCourseJourney(course, memberId);
  const modules = getLearnerCourseModules(course);
  const activeModuleIndex = getLearnerActiveModuleIndex(course, memberId, modules);
  const activeSession = (course.sessions || [])[activeModuleIndex] || (course.sessions || [])[0] || null;
  const keyResource = getVisibleCourseResources(course, "member")[0] || null;
  const nextBlock = journey.nextStep?.block || null;
  const nextLessonTitle = journey.nextStep?.lessonTitle || "Revisar ruta";
  const sessionLabel = activeSession?.date
    ? `${formatDate(activeSession.date)} · ${activeSession.duration || 0} h`
    : activeSession?.duration
      ? `${activeSession.duration} h previstas`
      : "Calendario pendiente de concretar";
  const resourceLabel = keyResource?.label || keyResource?.title || "Abrir recurso";

  return `
    <div class="status-note info learner-action-strip">
      Ahora toca <strong>${escapeHtml(nextBlock?.title || nextLessonTitle)}</strong>.
      ${
        activeSession
          ? ` Sesion actual: ${escapeHtml(activeSession.title || "Sin sesion definida")} (${escapeHtml(sessionLabel)}).`
          : ""
      }
      ${
        keyResource?.url
          ? ` Recurso visible: ${escapeHtml(resourceLabel)}.`
          : ` Biblioteca disponible: ${getVisibleCourseResources(course, "member").length} recurso(s).`
      }
    </div>
    <div class="chip-row learner-action-strip">
      <button
        class="primary-button"
        type="button"
        data-action="set-learner-roadmap-module"
        data-course-id="${course.id}"
        data-index="${activeModuleIndex}"
      >
        Continuar ahora
      </button>
      <button
        class="ghost-button"
        type="button"
        data-action="set-learner-course-workspace-mode"
        data-mode="sessions"
      >
        Sesion actual
      </button>
      ${
        keyResource?.url
          ? `<a class="ghost-button" href="${escapeHtml(keyResource.url)}" target="_blank" rel="noreferrer">Abrir recurso</a>`
          : `<button class="ghost-button" type="button" data-action="set-learner-course-workspace-mode" data-mode="resources">Ver recursos</button>`
      }
      ${
        journey.hasDiploma || (course.feedbackEnabled && !journey.feedbackSubmitted)
          ? `
            <button
              class="ghost-button"
              type="button"
              data-action="${journey.hasDiploma ? "set-campus-section-mode" : "set-learner-course-workspace-mode"}"
              data-mode="${journey.hasDiploma ? "diplomas" : "feedback"}"
            >
              ${escapeHtml(journey.hasDiploma ? "Ir a Mis diplomas" : "Ir a valoración")}
            </button>
          `
          : ""
      }
    </div>
  `;
}

function renderLearnerSessionStrip(course, memberId) {
  const sessions = course.sessions || [];
  const modules = getLearnerCourseModules(course);
  const activeModuleIndex = getLearnerActiveModuleIndex(course, memberId, modules);
  const visibleSessions = sessions.slice(0, 4);

  if (!visibleSessions.length) {
    return "";
  }

  return `
    <div class="chip-row learner-session-strip">
      ${visibleSessions
        .map(
          (session, index) => `
            <button
              class="${index === activeModuleIndex ? "primary-button" : "ghost-button"}"
              type="button"
              data-action="set-learner-roadmap-module"
              data-course-id="${course.id}"
              data-index="${index}"
            >
              ${escapeHtml(session.title || `Sesion ${index + 1}`)}
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderLearnerCurrentSessionPanel(course, memberId) {
  const modules = getLearnerCourseModules(course);
  const activeModuleIndex = getLearnerActiveModuleIndex(course, memberId, modules);
  const activeSession = (course.sessions || [])[activeModuleIndex] || (course.sessions || [])[0] || null;
  const activeModule = modules[activeModuleIndex] || null;
  if (!activeSession && !activeModule) {
    return "";
  }

  return `
    <div class="mail-card learner-current-session-card">
      <div class="row-between">
        <div>
          <p class="eyebrow">Sesion y foco actual</p>
          <strong>${escapeHtml(activeSession?.title || activeModule?.title || "Bloque actual")}</strong>
        </div>
        <div class="chip-row compact-chip-row">
          ${activeSession?.date ? `<span class="small-chip">${escapeHtml(formatDate(activeSession.date))}</span>` : ""}
          ${activeSession?.duration ? `<span class="small-chip">${escapeHtml(`${activeSession.duration} h`)}</span>` : ""}
        </div>
      </div>
      <p class="muted">${escapeHtml(activeSession?.focus || activeModule?.goal || "Continua por este bloque para mantener el hilo del curso.")}</p>
    </div>
  `;
}

function renderLearnerWorkspaceHighlights(course, memberId, options = {}) {
  const previewOnly = Boolean(options.previewOnly);
  const journey = getLearnerCourseJourney(course, memberId);
  const modules = getLearnerCourseModules(course);
  const activeModuleIndex = getLearnerActiveModuleIndex(course, memberId, modules);
  const activeSession = (course.sessions || [])[activeModuleIndex] || (course.sessions || [])[0] || null;
  const keyResource = getVisibleCourseResources(course, "member")[0] || null;
  const finalState = journey.hasDiploma
    ? "Diploma disponible"
    : course.feedbackEnabled && !journey.feedbackSubmitted
      ? "Valoracion pendiente"
      : "Revisar certificado";

  return `
    <div class="status-note info learner-highlights-strip">
      Siguiente paso: ${escapeHtml(journey.nextStep?.block?.title || journey.nextStep?.lessonTitle || "Abrir ruta")} ·
      Sesion actual: ${escapeHtml(activeSession?.title || "Calendario pendiente")} ·
      ${keyResource?.url ? `Recurso clave: ${escapeHtml(keyResource.label || keyResource.title || "Abrir recurso")}` : `Biblioteca: ${getVisibleCourseResources(course, "member").length} recurso(s)`} ·
      Estado final: ${escapeHtml(finalState)}${previewOnly ? " · Vista previa sin cambios reales." : ""}.
    </div>
  `;
}

function renderLearnerModeSummaryStrip(course, memberId, activeLearnerMode, options = {}) {
  const previewOnly = Boolean(options.previewOnly);
  const journey = getLearnerCourseJourney(course, memberId);
  const modules = getLearnerCourseModules(course);
  const activeModuleIndex = getLearnerActiveModuleIndex(course, memberId, modules);
  const activeSession = (course.sessions || [])[activeModuleIndex] || (course.sessions || [])[0] || null;
  const keyResource = getVisibleCourseResources(course, "member")[0] || null;
  const feedbackPending = course.feedbackEnabled && !journey.feedbackSubmitted;
  const cards =
    activeLearnerMode === "sessions"
      ? [
          {
            action: "set-learner-course-workspace-mode",
            mode: "sessions",
            eyebrow: "Sesion actual",
            title: activeSession?.title || "Calendario pendiente",
            detail: activeSession?.date
              ? `${formatDate(activeSession.date)} · ${activeSession.duration || 0} h`
              : activeSession?.duration
                ? `${activeSession.duration} h previstas`
                : "Revisa la planificacion del curso"
          },
          {
            action: "set-learner-course-workspace-mode",
            mode: "roadmap",
            eyebrow: "Foco de trabajo",
            title: journey.nextStep?.block?.title || journey.nextStep?.lessonTitle || "Abrir ruta",
            detail: "Volver a la ruta del modulo activo"
          },
          {
            action: "set-learner-course-workspace-mode",
            mode: "sessions",
            eyebrow: "Asistencia",
            title: `${journey.attendance}%`,
            detail: "Seguimiento real de las jornadas"
          }
        ]
      : activeLearnerMode === "resources"
        ? [
          {
              action: "set-learner-course-workspace-mode",
              mode: "resources",
              eyebrow: "Biblioteca",
              title: `${getVisibleCourseResources(course, "member").length} recurso(s)`,
              detail: "Material visible en el aula"
            },
            {
              href: keyResource?.url || "",
              eyebrow: "Recurso clave",
              title: keyResource?.label || "Sin enlace principal",
            detail: keyResource?.type || "Consulta la biblioteca del curso"
          },
          {
            action: "set-learner-course-workspace-mode",
            mode: "roadmap",
            eyebrow: "Progreso",
            title: `${journey.progress.blockProgress}%`,
            detail: `${journey.progress.blocksCompleted}/${journey.progress.blocksTotal} bloques completados`
          }
        ]
        : activeLearnerMode === "feedback"
            ? [
                {
                  action: "set-learner-course-workspace-mode",
                  mode: "feedback",
                  eyebrow: "Estado",
                  title: journey.feedbackSubmitted ? "Valoracion enviada" : "Pendiente",
                  detail: journey.feedbackSubmitted ? "Gracias por completar el cierre" : "Comparte tu experiencia del curso"
                },
                {
                  action: "set-learner-course-workspace-mode",
                  mode: "roadmap",
                  eyebrow: "Impacto",
                  title: course.feedbackRequiredForDiploma ? "Requerida para cerrar" : "Complementaria",
                  detail: journey.hasDiploma ? "El diploma ya esta disponible en su seccion." : "Afecta al cierre del curso"
                },
                {
                  action: "set-learner-course-workspace-mode",
                  mode: "sessions",
                  eyebrow: "Sesiones",
                  title: `${(course.sessions || []).length} jornada(s)`,
                  detail: "Repasa el recorrido formativo antes de valorar"
                }
              ]
            : [
                {
                  action: "set-learner-course-workspace-mode",
                  mode: "roadmap",
                  eyebrow: "Siguiente paso",
                  title: journey.nextStep?.block?.title || journey.nextStep?.lessonTitle || "Abrir ruta",
                  detail: journey.nextRequirement || "Continua por el bloque actual del curso."
                },
                {
                  action: "set-learner-course-workspace-mode",
                  mode: "sessions",
                  eyebrow: "Sesion actual",
                  title: activeSession?.title || "Calendario pendiente",
                  detail: activeSession?.date
                    ? `${formatDate(activeSession.date)} · ${activeSession.duration || 0} h`
                    : activeSession?.duration
                      ? `${activeSession.duration} h previstas`
                      : "Consulta la planificacion del curso"
                },
                {
                  href: keyResource?.url || "",
                  eyebrow: "Recurso clave",
                  title: keyResource?.label || "Sin recurso principal",
                  detail: keyResource?.type || "Consulta la biblioteca del curso"
                }
              ];

  return `
    <div class="status-note info learner-mode-summary-strip">
      ${cards.map((card) => `${card.eyebrow}: ${card.title}`).join(" · ")}
    </div>
  `;
}

function renderLearnerContextSidebar(course, memberId, activeLearnerMode) {
  const journey = getLearnerCourseJourney(course, memberId);
  const modules = getLearnerCourseModules(course);
  const activeModuleIndex = getLearnerActiveModuleIndex(course, memberId, modules);
  const activeSession = (course.sessions || [])[activeModuleIndex] || (course.sessions || [])[0] || null;
  const keyResource = getVisibleCourseResources(course, "member")[0] || null;
  const primaryCard = `
    <div class="mail-card compact-panel">
      <h4>Tu estado</h4>
      <p class="muted"><strong>Plaza:</strong> ${journey.enrolled ? "Inscrito" : journey.waiting ? "En espera" : "Sin plaza confirmada"}</p>
      <p class="muted"><strong>Contenido:</strong> ${journey.progress.blockProgress}% (${journey.progress.blocksCompleted}/${journey.progress.blocksTotal} bloques)</p>
      <p class="muted"><strong>Asistencia:</strong> ${journey.attendance}%</p>
      <p class="muted"><strong>Evaluacion:</strong> ${escapeHtml(journey.evaluation)}</p>
    </div>
  `;

  const secondaryCard =
    activeLearnerMode === "sessions"
      ? `
        <div class="mail-card compact-panel">
          <h4>Sesion actual</h4>
          <p class="muted"><strong>Titulo:</strong> ${escapeHtml(activeSession?.title || "Pendiente")}</p>
          <p class="muted"><strong>Fecha:</strong> ${escapeHtml(activeSession?.date ? formatDate(activeSession.date) : "Pendiente")}</p>
          <p class="muted"><strong>Duracion:</strong> ${escapeHtml(activeSession?.duration ? `${activeSession.duration} h` : "Pendiente")}</p>
        </div>
      `
      : activeLearnerMode === "resources"
        ? `
          <div class="mail-card compact-panel">
            <h4>Biblioteca</h4>
            <p class="muted"><strong>Recursos visibles:</strong> ${getVisibleCourseResources(course, "member").length}</p>
            <p class="muted"><strong>Principal:</strong> ${escapeHtml(keyResource?.label || keyResource?.title || "Sin recurso destacado")}</p>
          </div>
        `
      : activeLearnerMode === "feedback"
        ? `
          <div class="mail-card compact-panel">
            <h4>Antes de enviar</h4>
            <p class="muted"><strong>Curso:</strong> ${escapeHtml(course.title)}</p>
            <p class="muted"><strong>Docentes / coordinacion:</strong> ${escapeHtml(course.coordinator || "Pendiente")}</p>
            <p class="muted"><strong>Estado:</strong> ${journey.feedbackSubmitted ? "Valoracion enviada" : "Pendiente de completar"}</p>
          </div>
        `
        : "";

  return `
    <aside class="panel-stack learner-course-sidebar">
      ${primaryCard}
      ${secondaryCard}
    </aside>
  `;
}

function renderCourseRoadmap(course, options = {}) {
  if (!(course.modules || []).length) {
    return `<div class="empty-state">Todavia no se ha definido la ruta de aprendizaje.</div>`;
  }

  const memberId = options.memberId || state.selectedMemberId;
  const role = options.role || getEffectiveRole();
  const interactive = Boolean(options.interactive && role === "member" && memberId);
  const previewOnly = Boolean(options.previewOnly);
  const modules = role === "admin" ? course.modules || [] : getLearnerCourseModules(course);
  if (!modules.length) {
    return `<div class="empty-state">El instructor todavia no ha publicado contenido para el alumnado.</div>`;
  }
  const progress =
    role === "admin"
      ? getMemberCourseContentStats(course, memberId)
      : getLearnerCourseContentStats(course, memberId);
  const entry = getCourseProgressEntry(course, memberId);
  const activeModuleIndex = role === "member" ? getLearnerActiveModuleIndex(course, memberId, modules) : 0;
  const unlockedModuleIndex = role === "member" ? getLearnerUnlockedModuleIndex(course, memberId, modules) : modules.length - 1;
  const activeLessonId = role === "member" ? getLearnerActiveLessonId(course, memberId, modules) : "";
  const scopedModules = role === "member" ? [modules[activeModuleIndex]].filter(Boolean) : modules;
  const activeModule = modules[activeModuleIndex];

  if (role === "member") {
    const visibleModuleIndices = Array.from(
      new Set([activeModuleIndex, Math.min(activeModuleIndex + 1, Math.max(modules.length - 1, 0))].filter((index) => index >= 0))
    );
    const moduleIndexMarkup = visibleModuleIndices
      .map((actualIndex) => {
        const module = modules[actualIndex];
        const moduleLessons = module.lessons || [];
        const completedLessons = moduleLessons.filter((lesson) => entry.lessonIds.includes(lesson.id)).length;
        const isActiveModule = actualIndex === activeModuleIndex;
        const isLockedModule = actualIndex > unlockedModuleIndex;
        return `
          <article class="course-index-card ${isActiveModule ? "course-index-card-active" : ""} ${isLockedModule ? "course-index-card-locked" : ""}">
            <button
              class="course-index-card-button ${isLockedModule ? "course-index-card-button-locked" : ""}"
              type="button"
              data-action="set-learner-roadmap-module"
              data-course-id="${course.id}"
              data-index="${actualIndex}"
              ${isLockedModule ? 'aria-disabled="true"' : ""}
            >
              <div class="row-between">
                <strong>${isActiveModule ? "Ahora" : `Despues · M${actualIndex + 1}`}</strong>
                <span class="small-chip">${isLockedModule ? "bloqueado" : `${completedLessons}/${moduleLessons.length}`}</span>
              </div>
              <p class="muted">${escapeHtml(module.title || `Modulo ${actualIndex + 1}`)}</p>
              ${
                isActiveModule
                  ? module.goal
                    ? `<p class="muted">${escapeHtml(module.goal)}</p>`
                    : ""
                  : `<p class="muted">Se abrira cuando cierres el modulo actual.</p>`
              }
            </button>
            <div class="course-index-lessons">
              ${isLockedModule
                ? `<p class="muted learner-lock-copy">Primero cierra el modulo actual para abrir este bloque.</p>`
                : moduleLessons
                .slice(0, isActiveModule ? undefined : 1)
                .map((lesson, lessonIndex) => {
                  const isActiveLesson = isActiveModule && lesson.id === activeLessonId;
                  const previousLessonId = lessonIndex > 0 ? moduleLessons[lessonIndex - 1]?.id : "";
                  const isLockedLesson = !isActiveLesson && !entry.lessonIds.includes(lesson.id) && Boolean(previousLessonId) && !entry.lessonIds.includes(previousLessonId);
                  return `
                    <button
                      class="course-index-lesson ${isActiveLesson ? "course-index-lesson-active" : ""} ${isLockedLesson ? "course-index-lesson-locked" : ""}"
                      type="button"
                      data-action="set-learner-roadmap-module"
                      data-course-id="${course.id}"
                      data-index="${actualIndex}"
                      ${isLockedLesson ? 'aria-disabled="true"' : ""}
                    >
                      <span>${escapeHtml(lesson.title || "Leccion")}</span>
                      ${
                        entry.lessonIds.includes(lesson.id)
                          ? `<span class="small-chip">ok</span>`
                          : isActiveLesson
                            ? `<span class="small-chip">ahora</span>`
                            : isLockedLesson
                              ? `<span class="small-chip">despues</span>`
                              : !isActiveModule
                                ? `<span class="small-chip">siguiente</span>`
                                : ""
                      }
                    </button>
                  `;
                })
                .join("")}
            </div>
          </article>
        `;
      })
      .join("");

    return `
      <div class="course-index-shell">
        <aside class="course-index-sidebar">
          <div class="mail-card compact-panel">
            <div class="row-between">
              <h4>Tu ruta</h4>
              <span class="small-chip">${modules.length} modulo(s)</span>
            </div>
            <p class="muted">${progress.lessonsCompleted}/${progress.lessonsTotal} leccion(es) completadas · ${progress.blocksCompleted}/${progress.blocksTotal} bloque(s)</p>
            <div class="progress"><span style="width:${progress.blockProgress}%"></span></div>
          </div>
          <div class="stack compact-list">
            ${moduleIndexMarkup}
          </div>
        </aside>
        <div class="course-index-main">
          ${scopedModules
            .map(
              (module, moduleIndex) => `
                <article class="roadmap-module">
                  <div class="row-between">
                    <strong>${escapeHtml(module.title || `Modulo ${activeModuleIndex + 1}`)}</strong>
                    <span class="small-chip">${escapeHtml(module.format || "Sesion guiada")}</span>
                  </div>
                  <p class="muted">${escapeHtml(module.goal || "Objetivo pendiente de definir.")}</p>
                  <div class="lesson-roadmap">
                    ${activeLessonMarkup}
                    ${nextLessonMarkup}
                  </div>
                </article>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  return `
    <div class="roadmap-grid">
      ${
        memberId
          ? `
            <article class="roadmap-module roadmap-summary">
              <div class="row-between">
                <strong>Progreso del contenido</strong>
                <span class="small-chip">${progress.blockProgress}%</span>
              </div>
              <p class="muted">${progress.lessonsCompleted}/${progress.lessonsTotal} leccion(es) completadas | ${progress.blocksCompleted}/${progress.blocksTotal} bloque(s) realizados</p>
              <div class="progress"><span style="width:${progress.blockProgress}%"></span></div>
              <p class="muted">${progress.updatedAt ? `Ultima actividad ${formatDateTime(progress.updatedAt)}` : "Todavia no hay progreso registrado."}</p>
            </article>
          `
          : ""
      }
      ${
        role === "member"
          ? `
            <article class="roadmap-module roadmap-summary">
              <div class="row-between">
                <strong>Ruta por modulos</strong>
                <span class="small-chip">${activeModule ? `Modulo ${activeModuleIndex + 1} activo` : "Sin modulo activo"}</span>
              </div>
              <p class="muted">Trabaja un modulo cada vez. Puedes cambiar de bloque sin perder el hilo del curso.</p>
              <div class="chip-row roadmap-module-tabs">
                ${modules
                  .map(
                    (module, index) => {
                      const isLockedModule = index > activeModuleIndex;
                      return `
                      <button
                        class="${index === activeModuleIndex ? "primary-button" : "ghost-button"} ${isLockedModule ? "roadmap-step-locked" : ""}"
                        type="button"
                        data-action="set-learner-roadmap-module"
                        data-course-id="${course.id}"
                        data-index="${index}"
                        ${isLockedModule ? 'aria-disabled="true"' : ""}
                      >
                        M${index + 1}${isLockedModule ? " · bloqueado" : ""}
                      </button>
                    `;
                    }
                  )
                  .join("")}
              </div>
              ${
                activeModule
                  ? `<p class="muted"><strong>${escapeHtml(activeModule.title || `Modulo ${activeModuleIndex + 1}`)}</strong> · ${escapeHtml(activeModule.goal || "Objetivo pendiente de definir.")}</p>`
                  : ""
              }
            </article>
          `
          : ""
      }
      ${scopedModules
        .map(
          (module, moduleIndex) => `
            <article class="roadmap-module">
              <div class="row-between">
                <strong>${escapeHtml(module.title || `Modulo ${role === "member" ? activeModuleIndex + 1 : moduleIndex + 1}`)}</strong>
                <span class="small-chip">${escapeHtml(module.format || "Sesion guiada")}</span>
              </div>
              <p class="muted">${escapeHtml(module.goal || "Objetivo pendiente de definir.")}</p>
              <div class="lesson-roadmap">
                ${
                  module.lessons?.length
                    ? module.lessons
                        .map(
                          (lesson, lessonIndex) => {
                            const isActiveLesson = role === "member" && lesson.id === activeLessonId;
                            const lessonLocked =
                              role === "member" &&
                              moduleIndex === 0 &&
                              lessonIndex > 0 &&
                              !entry.lessonIds.includes((module.lessons || [])[lessonIndex - 1]?.id);
                            const previousLessonTitle =
                              lessonIndex > 0 ? (module.lessons || [])[lessonIndex - 1]?.title || "la leccion anterior" : "";
                            const lessonBlocks = lesson.blocks || [];
                            const firstPendingBlock = lessonBlocks.find((block) => !entry.blockIds.includes(block.id)) || null;
                            return `
                            <div class="lesson-roadmap-item ${isActiveLesson ? "lesson-roadmap-item-active" : ""}">
                              <div class="row-between">
                                <strong>${escapeHtml(lesson.title || "Leccion")}</strong>
                                <div class="chip-row">
                                  <span class="small-chip">${escapeHtml(lesson.type || "Practica")}</span>
                                  ${role === "admin" ? `<span class="small-chip">${escapeHtml(lesson.publicationStatus || "draft")}</span>` : ""}
                                  ${
                                    entry.lessonIds.includes(lesson.id)
                                      ? `<span class="small-chip">completada</span>`
                                      : ""
                                  }
                                  ${isActiveLesson ? `<span class="small-chip">ahora</span>` : ""}
                                </div>
                              </div>
                              <p class="muted">${escapeHtml(lesson.duration ? `${lesson.duration} h` : "Duracion pendiente")} | ${escapeHtml(lesson.resource || "Recurso pendiente")}</p>
                              ${
                                role === "member" && lessonLocked
                                  ? `<p class="muted learner-lock-copy">Primero completa ${escapeHtml(previousLessonTitle)} para abrir esta parte del curso.</p>`
                                  : role === "member" && !isActiveLesson
                                    ? `<p class="muted">Leccion ya disponible dentro del modulo. Vuelve a ella cuando cierres el paso actual.</p>`
                                  : `
                                    <p class="muted">${escapeHtml(lesson.body || "Contenido pendiente de desarrollar")}</p>
                                    <p class="muted"><strong>Actividad:</strong> ${escapeHtml(lesson.activity || "Pendiente")}</p>
                                    <p class="muted"><strong>Aprendizaje:</strong> ${escapeHtml(lesson.takeaway || "Pendiente")}</p>
                                    <p class="muted"><strong>Indicaciones:</strong> ${escapeHtml(lesson.instructions || "Indicaciones pendientes")}</p>
                                  `
                              }
                              ${
                                interactive && (role !== "member" || (isActiveLesson && !lessonLocked))
                                  ? `
                                    <div class="chip-row">
                                      <button class="${entry.lessonIds.includes(lesson.id) ? "ghost-button" : "mini-button"}" data-action="toggle-lesson-complete" data-course-id="${course.id}" data-member-id="${memberId}" data-lesson-id="${lesson.id}">
                                        ${entry.lessonIds.includes(lesson.id) ? "Marcar pendiente" : "Marcar completa"}
                                      </button>
                                    </div>
                                  `
                                  : previewOnly && role === "member"
                                    ? `<p class="muted">Vista previa de progreso: sin cambios reales.</p>`
                                    : ""
                              }
                              ${
                                lesson.blocks?.length && (role !== "member" || (isActiveLesson && !lessonLocked))
                                  ? `
                                    <div class="block-preview-list">
                                      ${lesson.blocks
                                        .map((block) => {
                                          const blockDone = entry.blockIds.includes(block.id);
                                          const blockLocked = role === "member" && isActiveLesson && firstPendingBlock && !blockDone && block.id !== firstPendingBlock.id;
                                          return `
                                            <div class="block-preview-item">
                                              <div class="row-between">
                                                <strong>${escapeHtml(block.title || "Bloque")}</strong>
                                                <div class="chip-row">
                                                  <span class="small-chip">${escapeHtml(block.type || "document")}</span>
                                                  ${block.required ? `<span class="small-chip">obligatorio</span>` : ""}
                                                  ${entry.blockIds.includes(block.id) ? `<span class="small-chip">hecho</span>` : ""}
                                                  ${blockLocked ? `<span class="small-chip">despues</span>` : ""}
                                                </div>
                                              </div>
                                              <div class="chip-row">
                                                ${
                                                  interactive && !blockLocked
                                                    ? `<button class="${entry.blockIds.includes(block.id) ? "ghost-button" : "mini-button"}" data-action="toggle-block-complete" data-course-id="${course.id}" data-member-id="${memberId}" data-lesson-id="${lesson.id}" data-block-id="${block.id}">
                                                        ${entry.blockIds.includes(block.id) ? "Pendiente" : "Completar bloque"}
                                                      </button>`
                                                    : ""
                                                }
                                              </div>
                                              ${
                                                blockLocked
                                                  ? `<p class="muted learner-lock-copy">Este bloque se abrira cuando cierres ${escapeHtml(firstPendingBlock?.title || "el paso actual")}.</p>`
                                                  : `
                                                    <p class="muted">${escapeHtml(block.content || "Sin contenido")}</p>
                                                    ${block.url ? `<p class="muted">${escapeHtml(block.url)}</p>` : ""}
                                                    ${renderLessonBlockPreview(block, {
                                                      course,
                                                      memberId,
                                                      lessonId: lesson.id,
                                                      interactive,
                                                      previewOnly,
                                                      admin: role === "admin"
                                                    })}
                                                  `
                                              }
                                            </div>
                                          `;
                                        })
                                        .join("")}
                                    </div>
                                  `
                                  : role === "member" && lesson.blocks?.length
                                    ? `<p class="muted">${lesson.blocks.length} bloque(s) disponibles en esta leccion.</p>`
                                  : ""
                              }
                              ${
                                lesson.assetLabel || lesson.assetUrl
                                  ? `<p class="muted"><strong>Recurso:</strong> ${escapeHtml(lesson.assetLabel || "Archivo")}${lesson.assetUrl ? ` - ${escapeHtml(lesson.assetUrl)}` : ""}</p>`
                                  : ""
                              }
                            </div>
                          `;
                        }
                        )
                        .join("")
                    : `<p class="muted">Modulo sin lecciones todavia.</p>`
                }
              </div>
              <p class="muted"><strong>Evidencia:</strong> ${escapeHtml(module.deliverable || "Pendiente")}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function getCourseWorkbenchChecks(course) {
  const isPracticalCourse = normalizeCourseClass(course.courseClass) === "practico";
  const checks = [];
  const modules = course.modules || [];
  const resources = course.resources || [];
  const sessions = course.sessions || [];
  const hasSummary = Boolean(String(course.summary || "").trim());
  const hasObjectives = Boolean((course.objectives || []).filter(Boolean).length);
  const hasCertificate = Boolean((course.certificateContents || []).length || getCertificateSections(course).length);

  checks.push({
    key: "summary",
    label: "Ficha base",
    ok: hasSummary && Boolean(String(course.modality || "").trim()),
    detail: hasSummary
      ? "Resumen y modalidad ya definidos."
      : "Falta completar el resumen o la modalidad del curso."
  });
  checks.push({
    key: "objectives",
    label: "Objetivos",
    ok: hasObjectives,
    detail: hasObjectives
      ? `${(course.objectives || []).length} objetivo(s) definidos.`
      : "Conviene fijar objetivos claros antes de publicar el aula."
  });
  checks.push({
    key: "modules",
    label: isPracticalCourse ? "Documentacion" : "Contenido",
    ok: isPracticalCourse ? resources.length > 0 : modules.length > 0 && getCourseLessonCount(course) > 0,
    detail:
      isPracticalCourse
        ? resources.length
          ? `${resources.length} recurso(s) preparados para el practico.`
          : "Sube al menos una guia, dossier o documento para el alumnado."
        : modules.length > 0 && getCourseLessonCount(course) > 0
        ? `${modules.length} modulo(s) y ${getCourseLessonCount(course)} leccion(es).`
        : "Faltan modulos o lecciones para que el curso tenga recorrido real."
  });
  if (!isPracticalCourse) {
    checks.push({
      key: "sessions",
      label: "Sesiones",
      ok: sessions.length > 0,
      detail: sessions.length
        ? `${sessions.length} sesion(es) planificadas.`
        : "Todavia no hay sesiones de curso definidas."
    });
  }
  checks.push({
    key: "resources",
    label: "Biblioteca",
    ok: resources.length > 0,
    detail: resources.length
      ? `${resources.length} recurso(s) cargados en biblioteca.`
      : "Conviene añadir PDF, videos o enlaces al curso."
  });
  checks.push({
    key: "certificate",
    label: "Certificado",
    ok: hasCertificate,
    detail: hasCertificate
      ? "El certificado final ya tiene estructura de contenidos."
      : "Todavia falta dejar preparado el contenido acreditado del certificado."
  });
  checks.push({
    key: "feedback",
    label: "Valoracion",
    ok: course.feedbackEnabled !== false,
    detail: course.feedbackEnabled !== false
      ? "El cuestionario final de actividad y docentes esta activo."
      : "Conviene activar la valoracion final para recoger feedback del alumnado."
  });
  checks.push({
    key: "identity",
    label: "Identificacion",
    ok: course.enrolledIds.every((memberId) => hasMemberDocumentId(findMember(memberId))),
    detail: course.enrolledIds.every((memberId) => hasMemberDocumentId(findMember(memberId)))
      ? "El alumnado inscrito tiene DNI/NIE disponible para certificados."
      : "Hay alumnado sin DNI/NIE en ficha. No podra emitirse su diploma hasta completarlo."
  });

  return checks;
}

function getWorkbenchModeForCheck(checkKey, courseClass = "") {
  const isPracticalCourse = normalizeCourseClass(courseClass) === "practico";
  switch (checkKey) {
    case "summary":
    case "objectives":
      return "ficha";
    case "modules":
    case "resources":
      return "curriculum";
    case "sessions":
      return isPracticalCourse ? "curriculum" : "sessions";
    case "certificate":
      return "certificate";
    case "feedback":
      return "feedback";
    case "identity":
      return "students";
    default:
      return "ficha";
  }
}

function renderCourseWorkbench(course) {
  if (!course) {
    return `<div class="empty-state">Selecciona un curso del catalogo para abrir su ficha de trabajo.</div>`;
  }

  const isPracticalCourse = normalizeCourseClass(course.courseClass) === "practico";
  const normalizedWorkbenchMode = ({
    overview: "ficha",
    content: "curriculum",
    resources: "curriculum",
    certificate: "certificate"
  }[courseWorkbenchMode] || courseWorkbenchMode || "ficha");
  const safeWorkbenchMode =
    isPracticalCourse && normalizedWorkbenchMode === "sessions"
      ? "curriculum"
      : normalizedWorkbenchMode;
  const showWorkbenchSection = (section) => safeWorkbenchMode === section;
  const waitingMembers = course.waitingIds.map(findMember).filter(Boolean);
  const enrolledMembers = course.enrolledIds.map(findMember).filter(Boolean);
  const readiness = getCourseContentReadiness(course);
  const blockMix = countCourseBlocksByType(course);
  const certificateSections = getCertificateSections(course);
  const selectedMember = findMember(state.selectedMemberId);
  const selectedMemberProgress =
    selectedMember && course.contentProgress?.[selectedMember.id]
      ? course.contentProgress[selectedMember.id]
      : null;
  const previewMember =
    (selectedMember && course.enrolledIds.includes(selectedMember.id) && selectedMember) ||
    enrolledMembers[0] ||
    null;
  const totalLessons = getCourseLessonCount(course);
  const publishedLessons = getPublishedLessonCount(course);
  const visibleResources = getVisibleCourseResources(course, "member").length;
  const deliverySessions = course.sessions || [];
  const workbenchHeroText = isPracticalCourse
    ? "Curso practico en formato corto: ficha, documentacion, alumnado, valoracion y diploma."
    : "Gestiona este curso desde un solo sitio: contenido, sesiones, alumnado, certificado y vista alumno.";
  const activeCurriculumMode = ["modules", "resources"].includes(courseCurriculumMode)
    ? courseCurriculumMode
    : isPracticalCourse
      ? "resources"
      : "modules";
  const workbenchChecks = getCourseWorkbenchChecks(course);
  const completedChecks = workbenchChecks.filter((item) => item.ok).length;
  const nextCheck = workbenchChecks.find((item) => !item.ok) || null;
  const enrollmentSubmissions = (course.enrollmentSubmissions || []).slice().reverse();
  const pendingEnrollmentSubmissions = enrollmentSubmissions.filter((submission) =>
    ["pending-review", "pending-proof", "waiting"].includes(String(submission.status || "").trim())
  );
  const proofPendingSubmissions = enrollmentSubmissions.filter(
    (submission) => String(submission.status || "").trim() === "pending-proof"
  );
  const waitingEnrollmentSubmissions = enrollmentSubmissions.filter(
    (submission) => String(submission.status || "").trim() === "waiting"
  );
  const courseHasEnded = Boolean(course.endDate)
    && new Date(`${course.endDate}T23:59:59`).getTime() < Date.now();
  const closureEligible =
    course.status === "Cierre pendiente" ||
    course.status === "Cerrado" ||
    courseHasEnded;
  const pendingDiplomaDeliveries = closureEligible
    ? Math.max((course.diplomaReady || []).length - (course.mailsSent || []).length, 0)
    : 0;
  const totalWaitingQueue = Math.max(waitingMembers.length, waitingEnrollmentSubmissions.length);
  const courseAdminSteps = [
    {
      mode: "students",
      target: "courseStudentsQueue",
      eyebrow: "Paso 1",
      title: "Revisar inscripciones",
      detail: pendingEnrollmentSubmissions.length
        ? `${pendingEnrollmentSubmissions.length} solicitud(es) pendiente(s) de decision`
        : enrolledMembers.length
          ? `${enrolledMembers.length} inscrito(s) ya confirmados`
          : "Todavia no hay alumnado dentro del curso."
    },
    {
      mode: "students",
      target: proofPendingSubmissions.length ? "courseStudentsQueue" : "courseStudentsCapacity",
      eyebrow: "Paso 2",
      title: proofPendingSubmissions.length ? "Justificantes y espera" : "Plazas y espera",
      detail: proofPendingSubmissions.length
        ? `${proofPendingSubmissions.length} justificante(s) pendiente(s) de revisar`
        : totalWaitingQueue
          ? `${totalWaitingQueue} persona(s) en lista de espera`
          : "No hay bloqueos visibles en pagos ni espera."
    },
    {
      mode: isPracticalCourse ? "curriculum" : "sessions",
      target: isPracticalCourse ? "courseResourcesPanel" : "courseSessionsPanel",
      eyebrow: "Paso 3",
      title: isPracticalCourse
        ? visibleResources
          ? "Documentacion y evaluacion"
          : "Subir documentacion"
        : deliverySessions.length
          ? "Sesiones y seguimiento"
          : "Definir sesiones",
      detail: isPracticalCourse
        ? visibleResources
          ? `${visibleResources} recurso(s) visible(s) para el alumnado del curso practico`
          : "Sube la guia, el dossier o la documentacion que quieres que revisen antes o despues de la practica."
        : deliverySessions.length
          ? `${deliverySessions.length} sesion(es) planificadas para ${enrolledMembers.length} inscrito(s)`
          : "Anade las sesiones para ordenar el trabajo del curso."
    },
    {
      mode: "certificate",
      target: "courseCertificatePanel",
      eyebrow: "Paso 4",
      title: closureEligible ? (isPracticalCourse ? "Cerrar practico" : "Cierre y diplomas") : "Preparar cierre",
      detail: closureEligible
        ? pendingDiplomaDeliveries
          ? `${pendingDiplomaDeliveries} diploma(s) pendientes de registrar o enviar`
          : isPracticalCourse
            ? "El practico ya puede revisarse para cierre y emision."
            : "El curso ya puede revisarse para cierre y emision."
        : isPracticalCourse
          ? "Cuando termine la practica, aqui revisaras el cierre y los diplomas."
          : "Cuando termine la formacion, aqui revisaras el cierre y los diplomas."
    }
  ];
  const enrolledRosterPreview = enrolledMembers.length
    ? enrolledMembers
        .map((member) => {
          const progress = getLearnerCourseContentStats(course, member.id);
          return `
            <article class="compact-person-row">
              <div class="compact-person-main">
                <strong>${escapeHtml(member.name)}</strong>
                <span class="muted">${escapeHtml(member.email || "Sin email")} · ${escapeHtml(member.role || "Alumno")}</span>
              </div>
              <div class="chip-row">
                <span class="small-chip">${progress.blockProgress}% aula</span>
                <button class="mini-button" type="button" data-action="select-member" data-member-id="${member.id}">Vista previa</button>
                <button class="mini-button" type="button" data-action="nav" data-view="operations" data-course-id="${course.id}" data-member-id="${member.id}">Seguimiento</button>
              </div>
            </article>
          `;
        })
        .join("")
    : `<p class="muted">Todavia no hay personas inscritas en este curso.</p>`;
  const waitingRosterPreview = waitingMembers.length
    ? waitingMembers
        .map(
          (member) => {
            const associate = findAssociateByMember(member);
            return `
              <article class="compact-person-row">
                <div class="compact-person-main">
                  <strong>${escapeHtml(member.name)}</strong>
                  <span class="muted">${escapeHtml(member.email || "Sin email")}</span>
                </div>
                <div class="chip-row">
                  <span class="small-chip">Espera</span>
                  <span class="small-chip">${associate ? "Socio" : "Externo"}</span>
                  <button class="mini-button" type="button" data-action="move-waiting" data-course-id="${course.id}" data-member-id="${member.id}">Pasar a inscritos</button>
                  <button class="mini-button" type="button" data-action="select-member" data-member-id="${member.id}">Abrir</button>
                </div>
              </article>
            `;
          }
        )
        .join("")
    : `<p class="muted">No hay personas en espera en este curso.</p>`;
  const enrollmentQueuePreview = pendingEnrollmentSubmissions.length
    ? pendingEnrollmentSubmissions
        .map((submission) => {
          const member = findMember(submission.memberId);
          const associate = member ? findAssociateByMember(member) : null;
          const waiting = String(submission.status || "").trim() === "waiting";
          const proofPending = String(submission.status || "").trim() === "pending-proof";
          const statusLabel = getEnrollmentSubmissionStatusLabel(submission.status || "pending");
          const nextActionLabel = proofPending
            ? "Falta justificante para revisar"
            : waiting
              ? "Pendiente de plaza o promocion"
              : "Lista para decidir";
          return `
            <article class="compact-person-row compact-person-row-stacked">
              <div class="compact-person-main">
                <div class="row-between">
                  <strong>${escapeHtml(member?.name || "Alumno")}</strong>
                  <span class="small-chip">${escapeHtml(statusLabel)}</span>
                </div>
                <span class="muted">${escapeHtml(member?.email || "Sin email")} · ${Number(submission.amount || 0)} € · ${escapeHtml(submission.method || "Transferencia")}</span>
                <div class="chip-row compact-chip-row">
                  <span class="small-chip">${associate ? "Socio" : "Externo"}</span>
                  ${waiting ? `<span class="small-chip">Sin plaza</span>` : ""}
                  ${proofPending ? `<span class="small-chip">Falta justificante</span>` : ""}
                </div>
                <p class="muted"><strong>Siguiente accion:</strong> ${escapeHtml(nextActionLabel)}</p>
                ${submission.note ? `<p class="muted">${escapeHtml(submission.note)}</p>` : ""}
              </div>
              <div class="chip-row">
                <button class="mini-button" type="button" data-action="select-member" data-member-id="${submission.memberId}">Abrir alumno</button>
                ${
                  submission.paymentProof
                    ? `${renderStoredProofLink(submission.paymentProof, "Abrir justificante")}`
                    : `<span class="small-chip">${proofPending ? "Sin justificante" : waiting ? "En espera" : "Pendiente"}</span>`
                }
                <button class="mini-button" type="button" data-action="set-enrollment-submission-status" data-course-id="${course.id}" data-submission-id="${submission.id}" data-status="confirmed">Confirmar plaza</button>
                <button class="mini-button" type="button" data-action="set-enrollment-submission-status" data-course-id="${course.id}" data-submission-id="${submission.id}" data-status="pending-proof">Pedir justificante</button>
                <button class="mini-button" type="button" data-action="set-enrollment-submission-status" data-course-id="${course.id}" data-submission-id="${submission.id}" data-status="rejected">Rechazar</button>
              </div>
            </article>
          `;
        })
        .join("")
    : `<p class="muted">No hay solicitudes pendientes ahora mismo. El curso esta limpio en inscripcion y pagos.</p>`;
  const instructorStudentRows = enrolledMembers.length
    ? enrolledMembers
        .map((member) => {
          const journey = getLearnerCourseJourney(course, member.id);
          const progress = getLearnerCourseContentStats(course, member.id);
          const feedbackSent = Boolean(getCourseFeedbackResponse(course, member.id));
          const readyForDiploma = isMemberReadyForDiploma(course, member.id);
          const diplomaBlockers = getMemberDiplomaBlockingLabels(course, member.id);
          const diplomaGenerated = course.diplomaReady.includes(member.id);
          const diplomaState = diplomaGenerated
            ? "Generado"
            : readyForDiploma
              ? "Listo"
              : `Pendiente: ${diplomaBlockers[0] || "revision"}`;
          const diplomaActionLabel = diplomaGenerated
            ? "Ver diploma"
            : readyForDiploma
              ? "Emitir diploma"
              : "Ver requisitos";
          const diplomaAction = diplomaGenerated
            ? "open-member-diploma-preview"
            : readyForDiploma
              ? "generate-member-diploma"
              : "open-member-diploma-preview";
          if (isPracticalCourse) {
            return `
              <tr>
                <td>
                  <strong>${escapeHtml(member.name)}</strong><br>
                  <span class="muted">${escapeHtml(member.email || "Sin email")}</span>
                </td>
                <td>${progress.blockProgress}%<br><span class="muted">${progress.blocksCompleted}/${progress.blocksTotal} bloques</span></td>
                <td>${escapeHtml(journey.evaluation)}</td>
                <td>${feedbackSent ? "Enviada" : "Pendiente"}</td>
                <td>${escapeHtml(diplomaState)}</td>
                <td>
                  <div class="chip-row">
                    <button class="mini-button" type="button" data-action="set-course-preview-member" data-course-id="${course.id}" data-member-id="${member.id}" data-mode="learner">Abrir alumno</button>
                    <button class="mini-button" type="button" data-action="close-member-course" data-course-id="${course.id}" data-member-id="${member.id}">Cerrar practico</button>
                    <button class="mini-button" type="button" data-action="${diplomaAction}" data-course-id="${course.id}" data-member-id="${member.id}">${diplomaActionLabel}</button>
                  </div>
                </td>
              </tr>
            `;
          }
          return `
            <tr>
              <td>
                <strong>${escapeHtml(member.name)}</strong><br>
                <span class="muted">${escapeHtml(member.email || "Sin email")}</span>
              </td>
              <td>${journey.attendance}%</td>
              <td>${escapeHtml(journey.evaluation)}</td>
              <td>${progress.blockProgress}%<br><span class="muted">${progress.blocksCompleted}/${progress.blocksTotal} bloques</span></td>
              <td>${feedbackSent ? "Enviada" : "Pendiente"}</td>
              <td>${escapeHtml(diplomaState)}</td>
              <td>
                <div class="chip-row">
                  <button class="mini-button" type="button" data-action="set-course-preview-member" data-course-id="${course.id}" data-member-id="${member.id}" data-mode="learner">Abrir alumno</button>
                  <button class="mini-button" type="button" data-action="close-member-course" data-course-id="${course.id}" data-member-id="${member.id}">Cerrar curso</button>
                  <button class="mini-button" type="button" data-action="${diplomaAction}" data-course-id="${course.id}" data-member-id="${member.id}">${diplomaActionLabel}</button>
                </div>
              </td>
            </tr>
          `;
        })
        .join("")
    : "";
  const navigator = renderCourseStudioNavigator(
    course,
    normalizedWorkbenchMode,
    readiness,
    deliverySessions,
    enrolledMembers,
    waitingMembers,
    certificateSections,
    publishedLessons,
    totalLessons
  );
  const workbenchTabs = isPracticalCourse
    ? [
        { mode: "ficha", label: "Ficha" },
        { mode: "curriculum", label: "Documentacion" },
        { mode: "students", label: "Alumnado" },
        { mode: "certificate", label: "Diploma" },
        { mode: "feedback", label: "Valoracion" },
        { mode: "learner", label: "Vista alumno" }
      ]
    : [
        { mode: "ficha", label: "Ficha" },
        { mode: "curriculum", label: "Contenido" },
        { mode: "sessions", label: "Sesiones" },
        { mode: "students", label: "Alumnado" },
        { mode: "certificate", label: "Certificado" },
        { mode: "feedback", label: "Valoracion" },
        { mode: "learner", label: "Vista alumno" }
      ];

  return `
    <div class="panel-stack">
      <div class="content-module workbench-hero">
        <div class="module-head">
          <div>
            <p class="eyebrow">Campus · Estudio del curso</p>
            <h4>${escapeHtml(course.title)}</h4>
            <p class="muted">${escapeHtml(workbenchHeroText)}</p>
          </div>
          <div class="chip-row">
            <span class="small-chip">${getCourseTemplateLabel(course.contentTemplate || inferCourseTemplate(course))}</span>
            <span class="small-chip">${escapeHtml(getCourseClassLabel(course.courseClass))}</span>
            <span class="small-chip">${escapeHtml(course.status)}</span>
            <button class="ghost-button danger-button" type="button" data-action="delete-course" data-course-id="${course.id}">Eliminar curso</button>
          </div>
        </div>
        ${
          isPracticalCourse
            ? ""
            : `
              <div class="status-note info course-admin-next-steps">
                ${escapeHtml(courseAdminSteps.find((step) => step.mode === normalizedWorkbenchMode)?.title || "Curso activo")} · ${escapeHtml(courseAdminSteps.find((step) => step.mode === normalizedWorkbenchMode)?.detail || "Trabaja el bloque actual del curso desde esta vista.")}
              </div>
            `
        }
        <div class="workbench-tabs">
          ${workbenchTabs
            .map(
              (tab) => `
                <button class="${normalizedWorkbenchMode === tab.mode ? "primary-button" : "ghost-button"}" type="button" data-action="set-course-workbench-mode" data-mode="${tab.mode}">
                  ${tab.label}
                </button>
              `
            )
            .join("")}
        </div>
      </div>

      ${isPracticalCourse ? "" : navigator}

      <form id="courseEditForm" class="stack">
        ${
          showWorkbenchSection("ficha")
            ? `
        <div class="content-module">
          <div class="module-head">
            <div>
              <p class="eyebrow">Ficha base</p>
              <h4>Identidad y configuracion del curso</h4>
              <p class="muted">Define nombre, formato, fechas, plazas, modalidad y resumen del aula.</p>
            </div>
          </div>
          <div class="studio-grid">
            <label class="inline-field">
              Titulo
              <input id="editCourseTitle" value="${escapeHtml(course.title)}" />
            </label>
            <label class="inline-field">
              Clase del curso
              <select id="editCourseClass">
                ${Object.entries(COURSE_CLASS_LABELS)
                  .map(([value, label]) => `<option value="${value}" ${normalizeCourseClass(course.courseClass) === value ? "selected" : ""}>${label}</option>`)
                  .join("")}
              </select>
            </label>
            <label class="inline-field">
              Area o especialidad
              <input id="editCourseType" value="${escapeHtml(course.type)}" />
            </label>
            <label class="inline-field">
              Estado
              <select id="editCourseStatus">
                ${["Planificacion", "Inscripcion abierta", "Cierre pendiente", "Cerrado"].map((status) => `<option value="${status}" ${course.status === status ? "selected" : ""}>${status}</option>`).join("")}
              </select>
            </label>
            <label class="inline-field">
              Plantilla de contenido
              <select id="editCourseTemplate">
                ${Object.entries(COURSE_TEMPLATE_LABELS)
                  .map(([value, label]) => `<option value="${value}" ${course.contentTemplate === value ? "selected" : ""}>${label}</option>`)
                  .join("")}
              </select>
            </label>
            <label class="inline-field">
              Estado del contenido
              <select id="editCourseContentStatus">
                ${["draft", "outline", "ready"].map((status) => `<option value="${status}" ${course.contentStatus === status ? "selected" : ""}>${status}</option>`).join("")}
              </select>
            </label>
            <label class="inline-field">
              Fecha inicio
              <input id="editCourseStart" type="date" value="${course.startDate}" />
            </label>
            <label class="inline-field">
              Fecha fin
              <input id="editCourseEnd" type="date" value="${course.endDate}" />
            </label>
            <label class="inline-field">
              Horas
              <input id="editCourseHours" type="number" min="1" value="${course.hours}" />
            </label>
            <label class="inline-field">
              Plazas
              <input id="editCourseCapacity" type="number" min="1" value="${course.capacity}" />
            </label>
            <label class="inline-field">
              Modalidad
              <input id="editCourseModality" value="${escapeHtml(course.modality || "Presencial")}" />
            </label>
            <label class="inline-field">
              Importe inscripcion
              <input id="editCourseEnrollmentFee" type="number" min="0" step="0.01" value="${Number(course.enrollmentFee || 0)}" />
            </label>
            <label class="inline-field">
              Publico objetivo
              <input id="editCourseAudience" value="${escapeHtml(course.audience || "Socios y voluntariado operativo")}" />
            </label>
            <label class="inline-field">
              Quien puede inscribirse
              <select id="editCourseAccessScope">
                ${Object.entries(COURSE_ACCESS_SCOPE_LABELS)
                  .map(([value, label]) => `<option value="${value}" ${normalizeCourseAccessScope(course.accessScope, course.audience) === value ? "selected" : ""}>${label}</option>`)
                  .join("")}
              </select>
            </label>
            <label class="inline-field studio-full">
              Apertura de inscripcion
              <input id="editCourseEnrollmentOpensAt" type="datetime-local" value="${escapeHtml(normalizeDateTimeLocalInput(course.enrollmentOpensAt || ""))}" />
              <span class="field-hint">Programa aqui la fecha y hora en la que la inscripcion quedara activa. Hasta entonces el curso puede mostrarse, pero no dejara inscribirse.</span>
            </label>
            <label class="inline-field studio-full">
              Coordinacion o docente responsable
              <input id="editCourseCoordinator" value="${escapeHtml(course.coordinator || "")}" />
            </label>
            <label class="inline-field studio-full">
              Indicaciones de pago / transferencia
              <textarea id="editCourseEnrollmentInstructions" placeholder="IBAN, concepto, plazo o cualquier indicacion util para la inscripcion.">${escapeHtml(course.enrollmentPaymentInstructions || "")}</textarea>
            </label>
            <label class="inline-field studio-full">
              Resumen del curso
              <textarea id="editCourseSummary">${escapeHtml(course.summary)}</textarea>
            </label>
          </div>
        </div>

        <div class="content-module">
          <div class="module-head">
            <div>
              <p class="eyebrow">Diseño formativo</p>
              <h4>Objetivos, materiales y criterios</h4>
              <p class="muted">Esto equivale al plan docente del curso: que se quiere lograr, con que materiales y con que criterios se cierra.</p>
            </div>
            <div class="chip-row">
              <button class="mini-button" type="button" data-action="generate-course-blueprint">Regenerar base</button>
              <button class="mini-button" type="button" data-action="generate-course-content-pack">Generar pack editorial</button>
            </div>
          </div>
          <div class="studio-grid">
            <label class="inline-field studio-full">
              Objetivos
              <textarea id="editCourseObjectives" placeholder="Uno por linea">${escapeHtml(serializeTextareaList(course.objectives))}</textarea>
            </label>
            <label class="inline-field">
              Materiales
              <textarea id="editCourseMaterials" placeholder="Uno por linea">${escapeHtml(serializeTextareaList(course.materials))}</textarea>
            </label>
            <label class="inline-field">
              Criterios de evaluacion
              <textarea id="editCourseEvaluationCriteria" placeholder="Uno por linea">${escapeHtml(serializeTextareaList(course.evaluationCriteria))}</textarea>
            </label>
          </div>
        </div>
        `
            : ""
        }

        ${
          showWorkbenchSection("curriculum")
            ? `
        <div class="content-module">
          <div class="module-head">
            <div>
              <p class="eyebrow">${isPracticalCourse ? "Curso practico" : "Contenido del aula"}</p>
              <h4>${isPracticalCourse ? "Documentacion, recursos y evaluacion" : "Modulos, unidades y contenido publicable"}</h4>
              <p class="muted">${isPracticalCourse ? "Para un curso practico no hace falta construir modulos ni sesiones complejas. Sube aqui la documentacion que deben revisar y deja lista la parte de seguimiento y cierre." : "Crea la ruta de aprendizaje por modulos y lecciones. Cada leccion puede llevar PDF, video, descarga, practica o test."}</p>
            </div>
            <div class="chip-row">
              ${
                isPracticalCourse
                  ? `<button class="ghost-button" type="button" data-action="add-course-resource">Anadir documento</button>`
                  : `${Object.entries(COURSE_TEMPLATE_LABELS)
                      .map(
                        ([value, label]) => `
                          <button class="${course.contentTemplate === value ? "primary-button" : "mini-button"}" type="button" data-action="apply-course-template" data-template="${value}">
                            ${label}
                          </button>
                        `
                      )
                      .join("")}
                    <button class="ghost-button" type="button" data-action="add-course-module">Anadir modulo</button>`
              }
            </div>
          </div>
          ${
            isPracticalCourse
              ? ""
              : `
                <div class="chip-row compact-chip-row">
                  <button class="${activeCurriculumMode === "modules" ? "primary-button" : "ghost-button"}" type="button" data-action="set-course-curriculum-mode" data-mode="modules">Modulos y lecciones</button>
                  <button class="${activeCurriculumMode === "resources" ? "primary-button" : "ghost-button"}" type="button" data-action="set-course-curriculum-mode" data-mode="resources">Biblioteca del curso</button>
                </div>
              `
          }
          <div class="studio-subgrid">
            ${
              !isPracticalCourse && activeCurriculumMode === "modules"
                ? `
                  <div class="content-studio">
                    ${
                      (course.modules || []).length
                        ? course.modules.map((module, moduleIndex) => renderCourseModuleEditor(module, moduleIndex)).join("")
                        : `<div class="empty-state">Todavia no hay modulos. Usa una plantilla o anade el primero manualmente.</div>`
                    }
                  </div>
                `
                : `
                  <div class="lesson-stack">
                    ${
                      (course.resources || []).length
                        ? course.resources.map((resource, resourceIndex) => renderCourseResourceEditor(resource, resourceIndex)).join("")
                        : `<div class="empty-state">${isPracticalCourse ? "Todavia no hay documentacion ni recursos para este curso practico." : "Todavia no hay recursos en la biblioteca de este curso."}</div>`
                    }
                  </div>
                `
            }
            <div class="stack">
              <div class="timeline-item">
                <span class="eyebrow">${isPracticalCourse ? "Estado del curso practico" : activeCurriculumMode === "modules" ? "Estado del curriculo" : "Estado de la biblioteca"}</span>
                <strong>${isPracticalCourse ? `${(course.resources || []).length} recurso(s) y ${blockMix.evaluation || 0} bloque(s) de evaluacion` : activeCurriculumMode === "modules" ? `${publishedLessons}/${totalLessons} leccion(es) publicadas` : `${(course.resources || []).length} recurso(s) del curso`}</strong>
                <p class="muted">${isPracticalCourse ? `${visibleResources} recurso(s) visibles para el alumnado. Usa esta zona para dossier previo, normativa, briefing, anexos y cualquier documento que quieran consultar online o descargar.` : `${(course.modules || []).length} modulo(s), ${blockMix.document || 0} documento(s), ${blockMix.video || 0} video(s), ${blockMix.evaluation || 0} test(s) y ${blockMix.practice || 0} practica(s).`}</p>
              </div>
              <div class="timeline-item">
                <span class="eyebrow">Regla de alumno</span>
                <p class="muted">${isPracticalCourse ? "El alumno vera solo la documentacion visible, el estado del curso y la valoracion final. La evaluacion y la asistencia se cierran desde instructor." : "Solo lo publicado aparece en el aula del alumno y cuenta para desbloquear el diploma."}</p>
              </div>
              <div class="timeline-item">
                <span class="eyebrow">${isPracticalCourse ? "Cierre del practico" : "Biblioteca visible"}</span>
                <p class="muted">${isPracticalCourse ? `La encuesta final ${course.feedbackEnabled ? "esta activa" : "esta desactivada"} y el diploma ${course.feedbackRequiredForDiploma ? "requiere" : "no requiere"} la valoracion para emitirse.` : `${visibleResources} recurso(s) accesibles para el alumno.`}</p>
              </div>
              ${
                isPracticalCourse || activeCurriculumMode === "resources"
                  ? `
                    <div class="timeline-item">
                      <span class="eyebrow">Accion rapida</span>
                      <div class="chip-row">
                        ${isPracticalCourse ? "" : `<button class="mini-button" type="button" data-action="sync-course-resources">Traer desde lecciones</button>`}
                        <button class="mini-button" type="button" data-action="add-course-resource">${isPracticalCourse ? "Subir documento" : "Anadir recurso"}</button>
                      </div>
                    </div>
                  `
                  : ""
              }
            </div>
          </div>
        </div>
        `
            : ""
        }

        ${
          showWorkbenchSection("sessions")
            ? `
        <div class="content-module" id="courseSessionsPanel">
          <div class="module-head">
            <div>
              <p class="eyebrow">Plan de sesiones</p>
              <h4>Jornadas, bloques y despliegue del curso</h4>
              <p class="muted">Trabaja las sesiones como hace la formacion online y blended profesional: una linea base editable y una vista clara por sesion.</p>
            </div>
            <div class="chip-row">
              <button class="mini-button" type="button" data-action="generate-course-blueprint">Regenerar base</button>
              <button class="mini-button" type="button" data-action="generate-course-content-pack">Actualizar curriculo</button>
            </div>
          </div>
          <label class="inline-field studio-full">
            Sesiones del curso
            <textarea id="editCourseSessions" placeholder="Sesion 1 | 2h | enfoque principal">${escapeHtml(serializeSessions(course.sessions))}</textarea>
          </label>
          <div class="lesson-stack" style="margin-top: 14px;">
            ${
              deliverySessions.length
                ? deliverySessions
                    .map(
                      (session, sessionIndex) => `
                        <article class="lesson-card">
                          <div class="module-head">
                            <div>
                              <p class="eyebrow">Sesion ${sessionIndex + 1}</p>
                              <h4>${escapeHtml(session.title || `Sesion ${sessionIndex + 1}`)}</h4>
                            </div>
                            <span class="small-chip">${escapeHtml(session.duration ? `${session.duration} h` : "Duracion pendiente")}</span>
                          </div>
                          <p class="muted">${escapeHtml(session.focus || "Sin enfoque definido.")}</p>
                        </article>
                      `
                    )
                    .join("")
                : `<div class="empty-state">Todavia no hay sesiones definidas. Guarda el curso con una o varias sesiones para estructurarlo mejor.</div>`
            }
          </div>
        </div>
        `
            : ""
        }

        ${
          showWorkbenchSection("students")
            ? `
        <div class="content-module">
          <div class="module-head">
            <div>
              <p class="eyebrow">Alumnado del curso</p>
              <h4>Inscritos, espera y seguimiento</h4>
              <p class="muted">Controla a quien usas como vista previa del aula, quien esta dentro y quien espera plaza.</p>
            </div>
            <div class="chip-row">
              <button class="ghost-button" type="button" data-action="nav" data-view="operations" data-course-id="${course.id}">Ir a operativa</button>
              <button class="ghost-button" type="button" data-action="nav" data-view="diplomas" data-course-id="${course.id}">Ir a diplomas</button>
            </div>
          </div>
          <div class="status-note info course-students-summary">
            ${enrolledMembers.length} inscrito(s), ${pendingEnrollmentSubmissions.length} pendiente(s) de revisar, ${proofPendingSubmissions.length} con justificante pendiente y ${waitingMembers.length || waitingEnrollmentSubmissions.length} en espera.
          </div>
          <div class="mail-card" id="courseStudentsControlBoard">
            <div class="row-between">
              <div>
                <h4>Mesa de control del instructor</h4>
                <p class="muted">${isPracticalCourse ? "Cierra el practico por alumno desde una sola tabla: documentacion, evaluacion, valoracion y diploma." : "Desde aqui puedes ver el paso de cada alumno y cerrar asistencia o evaluacion sin ir saltando por otras pantallas."}</p>
              </div>
              <div class="chip-row">
                ${
                  isPracticalCourse
                    ? `
                      <button class="mini-button" type="button" data-action="close-all-member-courses" data-course-id="${course.id}">Cerrar alumnado</button>
                      <button class="mini-button" type="button" data-action="generate-diplomas" data-course-id="${course.id}">Emitir pendientes</button>
                    `
                    : `
                      <button class="mini-button" type="button" data-action="set-all-attendance" data-course-id="${course.id}">Todo al 100%</button>
                      <button class="mini-button" type="button" data-action="set-all-evaluations-apt" data-course-id="${course.id}">Marcar aptos</button>
                      <button class="mini-button" type="button" data-action="generate-diplomas" data-course-id="${course.id}">Revisar diplomas</button>
                    `
                }
              </div>
            </div>
            ${
              instructorStudentRows
                ? `
                  <div class="table-card instructor-students-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Alumno</th>
                          ${isPracticalCourse ? "" : "<th>Asistencia</th>"}
                          <th>Evaluacion</th>
                          <th>${isPracticalCourse ? "Documentacion" : "Contenido"}</th>
                          <th>Valoracion</th>
                          <th>Diploma</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${instructorStudentRows}
                      </tbody>
                    </table>
                  </div>
                `
                : `<p class="muted">Todavia no hay alumnado confirmado para activar el seguimiento del instructor.</p>`
            }
          </div>
          <div class="course-grid course-grid-tight">
            <div class="mail-card" id="courseStudentsQueue">
              <div class="row-between">
                <h4>Cola de revision</h4>
                <span class="small-chip">${pendingEnrollmentSubmissions.length} pendiente(s)</span>
              </div>
              <div class="stack compact-list">
                ${enrollmentQueuePreview}
              </div>
            </div>
            <div class="mail-card" id="courseStudentsCapacity">
              <div class="row-between">
                <h4>Plazas y espera</h4>
                <span class="small-chip">${getCourseSeatsLeft(course) > 0 ? `${getCourseSeatsLeft(course)} libre(s)` : "Completo"}</span>
              </div>
              <div class="timeline-item compact-timeline-item">
                <span class="eyebrow">Capacidad actual</span>
                <strong>${getCourseEnrolledCount(course)}/${course.capacity}</strong>
                <p>${getCourseSeatsLeft(course) > 0 ? `${getCourseSeatsLeft(course)} plaza(s) libre(s)` : "Curso completo. Las nuevas solicitudes pasan a espera."}</p>
              </div>
              <div class="timeline-item compact-timeline-item">
                <span class="eyebrow">Inscripcion</span>
                <strong>${escapeHtml(course.status)}</strong>
                <p>${course.enrollmentFee > 0 ? `${course.enrollmentFee} € por transferencia` : "Curso sin coste para el alumnado."}</p>
              </div>
              <div class="timeline-item compact-timeline-item">
                <span class="eyebrow">Accion recomendada</span>
                <strong>${proofPendingSubmissions.length ? "Revisar justificantes" : waitingMembers.length ? "Gestionar espera" : "Curso operativo"}</strong>
                <p>${proofPendingSubmissions.length ? "Hay solicitudes pendientes de validar antes de cerrar la matricula." : waitingMembers.length ? "Puedes promover alumnado en cuanto se libere plaza." : "No hay bloqueos visibles en la admision del curso."}</p>
              </div>
              <div class="stack compact-list">
                ${waitingRosterPreview}
              </div>
            </div>
          </div>
          <div class="mail-card" id="courseStudentsRoster">
            <div class="row-between">
              <h4>Roster del curso</h4>
              <span class="small-chip">${enrolledMembers.length} inscrito(s)</span>
            </div>
            <div class="stack compact-list">
              ${enrolledRosterPreview}
            </div>
          </div>
          <div class="mail-card" id="courseStudentsLedger">
            <h4>Inscripciones y pagos</h4>
            ${
              enrollmentSubmissions.length
                ? `
                  <div class="table-card">
                    <table>
                      <thead>
                        <tr>
                          <th>Alumno</th>
                          <th>Estado</th>
                          <th>Importe</th>
                          <th>Metodo</th>
                          <th>Justificante</th>
                          <th>Nota</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${enrollmentSubmissions
                          .map((submission) => {
                            const member = findMember(submission.memberId);
                            return `
                              <tr>
                                <td>${escapeHtml(member?.name || "Alumno")}</td>
                                <td>${escapeHtml(getEnrollmentSubmissionStatusLabel(submission.status || "pending"))}</td>
                                <td>${Number(submission.amount || 0)} €</td>
                                <td>${escapeHtml(submission.method || "Transferencia")}</td>
                                <td>${submission.paymentProof ? `${escapeHtml(submission.paymentProof.name || "archivo")}<br>${renderStoredProofLink(submission.paymentProof)}` : "-"}</td>
                                <td>${escapeHtml(submission.note || "-")}</td>
                                <td>
                                  <div class="chip-row">
                                    <button class="mini-button" type="button" data-action="set-enrollment-submission-status" data-course-id="${course.id}" data-submission-id="${submission.id}" data-status="confirmed">Validar</button>
                                    <button class="mini-button" type="button" data-action="set-enrollment-submission-status" data-course-id="${course.id}" data-submission-id="${submission.id}" data-status="pending-proof">Pedir justificante</button>
                                    <button class="mini-button" type="button" data-action="set-enrollment-submission-status" data-course-id="${course.id}" data-submission-id="${submission.id}" data-status="rejected">Rechazar</button>
                                  </div>
                                </td>
                              </tr>
                            `;
                          })
                          .join("")}
                      </tbody>
                    </table>
                  </div>
                `
                : `<p class="muted">Todavia no hay solicitudes de inscripcion registradas en este curso.</p>`
            }
          </div>
          ${
            previewMember
              ? `
          <div class="timeline-item">
            <span class="eyebrow">Vista previa actual</span>
            <strong>${escapeHtml(previewMember.name)}</strong>
            <p class="muted">${selectedMemberProgress ? `${selectedMemberProgress.lessonIds?.length || 0} leccion(es) y ${selectedMemberProgress.blockIds?.length || 0} bloque(s) completados` : "Sin progreso registrado todavia."}</p>
          </div>
          `
              : ""
          }
        </div>
        `
            : ""
        }

        ${
          showWorkbenchSection("certificate")
            ? `
        <div class="content-module" id="courseCertificatePanel">
          <div class="module-head">
            <div>
              <p class="eyebrow">Certificado final</p>
              <h4>${isPracticalCourse ? "Cierre documental y diploma del practico" : "Datos y contenidos que saldran en el documento"}</h4>
              <p class="muted">${isPracticalCourse ? "En un practico solo hace falta cerrar el formato del diploma, la ciudad y el contenido acreditado que acompanara al documento final." : "Define tipo de diploma, ciudad y el bloque de contenidos acreditados que acompañará al certificado."}</p>
            </div>
            <div class="chip-row">
              <span class="small-chip">${escapeHtml(course.diplomaTemplate || "Aprovechamiento")}</span>
              <span class="small-chip">${escapeHtml(course.certificateCity || state.settings.certificateCity || "Madrid")}</span>
              <span class="small-chip">${certificateSections.length} bloque(s)</span>
            </div>
          </div>
          <div class="certificate-editor-callout">
            <div>
              <p class="eyebrow">Contenido acreditado del diploma</p>
              <h5>${isPracticalCourse ? "Este es el texto que saldra en el diploma del practico" : "Este es el texto que saldra en el certificado final"}</h5>
              <p class="muted">${isPracticalCourse ? "En el practico conviene describir de forma simple la documentacion y el trabajo realizado. Si lo dejas vacio, el sistema usara los recursos visibles del curso." : "Si lo rellenas aqui, este contenido manda sobre el temario automatico. Si lo dejas vacio, el sistema construira el diploma usando modulos y lecciones publicadas del curso."}</p>
            </div>
            <div class="chip-row">
              <span class="small-chip">${course.certificateContents?.length ? "Contenido manual activo" : "Contenido automatico del curso"}</span>
            </div>
          </div>
          <div class="studio-grid">
            <label class="inline-field">
              Tipo de diploma
              <input id="editCourseDiploma" value="${escapeHtml(course.diplomaTemplate)}" />
            </label>
            <label class="inline-field">
              Ciudad del certificado
              <input id="editCourseCertificateCity" value="${escapeHtml(course.certificateCity || "")}" placeholder="${escapeHtml(state.settings.certificateCity || "Madrid")}" />
            </label>
            <label class="inline-field studio-full">
              Contenidos que saldran en el diploma
              <textarea id="editCourseCertificateContents" class="certificate-contents-textarea" placeholder="Escribe aqui exactamente los contenidos que quieres que aparezcan en el diploma. Usa una linea por item, o bien: Bloque | item 1; item 2; item 3">${escapeHtml(serializeTextareaList(course.certificateContents || []))}</textarea>
              <span class="field-hint">Ejemplo: Ventilacion tactica | Lectura de humos; Presion positiva; Coordinacion con ataque interior</span>
            </label>
          </div>
          <div class="course-grid">
            <div class="timeline-item">
              <span class="eyebrow">Firmas</span>
              <p>${escapeHtml(state.settings.diplomaSignerA || "Direccion de Formacion")}</p>
              <p>${escapeHtml(state.settings.diplomaSignerB || "Presidencia")}</p>
            </div>
            <div class="timeline-item">
              <span class="eyebrow">Regla de generacion</span>
              <p>${course.certificateContents?.length ? "Se usaran los contenidos definidos aqui." : "Si lo dejas vacio, el sistema tomara modulos y lecciones del curso."}</p>
            </div>
          </div>
          ${
            previewMember
              ? `
          <div class="chip-row">
            <button class="button-link" type="button" data-action="nav" data-view="diplomas" data-course-id="${course.id}">Abrir vista previa</button>
            <a class="mini-button" href="/api/diplomas/${course.id}/${previewMember.id}.pdf">PDF</a>
            <a class="mini-button" href="/api/diplomas/${course.id}/${previewMember.id}.docx">Word</a>
          </div>
          <p class="muted">La vista previa se genera con ${escapeHtml(previewMember.name)} para revisar el certificado antes de emitirlo en firme.</p>
          `
              : `<p class="muted">Inscribe al menos a una persona para generar una vista previa del certificado.</p>`
          }
          <div class="certificate-section-list">
            ${certificateSections
              .map(
                (section) => `
                  <div class="timeline-item">
                    <strong>${escapeHtml(section.title)}</strong>
                    <p class="muted">${section.items.map((item) => escapeHtml(item)).join(" | ")}</p>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
        `
            : ""
        }

        ${
          showWorkbenchSection("feedback")
            ? renderCourseFeedbackSummary(course)
            : ""
        }

        ${
          showWorkbenchSection("learner")
            ? `
          <div class="content-module">
            <div class="module-head">
              <div>
                <p class="eyebrow">Vista previa del alumno</p>
                <h4>${isPracticalCourse ? "Asi se vera el practico desde dentro" : "Asi se vera el aula desde dentro"}</h4>
                <p class="muted">${isPracticalCourse ? "Comprueba la experiencia corta del alumno: documentacion, estado del curso y valoracion final, sin distracciones ni constructor complejo." : "Comprueba entrada al curso, temario, sesiones, recursos y requisitos del certificado sin salir del constructor."}</p>
              </div>
              <div class="chip-row">
                <button class="ghost-button" type="button" data-action="nav" data-view="operations" data-course-id="${course.id}">Seguimiento</button>
              <button class="ghost-button" type="button" data-action="nav" data-view="diplomas" data-course-id="${course.id}">Diplomas</button>
            </div>
          </div>
          ${
            previewMember
              ? renderMemberCourseWorkspace(course, { memberId: previewMember.id, previewOnly: true })
              : `<div class="empty-state">Inscribe al menos a una persona para ver el aula como alumno.</div>`
          }
        </div>
        `
            : ""
        }

        <div class="chip-row">
          <button class="ghost-button" type="button" data-action="generate-course-blueprint" data-template="${escapeHtml(course.contentTemplate || inferCourseTemplate(course))}">Rehacer estructura del curso</button>
          <button class="ghost-button danger-button" type="button" data-action="delete-course" data-course-id="${course.id}">Eliminar curso</button>
          <button class="primary-button" type="submit">Guardar curso</button>
        </div>
      </form>
    </div>
  `;
}
function renderSelectedCourse(course) {
  if (!course) {
    return `<div class="empty-state">Selecciona un curso para revisar su resumen.</div>`;
  }
  const isPracticalCourse = normalizeCourseClass(course.courseClass) === "practico";

  if (isAdminView()) {
    return `
      <div class="panel-stack">
        <div>
          <p class="eyebrow">Campus · Curso seleccionado</p>
          <h3>${course.title}</h3>
        </div>
        <div class="table-card">
          <table>
            <tbody>
              <tr><td>Clase</td><td>${escapeHtml(getCourseClassLabel(course.courseClass))}</td></tr>
              <tr><td>Estado</td><td>${escapeHtml(course.status)}</td></tr>
              <tr><td>Fechas</td><td>${formatDate(course.startDate)} - ${formatDate(course.endDate)}</td></tr>
              <tr><td>Plazas</td><td>${getCourseEnrolledCount(course)}/${course.capacity}</td></tr>
                <tr><td>${isPracticalCourse ? "Documentacion" : "Contenido"}</td><td>${isPracticalCourse ? `${getVisibleCourseResources(course, "admin").length} recurso(s)` : `${getPublishedLessonCount(course)} / ${getCourseLessonCount(course)} leccion(es)`}</td></tr>
              <tr><td>Diplomas listos</td><td>${course.diplomaReady?.length || 0}</td></tr>
            </tbody>
          </table>
        </div>
          <div class="chip-row">
            <button class="primary-button" data-action="open-course-workbench-tab" data-course-id="${course.id}" data-mode="ficha">Ficha</button>
            <button class="ghost-button" data-action="open-course-workbench-tab" data-course-id="${course.id}" data-mode="curriculum">${isPracticalCourse ? "Documentacion" : "Contenido"}</button>
            ${isPracticalCourse ? "" : `<button class="ghost-button" data-action="open-course-workbench-tab" data-course-id="${course.id}" data-mode="sessions">Sesiones</button>`}
            <button class="ghost-button" data-action="open-course-workbench-tab" data-course-id="${course.id}" data-mode="learner">Vista alumno</button>
          <button class="ghost-button" data-action="open-course-workbench-tab" data-course-id="${course.id}" data-mode="certificate">Certificado</button>
          <button class="ghost-button" data-action="nav" data-view="operations" data-course-id="${course.id}">Asistencia</button>
          <button class="ghost-button" data-action="nav" data-view="diplomas" data-course-id="${course.id}">Diplomas</button>
          <button class="ghost-button danger-button" data-action="delete-course" data-course-id="${course.id}">Eliminar curso</button>
        </div>
      </div>
    `;
  }

  const journey = getLearnerCourseJourney(course, state.selectedMemberId);
  const sections = getCertificateSections(course);
  const objectives = (course.objectives || []).slice(0, 4);
  const resources = getVisibleCourseResources(course, "member").slice(0, 4);
  const sessions = (course.sessions || []).slice(0, 4);
  const canEnroll =
    !journey.hasDiploma &&
    !journey.enrolled &&
    !journey.waiting &&
    isCourseOpenForEnrollment(course) &&
    !isMemberPreviewSession();
  const enrollmentCall = getCourseEnrollmentCall(course);
  const isPreviewMode = isMemberPreviewSession();
  const enrollmentSubmission = getCourseEnrollmentSubmission(course, state.selectedMemberId);
  const enrollmentHeadline = journey.enrolled
    ? journey.hasDiploma
      ? "Curso completado"
      : "Inscripcion confirmada"
    : journey.waiting
      ? "Solicitud en espera"
      : canEnroll
        ? "Inscribete en este curso"
        : "Inscripcion no disponible";
  const enrollmentDescription = journey.enrolled
    ? journey.hasDiploma
      ? "Has completado el curso y tu diploma ya esta disponible en Mis diplomas."
      : "Ya estas dentro del curso y puedes pasar directamente al aula."
    : journey.waiting
      ? "Tu solicitud ya esta registrada y esta pendiente de plaza o validacion administrativa."
      : String(course.status || "") === "Inscripcion abierta"
        ? enrollmentCall.scheduledMode
          ? `La inscripcion de este curso se abrira el ${enrollmentCall.opensAtLabel}. Hasta entonces puedes revisar el programa y las fechas.`
          : "La inscripcion esta abierta. Puedes confirmar ahora tu solicitud como socio y adjuntar el justificante de transferencia."
        : "Este curso no permite ahora mismo nuevas inscripciones directas.";
  const enrollmentPrimaryLabel = journey.enrolled
    ? journey.hasDiploma
      ? "Ir a Mis diplomas"
      : "Entrar al aula"
    : journey.waiting
      ? "Ver mi solicitud"
      : canEnroll
        ? enrollmentCall.ctaLabel
        : "Ver programa";
  const enrollmentStatusBadge = journey.enrolled
    ? journey.hasDiploma
      ? "Curso completado"
      : "Dentro del curso"
    : journey.waiting
      ? "Pendiente"
      : String(course.status || "") === "Inscripcion abierta"
        ? enrollmentCall.scheduledMode
          ? "Programada"
          : "Abierta ahora"
        : "Cerrada";
  const enrollmentNextStep = journey.enrolled
    ? journey.hasDiploma
      ? "Descargar el diploma en Mis diplomas"
      : "Ya puedes entrar al aula"
    : journey.waiting
      ? "Tu solicitud espera validacion o una plaza libre"
      : canEnroll
        ? enrollmentCall.waitlistMode
          ? "Registrar la solicitud para entrar en espera"
          : "Confirmar la inscripcion y adjuntar justificante"
        : enrollmentCall.scheduledMode
          ? `Esperar a la apertura del ${enrollmentCall.opensAtLabel}`
        : "Revisar programa y fechas";
  const enrollmentWorkflowSteps = [
    {
      eyebrow: "Paso 1",
      title: "Estado y plazas",
      mode: "status",
      target: "courseEnrollmentStatusOverview",
      detail: journey.enrolled
        ? journey.hasDiploma
          ? "Curso cerrado para ti y diploma disponible."
          : "Ya estas dentro del curso."
        : `${enrollmentCall.statusLabel}. ${getCourseEnrolledCount(course)}/${course.capacity} ocupadas.`
    },
    {
      eyebrow: "Paso 2",
      title: journey.hasDiploma
        ? "Curso finalizado"
        : enrollmentSubmission
        ? !enrollmentSubmission.paymentProof || enrollmentSubmission.status === "pending-proof"
          ? "Adjuntar justificante"
          : "Solicitud registrada"
        : canEnroll
          ? enrollmentCall.waitlistMode
            ? "Entrar en espera"
            : "Confirmar inscripcion"
          : enrollmentCall.scheduledMode
            ? "Apertura programada"
          : "Inscripcion cerrada",
      mode: "status",
      target: journey.hasDiploma
        ? "courseEnrollmentStatusOverview"
        : enrollmentSubmission
        ? (!enrollmentSubmission.paymentProof || enrollmentSubmission.status === "pending-proof")
          ? "courseEnrollmentSubmissionState"
          : "courseEnrollmentSubmissionState"
        : learnerEnrollmentIntent
          ? "courseEnrollmentRequestForm"
          : "courseEnrollmentQuickAction",
      detail: journey.hasDiploma
        ? "Tu parte de inscripcion ya quedo cerrada y el resultado esta en Mis diplomas."
        : enrollmentSubmission
        ? !enrollmentSubmission.paymentProof || enrollmentSubmission.status === "pending-proof"
          ? "Aporta la transferencia para que administracion pueda validarte."
          : "Tu solicitud ya esta dentro del curso."
        : canEnroll
          ? enrollmentCall.waitlistMode
            ? "No quedan plazas: tu solicitud quedara en cola."
            : "Reserva tu plaza y, si procede, adjunta el pago."
          : enrollmentCall.scheduledMode
            ? `La inscripcion se activara el ${enrollmentCall.opensAtLabel}.`
          : "Ahora mismo no puedes enviar solicitud."
    },
    {
      eyebrow: "Paso 3",
      title: journey.hasDiploma ? "Ir a diplomas" : journey.enrolled ? "Entrar al aula" : journey.waiting ? "Esperar validacion" : "Revisar programa",
      mode: journey.hasDiploma ? "status" : journey.enrolled ? "status" : journey.waiting ? "status" : "overview",
      target: journey.hasDiploma ? "courseEnrollmentStatusOverview" : journey.enrolled ? "courseEnrollmentStatusOverview" : journey.waiting ? "courseEnrollmentSubmissionState" : "courseEnrollmentProgramSummary",
      detail: journey.hasDiploma
        ? "El diploma ya no vive aqui: lo tienes en Mis diplomas."
        : journey.enrolled
          ? "Empieza por el aula y sigue la ruta del curso."
        : journey.waiting
          ? "Cuando te confirmen plaza, podras continuar."
          : "Comprueba temario, sesiones y fechas antes de apuntarte."
    },
    {
      eyebrow: "Paso 4",
      title: "Despues: diplomas",
      mode: "status",
      target: "courseEnrollmentStatusOverview",
      detail: journey.diplomaReady
        ? "Tu diploma ya esta disponible en Mis diplomas."
        : "Cuando completes el curso, el diploma aparecera en Mis diplomas."
    }
  ];
    const detailModes = [
      { key: "overview", label: isPracticalCourse ? "Resumen" : "Programa" },
      ...(!isPracticalCourse ? [{ key: "sessions", label: "Sesiones" }] : []),
      { key: "resources", label: isPracticalCourse ? "Documentacion" : "Recursos" },
      { key: "certificate", label: "Certificado" },
      { key: "status", label: "Inscripcion" }
    ];
  const activeDetailMode = detailModes.some((item) => item.key === learnerCourseDetailsMode)
    ? learnerCourseDetailsMode
    : "overview";

  return `
    <div class="panel-stack">
      <div>
        <p class="eyebrow">Campus · Resumen del curso</p>
        <h3>${course.title}</h3>
      </div>
      <p class="muted">${course.summary}</p>
      <div class="chip-row">
        <span class="small-chip">${escapeHtml(describeCourseType(course))}</span>
        <span class="small-chip">${formatDate(course.startDate)} - ${formatDate(course.endDate)}</span>
        <span class="small-chip">${escapeHtml(course.modality || "Presencial")}</span>
        <span class="small-chip">${course.hours} h</span>
      </div>

      ${renderLearnerJourneyCard(course, state.selectedMemberId, { compact: true })}

      <div class="chip-row learner-section-tabs">
        ${detailModes
          .map(
            (mode) => `
              <button class="${activeDetailMode === mode.key ? "primary-button" : "ghost-button"}" type="button" data-action="set-learner-course-details-mode" data-mode="${mode.key}">
                ${mode.label}
              </button>
            `
          )
          .join("")}
      </div>

      <div class="status-note info course-detail-summary-row">
        ${journey.hasDiploma ? "Curso completado" : journey.enrolled ? "Dentro del curso" : journey.waiting ? "En espera" : canEnroll ? enrollmentCall.waitlistMode ? "Lista de espera" : "Inscripcion abierta" : "No disponible"} ·
        Plazas: ${escapeHtml(enrollmentCall.statusLabel)} (${getCourseEnrolledCount(course)}/${course.capacity}) ·
        Importe: ${course.enrollmentFee > 0 ? `${course.enrollmentFee} €` : "Sin coste"} ·
        Siguiente paso: ${escapeHtml(journey.hasDiploma ? enrollmentPrimaryLabel : enrollmentSubmission ? getEnrollmentSubmissionStatusLabel(enrollmentSubmission.status) : enrollmentPrimaryLabel)}.
      </div>

      ${
        activeDetailMode === "overview"
          ? `
            <div class="course-grid">
              <div class="mail-card compact-panel" id="courseEnrollmentProgramSummary">
                <h4>De que consta</h4>
                <p class="muted">Resumen corto del programa, estructura y contenidos incluidos en la matricula.</p>
                <ul class="compact-list">
                  <li>${(course.modules || []).length} modulo(s) estructurados</li>
                  <li>${getPublishedLessonCount(course)} leccion(es) publicadas</li>
                  <li>${resources.length} recurso(s) visibles en el aula</li>
                  <li>${sections.length} bloque(s) de contenido para el certificado</li>
                </ul>
              </div>
              <div class="mail-card compact-panel">
                <h4>Objetivos principales</h4>
                ${
                  objectives.length
                    ? `<ul class="compact-list">${objectives.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
                    : `<p class="muted">El instructor todavia no ha publicado objetivos detallados.</p>`
                }
              </div>
            </div>
          `
          : ""
      }

      ${
        activeDetailMode === "sessions"
          ? `
            <div class="mail-card compact-panel" id="courseDetailModeSessions">
              <h4>Sesiones del curso</h4>
              ${
                sessions.length
                  ? `<ul class="compact-list">${sessions.map((session) => `<li>${escapeHtml(session.title || "Sesion")} · ${escapeHtml(session.duration ? `${session.duration} h` : "duracion pendiente")}</li>`).join("")}</ul>`
                  : `<p class="muted">Todavia no hay sesiones visibles en este curso.</p>`
              }
            </div>
          `
          : ""
      }

      ${
        activeDetailMode === "resources"
          ? `
            <div class="mail-card compact-panel" id="courseDetailModeResources">
              <h4>Recursos incluidos</h4>
              ${
                resources.length
                  ? `<ul class="compact-list">${resources.map((resource) => `<li>${escapeHtml(resource.title || resource.label || "Recurso")} · ${escapeHtml(resource.type || "documento")}</li>`).join("")}</ul>`
                  : `<p class="muted">Todavia no hay recursos visibles publicados.</p>`
              }
            </div>
          `
          : ""
      }

      ${
        activeDetailMode === "certificate"
          ? `
            <div class="mail-card compact-panel" id="courseDetailModeCertificate">
              <h4>Certificado final</h4>
              ${
                sections.length
                  ? `<ul class="compact-list">${sections.map((section) => `<li>${escapeHtml(section.title)} · ${section.items.length} item(s)</li>`).join("")}</ul>`
                  : `<p class="muted">El certificado tomara estructura del curso cuando se cierre la formacion.</p>`
              }
            </div>
          `
          : ""
      }

      ${
        activeDetailMode === "status"
          ? `
            <div class="panel-stack" id="courseDetailModeStatus">
              <div class="mail-card compact-panel enrollment-hero-card" id="courseEnrollmentStatusOverview">
                <div class="module-head">
                  <div>
                    <p class="eyebrow">Inscripcion del curso</p>
                    <h4>${enrollmentHeadline}</h4>
                    <p class="muted">${enrollmentDescription}</p>
                  </div>
                  ${
                    course.status === "Inscripcion abierta"
                      ? `
                        <div class="chip-row">
                          <span class="small-chip">${escapeHtml(enrollmentCall.statusLabel)}</span>
                          <span class="small-chip">${course.enrollmentFee > 0 ? `${course.enrollmentFee} €` : "Sin coste"}</span>
                          <span class="small-chip">${escapeHtml(enrollmentCall.audienceLabel)}</span>
                        </div>
                      `
                      : ""
                  }
                </div>
                  <div class="chip-row">
                    <span class="small-chip">${escapeHtml(enrollmentStatusBadge)}</span>
                    ${course.status === "Inscripcion abierta" ? `<span class="small-chip">${escapeHtml(enrollmentCall.helperLabel)}</span>` : ""}
                    ${course.status === "Inscripcion abierta" ? `<span class="small-chip">${escapeHtml(enrollmentCall.occupancyLabel)}</span>` : ""}
                  </div>
                  ${
                    canEnroll
                      ? `
                        <div class="enrollment-highlight-strip ${enrollmentCall.waitlistMode ? "enrollment-highlight-strip-waiting" : ""}">
                          <span class="eyebrow">${escapeHtml(enrollmentCall.urgencyLabel)}</span>
                          <strong>${escapeHtml(enrollmentCall.ctaLabel)}</strong>
                          <span>${escapeHtml(enrollmentCall.helperLabel)}</span>
                        </div>
                      `
                      : ""
                  }
                  <div class="chip-row enrollment-call-actions">
                    <button class="primary-button enrollment-call-button" data-action="${journey.hasDiploma ? "set-campus-section-mode" : journey.enrolled ? "open-course-workbench-tab" : journey.waiting ? "set-learner-course-details-mode" : canEnroll ? "prepare-course-enrollment" : "set-learner-course-details-mode"}" data-course-id="${course.id}" ${journey.hasDiploma ? 'data-mode="diplomas"' : journey.enrolled ? 'data-mode="learner"' : ""} ${journey.waiting ? 'data-mode="status"' : !journey.enrolled && !canEnroll ? 'data-mode="overview"' : ""}>${enrollmentPrimaryLabel}</button>
                    <button class="ghost-button" data-action="${journey.hasDiploma ? "set-campus-section-mode" : "set-learner-course-details-mode"}" ${journey.hasDiploma ? 'data-mode="diplomas"' : `data-mode="${journey.waiting ? "status" : "overview"}"`}>${journey.hasDiploma ? "Mis diplomas" : journey.waiting ? "Ver mi solicitud" : "Ver programa"}</button>
                  </div>
                  ${
                    canEnroll
                      ? `<p class="field-hint">La solicitud pide confirmacion final. Puedes adjuntar el justificante de la transferencia ahora o aportarlo despues.</p>`
                      : ""
                  }
                  ${
                    canEnroll && !learnerEnrollmentIntent
                      ? `
                        <div class="timeline-item compact-panel enrollment-cta-panel ${enrollmentCall.waitlistMode ? "enrollment-cta-panel-waiting" : ""}" id="courseEnrollmentQuickAction">
                          <span class="eyebrow">Solicitud rapida</span>
                          <strong>Reserva tu plaza en este curso</strong>
                          <p class="muted">Pulsa el boton para abrir la solicitud de inscripcion, revisar plazas libres o lista de espera y adjuntar el justificante de pago por transferencia.</p>
                          <div class="chip-row compact-chip-row">
                            <button class="primary-button enrollment-call-button enrollment-call-button-strong" type="button" data-action="prepare-course-enrollment" data-course-id="${course.id}">${escapeHtml(enrollmentCall.ctaLabel)}</button>
                            <button class="ghost-button" type="button" data-action="set-learner-course-details-mode" data-mode="overview">Ver programa</button>
                          </div>
                        </div>
                      `
                      : ""
                  }
              </div>
              <div class="table-card">
                <table>
                  <tbody>
                    <tr><td>Tu estado</td><td>${journey.hasDiploma ? "Curso completado" : journey.enrolled ? "Inscrito" : journey.waiting ? "En espera" : "No inscrito"}</td></tr>
                    <tr><td>Acceso</td><td>${escapeHtml(enrollmentCall.audienceLabel)}</td></tr>
                    <tr><td>Plazas</td><td>${course.status === "Inscripcion abierta" ? `${escapeHtml(enrollmentCall.statusLabel)} · ${getCourseEnrolledCount(course)}/${course.capacity}` : `${getCourseEnrolledCount(course)}/${course.capacity}`}</td></tr>
                    <tr><td>Importe</td><td>${course.enrollmentFee > 0 ? `${course.enrollmentFee} €` : "Sin coste"}</td></tr>
                    <tr><td>Siguiente paso</td><td>${escapeHtml(enrollmentNextStep)}</td></tr>
                    <tr><td>DNI/NIE</td><td>${journey.hasDocumentId ? "Disponible en ficha" : "Pendiente en tu ficha de socio"}</td></tr>
                    ${enrollmentSubmission ? `<tr><td>Solicitud enviada</td><td>${escapeHtml(getEnrollmentSubmissionStatusLabel(enrollmentSubmission.status))}</td></tr>` : ""}
                  </tbody>
                </table>
              </div>
            </div>
            ${
              canEnroll && learnerEnrollmentIntent
                ? `
                  <div class="mail-card compact-panel" id="courseEnrollmentRequestForm">
                    <div class="module-head">
                      <div>
                        <p class="eyebrow">Solicitud de inscripcion</p>
                        <h4>Confirma tu plaza y adjunta el justificante</h4>
                        <p class="muted">Este paso funciona como una inscripcion clara: revisas el importe, compruebas si quedan plazas o entras en espera, subes el justificante y confirmas la solicitud.</p>
                      </div>
                      <div class="chip-row compact-chip-row">
                        <span class="small-chip">${course.enrollmentFee > 0 ? `${course.enrollmentFee} €` : "Sin coste"}</span>
                        <span class="small-chip">${escapeHtml(course.status)}</span>
                        <span class="small-chip">${escapeHtml(enrollmentCall.statusLabel)}</span>
                      </div>
                    </div>
                    ${
                      course.enrollmentPaymentInstructions
                        ? `<div class="timeline-item compact-panel"><span class="eyebrow">Pago por transferencia</span><strong>Indicaciones de pago</strong><p class="muted">${escapeHtml(course.enrollmentPaymentInstructions)}</p></div>`
                        : ""
                    }
                    <div class="timeline-item compact-panel">
                      <span class="eyebrow">Quien puede inscribirse</span>
                      <strong>${escapeHtml(enrollmentCall.audienceLabel)}</strong>
                      <p class="muted">${escapeHtml(enrollmentCall.audienceHint)}</p>
                    </div>
                    <form id="courseEnrollmentForm" class="studio-grid">
                      <label class="inline-field">
                        Importe
                        <input id="courseEnrollmentAmount" type="number" min="0" step="0.01" value="${course.enrollmentFee || 0}" />
                      </label>
                      <label class="inline-field">
                        Metodo
                        <select id="courseEnrollmentMethod">
                          ${["Transferencia", "Bizum", "Efectivo", "Otro"].map((method) => `<option value="${method}">${method}</option>`).join("")}
                        </select>
                      </label>
                      <label class="inline-field studio-full">
                        Nota para administracion
                        <textarea id="courseEnrollmentNote" placeholder="Opcional. Ejemplo: transferencia realizada hoy a primera hora o pendiente de adjuntar justificante."></textarea>
                      </label>
                      <label class="inline-field studio-full">
                        Justificante de pago
                        <input id="courseEnrollmentProof" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" />
                        <span class="field-hint">Puedes adjuntarlo ahora o registrar la solicitud y aportarlo despues si todavia no has completado la transferencia.</span>
                      </label>
                      <div class="timeline-item studio-full">
                        <span class="eyebrow">Confirmacion</span>
                        <strong>${enrollmentCall.waitlistMode ? "Entraras en lista de espera" : "Se registrara tu solicitud"}</strong>
                        <p class="muted">Al pulsar confirmar, tu solicitud quedara registrada en el curso y el equipo podra revisar el justificante si lo has adjuntado. ${enrollmentCall.waitlistMode ? "Ahora mismo no quedan plazas libres y pasaras a lista de espera hasta que se libere una." : "Si el curso se completa despues, el sistema seguira gestionando las plazas y la espera automaticamente."}</p>
                      </div>
                      <div class="chip-row studio-full">
                        <button class="primary-button enrollment-call-button" type="submit">${enrollmentCall.waitlistMode ? "Confirmar lista de espera" : "Confirmar inscripcion"}</button>
                        <button class="ghost-button" type="button" data-action="set-learner-course-details-mode" data-mode="overview">Cancelar</button>
                      </div>
                    </form>
                  </div>
                `
                : ""
            }
            ${
              !canEnroll && isPreviewMode && !journey.enrolled && !journey.waiting && course.status === "Inscripcion abierta"
                ? `
                  <div class="mail-card compact-panel">
                    <h4>Vista previa de inscripcion</h4>
                    <p class="muted">Estas viendo el curso desde la previsualizacion de alumno de administracion. Por eso no puedes inscribirte de verdad desde esta pantalla.</p>
                  </div>
                `
                : ""
            }
              ${
                enrollmentSubmission
                  ? `
                    <div class="mail-card compact-panel" id="courseEnrollmentSubmissionState">
                      <h4>Tu solicitud registrada</h4>
                      <div class="validation-chip-list">
                        <span class="validation-chip ${getEnrollmentSubmissionTone(enrollmentSubmission.status)}">${escapeHtml(getEnrollmentSubmissionStatusLabel(enrollmentSubmission.status || "pending"))}</span>
                        <span class="validation-chip neutral">${escapeHtml(enrollmentSubmission.method || "Transferencia")}</span>
                        <span class="validation-chip neutral">${Number(enrollmentSubmission.amount || 0)} €</span>
                      </div>
                      <p class="muted"><strong>Estado:</strong> ${escapeHtml(getEnrollmentSubmissionStatusLabel(enrollmentSubmission.status || "pending"))}</p>
                      <p class="muted"><strong>Metodo:</strong> ${escapeHtml(enrollmentSubmission.method || "Transferencia")} | <strong>Importe:</strong> ${Number(enrollmentSubmission.amount || 0)} €</p>
                      ${enrollmentSubmission.note ? `<p class="muted"><strong>Nota:</strong> ${escapeHtml(enrollmentSubmission.note)}</p>` : ""}
                      ${enrollmentSubmission.paymentProof ? `<p class="muted">Justificante adjunto: ${escapeHtml(enrollmentSubmission.paymentProof.name || "archivo")}</p>` : ""}
                      ${renderStoredProofLink(enrollmentSubmission.paymentProof, "Abrir justificante")}
                      ${
                        !enrollmentSubmission.paymentProof || enrollmentSubmission.status === "pending-proof"
                          ? `
                            <form id="courseEnrollmentProofUpdateForm" class="stack enrollment-proof-update-form">
                              <div class="timeline-item compact-panel">
                                <span class="eyebrow">Justificante pendiente</span>
                                <strong>Adjunta ahora la transferencia</strong>
                                <p class="muted">Si ya has realizado el pago, puedes aportar el comprobante desde aqui para que administracion revise tu inscripcion.</p>
                              </div>
                              <label class="inline-field">
                                Justificante de pago
                                <input id="courseEnrollmentProofUpdate" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" />
                              </label>
                              <label class="inline-field">
                                Nota
                                <input id="courseEnrollmentProofUpdateNote" value="${escapeHtml(enrollmentSubmission.note || "")}" placeholder="Opcional. Ejemplo: transferencia realizada hoy por la tarde." />
                              </label>
                              <div class="chip-row">
                                <button class="primary-button" type="submit">Enviar justificante</button>
                              </div>
                            </form>
                          `
                          : ""
                      }
                    </div>
                  `
                  : ""
              }
          `
          : ""
      }

      </div>
    `;
  }

function renderMemberCourseWorkspace(course, options = {}) {
  const memberId = options.memberId || state.selectedMemberId;
  const previewOnly = options.previewOnly ?? isMemberPreviewSession();
  const focusMode = Boolean(options.focusMode);
  const journey = getLearnerCourseJourney(course, memberId);
  const targetMember = findMember(memberId);
  const isPracticalCourse = normalizeCourseClass(course.courseClass) === "practico";
  const learnerModes = [{ key: isPracticalCourse ? "resources" : "roadmap", label: "Curso" }];
  if (course.feedbackEnabled) {
    learnerModes.push({ key: "feedback", label: "Valoracion" });
  }
  const activeLearnerMode = learnerModes.some((item) => item.key === learnerCourseWorkspaceMode)
    ? learnerCourseWorkspaceMode
    : isPracticalCourse
      ? "resources"
      : "roadmap";
  const learnerHeroText = journey.hasDiploma
    ? "Curso cerrado. Tu documento final se descarga desde Mis diplomas."
    : isPracticalCourse
      ? "Consulta la documentacion visible del practico y completa solo lo necesario para cerrarlo."
      : course.summary || "Curso listo para empezar.";
  const learnerEyebrow = previewOnly ? "Vista previa del alumno" : "Mi aula";
  const showSectionTabs = learnerModes.length > 1;

  return `
      <div class="panel-stack learner-aula-shell">
        <div class="content-module learner-course-hero">
          <div class="module-head">
            <div>
              <p class="eyebrow">${learnerEyebrow}</p>
              <h4>${escapeHtml(course.title)}</h4>
              <p class="muted">${escapeHtml(learnerHeroText)}</p>
            </div>
            <div class="chip-row">
              <span class="small-chip">${escapeHtml(describeCourseType(course))}</span>
              <span class="small-chip">${formatDate(course.startDate)} - ${formatDate(course.endDate)}</span>
              ${targetMember ? `<span class="small-chip">${escapeHtml(targetMember.name)}</span>` : ""}
            </div>
        </div>
        ${renderLearnerProgressGuard(course, memberId, { previewOnly })}
      </div>

      ${
        showSectionTabs
          ? `
            <div class="chip-row learner-section-tabs">
              ${learnerModes
                .map(
                  (mode) => `
                    <button class="${activeLearnerMode === mode.key ? "primary-button" : "ghost-button"}" type="button" data-action="set-learner-course-workspace-mode" data-mode="${mode.key}">
                      ${mode.label}
                    </button>
                  `
                )
                .join("")}
            </div>
          `
          : ""
      }

      <div class="learner-course-layout learner-course-layout-focus ${focusMode ? "learner-course-layout-study" : ""}">
        <div class="panel-stack">
          ${
            activeLearnerMode === "roadmap"
              ? `
                <div class="content-module" id="learnerCourseModeRoadmap">
                  <div class="module-head">
                    <div>
                      <p class="eyebrow">Recorrido guiado</p>
                      <h4>Solo lo que te toca ahora</h4>
                      <p class="muted">No necesitas ir saltando. Cierra el bloque actual y el curso te abrira automaticamente el siguiente paso.</p>
                    </div>
                  </div>
                  ${renderCourseRoadmap(course, {
                    memberId,
                    role: "member",
                    interactive: !previewOnly,
                    previewOnly
                  })}
                </div>
              `
              : ""
          }

          ${
            activeLearnerMode === "resources"
              ? `
                <div class="content-module" id="learnerCourseModeResources">
                  <div class="module-head">
                    <div>
                      <p class="eyebrow">${isPracticalCourse ? "Curso practico" : "Biblioteca del curso"}</p>
                      <h4>${isPracticalCourse ? "Documentacion y material del practico" : "Recursos y materiales"}</h4>
                      <p class="muted">${isPracticalCourse ? "Aqui solo veras la documentacion que debes revisar, descargar o consultar online antes y despues de la practica." : "Documentos, vídeos, enlaces y descargas útiles para seguir el curso."}</p>
                    </div>
                  </div>
                  ${renderCourseResources(course, "member")}
                  ${
                    isPracticalCourse
                      ? `
                        <div class="timeline-item" style="margin-top: 16px;">
                          <span class="eyebrow">Cierre del practico</span>
                          <p class="muted">La asistencia y la evaluacion las registra el instructor. Si el curso exige valoracion final, la veras aqui cuando corresponda.</p>
                        </div>
                      `
                      : ""
                  }
                </div>
              `
              : ""
          }

          ${
            activeLearnerMode === "feedback"
              ? (
                  course.feedbackEnabled
                    ? `<div id="learnerCourseModeFeedback">${renderCourseFeedbackForm(course, memberId, { previewOnly })}</div>`
                    : `
                      <div class="content-module" id="learnerCourseModeFeedback">
                        <div class="empty-state">La valoracion final de este curso todavia no esta activa.</div>
                      </div>
                    `
                )
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

function renderLearnerProgressGuard(course, memberId, options = {}) {
  const previewOnly = Boolean(options.previewOnly);
  const journey = getLearnerCourseJourney(course, memberId);
  const isPracticalCourse = normalizeCourseClass(course.courseClass) === "practico";
  const nextLabel = journey.nextStep?.block?.title || journey.nextStep?.lessonTitle || "";
  const warningText = journey.pendingSteps[0] || "";
  let primaryActionHtml = "";

  if (journey.hasDiploma) {
    primaryActionHtml = `<button class="primary-button" data-action="set-campus-section-mode" data-mode="diplomas">Ir a Mis diplomas</button>`;
  } else if (!journey.enrolled && !journey.waiting) {
    primaryActionHtml = `<button class="primary-button" data-action="select-course" data-course-id="${course.id}">Ver inscripción</button>`;
  } else if (journey.waiting) {
    primaryActionHtml = `<button class="ghost-button" data-action="select-course" data-course-id="${course.id}">Ver mi solicitud</button>`;
  } else if (course.feedbackEnabled && course.feedbackRequiredForDiploma && !journey.feedbackSubmitted) {
    primaryActionHtml = `<button class="primary-button" data-action="set-learner-course-workspace-mode" data-mode="feedback">Ir a valoración</button>`;
  } else if (isPracticalCourse) {
    primaryActionHtml = `<button class="primary-button" data-action="set-learner-course-workspace-mode" data-mode="resources">Abrir documentación</button>`;
  } else {
    primaryActionHtml = `<button class="primary-button" data-action="set-learner-course-workspace-mode" data-mode="roadmap">Continuar curso</button>`;
  }

  return `
    <div class="status-note ${journey.hasDiploma ? "success" : journey.pendingSteps.length ? "warning" : ""} learner-progress-guard">
      <div>
        <strong>${
          journey.hasDiploma
            ? "Curso cerrado"
            : journey.waiting
              ? "Tu plaza sigue en espera"
              : !journey.enrolled
                ? "Primero debes inscribirte"
                : nextLabel
                  ? `Ahora toca: ${escapeHtml(nextLabel)}`
                  : "Curso al dia"
        }</strong>
        <p class="muted">${
          journey.hasDiploma
            ? "Ya puedes descargar tu diploma desde Mis diplomas."
            : warningText
              ? `No podras avanzar hasta completar esto: ${escapeHtml(warningText)}.`
              : "No hay bloqueos activos. Sigue con el curso."
        }</p>
      </div>
      <div class="chip-row">
        <span class="small-chip">Contenido ${journey.progress.blocksCompleted}/${journey.progress.blocksTotal}</span>
        <span class="small-chip">Asistencia ${journey.attendance}%</span>
        <span class="small-chip">Evaluacion ${escapeHtml(journey.evaluation)}</span>
        ${previewOnly ? `<span class="small-chip">Vista previa</span>` : ""}
      </div>
      ${previewOnly ? "" : `<div class="chip-row learner-progress-guard-actions">${primaryActionHtml}</div>`}
    </div>
  `;
}

function renderMemberDiplomaSidebar(member) {
  if (!member) {
    return `<div class="empty-state">Sin persona activa.</div>`;
  }

  const memberCourses = state.courses.filter(
    (course) =>
      course.enrolledIds.includes(member.id) ||
      course.waitingIds.includes(member.id) ||
      course.diplomaReady.includes(member.id)
  );
  const readyCount = memberCourses.filter((course) => course.diplomaReady.includes(member.id)).length;
  const pendingCount = memberCourses.filter((course) => !course.diplomaReady.includes(member.id)).length;

  return `
    <div class="mail-card">
      <h4>Tu salida acreditativa</h4>
      <p class="muted">Consulta tus diplomas disponibles y revisa lo que te falta por curso sin depender de un curso activo.</p>
      <div class="timeline-item"><p>Cursos vinculados</p><strong>${memberCourses.length}</strong></div>
      <div class="timeline-item"><p>Diplomas disponibles</p><strong>${readyCount}</strong></div>
      <div class="timeline-item"><p>Pendientes</p><strong>${pendingCount}</strong></div>
      <div class="chip-row">
        <button class="ghost-button section-jump-button" data-action="nav-section" data-view="campus" data-section-id="diplomaSectionDocuments">Ir a documentos</button>
        <button class="ghost-button" data-action="set-campus-section-mode" data-mode="courses">Volver a cursos</button>
      </div>
    </div>
  `;
}

function renderMemberHistory(history) {
  return history.length
    ? history
        .map(
          (item) => `
            <div class="timeline-item">
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.statusLabel)}</p>
              <p class="muted">${escapeHtml(item.meta)}</p>
            </div>
          `
        )
        .join("")
    : `<p class="muted">Esta persona todavia no tiene historial formativo registrado.</p>`;
}

function renderOperationsSummary(course) {
  if (!course) {
    return `<div class="empty-state">Sin curso seleccionado.</div>`;
  }

  if (!isAdminView()) {
    const member = getCurrentMember();
    const journey = getLearnerCourseJourney(course, member?.id);
    return `
      <div class="panel-stack">
        <div>
          <p class="eyebrow">Tu progreso</p>
          <h3>Seguimiento del curso</h3>
        </div>
        ${renderLearnerJourneyCard(course, member?.id, { compact: true })}
        <div class="timeline-item"><p>Asistencia</p><strong>${journey.attendance}%</strong></div>
        <div class="timeline-item"><p>Evaluacion</p><strong>${escapeHtml(journey.evaluation)}</strong></div>
        <div class="timeline-item"><p>Contenido</p><strong>${journey.progress.blockProgress}%</strong><p class="muted">${journey.progress.blocksCompleted}/${journey.progress.blocksTotal} bloque(s) completados</p></div>
        <div class="timeline-item"><p>Diploma</p><strong>${journey.hasDiploma ? "Disponible" : "Pendiente"}</strong></div>
      </div>
    `;
  }

  const completion = getCourseCompletion(course);
  const readiness = getCourseContentReadiness(course);
  return `
    <div class="panel-stack">
      <div>
        <p class="eyebrow">Control del curso</p>
        <h3>Cierre administrativo</h3>
      </div>
      <div class="chip-row">
        <button class="primary-button" data-action="nav-section" data-view="operations" data-section-id="operationsSectionAttendance">Pasar lista</button>
        <button class="ghost-button" data-action="open-course-workbench-tab" data-course-id="${course.id}" data-mode="ficha">Abrir curso</button>
        <button class="ghost-button" data-action="nav" data-view="diplomas" data-course-id="${course.id}">Ir a diplomas</button>
      </div>
      <div class="timeline-item"><p>Asistencia media</p><strong>${completion.attendanceAverage}%</strong></div>
      <div class="timeline-item"><p>Evaluaciones cerradas</p><strong>${completion.closedEvaluations}/${course.enrolledIds.length}</strong></div>
      <div class="timeline-item"><p>Listos para diploma</p><strong>${course.diplomaReady.length}</strong></div>
      <div class="timeline-item"><p>Contenido listo</p><strong>${readiness.publishedLessons}/${readiness.totalLessons} leccion(es)</strong><p class="muted">Progreso medio alumnado ${getAverageCourseContentProgress(course)}%</p></div>
      <div class="timeline-item">
        <p>Accion siguiente</p>
        <strong>${
          completion.closedEvaluations < course.enrolledIds.length
            ? "Cerrar evaluaciones"
            : completion.attendanceAverage < 75
              ? "Revisar asistencias"
              : "Emitir diplomas"
        }</strong>
      </div>
    </div>
  `;
}

function renderDiplomaPreview(course) {
  if (!course) {
    return `<div class="empty-state">Sin curso seleccionado.</div>`;
  }

  const selectedPreviewMember =
    state.selectedMemberId && course.enrolledIds.includes(state.selectedMemberId)
      ? findMember(state.selectedMemberId)
      : null;
  const previewMember = isAdminView()
    ? selectedPreviewMember || findMember(course.diplomaReady[0] || course.enrolledIds[0])
    : findMember(state.selectedMemberId);

  if (!previewMember) {
    return `<div class="empty-state">Aun no hay alumno seleccionado para previsualizar.</div>`;
  }

  const sections = getCertificateSections(course);
  const city = course.certificateCity || state.settings.certificateCity || "Madrid";
  const documentId = getMemberDocumentId(previewMember);
  const issueDate = formatDate(course.endDate || new Date().toISOString());
  const feedbackSent = Boolean(getCourseFeedbackResponse(course, previewMember.id));
  const readyForDiploma = isMemberReadyForDiploma(course, previewMember.id);
  const diplomaAlreadyGenerated = course.diplomaReady.includes(previewMember.id);
  const diplomaChecklist = [
    { label: "Asistencia minima", ok: Number(course.attendance[previewMember.id] || 0) >= 75, detail: `${Number(course.attendance[previewMember.id] || 0)}%` },
    { label: "Evaluacion", ok: String(course.evaluations[previewMember.id] || "").trim() === "Apto", detail: String(course.evaluations[previewMember.id] || "Pendiente") },
    { label: "Contenido obligatorio", ok: isMemberContentReadyForDiploma(course, previewMember.id), detail: getLearnerCourseContentStats(course, previewMember.id).blockProgress + "%" },
    { label: "Valoracion final", ok: !course.feedbackRequiredForDiploma || feedbackSent, detail: course.feedbackRequiredForDiploma ? (feedbackSent ? "Enviada" : "Pendiente") : "No bloquea diploma" },
    { label: "DNI/NIE", ok: hasMemberDocumentId(previewMember), detail: documentId }
  ];
  const missingChecklist = diplomaChecklist.filter((item) => !item.ok);

  return `
    <div class="panel-stack" id="diplomaPreviewPanel">
      <div>
        <p class="eyebrow">Vista previa</p>
        <h3>Plantilla real del certificado</h3>
        <p class="muted">Alumno actual: <strong>${escapeHtml(previewMember.name)}</strong></p>
      </div>
      ${
        isAdminView()
          ? `
            <div class="chip-row">
              <button class="primary-button" data-action="nav-section" data-view="diplomas" data-section-id="diplomaSectionDocuments">Ir a documentos</button>
              ${readyForDiploma && !diplomaAlreadyGenerated ? `<button class="ghost-button" data-action="generate-member-diploma" data-course-id="${course.id}" data-member-id="${previewMember.id}">Emitir este diploma</button>` : ""}
              <button class="ghost-button" data-action="open-course-workbench-tab" data-course-id="${course.id}" data-mode="certificate">Editar certificado</button>
              <button class="ghost-button" data-action="generate-diplomas" data-course-id="${course.id}">Actualizar lista</button>
            </div>
          `
          : ""
      }
      <div class="metrics-grid metrics-grid-inline metrics-grid-summary">
        ${diplomaChecklist
          .map(
            (item) => `
              <article class="metric-card compact-card ${item.ok ? "" : "metric-card-warning"}">
                <p class="eyebrow">${escapeHtml(item.label)}</p>
                <strong>${item.ok ? "OK" : "Pendiente"}</strong>
                <span class="muted">${escapeHtml(item.detail)}</span>
              </article>
            `
          )
          .join("")}
      </div>
      <div class="status-note ${readyForDiploma ? "success" : "warning"}">
        ${
          diplomaAlreadyGenerated
            ? `El diploma de ${escapeHtml(previewMember.name)} ya esta generado y disponible para descarga.`
            : readyForDiploma
              ? `Este alumno ya cumple todos los requisitos. Ya puedes emitir su diploma.`
              : `Aun no puedes emitir el diploma de ${escapeHtml(previewMember.name)}. Falta: ${escapeHtml(missingChecklist.map((item) => item.label).join(", "))}.`
        }
      </div>

      <div class="diploma-card">
        <div class="diploma-preview certificate-preview">
          <div class="certificate-preview-artwork" aria-hidden="true"></div>
          <div class="certificate-preview-grid">
            <section class="certificate-preview-main">
              <div class="certificate-preview-head">
                <p class="eyebrow">${escapeHtml(state.settings.organization)}</p>
                <h3>${escapeHtml(buildCertificateTitle(course))}</h3>
              </div>
              <div class="certificate-preview-copy">
                <p>La Asociacion <strong>Isocrona Zero</strong> certifica que</p>
                <div class="certificate-preview-name">${escapeHtml(previewMember.name)}</div>
                <p>con DNI/NIE <strong>${escapeHtml(documentId)}</strong></p>
                <p>ha realizado y superado con <strong>aprovechamiento</strong> el curso</p>
                <div class="certificate-preview-course">${escapeHtml(course.title)}</div>
                <p>con una duracion de <strong>${course.hours} horas lectivas</strong>, celebrado entre los dias <strong>${escapeHtml(formatDateRange(course.startDate, course.endDate))}</strong>.</p>
                <p>En <strong>${escapeHtml(city)}</strong>, a <strong>${escapeHtml(issueDate)}</strong>.</p>
              </div>
              <div class="certificate-preview-number">Certificado n.o ${escapeHtml(buildRegistryNumber(course, previewMember))}</div>
              <div class="signature-row">
                <div class="signature-box">
                  <strong>Presidente</strong>
                </div>
              </div>
            </section>
            <aside class="certificate-preview-side">
              <p class="eyebrow">&nbsp;</p>
              <h4>Contenidos formativos</h4>
              ${sections
                .map(
                  (section) => `
                    <div class="certificate-section-preview">
                      <strong>${escapeHtml(section.title)}</strong>
                      <ul>
                        ${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
                      </ul>
                    </div>
                  `
                )
                .join("")}
            </aside>
          </div>
        </div>
      </div>
      <a class="button-link" target="_blank" rel="noreferrer" href="/api/diplomas/${course.id}/${previewMember.id}">
        Abrir en ventana de impresion
      </a>
      ${
        isAdminView()
          ? `
            <div class="chip-row">
              <button class="ghost-button" data-action="open-course-workbench-tab" data-course-id="${course.id}" data-mode="certificate">Abrir bloque certificado</button>
              <button class="ghost-button" data-action="nav" data-view="diplomas" data-course-id="${course.id}">Ir a documentos</button>
            </div>
          `
          : ""
      }
      <a class="button-link" href="/api/verify/pdf?code=${encodeURIComponent(buildDiplomaCode(course, previewMember))}">
        Descargar PDF formal
      </a>
      <a class="button-link" href="/api/diplomas/${course.id}/${previewMember.id}.docx">
        Descargar Word desde plantilla
      </a>
      <a class="button-link" target="_blank" rel="noreferrer" href="/verify.html?code=${encodeURIComponent(buildDiplomaCode(course, previewMember))}">
        Validar este diploma
      </a>
    </div>
  `;
}

function renderSettings() {
  if (!isAdminView()) {
    return `<div class="empty-state">Esta configuracion solo esta disponible para administracion.</div>`;
  }

  return `
    <div class="panel-stack">
      <div>
        <p class="eyebrow">Configuracion editable</p>
        <h3>Plantilla de certificados y automatizacion</h3>
      </div>

      <form id="settingsForm" class="stack">
        <label class="inline-field">
          Ciudad por defecto del certificado
          <input id="settingCertificateCity" value="${escapeHtml(state.settings.certificateCity || "Madrid")}" />
        </label>
        <label class="inline-field">
          Firma 1
          <input id="settingSignerA" value="${escapeHtml(state.settings.diplomaSignerA)}" />
        </label>
        <label class="inline-field">
          Firma 2
          <input id="settingSignerB" value="${escapeHtml(state.settings.diplomaSignerB)}" />
        </label>
        <label class="inline-field">
          Plantilla de correo
          <textarea id="settingTemplate">${escapeHtml(state.settings.emailTemplate)}</textarea>
        </label>
        <label class="inline-field">
          Instruccion del asistente
          <textarea id="settingAutomation">${escapeHtml(state.settings.automationTone)}</textarea>
        </label>
        <div class="mail-card">
          <h4>Reglas automaticas</h4>
          <div class="chip-row">
            <label class="inline-field"><span>Generar diplomas</span><input id="settingAutoDiplomas" type="checkbox" ${state.settings.automation.autoGenerateDiplomas ? "checked" : ""} /></label>
            <label class="inline-field"><span>Promover espera</span><input id="settingAutoWaitlist" type="checkbox" ${state.settings.automation.autoPromoteWaitlist ? "checked" : ""} /></label>
            <label class="inline-field"><span>Mover estados</span><input id="settingAutoAdvanceCourseStatus" type="checkbox" ${state.settings.automation.autoAdvanceCourseStatus ? "checked" : ""} /></label>
            <label class="inline-field"><span>Enviar diplomas</span><input id="settingAutoSendDiplomas" type="checkbox" ${state.settings.automation.autoSendDiplomas ? "checked" : ""} /></label>
            <label class="inline-field"><span>Detectar renovaciones</span><input id="settingAutoRenewals" type="checkbox" ${state.settings.automation.autoDetectRenewals ? "checked" : ""} /></label>
            <label class="inline-field"><span>Detectar fallos mail</span><input id="settingAutoFailedEmails" type="checkbox" ${state.settings.automation.autoDetectFailedEmails ? "checked" : ""} /></label>
            <label class="inline-field"><span>Ejecutar al guardar</span><input id="settingAutoRunOnSave" type="checkbox" ${state.settings.automation.autoRunOnSave ? "checked" : ""} /></label>
          </div>
        </div>
        <div class="mail-card">
          <h4>Politica del agente</h4>
          <div class="chip-row">
            <label class="inline-field"><span>Agente activo</span><input id="settingAgentEnabled" type="checkbox" ${state.settings.agent.enabled ? "checked" : ""} /></label>
            <label class="inline-field"><span>Resolver bandeja</span><input id="settingAgentResolveInbox" type="checkbox" ${state.settings.agent.canResolveInbox ? "checked" : ""} /></label>
            <label class="inline-field"><span>Enviar diplomas</span><input id="settingAgentSendDiplomas" type="checkbox" ${state.settings.agent.canSendDiplomas ? "checked" : ""} /></label>
            <label class="inline-field"><span>Cerrar cursos</span><input id="settingAgentCloseCourses" type="checkbox" ${state.settings.agent.canCloseCourses ? "checked" : ""} /></label>
          </div>
          <label class="inline-field">
            Notas de control
            <textarea id="settingAgentNotes">${escapeHtml(state.settings.agent.notes)}</textarea>
          </label>
          <div class="chip-row">
            <a class="button-link" target="_blank" rel="noreferrer" href="/api/agent/context">Ver contexto del agente</a>
          </div>
        </div>
        <div class="mail-card">
          <h4>Configuracion de socios</h4>
          <div class="chip-row">
            <label class="inline-field"><span>Crear acceso campus al aprobar</span><input id="settingAssociateAutoCampus" type="checkbox" ${state.settings.associates.autoCreateCampusAccess ? "checked" : ""} /></label>
            <label class="inline-field"><span>Enviar bienvenida automatica</span><input id="settingAssociateWelcomeEmail" type="checkbox" ${state.settings.associates.autoSendWelcomeEmail ? "checked" : ""} /></label>
            <label class="inline-field"><span>Enviar acuse de solicitud</span><input id="settingAssociateApplicationReceipt" type="checkbox" ${state.settings.associates.autoSendApplicationReceipt ? "checked" : ""} /></label>
            <label class="inline-field"><span>Enviar peticion de subsanacion</span><input id="settingAssociateApplicationInfoRequest" type="checkbox" ${state.settings.associates.autoSendApplicationInfoRequest ? "checked" : ""} /></label>
            <label class="inline-field"><span>Enviar resolucion de solicitud</span><input id="settingAssociateApplicationDecision" type="checkbox" ${state.settings.associates.autoSendApplicationDecision ? "checked" : ""} /></label>
            <label class="inline-field"><span>Avisar admin al responder</span><input id="settingAssociateApplicantReplyNotification" type="checkbox" ${state.settings.associates.autoSendApplicantReplyNotification ? "checked" : ""} /></label>
            <label class="inline-field"><span>Acusar respuesta del solicitante</span><input id="settingAssociateApplicantReplyReceipt" type="checkbox" ${state.settings.associates.autoSendApplicantReplyReceipt ? "checked" : ""} /></label>
          </div>
          <label class="inline-field">
            Rol interno al crear acceso
            <input id="settingAssociateDefaultRole" value="${escapeHtml(state.settings.associates.defaultMemberRole)}" />
          </label>
          <label class="inline-field">
            Cuota anual por defecto
            <input id="settingAssociateAnnual" type="number" min="0" value="${state.settings.associates.defaultAnnualAmount}" />
          </label>
          <label class="inline-field">
            Siguiente numero de socio
            <input id="settingAssociateNextNumber" type="number" min="1" value="${state.settings.associates.nextAssociateNumber}" />
          </label>
          <label class="inline-field">
            Aviso del formulario
            <textarea id="settingAssociateNotice">${escapeHtml(state.settings.associates.applicationFormNotice)}</textarea>
          </label>
        </div>
        <div class="table-card">
          <table>
            <tbody>
              <tr>
                <td><input id="settingSmtpHost" placeholder="SMTP host" value="${escapeHtml(state.settings.smtp.host)}" /></td>
                <td><input id="settingSmtpPort" type="number" min="1" placeholder="Puerto" value="${state.settings.smtp.port || ""}" /></td>
              </tr>
              <tr>
                <td><input id="settingSmtpUser" placeholder="Usuario SMTP" value="${escapeHtml(state.settings.smtp.username)}" /></td>
                <td><input id="settingSmtpPassword" type="password" placeholder="Contrasena SMTP" value="${escapeHtml(state.settings.smtp.password)}" /></td>
              </tr>
              <tr>
                <td><input id="settingSmtpFromEmail" type="email" placeholder="Remitente" value="${escapeHtml(state.settings.smtp.fromEmail)}" /></td>
                <td><input id="settingSmtpFromName" placeholder="Nombre remitente" value="${escapeHtml(state.settings.smtp.fromName)}" /></td>
              </tr>
              <tr>
                <td><input id="settingSmtpTestTo" type="email" placeholder="Correo de prueba" value="${escapeHtml(state.settings.smtp.testTo)}" /></td>
                <td>
                  <div class="chip-row">
                    <label class="inline-field"><span>SSL directo</span><input id="settingSmtpSecure" type="checkbox" ${state.settings.smtp.secure ? "checked" : ""} /></label>
                    <label class="inline-field"><span>STARTTLS</span><input id="settingSmtpStartTls" type="checkbox" ${state.settings.smtp.startTls ? "checked" : ""} /></label>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="chip-row">
          <button class="primary-button" type="submit">Guardar cambios</button>
          <button class="ghost-button" type="button" data-action="fill-demo-settings">Cargar ejemplo</button>
          <button class="ghost-button" type="button" data-action="smtp-test">Probar SMTP</button>
        </div>
      </form>
    </div>
  `;
}

function enrollCurrentMember(courseId) {
  const course = state.courses.find((item) => item.id === courseId);
  const member = findMember(state.selectedMemberId) || state.members[0];
  if (!course || !member || course.enrolledIds.includes(member.id) || course.waitingIds.includes(member.id)) {
    return;
  }

  if (course.enrolledIds.length < course.capacity) {
    course.enrolledIds.push(member.id);
  } else {
    course.waitingIds.push(member.id);
  }

  state.selectedCourseId = courseId;
}

function renderCourseCard(course, role) {
  const template = document.getElementById("courseCardTemplate");
  const fragment = template.content.cloneNode(true);
  const currentMemberId = state.selectedMemberId;
  const isEnrolled = currentMemberId && course.enrolledIds.includes(currentMemberId);
  const isWaiting = currentMemberId && course.waitingIds.includes(currentMemberId);

  fragment.querySelector('[data-slot="type"]').textContent = describeCourseType(course);
  fragment.querySelector('[data-slot="status"]').textContent = course.status;
  fragment.querySelector('[data-slot="title"]').textContent = course.title;
  fragment.querySelector('[data-slot="summary"]').textContent = [
    course.summary,
    getCourseTemplateLabel(course.contentTemplate || inferCourseTemplate(course)),
    `${(course.modules || []).length} modulo(s)`,
    `${getPublishedLessonCount(course)} leccion(es) publicadas`,
    `${getVisibleCourseResources(course, role).length} recurso(s)`
  ]
    .filter(Boolean)
    .join(" | ");
  fragment.querySelector('[data-slot="dates"]').textContent = `${formatDate(course.startDate)} - ${formatDate(course.endDate)}`;
  fragment.querySelector('[data-slot="hours"]').textContent = `${course.hours} h`;
  fragment.querySelector('[data-slot="capacity"]').textContent = `${getCourseEnrolledCount(course)}/${course.capacity}`;
  fragment.querySelector('[data-slot="diploma"]').textContent = course.diplomaTemplate;

  const actions = fragment.querySelector('[data-slot="actions"]');
  const enrollmentCall = role === "member" ? getCourseEnrollmentCall(course) : null;
  const openLabel =
    role === "member"
      ? isEnrolled
        ? "Entrar al aula"
        : isWaiting
          ? "Ver inscripcion"
          : "Ver resumen"
      : "Gestionar";
  actions.innerHTML = `
    <button class="mini-button" data-action="${role === "member" && isEnrolled ? "open-course-workbench-tab" : "select-course"}" data-course-id="${course.id}" ${role === "member" && isEnrolled ? 'data-mode="learner"' : ""}>${openLabel}</button>
    ${
      role === "member"
        ? isMemberPreviewSession()
          ? `<span class="small-chip">${isEnrolled ? "Ya inscrito" : isWaiting ? "En espera" : "Vista previa"}</span>`
          : isEnrolled
            ? `<span class="small-chip">Inscrito</span>`
            : isWaiting
              ? `<span class="small-chip">En espera</span>`
              : `
                <span class="small-chip">${escapeHtml(enrollmentCall.statusLabel)}</span>
                <span class="small-chip">${escapeHtml(enrollmentCall.audienceLabel)}</span>
                <button class="primary-button" data-action="prepare-course-enrollment" data-course-id="${course.id}">${escapeHtml(enrollmentCall.ctaLabel)}</button>
              `
        : `
          <button class="ghost-button" data-action="nav" data-view="operations" data-course-id="${course.id}">Operativa</button>
          <button class="ghost-button" data-action="nav" data-view="diplomas" data-course-id="${course.id}">Diplomas</button>
        `
    }
  `;

  const wrapper = document.createElement("div");
  wrapper.appendChild(fragment);
  return wrapper.innerHTML;
}

function moveWaitingToEnrolled(courseId, memberId) {
  const course = state.courses.find((item) => item.id === courseId);
  if (!course || course.enrolledIds.length >= course.capacity) {
    return;
  }
  course.waitingIds = course.waitingIds.filter((id) => id !== memberId);
  if (!course.enrolledIds.includes(memberId)) {
    course.enrolledIds.push(memberId);
  }
}

function cycleAttendance(courseId, memberId) {
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) {
    return;
  }
  const sequence = [0, 50, 75, 100];
  const current = course.attendance[memberId] ?? 0;
  course.attendance[memberId] = sequence[(sequence.indexOf(current) + 1) % sequence.length];
}

function cycleEvaluation(courseId, memberId) {
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) {
    return;
  }
  const sequence = ["Pendiente", "Apto", "No apto"];
  const current = course.evaluations[memberId] ?? "Pendiente";
  course.evaluations[memberId] = sequence[(sequence.indexOf(current) + 1) % sequence.length];
}

function setAttendanceValue(courseId, memberId, value) {
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) {
    return;
  }
  course.attendance[memberId] = Number(value || 0);
}

function setEvaluationValue(courseId, memberId, value) {
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) {
    return;
  }
  course.evaluations[memberId] = value || "Pendiente";
}

function prepareMemberForDiploma(courseId, memberId) {
  const course = state.courses.find((item) => item.id === courseId);
  const member = findMember(memberId);
  if (!course || !member) {
    return { course, member, blockers: ["alumno no disponible"] };
  }
  setAttendanceValue(courseId, memberId, 100);
  setEvaluationValue(courseId, memberId, "Apto");
  setMemberContentReadyForDiploma(courseId, memberId);
  return {
    course,
    member,
    blockers: getMemberDiplomaBlockingLabels(course, memberId)
  };
}

function getCourseClosureLabel(course) {
  return normalizeCourseClass(course?.courseClass) === "practico" ? "practico" : "curso";
}

function setMemberContentReadyForDiploma(courseId, memberId) {
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) {
    return;
  }
  const visibleLessons = getLearnerCourseLessonList(course);
  const visibleBlocks = getLearnerCourseBlockList(course).filter((block) => block.requiredForDiploma !== false);
  const currentEntry = getCourseProgressEntry(course, memberId);
  setCourseProgressEntry(course, memberId, {
    ...currentEntry,
    lessonIds: [...new Set([...(currentEntry.lessonIds || []), ...visibleLessons.map((lesson) => lesson.id)])],
    blockIds: [...new Set([...(currentEntry.blockIds || []), ...visibleBlocks.map((block) => block.id)])]
  });
}

function generateDiplomas(courseId) {
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) {
    return;
  }

  course.diplomaReady = course.enrolledIds.filter((memberId) => isMemberReadyForDiploma(course, memberId));
}

function getMemberDiplomaBlockingLabels(course, memberId) {
  const member = findMember(memberId);
  if (!course || !member) {
    return ["Alumno no disponible"];
  }
  const feedbackSent = Boolean(getCourseFeedbackResponse(course, memberId));
  const blockers = [];
  if (Number(course.attendance?.[memberId] || 0) < 75) {
    blockers.push("asistencia");
  }
  if (String(course.evaluations?.[memberId] || "").trim() !== "Apto") {
    blockers.push("evaluacion");
  }
  if (!isMemberContentReadyForDiploma(course, memberId)) {
    blockers.push("contenido");
  }
  if (course.feedbackEnabled && course.feedbackRequiredForDiploma && !feedbackSent) {
    blockers.push("valoracion final");
  }
  if (!hasMemberDocumentId(member)) {
    blockers.push("DNI/NIE");
  }
  return blockers;
}

function isMemberReadyForDiploma(course, memberId) {
  const member = findMember(memberId);
  const attendance = course.attendance[memberId] ?? 0;
  const evaluation = course.evaluations[memberId] ?? "Pendiente";
  const feedbackReady =
    !course.feedbackEnabled ||
    !course.feedbackRequiredForDiploma ||
    Boolean(getCourseFeedbackResponse(course, memberId));
  return (
    attendance >= 75 &&
    evaluation === "Apto" &&
    isMemberContentReadyForDiploma(course, memberId) &&
    feedbackReady &&
    Boolean(member) &&
    hasMemberDocumentId(member)
  );
}

function sendDiplomaMails(courseId) {
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) {
    return;
  }

  course.diplomaReady
    .filter((memberId) => !course.mailsSent.includes(memberId))
    .forEach((memberId) => {
      queueEmailForMember(courseId, memberId, true);
    });
}

function deleteMember(memberId) {
  state.members = state.members.filter((member) => member.id !== memberId);
  state.accounts = state.accounts.filter((account) => account.memberId !== memberId);
  state.emailOutbox = state.emailOutbox.filter((mail) => mail.memberId !== memberId);

  state.courses.forEach((course) => {
    course.enrolledIds = course.enrolledIds.filter((id) => id !== memberId);
    course.waitingIds = course.waitingIds.filter((id) => id !== memberId);
    course.diplomaReady = course.diplomaReady.filter((id) => id !== memberId);
    course.mailsSent = course.mailsSent.filter((id) => id !== memberId);
    delete course.attendance[memberId];
    delete course.evaluations[memberId];
    if (course.contentProgress) {
      delete course.contentProgress[memberId];
    }
  });

  if (state.selectedMemberId === memberId) {
    state.selectedMemberId = state.members[0]?.id || null;
  }

  if (session?.memberId === memberId) {
    clearSession();
    loginStatus = "La cuenta activa fue eliminada. Inicia sesion de nuevo.";
  }
}

function deleteAssociate(associateId) {
  const associate = findAssociate(associateId);
  if (!associate) {
    return;
  }

  const linkedMemberId = associate.linkedMemberId;
  const linkedAccountId = associate.linkedAccountId;
  state.associates = state.associates.filter((item) => item.id !== associateId);
  state.associateProfileRequests = (state.associateProfileRequests || []).filter(
    (request) => request.associateId !== associateId
  );
  state.associatePaymentSubmissions = (state.associatePaymentSubmissions || []).filter(
    (submission) => submission.associateId !== associateId
  );
  if (associate.applicationId) {
    state.associateApplications = (state.associateApplications || []).filter(
      (application) => application.id !== associate.applicationId
    );
  }

  if (linkedMemberId) {
    deleteMember(linkedMemberId);
  }

  if (linkedAccountId || associateId) {
    state.accounts = (state.accounts || []).filter(
      (account) => account.id !== linkedAccountId && account.associateId !== associateId
    );
  }

  if (state.selectedAssociateId === associateId) {
    state.selectedAssociateId = state.associates[0]?.id || null;
  }

  if (session?.associateId === associateId) {
    clearSession();
    loginStatus = "La cuenta activa fue eliminada. Inicia sesion de nuevo.";
  }
}

function deleteCourse(courseId) {
  state.courses = (state.courses || []).filter((course) => course.id !== courseId);
  state.emailOutbox = (state.emailOutbox || []).filter((mail) => mail.courseId !== courseId);
  state.automationInbox = (state.automationInbox || []).filter((item) => item.courseId !== courseId);
  state.manualCampusNotices = (state.manualCampusNotices || []).filter((notice) => notice.courseId !== courseId);

  if (state.selectedCourseId === courseId) {
    state.selectedCourseId = state.courses[0]?.id || null;
  }
}

function getSelectedCourse() {
  return state.courses.find((course) => course.id === state.selectedCourseId) || state.courses[0];
}

function getCourseCompletion(course) {
  const enrolled = course.enrolledIds.length || 1;
  const attendanceValues = Object.values(course.attendance || {});
  const attendanceAverage = attendanceValues.length
    ? Math.round(attendanceValues.reduce((sum, value) => sum + value, 0) / attendanceValues.length)
    : 0;
  const closedEvaluations = Object.values(course.evaluations || {}).filter(
    (value) => value === "Apto" || value === "No apto"
  ).length;

  return {
    attendanceAverage,
    closedEvaluations: Math.min(closedEvaluations, enrolled)
  };
}

function findMember(memberId) {
  return state.members.find((member) => member.id === memberId);
}

function findAssociate(associateId) {
  return state.associates.find((associate) => associate.id === associateId);
}

function findAssociateApplication(applicationId) {
  return state.associateApplications.find((application) => application.id === applicationId);
}

function findAssociatePaymentSubmission(submissionId) {
  return state.associatePaymentSubmissions.find((submission) => submission.id === submissionId);
}

function findAssociateProfileRequest(requestId) {
  return state.associateProfileRequests.find((request) => request.id === requestId);
}

function getAssociateProfileRequestProposedData(request) {
  if (!request) {
    return {
      firstName: "",
      lastName: "",
      dni: "",
      phone: "",
      email: "",
      service: "",
      note: ""
    };
  }
  let parsed = {};
  const raw = String(request.datos_propuestos_json || "").trim();
  if (raw) {
    try {
      const candidate = JSON.parse(raw);
      if (candidate && typeof candidate === "object") {
        parsed = candidate;
      }
    } catch (error) {
      parsed = {};
    }
  }
  const proposed = request.proposedData && typeof request.proposedData === "object" ? request.proposedData : parsed;
  return {
    firstName: String(proposed.firstName || request.firstName || "").trim(),
    lastName: String(proposed.lastName || request.lastName || "").trim(),
    dni: String(proposed.dni || request.dni || "").trim(),
    phone: String(proposed.phone || request.phone || "").trim(),
    email: String(proposed.email || request.email || "").trim(),
    service: String(proposed.service || request.service || "").trim(),
    note: String(proposed.note || request.note || "").trim()
  };
}

function getAssociateProfileRequestComparisonRows(request) {
  if (!request) {
    return [];
  }
  const associate = findAssociate(request.associateId || request.socio_id);
  const member = associate?.linkedMemberId
    ? findMember(associate.linkedMemberId)
    : findMember(request.memberId);
  const current = getAssociatePortalSnapshot(associate, member);
  const proposed = getAssociateProfileRequestProposedData(request);
  return [
    { label: "Nombre", current: current.firstName || "-", proposed: proposed.firstName || "-" },
    { label: "Apellidos", current: current.lastName || "-", proposed: proposed.lastName || "-" },
    { label: "DNI/NIE", current: current.dni || "-", proposed: proposed.dni || "-" },
    { label: "Telefono", current: current.phone || "-", proposed: proposed.phone || "-" },
    { label: "Email", current: current.email || "-", proposed: proposed.email || "-" },
    { label: "Servicio", current: current.service || "-", proposed: proposed.service || "-" }
  ].map((row) => ({
    ...row,
    changed: String(row.current || "").trim() !== String(row.proposed || "").trim()
  }));
}

function renderAssociateProfileRequestComparison(request) {
  if (!request) {
    return `<p class="muted">Selecciona un cambio de ficha para comparar los datos actuales con los propuestos.</p>`;
  }
  const rows = getAssociateProfileRequestComparisonRows(request);
  const proposed = getAssociateProfileRequestProposedData(request);
  return `
    <div class="mail-card">
      <h4>Comparativa del cambio</h4>
      <p class="muted">Administracion valida aqui los datos oficiales frente a la propuesta enviada por el socio.</p>
      <table>
        <thead>
          <tr>
            <th>Campo</th>
            <th>Actual</th>
            <th>Propuesto</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
                <tr>
                  <td>${escapeHtml(row.label)}</td>
                  <td>${escapeHtml(row.current)}</td>
                  <td>${row.changed ? `<strong>${escapeHtml(row.proposed)}</strong>` : escapeHtml(row.proposed)}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
      ${
        proposed.note
          ? `<p class="muted"><strong>Nota del socio:</strong> ${escapeHtml(proposed.note)}</p>`
          : `<p class="muted">El socio no ha anadido comentario extra.</p>`
      }
      ${
        request.reviewNote
          ? `<p class="muted"><strong>Comentario admin:</strong> ${escapeHtml(request.reviewNote)}</p>`
          : ""
      }
    </div>
  `;
}

function getAssociateApplicantName(application) {
  return [application.firstName, application.lastName].filter(Boolean).join(" ");
}

function getAssociateApplicationReviewIssues(application) {
  const issues = [];
  if (!String(application?.firstName || "").trim()) {
    issues.push("Falta nombre");
  }
  if (!String(application?.lastName || "").trim()) {
    issues.push("Faltan apellidos");
  }
  if (!String(application?.phone || "").trim()) {
    issues.push("Falta telefono");
  }
  if (!String(application?.email || "").trim()) {
    issues.push("Falta email");
  }
  if (!String(application?.dni || "").trim()) {
    issues.push("Falta DNI/NIE");
  }
  if (!String(application?.service || "").trim()) {
    issues.push("Falta servicio");
  }
  if (!String(application?.paymentProof || "").trim()) {
    issues.push("Falta justificante principal");
  }
  return issues;
}

function isAssociateApplicationReadyToApprove(application) {
  return getAssociateApplicationReadiness(application).ready;
}

function isLikelyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function normalizePhone(value) {
  return String(value || "").replace(/[^\d+]/g, "");
}

function normalizeDniValue(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function getAssociateApplicationValidationFlags(application) {
  const email = String(application?.email || "").trim().toLowerCase();
  const phone = normalizePhone(application?.phone || "");
  const dni = normalizeDniValue(application?.dni || "");

  const duplicateAssociate = (state.associates || []).find(
    (item) =>
      item.id !== application?.associateId &&
      ((email && String(item.email || "").trim().toLowerCase() === email) ||
        (dni && normalizeDniValue(item.dni) === dni))
  );

  const duplicateApplication = (state.associateApplications || []).find(
    (item) =>
      item.id !== application?.id &&
      String(item.status || "") !== "Rechazada" &&
      ((email && String(item.email || "").trim().toLowerCase() === email) ||
        (dni && normalizeDniValue(item.dni) === dni))
  );

  return {
    validEmail: !email || isLikelyEmail(email),
    validPhone: !phone || phone.length >= 9,
    validDni: !dni || /^[0-9XYZ][0-9]{7}[A-Z]$|^[A-Z0-9]{6,12}$/.test(dni),
    hasDuplicateAssociate: Boolean(duplicateAssociate),
    hasDuplicateApplication: Boolean(duplicateApplication),
    duplicateAssociate,
    duplicateApplication
  };
}

function getAssociateApplicationReadiness(application) {
  const issues = getAssociateApplicationReviewIssues(application);
  const flags = getAssociateApplicationValidationFlags(application);
  const blockers = [...issues];

  if (!flags.validEmail) {
    blockers.push("email con formato dudoso");
  }
  if (!flags.validPhone) {
    blockers.push("telefono con formato dudoso");
  }
  if (!flags.validDni) {
    blockers.push("DNI/NIE con formato dudoso");
  }
  if (flags.hasDuplicateAssociate) {
    blockers.push("posible duplicado con socio existente");
  }
  if (flags.hasDuplicateApplication) {
    blockers.push("posible duplicado con otra solicitud");
  }

  return {
    ready: blockers.length === 0,
    blockers,
    flags
  };
}

function renderAssociateApplicationValidationChips(application) {
  const flags = getAssociateApplicationValidationFlags(application);
  const hasPaymentProof = Boolean(String(application?.paymentProof || "").trim());
  const chips = [
    {
      label: flags.validEmail ? "Email OK" : "Email dudoso",
      tone: flags.validEmail ? "success" : "warning"
    },
    {
      label: flags.validPhone ? "Telefono OK" : "Telefono dudoso",
      tone: flags.validPhone ? "success" : "warning"
    },
    {
      label: flags.validDni ? "DNI OK" : "DNI dudoso",
      tone: flags.validDni ? "success" : "warning"
    },
    {
      label: hasPaymentProof ? "Justificante OK" : "Sin justificante",
      tone: hasPaymentProof ? "success" : "warning"
    }
  ];

  if (flags.hasDuplicateAssociate) {
    chips.push({ label: "Posible socio duplicado", tone: "warning" });
  }
  if (flags.hasDuplicateApplication) {
    chips.push({ label: "Posible solicitud duplicada", tone: "warning" });
  }

  return `<div class="validation-chip-list">${chips
    .map((chip) => `<span class="validation-chip ${chip.tone}">${escapeHtml(chip.label)}</span>`)
    .join("")}</div>`;
}

function isAssociateApplicationPending(application) {
  return ["Pendiente de revision", "Pendiente de documentacion"].includes(String(application?.status || ""));
}

function countPendingAssociateApplications() {
  return state.associateApplications.filter((application) => isAssociateApplicationPending(application)).length;
}

function getAssociateFullName(associate) {
  return [associate.firstName, associate.lastName].filter(Boolean).join(" ");
}

function getAssociateCurrentYearFee(associate) {
  return getAssociateFeeForYear(associate, String(new Date().getFullYear()));
}

function getAssociateFeeForYear(associate, year) {
  return Number(associate?.yearlyFees?.[String(year)] || 0);
}

function getAssociateQuotaGap(associate) {
  return Math.max(0, Number(associate.annualAmount || 0) - getAssociateCurrentYearFee(associate));
}

function getAssociatePayments(associate) {
  return [...(associate?.payments || [])].sort((a, b) => {
    const dateDiff = String(b.date || "").localeCompare(String(a.date || ""));
    if (dateDiff !== 0) {
      return dateDiff;
    }
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });
}

function getAssociatePaymentSubmissionsForCurrentAssociate() {
  const associate = getCurrentAssociate();
  const member = getCurrentMember();
  return [...(state.associatePaymentSubmissions || [])]
    .filter(
      (submission) =>
        submission.associateId === associate?.id || submission.memberId === member?.id
    )
    .sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));
}

function getAssociateProfileRequestsForCurrentAssociate() {
  const associate = getCurrentAssociate();
  const member = getCurrentMember();
  return [...(state.associateProfileRequests || [])]
    .filter((request) => request.associateId === associate?.id || request.memberId === member?.id)
    .sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));
}

function syncAssociatePaymentTotals(associate) {
  if (!associate) {
    return;
  }

  const paymentsByYear = (associate.payments || []).reduce((acc, payment) => {
    const year = String(payment.year || new Date(payment.date || Date.now()).getFullYear());
    acc[year] = Number(acc[year] || 0) + Number(payment.amount || 0);
    return acc;
  }, {});

  const manualYearlyFees = {
    "2024": Number(associate.manualYearlyFees?.["2024"] || 0),
    "2025": Number(associate.manualYearlyFees?.["2025"] || 0),
    "2026": Number(associate.manualYearlyFees?.["2026"] || 0),
    "2027": Number(associate.manualYearlyFees?.["2027"] || 0)
  };

  associate.yearlyFees = {
    "2024": manualYearlyFees["2024"] + Number(paymentsByYear["2024"] || 0),
    "2025": manualYearlyFees["2025"] + Number(paymentsByYear["2025"] || 0),
    "2026": manualYearlyFees["2026"] + Number(paymentsByYear["2026"] || 0),
    "2027": manualYearlyFees["2027"] + Number(paymentsByYear["2027"] || 0)
  };

  const latestPayment = getAssociatePayments(associate)[0];
  associate.lastQuotaMonth = latestPayment
    ? new Date(latestPayment.date).toLocaleDateString("es-ES", {
        month: "short",
        year: "numeric"
      })
    : associate.lastQuotaMonth || "";

  if (!["Baja", "Revisar documentacion", "Solicitud recibida", "En revision"].includes(associate.status)) {
    associate.status = getAssociateQuotaGap(associate) > 0 ? "Pendiente cuota" : "Activa";
  }
}

function syncAssociateLinkedIdentityLocally(associate) {
  if (!associate) {
    return;
  }

  const member = associate.linkedMemberId ? findMember(associate.linkedMemberId) : null;
  const account = associate.linkedAccountId ? findAccountByAssociate(associate.id) : null;
  const fullName = getAssociateFullName(associate);

  if (member) {
    member.name = fullName || member.name;
    member.email = associate.email || member.email;
    member.associateId = associate.id;
  }

  if (account) {
    account.name = fullName || account.name;
    account.email = associate.email || account.email;
    account.associateId = associate.id;
    if (member) {
      account.memberId = member.id;
    }
  }
}

function getTodayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDateTimeLocalInput(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const normalizedRaw = raw.replace(" ", "T");
  const date = new Date(normalizedRaw);
  if (!Number.isFinite(date.getTime())) {
    return normalizedRaw.slice(0, 16);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function findAccountByMember(memberId) {
  return state.accounts.find((account) => account.memberId === memberId);
}

function findAccountByAssociate(associateId) {
  return state.accounts.find((account) => account.associateId === associateId);
}

const COURSE_TEMPLATE_LABELS = {
  operativo: "Operativo guiado",
  mixto: "Aula + practica",
  reciclaje: "Reciclaje express",
  intensivo: "Jornada intensiva"
};

const COURSE_CLASS_LABELS = {
  teorico: "Teorico",
  "teorico-practico": "Teorico-practico",
  practico: "Practico"
};

const FALLBACK_CERTIFICATE_SECTIONS = [
  {
    title: "Fundamentos tecnicos y normativos",
    items: [
      "Legislacion aplicable al trabajo en altura.",
      "Marco normativo europeo para sistemas de proteccion.",
      "Principios fisicos del sistema de doble cuerda.",
      "Calculo basico de altura libre y factor de caida."
    ]
  },
  {
    title: "Equipos de proteccion individual",
    items: [
      "Colocacion y ajuste correcto del arnes integral.",
      "Uso de conectores y elementos de amarre.",
      "Inspeccion previa, periodica y post-incidente.",
      "Gestion y trazabilidad del material."
    ]
  },
  {
    title: "Sistemas de trabajo y anticaidas",
    items: [
      "Uso tecnico del descensor autofrenante.",
      "Sistemas anticaidas moviles y absorbedores.",
      "Instalacion correcta y test de carga.",
      "Calculo de distancia libre de caida."
    ]
  },
  {
    title: "Anclajes y cabeceras",
    items: [
      "Seleccion y evaluacion de soportes estructurales.",
      "Dispositivos de anclaje EN 795.",
      "Cabeceras simples, dobles y ecualizables."
    ]
  },
  {
    title: "Tecnicas de progresion y rescate",
    items: [
      "Progresion vertical y horizontal por estructuras.",
      "Uso de bloqueadores y sistemas de linea de vida.",
      "Polipastos, maniobras de fuerza y rescate."
    ]
  }
];

const LESSON_TYPE_OPTIONS = [
  "Briefing",
  "Presentacion",
  "Practica",
  "Caso",
  "Checklist",
  "Evaluacion",
  "Descarga"
];

const LESSON_PUBLICATION_STATUSES = ["draft", "review", "published"];
const COURSE_RESOURCE_VISIBILITIES = ["alumnado", "interno"];
const LESSON_BLOCK_TYPES = ["document", "video", "checklist", "download", "evaluation", "practice"];

function normalizeCourseBlock(block, moduleIndex, lessonIndex, blockIndex) {
  return {
    id: block.id || `block-${Date.now()}-${moduleIndex}-${lessonIndex}-${blockIndex}`,
    type: block.type || "document",
    title: normalizeDisplayText(block.title || `Bloque ${blockIndex + 1}`),
    content: normalizeDisplayText(block.content || ""),
    url: block.url || "",
    questions: Array.isArray(block.questions)
      ? block.questions.map((question, questionIndex) => ({
          id: question.id || `question-${Date.now()}-${moduleIndex}-${lessonIndex}-${blockIndex}-${questionIndex}`,
          prompt: normalizeDisplayText(question.prompt || `Pregunta ${questionIndex + 1}`),
          options: Array.isArray(question.options) ? question.options.map((option) => normalizeDisplayText(option)) : [],
          correctAnswer: question.correctAnswer || "",
          explanation: normalizeDisplayText(question.explanation || ""),
          ...question
        }))
      : [],
    required: Boolean(block.required),
    ...block,
    required: Boolean(block.required)
  };
}

function normalizeCourseClass(value) {
  const source = String(value || "").trim().toLowerCase();
  if (source.includes("teor") && source.includes("pract")) {
    return "teorico-practico";
  }
  if (source.includes("teor")) {
    return "teorico";
  }
  if (source.includes("pract")) {
    return "practico";
  }
  return "teorico-practico";
}

function normalizeCourseLesson(lesson, moduleIndex, lessonIndex) {
  return {
    id: lesson.id || `lesson-${Date.now()}-${moduleIndex}-${lessonIndex}`,
    title: normalizeDisplayText(lesson.title || `Leccion ${lessonIndex + 1}`),
    type: normalizeDisplayText(lesson.type || "Practica"),
    duration: Number(lesson.duration || 0),
    resource: normalizeDisplayText(lesson.resource || ""),
    instructions: normalizeDisplayText(lesson.instructions || ""),
    body: normalizeDisplayText(lesson.body || ""),
    activity: normalizeDisplayText(lesson.activity || ""),
    takeaway: normalizeDisplayText(lesson.takeaway || ""),
    assetLabel: normalizeDisplayText(lesson.assetLabel || ""),
    assetUrl: lesson.assetUrl || "",
    publicationStatus: lesson.publicationStatus || "draft",
    blocks: Array.isArray(lesson.blocks)
      ? lesson.blocks.map((block, blockIndex) => normalizeCourseBlock(block, moduleIndex, lessonIndex, blockIndex))
      : [],
    ...lesson,
    duration: Number(lesson.duration || 0)
  };
}

function normalizeCourseModule(module, moduleIndex) {
  return {
    id: module.id || `module-${Date.now()}-${moduleIndex}`,
    title: normalizeDisplayText(module.title || `Modulo ${moduleIndex + 1}`),
    goal: normalizeDisplayText(module.goal || ""),
    format: normalizeDisplayText(module.format || "Sesion guiada"),
    deliverable: normalizeDisplayText(module.deliverable || ""),
    lessons: Array.isArray(module.lessons)
      ? module.lessons.map((lesson, lessonIndex) => normalizeCourseLesson(lesson, moduleIndex, lessonIndex))
      : [],
    ...module
  };
}

function normalizeCourseResource(resource, resourceIndex) {
  return {
    id: resource.id || `resource-${Date.now()}-${resourceIndex}`,
    label: normalizeDisplayText(resource.label || `Recurso ${resourceIndex + 1}`),
    type: normalizeDisplayText(resource.type || "Documento"),
    url: resource.url || "",
    description: normalizeDisplayText(resource.description || ""),
    visibility: resource.visibility || "alumnado",
    ...resource
  };
}

function buildModulesFromSessions(sessions) {
  return (Array.isArray(sessions) ? sessions : []).map((session, index, source) =>
    normalizeCourseModule(
      {
        title: session.title || `Modulo ${index + 1}`,
        goal: session.focus || "",
        format: index === 0 ? "Briefing y contexto" : index === source.length - 1 ? "Cierre y validacion" : "Practica guiada",
        deliverable:
          index === source.length - 1
            ? "Evidencia de cierre y comprobacion final"
            : "Registro de aprendizaje y puntos operativos",
        lessons: [
          {
            title: index === 0 ? "Apertura y encuadre" : "Arranque del bloque",
            type: "Briefing",
            duration: Math.max(0.5, Number(session.duration || 0) > 1 ? Math.round(Number(session.duration || 0) * 0.25 * 10) / 10 : 0.5),
            resource: "Guion del instructor",
            instructions: session.focus || "Presentar objetivos, riesgos y secuencia de trabajo.",
            body: "Introduce el contexto del bloque, el por que y el resultado esperado.",
            activity: "Alinear al grupo y dejar claro el itinerario del modulo.",
            takeaway: "El alumno sale sabiendo que va a trabajar y con que criterios.",
            assetLabel: "Guion de apertura",
            assetUrl: "",
            publicationStatus: "draft"
          },
          {
            title: session.title || `Practica ${index + 1}`,
            type: index === source.length - 1 ? "Evaluacion" : "Practica",
            duration: Math.max(0.5, Number(session.duration || 0) > 1 ? Math.round(Number(session.duration || 0) * 0.5 * 10) / 10 : 0.5),
            resource: "Presentacion, checklist y material operativo",
            instructions: session.focus || "Desarrollar el contenido principal del bloque.",
            body: "Desarrolla aqui la explicacion central, el caso o la maniobra del bloque.",
            activity: "Practica guiada o ejercicio principal del modulo.",
            takeaway: "Registrar que criterio demuestra el alumno al finalizar.",
            assetLabel: "Ficha principal del modulo",
            assetUrl: "",
            publicationStatus: "draft"
          },
          {
            title: index === source.length - 1 ? "Cierre y evidencias" : "Debrief y cierre",
            type: "Checklist",
            duration: Math.max(0.3, Number(session.duration || 0) > 1 ? Math.round(Number(session.duration || 0) * 0.25 * 10) / 10 : 0.3),
            resource: "Hoja de seguimiento",
            instructions: "Recoger incidencias, aprendizajes y tareas pendientes.",
            body: "Resume hallazgos, errores, puntos fuertes y siguientes pasos.",
            activity: "Checklist final y confirmacion de evidencias.",
            takeaway: "El alumno sabe que se valida y que queda pendiente.",
            assetLabel: "Checklist de cierre",
            assetUrl: "",
            publicationStatus: "draft"
          }
        ]
      },
      index
    )
  );
}

function normalizeCourse(course) {
  const sessions = Array.isArray(course.sessions) ? course.sessions : [];
  const modules = Array.isArray(course.modules) && course.modules.length
    ? course.modules.map((module, moduleIndex) => normalizeCourseModule(module, moduleIndex))
    : buildModulesFromSessions(sessions);
  const resources = Array.isArray(course.resources)
    ? course.resources.map((resource, resourceIndex) => normalizeCourseResource(resource, resourceIndex))
    : [];
  const feedbackResponses = Array.isArray(course.feedbackResponses)
    ? course.feedbackResponses.map((response, responseIndex) => ({
        id: response.id || `feedback-${Date.now()}-${responseIndex}`,
        memberId: response.memberId || "",
        submittedAt: response.submittedAt || "",
        activityScore: Math.max(1, Math.min(5, Number(response.activityScore || 0) || 0)),
        contentsScore: Math.max(1, Math.min(5, Number(response.contentsScore || 0) || 0)),
        organizationScore: Math.max(1, Math.min(5, Number(response.organizationScore || 0) || 0)),
        teacherClarityScore: Math.max(1, Math.min(5, Number(response.teacherClarityScore || 0) || 0)),
        teacherUsefulnessScore: Math.max(1, Math.min(5, Number(response.teacherUsefulnessScore || 0) || 0)),
        teacherSupportScore: Math.max(1, Math.min(5, Number(response.teacherSupportScore || 0) || 0)),
        recommendationScore: Math.max(1, Math.min(5, Number(response.recommendationScore || 0) || 0)),
        comment: response.comment || "",
        teacherComment: response.teacherComment || "",
        ...response
      }))
    : [];
  return {
    id: course.id || `course-${Date.now()}`,
    title: normalizeDisplayText(course.title || ""),
    courseClass: normalizeCourseClass(course.courseClass || course.classType),
    type: normalizeDisplayText(course.type || ""),
    status: normalizeDisplayText(course.status || "Planificacion"),
    summary: normalizeDisplayText(course.summary || ""),
    startDate: course.startDate || "",
    endDate: course.endDate || "",
    hours: Number(course.hours || 0),
    capacity: Number(course.capacity || 0),
    modality: normalizeDisplayText(course.modality || "Presencial"),
    audience: normalizeDisplayText(course.audience || "Socios y voluntariado operativo"),
    accessScope: normalizeCourseAccessScope(
      course.accessScope || course.enrollmentScope || course.visibility,
      course.audience || ""
    ),
    enrollmentOpensAt: normalizeDateTimeLocalInput(course.enrollmentOpensAt || ""),
    coordinator: normalizeDisplayText(course.coordinator || ""),
    contentTemplate: course.contentTemplate || "operativo",
    objectives: Array.isArray(course.objectives) ? course.objectives.map((item) => normalizeDisplayText(item)) : [],
    sessions,
    modules,
    resources,
    materials: Array.isArray(course.materials) ? course.materials.map((item) => normalizeDisplayText(item)) : [],
    evaluationCriteria: Array.isArray(course.evaluationCriteria) ? course.evaluationCriteria.map((item) => normalizeDisplayText(item)) : [],
    contentStatus: course.contentStatus || "draft",
    certificateCity: normalizeDisplayText(course.certificateCity || ""),
    certificateContents: Array.isArray(course.certificateContents) ? course.certificateContents.map((item) => normalizeDisplayText(item)) : [],
    enrollmentFee: Number(course.enrollmentFee || 0),
    enrollmentPaymentInstructions: normalizeDisplayText(course.enrollmentPaymentInstructions || ""),
    enrollmentSubmissions: Array.isArray(course.enrollmentSubmissions)
      ? course.enrollmentSubmissions.map((submission, submissionIndex) => ({
          id: submission.id || `enrollment-${Date.now()}-${submissionIndex}`,
          memberId: submission.memberId || "",
          submittedAt: submission.submittedAt || "",
          status: submission.status || "pending",
          note: submission.note || "",
          paymentProof: submission.paymentProof || null,
          amount: Number(submission.amount || 0),
          method: submission.method || "Transferencia",
          ...submission
        }))
      : [],
    feedbackEnabled: course.feedbackEnabled !== false,
    feedbackRequiredForDiploma: Boolean(course.feedbackRequiredForDiploma),
    feedbackTeachers: Array.isArray(course.feedbackTeachers)
      ? course.feedbackTeachers
      : String(course.coordinator || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
    feedbackResponses,
    contentProgress: course.contentProgress || {},
    enrolledIds: Array.isArray(course.enrolledIds) ? course.enrolledIds : [],
    waitingIds: Array.isArray(course.waitingIds) ? course.waitingIds : [],
    attendance: course.attendance || {},
    evaluations: course.evaluations || {},
    diplomaTemplate: course.diplomaTemplate || "Aprovechamiento",
    diplomaReady: Array.isArray(course.diplomaReady) ? course.diplomaReady : [],
    mailsSent: Array.isArray(course.mailsSent) ? course.mailsSent : [],
    ...course
  };
}

function normalizeCourseAccessScope(value, fallbackAudience = "") {
  const raw = String(value || "").trim().toLowerCase();
  const audience = String(fallbackAudience || "").trim().toLowerCase();
  if (
    ["public", "open", "everyone", "all"].includes(raw) ||
    /todo el mundo|publico general|abierto al publico|abierto a todo el mundo|participantes externos|externos|no socios/.test(raw) ||
    /todo el mundo|publico general|abierto al publico|abierto a todo el mundo|participantes externos|externos|no socios/.test(audience)
  ) {
    return "public";
  }
  return "members";
}

function parseTextareaList(value) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCertificateContentLines(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .flatMap((item) => {
      if (typeof item === "string") {
        return item.trim() ? [item.trim()] : [];
      }

      if (!item || typeof item !== "object") {
        const fallback = String(item || "").trim();
        return fallback ? [fallback] : [];
      }

      const title = String(item.title || "").trim();
      const sectionItems = Array.isArray(item.items)
        ? item.items.map((entry) => String(entry || "").trim()).filter(Boolean)
        : [];

      if (title && sectionItems.length) {
        return [`${title} | ${sectionItems.join("; ")}`];
      }

      if (sectionItems.length) {
        return [sectionItems.join("; ")];
      }

      return title ? [title] : [];
    })
    .filter(Boolean);
}

function serializeTextareaList(items) {
  return normalizeCertificateContentLines(items).join("\n");
}

function serializeSessions(sessions) {
  return (sessions || [])
    .map((session) => [session.title, session.duration ? `${session.duration}h` : "", session.focus || ""].filter(Boolean).join(" | "))
    .join("\n");
}

function parseSessions(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [title, rawDuration, focus] = line.split("|").map((item) => item.trim());
      const duration = Number(String(rawDuration || "").replace("h", "").replace(",", "."));
      return {
        id: `session-${Date.now()}-${index}`,
        title: title || `Sesion ${index + 1}`,
        duration: Number.isFinite(duration) && duration > 0 ? duration : 0,
        focus: focus || ""
      };
    });
}

function parseQuizQuestions(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [prompt, rawOptions, correctAnswer, explanation] = line.split("|").map((item) => item.trim());
      return {
        id: `question-${Date.now()}-${index}`,
        prompt: prompt || `Pregunta ${index + 1}`,
        options: String(rawOptions || "")
          .split(";")
          .map((item) => item.trim())
          .filter(Boolean),
        correctAnswer: correctAnswer || "",
        explanation: explanation || ""
      };
    });
}

function serializeQuizQuestions(questions) {
  return (questions || [])
    .map((question) =>
      [
        question.prompt || "",
        (question.options || []).join(" ; "),
        question.correctAnswer || "",
        question.explanation || ""
      ].join(" | ")
    )
    .join("\n");
}

function inferCourseTemplate(course) {
  const normalized = normalizeCourse(course);
  const source = `${normalized.title} ${normalized.type} ${normalized.courseClass}`.toLowerCase();
  if (normalized.courseClass === "teorico") {
    return Number(normalized.hours || 0) >= 16 ? "intensivo" : "mixto";
  }
  if (normalized.courseClass === "practico") {
    return Number(normalized.hours || 0) <= 4 ? "reciclaje" : "operativo";
  }
  if (source.includes("recicl") || Number(normalized.hours || 0) <= 4) {
    return "reciclaje";
  }
  if (source.includes("aula") || source.includes("teoric") || source.includes("mixto")) {
    return "mixto";
  }
  if (Number(normalized.hours || 0) >= 16) {
    return "intensivo";
  }
  return "operativo";
}

function getCourseTemplateLabel(template) {
  return COURSE_TEMPLATE_LABELS[template] || "Diseno libre";
}

function getCourseClassLabel(courseClass) {
  return COURSE_CLASS_LABELS[normalizeCourseClass(courseClass)] || "Teorico-practico";
}

function describeCourseType(course) {
  const courseClassLabel = getCourseClassLabel(course.courseClass);
  return course.type ? `${courseClassLabel} - ${course.type}` : courseClassLabel;
}

function inferCourseTopic(title, type) {
  const source = `${title} ${type}`.toLowerCase();
  if (source.includes("era")) {
    return "uso seguro de ERA, chequeos previos, maniobras y seguridad en intervencion";
  }
  if (source.includes("rescate")) {
    return "maniobras, seguridad de equipo, estaciones practicas y control de riesgos";
  }
  if (source.includes("primeros auxilios")) {
    return "valoracion inicial, soporte vital, trauma y coordinacion operativa";
  }
  if (source.includes("vehiculo")) {
    return "conduccion, chequeos previos, despliegue y seguridad de vehiculos";
  }
  return "procedimientos, seguridad, coordinacion y aplicacion operativa";
}

function buildLessonContentScaffold(lesson, course, module, options = {}) {
  const topic = inferCourseTopic(course.title, course.type);
  const type = lesson.type || "Practica";
  const moduleTitle = module.title || "Modulo";
  const lessonTitle = lesson.title || "Leccion";
  const mode = options.publicationStatus || lesson.publicationStatus || "draft";

  const templates = {
    Briefing: {
      body: `Esta leccion abre ${moduleTitle} y coloca al alumno en contexto sobre ${topic}. Explica el marco de trabajo, los riesgos clave y el resultado esperado antes de empezar.`,
      activity: "Presentacion breve del bloque, reparto de roles y recordatorio de criterios de seguridad.",
      takeaway: "El alumno entiende el objetivo del bloque y como se va a trabajar.",
      assetLabel: "Guion de briefing"
    },
    Presentacion: {
      body: `Contenido guiado de ${lessonTitle} para introducir conceptos, lenguaje comun y decisiones operativas que se aplicaran despues en la practica.`,
      activity: "Repaso guiado con apoyo visual y preguntas cortas de comprobacion.",
      takeaway: "El alumno sale con una base teorica clara y lista para aplicar.",
      assetLabel: "Presentacion base"
    },
    Practica: {
      body: `Bloque practico centrado en ${topic}, con pasos claros, observacion del instructor y correccion sobre la marcha.`,
      activity: "Ejercicio operativo o maniobra guiada con checklist de control.",
      takeaway: "El alumno demuestra criterio tecnico y secuencia segura de actuacion.",
      assetLabel: "Ficha de practica"
    },
    Caso: {
      body: `Caso aplicado para conectar la teoria del curso con una situacion realista de intervencion, coordinacion o toma de decisiones.`,
      activity: "Resolucion guiada del caso en parejas o en pequeno equipo.",
      takeaway: "El alumno traduce el contenido del curso a decisiones utiles en servicio.",
      assetLabel: "Caso practico"
    },
    Checklist: {
      body: `Leccion de consolidacion para verificar que ${moduleTitle} queda bien cerrado, con evidencias y errores frecuentes controlados.`,
      activity: "Checklist de cierre, repaso de puntos criticos y registro de incidencias.",
      takeaway: "El alumno sabe que puntos debe revisar siempre antes de dar el bloque por cerrado.",
      assetLabel: "Checklist de cierre"
    },
    Evaluacion: {
      body: `Leccion de evaluacion para comprobar si el alumno aplica de forma correcta lo trabajado en ${moduleTitle}.`,
      activity: "Prueba practica, comprobacion final o validacion de criterio.",
      takeaway: "Queda evidenciado si la competencia esta alcanzada o requiere refuerzo.",
      assetLabel: "Hoja de evaluacion"
    },
    Descarga: {
      body: `Recurso de consulta o descarga asociado a ${lessonTitle}, preparado para que el alumno tenga una referencia clara despues del curso.`,
      activity: "Descargar, revisar y conservar el recurso en su carpeta personal.",
      takeaway: "El alumno se lleva un material util para consulta posterior.",
      assetLabel: "Documento de apoyo"
    }
  };

  const selected = templates[type] || templates.Practica;
  return {
    body: lesson.body || selected.body,
    activity: lesson.activity || selected.activity,
    takeaway: lesson.takeaway || selected.takeaway,
    assetLabel: lesson.assetLabel || selected.assetLabel,
    assetUrl: lesson.assetUrl || "",
    publicationStatus: mode
  };
}

function buildLessonBlocksScaffold(lesson) {
  const maps = {
    Briefing: [
      { type: "document", title: "Marco del bloque", content: "Explica aqui el contexto, objetivo y criterio inicial.", url: "", required: true },
      { type: "checklist", title: "Chequeo previo", content: "Lista rapida de material, seguridad y reparto de roles.", url: "", required: true }
    ],
    Presentacion: [
      { type: "document", title: "Contenido principal", content: "Desarrollo teorico o explicativo de la leccion.", url: "", required: true },
      { type: "video", title: "Apoyo visual", content: "Video, demostracion o recurso audiovisual de apoyo.", url: "", required: false }
    ],
    Practica: [
      { type: "practice", title: "Dinamica practica", content: "Describe la practica, maniobra o estacion principal.", url: "", required: true },
      { type: "checklist", title: "Criterios de ejecucion", content: "Puntos que deben cumplirse durante la practica.", url: "", required: true }
    ],
    Caso: [
      { type: "document", title: "Escenario del caso", content: "Describe la situacion inicial y las variables del caso.", url: "", required: true },
      {
        type: "evaluation",
        title: "Resolucion esperada",
        content: "Criterios para valorar la resolucion del caso.",
        url: "",
        required: false,
        questions: [
          {
            prompt: "Cual es la decision inicial mas adecuada?",
            options: ["Asegurar escena", "Esperar sin actuar", "Cerrar el caso"],
            correctAnswer: "Asegurar escena",
            explanation: "La primera decision debe proteger a equipo y victima."
          }
        ]
      }
    ],
    Checklist: [
      { type: "checklist", title: "Lista de cierre", content: "Items de verificacion final del bloque.", url: "", required: true },
      { type: "download", title: "Soporte de cierre", content: "Plantilla o anexo descargable asociado al cierre.", url: "", required: false }
    ],
    Evaluacion: [
      {
        type: "evaluation",
        title: "Prueba o comprobacion",
        content: "Describe la prueba, rubrica o criterio de evaluacion.",
        url: "",
        required: true,
        questions: [
          {
            prompt: "Que criterio debe cumplirse para considerar la prueba superada?",
            options: ["Secuencia correcta", "Tiempo mas rapido", "Sin registrar evidencias"],
            correctAnswer: "Secuencia correcta",
            explanation: "La prioridad es la ejecucion correcta y trazable."
          }
        ]
      },
      { type: "document", title: "Evidencia", content: "Que evidencia debe quedar registrada tras la evaluacion.", url: "", required: true }
    ],
    Descarga: [
      { type: "download", title: "Recurso descargable", content: "Documento o archivo que acompana la leccion.", url: "", required: true }
    ]
  };

  return (maps[lesson.type] || maps.Practica).map((block, blockIndex) =>
    normalizeCourseBlock(block, 0, 0, blockIndex)
  );
}

function applyLessonScaffold(course, module, lesson, options = {}) {
  const scaffold = buildLessonContentScaffold(lesson, course, module, options);
  return Object.assign(lesson, scaffold, {
    blocks: lesson.blocks?.length ? lesson.blocks : buildLessonBlocksScaffold(lesson)
  });
}

function buildCourseModules(normalized, template, sessions, topic) {
  const lessonTypesByTemplate = {
    operativo: ["Briefing", "Practica", "Checklist"],
    mixto: ["Presentacion", "Caso", "Checklist"],
    reciclaje: ["Briefing", "Checklist", "Evaluacion"],
    intensivo: ["Briefing", "Practica", "Evaluacion"]
  };
  const lessonTypes = lessonTypesByTemplate[template] || lessonTypesByTemplate.operativo;

  return sessions.map((session, index) =>
    normalizeCourseModule(
      {
        title: session.title || `Modulo ${index + 1}`,
        goal: session.focus || `Desarrollar el bloque ${index + 1} del curso.`,
        format:
          template === "mixto"
            ? index === 0
              ? "Aula guiada"
              : index === sessions.length - 1
                ? "Evaluacion aplicada"
                : "Taller aplicado"
            : template === "reciclaje"
              ? "Reciclaje rapido"
              : template === "intensivo"
                ? "Bloque intensivo"
                : index === 0
                  ? "Briefing operativo"
                  : index === sessions.length - 1
                    ? "Cierre y validacion"
                    : "Practica guiada",
        deliverable:
          index === sessions.length - 1
            ? "Cierre validado, asistencia cerrada y evidencia formativa"
            : "Checklist del modulo y aprendizaje trazado",
        lessons: [
          {
            title: index === 0 ? "Inicio del bloque" : "Aterrizaje rapido",
            type: lessonTypes[0],
            duration: Math.max(0.5, Math.round(Number(session.duration || 1) * 0.2 * 10) / 10),
            resource: "Guion del instructor y objetivos visibles",
            instructions: `Alinear expectativas, riesgos y objetivo principal sobre ${topic}.`,
            body: `Introduce el bloque con una entrada clara sobre ${topic} y explica que resultado se espera al cerrar este modulo.`,
            activity: "Encendido del bloque, reparto de foco y recordatorio de seguridad.",
            takeaway: "El alumno entiende el objetivo del bloque y el criterio de trabajo.",
            assetLabel: "Guion del bloque",
            assetUrl: "",
            publicationStatus: "draft"
          },
          {
            title:
              template === "mixto"
                ? "Contenido guiado y aplicacion"
                : template === "reciclaje"
                  ? "Chequeo rapido y correccion"
                  : index === sessions.length - 1
                    ? "Validacion final"
                    : "Nucleo practico",
            type: lessonTypes[1],
            duration: Math.max(0.5, Math.round(Number(session.duration || 1) * 0.55 * 10) / 10),
            resource:
              template === "mixto"
                ? "Presentacion, caso y material de apoyo"
                : "Checklist operativo, fichas y recursos del instructor",
            instructions: session.focus || `Desarrollar el contenido central del modulo sobre ${topic}.`,
            body: `Leccion principal del modulo para trabajar ${topic} con una secuencia clara, ejemplos y aplicacion directa al servicio.`,
            activity:
              template === "mixto"
                ? "Explicacion guiada seguida de aplicacion sobre caso."
                : "Bloque practico o ejercicio principal con supervision del instructor.",
            takeaway: "El alumno convierte el contenido del curso en una accion o criterio observable.",
            assetLabel: template === "mixto" ? "Caso o presentacion principal" : "Ficha operativa principal",
            assetUrl: "",
            publicationStatus: "draft"
          },
          {
            title: index === sessions.length - 1 ? "Cierre y evidencias" : "Debrief y consolidacion",
            type: lessonTypes[2],
            duration: Math.max(0.3, Math.round(Number(session.duration || 1) * 0.25 * 10) / 10),
            resource: "Hoja de cierre, incidencias y recordatorio final",
            instructions:
              index === sessions.length - 1
                ? "Cerrar evaluacion, evidencias y pasos siguientes."
                : "Recoger dudas, correcciones y compromisos del modulo.",
            body: "Cierra el bloque recogiendo errores frecuentes, criterios de calidad y puntos que el alumno debe conservar.",
            activity: index === sessions.length - 1 ? "Validacion final y evidencias" : "Debrief corto y checklist de consolidacion",
            takeaway: "El alumno sabe que se considera bien hecho y que debe revisar despues.",
            assetLabel: "Checklist de cierre",
            assetUrl: "",
            publicationStatus: "draft"
          }
        ]
      },
      index
    )
  );
}

function buildCourseBlueprint(course, templateOverride) {
  const normalized = normalizeCourse(course);
  const template = templateOverride || normalized.contentTemplate || inferCourseTemplate(normalized);
  const totalHours = Math.max(2, Number(normalized.hours || 0));
  const blocks = Math.max(2, Math.min(6, Math.ceil(totalHours / 4)));
  const baseBlockHours = Math.max(1, Math.round((totalHours / blocks) * 10) / 10);
  const topic = inferCourseTopic(normalized.title, normalized.type);
  const templateConfig = {
    operativo: {
      modality: normalized.courseClass === "practico" ? "Presencial practica" : "Presencial",
      audience: "Equipo operativo y voluntariado activo",
      stages: ["Briefing y marco de trabajo", "Practica aplicada", "Simulacion y cierre"]
    },
    mixto: {
      modality: normalized.courseClass === "teorico" ? "Aula teorica" : "Mixta",
      audience: "Socios, alumnado interno y perfiles de coordinacion",
      stages: ["Marco comun", "Contenido guiado", "Taller aplicado", "Cierre"]
    },
    reciclaje: {
      modality: "Presencial",
      audience: "Personal que necesita refresco rapido y validacion",
      stages: ["Refresco inicial", "Estaciones de chequeo", "Cierre corto"]
    },
    intensivo: {
      modality: "Presencial",
      audience: "Equipos que necesitan una jornada completa y progresiva",
      stages: ["Contexto y preparacion", "Bloque intensivo", "Simulacro", "Cierre y evidencias"]
    }
  }[template];

  const objectives = [
    `Entender los fundamentos de ${topic}.`,
    `Aplicar el procedimiento operativo del curso ${normalized.title}.`,
    "Trabajar con criterios comunes de seguridad, coordinacion y trazabilidad.",
    "Dejar evidencias claras de asistencia, evaluacion y cierre formativo."
  ];

  const sessions = Array.from({ length: blocks }, (_, index) => ({
    id: `session-${Date.now()}-${index}`,
    title: `Modulo ${index + 1}: ${
      index === 0
        ? templateConfig.stages[0]
        : index === blocks - 1
          ? templateConfig.stages[templateConfig.stages.length - 1]
          : templateConfig.stages[Math.min(index, templateConfig.stages.length - 2)]
    }`,
    duration: baseBlockHours,
    focus:
      index === 0
        ? `Introduccion, objetivos y marco operativo de ${normalized.title}.`
        : index === blocks - 1
          ? "Evaluacion final, repaso de incidencias y cierre documental."
          : `Desarrollo practico sobre ${topic}.`
  }));

  const materials =
    template === "mixto"
      ? [
          "Guia del alumno y presentacion base",
          "Caso practico o ejemplo guiado",
          "Hoja de asistencia y checklist final",
          "Recurso descargable de apoyo"
        ]
      : template === "reciclaje"
        ? [
            "Checklist de refresco rapido",
            "Ficha de errores frecuentes",
            "Hoja de validacion corta",
            "Registro de asistencia"
          ]
        : template === "intensivo"
          ? [
              "Dossier operativo del curso",
              "Checklist por bloques",
              "Material de simulacro y evaluacion",
              "Hoja de incidencias y cierre"
            ]
          : [
              "Presentacion del instructor",
              "Checklist operativo de la sesion",
              "Hoja de asistencia",
              "Guion de practicas y evaluacion"
            ];

  const evaluationCriteria =
    template === "reciclaje"
      ? [
          "Asistencia minima establecida por administracion",
          "Chequeo final superado",
          "Correccion de errores detectados durante el refresco"
        ]
      : template === "mixto"
        ? [
            "Participacion activa en bloques guiados",
            "Resolucion del caso o practica aplicada",
            "Cierre documental y evidencias completas"
          ]
        : [
            "Asistencia minima establecida por administracion",
            "Superacion de practica o comprobacion final",
            "Registro completo de observaciones e incidencias"
          ];

  const modules = buildCourseModules(normalized, template, sessions, topic);

  return {
    summary:
      normalized.summary ||
      `Accion formativa ${getCourseClassLabel(normalized.courseClass).toLowerCase()} de ${normalized.type || "campus"} orientada a ${topic}, estructurada como ${getCourseTemplateLabel(template).toLowerCase()} y preparada para trabajar contenido, asistencia y cierre desde un solo flujo.`,
    modality: normalized.modality || templateConfig.modality,
    audience: normalized.audience || templateConfig.audience,
    objectives,
    sessions,
    modules,
    materials,
    evaluationCriteria,
    contentTemplate: template,
    contentStatus: "outline"
  };
}

function buildCourseStarterPreset(presetId) {
  const presets = {
    ventilation: {
      title: "Ventilacion operativa y control de humos",
      courseClass: "teorico-practico",
      contentTemplate: "operativo",
      type: "Ventilacion y control de incendios",
      startDate: "2026-05-14",
      endDate: "2026-05-15",
      hours: 8,
      capacity: 18,
      coordinator: "Carlos Salvador Rodriguez",
      audience: "Socios, participantes externos y equipos de primera intervencion",
      accessScope: "public"
    },
    vertical: {
      title: "Rescate vertical nivel operativo",
      courseClass: "practico",
      contentTemplate: "operativo",
      type: "Rescate vertical",
      startDate: "2026-06-05",
      endDate: "2026-06-06",
      hours: 12,
      capacity: 12,
      coordinator: "Jordi Prior Morilla",
      audience: "Socios con perfil tecnico y maniobra vertical"
    }
  };

  return presets[presetId] || presets.ventilation;
}

function buildDefaultLessonBlock(type, index = 0) {
  const templates = {
    document: {
      type: "document",
      title: `Documento ${index + 1}`,
      content: "Desarrolla aqui el contenido principal del documento o la lectura guiada.",
      url: "",
      required: true,
      questions: []
    },
    video: {
      type: "video",
      title: `Video ${index + 1}`,
      content: "Resume que debe observar el alumno en el video.",
      url: "https://www.youtube.com/watch?v=",
      required: false,
      questions: []
    },
    checklist: {
      type: "checklist",
      title: `Checklist ${index + 1}`,
      content: "Lista los puntos que deben revisarse o ejecutarse.",
      url: "",
      required: true,
      questions: []
    },
    download: {
      type: "download",
      title: `Descarga ${index + 1}`,
      content: "Describe el archivo o plantilla que se descarga.",
      url: "https://",
      required: false,
      questions: []
    },
    evaluation: {
      type: "evaluation",
      title: `Test ${index + 1}`,
      content: "Bloque de evaluacion con preguntas autocontenidas.",
      url: "",
      required: true,
      questions: [
        {
          prompt: "Pregunta inicial de ejemplo",
          options: ["Opcion A", "Opcion B", "Opcion C"],
          correctAnswer: "Opcion A",
          explanation: "Explica aqui por que esta es la respuesta correcta."
        }
      ]
    },
    practice: {
      type: "practice",
      title: `Practica ${index + 1}`,
      content: "Describe la maniobra, simulacion o actividad que debe ejecutar el alumno.",
      url: "",
      required: true,
      questions: []
    }
  };

  return templates[type] || templates.document;
}

function getEmbedUrl(url) {
  const value = String(url || "").trim();
  if (!value) {
    return "";
  }

  if (value.includes("youtube.com/watch?v=")) {
    return value.replace("watch?v=", "embed/");
  }
  if (value.includes("youtu.be/")) {
    const id = value.split("youtu.be/")[1]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : value;
  }
  if (value.includes("vimeo.com/")) {
    const id = value.split("vimeo.com/")[1]?.split("?")[0];
    return id ? `https://player.vimeo.com/video/${id}` : value;
  }

  return value;
}

function getBlockDisplayLabel(type) {
  const labels = {
    document: "Documento",
    video: "Video",
    checklist: "Checklist",
    download: "Descarga",
    evaluation: "Test",
    practice: "Practica"
  };
  return labels[type] || "Bloque";
}

function applyBlueprintToCourse(course, blueprint) {
  course.summary = blueprint.summary;
  course.modality = blueprint.modality;
  course.audience = blueprint.audience;
  course.objectives = blueprint.objectives;
  course.sessions = blueprint.sessions;
  course.modules = blueprint.modules;
  course.materials = blueprint.materials;
  course.evaluationCriteria = blueprint.evaluationCriteria;
  course.contentTemplate = blueprint.contentTemplate;
  course.contentStatus = blueprint.contentStatus || "outline";
}

function getCourseLessonCount(course) {
  return (course.modules || []).reduce((total, module) => total + Number(module.lessons?.length || 0), 0);
}

function getPublishedLessonCount(course) {
  return (course.modules || []).reduce(
    (total, module) =>
      total +
      (module.lessons || []).filter((lesson) => String(lesson.publicationStatus || "draft") === "published").length,
    0
  );
}

function getCourseLessonList(course) {
  return (course.modules || []).flatMap((module) => module.lessons || []);
}

function getCourseBlockList(course) {
  return getCourseLessonList(course).flatMap((lesson) => lesson.blocks || []);
}

function getLearnerCourseModules(course) {
  return (course.modules || [])
    .map((module) => ({
      ...module,
      lessons: (module.lessons || []).filter(
        (lesson) => String(lesson.publicationStatus || "draft").toLowerCase() === "published"
      )
    }))
    .filter((module) => module.lessons.length);
}

function getLearnerCourseLessonList(course) {
  return getLearnerCourseModules(course).flatMap((module) => module.lessons || []);
}

function getLearnerCourseBlockList(course) {
  return getLearnerCourseLessonList(course).flatMap((lesson) => lesson.blocks || []);
}

function getCourseProgressEntry(course, memberId) {
  if (!memberId) {
    return {
      lessonIds: [],
      blockIds: [],
      quizAnswers: {},
      updatedAt: ""
    };
  }

  const entry = course.contentProgress?.[memberId] || {};
  return {
    lessonIds: Array.isArray(entry.lessonIds) ? entry.lessonIds : [],
    blockIds: Array.isArray(entry.blockIds) ? entry.blockIds : [],
    quizAnswers:
      entry.quizAnswers && typeof entry.quizAnswers === "object" && !Array.isArray(entry.quizAnswers)
        ? structuredClone(entry.quizAnswers)
        : {},
    updatedAt: entry.updatedAt || ""
  };
}

function setCourseProgressEntry(course, memberId, entry) {
  course.contentProgress = course.contentProgress || {};
  course.contentProgress[memberId] = {
    lessonIds: Array.isArray(entry.lessonIds) ? [...new Set(entry.lessonIds)] : [],
    blockIds: Array.isArray(entry.blockIds) ? [...new Set(entry.blockIds)] : [],
    quizAnswers:
      entry.quizAnswers && typeof entry.quizAnswers === "object" && !Array.isArray(entry.quizAnswers)
        ? structuredClone(entry.quizAnswers)
        : {},
    updatedAt: new Date().toISOString()
  };
}

function getCourseQuizAnswer(course, memberId, blockId, questionIndex) {
  const entry = getCourseProgressEntry(course, memberId);
  return entry.quizAnswers?.[blockId]?.[String(questionIndex)] || "";
}

function setCourseQuizAnswer(course, memberId, blockId, questionIndex, answer) {
  const entry = getCourseProgressEntry(course, memberId);
  entry.quizAnswers = entry.quizAnswers && typeof entry.quizAnswers === "object" ? entry.quizAnswers : {};
  entry.quizAnswers[blockId] =
    entry.quizAnswers[blockId] && typeof entry.quizAnswers[blockId] === "object"
      ? entry.quizAnswers[blockId]
      : {};
  entry.quizAnswers[blockId][String(questionIndex)] = answer;
  setCourseProgressEntry(course, memberId, entry);
}

function getQuizBlockProgress(course, memberId, block) {
  const questions = Array.isArray(block?.questions) ? block.questions : [];
  const answers = questions.map((question, questionIndex) => ({
    answer: getCourseQuizAnswer(course, memberId, block.id, questionIndex),
    correctAnswer: question.correctAnswer || "",
    isCorrect:
      Boolean(getCourseQuizAnswer(course, memberId, block.id, questionIndex)) &&
      getCourseQuizAnswer(course, memberId, block.id, questionIndex) === (question.correctAnswer || "")
  }));
  const answered = answers.filter((item) => item.answer).length;
  const correct = answers.filter((item) => item.isCorrect).length;
  return {
    total: questions.length,
    answered,
    correct,
    complete: Boolean(questions.length) && correct === questions.length
  };
}

function getMemberCourseContentStats(course, memberId) {
  const lessons = getCourseLessonList(course);
  const blocks = getCourseBlockList(course);
  const entry = getCourseProgressEntry(course, memberId);
  const completedLessons = lessons.filter((lesson) => entry.lessonIds.includes(lesson.id)).length;
  const completedBlocks = blocks.filter((block) => entry.blockIds.includes(block.id)).length;
  const lessonProgress = lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0;
  const blockProgress = blocks.length ? Math.round((completedBlocks / blocks.length) * 100) : 0;

  return {
    lessonsTotal: lessons.length,
    lessonsCompleted: completedLessons,
    lessonProgress,
    blocksTotal: blocks.length,
    blocksCompleted: completedBlocks,
    blockProgress,
    updatedAt: entry.updatedAt
  };
}

function getLearnerCourseContentStats(course, memberId) {
  const lessons = getLearnerCourseLessonList(course);
  const blocks = getLearnerCourseBlockList(course);
  const entry = getCourseProgressEntry(course, memberId);
  const completedLessons = lessons.filter((lesson) => entry.lessonIds.includes(lesson.id)).length;
  const completedBlocks = blocks.filter((block) => entry.blockIds.includes(block.id)).length;
  const lessonProgress = lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0;
  const blockProgress = blocks.length ? Math.round((completedBlocks / blocks.length) * 100) : 0;

  return {
    lessonsTotal: lessons.length,
    lessonsCompleted: completedLessons,
    lessonProgress,
    blocksTotal: blocks.length,
    blocksCompleted: completedBlocks,
    blockProgress,
    updatedAt: entry.updatedAt
  };
}

function isMemberContentReadyForDiploma(course, memberId) {
  const entry = getCourseProgressEntry(course, memberId);
  const visibleBlocks = getLearnerCourseBlockList(course);
  if (!visibleBlocks.length) {
    return true;
  }

  const requiredBlocks = visibleBlocks.filter((block) => block.required);
  const targetBlocks = requiredBlocks.length ? requiredBlocks : visibleBlocks;
  return targetBlocks.every((block) => entry.blockIds.includes(block.id));
}

function getPrimaryMemberCourse(memberId) {
  if (!memberId) {
    return null;
  }

  const selectedCourse = state.courses.find(
    (course) =>
      course.id === state.selectedCourseId &&
      (course.enrolledIds.includes(memberId) || course.waitingIds.includes(memberId))
  );
  if (selectedCourse) {
    return selectedCourse;
  }

  return (
    state.courses.find((course) => course.enrolledIds.includes(memberId)) ||
    state.courses.find((course) => course.waitingIds.includes(memberId)) ||
    null
  );
}

function getMemberCourseBuckets(memberId) {
  const now = new Date();
  const ownCourses = state.courses.filter(
    (course) => course.enrolledIds.includes(memberId) || course.waitingIds.includes(memberId)
  );
  const sortedOwnCourses = [...ownCourses].sort((left, right) => {
    const leftDate = new Date(left.startDate || left.endDate || 0).getTime();
    const rightDate = new Date(right.startDate || right.endDate || 0).getTime();
    return rightDate - leftDate;
  });
  const closedCourses = sortedOwnCourses.filter((course) => {
    const endDate = course.endDate ? new Date(course.endDate) : null;
    return course.diplomaReady.includes(memberId) || course.status === "Cerrado" || Boolean(endDate && endDate < now);
  });
  const activeCourses = sortedOwnCourses.filter((course) => !closedCourses.some((item) => item.id === course.id));
  const enrollmentOpenCourses = state.courses.filter(
    (course) =>
      course.status === "Inscripcion abierta" &&
      !course.diplomaReady.includes(memberId) &&
      !course.enrolledIds.includes(memberId) &&
      !course.waitingIds.includes(memberId)
  );
  const upcomingCourses = state.courses.filter((course) => {
    const startDate = course.startDate ? new Date(course.startDate) : null;
    const isClosed = course.status === "Cerrado" || Boolean(course.endDate && new Date(course.endDate) < now);
    return (
      !course.diplomaReady.includes(memberId) &&
      !course.enrolledIds.includes(memberId) &&
      !course.waitingIds.includes(memberId) &&
      !isClosed &&
      course.status !== "Inscripcion abierta" &&
      Boolean(startDate && startDate >= now)
    );
  });

  return {
    ownCourses: sortedOwnCourses,
    activeCourses,
    closedCourses,
    historyCourses: closedCourses,
    timelineHistory: getMemberHistory(memberId),
    enrollmentOpenCourses,
    upcomingCourses
  };
}

function getNextLearnerStep(course, memberId) {
  const entry = getCourseProgressEntry(course, memberId);
  const modules = getLearnerCourseModules(course);

  for (const module of modules) {
    for (const lesson of module.lessons || []) {
      const lessonBlocks = lesson.blocks || [];
      const pendingRequiredBlocks = lessonBlocks.filter(
        (block) => block.required && !entry.blockIds.includes(block.id)
      );
      if (pendingRequiredBlocks.length) {
        return {
          moduleTitle: module.title || "Modulo",
          lessonTitle: lesson.title || "Leccion",
          lesson,
          block: pendingRequiredBlocks[0],
          kind: "required-block"
        };
      }

      const pendingBlocks = lessonBlocks.filter((block) => !entry.blockIds.includes(block.id));
      if (pendingBlocks.length) {
        return {
          moduleTitle: module.title || "Modulo",
          lessonTitle: lesson.title || "Leccion",
          lesson,
          block: pendingBlocks[0],
          kind: "block"
        };
      }

      if (!entry.lessonIds.includes(lesson.id)) {
        return {
          moduleTitle: module.title || "Modulo",
          lessonTitle: lesson.title || "Leccion",
          lesson,
          block: null,
          kind: "lesson"
        };
      }
    }
  }

  return null;
}

function getLearnerCourseJourney(course, memberId) {
  const member = findMember(memberId);
  const progress = getLearnerCourseContentStats(course, memberId);
  const attendance = course.attendance?.[memberId] ?? 0;
  const evaluation = course.evaluations?.[memberId] ?? "Pendiente";
  const enrolled = course.enrolledIds.includes(memberId);
  const waiting = course.waitingIds.includes(memberId);
  const hasDiploma = course.diplomaReady.includes(memberId);
  const contentReady = isMemberContentReadyForDiploma(course, memberId);
  const feedbackSubmitted = Boolean(getCourseFeedbackResponse(course, memberId));
  const hasDocumentId = hasMemberDocumentId(member);
  const nextStep = getNextLearnerStep(course, memberId);
  const pendingSteps = [];

  if (hasDiploma) {
    return {
      attendance,
      evaluation,
      enrolled,
      waiting,
      hasDiploma,
      contentReady: true,
      feedbackSubmitted,
      hasDocumentId,
      progress,
      nextStep: null,
      pendingSteps: []
    };
  }

  if (!enrolled && !waiting) {
    pendingSteps.push("inscribirte en el curso");
    return {
      attendance,
      evaluation,
      enrolled,
      waiting,
      hasDiploma,
      contentReady,
      feedbackSubmitted,
      hasDocumentId,
      progress,
      nextStep: null,
      pendingSteps
    };
  }

  if (waiting) {
    pendingSteps.push("esperar confirmacion de plaza");
    return {
      attendance,
      evaluation,
      enrolled,
      waiting,
      hasDiploma,
      contentReady,
      feedbackSubmitted,
      hasDocumentId,
      progress,
      nextStep: null,
      pendingSteps
    };
  }
  if (attendance < 75) {
    pendingSteps.push(`alcanzar 75% de asistencia (actual: ${attendance}%)`);
  }
  if (String(evaluation).toLowerCase() !== "apto") {
    pendingSteps.push(`cerrar evaluacion como apto (actual: ${evaluation})`);
  }
  if (!contentReady) {
    pendingSteps.push(
      nextStep?.block
        ? `completar ${nextStep.block.title || nextStep.lessonTitle}`
        : "completar el contenido pendiente"
    );
  }
  if (!hasDocumentId) {
    pendingSteps.push("completar tu DNI/NIE en la ficha de socio");
  }
  if (course.feedbackEnabled && course.feedbackRequiredForDiploma && !feedbackSubmitted) {
    pendingSteps.push("enviar la valoracion final del curso");
  }

  return {
    attendance,
    evaluation,
    enrolled,
    waiting,
    hasDiploma,
    contentReady,
    feedbackSubmitted,
    hasDocumentId,
    progress,
    nextStep,
    pendingSteps
  };
}

function renderLearnerJourneyCard(course, memberId, options = {}) {
  const journey = getLearnerCourseJourney(course, memberId);
  const compact = Boolean(options.compact);
  const allowProgressActions =
    !isMemberPreviewSession() && session?.role === "member" && session?.memberId === memberId;
  const nextBlock = journey.nextStep?.block || null;
  const headline = journey.hasDiploma
    ? "Diploma disponible"
    : !journey.enrolled && !journey.waiting
      ? "Pendiente de inscripcion"
    : journey.waiting
      ? "Pendiente de plaza"
      : journey.nextStep?.block
        ? escapeHtml(journey.nextStep.block.title || journey.nextStep.lessonTitle)
        : journey.nextStep?.lessonTitle
          ? escapeHtml(journey.nextStep.lessonTitle)
          : "Curso completado";
  const summaryText = journey.hasDiploma
    ? "Ya has completado los hitos del curso y tu diploma puede descargarse."
    : !journey.enrolled && !journey.waiting
      ? "Todavia no estas inscrito en este curso. Puedes revisarlo y apuntarte si la inscripcion esta abierta."
      : journey.waiting
        ? "Tu solicitud esta en lista de espera. En cuanto se libere plaza, podras continuar."
        : journey.nextStep
          ? `${escapeHtml(journey.nextStep.moduleTitle)} | ${escapeHtml(journey.nextStep.lessonTitle)}`
          : "No quedan bloques pendientes en el aula publicada.";
  const progressText = `Contenido ${journey.progress.blockProgress}% | ${journey.progress.blocksCompleted}/${journey.progress.blocksTotal} bloques | Asistencia ${journey.attendance}% | Evaluacion ${escapeHtml(journey.evaluation)}`;
  const feedbackText = course.feedbackEnabled
    ? `${journey.feedbackSubmitted ? "Valoracion enviada" : course.feedbackRequiredForDiploma ? "Valoracion pendiente y requerida para el diploma" : "Valoracion pendiente"}`
    : "";
  const documentText = !journey.hasDocumentId
    ? "Falta tu DNI/NIE en la ficha y es necesario para emitir el diploma."
    : "";
  const pendingText = journey.pendingSteps.length
    ? journey.pendingSteps.join(" | ")
    : "";

  return `
    <div class="timeline-item">
      <span class="eyebrow">${compact ? "Siguiente paso" : "Ruta personal"}</span>
      <strong>${headline}</strong>
      <p class="muted">${summaryText}</p>
      ${!compact ? `<p class="muted">${progressText}</p>` : ""}
      ${
        !compact && feedbackText
          ? `<p class="muted"><strong>Valoracion final:</strong> ${feedbackText}</p>`
          : ""
      }
      ${
        !compact && documentText
          ? `<p class="muted"><strong>Documento:</strong> ${documentText}</p>`
          : ""
      }
      ${
        compact && (pendingText || feedbackText || documentText)
          ? `<p class="muted"><strong>Te falta:</strong> ${escapeHtml([pendingText, feedbackText && !journey.feedbackSubmitted ? feedbackText : "", documentText].filter(Boolean).join(" | "))}</p>`
          : ""
      }
      ${
        !compact && pendingText
          ? `<p class="muted"><strong>Te falta:</strong> ${escapeHtml(pendingText)}</p>`
          : ""
      }
      <div class="chip-row">
        <button class="primary-button" type="button" data-action="${journey.hasDiploma ? "set-campus-section-mode" : journey.enrolled ? "open-course-workbench-tab" : "select-course"}" ${journey.hasDiploma ? 'data-mode="diplomas"' : `data-course-id="${course.id}" ${journey.enrolled ? 'data-mode="learner"' : ""}`}>${journey.hasDiploma ? "Ir a Mis diplomas" : journey.enrolled ? "Entrar al aula" : journey.waiting ? "Ver estado de matricula" : "Ver curso"}</button>
        ${
          !journey.enrolled && !journey.waiting && String(course.status || "") === "Inscripcion abierta" && !isMemberPreviewSession()
            ? `<button class="ghost-button" type="button" data-action="${isCourseOpenForEnrollment(course) ? "prepare-course-enrollment" : "select-course"}" data-course-id="${course.id}">${escapeHtml(isCourseOpenForEnrollment(course) ? getCourseEnrollmentCall(course).ctaLabel : "Ver apertura")}</button>`
            : ""
        }
        ${
          nextBlock?.url && !journey.hasDiploma
            ? `<a class="ghost-button" href="${escapeHtml(nextBlock.url)}" target="_blank" rel="noreferrer">Abrir recurso</a>`
            : ""
        }
        ${
          allowProgressActions && nextBlock
            ? `<button class="ghost-button" type="button" data-action="toggle-block-complete" data-course-id="${course.id}" data-member-id="${memberId}" data-lesson-id="${journey.nextStep.lesson.id}" data-block-id="${nextBlock.id}">Marcar bloque hecho</button>`
            : ""
        }
      </div>
    </div>
  `;
}

function getCourseFeedbackResponse(course, memberId) {
  return (course.feedbackResponses || []).find((response) => response.memberId === memberId) || null;
}

function getCourseEnrollmentSubmission(course, memberId) {
  return (course.enrollmentSubmissions || []).find((submission) => submission.memberId === memberId) || null;
}

function getEnrollmentSubmissionStatusLabel(status) {
  switch (String(status || "").toLowerCase()) {
    case "confirmed":
      return "Confirmada";
    case "pending-review":
      return "Pendiente de revision";
    case "pending-proof":
      return "Pendiente de justificante";
    case "waiting":
      return "En lista de espera";
    case "rejected":
      return "Rechazada";
    default:
      return status || "Pendiente";
  }
}

function getEnrollmentSubmissionTone(status) {
  switch (String(status || "").toLowerCase()) {
    case "confirmed":
      return "success";
    case "pending-review":
    case "pending-proof":
    case "waiting":
      return "warning";
    case "rejected":
      return "danger";
    default:
      return "neutral";
  }
}

function getCourseSeatsLeft(course) {
  return Math.max(0, Number(course?.capacity || 0) - Number((course?.enrolledIds || []).length));
}

function getCourseEnrollmentOpensAtTimestamp(course) {
  const raw = String(course?.enrollmentOpensAt || "").trim();
  if (!raw) {
    return null;
  }
  const timestamp = new Date(raw).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function hasCourseScheduledEnrollment(course) {
  return getCourseEnrollmentOpensAtTimestamp(course) !== null;
}

function isCourseEnrollmentWindowOpen(course) {
  const timestamp = getCourseEnrollmentOpensAtTimestamp(course);
  return timestamp === null || timestamp <= Date.now();
}

function getCourseEnrollmentOpensAtLabel(course) {
  const raw = String(course?.enrollmentOpensAt || "").trim();
  return raw ? formatDateTime(raw) : "";
}

function isCourseOpenForEnrollment(course) {
  return String(course?.status || "") === "Inscripcion abierta" && isCourseEnrollmentWindowOpen(course);
}

function getCourseEnrollmentCall(course) {
  const seatsLeft = getCourseSeatsLeft(course);
  const scheduledMode = String(course?.status || "") === "Inscripcion abierta" && !isCourseEnrollmentWindowOpen(course);
  const waitlistMode = isCourseOpenForEnrollment(course) && seatsLeft <= 0;
  const enrolledCount = getCourseEnrolledCount(course);
  const waitingCount = getCourseWaitingCount(course);
  const accessScope = normalizeCourseAccessScope(course.accessScope, course.audience);
  const audienceLabel = COURSE_ACCESS_SCOPE_LABELS[accessScope] || "Solo socios";
  const opensAtLabel = getCourseEnrollmentOpensAtLabel(course);
  const audienceHint =
    accessScope === "public"
      ? "Este curso admite inscripcion de socios y tambien de participantes externos con acceso solo campus."
      : "Este curso esta reservado a personas socias con ficha activa dentro de la asociacion.";
  return {
    seatsLeft,
    scheduledMode,
    waitlistMode,
    enrolledCount,
    waitingCount,
    audienceLabel,
    audienceHint,
    opensAtLabel,
    statusLabel: scheduledMode
      ? `Abre el ${opensAtLabel}`
      : waitlistMode
        ? "Lista de espera"
        : seatsLeft === 1
          ? "1 plaza libre"
          : `${seatsLeft} plazas libres`,
    ctaLabel: scheduledMode ? "Inscripcion programada" : waitlistMode ? "Apuntarme a la lista de espera" : "Inscribirme ahora",
    panelTitle: scheduledMode ? "Apertura programada" : waitlistMode ? "Lista de espera activa" : "Inscripcion abierta",
    urgencyLabel: scheduledMode ? "Apertura programada" : waitlistMode ? "Curso completo" : seatsLeft <= 3 ? "Ultimas plazas" : "Plazas disponibles",
    helperLabel: scheduledMode
      ? `La inscripcion se abrira el ${opensAtLabel}. Hasta entonces el curso seguira visible, pero no aceptara solicitudes.`
      : waitlistMode
        ? "Si el curso esta completo, tu solicitud queda en espera y se mueve automaticamente cuando se libera una plaza."
        : seatsLeft > 0
          ? `${seatsLeft} plaza(s) disponible(s) ahora mismo para socios.`
          : "La inscripcion esta cerrada en este momento.",
    occupancyLabel: `${enrolledCount}/${Number(course?.capacity || 0)} plazas cubiertas${waitingCount ? ` · ${waitingCount} en espera` : ""}`,
    paymentLabel: Number(course?.enrollmentFee || 0) > 0 ? `${Number(course.enrollmentFee || 0)} € por transferencia` : "Sin coste"
  };
}

function renderStoredProofLink(proof, label = "Abrir justificante") {
  if (!proof || !proof.contentBase64) {
    return "";
  }
  const mimeType = proof.type || "application/octet-stream";
  return `<a class="mini-button" target="_blank" rel="noreferrer" href="data:${escapeHtml(mimeType)};base64,${proof.contentBase64}">${label}</a>`;
}

function hasCampusAttachment(attachment) {
  return Boolean(attachment && (attachment.contentBase64 || attachment.transportUrl));
}

function dataUrlToBlob(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("No se pudo leer el documento.");
  }
  const contentType = match[1] || "application/octet-stream";
  const byteString = atob(match[2]);
  const bytes = new Uint8Array(byteString.length);
  for (let index = 0; index < byteString.length; index += 1) {
    bytes[index] = byteString.charCodeAt(index);
  }
  return new Blob([bytes], { type: contentType });
}

function getCampusAttachmentHref(attachment, options = {}) {
  if (!attachment) {
    return "";
  }
  if (attachment.contentBase64) {
    const mimeType = attachment.type || "application/octet-stream";
    return `data:${escapeHtml(mimeType)};base64,${attachment.contentBase64}`;
  }
  const baseUrl = String(attachment.transportUrl || "").trim();
  if (!baseUrl) {
    return "";
  }
  if (!options.download) {
    return baseUrl;
  }
  return baseUrl.includes("?") ? `${baseUrl}&download=1` : `${baseUrl}?download=1`;
}

function getCampusAttachmentDataHref(attachment) {
  if (!attachment || !attachment.contentBase64) {
    return getCampusAttachmentHref(attachment);
  }
  const mimeType = attachment.type || "application/octet-stream";
  return `data:${escapeHtml(mimeType)};base64,${attachment.contentBase64}`;
}

function getCampusGroupCategoryLabel(category) {
  switch (category) {
    case "documents":
      return "Documento interno";
    case "practiceSheets":
      return "Ficha de practica";
    case "videos":
      return "Video";
    case "links":
      return "Enlace de interes";
    default:
      return "Recurso";
  }
}

function getCampusGroupCategoryIcon(category) {
  switch (category) {
    case "documents":
      return "PDF";
    case "practiceSheets":
      return "GUIA";
    case "videos":
      return "VIDEO";
    case "links":
      return "LINK";
    default:
      return "FILE";
  }
}

function getCampusGroupResourceMeta(entry, category, attachment) {
  if (attachment?.name) {
    return attachment.name;
  }
  if (entry?.url) {
    try {
      return new URL(entry.url).hostname.replace(/^www\./, "");
    } catch (error) {
      return entry.url;
    }
  }
  return getCampusGroupCategoryLabel(category);
}

function entryMatchesCampusGroupQuery(entry, category, query) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }
  const haystack = [
    entry?.title,
    entry?.note,
    entry?.url,
    entry?.attachment?.name,
    getCampusGroupCategoryLabel(category),
    getCampusGroupResourceMeta(entry, category, entry?.attachment)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(normalizedQuery);
}

function entryMatchesCampusGroupResourceFilter(entry, filter) {
  if (filter === "with-attachment") {
    return hasCampusAttachment(entry?.attachment);
  }
  if (filter === "links-only") {
    return !hasCampusAttachment(entry?.attachment) && Boolean(entry?.url);
  }
  return true;
}

function sortCampusGroupEntries(entries = []) {
  return [...entries].sort((left, right) => {
    const leftAttachment = hasCampusAttachment(left?.attachment) ? 1 : 0;
    const rightAttachment = hasCampusAttachment(right?.attachment) ? 1 : 0;
    if (leftAttachment !== rightAttachment) {
      return rightAttachment - leftAttachment;
    }

    const leftUrl = left?.url ? 1 : 0;
    const rightUrl = right?.url ? 1 : 0;
    if (leftUrl !== rightUrl) {
      return rightUrl - leftUrl;
    }

    const leftTitle = String(left?.title || "").trim().toLowerCase();
    const rightTitle = String(right?.title || "").trim().toLowerCase();
    return leftTitle.localeCompare(rightTitle, "es");
  });
}

function isCampusAttachmentPreviewable(attachment) {
  if (!attachment) {
    return false;
  }
  const mimeType = String(attachment.type || "").toLowerCase();
  const name = String(attachment.name || "").toLowerCase();
  return (
    mimeType === "application/pdf" ||
    mimeType.startsWith("image/") ||
    mimeType.startsWith("text/") ||
    mimeType.includes("powerpoint") ||
    mimeType.includes("presentation") ||
    mimeType.includes("msword") ||
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("spreadsheetml") ||
    mimeType.includes("excel") ||
    mimeType.includes("officedocument") ||
    mimeType.includes("json") ||
    mimeType.includes("svg") ||
    name.endsWith(".pdf") ||
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".json") ||
    name.endsWith(".svg") ||
    name.endsWith(".ppt") ||
    name.endsWith(".pptx") ||
    name.endsWith(".odp") ||
    name.endsWith(".key") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp") ||
    name.endsWith(".gif")
  );
}

function getCampusAttachmentPreviewKind(attachment) {
  const mimeType = String(attachment?.type || "").toLowerCase();
  const name = String(attachment?.name || "").toLowerCase();
  if (mimeType === "application/pdf" || name.endsWith(".pdf")) {
    return "pdf";
  }
  if (mimeType.startsWith("image/") || [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].some((ext) => name.endsWith(ext))) {
    return "image";
  }
  if (
    mimeType.includes("powerpoint") ||
    mimeType.includes("presentation") ||
    mimeType.includes("msword") ||
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("spreadsheetml") ||
    mimeType.includes("excel") ||
    mimeType.includes("officedocument") ||
    [".ppt", ".pptx", ".pps", ".ppsx", ".doc", ".docx", ".xls", ".xlsx"].some((ext) => name.endsWith(ext))
  ) {
    return "office";
  }
  if (
    mimeType === "application/pdf" ||
    mimeType.startsWith("text/") ||
    mimeType.includes("json") ||
    [".pdf", ".txt", ".md", ".csv", ".json"].some((ext) => name.endsWith(ext))
  ) {
    return "document";
  }
  return "external";
}

function buildCampusPdfViewerUrl(src, name) {
  const params = new URLSearchParams();
  params.set("src", src);
  params.set("name", name || "Documento PDF");
  return `/pdf-viewer.html?${params.toString()}`;
}

function buildOfficeViewerUrl(src) {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
    return "";
  }
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(src)}`;
}

async function ensureCampusPdfJs() {
  if (!campusPdfJsPromise) {
    campusPdfJsPromise = import("/vendor/pdfjs/pdf.mjs").then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.mjs";
      return pdfjsLib;
    });
  }
  return campusPdfJsPromise;
}

async function mountCampusAttachmentPreview() {
  const preview = campusAttachmentPreview;
  const mountNode = document.getElementById("campusPreviewMount");
  if (!preview?.src || !mountNode || preview.kind !== "pdf") {
    return;
  }

  const renderToken = ++campusPreviewRenderToken;
  mountNode.innerHTML = `<div class="campus-preview-state">Cargando PDF...</div>`;

  try {
    const pdfjsLib = await ensureCampusPdfJs();
    const pdf = await pdfjsLib
      .getDocument({
        url: preview.src,
        withCredentials: true
      })
      .promise;
    if (renderToken !== campusPreviewRenderToken || campusAttachmentPreview !== preview) {
      return;
    }

    const pagesMarkup = document.createElement("div");
    pagesMarkup.className = "campus-preview-pages";
    mountNode.innerHTML = "";
    mountNode.appendChild(pagesMarkup);

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      if (renderToken !== campusPreviewRenderToken || campusAttachmentPreview !== preview) {
        return;
      }
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.2 });
      const pageCard = document.createElement("section");
      pageCard.className = "campus-preview-page";

      const meta = document.createElement("p");
      meta.className = "campus-preview-page-meta";
      meta.textContent = `Pagina ${pageNumber} de ${pdf.numPages}`;

      const canvas = document.createElement("canvas");
      canvas.className = "campus-preview-canvas";
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      pageCard.appendChild(meta);
      pageCard.appendChild(canvas);
      pagesMarkup.appendChild(pageCard);

      await page.render({
        canvasContext: context,
        viewport
      }).promise;
    }
  } catch (error) {
    if (renderToken !== campusPreviewRenderToken) {
      return;
    }
    mountNode.innerHTML = `<div class="campus-preview-state">No se ha podido renderizar el PDF en el visor interno.</div>`;
    console.error(error);
  }
}

function renderCampusAttachmentPreviewModal() {
  if (!campusAttachmentPreview?.src) {
    return "";
  }
  const previewName = escapeHtml(campusAttachmentPreview.name || "Recurso");
  const previewSrc = escapeHtml(campusAttachmentPreview.src);
  const kind = campusAttachmentPreview.kind || "document";
  const pdfViewerHref =
    kind === "pdf"
      ? escapeHtml(
          buildCampusPdfViewerUrl(campusAttachmentPreview.src, campusAttachmentPreview.name)
        )
      : "";
  const officeViewerHref = kind === "office" ? buildOfficeViewerUrl(campusAttachmentPreview.src) : "";
  const openHref = kind === "pdf" ? pdfViewerHref : previewSrc;
  const previewBody =
    kind === "image"
      ? `<img class="campus-preview-image" src="${previewSrc}" alt="${previewName}" />`
      : kind === "pdf"
      ? `<iframe class="campus-preview-frame campus-preview-pdf-frame" src="${pdfViewerHref}" title="${previewName}"></iframe>`
      : kind === "office" && officeViewerHref
      ? `<iframe class="campus-preview-frame campus-preview-office-frame" src="${escapeHtml(officeViewerHref)}" title="${previewName}"></iframe>`
      : kind === "office"
      ? `<div class="campus-preview-state">
          No se ha podido abrir la vista previa de este documento.
          <div class="chip-row">
            <a class="mini-button" target="_blank" rel="noreferrer" href="${previewSrc}">Abrir archivo</a>
            <a class="mini-button" download="${previewName}" href="${previewSrc}">Descargar</a>
          </div>
        </div>`
      : kind === "external"
      ? `<div class="campus-preview-state">
          Este formato no se puede previsualizar aqui. Usa "Abrir en pestaña" o descarga el archivo para verlo.
          <div class="chip-row">
            <a class="mini-button" target="_blank" rel="noreferrer" href="${previewSrc}">Abrir archivo</a>
            <a class="mini-button" download="${previewName}" href="${previewSrc}">Descargar</a>
          </div>
        </div>`
      : `<iframe class="campus-preview-frame" src="${previewSrc}" title="${previewName}"></iframe>`;
  return `
    <div class="campus-preview-overlay">
      <button class="campus-preview-backdrop" type="button" data-action="close-campus-attachment-preview" aria-label="Cerrar vista previa"></button>
      <div class="campus-preview-dialog" role="dialog" aria-modal="true" aria-label="${previewName}">
        <div class="campus-preview-header">
          <div>
            <p class="eyebrow">Vista previa</p>
            <strong>${previewName}</strong>
          </div>
          <div class="chip-row compact-chip-row">
            <a class="mini-button" target="_blank" rel="noreferrer" href="${openHref}">Abrir en pestaña</a>
            <button class="mini-button" type="button" data-action="close-campus-attachment-preview">Cerrar</button>
          </div>
        </div>
        <div class="campus-preview-body">
          ${previewBody}
        </div>
      </div>
    </div>
  `;
}

function clearCampusAttachmentPreview() {
  campusPreviewRenderToken += 1;
  if (campusAttachmentPreview?.objectUrl) {
    try {
      URL.revokeObjectURL(campusAttachmentPreview.objectUrl);
    } catch (error) {
      // Ignore revoke errors for stale object URLs.
    }
  }
  campusAttachmentPreview = null;
}

function renderCampusGroupAttachmentLink(attachment, label = "Descargar archivo") {
  if (!hasCampusAttachment(attachment)) {
    return "";
  }
  return `<a class="mini-button" target="_blank" rel="noreferrer" download="${escapeHtml(attachment.name || "recurso")}" href="${getCampusAttachmentHref(attachment, { download: true })}">${label}</a>`;
}

function renderCampusGroupAttachmentActions(attachment) {
  if (!hasCampusAttachment(attachment)) {
    return "";
  }
  const previewKind = getCampusAttachmentPreviewKind(attachment);
  const previewButton = isCampusAttachmentPreviewable(attachment)
    ? previewKind === "external"
      ? `<a class="mini-button" target="_blank" rel="noreferrer" href="${getCampusAttachmentHref(attachment)}">Ver online</a>`
      : `<button class="mini-button" type="button" data-action="preview-campus-attachment" data-preview-src="${escapeHtml(
          getCampusAttachmentHref(attachment)
        )}" data-preview-name="${escapeHtml(attachment.name || "Recurso")}" data-preview-kind="${escapeHtml(previewKind)}">Ver online</button>`
    : "";
  const downloadButton = renderCampusGroupAttachmentLink(attachment, "Descargar");
  return `<span class="chip-row compact-chip-row">${previewButton}${downloadButton}</span>`;
}

function getCourseFeedbackSummary(course) {
  const responses = course.feedbackResponses || [];
  const average = (key) => {
    const values = responses
      .map((response) => Number(response[key] || 0))
      .filter((value) => Number.isFinite(value) && value > 0);
    return values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1) : "-";
  };

  return {
    total: responses.length,
    activityAverage: average("activityScore"),
    teachingAverage:
      responses.length
        ? (
            responses
              .map((response) =>
                ["teacherClarityScore", "teacherUsefulnessScore", "teacherSupportScore"].reduce(
                  (sum, key) => sum + Number(response[key] || 0),
                  0
                ) / 3
              )
              .reduce((sum, value) => sum + value, 0) / responses.length
          ).toFixed(1)
        : "-",
    recommendationAverage: average("recommendationScore")
  };
}

function renderCourseFeedbackForm(course, memberId, options = {}) {
  const response = getCourseFeedbackResponse(course, memberId);
  const previewOnly = Boolean(options.previewOnly);
  const disabledAttr = previewOnly ? "disabled" : "";
  const scoreOptions = [1, 2, 3, 4, 5];

  return `
    <div class="content-module">
      <div class="module-head">
        <div>
          <p class="eyebrow">Valoracion final</p>
          <h4>Actividad formativa y docentes</h4>
          <p class="muted">Completa este cuestionario al cerrar el curso para valorar la actividad, la organizacion y la labor docente.</p>
        </div>
        <div class="chip-row">
          <span class="small-chip">${response ? "Ya enviada" : "Pendiente"}</span>
          ${
            course.feedbackTeachers?.length
              ? `<span class="small-chip">${escapeHtml(course.feedbackTeachers.join(" | "))}</span>`
              : ""
          }
        </div>
      </div>
      ${
        previewOnly
          ? `
            <div class="status-note warning learner-preview-warning">
              Esta es solo una vista previa del alumno desde administracion. Aqui no se guardan respuestas reales.
              ${
                isAdminSession()
                  ? `<p><button class="ghost-button" type="button" data-action="switch-to-member-self">Cambiar a Mi perfil socio y alumno</button></p>`
                  : ""
              }
            </div>
          `
          : ""
      }
      <form id="courseFeedbackForm" class="stack">
        <input type="hidden" id="courseFeedbackCourseId" value="${escapeHtml(course.id)}" />
        <div class="studio-grid">
          ${[
            ["activity", "Valoracion global de la actividad", response?.activityScore || 5],
            ["contents", "Calidad de contenidos y materiales", response?.contentsScore || 5],
            ["organization", "Organizacion y desarrollo", response?.organizationScore || 5],
            ["teacherClarity", "Claridad del docente", response?.teacherClarityScore || 5],
            ["teacherUsefulness", "Utilidad de explicaciones y correcciones", response?.teacherUsefulnessScore || 5],
            ["teacherSupport", "Acompanamiento y resolucion de dudas", response?.teacherSupportScore || 5],
            ["recommendation", "Recomendarias esta formacion", response?.recommendationScore || 5]
          ]
            .map(
              ([key, label, selected]) => `
                <label class="inline-field">
                  ${label}
                  <select id="courseFeedback${key}" ${disabledAttr}>
                    ${scoreOptions
                      .map((value) => `<option value="${value}" ${Number(selected) === value ? "selected" : ""}>${value}/5</option>`)
                      .join("")}
                  </select>
                </label>
              `
            )
            .join("")}
          <label class="inline-field studio-full">
            Comentario sobre la actividad
            <textarea id="courseFeedbackComment" ${disabledAttr} placeholder="Que te ha resultado mas util, que mejorarias, que te ha faltado...">${escapeHtml(response?.comment || "")}</textarea>
          </label>
          <label class="inline-field studio-full">
            Comentario sobre el equipo docente
            <textarea id="courseFeedbackTeacherComment" ${disabledAttr} placeholder="Valora claridad, acompanamiento, dinamica o propuestas de mejora.">${escapeHtml(response?.teacherComment || "")}</textarea>
          </label>
        </div>
        ${
          previewOnly
            ? `<p class="muted">Vista previa de alumno: este formulario esta bloqueado porque estas viendo el aula desde administracion.</p>`
            : `<div class="chip-row"><button class="primary-button" type="submit">${response ? "Actualizar valoracion" : "Enviar valoracion"}</button></div>`
        }
      </form>
    </div>
  `;
}

function renderCourseFeedbackSummary(course) {
  const summary = getCourseFeedbackSummary(course);
  const responses = course.feedbackResponses || [];

  return `
    <div class="content-module">
      <div class="module-head">
        <div>
          <p class="eyebrow">Valoracion del curso</p>
          <h4>Encuesta de actividad y docentes</h4>
          <p class="muted">Resumen de respuestas del alumnado para medir calidad de la actividad y del equipo docente.</p>
        </div>
        <div class="chip-row">
          <span class="small-chip">${course.feedbackEnabled ? "Activa" : "Desactivada"}</span>
          <span class="small-chip">${summary.total} respuesta(s)</span>
        </div>
      </div>
      <div class="status-note info">
        Actividad ${summary.activityAverage} · Docencia ${summary.teachingAverage} · Recomendacion ${summary.recommendationAverage} · Cierre ${course.feedbackRequiredForDiploma ? "requerido para diploma" : "opcional"}.
      </div>
      <div class="studio-grid">
          <label class="inline-field">
            Encuesta activa
            <select id="editCourseFeedbackEnabled">
              <option value="true" ${course.feedbackEnabled ? "selected" : ""}>Si</option>
              <option value="false" ${!course.feedbackEnabled ? "selected" : ""}>No</option>
            </select>
          </label>
          <label class="inline-field">
            Requerir para diploma
            <select id="editCourseFeedbackRequired">
              <option value="false" ${!course.feedbackRequiredForDiploma ? "selected" : ""}>No</option>
              <option value="true" ${course.feedbackRequiredForDiploma ? "selected" : ""}>Si</option>
            </select>
          </label>
        <label class="inline-field studio-full">
          Docentes a valorar
          <textarea id="editCourseFeedbackTeachers" placeholder="Uno por linea">${escapeHtml(serializeTextareaList(course.feedbackTeachers || []))}</textarea>
        </label>
      </div>
      ${
        responses.length
          ? `
            <div class="lesson-stack">
              ${responses
                .slice()
                .reverse()
                .map((response) => {
                  const member = findMember(response.memberId);
                  return `
                    <article class="lesson-card compact-panel">
                      <div class="module-head">
                        <div>
                          <p class="eyebrow">${escapeHtml(formatDate(response.submittedAt))}</p>
                          <h4>${escapeHtml(member?.name || "Alumno")}</h4>
                        </div>
                        <span class="small-chip">${Number(response.activityScore || 0)}/5</span>
                      </div>
                      <p class="muted"><strong>Actividad:</strong> ${response.activityScore}/5 | <strong>Contenidos:</strong> ${response.contentsScore}/5 | <strong>Organizacion:</strong> ${response.organizationScore}/5</p>
                      <p class="muted"><strong>Docencia:</strong> ${response.teacherClarityScore}/5 · ${response.teacherUsefulnessScore}/5 · ${response.teacherSupportScore}/5 | <strong>Recomendacion:</strong> ${response.recommendationScore}/5</p>
                      ${response.comment ? `<p class="muted"><strong>Actividad:</strong> ${escapeHtml(response.comment)}</p>` : ""}
                      ${response.teacherComment ? `<p class="muted"><strong>Docentes:</strong> ${escapeHtml(response.teacherComment)}</p>` : ""}
                    </article>
                  `;
                })
                .join("")}
            </div>
          `
          : `<div class="empty-state">Todavia no hay valoraciones enviadas por el alumnado.</div>`
      }
    </div>
  `;
}

function renderMemberCourseListSection(title, description, courses, options = {}) {
  const emptyMessage = options.emptyMessage || "No hay cursos en este bloque.";
  const role = options.role || "member";
  return `
    <div class="mail-card">
      <h4>${escapeHtml(title)}</h4>
      <p class="muted">${escapeHtml(description)}</p>
      ${
        courses.length
          ? `<div class="course-list">${courses.map((course) => renderCourseCard(course, role)).join("")}</div>`
          : `<p class="muted">${escapeHtml(emptyMessage)}</p>`
      }
    </div>
  `;
}

function renderCompactCourseCard(course, role = "member") {
  const currentMemberId = state.selectedMemberId;
  const isEnrolled = currentMemberId && course.enrolledIds.includes(currentMemberId);
  const isWaiting = currentMemberId && course.waitingIds.includes(currentMemberId);
  const hasDiploma = currentMemberId && course.diplomaReady.includes(currentMemberId);
  const enrollmentCall = role === "member" ? getCourseEnrollmentCall(course) : null;
  const accessScopeLabel = COURSE_ACCESS_SCOPE_LABELS[normalizeCourseAccessScope(course.accessScope, course.audience)] || "Solo socios";
  const canEnroll =
      role === "member" &&
      !hasDiploma &&
      !isEnrolled &&
      !isWaiting &&
      isCourseOpenForEnrollment(course) &&
      !isMemberPreviewSession();
  const primaryAction =
        role === "member"
          ? hasDiploma
            ? "Ir a Mis diplomas"
            : isEnrolled
            ? "Entrar al aula"
            : isWaiting
              ? "Ver solicitud"
            : canEnroll
              ? enrollmentCall.ctaLabel
              : enrollmentCall?.scheduledMode
                ? "Ver apertura"
              : "Ver curso"
        : "Gestionar";
  const courseMetaChips = [
    formatDate(course.startDate),
    `${course.hours} h`,
    `${course.capacity} plazas`
  ];
  if (course.enrollmentFee > 0) {
    courseMetaChips.push(`${course.enrollmentFee} €`);
  }
  if (role === "member" && hasDiploma) {
    courseMetaChips.push("Diploma disponible");
  } else if (role === "member" && isWaiting) {
    courseMetaChips.push("En espera");
  } else if (role === "member" && isEnrolled) {
    courseMetaChips.push("Dentro del curso");
  } else if (role === "member" && course.status === "Inscripcion abierta") {
    courseMetaChips.push(enrollmentCall.statusLabel);
  }

  return `
    <article class="compact-course-card ${isEnrolled ? "compact-course-card-active" : ""}">
      ${
        role === "member" && String(course.status || "") === "Inscripcion abierta" && !hasDiploma && !isEnrolled && !isWaiting
          ? `
            <button class="quick-enroll-banner ${enrollmentCall.waitlistMode ? "quick-enroll-banner-waiting" : ""}" data-action="${canEnroll ? "prepare-course-enrollment" : "select-course"}" data-course-id="${course.id}">
              <span class="eyebrow">${escapeHtml(enrollmentCall.panelTitle)}</span>
              <strong>${escapeHtml(canEnroll ? enrollmentCall.ctaLabel : enrollmentCall.statusLabel)}</strong>
              <span>${escapeHtml(enrollmentCall.statusLabel)}${course.enrollmentFee > 0 ? ` · ${course.enrollmentFee} €` : ""} · ${escapeHtml(enrollmentCall.audienceLabel)}</span>
            </button>
          `
          : ""
      }
      <div class="row-between">
        <span class="small-chip">${escapeHtml(describeCourseType(course))}</span>
        <div class="chip-row compact-chip-row">
          <span class="small-chip">${escapeHtml(accessScopeLabel)}</span>
          <span class="small-chip">${escapeHtml(course.status)}</span>
          ${role === "member" && String(course.status || "") === "Inscripcion abierta" && !hasDiploma ? `<span class="small-chip">${escapeHtml(enrollmentCall.occupancyLabel)}</span>` : ""}
        </div>
      </div>
      <strong>${escapeHtml(course.title)}</strong>
      <p class="muted compact-course-summary">${escapeHtml(course.summary || (normalizeCourseClass(course.courseClass) === "practico" ? "Curso practico con documentacion, seguimiento y certificado final." : "Curso del campus con contenido, sesiones y certificado final."))}</p>
      <div class="compact-course-meta compact-course-meta-chips">
        ${courseMetaChips.map((item) => `<span class="small-chip">${escapeHtml(item)}</span>`).join("")}
      </div>
      <div class="compact-course-footer">
        <div class="chip-row">
          <button class="primary-button" data-action="${
              role === "member" && hasDiploma
              ? "set-campus-section-mode"
              : role === "member" && isEnrolled
              ? "open-course-workbench-tab"
              : role === "member" && isWaiting
                ? "select-course"
              : canEnroll
                ? "prepare-course-enrollment"
                : role === "member" && enrollmentCall?.scheduledMode
                  ? "select-course"
                : "select-course"
          }" data-course-id="${course.id}" ${role === "member" && hasDiploma ? 'data-mode="diplomas"' : role === "member" && isEnrolled ? 'data-mode="learner"' : role === "member" && isWaiting ? 'data-mode="status"' : ""}>${primaryAction}</button>
          ${
            canEnroll
              ? `<button class="ghost-button" data-action="select-course" data-course-id="${course.id}">Resumen</button>`
            : role === "member" && hasDiploma
              ? `<button class="ghost-button" data-action="select-course" data-course-id="${course.id}">Resumen</button>`
            : role === "member" && isWaiting
              ? `<button class="ghost-button" data-action="select-course" data-course-id="${course.id}">Resumen</button>`
            : ""
          }
        </div>
        ${
          role === "member"
            ? `<span class="small-chip">${hasDiploma ? "Curso completado" : isEnrolled ? "Inscrito" : isWaiting ? "En espera" : canEnroll ? enrollmentCall.waitlistMode ? "Lista de espera" : "Inscripcion abierta" : enrollmentCall?.scheduledMode ? "Apertura programada" : "Sin inscripcion"}</span>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderQuickEnrollmentStrip(courses) {
  if (!courses?.length) {
    return "";
  }

  return `
    <div class="quick-enrollment-strip">
      <span class="eyebrow">Inscripcion rapida</span>
      <div class="chip-row">
        ${courses
          .map(
            (course) => `
              <button class="ghost-button quick-enroll-chip" data-action="${isCourseOpenForEnrollment(course) ? "prepare-course-enrollment" : "select-course"}" data-course-id="${course.id}">
                <strong>${escapeHtml(course.title)}</strong>
                <span>${escapeHtml(getCourseEnrollmentCall(course).statusLabel)}${course.enrollmentFee > 0 ? ` · ${course.enrollmentFee} €` : ""}</span>
              </button>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderCompactCourseBucket(title, description, courses, options = {}) {
  const emptyMessage = options.emptyMessage || "No hay cursos en este bloque.";
  const role = options.role || "member";
  const quickEnroll = Boolean(options.quickEnroll);
  const sectionId = options.sectionId || "";
  return `
    <section class="mail-card compact-panel course-bucket-card" ${sectionId ? `id="${sectionId}"` : ""}>
      <div class="panel-header">
        <div>
          <h4>${escapeHtml(title)}</h4>
          <p class="muted">${escapeHtml(description)}</p>
        </div>
        <span class="small-chip">${courses.length}</span>
      </div>
      ${quickEnroll ? renderQuickEnrollmentStrip(courses) : ""}
      ${
        courses.length
          ? `<div class="compact-course-grid">${courses.map((course) => renderCompactCourseCard(course, role)).join("")}</div>`
          : `<p class="muted">${escapeHtml(emptyMessage)}</p>`
      }
    </section>
  `;
}

function renderLearnerCourseCatalogOverview(memberBuckets) {
  const totals = {
    enrolled: memberBuckets?.activeCourses?.length || 0,
    open: memberBuckets?.enrollmentOpenCourses?.length || 0,
    upcoming: memberBuckets?.upcomingCourses?.length || 0,
    closed: memberBuckets?.closedCourses?.length || 0
  };

  return `
      <div class="status-note info overview-summary-row">
        ${totals.enrolled} curso(s) activo(s), ${totals.open} con inscripcion abierta, ${totals.upcoming} proximo(s) y ${totals.closed} en historial.
      </div>
    `;
}

function getCourseContentReadiness(course) {
  const totalLessons = getCourseLessonList(course).length;
  const publishedLessons = getPublishedLessonCount(course);
  const totalBlocks = getCourseBlockList(course).length;
  const visibleResources = getVisibleCourseResources(course, "member").length;
  const readiness = totalLessons ? Math.round((publishedLessons / totalLessons) * 100) : 0;
  return {
    totalLessons,
    publishedLessons,
    totalBlocks,
    visibleResources,
    readiness
  };
}

function countCourseBlocksByType(course) {
  return getCourseBlockList(course).reduce((acc, block) => {
    const key = block.type || "document";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function toggleLessonCompletion(course, memberId, lessonId) {
  const entry = getCourseProgressEntry(course, memberId);
  const nextLessonIds = new Set(entry.lessonIds);
  const lesson = getCourseLessonList(course).find((item) => item.id === lessonId);
  if (!lesson) {
    return;
  }

  if (nextLessonIds.has(lessonId)) {
    nextLessonIds.delete(lessonId);
  } else {
    nextLessonIds.add(lessonId);
  }

  const nextBlockIds = new Set(entry.blockIds);
  (lesson.blocks || []).forEach((block) => {
    if (nextLessonIds.has(lessonId)) {
      nextBlockIds.add(block.id);
    } else {
      nextBlockIds.delete(block.id);
    }
  });

  setCourseProgressEntry(course, memberId, {
    lessonIds: [...nextLessonIds],
    blockIds: [...nextBlockIds]
  });
}

function toggleBlockCompletion(course, memberId, lessonId, blockId) {
  const entry = getCourseProgressEntry(course, memberId);
  const nextBlockIds = new Set(entry.blockIds);
  const lesson = getCourseLessonList(course).find((item) => item.id === lessonId);
  if (!lesson) {
    return;
  }

  if (nextBlockIds.has(blockId)) {
    nextBlockIds.delete(blockId);
  } else {
    nextBlockIds.add(blockId);
  }

  const nextLessonIds = new Set(entry.lessonIds);
  const lessonBlocks = lesson.blocks || [];
  if (lessonBlocks.length && lessonBlocks.every((block) => nextBlockIds.has(block.id))) {
    nextLessonIds.add(lessonId);
  } else {
    nextLessonIds.delete(lessonId);
  }

  setCourseProgressEntry(course, memberId, {
    lessonIds: [...nextLessonIds],
    blockIds: [...nextBlockIds]
  });
}

function getAverageCourseContentProgress(course) {
  const enrolled = course.enrolledIds || [];
  if (!enrolled.length) {
    return 0;
  }

  return Math.round(
    enrolled.reduce((sum, memberId) => sum + getMemberCourseContentStats(course, memberId).blockProgress, 0) /
      enrolled.length
  );
}

function getVisibleCourseResources(course, role = getEffectiveRole()) {
  return (course.resources || []).filter((resource) => role === "admin" || resource.visibility !== "interno");
}

function buildCourseResourcesFromLessons(course) {
  const resources = [];
  const seen = new Set();

  (course.modules || []).forEach((module) => {
    (module.lessons || []).forEach((lesson) => {
      const label = String(lesson.assetLabel || "").trim();
      const url = String(lesson.assetUrl || "").trim();
      if (!label && !url) {
        return;
      }

      const key = `${label.toLowerCase()}|${url.toLowerCase()}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);

      resources.push(
        normalizeCourseResource(
          {
            label: label || lesson.title || "Recurso de leccion",
            type:
              lesson.type === "Descarga"
                ? "Descarga"
                : lesson.type === "Presentacion"
                  ? "Presentacion"
                  : lesson.type === "Evaluacion"
                    ? "Evaluacion"
                    : "Documento",
            url,
            description: `Vinculado a ${lesson.title || "leccion"} del modulo ${module.title || "curso"}.`,
            visibility: "alumnado"
          },
          resources.length
        )
      );
    });
  });

  return resources;
}

function collectCourseResourcesFromForm() {
  return [...document.querySelectorAll("[data-course-resource-index]")]
    .map((resourceNode, resourceIndex) =>
      normalizeCourseResource(
        {
          id: resourceNode.dataset.resourceId || "",
          label: resourceNode.querySelector('[data-resource-field="label"]')?.value.trim() || "",
          type: resourceNode.querySelector('[data-resource-field="type"]')?.value.trim() || "",
          url: resourceNode.querySelector('[data-resource-field="url"]')?.value.trim() || "",
          description: resourceNode.querySelector('[data-resource-field="description"]')?.value.trim() || "",
          visibility: resourceNode.querySelector('[data-resource-field="visibility"]')?.value || "alumnado"
        },
        resourceIndex
      )
    )
    .filter((resource) => resource.label || resource.url || resource.description);
}

function hasCourseModuleEditors() {
  return document.querySelectorAll("[data-course-module-index]").length > 0;
}

function hasCourseResourceEditors() {
  return document.querySelectorAll("[data-course-resource-index]").length > 0;
}

function readCourseFieldValue(id, fallback = "") {
  const element = document.getElementById(id);
  return element ? element.value : fallback;
}

function readCourseTrimmedValue(id, fallback = "") {
  return String(readCourseFieldValue(id, fallback)).trim();
}

function readCourseNumberValue(id, fallback = 0) {
  const element = document.getElementById(id);
  return element ? Number(element.value || 0) : fallback;
}

function renderCourseResourceEditor(resource, resourceIndex) {
  return `
    <article class="lesson-card" data-course-resource-index="${resourceIndex}" data-resource-id="${escapeHtml(resource.id)}">
      <div class="row-between">
        <strong>Recurso ${resourceIndex + 1}</strong>
        <button class="mini-button" type="button" data-action="remove-course-resource" data-resource-index="${resourceIndex}">Eliminar</button>
      </div>
      <div class="lesson-grid">
        <label class="inline-field">
          Etiqueta
          <input data-resource-field="label" value="${escapeHtml(resource.label || "")}" />
        </label>
        <label class="inline-field">
          Tipo
          <input data-resource-field="type" value="${escapeHtml(resource.type || "")}" />
        </label>
        <label class="inline-field">
          URL o ruta
          <input data-resource-field="url" value="${escapeHtml(resource.url || "")}" />
        </label>
        <label class="inline-field">
          Visibilidad
          <select data-resource-field="visibility">
            ${COURSE_RESOURCE_VISIBILITIES.map((visibility) => `<option value="${visibility}" ${resource.visibility === visibility ? "selected" : ""}>${visibility}</option>`).join("")}
          </select>
        </label>
        <label class="inline-field lesson-notes">
          Descripcion
          <textarea data-resource-field="description">${escapeHtml(resource.description || "")}</textarea>
        </label>
      </div>
    </article>
  `;
}

function renderCourseResources(course, role = getEffectiveRole()) {
  const resources = getVisibleCourseResources(course, role);
  if (!resources.length) {
    return `<div class="empty-state">Todavia no hay recursos enlazados a este curso.</div>`;
  }

  return `
    <div class="lesson-stack course-resource-stack">
      ${resources
        .map(
          (resource) => `
            <article class="lesson-roadmap-item">
              <div class="row-between">
                <strong>${escapeHtml(resource.label || "Recurso")}</strong>
                <div class="chip-row">
                  <span class="small-chip">${escapeHtml(resource.type || "Documento")}</span>
                  ${role === "admin" ? `<span class="small-chip">${escapeHtml(resource.visibility || "alumnado")}</span>` : ""}
                </div>
              </div>
              <p class="muted">${escapeHtml(resource.description || "Sin descripcion")}</p>
              ${
                resource.url
                  ? `
                      <div class="chip-row">
                        <a class="mini-button" href="${escapeHtml(resource.url)}" target="_blank" rel="noreferrer">Abrir recurso</a>
                        ${role === "admin" ? `<span class="muted">${escapeHtml(resource.url)}</span>` : ""}
                      </div>
                    `
                  : `<p class="muted">Recurso pendiente de enlace.</p>`
              }
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderLessonBlockPreview(block, options = {}) {
  const type = String(block.type || "document");
  const label = getBlockDisplayLabel(type);
  const url = String(block.url || "").trim();
  const embedUrl = getEmbedUrl(url);
  const course = options.course || null;
  const memberId = options.memberId || "";
  const lessonId = options.lessonId || "";
  const interactive = Boolean(options.interactive && course && memberId && !options.previewOnly);
  const quizProgress = type === "evaluation" && course && memberId
    ? getQuizBlockProgress(course, memberId, block)
    : null;

  if (type === "video") {
    return `
      <div class="aula-block aula-block-video">
        <div class="chip-row">
          <span class="small-chip">${label}</span>
          ${block.required ? `<span class="small-chip">obligatorio</span>` : ""}
        </div>
        <strong>${escapeHtml(block.title || "Video")}</strong>
        <p class="muted">${escapeHtml(block.content || "Video sin descripcion")}</p>
        ${
          embedUrl
            ? `<iframe class="resource-embed" src="${escapeHtml(embedUrl)}" title="${escapeHtml(block.title || "Video")}" allowfullscreen loading="lazy"></iframe>`
            : `<div class="empty-state">Pega una URL de YouTube, Vimeo o video embebible para ver la vista previa.</div>`
        }
      </div>
    `;
  }

  if (type === "download") {
    const pdfLike = /\.pdf($|\?)/i.test(url);
    return `
      <div class="aula-block aula-block-download">
        <div class="chip-row">
          <span class="small-chip">${pdfLike ? "PDF" : label}</span>
          ${block.required ? `<span class="small-chip">obligatorio</span>` : ""}
        </div>
        <strong>${escapeHtml(block.title || "Descarga")}</strong>
        <p class="muted">${escapeHtml(block.content || "Archivo o recurso descargable")}</p>
        ${
          url
            ? `
                <a class="button-link" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">Abrir recurso</a>
                ${pdfLike ? `<iframe class="resource-embed resource-embed-pdf" src="${escapeHtml(url)}" title="${escapeHtml(block.title || "PDF")}" loading="lazy"></iframe>` : ""}
              `
            : `<div class="empty-state">Anade una URL para habilitar la descarga o la vista del PDF.</div>`
        }
      </div>
    `;
  }

  if (type === "evaluation") {
    return `
      <div class="aula-block aula-block-evaluation">
        <div class="chip-row">
          <span class="small-chip">${label}</span>
          ${block.required ? `<span class="small-chip">obligatorio</span>` : ""}
          ${
            quizProgress
              ? `<span class="small-chip">${quizProgress.correct}/${quizProgress.total} correctas</span>`
              : ""
          }
        </div>
        <strong>${escapeHtml(block.title || "Test")}</strong>
        <p class="muted">${escapeHtml(block.content || "Bloque de evaluacion")}</p>
        ${
          block.questions?.length
            ? `
                <div class="quiz-stack">
                  ${block.questions
                    .map(
                      (question, questionIndex) => `
                        <article class="quiz-card">
                          <strong>${questionIndex + 1}. ${escapeHtml(question.prompt || "Pregunta")}</strong>
                          <div class="quiz-options">
                            ${(question.options || [])
                              .map(
                                (option) => {
                                  const selectedAnswer = course && memberId
                                    ? getCourseQuizAnswer(course, memberId, block.id, questionIndex)
                                    : "";
                                  const isSelected = selectedAnswer === option;
                                  const isCorrect = question.correctAnswer === option;
                                  const optionClass = [
                                    "quiz-option",
                                    options.admin && isCorrect ? "correct" : "",
                                    isSelected ? "quiz-option-selected" : "",
                                    selectedAnswer && isSelected && !isCorrect ? "quiz-option-wrong" : ""
                                  ]
                                    .filter(Boolean)
                                    .join(" ");
                                  if (interactive) {
                                    return `
                                      <button
                                        class="${optionClass}"
                                        type="button"
                                        data-action="answer-quiz-question"
                                        data-course-id="${course.id}"
                                        data-member-id="${memberId}"
                                        data-lesson-id="${lessonId}"
                                        data-block-id="${block.id}"
                                        data-question-index="${questionIndex}"
                                        data-answer="${escapeHtml(option)}"
                                      >
                                        ${escapeHtml(option)}
                                      </button>
                                    `;
                                  }
                                  return `
                                    <div class="${optionClass}">
                                      ${escapeHtml(option)}
                                    </div>
                                  `;
                                }
                              )
                              .join("")}
                          </div>
                          ${
                            interactive
                              ? `<p class="muted">${
                                  getCourseQuizAnswer(course, memberId, block.id, questionIndex)
                                    ? getCourseQuizAnswer(course, memberId, block.id, questionIndex) === (question.correctAnswer || "")
                                      ? "Respuesta correcta."
                                      : "Respuesta guardada. Puedes cambiarla hasta acertar."
                                    : "Selecciona una respuesta para continuar."
                                }</p>`
                              : options.previewOnly && !options.admin
                                ? `<p class="muted">Vista previa: las respuestas no se guardan desde administracion.</p>`
                                : ""
                          }
                          ${
                            options.admin && question.correctAnswer
                              ? `<p class="muted"><strong>Correcta:</strong> ${escapeHtml(question.correctAnswer)}</p>`
                              : ""
                          }
                          ${
                            options.admin && question.explanation
                              ? `<p class="muted">${escapeHtml(question.explanation)}</p>`
                              : ""
                          }
                        </article>
                      `
                    )
                    .join("")}
                </div>
              `
            : `<div class="empty-state">Este test todavia no tiene preguntas cargadas.</div>`
        }
        ${
          quizProgress && !options.admin
            ? `<p class="muted">${quizProgress.complete ? "Test completado. Este bloque ya cuenta para tu progreso." : `${quizProgress.answered}/${quizProgress.total} respondida(s).`}</p>`
            : ""
        }
      </div>
    `;
  }

  return `
    <div class="aula-block">
      <div class="chip-row">
        <span class="small-chip">${label}</span>
        ${block.required ? `<span class="small-chip">obligatorio</span>` : ""}
      </div>
      <strong>${escapeHtml(block.title || "Bloque")}</strong>
      <p class="muted">${escapeHtml(block.content || "Sin contenido")}</p>
      ${
        url
          ? `<a class="button-link" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">Abrir recurso</a>`
          : ""
      }
    </div>
  `;
}

function collectCourseModulesFromForm() {
  return [...document.querySelectorAll("[data-course-module-index]")]
    .map((moduleNode, moduleIndex) => {
      const module = normalizeCourseModule(
        {
          id: moduleNode.dataset.moduleId || "",
          title: moduleNode.querySelector('[data-module-field="title"]')?.value.trim() || "",
          goal: moduleNode.querySelector('[data-module-field="goal"]')?.value.trim() || "",
          format: moduleNode.querySelector('[data-module-field="format"]')?.value.trim() || "",
          deliverable: moduleNode.querySelector('[data-module-field="deliverable"]')?.value.trim() || "",
          lessons: [...moduleNode.querySelectorAll("[data-course-lesson-index]")]
            .map((lessonNode, lessonIndex) =>
              normalizeCourseLesson(
                {
                  id: lessonNode.dataset.lessonId || "",
                  title: lessonNode.querySelector('[data-lesson-field="title"]')?.value.trim() || "",
                  type: lessonNode.querySelector('[data-lesson-field="type"]')?.value || "Practica",
                  duration: Number(lessonNode.querySelector('[data-lesson-field="duration"]')?.value || 0),
                  resource: lessonNode.querySelector('[data-lesson-field="resource"]')?.value.trim() || "",
                  instructions: lessonNode.querySelector('[data-lesson-field="instructions"]')?.value.trim() || "",
                  body: lessonNode.querySelector('[data-lesson-field="body"]')?.value.trim() || "",
                  activity: lessonNode.querySelector('[data-lesson-field="activity"]')?.value.trim() || "",
                  takeaway: lessonNode.querySelector('[data-lesson-field="takeaway"]')?.value.trim() || "",
                  assetLabel: lessonNode.querySelector('[data-lesson-field="assetLabel"]')?.value.trim() || "",
                  assetUrl: lessonNode.querySelector('[data-lesson-field="assetUrl"]')?.value.trim() || "",
                  publicationStatus: lessonNode.querySelector('[data-lesson-field="publicationStatus"]')?.value || "draft",
                  blocks: [...lessonNode.querySelectorAll("[data-lesson-block-index]")]
                    .map((blockNode, blockIndex) =>
                      normalizeCourseBlock(
                        {
                          id: blockNode.dataset.blockId || "",
                          type: blockNode.querySelector('[data-block-field="type"]')?.value || "document",
                          title: blockNode.querySelector('[data-block-field="title"]')?.value.trim() || "",
                          content: blockNode.querySelector('[data-block-field="content"]')?.value.trim() || "",
                          url: blockNode.querySelector('[data-block-field="url"]')?.value.trim() || "",
                          questions: parseQuizQuestions(blockNode.querySelector('[data-block-field="questions"]')?.value || ""),
                          required: Boolean(blockNode.querySelector('[data-block-field="required"]')?.checked)
                        },
                        moduleIndex,
                        lessonIndex,
                        blockIndex
                      )
                    )
                    .filter((block) => block.title || block.content || block.url)
                },
                moduleIndex,
                lessonIndex
              )
            )
            .filter(
              (lesson) =>
                lesson.title ||
                lesson.instructions ||
                lesson.resource ||
                lesson.body ||
                lesson.activity ||
                lesson.takeaway ||
                lesson.assetLabel ||
                lesson.assetUrl ||
                lesson.duration > 0
            )
        },
        moduleIndex
      );

      return module;
    })
    .filter((module) => module.title || module.goal || module.lessons.length);
}

function readCourseEditorDraft(course) {
  const form = document.getElementById("courseEditForm");
  if (!form) {
    return normalizeCourse(course);
  }

  const sessions = document.getElementById("editCourseSessions")
    ? parseSessions(document.getElementById("editCourseSessions").value || "")
    : course.sessions || [];
  const modules = hasCourseModuleEditors() ? collectCourseModulesFromForm() : course.modules || [];
  const resources = hasCourseResourceEditors() ? collectCourseResourcesFromForm() : course.resources || [];

  return normalizeCourse({
    ...course,
    title: readCourseTrimmedValue("editCourseTitle", course.title),
    courseClass: readCourseFieldValue("editCourseClass", course.courseClass),
    type: readCourseTrimmedValue("editCourseType", course.type),
    status: readCourseFieldValue("editCourseStatus", course.status),
    startDate: readCourseFieldValue("editCourseStart", course.startDate),
    endDate: readCourseFieldValue("editCourseEnd", course.endDate),
    hours: readCourseNumberValue("editCourseHours", course.hours || 0),
    capacity: readCourseNumberValue("editCourseCapacity", course.capacity || 0),
    diplomaTemplate: readCourseTrimmedValue("editCourseDiploma", course.diplomaTemplate),
    summary: readCourseTrimmedValue("editCourseSummary", course.summary || ""),
    modality: readCourseTrimmedValue("editCourseModality", course.modality || "Presencial"),
    enrollmentFee: readCourseNumberValue("editCourseEnrollmentFee", course.enrollmentFee || 0),
    enrollmentPaymentInstructions: readCourseTrimmedValue(
      "editCourseEnrollmentInstructions",
      course.enrollmentPaymentInstructions || ""
    ),
    audience: readCourseTrimmedValue("editCourseAudience", course.audience || "Socios y voluntariado operativo"),
    coordinator: readCourseTrimmedValue("editCourseCoordinator", course.coordinator || ""),
    contentTemplate: readCourseFieldValue("editCourseTemplate", course.contentTemplate),
    contentStatus: readCourseFieldValue("editCourseContentStatus", course.contentStatus),
    objectives: document.getElementById("editCourseObjectives")
      ? parseTextareaList(document.getElementById("editCourseObjectives").value || "")
      : course.objectives || [],
    sessions,
    modules: modules.length ? modules : buildModulesFromSessions(sessions),
    resources,
    materials: document.getElementById("editCourseMaterials")
      ? parseTextareaList(document.getElementById("editCourseMaterials").value || "")
      : course.materials || [],
    evaluationCriteria: document.getElementById("editCourseEvaluationCriteria")
      ? parseTextareaList(document.getElementById("editCourseEvaluationCriteria").value || "")
      : course.evaluationCriteria || [],
    feedbackEnabled: (readCourseFieldValue("editCourseFeedbackEnabled", String(course.feedbackEnabled)) || String(course.feedbackEnabled)) !== "false",
    feedbackRequiredForDiploma:
      readCourseFieldValue("editCourseFeedbackRequired", String(course.feedbackRequiredForDiploma)) === "true",
    feedbackTeachers: document.getElementById("editCourseFeedbackTeachers")
      ? parseTextareaList(document.getElementById("editCourseFeedbackTeachers").value || "")
      : course.feedbackTeachers || []
  });
}

function isAdminSession() {
  return session?.role === "admin";
}

function getEffectiveRole() {
  if (!session) {
    return state.role || "admin";
  }

  if (session.role !== "admin") {
    return "member";
  }

  return viewRole === "member-preview" || viewRole === "member-self" || viewRole === "member" ? "member" : "admin";
}

function isAdminView() {
  return getEffectiveRole() === "admin";
}

function isMemberPreviewSession() {
  return isAdminSession() && viewRole === "member-preview";
}

function isSelfMemberSession() {
  return (session?.role === "member" && Boolean(session?.memberId)) || (isAdminSession() && viewRole === "member-self");
}

function isCampusOnlySession() {
  return !isAdminView() && Boolean(session?.memberId) && !getCurrentAssociate();
}

function isDemoSession() {
  return isLocalEnvironment;
}

function buildDiplomaCode(course, member) {
  return `IZ-${course.startDate.slice(0, 4)}-${course.id.split("-")[1]}-${member.id.split("-")[1]}`;
}

function buildCertificateTitle(course) {
  return "CERTIFICADO DE APROVECHAMIENTO";
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) {
    return "fecha pendiente de cierre";
  }

  if (startDate && endDate && startDate === endDate) {
    return formatDate(startDate);
  }

  if (!startDate) {
    return formatDate(endDate);
  }

  if (!endDate) {
    return formatDate(startDate);
  }

  return `${formatDate(startDate)} al ${formatDate(endDate)}`;
}

function findAssociateByMember(member) {
  if (!member) {
    return null;
  }

  return (
    state.associates.find(
      (associate) =>
        associate.linkedMemberId === member.id ||
        associate.id === member.associateId ||
        (associate.email && member.email && associate.email.toLowerCase() === member.email.toLowerCase())
    ) || null
  );
}

function getMemberDocumentId(member) {
  const associate = findAssociateByMember(member);
  return associate?.dni || member?.dni || "Pendiente de registro";
}

function hasMemberDocumentId(member) {
  return getMemberDocumentId(member) !== "Pendiente de registro";
}

function parseCertificateSections(lines) {
  const manualLines = normalizeCertificateContentLines(lines);
  if (!manualLines.length) {
    return [];
  }

  const sections = [];
  const looseItems = [];

  manualLines.forEach((line) => {
    const [rawTitle, rawItems] = line.split("|");
    if (rawItems !== undefined) {
      const title = rawTitle.trim();
      const items = rawItems
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean);
      if (title && items.length) {
        sections.push({ title, items });
        return;
      }
    }

    looseItems.push(line);
  });

  if (looseItems.length) {
    sections.unshift({ title: "Contenidos principales", items: looseItems });
  }

  return sections;
}

function getCertificateSections(course) {
  const manualSections = parseCertificateSections(course.certificateContents);
  if (manualSections.length) {
    return manualSections;
  }

  const moduleSections = (course.modules || [])
    .slice(0, 5)
    .map((module) => {
      const items = [];
      if (module.goal) {
        items.push(module.goal);
      }
      (module.lessons || []).forEach((lesson) => {
        if (lesson.title) {
          items.push(lesson.title);
        }
        if (lesson.takeaway) {
          items.push(lesson.takeaway);
        }
      });
      if (module.deliverable) {
        items.push(module.deliverable);
      }

      return {
        title: module.title || "Bloque formativo",
        items: Array.from(new Set(items.map((item) => String(item || "").trim()).filter(Boolean))).slice(0, 5)
      };
    })
    .filter((section) => section.items.length);

  if (moduleSections.length) {
    return moduleSections;
  }

  return FALLBACK_CERTIFICATE_SECTIONS;
}

function buildAssistantSummary() {
  if (!isAdminView()) {
    const member = getCurrentMember();
    const associate = getCurrentAssociate();
    const activeCourses = state.courses.filter((course) => course.enrolledIds.includes(member?.id)).length;
    const diplomas = state.courses.filter((course) => course.diplomaReady.includes(member?.id)).length;
    const primaryCourse = getPrimaryMemberCourse(member?.id);
    const nextStep = primaryCourse ? getLearnerCourseJourney(primaryCourse, member?.id).nextStep : null;
    const averageProgress = activeCourses
      ? Math.round(
          state.courses
            .filter((course) => course.enrolledIds.includes(member?.id))
            .reduce((sum, course) => sum + getLearnerCourseContentStats(course, member?.id).blockProgress, 0) /
            activeCourses
        )
      : 0;
    return `${activeCourses} curso(s) activo(s), progreso medio ${averageProgress}%, ${diplomas} diploma(s) disponible(s), siguiente paso ${nextStep?.block?.title || nextStep?.lessonTitle || "sin bloque pendiente"}, ${Number(member?.renewalsDue || 0)} renovacion(es) pendiente(s) y estado de socio ${associate?.status || "sin ficha"}.`;
  }

  const closable = state.courses.filter((course) => course.status === "Cierre pendiente").length;
  const pendingMails = state.courses.reduce(
    (sum, course) => sum + getCoursePendingDiplomaDeliveries(course),
    0
  );
  const pendingAssociateApplications = countPendingAssociateApplications();
  const pendingAssociatePaymentSubmissions = state.associatePaymentSubmissions.filter(
    (item) => item.status === "Pendiente de revision"
  ).length;
  const pendingAssociateProfileRequests = state.associateProfileRequests.filter(
    (item) => item.status === "Pendiente de revision"
  ).length;
  const pendingLegacyReview = state.associates.filter(
    (item) =>
      item.status === "Revisar documentacion" &&
      /Importado desde Excel legacy/i.test(String(item.observations || ""))
  ).length;
  const publishedLessons = state.courses.reduce((sum, course) => sum + getPublishedLessonCount(course), 0);
  return `${pendingAssociateApplications} solicitud(es) de socio pendientes, ${pendingAssociatePaymentSubmissions} justificante(s) de cuota por revisar, ${pendingAssociateProfileRequests} cambio(s) de ficha pendientes, ${pendingLegacyReview} socio(s) legacy en revision, ${closable} curso(s) con cierre pendiente, ${publishedLessons} leccion(es) publicadas, ${pendingMails} diploma(s) listos, ${state.automationInbox.length} aviso(s) automaticos y ${state.emailOutbox.length} correo(s) registrados.`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function getCurrentMember() {
  if (isMemberPreviewSession()) {
    return findMember(state.selectedMemberId);
  }
  return findMember(session?.memberId || state.selectedMemberId);
}

function getCurrentAssociate() {
  const currentMember = getCurrentMember();
  const sessionAssociateId = session?.associateId;
  const currentAssociateId = currentMember?.associateId;
  const currentMemberId = currentMember?.id;
  const currentEmail = String(currentMember?.email || "").trim().toLowerCase();
  const sessionEmail = String(session?.email || "").trim().toLowerCase();
  const currentName = String(currentMember?.name || "")
    .trim()
    .toLowerCase();
  return (
    state.associates.find(
      (associate) =>
        associate.id === sessionAssociateId ||
        associate.linkedMemberId === currentMemberId ||
        associate.id === currentAssociateId ||
        (currentEmail && String(associate.email || "").trim().toLowerCase() === currentEmail) ||
        (sessionEmail && String(associate.email || "").trim().toLowerCase() === sessionEmail) ||
        (currentName &&
          `${String(associate.firstName || "").trim()} ${String(associate.lastName || "").trim()}`
            .trim()
            .toLowerCase() === currentName)
    ) || null
  );
}

function normalizeCampusAccountRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  return normalized === "admin" ? "admin" : "member";
}

function formatCampusAccountRole(role) {
  return CAMPUS_ACCOUNT_ROLE_LABELS[normalizeCampusAccountRole(role)] || CAMPUS_ACCOUNT_ROLE_LABELS.member;
}

function isAssociateAccessLimitedByQuota(associate) {
  return Boolean(associate && getAssociateQuotaGap(associate) > 0);
}

function isCurrentMemberLimitedToAssociateProfile() {
  if (isAdminView() || !session?.memberId) {
    return false;
  }
  return isAssociateAccessLimitedByQuota(getCurrentAssociate());
}

function normalizeManualCampusNotice(notice, index = 0) {
  const normalizedAudience = ["all", "associates", "campus-only", "course"].includes(
    String(notice?.audience || "").trim()
  )
    ? String(notice.audience).trim()
    : "all";
  const normalizedTone = ["info", "warning", "success"].includes(String(notice?.tone || "").trim())
    ? String(notice.tone).trim()
    : "info";
  return {
    id: String(notice?.id || `manual-notice-${Date.now()}-${index}`).trim(),
    title: String(notice?.title || "").trim(),
    detail: String(notice?.detail || "").trim(),
    audience: normalizedAudience,
    tone: normalizedTone,
    courseId: String(notice?.courseId || "").trim(),
    actionLabel: String(notice?.actionLabel || "").trim(),
    channels: {
      campus: notice?.channels?.campus !== false,
      email: Boolean(notice?.channels?.email),
      whatsapp: Boolean(notice?.channels?.whatsapp)
    },
    expiresAt: String(notice?.expiresAt || "").trim(),
    publishedAt: String(notice?.publishedAt || new Date().toISOString()).trim(),
    active: notice?.active !== false
  };
}

function isManualCampusNoticeActive(notice) {
  if (!notice || notice.active === false) {
    return false;
  }
  if (!String(notice.expiresAt || "").trim()) {
    return true;
  }
  const expiresAt = new Date(notice.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) {
    return true;
  }
  return expiresAt.getTime() > Date.now();
}

function getVisibleManualCampusNotices(memberId, ownCourses = []) {
  const member = findMember(memberId);
  if (!member) {
    return [];
  }
  const associate =
    (member.associateId ? findAssociate(member.associateId) : null) ||
    (getCurrentMember()?.id === memberId ? getCurrentAssociate() : null);
  const isCampusOnlyMember = !associate;
  const ownCourseIds = new Set((ownCourses || []).map((course) => course.id));

  return (state.manualCampusNotices || [])
    .filter((notice) => isManualCampusNoticeActive(notice))
    .filter((notice) => {
      switch (notice.audience) {
        case "associates":
          return Boolean(associate);
        case "campus-only":
          return isCampusOnlyMember;
        case "course":
          return Boolean(notice.courseId) && ownCourseIds.has(notice.courseId);
        case "all":
        default:
          return true;
      }
    })
    .sort((left, right) => String(right.publishedAt || "").localeCompare(String(left.publishedAt || "")));
}

function getMemberCampusAlerts(memberId) {
  const member = findMember(memberId);
  if (!member) {
    return [];
  }

  const associate =
    (member.associateId ? findAssociate(member.associateId) : null) ||
    (getCurrentMember()?.id === memberId ? getCurrentAssociate() : null);
  const alerts = [];
  const currentYear = String(new Date().getFullYear());
  const ownCourses = (state.courses || []).filter(
    (course) =>
      course.enrolledIds.includes(memberId) ||
      course.waitingIds.includes(memberId) ||
      course.diplomaReady.includes(memberId)
  );
  const manualNotices = getVisibleManualCampusNotices(memberId, ownCourses);

  manualNotices.forEach((notice, index) => {
    alerts.push({
      id: notice.id,
      priority: Math.max(1, 8 + index),
      tone: notice.tone || "info",
      title: notice.title || "Novedad del campus",
      detail: notice.detail || "Tienes una novedad publicada en el campus.",
      action: notice.courseId ? "select-course" : "",
      courseId: notice.courseId || "",
      actionLabel: notice.actionLabel || (notice.courseId ? "Abrir curso" : "")
    });
  });

  if (associate) {
    const quotaGap = getAssociateQuotaGap(associate);
    if (quotaGap > 0) {
      alerts.push({
        id: `fee-${associate.id}`,
        priority: 10,
        tone: "warning",
        title: `Cuota ${currentYear} pendiente`,
        detail: `Tienes ${formatCurrency(quotaGap)} pendiente(s). Puedes revisar tu ficha y subir el justificante desde el portal.`,
        action: "nav",
        view: "join",
        joinAnchor: "joinSectionPaymentProof",
        actionLabel: "Ir a mi ficha"
      });
    }

    const missingProfileFields = [];
    if (!String(associate.dni || member?.dni || "").trim()) {
      missingProfileFields.push("DNI/NIE");
    }
    if (!String(associate.phone || member?.phone || "").trim()) {
      missingProfileFields.push("telefono");
    }
    if (!String(associate.email || member?.email || "").trim()) {
      missingProfileFields.push("email");
    }
    if (missingProfileFields.length) {
      alerts.push({
        id: `profile-missing-${associate.id}`,
        priority: 5,
        tone: "warning",
        title: "Completa tu ficha",
        detail: `Todavia te falta: ${missingProfileFields.join(", ")}. Esto puede bloquear inscripciones o diplomas.`,
        action: "nav",
        view: "join",
        joinAnchor: "joinSectionProfileEditor",
        actionLabel: "Revisar ficha"
      });
    }
  }

  const paymentSubmission = [...(state.associatePaymentSubmissions || [])]
    .filter((submission) => submission.associateId === associate?.id || submission.memberId === memberId)
    .sort((a, b) => String(b.reviewedAt || b.submittedAt || "").localeCompare(String(a.reviewedAt || a.submittedAt || "")))[0];
  if (paymentSubmission) {
    if (paymentSubmission.status === "Pendiente de revision") {
      alerts.push({
        id: `payment-review-${paymentSubmission.id}`,
        priority: 40,
        tone: "info",
        title: "Justificante de cuota en revisión",
        detail: "Tu justificante ya está enviado y pendiente de validación administrativa.",
        action: "nav",
        view: "join",
        joinAnchor: "joinSectionPaymentProof",
        actionLabel: "Ver mi ficha"
      });
    }
    if (["Aprobado", "Rechazado"].includes(String(paymentSubmission.status || ""))) {
      alerts.push({
        id: `payment-resolution-${paymentSubmission.id}`,
        priority: 20,
        tone: paymentSubmission.status === "Aprobado" ? "success" : "warning",
        title:
          paymentSubmission.status === "Aprobado"
            ? "Justificante de cuota validado"
            : "Justificante de cuota rechazado",
        detail:
          paymentSubmission.status === "Aprobado"
            ? "La revisión del justificante ya está cerrada."
            : "Revisa la observación y vuelve a subir el justificante si hace falta.",
        action: "nav",
        view: "join",
        joinAnchor: paymentSubmission.status === "Aprobado" ? "joinSectionProfileStatus" : "joinSectionPaymentProof",
        actionLabel: "Abrir cuota"
      });
    }
  }

  const profileRequest = [...(state.associateProfileRequests || [])]
    .filter((request) => request.associateId === associate?.id || request.memberId === memberId)
    .sort((a, b) => String(b.reviewedAt || b.submittedAt || "").localeCompare(String(a.reviewedAt || a.submittedAt || "")))[0];
  if (profileRequest) {
    alerts.push({
      id: `profile-${profileRequest.id}`,
      priority: profileRequest.status === "Pendiente de revision" ? 35 : 25,
      tone:
        profileRequest.status === "Aprobado"
          ? "success"
          : profileRequest.status === "Rechazado"
            ? "warning"
            : "info",
      title:
        profileRequest.status === "Aprobado"
          ? "Cambio de ficha aprobado"
          : profileRequest.status === "Rechazado"
            ? "Cambio de ficha rechazado"
            : "Cambio de ficha en revisión",
      detail:
        profileRequest.status === "Pendiente de revision"
          ? "Administración está revisando tu última actualización."
          : "Puedes revisar el resultado en tu ficha.",
      action: "nav",
      view: "join",
      joinAnchor: "joinSectionProfileEditor",
      actionLabel: "Abrir ficha"
    });
  }

  ownCourses.forEach((course) => {
    const journey = getLearnerCourseJourney(course, memberId);
    const visibleResources = getVisibleCourseResources(course, "member");
    const isPracticalCourse = normalizeCourseClass(course.courseClass) === "practico";
    if (journey.hasDiploma) {
      alerts.push({
        id: `diploma-${course.id}`,
        priority: 0,
        tone: "success",
        title: `Diploma disponible: ${course.title}`,
        detail: "Ya puedes abrirlo o descargarlo desde Mis diplomas.",
        action: "set-campus-section-mode",
        mode: "diplomas",
        actionLabel: "Ver diploma"
      });
      return;
    }

    if (journey.waiting) {
      alerts.push({
        id: `waiting-${course.id}`,
        priority: 30,
        tone: "info",
        title: `Sigues en espera: ${course.title}`,
        detail: "Tu solicitud sigue registrada y pendiente de plaza.",
        action: "select-course",
        courseId: course.id,
        actionLabel: "Ver solicitud"
      });
    }

    if (journey.enrolled && journey.pendingSteps.length) {
      alerts.push({
        id: `next-step-${course.id}`,
        priority: 12,
        tone: "warning",
        title: `Tu siguiente paso: ${course.title}`,
        detail: journey.pendingSteps[0],
        action: "select-course",
        courseId: course.id,
        actionLabel: "Continuar curso"
      });
    }

    if (journey.enrolled && course.feedbackEnabled && course.feedbackRequiredForDiploma && !journey.feedbackSubmitted) {
      alerts.push({
        id: `feedback-${course.id}`,
        priority: 15,
        tone: "warning",
        title: `Te falta la valoración final: ${course.title}`,
        detail: "Sin la encuesta final no se podrá cerrar tu diploma.",
        action: "select-course",
        courseId: course.id,
        actionLabel: "Abrir curso"
      });
    }

    if (journey.enrolled && visibleResources.length) {
      alerts.push({
        id: `resources-${course.id}`,
        priority: isPracticalCourse ? 18 : 50,
        tone: "info",
        title: `${isPracticalCourse ? "Documentacion del practico lista" : "Documentación disponible"}: ${course.title}`,
        detail: `${visibleResources.length} recurso(s) visibles para revisar online o descargar${isPracticalCourse ? " antes o despues de la practica" : ""}.`,
        action: "select-course",
        courseId: course.id,
        actionLabel: isPracticalCourse ? "Abrir practico" : "Ver recursos"
      });
    }
  });

  const openCourses = (state.courses || []).filter(
    (course) =>
      !ownCourses.some((entry) => entry.id === course.id) &&
      (associate ? true : isCoursePublicAccess(course)) &&
      isCourseOpenForEnrollment(course)
  );
  if (openCourses.length) {
    alerts.push({
      id: "open-courses",
      priority: 60,
      tone: "info",
      title: `${openCourses.length} curso(s) con inscripción abierta`,
      detail: "Tienes formaciones visibles con matrícula activa desde el campus.",
      action: "set-campus-section-mode",
      mode: "courses",
      actionLabel: "Ver cursos"
    });
  }

  if (associate && !isCampusOnlySession()) {
    const internalResources = (state.campusGroups || []).reduce((sum, group) => {
      const modules = Array.isArray(group.modules) ? group.modules : [];
      return (
        sum +
        modules.reduce(
          (moduleSum, module) =>
            moduleSum +
            (module.documents || []).length +
            (module.practiceSheets || []).length +
            (module.videos || []).length +
            (module.links || []).length,
          0
        )
      );
    }, 0);
    if (internalResources) {
      alerts.push({
        id: "internal-library",
        priority: 70,
        tone: "info",
        title: "Biblioteca interna disponible",
        detail: `${internalResources} recurso(s) internos accesibles desde Grupos internos.`,
        action: "set-campus-section-mode",
        mode: "groups",
        actionLabel: "Abrir biblioteca"
      });
    }
  }

  return alerts
    .sort((left, right) => left.priority - right.priority || String(left.title).localeCompare(String(right.title)))
    .slice(0, 8);
}

function renderMemberAlertAction(alert) {
  if (!alert || !alert.action) {
    return "";
  }

  if (alert.action === "nav") {
    const anchorAttribute = alert.joinAnchor ? ` data-anchor="${escapeHtml(alert.joinAnchor)}"` : "";
    return `<button class="mini-button" type="button" data-action="nav" data-view="${escapeHtml(alert.view || "campus")}"${anchorAttribute}>${escapeHtml(alert.actionLabel || "Abrir")}</button>`;
  }
  if (alert.action === "set-campus-section-mode") {
    return `<button class="mini-button" type="button" data-action="set-campus-section-mode" data-mode="${escapeHtml(alert.mode || "courses")}">${escapeHtml(alert.actionLabel || "Abrir")}</button>`;
  }
  if (alert.action === "select-course") {
    return `<button class="mini-button" type="button" data-action="select-course" data-course-id="${escapeHtml(alert.courseId || "")}">${escapeHtml(alert.actionLabel || "Abrir")}</button>`;
  }
  return "";
}

function renderMemberAlerts(memberId, options = {}) {
  const compact = Boolean(options.compact);
  const alerts = getMemberCampusAlerts(memberId);
  const containerId = options.sectionId ? ` id="${escapeHtml(options.sectionId)}"` : "";
  const headerText = alerts.length
    ? "Lo que te conviene resolver ahora."
    : "No tienes nada urgente pendiente.";

  return `
    <div class="mail-card${compact ? " compact-panel" : ""}${options.anchor ? ` associate-anchor` : ""}"${containerId}>
      <h4>${compact ? "Avisos" : "Lo importante ahora"}</h4>
      <p class="muted">${headerText}</p>
        ${
          alerts.length
            ? `<div class="compact-list">
                ${alerts
                  .map(
                    (alert) => `
                      <div class="timeline-item compact-timeline-item member-alert-row">
                        <div class="row-between">
                          <strong>${escapeHtml(alert.title)}</strong>
                          <span class="small-chip">${escapeHtml(
                            alert.tone === "success"
                            ? "Listo"
                            : alert.tone === "warning"
                              ? "Revisar"
                              : "Info"
                        )}</span>
                      </div>
                      <p>${escapeHtml(alert.detail)}</p>
                      <div class="chip-row">
                        ${renderMemberAlertAction(alert)}
                      </div>
                    </div>
                  `
                )
                .join("")}
            </div>`
          : `<div class="empty-state">No hay avisos pendientes para tu ficha.</div>`
      }
    </div>
  `;
}

function splitMemberName(member) {
  const fullName = String(member?.name || "").trim();
  if (!fullName) {
    return { firstName: "", lastName: "" };
  }
  const parts = fullName.split(/\s+/);
  return {
    firstName: parts.shift() || "",
    lastName: parts.join(" ")
  };
}

function getAssociatePortalSnapshot(associate, member) {
  const memberName = String(member?.name || "").trim();
  const nameParts = splitMemberName(member);
  const associateName = associate ? getAssociateFullName(associate) : "";
  return {
    status: associate?.status || "Sin ficha de socio",
    associateNumber: associate?.associateNumber || "-",
      name: associateName || memberName || "-",
      firstName: associate?.firstName || nameParts.firstName || "",
      lastName: associate?.lastName || nameParts.lastName || "",
      dni: associate?.dni || member?.dni || "",
      phone: associate?.phone || member?.phone || "",
      email: associate?.email || member?.email || session?.email || "",
    service: associate?.service || "",
    campusAccessStatus: associate?.campusAccessStatus || "activo",
    welcomeStatus: associate?.welcomeEmailStatus || "no aplica"
  };
}

function getAssociateFeeHistoryRows(associate) {
  const yearlyFees = {
    ...(associate?.manualYearlyFees || {}),
    ...(associate?.yearlyFees || {})
  };
  return Object.entries(yearlyFees)
    .filter(([year, amount]) => year && Number(amount || 0) >= 0)
    .sort((left, right) => String(right[0]).localeCompare(String(left[0])))
    .map(([year, amount]) => ({
      year,
      amount: Number(amount || 0),
      annualAmount: Number(associate?.annualAmount || 0)
    }));
}

function normalizeCampusGroupEntry(entry, category, index) {
  const hasAttachmentPayload = Boolean(
    entry?.attachment &&
      (entry.attachment.contentBase64 || entry.attachment.transportUrl || entry.attachment.name)
  );
  return {
    id: entry?.id || `campus-group-entry-${category}-${Date.now()}-${index}`,
    title: String(entry?.title || "").trim(),
    url: String(entry?.url || "").trim(),
    note: String(entry?.note || "").trim(),
    attachment:
      hasAttachmentPayload
        ? {
            name: String(entry.attachment.name || "").trim(),
            type: String(entry.attachment.type || "application/octet-stream").trim(),
            size: Number(entry.attachment.size || 0),
            contentBase64: String(entry.attachment.contentBase64 || "").trim(),
            transportUrl: String(entry.attachment.transportUrl || "").trim()
          }
        : null
  };
}

function getCampusGroupAttachmentDraftKey(groupId, moduleId, category, entryId) {
  return [groupId || "", moduleId || "", category || "", entryId || ""].join("::");
}

function getCampusGroupFileAccept(category) {
  if (category === "documents" || category === "practiceSheets") {
    return ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/*,application/pdf";
  }
  return "*/*";
}

function getCampusGroupFileMaxBytes(category) {
  if (category === "documents" || category === "practiceSheets") {
    return 150_000_000;
  }
  return 0;
}

async function applyCampusGroupFileSelection(file) {
  if (!file || !pendingCampusGroupFileTarget) {
    return;
  }

  const { groupId, moduleId, category, entryId } = pendingCampusGroupFileTarget;
  const maxBytes = getCampusGroupFileMaxBytes(category);
  if (maxBytes && Number(file.size || 0) > maxBytes) {
    pendingCampusGroupFileTarget = null;
    throw new Error(
      `El archivo supera el limite de ${formatFileSize(maxBytes)}. Para videos muy pesados conviene usar un enlace externo, pero los documentos y practicas ya admiten bastante mas tamano.`
    );
  }
  const group = state.campusGroups.find((item) => item.id === groupId) || null;
  if (!group || !moduleId || !category || !entryId) {
    pendingCampusGroupFileTarget = null;
    return;
  }

  const selectedModule = (group.modules || []).find((item) => item.id === moduleId) || null;
  if (!selectedModule) {
    pendingCampusGroupFileTarget = null;
    return;
  }

  const draft = readCampusGroupEditorDraft(group) || group;
  const nextModules = (draft.modules || []).map((module, moduleIndex) =>
    module.id === selectedModule.id
      ? normalizeCampusGroupModule(
          {
            ...module,
            [category]: (module[category] || []).map((entry, entryIndex) =>
              entry.id === entryId
                ? normalizeCampusGroupEntry(
                    {
                      ...entry,
                      title: entry.title || file.name.replace(/\.[^.]+$/, ""),
                      attachment: file
                    },
                    category,
                    entryIndex
                  )
                : entry
            )
          },
          draft.id,
          moduleIndex
        )
      : module
  );
  const nextGroup = normalizeCampusGroup({
    ...draft,
    modules: nextModules
  });
  const draftKey = getCampusGroupAttachmentDraftKey(groupId, moduleId, category, entryId);
  campusGroupAttachmentDrafts[draftKey] = file;
  state.campusGroups = state.campusGroups.map((item) => (item.id === group.id ? nextGroup : item));
  state.selectedCampusGroupId = nextGroup.id;
  selectedCampusGroupModuleId = moduleId;
  syncStatus = `Archivo cargado para ${file.name}. Guarda el grupo interno para dejarlo persistido.`;
  pendingCampusGroupFileTarget = null;
  showToast("Archivo preparado en el grupo interno", "success");
  render();
}

function normalizeCampusGroupModule(module, groupId, moduleIndex = 0) {
  return {
    id: module?.id || `${groupId}-module-${moduleIndex + 1}`,
    title: String(module?.title || `Modulo ${moduleIndex + 1}`).trim(),
    summary: String(module?.summary || "").trim(),
    documents: (module?.documents || []).map((entry, entryIndex) =>
      normalizeCampusGroupEntry(entry, "documents", entryIndex)
    ),
    practiceSheets: (module?.practiceSheets || []).map((entry, entryIndex) =>
      normalizeCampusGroupEntry(entry, "practiceSheets", entryIndex)
    ),
    videos: (module?.videos || []).map((entry, entryIndex) =>
      normalizeCampusGroupEntry(entry, "videos", entryIndex)
    ),
    links: (module?.links || []).map((entry, entryIndex) =>
      normalizeCampusGroupEntry(entry, "links", entryIndex)
    )
  };
}

function buildFallbackCampusGroupModules(group, groupId) {
  const seeded = buildDefaultCampusGroups().find((item) => item.id === groupId || item.title === group?.title);
  if (seeded?.modules?.length) {
    return seeded.modules.map((module, moduleIndex) => normalizeCampusGroupModule(module, groupId, moduleIndex));
  }

  const legacyHasResources =
    (group?.documents || []).length ||
    (group?.practiceSheets || []).length ||
    (group?.videos || []).length ||
    (group?.links || []).length;

  return [
    normalizeCampusGroupModule(
      {
        id: `${groupId}-module-base`,
        title: legacyHasResources ? "Base del grupo" : "Modulo 1",
        summary: legacyHasResources ? "Contenido heredado del grupo." : "Primer modulo interno del grupo.",
        documents: group?.documents || [],
        practiceSheets: group?.practiceSheets || [],
        videos: group?.videos || [],
        links: group?.links || []
      },
      groupId,
      0
    )
  ];
}

function countCampusGroupModuleResources(module) {
  return (
    (module?.documents || []).length +
    (module?.practiceSheets || []).length +
    (module?.videos || []).length +
    (module?.links || []).length
  );
}

function countCampusGroupResources(group) {
  return (group?.modules || []).reduce((sum, module) => sum + countCampusGroupModuleResources(module), 0);
}

function getCampusDraftStorageKey(groupId) {
  return `campus_draft_${String(groupId || "").trim()}`;
}

function sanitizeCampusDraftAttachment(attachment) {
  if (!attachment) {
    return null;
  }

  const transportUrl = String(attachment.transportUrl || "").trim();
  const name = String(attachment.name || "").trim();
  if (!transportUrl && !name) {
    return null;
  }

  return {
    name,
    type: String(attachment.type || "application/octet-stream").trim(),
    size: Number(attachment.size || 0),
    transportUrl
  };
}

function sanitizeCampusDraftEntry(entry, category, index) {
  const normalizedEntry = normalizeCampusGroupEntry(entry, category, index);
  return {
    id: normalizedEntry.id,
    title: normalizedEntry.title,
    url: normalizedEntry.url,
    note: normalizedEntry.note,
    attachment: sanitizeCampusDraftAttachment(normalizedEntry.attachment)
  };
}

function buildCampusDraftData(data) {
  const normalizedGroup = normalizeCampusGroup(data, 0);
  return {
    id: normalizedGroup.id,
    title: normalizedGroup.title,
    summary: normalizedGroup.summary,
    modules: (normalizedGroup.modules || []).map((module, moduleIndex) => ({
      id: module.id,
      title: module.title,
      summary: module.summary,
      documents: (module.documents || []).map((entry, entryIndex) =>
        sanitizeCampusDraftEntry(entry, "documents", entryIndex)
      ),
      practiceSheets: (module.practiceSheets || []).map((entry, entryIndex) =>
        sanitizeCampusDraftEntry(entry, "practiceSheets", entryIndex)
      ),
      videos: (module.videos || []).map((entry, entryIndex) =>
        sanitizeCampusDraftEntry(entry, "videos", entryIndex)
      ),
      links: (module.links || []).map((entry, entryIndex) =>
        sanitizeCampusDraftEntry(entry, "links", entryIndex)
      )
    }))
  };
}

function saveCampusDraft(groupId, data) {
  const normalizedGroupId = String(groupId || "").trim();
  if (!normalizedGroupId || !data) {
    return;
  }

  try {
    sessionStorage.setItem(
      getCampusDraftStorageKey(normalizedGroupId),
      JSON.stringify(buildCampusDraftData({ ...data, id: normalizedGroupId }))
    );
  } catch (error) {
  }
}

function loadCampusDraft(groupId) {
  const normalizedGroupId = String(groupId || "").trim();
  if (!normalizedGroupId) {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(getCampusDraftStorageKey(normalizedGroupId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return buildCampusDraftData({ ...parsed, id: normalizedGroupId });
  } catch (error) {
    return null;
  }
}

function clearCampusDraft(groupId) {
  const normalizedGroupId = String(groupId || "").trim();
  if (!normalizedGroupId) {
    return;
  }

  try {
    sessionStorage.removeItem(getCampusDraftStorageKey(normalizedGroupId));
  } catch (error) {
  }
}

function normalizeCampusGroup(group, index = 0) {
  const groupId = group?.id || `campus-group-${Date.now()}-${index}`;
  const normalizedModules = Array.isArray(group?.modules) && group.modules.length
    ? group.modules.map((module, moduleIndex) => normalizeCampusGroupModule(module, groupId, moduleIndex))
    : buildFallbackCampusGroupModules(group, groupId);

  return {
    id: groupId,
    title: String(group?.title || `Grupo interno ${index + 1}`).trim(),
    summary: String(group?.summary || "").trim(),
    modules: normalizedModules,
    documents: normalizedModules.flatMap((module) => module.documents || []),
    practiceSheets: normalizedModules.flatMap((module) => module.practiceSheets || []),
    videos: normalizedModules.flatMap((module) => module.videos || []),
    links: normalizedModules.flatMap((module) => module.links || [])
  };
}

function getSelectedCampusGroup() {
  const baseGroup =
    state.campusGroups.find((group) => group.id === state.selectedCampusGroupId) ||
    state.campusGroups[0] ||
    null;
  if (!baseGroup) {
    return null;
  }

  return loadCampusDraft(baseGroup.id) || baseGroup;
}

function getSelectedCampusGroupModule(group = getSelectedCampusGroup()) {
  if (!group) {
    return null;
  }

  return (
    (group.modules || []).find((module) => module.id === selectedCampusGroupModuleId) ||
    group.modules?.[0] ||
    null
  );
}

function readCampusGroupEditorDraft(group) {
  if (!group) {
    return null;
  }
  const selectedModule = getSelectedCampusGroupModule(group) || group.modules?.[0] || null;
  if (!selectedModule) {
    return normalizeCampusGroup(group, 0);
  }

  const readCategory = (category) => {
    const rows = Array.from(document.querySelectorAll(`[data-campus-group-category="${category}"]`));
    if (!rows.length) {
      return Array.isArray(selectedModule[category]) ? selectedModule[category] : [];
    }

    return rows.map((row, index) => {
      const attachmentRaw = row.querySelector(`[data-campus-group-field="attachment"]`)?.value || "";
      let attachment = null;
      if (attachmentRaw) {
        try {
          attachment = JSON.parse(attachmentRaw);
        } catch (error) {
          attachment = null;
        }
      }
      if (!attachment) {
        const draftKey = getCampusGroupAttachmentDraftKey(group.id, selectedModule.id, category, row.dataset.entryId || "");
        attachment = campusGroupAttachmentDrafts[draftKey] || null;
      }
      return normalizeCampusGroupEntry(
        {
          id: row.dataset.entryId || `${group.id}-${category}-${index}`,
          title: row.querySelector(`[data-campus-group-field="title"]`)?.value || "",
          url: row.querySelector(`[data-campus-group-field="url"]`)?.value || "",
          note: row.querySelector(`[data-campus-group-field="note"]`)?.value || "",
          attachment
        },
        category,
        index
      );
    });
  };

  const nextModules = (group.modules || []).map((module, moduleIndex) =>
    module.id === selectedModule.id
      ? normalizeCampusGroupModule(
          {
            ...module,
            title: document.getElementById("campusGroupModuleTitle")?.value || module.title,
            summary: document.getElementById("campusGroupModuleSummary")?.value || module.summary,
            documents: readCategory("documents"),
            practiceSheets: readCategory("practiceSheets"),
            videos: readCategory("videos"),
            links: readCategory("links")
          },
          group.id,
          moduleIndex
        )
      : module
  );

  return normalizeCampusGroup(
    {
      ...group,
      title: document.getElementById("campusGroupTitle")?.value || group.title,
      summary: document.getElementById("campusGroupSummary")?.value || group.summary,
      modules: nextModules
    },
    0
  );
}

function getCourseEnrolledCount(course) {
  return Number(course?.enrolledCount ?? course?.enrolledIds?.length ?? 0);
}

function getCourseWaitingCount(course) {
  return Number(course?.waitingCount ?? course?.waitingIds?.length ?? 0);
}

function isCourseDiplomaWindowOpen(course) {
  if (!course) {
    return false;
  }

  if (["Cierre pendiente", "Cerrado"].includes(String(course.status || ""))) {
    return true;
  }

  const today = new Date().toISOString().slice(0, 10);
  return Boolean(course.endDate && course.endDate < today);
}

function getCoursePendingDiplomaDeliveries(course) {
  if (!isCourseDiplomaWindowOpen(course)) {
    return 0;
  }
  return Math.max((course.diplomaReady || []).length - (course.mailsSent || []).length, 0);
}

function isViewAllowed(viewId) {
  if (isAdminView()) {
    return true;
  }
  if (isCurrentMemberLimitedToAssociateProfile()) {
    return viewId === "join";
  }
  if (ADMIN_ONLY_VIEWS.has(viewId)) {
    return false;
  }
  if (isCampusOnlySession()) {
    return ["overview", "join", "campus", "test"].includes(viewId);
  }
  return true;
}

function buildRegistryNumber(course, member) {
  const records = state.courses
    .flatMap((item) =>
      (item.diplomaReady || [])
        .map((memberId) => {
          const diplomaMember = findMember(memberId);
          if (!diplomaMember) {
            return null;
          }
          return {
            course: item,
            member: diplomaMember
          };
        })
        .filter(Boolean)
    )
    .sort((a, b) => {
      const dateDiff = String(a.course.endDate).localeCompare(String(b.course.endDate));
      if (dateDiff !== 0) {
        return dateDiff;
      }
      return a.member.name.localeCompare(b.member.name, "es");
    });

  const index = records.findIndex(
    (item) => item.course.id === course.id && item.member.id === member.id
  );
  const year = new Date(course.endDate).getFullYear();
  return `IZ-DIP-${year}-${String(index + 1).padStart(4, "0")}`;
}

function getMemberHistory(memberId) {
  return state.courses
    .filter(
      (course) =>
        course.enrolledIds.includes(memberId) ||
        course.waitingIds.includes(memberId) ||
        course.diplomaReady.includes(memberId)
    )
    .sort((a, b) => String(b.endDate).localeCompare(String(a.endDate)))
    .map((course) => {
      const hasDiploma = course.diplomaReady.includes(memberId);
      const inWaiting = course.waitingIds.includes(memberId);
      const attendance = course.attendance?.[memberId];
      const evaluation = course.evaluations?.[memberId];

      return {
        title: course.title,
        statusLabel: hasDiploma
          ? `Diploma emitido${evaluation ? ` | ${evaluation}` : ""}`
          : inWaiting
            ? "En lista de espera"
            : "Inscrito",
        meta: [
          describeCourseType(course),
          `${course.hours} h`,
          attendance !== undefined ? `Asistencia ${attendance}%` : null,
          course.endDate ? `Fin ${formatDate(course.endDate)}` : null
        ]
          .filter(Boolean)
          .join(" | ")
      };
    });
}

function getAutomationActionLabel(item) {
  const labels = {
    pending_diplomas: "Enviar ahora",
    failed_email: "Reintentar correo",
    renewal: "Avisar renovacion",
    associate_application_receipt: "Enviar acuse",
    associate_application_info_request: "Pedir subsanacion",
    associate_application_reply_receipt: "Acusar respuesta",
    associate_application_reply_notification: "Avisar admin",
    associate_application_decision: "Enviar resolucion",
    associate_fee: "Avisar cuota",
    associate_legacy_access: "Crear acceso",
    associate_legacy_review: "Cerrar revision",
    associate_profile_notification: "Avisar ficha",
    associate_payment_notification: "Avisar revision",
    associate_welcome: "Enviar bienvenida",
    course_ready: "Cerrar curso"
  };

  return labels[item.type] || "";
}

function pickNextAgentItem() {
  if (!state.settings.agent.enabled) {
    return null;
  }

  const priorities = ["associate_legacy_access", "associate_legacy_review", "associate_application_receipt", "associate_application_info_request", "associate_application_reply_receipt", "associate_application_reply_notification", "associate_application_decision", "associate_welcome", "associate_profile_notification", "associate_payment_notification", "associate_fee", "failed_email", "pending_diplomas", "renewal", "course_ready"];
  const smtpReady = Boolean(
    state.settings?.smtp?.host && state.settings?.smtp?.port && state.settings?.smtp?.fromEmail
  );

  for (const type of priorities) {
    const item = (state.automationInbox || []).find((entry) => entry.type === type);
    if (!item) {
      continue;
    }

    if (type === "course_ready" && !state.settings.agent.canCloseCourses) {
      continue;
    }

    if (["associate_legacy_access", "associate_legacy_review"].includes(type) && !state.settings.agent.canResolveInbox) {
      continue;
    }

    if (["associate_application_receipt", "associate_application_info_request", "associate_application_reply_receipt", "associate_application_reply_notification", "associate_application_decision", "associate_welcome", "associate_profile_notification", "associate_payment_notification", "associate_fee", "failed_email", "pending_diplomas"].includes(type) && !state.settings.agent.canSendDiplomas) {
      continue;
    }

    if (type === "renewal" && !state.settings.agent.canResolveInbox) {
      continue;
    }

    if (["associate_application_receipt", "associate_application_info_request", "associate_application_reply_receipt", "associate_application_reply_notification", "associate_application_decision", "associate_welcome", "associate_profile_notification", "associate_payment_notification", "associate_fee", "failed_email", "pending_diplomas", "renewal"].includes(type) && !smtpReady) {
      continue;
    }

    return item;
  }

  return null;
}

function addActivity(type, actor, message) {
  state.activityLog.unshift({
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    actor,
    type,
    message
  });
  state.activityLog = state.activityLog.slice(0, 300);
}

function queueEmailForMember(courseId, memberId, markSent) {
  const course = state.courses.find((item) => item.id === courseId);
  const member = findMember(memberId);
  if (!course || !member) {
    return null;
  }

  const email = {
    id: `mail-${Date.now()}-${memberId}-${Math.random().toString(36).slice(2, 7)}`,
    courseId: course.id,
    memberId,
    to: member.email,
    subject: `Diploma emitido - ${course.title}`,
    body: buildEmailBody(member, course),
    sentAt: new Date().toISOString()
  };

  state.emailOutbox.unshift(email);
  if (markSent) {
    course.mailsSent = [...new Set([...course.mailsSent, memberId])];
  }
  return email;
}

function getManualNoticeRecipients(notice) {
  const audience = String(notice?.audience || "all").trim();
  const linkedCourse = notice?.courseId ? findCourse(notice.courseId) : null;
  const memberRecipients = (state.members || [])
    .filter((member) => String(member.email || "").trim())
    .map(buildMemberNoticeRecipient);
  const associateRecipients = (state.associates || [])
    .filter((associate) => String(associate.email || "").trim())
    .map(buildAssociateNoticeRecipient);
  const activeAssociateRecipients = (state.associates || [])
    .filter(isAssociateActiveForBulkEmail)
    .map(buildAssociateNoticeRecipient);

  if (audience === "associates") {
    const linkedMemberRecipients = memberRecipients.filter((recipient) => recipient.associateId);
    return dedupeNoticeEmailRecipients([...associateRecipients, ...linkedMemberRecipients]);
  }

  if (audience === "active-associates") {
    return dedupeNoticeEmailRecipients(activeAssociateRecipients);
  }

  if (audience === "campus-only") {
    return dedupeNoticeEmailRecipients(memberRecipients.filter((recipient) => !recipient.associateId));
  }

  if (audience === "course" && linkedCourse) {
    const ids = new Set([
      ...(linkedCourse.enrolledIds || []),
      ...(linkedCourse.waitingIds || []),
      ...(linkedCourse.diplomaReady || [])
    ]);
    return dedupeNoticeEmailRecipients(memberRecipients.filter((recipient) => ids.has(recipient.memberId)));
  }

  return dedupeNoticeEmailRecipients([...associateRecipients, ...memberRecipients]);
}

function buildMemberNoticeRecipient(member) {
  const associate = findAssociateByMember(member);
  return {
    id: `member-${member.id}`,
    memberId: member.id,
    associateId: associate?.id || member.associateId || "",
    name: member.name || member.email || "socio",
    email: member.email
  };
}

function buildAssociateNoticeRecipient(associate) {
  return {
    id: `associate-${associate.id}`,
    memberId: associate.linkedMemberId || "",
    associateId: associate.id,
    name: getAssociateFullName(associate) || associate.email || "socio",
    email: associate.email
  };
}

function isAssociateActiveForBulkEmail(associate) {
  if (!associate || !String(associate.email || "").trim()) {
    return false;
  }
  const status = normalizeSearchValue(associate.status || associate.situation || associate.estado || "");
  if (!status) {
    return true;
  }
  return status.includes("activa") || status.includes("activo") || status.includes("alta");
}

function getNoticeRecipientEmailKey(recipient) {
  return String(recipient?.email || "").trim().toLowerCase();
}

function dedupeNoticeEmailRecipients(recipients) {
  const seen = new Set();
  return recipients.filter((recipient) => {
    const key = getNoticeRecipientEmailKey(recipient);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildManualNoticeEmailBody(member, notice, linkedCourse) {
  const lines = [
    `Hola ${member.name},`,
    "",
    notice.title || "Nueva novedad del campus",
    "",
    notice.detail || "",
    linkedCourse ? `Curso vinculado: ${linkedCourse.title}` : "",
    "",
    linkedCourse
      ? `Entra en el campus para abrir directamente el curso y revisar la novedad.`
      : `Entra en el campus para revisar esta novedad y ver si requiere alguna accion por tu parte.`,
    "",
    "Isocrona Zero Campus"
  ].filter(Boolean);

  return lines.join("\n");
}

function queueManualNoticeEmails(notice) {
  const recipients = getManualNoticeRecipients(notice);
  const linkedCourse = notice.courseId ? findCourse(notice.courseId) : null;

  recipients.forEach((recipient) => {
    state.emailOutbox.unshift({
      id: `mail-notice-${Date.now()}-${recipient.id}-${Math.random().toString(36).slice(2, 7)}`,
      courseId: linkedCourse?.id || "",
      memberId: recipient.memberId || "",
      associateId: recipient.associateId || "",
      manualNoticeId: notice.id,
      to: recipient.email,
      subject: `${notice.title || "Novedad del campus"} - Isocrona Zero`,
      body: buildManualNoticeEmailBody(recipient, notice, linkedCourse),
      sentAt: new Date().toISOString(),
      status: state.settings?.smtp?.host ? "queued" : "manual",
      transport: state.settings?.smtp?.host ? "smtp-pending" : "manual"
    });
  });

  return recipients.length;
}

function resendMail(mailId) {
  const mail = state.emailOutbox.find((item) => item.id === mailId);
  if (!mail) {
    return null;
  }

  const cloned = {
    ...mail,
    id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sentAt: new Date().toISOString()
  };
  state.emailOutbox.unshift(cloned);
  return cloned;
}

function getLatestMailForMemberCourse(courseId, memberId) {
  return state.emailOutbox.find((mail) => mail.courseId === courseId && mail.memberId === memberId) || null;
}

function buildEmailBody(member, course) {
  return (state.settings.emailTemplate || "Hola {{name}}, su diploma del curso {{course}} ya esta disponible.")
    .replaceAll("{{name}}", member.name)
    .replaceAll("{{course}}", course.title);
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function countReplacementChars(text) {
  return (String(text || "").match(/\uFFFD/g) || []).length;
}

function fixMojibakeText(value) {
  const raw = String(value ?? "");
  if (!/[\u00C0-\u00FF\uFFFD]/.test(raw)) {
    return raw;
  }
  try {
    const bytes = Uint8Array.from(raw, (char) => char.charCodeAt(0));
    const repaired = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    if (countReplacementChars(repaired) <= countReplacementChars(raw)) {
      return repaired;
    }
  } catch (error) {
    // Ignore decoding issues and fall back to raw input.
  }
  return raw;
}

function normalizeDisplayText(value) {
  const rawValue = String(value ?? "");
  if (/^(https?:|data:|mailto:)/i.test(rawValue) || rawValue.includes("://")) {
    return rawValue;
  }
  const raw = fixMojibakeText(rawValue);
  if (!raw.includes("?") && !raw.includes("\uFFFD")) {
    return raw;
  }
  const replacements = [
    ["Rodr?guez", "Rodríguez"],
    ["T?cnicas", "Técnicas"],
    ["T?cnico", "Técnico"],
    ["T?cnicos", "Técnicos"],
    ["t?cnicas", "técnicas"],
    ["t?cnico", "técnico"],
    ["t?cnicos", "técnicos"],
    ["Pr?ctica", "Práctica"],
    ["pr?ctica", "práctica"],
    ["Pr?cticas", "Prácticas"],
    ["pr?cticas", "prácticas"],
    ["activaci?n", "activación"],
    ["evacuaci?n", "evacuación"],
    ["intervenci?n", "intervención"],
    ["evaluaci?n", "evaluación"],
    ["situaci?n", "situación"],
    ["localizaci?n", "localización"],
    ["extracci?n", "extracción"],
    ["progresi?n", "progresión"],
    ["estabilizaci?n", "estabilización"],
    ["inscripci?n", "inscripción"],
    ["matr?cula", "matrícula"],
    ["presentaci?n", "presentación"],
    ["com?n", "común"],
    ["compa?ero", "compañero"],
    ["compa?eros", "compañeros"],
    ["m?nimo", "mínimo"],
    ["m?nimos", "mínimos"],
    ["b?squeda", "búsqueda"],
    ["b?sicas", "básicas"],
    ["b?sica", "básica"],
    ["v?deo", "vídeo"],
    ["v?ctima", "víctima"],
    ["r?pido", "rápido"],
    ["qu? ", "qué "],
    ["Qu? ", "Qué "],
    ["?Cuando", "¿Cuándo"],
    ["?Que", "¿Qué"],
    ["?Cual", "¿Cuál"],
    ["?Donde", "¿Dónde"],
    ["?Como", "¿Cómo"],
    ["?Por", "¿Por"],
    ["?Se", "¿Se"],
    ["m�quina", "máquina"],
    ["m��quina", "máquina"],
    ["M�quina", "Máquina"],
    ["M��quina", "Máquina"],
    ["tr�fico", "tráfico"],
    ["Tr�fico", "Tráfico"]
  ];
  return replacements.reduce((result, [from, to]) => result.replaceAll(from, to), raw);
}

function escapeHtml(value) {
  return normalizeDisplayText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function readJsonResponse(response, fallbackMessage) {
  const raw = await response.text();
  try {
    return JSON.parse(raw || "{}");
  } catch (error) {
    if (!response.ok && String(raw || "").trim() === "Not found") {
      throw new Error("El servidor no tiene cargada esta funcion todavia. Reinicia el campus y vuelve a probar.");
    }
    throw new Error(fallbackMessage || "El servidor ha respondido con un formato no valido.");
  }
}

async function loadStorageMeta() {
  const response = await fetch("/api/storage");
  if (!response.ok) {
    throw new Error("storage unavailable");
  }
  const payload = await readJsonResponse(response, "No se pudo leer el almacenamiento del campus.");
  return payload.storage || null;
}

function formatFileSize(bytes) {
  const amount = Number(bytes || 0);
  if (amount >= 1_000_000) {
    return `${Math.round((amount / 1_000_000) * 10) / 10} MB`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000)} KB`;
  }
  return `${amount} B`;
}

async function readFileInput(input, options = {}) {
  const file = input.files && input.files[0];
  if (!file) {
    return null;
  }

  const maxBytes = Number(options.maxBytes || 0);
  if (maxBytes && file.size > maxBytes) {
    const label = String(options.label || "El archivo").trim();
    throw new Error(`${label} supera el limite de ${formatFileSize(maxBytes)}.`);
  }

  const contentBase64 = await readFileAsBase64(file);
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    contentBase64
  };
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo seleccionado"));
    reader.readAsDataURL(file);
  });
}

