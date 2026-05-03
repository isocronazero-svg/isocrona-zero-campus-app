const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const zlib = require("zlib");
const {
  associateUploadsDir,
  getStorageDebugInfo,
  getStorageMeta,
  readState,
  resetState,
  writeState
} = require("./storage");
const { sendMail } = require("./smtp");
const {
  authenticateUser,
  createUser,
  findUserByEmail,
  findUserById,
  initDatabase,
  isDatabaseEnabled,
  listTestResultsForUser,
  listUsers,
  normalizeRole: normalizePlatformRole,
  saveTestResult,
  signAuthToken,
  updateUser,
  verifyAuthToken
} = require("./db");

loadDotEnv(path.join(__dirname, ".env"));

const root = path.join(__dirname, "public");
const port = process.env.PORT || 3210;
const appRelease = "recovery-admin-2026-04-08-8";
const automationIntervalMs = Number(process.env.AUTOMATION_INTERVAL_MS || 300000);
const bundledDataDir = path.join(__dirname, "data");
const associateSelfEditWindowDays = Number(process.env.IZ_ASSOCIATE_SELF_EDIT_DAYS || 30);
const campusBaseUrl = normalizeBaseUrl(process.env.IZ_BASE_URL || `http://localhost:${port}`);
const legacyAssociateWorkbookPath =
  process.env.IZ_ASSOCIATES_WORKBOOK ||
  path.join(process.env.USERPROFILE || "", "Downloads", "CUOTAS SOCIOS.xlsx");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".odp": "application/vnd.oasis.opendocument.presentation"
};

const certificateTemplateLogoPath = path.join(
  bundledDataDir,
  "cert-template-inspect",
  "word",
  "media",
  "image1.png"
);
const certificateTemplateSourceDir = path.join(
  bundledDataDir,
  "cert-template-inspect"
);

const fallbackCertificateContentSections = [
  {
    title: "Fundamentos tecnicos y normativos",
    items: [
      "Legislacion aplicable al trabajo en altura.",
      "Marco normativo europeo para sistemas de proteccion.",
      "Principios fisicos del sistema de doble cuerda.",
      "Calculo basico de altura libre y factor de caida.",
      "Procedimientos de seguridad y planificacion de rescate."
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
      "Cabeceras simples, dobles y ecualizables.",
      "Gestion de angulos y reparto de cargas."
    ]
  },
  {
    title: "Tecnicas de progresion y rescate",
    items: [
      "Progresion vertical y horizontal por estructuras.",
      "Uso de bloqueadores y sistemas de linea de vida.",
      "Polipastos, maniobras de fuerza y rescate.",
      "Simulacros operativos de rescate en altura."
    ]
  }
];

ensureUploadDir();
const activeSessions = new Map();
const campusGroupResourceCategories = ["documents", "practiceSheets", "videos", "links"];

initDatabase().catch((error) => {
  console.warn("No se pudo inicializar PostgreSQL:", error.message);
});

function ensureUploadDir() {
  if (!fs.existsSync(associateUploadsDir)) {
    fs.mkdirSync(associateUploadsDir, { recursive: true });
  }
}

function loadDotEnv(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return;
    }
    const raw = fs.readFileSync(filePath, "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) {
        return;
      }
      const key = trimmed.slice(0, separatorIndex).trim();
      if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
        return;
      }
      let value = trimmed.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    });
  } catch (error) {
    console.warn(`No se pudo cargar .env desde ${filePath}:`, error.message);
  }
}

function normalizeBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function buildAbsoluteCampusUrl(relativePath = "/") {
  const normalizedPath = String(relativePath || "/").startsWith("/")
    ? String(relativePath || "/")
    : `/${String(relativePath || "/")}`;
  return `${campusBaseUrl}${normalizedPath}`;
}

function buildCampusGroupAttachmentUrl(groupId, moduleId, category, entryId) {
  const params = new URLSearchParams();
  params.set("groupId", String(groupId || ""));
  if (moduleId) {
    params.set("moduleId", String(moduleId || ""));
  }
  params.set("category", String(category || ""));
  params.set("entryId", String(entryId || ""));
  return buildAbsoluteCampusUrl(`/api/campus-groups/attachment?${params.toString()}`);
}

function parseCookies(req) {
  const header = String(req.headers.cookie || "");
  if (!header) {
    return {};
  }

  return header.split(";").reduce((acc, item) => {
    const [rawKey, ...rest] = item.trim().split("=");
    if (!rawKey) {
      return acc;
    }
    acc[rawKey] = decodeURIComponent(rest.join("=") || "");
    return acc;
  }, {});
}

function getSessionTokenFromRequest(req) {
  return String(parseCookies(req).iz_session || "").trim();
}

function buildSessionPayload(account, sessionToken = "") {
  return {
    accountId: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    memberId: account.memberId,
    associateId: account.associateId || "",
    mustChangePassword: Boolean(account.mustChangePassword)
  };
}

function hashLegacyAccountPassword(password) {
  const rawPassword = String(password || "");
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.scryptSync(rawPassword, salt, 64);
  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

function isScryptPasswordHash(value) {
  const normalized = String(value || "").trim();
  return /^scrypt:[0-9a-f]+:[0-9a-f]+$/i.test(normalized);
}

function isLegacySha256PasswordHash(value) {
  const normalized = String(value || "").trim();
  return /^[0-9a-f]{64}$/i.test(normalized);
}

function hasLegacyAccountPasswordHash(account) {
  return Boolean(String(account?.passwordHash || "").trim());
}

function needsPasswordHashUpgrade(account) {
  const storedHash = String(account?.passwordHash || "").trim();
  if (!storedHash) {
    return Boolean(String(account?.password || "").trim());
  }

  return !isScryptPasswordHash(storedHash);
}

function verifyLegacyAccountPassword(account, submittedPassword) {
  const candidate = String(submittedPassword || "");
  if (!candidate) {
    return false;
  }

  if (hasLegacyAccountPasswordHash(account)) {
    const storedHash = String(account.passwordHash || "").trim();
    if (isScryptPasswordHash(storedHash)) {
      const [, saltHex, hashHex] = storedHash.split(":");
      if (!saltHex || !hashHex) {
        return false;
      }

      const expectedHash = Buffer.from(hashHex, "hex");
      const derivedHash = crypto.scryptSync(candidate, Buffer.from(saltHex, "hex"), expectedHash.length);
      if (expectedHash.length !== derivedHash.length) {
        return false;
      }
      return crypto.timingSafeEqual(expectedHash, derivedHash);
    }

    if (isLegacySha256PasswordHash(storedHash)) {
      const legacyHash = crypto.createHash("sha256").update(candidate, "utf8").digest("hex");
      return crypto.timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(legacyHash, "hex"));
    }

    return false;
  }

  return String(account?.password || "") === candidate;
}

function setLegacyAccountPassword(account, password) {
  if (!account) {
    return account;
  }

  const rawPassword = String(password || "").trim();
  account.passwordHash = rawPassword ? hashLegacyAccountPassword(rawPassword) : "";
  account.password = "";
  return account;
}

function createSessionToken(account) {
  const token = `izs_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  activeSessions.set(token, {
    accountId: account.id,
    createdAt: new Date().toISOString()
  });
  return token;
}

function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie", `iz_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", "iz_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax");
}

function clearRequestSession(req) {
  const token = parseCookies(req).iz_session;
  if (token) {
    activeSessions.delete(token);
  }
}

function getAuthenticatedAccount(req, state) {
  const token = getSessionTokenFromRequest(req);
  if (!token) {
    return null;
  }

  const session = activeSessions.get(token);
  if (!session) {
    return null;
  }

  const account = (state.accounts || []).find((item) => item.id === session.accountId);
  if (!account) {
    activeSessions.delete(token);
    return null;
  }

  const associate = account.associateId
    ? (state.associates || []).find((item) => item.id === account.associateId)
    : null;
  if (associate && associate.status === "Baja") {
    return null;
  }

  return account;
}

function requireAuthenticatedAccount(req, res, state) {
  const account = getAuthenticatedAccount(req, state);
  if (!account) {
    sendJson(res, 401, { ok: false, error: "Inicia sesion para acceder al campus" });
    return null;
  }
  return account;
}

function requireAdminAccount(req, res, state) {
  const account = requireAuthenticatedAccount(req, res, state);
  if (!account) {
    return null;
  }
  if (account.role !== "admin") {
    sendJson(res, 403, { ok: false, error: "Esta accion esta reservada a administracion" });
    return null;
  }
  return account;
}

function getBearerTokenFromRequest(req) {
  const header = String(req.headers.authorization || "").trim();
  if (!/^Bearer\s+/i.test(header)) {
    return "";
  }
  return header.replace(/^Bearer\s+/i, "").trim();
}

async function getAuthenticatedDbUser(req) {
  if (!isDatabaseEnabled()) {
    return null;
  }
  const token = getBearerTokenFromRequest(req);
  if (!token) {
    return null;
  }
  const payload = verifyAuthToken(token);
  if (!payload?.sub) {
    return null;
  }
  return findUserById(payload.sub);
}

async function requireAuthenticatedDbUser(req, res) {
  const user = await getAuthenticatedDbUser(req);
  if (!user) {
    sendJson(res, 401, { ok: false, error: "Inicia sesion para continuar" });
    return null;
  }
  return user;
}

async function requireAdminDbUser(req, res) {
  const user = await requireAuthenticatedDbUser(req, res);
  if (!user) {
    return null;
  }
  if (normalizePlatformRole(user.role) !== "admin") {
    sendJson(res, 403, { ok: false, error: "Esta accion esta reservada a administracion" });
    return null;
  }
  return user;
}

function mapPlatformRoleToLegacyAccountRole(role) {
  return normalizePlatformRole(role) === "admin" ? "admin" : "member";
}

function mapPlatformRoleToLegacyMemberRole(role) {
  const normalizedRole = normalizePlatformRole(role);
  if (normalizedRole === "admin") {
    return "Administracion";
  }
  if (normalizedRole === "instructor") {
    return "Instructor";
  }
  return "Socio";
}

function generateLegacyId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function ensureLegacyAccountForDbUser(state, dbUser, options = {}) {
  state.accounts = Array.isArray(state.accounts) ? state.accounts : [];
  state.members = Array.isArray(state.members) ? state.members : [];
  state.associates = Array.isArray(state.associates) ? state.associates : [];
  state.testResults = Array.isArray(state.testResults) ? state.testResults : [];

  const normalizedEmail = String(dbUser?.email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const matchedAssociate =
    (dbUser.associateId && state.associates.find((item) => item.id === dbUser.associateId)) ||
    state.associates.find((item) => String(item.email || "").trim().toLowerCase() === normalizedEmail) ||
    null;

  let member =
    (dbUser.memberId && state.members.find((item) => item.id === dbUser.memberId)) ||
    state.members.find((item) => String(item.email || "").trim().toLowerCase() === normalizedEmail) ||
    (matchedAssociate &&
      state.members.find(
        (item) => item.associateId === matchedAssociate.id || item.id === matchedAssociate.linkedMemberId
      )) ||
    null;

  if (!member) {
    member = {
      id: generateLegacyId("member-db"),
      name: dbUser.name,
      role: mapPlatformRoleToLegacyMemberRole(dbUser.role),
      email: dbUser.email,
      certifications: [],
      renewalsDue: 0,
      associateId: matchedAssociate?.id || "",
      source: "postgres",
      phone: dbUser.phone || ""
    };
    state.members.unshift(member);
  } else {
    member.name = dbUser.name || member.name;
    member.email = dbUser.email || member.email;
    member.role = mapPlatformRoleToLegacyMemberRole(dbUser.role);
    member.associateId = matchedAssociate?.id || member.associateId || "";
    member.phone = dbUser.phone || member.phone || "";
    member.source = member.source || "postgres";
  }

  let account =
    state.accounts.find((item) => String(item.email || "").trim().toLowerCase() === normalizedEmail) ||
    state.accounts.find((item) => item.memberId === member.id) ||
    null;

  if (!account) {
    account = {
      id: generateLegacyId("account-db"),
      name: dbUser.name,
      email: dbUser.email,
      password: "",
      passwordHash: "",
      role: mapPlatformRoleToLegacyAccountRole(dbUser.role),
      memberId: member.id,
      associateId: matchedAssociate?.id || "",
      mustChangePassword: false,
      source: "postgres"
    };
    state.accounts.unshift(account);
  } else {
    account.name = dbUser.name || account.name;
    account.email = dbUser.email || account.email;
    account.role = mapPlatformRoleToLegacyAccountRole(dbUser.role);
    account.memberId = member.id;
    account.associateId = matchedAssociate?.id || account.associateId || "";
    account.source = "postgres";
  }

  if (typeof options.password === "string" && options.password.trim()) {
    setLegacyAccountPassword(account, options.password);
  }

  if (matchedAssociate) {
    matchedAssociate.linkedMemberId = member.id;
    matchedAssociate.linkedAccountId = account.id;
    matchedAssociate.campusAccessStatus = "active";
  }

  return { account, member, associate: matchedAssociate };
}

function buildPlatformSessionPayload(account, sessionToken = "", extras = {}) {
  return {
    ...buildSessionPayload(account, sessionToken),
    userId: String(extras.userId || ""),
    jwt: String(extras.jwt || ""),
    platformRole: normalizePlatformRole(extras.platformRole || (account.role === "admin" ? "admin" : "socio"))
  };
}

function listLegacyUsersFromState(state) {
  const accounts = Array.isArray(state.accounts) ? state.accounts : [];
  const members = Array.isArray(state.members) ? state.members : [];
  return accounts.map((account) => {
    const member = members.find((item) => item.id === account.memberId) || null;
    return {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role === "admin" ? "admin" : member?.role === "Instructor" ? "instructor" : "socio",
      status: "active",
      phone: member?.phone || "",
      service: member?.service || "",
      memberId: account.memberId || "",
      associateId: account.associateId || ""
    };
  });
}

function buildLegacyCurrentUser(account, state) {
  if (!account) {
    return null;
  }
  const member = (state.members || []).find((item) => item.id === account.memberId) || null;
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role === "admin" ? "admin" : member?.role === "Instructor" ? "instructor" : "socio",
    status: "active",
    phone: member?.phone || "",
    service: member?.service || "",
    memberId: account.memberId || "",
    associateId: account.associateId || ""
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

function isCoursePublicAccess(course) {
  return normalizeCourseAccessScope(
    course?.accessScope || course?.enrollmentScope || course?.visibility,
    course?.audience || ""
  ) === "public";
}

function getCourseEnrollmentOpensAtTimestamp(course) {
  const raw = String(course?.enrollmentOpensAt || "").trim();
  if (!raw) {
    return null;
  }
  const timestamp = new Date(raw).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function isCourseEnrollmentWindowOpen(course, nowValue = Date.now()) {
  const timestamp = getCourseEnrollmentOpensAtTimestamp(course);
  if (timestamp === null) {
    return true;
  }
  const nowTimestamp =
    typeof nowValue === "number"
      ? nowValue
      : nowValue instanceof Date
        ? nowValue.getTime()
        : new Date(nowValue).getTime();
  return timestamp <= nowTimestamp;
}

function formatCourseEnrollmentOpensAt(course) {
  const raw = String(course?.enrollmentOpensAt || "").trim();
  if (!raw) {
    return "";
  }
  return new Date(raw).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function compactCampusAttachmentForTransport(attachment, groupId, moduleId, category, entryId) {
  if (!attachment) {
    return null;
  }
  return {
    ...attachment,
    contentBase64: "",
    transportUrl: buildCampusGroupAttachmentUrl(groupId, moduleId, category, entryId)
  };
}

function parseCampusSnapshotUpload(snapshotFile) {
  const file = snapshotFile && typeof snapshotFile === "object" ? snapshotFile : null;
  const base64 = String(file?.contentBase64 || "").trim();
  if (!base64) {
    throw new Error("Adjunta un state.json valido antes de importarlo.");
  }

  let raw = "";
  try {
    raw = Buffer.from(base64, "base64").toString("utf8");
  } catch (error) {
    throw new Error("No se pudo leer el snapshot enviado.");
  }

  let importedState = null;
  try {
    importedState = JSON.parse(raw || "{}");
  } catch (error) {
    throw new Error("El archivo state.json no contiene un JSON valido.");
  }

  if (!importedState || typeof importedState !== "object" || Array.isArray(importedState)) {
    throw new Error("El snapshot del campus no tiene un formato valido.");
  }

  const requiredCollections = ["accounts", "associates", "members", "courses"];
  const missingCollections = requiredCollections.filter((key) => !Array.isArray(importedState[key]));
  if (missingCollections.length) {
    throw new Error(
      `El snapshot no incluye las colecciones esperadas: ${missingCollections.join(", ")}.`
    );
  }

  return importedState;
}

function readDefaultState() {
  return JSON.parse(fs.readFileSync(path.join(bundledDataDir, "default-state.json"), "utf8"));
}

function prepareCleanPrepublicationState(state, actorName = "Administracion") {
  const cleanState = structuredClone(state || {});
  const adminAccounts = (cleanState.accounts || []).filter((account) => account.role === "admin");
  cleanState.accounts = adminAccounts.length
    ? adminAccounts.map((account) => ({
        ...account,
        memberId: "",
        associateId: ""
      }))
    : (readDefaultState().accounts || []).filter((account) => account.role === "admin");

  cleanState.associates = [];
  cleanState.members = [];
  cleanState.courses = [];
  cleanState.campusGroups = [];
  cleanState.associateApplications = [];
  cleanState.associatePaymentSubmissions = [];
  cleanState.associateProfileRequests = [];
  cleanState.automationInbox = [];
  cleanState.emailOutbox = [];
  cleanState.agentLog = [];
  cleanState.activityLog = [];
  cleanState.selectedAssociateId = "";
  cleanState.selectedMemberId = "";
  cleanState.selectedCourseId = "";
  cleanState.selectedCampusGroupId = "";
  cleanState.selectedAssociateApplicationId = "";
  cleanState.selectedAssociatePaymentSubmissionId = "";
  cleanState.selectedAssociateProfileRequestId = "";
  cleanState.activeView = "dashboard";
  cleanState.role = "admin";
  cleanState.settings = cleanState.settings || {};
  cleanState.settings.associates = cleanState.settings.associates || {};
  cleanState.settings.associates.nextAssociateNumber = 1;

  appendActivity(
    cleanState,
    "admin",
    actorName,
    "Prepublicacion",
    "Campus de prueba limpiado para importar socios reales desde Excel"
  );

  return cleanState;
}

function normalizeCampusAccountRole(role) {
  return role === "admin" ? "admin" : "member";
}

function getRecoveryAdminEnvConfig() {
  const email = String(process.env.IZ_RECOVERY_ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();
  const password = String(process.env.IZ_RECOVERY_ADMIN_PASSWORD || "").trim();
  const enabled = Boolean(email && password);
  return {
    email,
    password,
    enabled
  };
}

function applyRecoveryAdminAccessFromEnv(options = {}) {
  const recoveryConfig = getRecoveryAdminEnvConfig();
  const email = String(options.email || recoveryConfig.email)
    .trim()
    .toLowerCase();
  const password = String(options.password || recoveryConfig.password).trim();
  if (!recoveryConfig.enabled) {
    return null;
  }
  if (!email || !password) {
    return null;
  }

  if (password.length < 8) {
    console.warn("IZ_RECOVERY_ADMIN_PASSWORD debe tener al menos 8 caracteres; recuperacion admin omitida.");
    return null;
  }

  const state = readState();
  state.accounts = Array.isArray(state.accounts) ? state.accounts : [];
  state.members = Array.isArray(state.members) ? state.members : [];
  state.associates = Array.isArray(state.associates) ? state.associates : [];

  const associate = state.associates.find(
    (item) => String(item.email || "").trim().toLowerCase() === email
  );
  let member = state.members.find(
    (item) =>
      String(item.email || "").trim().toLowerCase() === email ||
      (associate && item.associateId === associate.id)
  );

  if (!member) {
    member = {
      id: `member-recovery-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: associate ? getAssociateFullName(associate) : "Administrador recuperado",
      role: "Administracion",
      email,
      certifications: [],
      renewalsDue: 0,
      associateId: associate?.id || "",
      source: "recovery"
    };
    state.members.unshift(member);
  } else {
    member.email = email;
    member.name = associate ? getAssociateFullName(associate) : member.name || "Administrador recuperado";
    member.role = "Administracion";
    member.associateId = associate?.id || member.associateId || "";
    member.source = member.source || "recovery";
  }

  let account = state.accounts.find(
    (item) =>
      String(item.email || "").trim().toLowerCase() === email ||
      item.memberId === member.id ||
      (associate && item.associateId === associate.id)
  );

  if (!account) {
    account = {
      id: `account-recovery-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: member.name,
      email,
      password: "",
      passwordHash: "",
      role: "admin",
      memberId: member.id,
      associateId: associate?.id || "",
      mustChangePassword: false,
      source: "recovery"
    };
    setLegacyAccountPassword(account, password);
    state.accounts.push(account);
  } else {
    account.name = member.name || account.name || "Administrador recuperado";
    account.email = email;
    setLegacyAccountPassword(account, password);
    account.role = "admin";
    account.memberId = member.id;
    account.associateId = associate?.id || account.associateId || "";
    account.mustChangePassword = false;
    account.source = account.source || "recovery";
  }

  if (associate) {
    associate.linkedMemberId = member.id;
    associate.linkedAccountId = account.id;
    associate.campusAccessStatus = "active";
    associate.temporaryPassword = "";
  }

  appendActivity(
    state,
    "system",
    "Recuperacion",
    `Acceso administrador recuperado para ${email} desde variables de entorno`
  );
  writeState(state);
  console.log(`Acceso administrador recuperado para ${email}. Retira IZ_RECOVERY_ADMIN_* tras entrar.`);
  return account;
}

function compactCampusGroupsForTransport(campusGroups = []) {
  return (Array.isArray(campusGroups) ? campusGroups : []).map((group) => {
    const compactCategoryEntries = (entries, moduleId, category) =>
      (Array.isArray(entries) ? entries : []).map((entry) => ({
        ...entry,
        attachment: compactCampusAttachmentForTransport(
          entry?.attachment,
          group?.id,
          moduleId,
          category,
          entry?.id
        )
      }));

    return {
      ...group,
      documents: compactCategoryEntries(group.documents, "", "documents"),
      practiceSheets: compactCategoryEntries(group.practiceSheets, "", "practiceSheets"),
      videos: compactCategoryEntries(group.videos, "", "videos"),
      links: compactCategoryEntries(group.links, "", "links"),
      modules: (Array.isArray(group.modules) ? group.modules : []).map((module) => ({
        ...module,
        documents: compactCategoryEntries(module.documents, module.id, "documents"),
        practiceSheets: compactCategoryEntries(module.practiceSheets, module.id, "practiceSheets"),
        videos: compactCategoryEntries(module.videos, module.id, "videos"),
        links: compactCategoryEntries(module.links, module.id, "links")
      }))
    };
  });
}

function findCampusGroupEntry(campusGroups = [], groupId, moduleId, category, entryId) {
  const group = (Array.isArray(campusGroups) ? campusGroups : []).find((item) => item.id === groupId);
  if (!group || !campusGroupResourceCategories.includes(category)) {
    return null;
  }
  const scope = moduleId
    ? (Array.isArray(group.modules) ? group.modules : []).find((item) => item.id === moduleId)
    : group;
  if (!scope) {
    return null;
  }
  return (Array.isArray(scope[category]) ? scope[category] : []).find((item) => item.id === entryId) || null;
}

function mergeCampusGroupAttachmentsFromCurrentState(currentGroups = [], nextGroups = []) {
  const mergeCategoryEntries = (currentEntries, nextEntries) =>
    (Array.isArray(nextEntries) ? nextEntries : []).map((entry) => {
      const currentEntry = (Array.isArray(currentEntries) ? currentEntries : []).find((item) => item.id === entry?.id);
      const nextAttachment = entry?.attachment;
      const currentAttachment = currentEntry?.attachment;
      if (!nextAttachment) {
        return {
          ...entry,
          attachment: null
        };
      }

      const mergedAttachment = {
        name: String(nextAttachment.name || currentAttachment?.name || "").trim(),
        type: String(nextAttachment.type || currentAttachment?.type || "application/octet-stream").trim(),
        size: Number(nextAttachment.size || currentAttachment?.size || 0),
        contentBase64: String(nextAttachment.contentBase64 || currentAttachment?.contentBase64 || "").trim()
      };

      if (!mergedAttachment.contentBase64) {
        return {
          ...entry,
          attachment: null
        };
      }

      return {
        ...entry,
        attachment: mergedAttachment
      };
    });

  return (Array.isArray(nextGroups) ? nextGroups : []).map((group) => {
    const currentGroup = (Array.isArray(currentGroups) ? currentGroups : []).find((item) => item.id === group?.id);
    return {
      ...group,
      documents: mergeCategoryEntries(currentGroup?.documents, group.documents),
      practiceSheets: mergeCategoryEntries(currentGroup?.practiceSheets, group.practiceSheets),
      videos: mergeCategoryEntries(currentGroup?.videos, group.videos),
      links: mergeCategoryEntries(currentGroup?.links, group.links),
      modules: (Array.isArray(group.modules) ? group.modules : []).map((module) => {
        const currentModule = (Array.isArray(currentGroup?.modules) ? currentGroup.modules : []).find(
          (item) => item.id === module?.id
        );
        return {
          ...module,
          documents: mergeCategoryEntries(currentModule?.documents, module.documents),
          practiceSheets: mergeCategoryEntries(currentModule?.practiceSheets, module.practiceSheets),
          videos: mergeCategoryEntries(currentModule?.videos, module.videos),
          links: mergeCategoryEntries(currentModule?.links, module.links)
        };
      })
    };
  });
}

function prepareStateForTransport(state, account) {
  const baseState = sanitizeStateForTransport(sanitizeStateForAccount(state, account));
  return {
    ...baseState,
    campusGroups: compactCampusGroupsForTransport(baseState.campusGroups || [])
  };
}

function stripAccountSecrets(account) {
  if (!account || typeof account !== "object") {
    return account;
  }

  const {
    password,
    passwordHash,
    sessionToken,
    resetToken,
    authToken,
    accessToken,
    refreshToken,
    ...safeAccount
  } = account;

  return safeAccount;
}

function stripSmtpSecrets(smtp) {
  if (!smtp || typeof smtp !== "object") {
    return smtp;
  }

  return {
    ...smtp,
    password: "",
    clientSecret: "",
    accessToken: "",
    refreshToken: ""
  };
}

function sanitizeStateForTransport(state) {
  if (!state || typeof state !== "object") {
    return state;
  }

  return {
    ...state,
    accounts: (state.accounts || []).map(stripAccountSecrets),
    settings: {
      ...(state.settings || {}),
      smtp: stripSmtpSecrets(state.settings?.smtp || {})
    }
  };
}

function restoreTransportSanitizedSecrets(currentState, nextState) {
  if (!nextState || typeof nextState !== "object") {
    return nextState;
  }

  const currentAccounts = new Map((currentState.accounts || []).map((item) => [item.id, item]));
  nextState.accounts = (nextState.accounts || []).map((account) => {
    const currentAccount = currentAccounts.get(account.id);
    if (!currentAccount) {
      return account;
    }

    return {
      ...account,
      password:
        typeof account.password === "string" && account.password.trim()
          ? account.password
          : currentAccount.password || "",
      passwordHash:
        typeof account.passwordHash === "string" && account.passwordHash.trim()
          ? account.passwordHash
          : currentAccount.passwordHash || "",
      sessionToken:
        typeof account.sessionToken === "string" && account.sessionToken.trim()
          ? account.sessionToken
          : currentAccount.sessionToken || "",
      resetToken:
        typeof account.resetToken === "string" && account.resetToken.trim()
          ? account.resetToken
          : currentAccount.resetToken || "",
      authToken:
        typeof account.authToken === "string" && account.authToken.trim()
          ? account.authToken
          : currentAccount.authToken || "",
      accessToken:
        typeof account.accessToken === "string" && account.accessToken.trim()
          ? account.accessToken
          : currentAccount.accessToken || "",
      refreshToken:
        typeof account.refreshToken === "string" && account.refreshToken.trim()
          ? account.refreshToken
          : currentAccount.refreshToken || ""
    };
  });

  nextState.settings = {
    ...(nextState.settings || {}),
    smtp: {
      ...(nextState.settings?.smtp || {}),
      password:
        typeof nextState.settings?.smtp?.password === "string" && nextState.settings.smtp.password.trim()
          ? nextState.settings.smtp.password
          : currentState.settings?.smtp?.password || "",
      clientSecret:
        typeof nextState.settings?.smtp?.clientSecret === "string" && nextState.settings.smtp.clientSecret.trim()
          ? nextState.settings.smtp.clientSecret
          : currentState.settings?.smtp?.clientSecret || "",
      accessToken:
        typeof nextState.settings?.smtp?.accessToken === "string" && nextState.settings.smtp.accessToken.trim()
          ? nextState.settings.smtp.accessToken
          : currentState.settings?.smtp?.accessToken || "",
      refreshToken:
        typeof nextState.settings?.smtp?.refreshToken === "string" && nextState.settings.smtp.refreshToken.trim()
          ? nextState.settings.smtp.refreshToken
          : currentState.settings?.smtp?.refreshToken || ""
    }
  };

  return nextState;
}

function getPublicCampusCourses(state) {
  return (state.courses || [])
    .filter((course) => isCoursePublicAccess(course))
    .map((course) => {
      const enrolledCount = Array.isArray(course.enrolledIds) ? course.enrolledIds.length : 0;
      const waitingCount = Array.isArray(course.waitingIds) ? course.waitingIds.length : 0;
      const capacity = Number(course.capacity || 0);
      return {
        id: course.id,
        title: course.title || "",
        summary: course.summary || "",
        courseClass: course.courseClass || course.classType || "",
        type: course.type || "",
        status: course.status || "Planificacion",
        startDate: course.startDate || "",
        endDate: course.endDate || "",
        hours: Number(course.hours || 0),
        capacity,
        enrolledCount,
        waitingCount,
        seatsAvailable: Math.max(capacity - enrolledCount, 0),
        accessScope: "public",
        audience: course.audience || "Abierto a todo el mundo",
        enrollmentFee: Number(course.enrollmentFee || 0),
        modality: course.modality || "Presencial",
        enrollmentOpensAt: String(course.enrollmentOpensAt || "").trim(),
        enrollmentWindowOpen:
          String(course.status || "") === "Inscripcion abierta" && isCourseEnrollmentWindowOpen(course)
      };
    });
}

function registerPublicCampusAccount(state, payload) {
  state.members = state.members || [];
  state.accounts = state.accounts || [];

  const firstName = String(payload.firstName || "").trim();
  const lastName = String(payload.lastName || "").trim();
  const email = String(payload.email || "")
    .trim()
    .toLowerCase();
  const phone = String(payload.phone || "").trim();
  const password = String(payload.password || "");

  if (!firstName || !lastName || !email || !password) {
    throw new Error("Completa nombre, apellidos, email y contrasena");
  }

  if (password.length < 8) {
    throw new Error("La contrasena debe tener al menos 8 caracteres");
  }

  const existingAccount = (state.accounts || []).find(
    (item) => String(item.email || "").trim().toLowerCase() === email
  );
  if (existingAccount) {
    throw new Error("Ya existe un acceso al campus con este email");
  }

  const existingAssociate = (state.associates || []).find(
    (item) => String(item.email || "").trim().toLowerCase() === email
  );
  if (existingAssociate) {
    throw new Error("Ese email ya pertenece a una ficha de socio. Usa tu acceso normal al campus.");
  }

  let member = (state.members || []).find(
    (item) => String(item.email || "").trim().toLowerCase() === email && !item.associateId
  );

  if (!member) {
    member = {
      id: `member-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${firstName} ${lastName}`.trim(),
      role: "Participante externo",
      email,
      phone,
      certifications: [],
      renewalsDue: 0,
      associateId: "",
      source: "public-campus"
    };
    state.members.unshift(member);
  } else {
    member.name = `${firstName} ${lastName}`.trim();
    member.email = email;
    member.phone = phone;
    member.role = member.role || "Participante externo";
    member.source = "public-campus";
  }

  const account = {
    id: `account-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: member.name,
    email,
    password: "",
    passwordHash: "",
    role: "member",
    memberId: member.id,
    associateId: "",
    mustChangePassword: false,
    source: "public-campus"
  };
  setLegacyAccountPassword(account, password);
  state.accounts.push(account);

  appendActivity(
    state,
    "system",
    "Campus",
    `Se ha creado acceso solo campus para ${member.name} (${email})`
  );

  return { member, account };
}

function findAssociateForAccount(state, account, member) {
  const associateId = member?.associateId || account?.associateId || "";
  const memberEmail = String(member?.email || account?.email || "").trim().toLowerCase();
  const memberName = String(member?.name || account?.name || "").trim().toLowerCase();
  return (
    (state.associates || []).find(
      (associate) =>
        associate.id === associateId ||
        associate.linkedMemberId === member?.id ||
        associate.linkedAccountId === account?.id ||
        (memberEmail && String(associate.email || "").trim().toLowerCase() === memberEmail) ||
        (memberName &&
          `${String(associate.firstName || "").trim()} ${String(associate.lastName || "").trim()}`
            .trim()
            .toLowerCase() === memberName)
    ) || null
  );
}

function resolveAssociateForAuthenticatedAccount(state, account) {
  const member = account?.memberId
    ? (state.members || []).find((item) => item.id === account.memberId) || null
    : null;
  return findAssociateForAccount(state, account, member);
}

function getAssociateCurrentYearQuotaGap(associate) {
  if (!associate) {
    return 0;
  }
  const currentYear = String(new Date().getFullYear());
  const paid = Number(associate.yearlyFees?.[currentYear] || 0);
  return Math.max(0, Number(associate.annualAmount || 0) - paid);
}

function isAssociateAccessLimitedByQuota(associate) {
  return getAssociateCurrentYearQuotaGap(associate) > 0;
}

function buildMemberScopedState(state, account, memberIdOverride) {
  const memberId = memberIdOverride || account.memberId || "";
  const scopedMember = (state.members || []).find((item) => item.id === memberId) || null;
  const associateId = scopedMember?.associateId || account.associateId || "";
  const memberEmail = String(scopedMember?.email || account.email || "").toLowerCase();
  const campusOnlyAccess = !associateId;
  const scopedAssociate = findAssociateForAccount(state, account, scopedMember);
  const quotaLimitedAccess = !campusOnlyAccess && isAssociateAccessLimitedByQuota(scopedAssociate);
  const memberOwnedCourseIds = quotaLimitedAccess
    ? new Set()
    : new Set(
        (state.courses || [])
          .filter((course) => {
            const hasEnrollment = (course.enrolledIds || []).includes(memberId);
            const isWaiting = (course.waitingIds || []).includes(memberId);
            const hasDiploma = (course.diplomaReady || []).includes(memberId);
            const hasSubmission = (course.enrollmentSubmissions || []).some((item) => item.memberId === memberId);
            return hasEnrollment || isWaiting || hasDiploma || hasSubmission;
          })
          .map((course) => course.id)
      );
  const visibleCourses = quotaLimitedAccess
    ? []
    : (state.courses || []).filter((course) => {
        if (!campusOnlyAccess) {
          return true;
        }
        if (!isCoursePublicAccess(course)) {
          return false;
        }
        if (!memberOwnedCourseIds.size) {
          return true;
        }
        return memberOwnedCourseIds.has(course.id);
      })
      .map((course) => {
      const isEnrolled = (course.enrolledIds || []).includes(memberId);
      const isWaiting = (course.waitingIds || []).includes(memberId);
      const hasDiploma = (course.diplomaReady || []).includes(memberId);
      const mailSent = (course.mailsSent || []).includes(memberId);
      const ownAttendance = memberId ? { [memberId]: course.attendance?.[memberId] ?? 0 } : {};
      const ownEvaluations = memberId
        ? { [memberId]: course.evaluations?.[memberId] ?? "Pendiente" }
        : {};
      const ownProgress = memberId
        ? { [memberId]: course.contentProgress?.[memberId] || { lessonIds: [], blockIds: [], updatedAt: "" } }
        : {};
      const ownEnrollmentSubmissions = (course.enrollmentSubmissions || []).filter((item) => item.memberId === memberId);

      return {
        ...course,
        accessScope: normalizeCourseAccessScope(course.accessScope, course.audience),
        enrolledCount: (course.enrolledIds || []).length,
        waitingCount: (course.waitingIds || []).length,
        diplomaReadyCount: (course.diplomaReady || []).length,
        mailsSentCount: (course.mailsSent || []).length,
        enrolledIds: isEnrolled ? [memberId] : [],
        waitingIds: isWaiting ? [memberId] : [],
        diplomaReady: hasDiploma ? [memberId] : [],
        mailsSent: mailSent ? [memberId] : [],
        attendance: ownAttendance,
        evaluations: ownEvaluations,
        contentProgress: ownProgress,
        enrollmentSubmissions: ownEnrollmentSubmissions
      };
    });
  const selectedCourseId = visibleCourses.some((course) => course.id === state.selectedCourseId)
    ? state.selectedCourseId
    : visibleCourses[0]?.id || null;

  return {
    ...state,
    role: "member",
    activeView: quotaLimitedAccess ? "join" : state.activeView,
    selectedMemberId: memberId || null,
    selectedAssociateId: associateId || null,
    selectedCourseId,
    selectedAssociateApplicationId: null,
    selectedAssociatePaymentSubmissionId: null,
    selectedAssociateProfileRequestId: null,
    associateApplications: [],
    associatePaymentSubmissions: (state.associatePaymentSubmissions || []).filter(
      (item) => item.associateId === associateId || item.memberId === memberId
    ),
    associateProfileRequests: (state.associateProfileRequests || []).filter(
      (item) => item.associateId === associateId || item.memberId === memberId
    ),
    automationInbox: [],
    automationMeta: {
      lastRunAt: "",
      lastReason: "",
      lastSummary: null
    },
    agentLog: [],
    activityLog: (state.activityLog || []).filter(
      (item) => item.actor === account.name || item.type === "member"
    ),
    accounts: (state.accounts || [])
      .filter((item) => item.id === account.id)
      .map(stripAccountSecrets),
    members: (state.members || []).filter((item) => item.id === memberId),
    associates: (state.associates || []).filter(
      (item) => item.id === associateId || item.email.toLowerCase() === memberEmail
    ),
    emailOutbox: quotaLimitedAccess
      ? []
      : (state.emailOutbox || []).filter((item) => item.memberId === memberId || item.associateId === associateId),
    settings: {
      ...state.settings,
      smtp: stripSmtpSecrets({
        host: "",
        port: 0,
        secure: true,
        startTls: false,
        username: "",
        password: "",
        fromEmail: "",
        fromName: state.settings?.organization || "Isocrona Zero Campus",
        testTo: ""
      }),
      agent: {
        enabled: false,
        canResolveInbox: false,
        canSendDiplomas: false,
        canCloseCourses: false,
        notes: ""
      }
    },
    campusGroups: campusOnlyAccess || quotaLimitedAccess ? [] : state.campusGroups || [],
    courses: visibleCourses
  };
}

function mergeMemberScopedStateIntoFullState(fullState, scopedState, account) {
  const memberId = account.memberId || "";
  if (!memberId) {
    return structuredClone(fullState);
  }

  const nextState = structuredClone(fullState);
  const member = (nextState.members || []).find((item) => item.id === memberId) || null;
  const associate = findAssociateForAccount(nextState, account, member);
  if (isAssociateAccessLimitedByQuota(associate)) {
    return nextState;
  }

  const scopedCourses = Array.isArray(scopedState?.courses) ? scopedState.courses : [];

  for (const scopedCourse of scopedCourses) {
    const course = (nextState.courses || []).find((item) => item.id === scopedCourse.id);
    if (!course) {
      continue;
    }

    const scopedProgress = scopedCourse.contentProgress?.[memberId];
    if (scopedProgress) {
      course.contentProgress = course.contentProgress || {};
      course.contentProgress[memberId] = {
        lessonIds: Array.isArray(scopedProgress.lessonIds)
          ? [...new Set(scopedProgress.lessonIds.map((item) => String(item).trim()).filter(Boolean))]
          : [],
        blockIds: Array.isArray(scopedProgress.blockIds)
          ? [...new Set(scopedProgress.blockIds.map((item) => String(item).trim()).filter(Boolean))]
          : [],
        updatedAt: scopedProgress.updatedAt || new Date().toISOString()
      };
    }

    const scopedFeedback = Array.isArray(scopedCourse.feedbackResponses)
      ? scopedCourse.feedbackResponses.find((response) => response.memberId === memberId)
      : null;
    if (scopedFeedback) {
      course.feedbackResponses = [
        ...((course.feedbackResponses || []).filter((response) => response.memberId !== memberId)),
        {
          ...scopedFeedback,
          id: scopedFeedback.id || `feedback-${Date.now()}`,
          memberId,
          submittedAt: scopedFeedback.submittedAt || new Date().toISOString(),
          activityScore: Number(scopedFeedback.activityScore || 0),
          contentsScore: Number(scopedFeedback.contentsScore || 0),
          organizationScore: Number(scopedFeedback.organizationScore || 0),
          teacherClarityScore: Number(scopedFeedback.teacherClarityScore || 0),
          teacherUsefulnessScore: Number(scopedFeedback.teacherUsefulnessScore || 0),
          teacherSupportScore: Number(scopedFeedback.teacherSupportScore || 0),
          recommendationScore: Number(scopedFeedback.recommendationScore || 0),
          comment: String(scopedFeedback.comment || "").trim(),
          teacherComment: String(scopedFeedback.teacherComment || "").trim()
        }
      ];
    }
  }

  return nextState;
}

function sanitizeStateForAccount(state, account) {
  if (!account) {
    return state;
  }

  if (account.role === "admin") {
    return state;
  }

  return buildMemberScopedState(state, account);
}

function canAccessMemberResource(account, memberId) {
  return account.role === "admin" || account.memberId === memberId;
}

function canAccessAssociateFile(account) {
  return account.role === "admin";
}

function canAccessEmailRecord(account, email) {
  return (
    account.role === "admin" ||
    email.memberId === account.memberId ||
    (email.associateId && email.associateId === account.associateId)
  );
}

function getPreviewCertificateRecord(state, courseId, memberId) {
  const course = (state.courses || []).find((item) => item.id === courseId);
  const member = (state.members || []).find((item) => item.id === memberId);
  if (!course || !member) {
    return null;
  }

  const isLinkedToCourse =
    (course.enrolledIds || []).includes(memberId) ||
    (course.waitingIds || []).includes(memberId) ||
    Boolean(course.attendance && Object.prototype.hasOwnProperty.call(course.attendance, memberId)) ||
    Boolean(course.evaluations && Object.prototype.hasOwnProperty.call(course.evaluations, memberId)) ||
    Boolean(course.contentProgress && course.contentProgress[memberId]);

  if (!isLinkedToCourse) {
    return null;
  }

  return {
    course,
    member,
    code: buildDiplomaCode(course, member),
    registryNumber: buildRegistryNumber(course, member),
    preview: !(course.diplomaReady || []).includes(memberId)
  };
}

function canAccessDiplomaRecord(state, account, courseId, memberId) {
  if (account.role === "admin") {
    return Boolean(
      getDiplomaRecord(state, courseId, memberId) || getPreviewCertificateRecord(state, courseId, memberId)
    );
  }
  return account.memberId === memberId && Boolean(getDiplomaRecord(state, courseId, memberId));
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (requestUrl.pathname === "/healthz" && req.method === "GET") {
    const storageMeta = getStorageMeta();
    return sendJson(res, 200, {
      ok: true,
      service: "isocrona-zero-campus",
      release: appRelease,
      now: new Date().toISOString(),
      baseUrl: campusBaseUrl,
      port: Number(port),
      storage: storageMeta
    });
  }

  if (requestUrl.pathname === "/api/debug/storage" && req.method === "GET") {
    const debugInfo = getStorageDebugInfo();
    return sendJson(res, 200, {
      ok: true,
      service: "isocrona-zero-campus",
      release: appRelease,
      ...debugInfo
    });
  }

  if (requestUrl.pathname === "/api/state" && req.method === "GET") {
    const state = readState();
    if (synchronizeAssociateStatuses(state)) {
      writeState(state);
    }
    const account = requireAuthenticatedAccount(req, res, state);
    if (!account) {
      return;
    }
    const stateMode = String(requestUrl.searchParams.get("mode") || "").toLowerCase();
    if (account.role === "admin" && stateMode === "self" && account.memberId) {
      return sendJson(res, 200, prepareStateForTransport(buildMemberScopedState(state, account, account.memberId), account));
    }
    if (account.role === "admin" && stateMode === "preview") {
      const previewMemberId = String(requestUrl.searchParams.get("memberId") || "").trim();
      if (previewMemberId) {
        return sendJson(
          res,
          200,
          prepareStateForTransport(buildMemberScopedState(state, account, previewMemberId), account)
        );
      }
    }
    if (account.role === "admin" && !stateMode) {
      await materializeAutomationInboxSafely(state);
      writeState(state);
    }
    return sendJson(res, 200, prepareStateForTransport(state, account));
  }

  if (requestUrl.pathname === "/api/session" && req.method === "GET") {
    const state = readState();
    const account = getAuthenticatedAccount(req, state);
    if (!account) {
      return sendJson(res, 200, { ok: false, session: null });
    }
    const token = getSessionTokenFromRequest(req);
    let platformRole = account.role === "admin" ? "admin" : "socio";
    let userId = "";
    let jwtToken = "";
    if (isDatabaseEnabled()) {
      try {
        const dbUser = await findUserByEmail(account.email);
        if (dbUser) {
          platformRole = normalizePlatformRole(dbUser.role);
          userId = dbUser.id;
          jwtToken = signAuthToken(dbUser);
        }
      } catch (error) {
      }
    }
    return sendJson(res, 200, {
      ok: true,
      session: buildPlatformSessionPayload(account, token, {
        userId,
        jwt: jwtToken,
        platformRole
      })
    });
  }

  if (requestUrl.pathname === "/api/auth/register" && req.method === "POST") {
    try {
      const payload = await readJsonBody(req);
      const role = normalizePlatformRole(payload.role || "socio");
      const user = isDatabaseEnabled()
        ? await createUser({
            name: payload.name,
            email: payload.email,
            password: payload.password,
            role,
            phone: payload.phone,
            service: payload.service
          })
        : null;

      if (!user) {
        return sendJson(res, 503, { ok: false, error: "DATABASE_URL no configurada para registro persistente" });
      }

      const state = readState();
      const ensured = ensureLegacyAccountForDbUser(state, user, { password: payload.password });
      writeState(state);

      return sendJson(res, 201, {
        ok: true,
        user,
        accountId: ensured?.account?.id || ""
      });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message || "No se pudo registrar el usuario" });
    }
  }

  if (requestUrl.pathname === "/api/auth/login" && req.method === "POST") {
    try {
      const payload = await readJsonBody(req);
      const email = String(payload.email || "").trim().toLowerCase();
      const password = String(payload.password || "").trim();
      if (!isDatabaseEnabled()) {
        return sendJson(res, 503, { ok: false, error: "DATABASE_URL no configurada" });
      }
      const dbUser = await authenticateUser(email, password);
      if (!dbUser) {
        return sendJson(res, 401, { ok: false, error: "Credenciales invalidas" });
      }

      const state = readState();
      const ensured = ensureLegacyAccountForDbUser(state, dbUser, { password });
      writeState(state);
      const token = createSessionToken(ensured.account);
      const jwtToken = signAuthToken(dbUser);
      setSessionCookie(res, token);

      return sendJson(res, 200, {
        ok: true,
        user: dbUser,
        session: buildPlatformSessionPayload(ensured.account, token, {
          userId: dbUser.id,
          jwt: jwtToken,
          platformRole: dbUser.role
        })
      });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message || "Login invalido" });
    }
  }

  if (requestUrl.pathname === "/api/auth/me" && req.method === "GET") {
    try {
      if (isDatabaseEnabled()) {
        const dbUser = await getAuthenticatedDbUser(req);
        if (dbUser) {
          return sendJson(res, 200, { ok: true, user: dbUser });
        }
      }

      const state = readState();
      const account = getAuthenticatedAccount(req, state);
      if (!account) {
        return sendJson(res, 401, { ok: false, error: "Inicia sesion para continuar" });
      }
      return sendJson(res, 200, { ok: true, user: buildLegacyCurrentUser(account, state) });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message || "No se pudo cargar el usuario actual" });
    }
  }

  if (requestUrl.pathname === "/api/admin/users" && req.method === "GET") {
    try {
      if (isDatabaseEnabled()) {
        const user = await requireAdminDbUser(req, res);
        if (!user) {
          return;
        }
        return sendJson(res, 200, { ok: true, users: await listUsers() });
      }

      const state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      return sendJson(res, 200, { ok: true, users: listLegacyUsersFromState(state) });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message || "No se pudo listar usuarios" });
    }
  }

  if (requestUrl.pathname === "/api/admin/users" && req.method === "POST") {
    try {
      const payload = await readJsonBody(req);

      if (isDatabaseEnabled()) {
        const adminUser = await requireAdminDbUser(req, res);
        if (!adminUser) {
          return;
        }
        const user = await createUser({
          name: payload.name,
          email: payload.email,
          password: payload.password,
          role: payload.role,
          phone: payload.phone,
          service: payload.service,
          memberId: payload.memberId,
          associateId: payload.associateId
        });
        const state = readState();
        ensureLegacyAccountForDbUser(state, user, { password: payload.password });
        writeState(state);
        return sendJson(res, 201, { ok: true, user });
      }

      const state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      state.accounts = Array.isArray(state.accounts) ? state.accounts : [];
      state.members = Array.isArray(state.members) ? state.members : [];
      const memberId = payload.memberId || generateLegacyId("member-manual");
      const existingMember = state.members.find((item) => item.id === memberId);
      if (!existingMember) {
        state.members.unshift({
          id: memberId,
          name: String(payload.name || "").trim(),
          role: mapPlatformRoleToLegacyMemberRole(payload.role),
          email: String(payload.email || "").trim(),
          certifications: [],
          renewalsDue: 0,
          associateId: String(payload.associateId || ""),
          source: "manual-admin",
          phone: String(payload.phone || "")
        });
      }
      const legacyAccount = {
        id: generateLegacyId("account-manual"),
        name: String(payload.name || "").trim(),
        email: String(payload.email || "").trim().toLowerCase(),
        password: "",
        passwordHash: "",
        role: mapPlatformRoleToLegacyAccountRole(payload.role),
        memberId,
        associateId: String(payload.associateId || ""),
        mustChangePassword: false,
        source: "manual-admin"
      };
      setLegacyAccountPassword(legacyAccount, payload.password);
      state.accounts.unshift(legacyAccount);
      writeState(state);
      return sendJson(res, 201, { ok: true, user: buildLegacyCurrentUser(legacyAccount, state) });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message || "No se pudo crear el usuario" });
    }
  }

  if (/^\/api\/admin\/users\/[^/]+$/.test(requestUrl.pathname) && req.method === "PUT") {
    try {
      const payload = await readJsonBody(req);
      const userId = decodeURIComponent(requestUrl.pathname.split("/").pop() || "");

      if (isDatabaseEnabled()) {
        const adminUser = await requireAdminDbUser(req, res);
        if (!adminUser) {
          return;
        }
        const user = await updateUser(userId, payload);
        const state = readState();
        ensureLegacyAccountForDbUser(state, user, {
          password: typeof payload.password === "string" ? payload.password : ""
        });
        writeState(state);
        return sendJson(res, 200, { ok: true, user });
      }

      const state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const legacyAccount = (state.accounts || []).find((item) => item.id === userId);
      if (!legacyAccount) {
        return sendJson(res, 404, { ok: false, error: "Usuario no encontrado" });
      }
      legacyAccount.name = String(payload.name || legacyAccount.name || "").trim();
      legacyAccount.email = String(payload.email || legacyAccount.email || "").trim().toLowerCase();
      legacyAccount.role = mapPlatformRoleToLegacyAccountRole(payload.role || legacyAccount.role);
      if (typeof payload.password === "string" && payload.password.trim()) {
        setLegacyAccountPassword(legacyAccount, payload.password);
      }
      const member = (state.members || []).find((item) => item.id === legacyAccount.memberId);
      if (member) {
        member.name = legacyAccount.name;
        member.email = legacyAccount.email;
        member.role = mapPlatformRoleToLegacyMemberRole(payload.role || legacyAccount.role);
        member.phone = String(payload.phone || member.phone || "");
      }
      writeState(state);
      return sendJson(res, 200, { ok: true, user: buildLegacyCurrentUser(legacyAccount, state) });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message || "No se pudo actualizar el usuario" });
    }
  }

  if (requestUrl.pathname === "/api/test-results/me" && req.method === "GET") {
    try {
      if (isDatabaseEnabled()) {
        const user = await requireAuthenticatedDbUser(req, res);
        if (!user) {
          return;
        }
        return sendJson(res, 200, { ok: true, results: await listTestResultsForUser(user.id) });
      }

      const state = readState();
      const account = requireAuthenticatedAccount(req, res, state);
      if (!account) {
        return;
      }
      const results = (state.testResults || []).filter((item) => item.userId === account.id || item.memberId === account.memberId);
      return sendJson(res, 200, { ok: true, results });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message || "No se pudieron cargar los resultados" });
    }
  }

  if (requestUrl.pathname === "/api/test-results" && req.method === "POST") {
    try {
      const payload = await readJsonBody(req);
      if (isDatabaseEnabled()) {
        const user = await requireAuthenticatedDbUser(req, res);
        if (!user) {
          return;
        }
        const result = await saveTestResult({
          userId: user.id,
          score: payload.score,
          total: payload.total,
          percentage: payload.percentage,
          answers: payload.answers
        });
        return sendJson(res, 201, { ok: true, result });
      }

      const state = readState();
      const account = requireAuthenticatedAccount(req, res, state);
      if (!account) {
        return;
      }
      state.testResults = Array.isArray(state.testResults) ? state.testResults : [];
      const result = {
        id: generateLegacyId("test-result"),
        userId: account.id,
        memberId: account.memberId || "",
        score: Number(payload.score || 0),
        total: Number(payload.total || 0),
        percentage: Number(payload.percentage || 0),
        answers: Array.isArray(payload.answers) ? payload.answers : [],
        createdAt: new Date().toISOString()
      };
      state.testResults.unshift(result);
      writeState(state);
      return sendJson(res, 201, { ok: true, result });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message || "No se pudo guardar el resultado" });
    }
  }

  if (requestUrl.pathname === "/api/state" && req.method === "POST") {
    const currentState = readState();
    const account = requireAuthenticatedAccount(req, res, currentState);
    if (!account) {
      return;
    }
    try {
      const payload = await readJsonBody(req);
      const state =
        account.role === "admin"
          ? {
              ...payload,
              campusGroups: mergeCampusGroupAttachmentsFromCurrentState(
                currentState.campusGroups || [],
                payload.campusGroups || []
              )
            }
          : mergeMemberScopedStateIntoFullState(currentState, payload, account);
      restoreTransportSanitizedSecrets(currentState, state);
      let summary = null;

      if (state.settings?.automation?.autoRunOnSave !== false) {
        summary = await runAutomationEngine(state);
        recordAutomationRun(state, "Guardado de cambios", summary);
      }

      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        updatedAt: new Date().toISOString(),
        state: prepareStateForTransport(state, account),
        automation: summary,
        message: summary ? buildAutomationMessage("Cambios guardados", summary) : "Cambios guardados"
      });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message || "Invalid campus payload" });
    }
  }

  if (requestUrl.pathname === "/api/reset" && req.method === "POST") {
    const currentState = readState();
    const account = requireAdminAccount(req, res, currentState);
    if (!account) {
      return;
    }
    const state = resetState();
    const summary = await runAutomationEngine(state);
    recordAutomationRun(state, "Restablecer datos demo", summary);
    appendActivity(state, "system", "Sistema", "Se han restablecido los datos demo desde el servidor");
    writeState(state);
    return sendJson(res, 200, prepareStateForTransport(state, account));
  }

  if (requestUrl.pathname === "/api/recovery-admin" && req.method === "POST") {
    try {
      const recoveryConfig = getRecoveryAdminEnvConfig();
      if (!recoveryConfig.enabled) {
        return sendJson(res, 403, {
          ok: false,
          error: "La recuperacion de administrador no esta habilitada en este entorno."
        });
      }
      const payload = await readJsonBody(req);
      const submittedPassword = String(payload.password || "").trim();
      const acceptedPassword = submittedPassword === recoveryConfig.password ? submittedPassword : "";

      if (!acceptedPassword) {
        return sendJson(res, 401, {
          ok: false,
          error: "La clave de recuperacion no coincide con la configurada en el entorno."
        });
      }

      if (acceptedPassword.length < 8) {
        return sendJson(res, 400, {
          ok: false,
          error: "La clave de rescate debe tener al menos 8 caracteres."
        });
      }

      const account = applyRecoveryAdminAccessFromEnv({
        email: recoveryConfig.email,
        password: acceptedPassword
      });

      if (!account) {
        return sendJson(res, 500, {
          ok: false,
          error: "No se pudo crear la cuenta de recuperacion."
        });
      }

        const token = createSessionToken(account);
        setSessionCookie(res, token);
        return sendJson(res, 200, {
          ok: true,
          session: buildSessionPayload(account, token),
          message: "Acceso administrador recuperado"
        });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: "Recuperacion invalida" });
    }
  }

  if (requestUrl.pathname === "/api/login" && req.method === "POST") {
    try {
      const payload = await readJsonBody(req);
      const recoveryConfig = getRecoveryAdminEnvConfig();
      const recoveryEmail = recoveryConfig.email;
      const recoveryPassword = recoveryConfig.password;
      if (recoveryConfig.enabled && recoveryPassword.length >= 8) {
        applyRecoveryAdminAccessFromEnv();
      }
      let state = readState();
      let stateChanged = false;
      if (synchronizeAssociateStatuses(state)) {
        stateChanged = true;
      }
      const email = String(payload.email || "").trim().toLowerCase();
      const password = String(payload.password || "").trim();
      let account = (state.accounts || []).find(
        (item) =>
          String(item.email || "").trim().toLowerCase() === email &&
          verifyLegacyAccountPassword(item, password)
      );
      if (account && needsPasswordHashUpgrade(account)) {
        setLegacyAccountPassword(account, password);
        stateChanged = true;
      }

      if (
        !account &&
        email &&
        email === recoveryEmail &&
        password === recoveryPassword &&
        recoveryConfig.enabled &&
        password.length >= 8
      ) {
        applyRecoveryAdminAccessFromEnv();
        state = readState();
        account = (state.accounts || []).find(
          (item) =>
            String(item.email || "").trim().toLowerCase() === email &&
            verifyLegacyAccountPassword(item, password)
        );
        if (!account) {
          state.accounts = Array.isArray(state.accounts) ? state.accounts : [];
          state.members = Array.isArray(state.members) ? state.members : [];
          state.associates = Array.isArray(state.associates) ? state.associates : [];
          const associate = state.associates.find(
            (item) => String(item.email || "").trim().toLowerCase() === email
          );
          let member = state.members.find(
            (item) =>
              String(item.email || "").trim().toLowerCase() === email ||
              (associate && item.associateId === associate.id)
          );
          if (!member) {
            member = {
              id: `member-recovery-login-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: associate ? getAssociateFullName(associate) : "Administrador recuperado",
              role: "Administracion",
              email,
              certifications: [],
              renewalsDue: 0,
              associateId: associate?.id || "",
              source: "recovery-login"
            };
            state.members.unshift(member);
          } else {
            member.email = email;
            member.name = associate ? getAssociateFullName(associate) : member.name || "Administrador recuperado";
            member.role = "Administracion";
            member.associateId = associate?.id || member.associateId || "";
          }

          account = {
            id: `account-recovery-login-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: member.name,
            email,
            password: "",
            passwordHash: "",
            role: "admin",
            memberId: member.id,
            associateId: associate?.id || "",
            mustChangePassword: false,
            source: "recovery-login"
          };
          setLegacyAccountPassword(account, password);
          state.accounts.push(account);
          if (associate) {
            associate.linkedMemberId = member.id;
            associate.linkedAccountId = account.id;
            associate.campusAccessStatus = "active";
            associate.temporaryPassword = "";
          }
          appendActivity(
            state,
            "system",
            "Recuperacion",
            `Acceso administrador recuperado durante login para ${email}`
          );
          writeState(state);
        }
      }

      if (!account) {
        if (email === recoveryEmail && recoveryEmail) {
          return sendJson(res, 401, {
            ok: false,
            error: recoveryPassword
              ? "La contrasena no coincide con IZ_RECOVERY_ADMIN_PASSWORD en Railway. Cambiala alli, redeploya y usa exactamente esa."
              : "Falta IZ_RECOVERY_ADMIN_PASSWORD en Railway. Anade una temporal, redeploya y vuelve a entrar."
          });
        }
        return sendJson(res, 401, { ok: false, error: "Credenciales invalidas" });
      }

      const associate = account.associateId
        ? (state.associates || []).find((item) => item.id === account.associateId)
        : null;
      if (associate && ["Baja"].includes(associate.status)) {
        return sendJson(res, 403, {
          ok: false,
          error: "Tu acceso al campus esta bloqueado temporalmente. Contacta con administracion."
        });
      }

      if (stateChanged) {
        writeState(state);
      }

        const token = createSessionToken(account);
        setSessionCookie(res, token);

        return sendJson(res, 200, {
          ok: true,
          session: buildSessionPayload(account, token)
        });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: "Login invalido" });
    }
  }

  if (requestUrl.pathname === "/api/logout" && req.method === "POST") {
    clearRequestSession(req);
    clearSessionCookie(res);
    return sendJson(res, 200, { ok: true, message: "Sesion cerrada" });
  }

  if (requestUrl.pathname === "/api/account/change-password" && req.method === "POST") {
    let state = null;
    try {
      const payload = await readJsonBody(req);
      state = readState();
      const authenticatedAccount = requireAuthenticatedAccount(req, res, state);
      if (!authenticatedAccount) {
        return;
      }
      const accountId = String(payload.accountId || "").trim();
      const currentPassword = String(payload.currentPassword || "");
      const newPassword = String(payload.newPassword || "");
      const confirmPassword = String(payload.confirmPassword || "");

      const account = (state.accounts || []).find((item) => item.id === accountId);
      if (!account) {
        throw new Error("Cuenta no encontrada");
      }
      if (account.id !== authenticatedAccount.id) {
        throw new Error("No puedes modificar otra cuenta");
      }
      if (!verifyLegacyAccountPassword(account, currentPassword)) {
        throw new Error("La contrasena actual no coincide");
      }
      if (newPassword.length < 8) {
        throw new Error("La nueva contrasena debe tener al menos 8 caracteres");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("La confirmacion de contrasena no coincide");
      }
      if (newPassword === currentPassword) {
        throw new Error("La nueva contrasena debe ser distinta de la temporal");
      }

      setLegacyAccountPassword(account, newPassword);
      account.mustChangePassword = false;

      const associate = account.associateId
        ? (state.associates || []).find((item) => item.id === account.associateId)
        : null;
      if (associate) {
        associate.temporaryPassword = "";
      }

      appendActivity(
        state,
        "system",
        "Accesos",
        `La cuenta ${account.email} ha actualizado su contrasena de primer acceso`
      );
      writeState(state);

      return sendJson(res, 200, {
        ok: true,
        message: "Contrasena actualizada correctamente",
          session: buildSessionPayload(account, getSessionTokenFromRequest(req))
        });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo actualizar la contrasena"
      });
    }
  }

  if (requestUrl.pathname === "/api/public-campus/courses" && req.method === "GET") {
    const state = readState();
    return sendJson(res, 200, {
      ok: true,
      courses: getPublicCampusCourses(state)
    });
  }

  if (requestUrl.pathname === "/api/public-campus/register" && req.method === "POST") {
    let state = null;
    try {
      const payload = await readJsonBody(req);
      state = readState();
      const { account, member } = registerPublicCampusAccount(state, payload);
      writeState(state);
        const token = createSessionToken(account);
        setSessionCookie(res, token);
        return sendJson(res, 200, {
          ok: true,
          message: "Acceso solo campus creado correctamente",
          session: buildSessionPayload(account, token),
          member: {
            id: member.id,
            name: member.name,
          email: member.email
        }
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo crear el acceso solo campus"
      });
    }
  }

  if (requestUrl.pathname === "/api/campus-groups/attachment" && req.method === "GET") {
    const state = readState();
    const account = requireAuthenticatedAccount(req, res, state);
    if (!account) {
      return;
    }
    if (account.role !== "admin" && !account.associateId) {
      return sendJson(res, 403, { ok: false, error: "No tienes acceso a los grupos internos" });
    }

    const groupId = String(requestUrl.searchParams.get("groupId") || "").trim();
    const moduleId = String(requestUrl.searchParams.get("moduleId") || "").trim();
    const category = String(requestUrl.searchParams.get("category") || "").trim();
    const entryId = String(requestUrl.searchParams.get("entryId") || "").trim();
    const download = String(requestUrl.searchParams.get("download") || "").trim() === "1";

    const entry = findCampusGroupEntry(state.campusGroups || [], groupId, moduleId, category, entryId);
    const attachment = entry?.attachment;
    if (!attachment?.contentBase64) {
      return sendJson(res, 404, { ok: false, error: "No se ha encontrado el adjunto" });
    }

    const buffer = Buffer.from(attachment.contentBase64, "base64");
    const attachmentMimeType = inferAttachmentMimeType(attachment.name, attachment.type);
    res.writeHead(200, {
      "Content-Type": attachmentMimeType,
      "Content-Length": buffer.length,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${sanitizeFilename(
        attachment.name || "recurso"
      )}"`
    });
    res.end(buffer);
    return;
  }

  if (requestUrl.pathname === "/api/associates/public-config" && req.method === "GET") {
    const state = readState();
    return sendJson(res, 200, {
      ok: true,
      organization: state.settings?.organization || "Isocrona Zero",
      notice: state.settings?.associates?.applicationFormNotice || "",
      uploadHint: "Adjunta justificantes en PDF o imagen. En este prototipo se guardan dentro del campus local.",
      trackingPath: "/application.html"
    });
  }

  const publicAssociateApplicationMatch = requestUrl.pathname.match(
    /^\/api\/associates\/applications\/public\/([^/]+)$/
  );
  if (publicAssociateApplicationMatch && req.method === "GET") {
    const state = readState();
    const application = findAssociateApplicationByToken(state, publicAssociateApplicationMatch[1]);
    if (!application) {
      return sendJson(res, 404, { ok: false, error: "Solicitud no encontrada" });
    }

    return sendJson(res, 200, {
      ok: true,
      application: buildPublicAssociateApplicationPayload(application)
    });
  }

  const publicAssociateApplicationReplyMatch = requestUrl.pathname.match(
    /^\/api\/associates\/applications\/public\/([^/]+)\/reply$/
  );
  if (publicAssociateApplicationReplyMatch && req.method === "POST") {
    let state = null;
    try {
      const payload = await readJsonBody(req);
      state = readState();
      const application = submitAssociateApplicationReply(
        state,
        publicAssociateApplicationReplyMatch[1],
        payload
      );
      await maybeSendAssociateApplicationReplyReceiptEmail(state, application, {
        actor: "Portal publico"
      });
      await maybeSendAssociateApplicationReplyNotification(state, application, {
        actor: "Portal publico"
      });
      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, "Respuesta publica a solicitud", summary);
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message: "Documentacion recibida. La solicitud vuelve a revision administrativa.",
        application: buildPublicAssociateApplicationPayload(application),
        summary
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo registrar la documentacion"
      });
    }
  }

  if (requestUrl.pathname === "/api/associates/apply" && req.method === "POST") {
    let state = null;
    try {
      const payload = await readJsonBody(req);
      state = readState();
      const application = createAssociateApplication(state, payload);
      await maybeSendAssociateApplicationReceiptEmail(state, application);
      appendActivity(
        state,
        "system",
        "Socios",
        `Nueva solicitud de socio registrada para ${application.firstName} ${application.lastName}`.trim()
      );
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message: "Solicitud registrada correctamente",
        applicationId: application.id,
        publicAccessToken: application.publicAccessToken,
        trackingUrl: buildAssociateApplicationPublicLink(application)
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo registrar la solicitud"
      });
    }
  }

  if (requestUrl.pathname === "/api/associate-payments/submit" && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAuthenticatedAccount(req, res, state);
      if (!account) {
        return;
      }
      const associate = resolveAssociateForAuthenticatedAccount(state, account);
      if (!associate) {
        return sendJson(res, 400, { ok: false, error: "Tu cuenta no tiene una ficha de socio vinculada" });
      }

      const payload = await readJsonBody(req);
      const submission = createAssociatePaymentSubmission(state, account, payload, associate);
      appendActivity(
        state,
        "member",
        account.name,
        `Ha enviado un justificante de cuota para revision (${submission.year} | ${submission.amount} EUR)`
      );
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message: "Justificante enviado correctamente para revision administrativa",
        submissionId: submission.id
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo enviar el justificante de cuota"
      });
    }
  }

  if (requestUrl.pathname === "/api/associate-profile-requests" && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAuthenticatedAccount(req, res, state);
      if (!account) {
        return;
      }
      const associate = resolveAssociateForAuthenticatedAccount(state, account);
      if (!associate) {
        return sendJson(res, 400, { ok: false, error: "Tu cuenta no tiene una ficha de socio vinculada" });
      }

      const payload = await readJsonBody(req);
      const request = createAssociateProfileRequest(state, account, payload, associate);
      appendActivity(
        state,
        "member",
        account.name,
        `Ha solicitado actualizar su ficha de socio (${request.email} | ${request.phone})`
      );
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        mode: "review",
        message: "Solicitud de actualizacion enviada correctamente",
        requestId: request.id
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo registrar la solicitud de actualizacion"
      });
    }
  }

  const approveAssociatePaymentMatch = requestUrl.pathname.match(/^\/api\/associate-payments\/([^/]+)\/approve$/);
  if (approveAssociatePaymentMatch && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const result = approveAssociatePaymentSubmission(state, approveAssociatePaymentMatch[1], account.name);
      await maybeSendAssociatePaymentSubmissionNotification(state, result.submission, result.associate, true, account.name);
      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, "Aprobacion justificante cuota", summary);
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message: `Justificante aprobado y pago registrado para ${result.associateName}`,
        result,
        summary
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo aprobar el justificante"
      });
    }
  }

  const notifyAssociatePaymentMatch = requestUrl.pathname.match(/^\/api\/associate-payments\/([^/]+)\/notify$/);
  if (notifyAssociatePaymentMatch && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const submission = (state.associatePaymentSubmissions || []).find(
        (item) => item.id === notifyAssociatePaymentMatch[1]
      );
      if (!submission) {
        throw new Error("Justificante de cuota no encontrado");
      }
      if (!["Aprobado", "Rechazado"].includes(submission.status)) {
        throw new Error("El justificante debe estar revisado antes de avisar al socio");
      }
      const associate = (state.associates || []).find((item) => item.id === submission.associateId);
      if (!associate) {
        throw new Error("Socio no encontrado para este justificante");
      }
      const approved = submission.status === "Aprobado";
      const result = await maybeSendAssociatePaymentSubmissionNotification(
        state,
        submission,
        associate,
        approved,
        account.name,
        { force: true }
      );
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message:
          result.status === "sent"
            ? `Aviso de justificante reenviado a ${getAssociateFullName(associate)}`
            : `El aviso del justificante queda pendiente hasta configurar el SMTP`,
        result
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo reenviar el aviso del justificante"
      });
    }
  }

  const rejectAssociatePaymentMatch = requestUrl.pathname.match(/^\/api\/associate-payments\/([^/]+)\/reject$/);
  if (rejectAssociatePaymentMatch && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const result = rejectAssociatePaymentSubmission(state, rejectAssociatePaymentMatch[1], account.name);
      await maybeSendAssociatePaymentSubmissionNotification(state, result.submission, result.associate, false, account.name);
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message: `Justificante rechazado para ${result.associateName}`,
        result
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo rechazar el justificante"
      });
    }
  }

  const approveAssociateProfileRequestMatch = requestUrl.pathname.match(
    /^\/api\/associate-profile-requests\/([^/]+)\/approve$/
  );
  if (approveAssociateProfileRequestMatch && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const payload = await readJsonBody(req).catch(() => ({}));
      const result = approveAssociateProfileRequest(
        state,
        approveAssociateProfileRequestMatch[1],
        account.name,
        payload?.comentario_admin || payload?.reviewNote || ""
      );
      await maybeSendAssociateProfileRequestNotification(
        state,
        result.request,
        result.associate,
        true,
        account.name
      );
      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, "Aprobacion actualizacion socio", summary);
      writeState(state);
      const statusMessage = result.statusTransition?.changed
        ? ` y el estado pasa a ${result.statusTransition.nextStatus}`
        : "";
      return sendJson(res, 200, {
        ok: true,
        message: `Datos del socio actualizados para ${result.associateName}${statusMessage}`,
        result,
        summary
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo aprobar la actualizacion de ficha"
      });
    }
  }

  const rejectAssociateProfileRequestMatch = requestUrl.pathname.match(
    /^\/api\/associate-profile-requests\/([^/]+)\/reject$/
  );
  if (rejectAssociateProfileRequestMatch && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const payload = await readJsonBody(req).catch(() => ({}));
      const result = rejectAssociateProfileRequest(
        state,
        rejectAssociateProfileRequestMatch[1],
        account.name,
        payload?.comentario_admin || payload?.reviewNote || ""
      );
      await maybeSendAssociateProfileRequestNotification(
        state,
        result.request,
        result.associate,
        false,
        account.name
      );
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message: `Solicitud de actualizacion rechazada para ${result.associateName}`,
        result
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo rechazar la actualizacion de ficha"
      });
    }
  }

  const notifyAssociateProfileRequestMatch = requestUrl.pathname.match(
    /^\/api\/associate-profile-requests\/([^/]+)\/notify$/
  );
  if (notifyAssociateProfileRequestMatch && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const request = (state.associateProfileRequests || []).find(
        (item) => item.id === notifyAssociateProfileRequestMatch[1]
      );
      if (!request) {
        throw new Error("Solicitud de actualizacion no encontrada");
      }
      if (!["Aprobado", "Rechazado"].includes(request.status)) {
        throw new Error("La solicitud debe estar revisada antes de avisar al socio");
      }
      const associate = (state.associates || []).find((item) => item.id === request.associateId);
      if (!associate) {
        throw new Error("Socio no encontrado para esta solicitud");
      }
      const approved = request.status === "Aprobado";
      const result = await maybeSendAssociateProfileRequestNotification(
        state,
        request,
        associate,
        approved,
        account.name,
        { force: true }
      );
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message:
          result.status === "sent"
            ? `Aviso de actualizacion reenviado a ${getAssociateFullName(associate)}`
            : `El aviso de actualizacion queda pendiente hasta configurar el SMTP`,
        result
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo reenviar el aviso de actualizacion"
      });
    }
  }

  const approveAssociateMatch = requestUrl.pathname.match(/^\/api\/associates\/applications\/([^/]+)\/approve$/);
  if (approveAssociateMatch && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const associate = approveAssociateApplication(state, approveAssociateMatch[1]);
      const application = (state.associateApplications || []).find((item) => item.id === associate.applicationId);
      if (application) {
        await maybeSendAssociateApplicationDecisionEmail(state, application, true, account.name);
      }
      await maybeSendAssociateWelcomeEmail(state, associate);
      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, "Aprobacion de socio", summary);
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message: `Solicitud aprobada y convertida en socio #${associate.associateNumber}`,
        associate,
        summary
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo aprobar la solicitud"
      });
    }
  }

  const sendAssociateWelcomeMatch = requestUrl.pathname.match(/^\/api\/associates\/([^/]+)\/send-welcome$/);
  if (sendAssociateWelcomeMatch && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const associate = (state.associates || []).find((item) => item.id === sendAssociateWelcomeMatch[1]);
      if (!associate) {
        throw new Error("Socio no encontrado");
      }
      const result = await maybeSendAssociateWelcomeEmail(state, associate, {
        force: true,
        strict: false,
        actor: account.name
      });
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message:
          result.status === "sent"
            ? `Bienvenida enviada a ${getAssociateFullName(associate)}`
            : `La bienvenida queda pendiente hasta configurar el SMTP o completar el acceso`,
        result
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo enviar la bienvenida"
      });
    }
  }

  const createAssociateCampusAccessMatch = requestUrl.pathname.match(
    /^\/api\/associates\/([^/]+)\/create-access$/
  );
  if (createAssociateCampusAccessMatch && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const payload = await readJsonBody(req).catch(() => ({}));
      const requestedAccountRole = payload.role ? normalizeCampusAccountRole(payload.role) : "";
      const associate = (state.associates || []).find(
        (item) => item.id === createAssociateCampusAccessMatch[1]
      );
      if (!associate) {
        throw new Error("Socio no encontrado");
      }
      if (!associate.email) {
        throw new Error("El socio necesita un email antes de crear acceso al campus");
      }

      provisionAssociateCampusAccess(state, associate, {
        force: true,
        accountRole: requestedAccountRole
      });
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message:
          requestedAccountRole === "admin"
            ? `Acceso administrador preparado para ${getAssociateFullName(associate)}`
            : `Acceso al campus preparado para ${getAssociateFullName(associate)}`,
        associate
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo crear el acceso al campus"
      });
    }
  }

  const resetAssociateCampusPasswordMatch = requestUrl.pathname.match(
    /^\/api\/associates\/([^/]+)\/reset-password$/
  );
  if (resetAssociateCampusPasswordMatch && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const associate = (state.associates || []).find(
        (item) => item.id === resetAssociateCampusPasswordMatch[1]
      );
      if (!associate) {
        throw new Error("Socio no encontrado");
      }

      resetAssociateCampusPassword(state, associate);
      appendActivity(
        state,
        "admin",
        account.name,
        `Ha restablecido la contrasena temporal del socio #${associate.associateNumber} (${associate.email})`
      );
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message: `Contrasena temporal restablecida para ${getAssociateFullName(associate)}`,
        associate
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo restablecer la contrasena temporal"
      });
    }
  }

  const markAssociateReviewedMatch = requestUrl.pathname.match(
    /^\/api\/associates\/([^/]+)\/mark-reviewed$/
  );
  if (markAssociateReviewedMatch && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const associate = (state.associates || []).find(
        (item) => item.id === markAssociateReviewedMatch[1]
      );
      if (!associate) {
        throw new Error("Socio no encontrado");
      }
      if (/baja/i.test(String(associate.status || ""))) {
        throw new Error("No se puede marcar como revisado un socio en baja");
      }
      if (!associate.firstName || !associate.lastName || !associate.email || !associate.service) {
        throw new Error("Faltan nombre, apellidos, email o servicio para cerrar la revision");
      }

      associate.status =
        getAssociateYearFeeGap(associate, String(new Date().getFullYear())) > 0
          ? "Pendiente cuota"
          : "Activa";
      appendActivity(
        state,
        "admin",
        account.name,
        "Socios",
        `Revision legacy cerrada para el socio #${associate.associateNumber} (${getAssociateFullName(associate)})`
      );
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message: `Socio #${associate.associateNumber} marcado como revisado`,
        associate
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo cerrar la revision del socio"
      });
    }
  }

  const notifyAssociateApplicationMatch = requestUrl.pathname.match(
    /^\/api\/associates\/applications\/([^/]+)\/notify$/
  );
  if (notifyAssociateApplicationMatch && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const application = (state.associateApplications || []).find(
        (item) => item.id === notifyAssociateApplicationMatch[1]
      );
      if (!application) {
        throw new Error("Solicitud no encontrada");
      }

      let result = null;
      if (application.status === "Pendiente de revision") {
        result = await maybeSendAssociateApplicationReceiptEmail(state, application, {
          force: true,
          actor: account.name
        });
      } else if (application.status === "Pendiente de documentacion") {
        result = await maybeSendAssociateApplicationInfoRequestEmail(state, application, {
          force: true,
          actor: account.name
        });
      } else if (["Aprobada", "Rechazada"].includes(application.status)) {
        result = await maybeSendAssociateApplicationDecisionEmail(
          state,
          application,
          application.status === "Aprobada",
          account.name,
          { force: true }
        );
      } else {
        throw new Error("La solicitud no esta en un estado notificable");
      }

      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message:
          result.status === "sent"
            ? `Correo de solicitud procesado para ${application.email}`
            : `El correo de solicitud queda pendiente hasta configurar el SMTP`,
        result
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo reenviar el correo de solicitud"
      });
    }
  }

  const notifyAssociateApplicationReplyMatch = requestUrl.pathname.match(
    /^\/api\/associates\/applications\/([^/]+)\/notify-reply$/
  );
  if (notifyAssociateApplicationReplyMatch && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const application = (state.associateApplications || []).find(
        (item) => item.id === notifyAssociateApplicationReplyMatch[1]
      );
      if (!application) {
        throw new Error("Solicitud no encontrada");
      }

      const result = await maybeSendAssociateApplicationReplyNotification(state, application, {
        force: true,
        actor: account.name
      });
      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, "Aviso interno de respuesta", summary);

      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message:
          result.status === "sent"
            ? `Aviso interno de respuesta procesado para ${application.email}`
            : `El aviso interno queda pendiente hasta configurar el SMTP`,
        result,
        summary
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo avisar a administracion"
      });
    }
  }

  const requestAssociateInfoMatch = requestUrl.pathname.match(
    /^\/api\/associates\/applications\/([^/]+)\/request-info$/
  );
  if (requestAssociateInfoMatch && req.method === "POST") {
    let state = null;
    try {
      const payload = await readJsonBody(req);
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const application = requestAssociateApplicationInfo(
        state,
        requestAssociateInfoMatch[1],
        payload.message,
        account.name
      );
      await maybeSendAssociateApplicationInfoRequestEmail(state, application, {
        actor: account.name
      });
      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, "Solicitud de subsanacion", summary);
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message: `Solicitud pasada a pendiente de documentacion para ${application.email}`,
        application,
        summary
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo solicitar documentacion adicional"
      });
    }
  }

  const reopenAssociateApplicationMatch = requestUrl.pathname.match(
    /^\/api\/associates\/applications\/([^/]+)\/reopen$/
  );
  if (reopenAssociateApplicationMatch && req.method === "POST") {
    let state = null;
    try {
      const payload = await readJsonBody(req);
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const application = reopenAssociateApplicationReview(
        state,
        reopenAssociateApplicationMatch[1],
        account.name,
        payload.note
      );
      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, "Reapertura de solicitud", summary);
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message: `Solicitud reabierta para revision: ${application.email}`,
        application,
        summary
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo reabrir la solicitud"
      });
    }
  }

  const rejectAssociateMatch = requestUrl.pathname.match(/^\/api\/associates\/applications\/([^/]+)\/reject$/);
  if (rejectAssociateMatch && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const application = rejectAssociateApplication(state, rejectAssociateMatch[1]);
      await maybeSendAssociateApplicationDecisionEmail(state, application, false, account.name);
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message: `Solicitud rechazada para ${application.firstName} ${application.lastName}`.trim(),
        application
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo rechazar la solicitud"
      });
    }
  }

  if (requestUrl.pathname === "/api/smtp/test" && req.method === "POST") {
    try {
      const state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const smtp = getSmtpSettings(state);
      if (!smtp.host || !smtp.port || !smtp.fromEmail || !smtp.testTo) {
        return sendJson(res, 400, {
          ok: false,
          error: "Configura host, puerto, remitente y destinatario de prueba"
        });
      }

      await sendMail(smtp, {
        from: smtp.fromEmail,
        fromName: smtp.fromName,
        to: smtp.testTo,
        subject: `Prueba SMTP - ${state.settings.organization || "Isocrona Zero Campus"}`,
        text: "Esta es una prueba de configuracion SMTP del campus."
      });

      appendActivity(state, "system", "Servidor", `Correo de prueba SMTP enviado a ${smtp.testTo}`);
      writeState(state);
      return sendJson(res, 200, { ok: true, message: "Correo de prueba enviado" });
    } catch (error) {
      return sendJson(res, 500, { ok: false, error: error.message || "Fallo SMTP" });
    }
  }

  if (requestUrl.pathname === "/api/automation/run" && req.method === "POST") {
    try {
      const state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, "Ejecucion manual", summary);
      appendActivity(
        state,
        "system",
        "Motor de automatizacion",
        `Se ha ejecutado el motor automatico: ${summary.updatedDiplomas} diploma(s), ${summary.promotedWaitlist} promocion(es) de espera, ${summary.sentDiplomas} envio(s) de diploma, ${summary.sentFeeReminders || 0} recordatorio(s) de cuota, ${summary.sentFeedbackReminders || 0} recordatorio(s) de valoracion y ${summary.inboxItems} item(s) en bandeja`
      );
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message: buildAutomationMessage("Automatizaciones ejecutadas", summary),
        summary
      });
    } catch (error) {
      return sendJson(res, 500, {
        ok: false,
        error: error.message || "No se pudo ejecutar la automatizacion"
      });
    }
  }

  const resolveInboxMatch = requestUrl.pathname.match(/^\/api\/automation\/inbox\/([^/]+)\/resolve$/);
  if (resolveInboxMatch && req.method === "POST") {
    const itemId = resolveInboxMatch[1];

    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const item = (state.automationInbox || []).find((entry) => entry.id === itemId);
      if (!item) {
        return sendJson(res, 404, { ok: false, error: "Aviso automatico no encontrado" });
      }

      const result = await resolveAutomationItem(state, item);
      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, `Resolver bandeja: ${item.type}`, summary);
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message: `${result.message} ${buildAutomationMessage("Motor actualizado", summary)}`,
        result,
        summary
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 500, {
        ok: false,
        error: error.message || "No se pudo resolver la tarea automatica"
      });
    }
  }

  if (requestUrl.pathname === "/api/automation/resolve-all" && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const actionableItems = (state.automationInbox || []).filter((item) =>
        ["pending_diplomas", "failed_email", "renewal", "course_ready", "associate_welcome", "associate_fee", "course_feedback_reminder", "associate_payment_notification", "associate_profile_notification", "associate_application_receipt", "associate_application_info_request", "associate_application_reply_receipt", "associate_application_reply_notification", "associate_application_decision"].includes(item.type)
      );

      let resolved = 0;
      let skipped = 0;
      let failed = 0;
      const details = [];
      const smtpReady = isSmtpConfigured(state);

      for (const item of actionableItems) {
        if (!smtpReady && ["pending_diplomas", "failed_email", "renewal", "associate_welcome", "associate_fee", "course_feedback_reminder", "associate_payment_notification", "associate_profile_notification", "associate_application_receipt", "associate_application_info_request", "associate_application_reply_receipt", "associate_application_reply_notification", "associate_application_decision"].includes(item.type)) {
          skipped += 1;
          details.push(`${item.title}: omitido hasta configurar SMTP`);
          continue;
        }

        try {
          const result = await resolveAutomationItem(state, item);
          resolved += 1;
          details.push(result.message);
        } catch (error) {
          failed += 1;
          details.push(`${item.title}: ${error.message || "No resuelto"}`);
        }
      }

      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, "Resolucion masiva de bandeja", summary);
      appendActivity(
        state,
        "system",
        "Bandeja automatica",
        `Resolucion masiva ejecutada: ${resolved} tarea(s) resuelta(s), ${skipped} omitida(s), ${failed} con incidencia`
      );
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message: `Bandeja automatica procesada: ${resolved} resuelta(s), ${skipped} omitida(s), ${failed} con incidencia. ${buildAutomationMessage("Motor actualizado", summary)}`,
        resolved,
        skipped,
        failed,
        details,
        summary
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 500, {
        ok: false,
        error: error.message || "No se pudo procesar la bandeja automatica"
      });
    }
  }

  if (requestUrl.pathname === "/api/import/csv" && req.method === "POST") {
    let state = null;
    try {
      const payload = await readJsonBody(req);
      const kind = String(payload.kind || "").trim().toLowerCase();
      const csv = String(payload.csv || "");

      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      let result = null;

      if (kind === "members") {
        result = importMembersCsv(state, csv);
      } else if (kind === "courses") {
        result = importCoursesCsv(state, csv);
      } else {
        return sendJson(res, 400, { ok: false, error: "Tipo de importacion no valido" });
      }

      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, `Importacion CSV de ${kind}`, summary);
      appendActivity(
        state,
        "system",
        "Importador CSV",
        `Importacion ${kind}: ${result.created} creado(s), ${result.updated} actualizado(s), ${result.skipped} omitido(s)`
      );
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message: `Importacion ${kind}: ${result.created} creado(s), ${result.updated} actualizado(s), ${result.skipped} omitido(s)`,
        result,
        summary
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo importar el CSV"
      });
    }
  }

  if (requestUrl.pathname === "/api/import/associate-workbook/preview" && req.method === "POST") {
    const state = readState();
    const account = requireAdminAccount(req, res, state);
    if (!account) {
      return;
    }

    try {
      const payload = await readJsonBody(req).catch(() => ({}));
      const preview = buildLegacyAssociateImportPreview(state, payload.workbookFile ? payload : String(payload.workbookPath || legacyAssociateWorkbookPath).trim());
      return sendJson(res, 200, {
        ok: true,
        message: `Analisis completado: ${preview.summary.totalRows} fila(s), ${preview.summary.readyRows} lista(s), ${preview.summary.reviewRows} para revisar y ${preview.summary.blockedRows} bloqueada(s)`,
        preview
      });
    } catch (error) {
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo analizar el Excel de socios"
      });
    }
  }

  if (requestUrl.pathname === "/api/import/associate-workbook/commit" && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }

      const payload = await readJsonBody(req).catch(() => ({}));
      const preview = buildLegacyAssociateImportPreview(
        state,
        payload.workbookFile ? payload : String(payload.workbookPath || legacyAssociateWorkbookPath).trim()
      );
      const result = importLegacyAssociates(state, preview, account.name);
      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, "Importacion socios legacy", summary);
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message: `Importados ${result.importedCount} socio(s), ${result.reviewCount} quedan para revisar y ${result.skippedCount} fila(s) se han omitido`,
        preview,
        result,
        summary
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo importar el Excel de socios"
      });
    }
  }

  if (requestUrl.pathname === "/api/agent/context" && req.method === "GET") {
    const state = readState();
    const account = requireAdminAccount(req, res, state);
    if (!account) {
      return;
    }
    return sendJson(res, 200, {
      ok: true,
      context: buildAgentContext(state)
    });
  }

  if (requestUrl.pathname === "/api/agent/resolve-next" && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      if (!state.settings?.agent?.enabled) {
        return sendJson(res, 400, { ok: false, error: "El agente esta desactivado en la configuracion" });
      }

      const item = pickNextAgentItem(state);
      if (!item) {
        return sendJson(res, 200, {
          ok: true,
          message: "No hay tareas automatizables disponibles para el agente"
        });
      }

      const result = await resolveAutomationItem(state, item);
      logAgentDecision(state, item, "resolved", result.message);
      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, `Agente: ${item.type}`, summary);
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message: `Agente: ${result.message} ${buildAutomationMessage("Motor actualizado", summary)}`,
        result,
        summary
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 500, {
        ok: false,
        error: error.message || "El agente no pudo resolver la siguiente tarea"
      });
    }
  }

const memberEnrollMatch = requestUrl.pathname.match(/^\/api\/member\/courses\/([^/]+)\/enroll$/);
  if (memberEnrollMatch && req.method === "POST") {
    let state = null;
    try {
      const payload = await readJsonBody(req).catch(() => ({}));
      state = readState();
      const account = requireAuthenticatedAccount(req, res, state);
      if (!account) {
        return;
      }
      if (!account.memberId) {
        return sendJson(res, 400, { ok: false, error: "Tu cuenta no tiene una ficha personal vinculada" });
      }

      const course = (state.courses || []).find((item) => item.id === memberEnrollMatch[1]);
      const member = (state.members || []).find((item) => item.id === account.memberId);
      if (!course || !member) {
        return sendJson(res, 404, { ok: false, error: "Curso o persona no encontrada" });
      }
      if (!account.associateId && !isCoursePublicAccess(course)) {
        return sendJson(res, 403, { ok: false, error: "Este curso esta reservado a socios" });
      }
      if (String(course.status || "") !== "Inscripcion abierta") {
        return sendJson(res, 403, { ok: false, error: "La inscripcion de este curso no esta abierta ahora mismo" });
      }
      if (!isCourseEnrollmentWindowOpen(course)) {
        return sendJson(res, 403, {
          ok: false,
          error: `La inscripcion de este curso se abrira el ${formatCourseEnrollmentOpensAt(course)}`
        });
      }

      if ((course.enrolledIds || []).includes(member.id) || (course.waitingIds || []).includes(member.id)) {
        return sendJson(res, 200, { ok: true, message: "Ya estabas registrado en este curso" });
      }

      course.enrollmentSubmissions = Array.isArray(course.enrollmentSubmissions)
        ? course.enrollmentSubmissions
        : [];

      const hasPaymentProof = Boolean(payload.paymentProof && payload.paymentProof.contentBase64);
      if ((course.enrolledIds || []).length < Number(course.capacity || 0)) {
        course.enrolledIds.push(member.id);
      } else {
        course.waitingIds.push(member.id);
      }

      course.enrollmentSubmissions = [
        ...(course.enrollmentSubmissions || []).filter((item) => item.memberId !== member.id),
        {
          id: `enrollment-${Date.now()}`,
          memberId: member.id,
          submittedAt: new Date().toISOString(),
          status: (course.enrolledIds || []).includes(member.id)
            ? hasPaymentProof || Number(payload.amount || course.enrollmentFee || 0) <= 0
              ? "confirmed"
              : "pending-proof"
            : "waiting",
          note: String(payload.note || "").trim(),
          paymentProof: payload.paymentProof || null,
          amount: Number(payload.amount || course.enrollmentFee || 0),
          method: String(payload.method || "Transferencia").trim() || "Transferencia"
        }
      ];

      appendActivity(state, "member", member.name, `Se ha inscrito en ${course.title}`);
      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, "Inscripcion de socio", summary);
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message:
          (course.enrolledIds || []).includes(member.id)
            ? hasPaymentProof || Number(payload.amount || course.enrollmentFee || 0) <= 0
              ? "Inscripcion confirmada"
              : "Solicitud registrada. Falta revisar o adjuntar el justificante de pago"
            : "No quedaban plazas y has quedado en lista de espera",
        summary
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, { ok: false, error: error.message || "No se pudo completar la inscripcion" });
    }
  }

  const memberEnrollProofMatch = requestUrl.pathname.match(/^\/api\/member\/courses\/([^/]+)\/enrollment-proof$/);
  if (memberEnrollProofMatch && req.method === "POST") {
    let state = null;
    try {
      const payload = await readJsonBody(req).catch(() => ({}));
      state = readState();
      const account = requireAuthenticatedAccount(req, res, state);
      if (!account) {
        return;
      }
      if (!account.memberId) {
        return sendJson(res, 400, { ok: false, error: "Tu cuenta no tiene una ficha personal vinculada" });
      }

      const course = (state.courses || []).find((item) => item.id === memberEnrollProofMatch[1]);
      const member = (state.members || []).find((item) => item.id === account.memberId);
      if (!course || !member) {
        return sendJson(res, 404, { ok: false, error: "Curso o persona no encontrada" });
      }

      const submission = (course.enrollmentSubmissions || []).find((item) => item.memberId === member.id);
      if (!submission) {
        return sendJson(res, 404, { ok: false, error: "No tienes una solicitud abierta en este curso" });
      }

      if (!payload.paymentProof || !payload.paymentProof.contentBase64) {
        return sendJson(res, 400, { ok: false, error: "Adjunta un justificante valido antes de enviarlo" });
      }

      submission.paymentProof = payload.paymentProof;
      submission.updatedAt = new Date().toISOString();
      submission.note = String(payload.note || submission.note || "").trim();
      if (submission.status === "pending-proof") {
        submission.status = (course.enrolledIds || []).includes(member.id) ? "pending-review" : submission.status;
      }

      appendActivity(state, "member", member.name, `Ha adjuntado justificante para ${course.title}`);
      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, "Aporte de justificante de inscripcion", summary);
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        message: "Justificante enviado correctamente. Queda pendiente de revision.",
        summary
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, { ok: false, error: error.message || "No se pudo adjuntar el justificante" });
    }
  }

  const reviewEnrollmentMatch = requestUrl.pathname.match(/^\/api\/courses\/([^/]+)\/enrollment-submissions\/([^/]+)\/status$/);
  if (reviewEnrollmentMatch && req.method === "POST") {
    let state = null;
    try {
      const courseId = reviewEnrollmentMatch[1];
      const submissionId = reviewEnrollmentMatch[2];
      const payload = await readJsonBody(req).catch(() => ({}));
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }

      const course = (state.courses || []).find((item) => item.id === courseId);
      if (!course) {
        return sendJson(res, 404, { ok: false, error: "Curso no encontrado" });
      }

      const submission = (course.enrollmentSubmissions || []).find((item) => item.id === submissionId);
      if (!submission) {
        return sendJson(res, 404, { ok: false, error: "Solicitud no encontrada" });
      }

      const nextStatus = String(payload.status || "").trim() || "confirmed";
      submission.status = nextStatus;
      submission.reviewedAt = new Date().toISOString();
      submission.reviewedBy = account.name;

      if (nextStatus === "rejected") {
        course.enrolledIds = (course.enrolledIds || []).filter((item) => item !== submission.memberId);
        course.waitingIds = (course.waitingIds || []).filter((item) => item !== submission.memberId);
      } else if (nextStatus === "confirmed") {
        course.waitingIds = (course.waitingIds || []).filter((item) => item !== submission.memberId);
        if (!(course.enrolledIds || []).includes(submission.memberId)) {
          if ((course.enrolledIds || []).length < Number(course.capacity || 0)) {
            course.enrolledIds.push(submission.memberId);
          } else if (!(course.waitingIds || []).includes(submission.memberId)) {
            course.waitingIds.push(submission.memberId);
            submission.status = "waiting";
          }
        }
      } else if (nextStatus === "pending-proof") {
        if (!(course.enrolledIds || []).includes(submission.memberId) && !(course.waitingIds || []).includes(submission.memberId)) {
          if ((course.enrolledIds || []).length < Number(course.capacity || 0)) {
            course.enrolledIds.push(submission.memberId);
          } else {
            course.waitingIds.push(submission.memberId);
            submission.status = "waiting";
          }
        }
      }

      const member = (state.members || []).find((item) => item.id === submission.memberId);
      appendActivity(
        state,
        "admin",
        account.name,
        `Ha actualizado la inscripcion de ${member?.name || "una persona"} en ${course.title} a ${submission.status}`
      );
      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, "Revision de inscripcion", summary);
      writeState(state);
      const memberName = member?.name || "La persona inscrita";
      const statusMessage =
        submission.status === "confirmed"
          ? `${memberName} queda con plaza confirmada en ${course.title}`
          : submission.status === "waiting"
            ? `${memberName} queda en lista de espera en ${course.title}`
            : submission.status === "rejected"
              ? `La inscripcion de ${memberName} ha sido rechazada en ${course.title}`
              : submission.status === "pending-proof"
                ? `${memberName} necesita adjuntar justificante para ${course.title}`
                : `${memberName} queda pendiente de revision en ${course.title}`;
      return sendJson(res, 200, { ok: true, message: statusMessage, summary });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 400, { ok: false, error: error.message || "No se pudo actualizar la inscripcion" });
    }
  }

  const deliverMemberMatch = requestUrl.pathname.match(/^\/api\/courses\/([^/]+)\/send-member\/([^/]+)$/);
  if (deliverMemberMatch && req.method === "POST") {
    const courseId = deliverMemberMatch[1];
    const memberId = deliverMemberMatch[2];

    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const course = state.courses.find((item) => item.id === courseId);
      const member = state.members.find((item) => item.id === memberId);

      if (!course || !member) {
        return sendJson(res, 404, { ok: false, error: "Curso o alumno no encontrado" });
      }

      const email = createEmailRecord(state, course, member);
      await deliverEmailRecord(state, email);
      appendActivity(state, "system", "Servidor", `Envio SMTP individual para ${member.name} en ${course.title}`);
      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, "Envio SMTP individual", summary);
      writeState(state);
      return sendJson(res, 200, { ok: true, email, summary });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 500, { ok: false, error: error.message || "No se pudo enviar" });
    }
  }

  const requestFeedbackReminderMatch = requestUrl.pathname.match(/^\/api\/courses\/([^/]+)\/members\/([^/]+)\/request-feedback-reminder$/);
  if (requestFeedbackReminderMatch && req.method === "POST") {
    const courseId = requestFeedbackReminderMatch[1];
    const memberId = requestFeedbackReminderMatch[2];

    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }

      const result = await requestCourseFeedbackReminderForMember(state, courseId, memberId, {
        actor: account.name || "Administracion"
      });
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        status: result.status,
        message: result.message,
        courseId,
        memberId
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 500, {
        ok: false,
        error: error.message || "No se pudo pedir la valoracion final"
      });
    }
  }

  const deliverCourseMatch = requestUrl.pathname.match(/^\/api\/courses\/([^/]+)\/send-pending$/);
  if (deliverCourseMatch && req.method === "POST") {
    const courseId = deliverCourseMatch[1];

    try {
      const state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const course = state.courses.find((item) => item.id === courseId);
      if (!course) {
        return sendJson(res, 404, { ok: false, error: "Curso no encontrado" });
      }

      let sentCount = 0;
      let failedCount = 0;
      for (const memberId of course.diplomaReady || []) {
        if (hasSuccessfulSmtpDelivery(state, course.id, memberId)) {
          continue;
        }

        const member = state.members.find((item) => item.id === memberId);
        if (!member) {
          continue;
        }

        const email = createEmailRecord(state, course, member);
        try {
          await deliverEmailRecord(state, email);
          if (email.status === "sent") {
            sentCount += 1;
          }
        } catch (error) {
          failedCount += 1;
        }
      }

      appendActivity(state, "system", "Servidor", `Lote SMTP procesado para ${course.title}`);
      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, "Envio SMTP por lote", summary);
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        sentCount,
        failedCount,
        message: `Lote SMTP procesado: ${sentCount} enviado(s), ${failedCount} fallido(s)`,
        summary
      });
    } catch (error) {
      return sendJson(res, 500, { ok: false, error: error.message || "No se pudo enviar el lote" });
    }
  }

  if (requestUrl.pathname === "/api/emails/send-queued" && req.method === "POST") {
    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      if (!isSmtpConfigured(state)) {
        return sendJson(res, 400, {
          ok: false,
          error: "Configura SMTP antes de enviar la bandeja"
        });
      }

      const pendingEmails = (state.emailOutbox || []).filter(
        (email) =>
          ["queued", "manual", "failed"].includes(String(email.status || "").trim()) &&
          String(email.to || "").trim()
      );
      const batch = pendingEmails.slice(0, 200);
      let sentCount = 0;
      let failedCount = 0;

      for (const email of batch) {
        try {
          email.status = "queued";
          email.transport = "smtp";
          await deliverEmailRecord(state, email);
          if (email.status === "sent") {
            sentCount += 1;
          }
        } catch (error) {
          failedCount += 1;
        }
      }

      appendActivity(
        state,
        "system",
        "Servidor",
        `Bandeja SMTP procesada: ${sentCount} enviado(s), ${failedCount} fallido(s)`
      );
      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, "Envio SMTP de bandeja", summary);
      writeState(state);
      return sendJson(res, 200, {
        ok: true,
        sentCount,
        failedCount,
        message: `Bandeja SMTP procesada: ${sentCount} enviado(s), ${failedCount} fallido(s)`,
        summary
      });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 500, {
        ok: false,
        error: error.message || "No se pudo enviar la bandeja"
      });
    }
  }

  const resendEmailMatch = requestUrl.pathname.match(/^\/api\/emails\/([^/]+)\/send$/);
  if (resendEmailMatch && req.method === "POST") {
    const emailId = resendEmailMatch[1];

    let state = null;
    try {
      state = readState();
      const account = requireAdminAccount(req, res, state);
      if (!account) {
        return;
      }
      const sourceEmail = (state.emailOutbox || []).find((item) => item.id === emailId);
      if (!sourceEmail) {
        return sendJson(res, 404, { ok: false, error: "Correo no encontrado" });
      }

      const email = {
        ...sourceEmail,
        id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sentAt: new Date().toISOString(),
        status: "queued",
        transport: "smtp",
        attemptCount: 0,
        deliveryError: "",
        deliveredAt: null
      };
      state.emailOutbox.unshift(email);
      await deliverEmailRecord(state, email);
      appendActivity(state, "system", "Servidor", `Reenvio SMTP solicitado para ${email.to}`);
      const summary = await runAutomationEngine(state);
      recordAutomationRun(state, "Reenvio SMTP", summary);
      writeState(state);
      return sendJson(res, 200, { ok: true, email, summary });
    } catch (error) {
      if (state) {
        writeState(state);
      }
      return sendJson(res, 500, { ok: false, error: error.message || "No se pudo reenviar" });
    }
  }

  const diplomaPdfMatch = requestUrl.pathname.match(/^\/api\/diplomas\/([^/]+)\/([^/]+)\.pdf$/);
  if (diplomaPdfMatch && req.method === "GET") {
    const courseId = diplomaPdfMatch[1];
    const memberId = diplomaPdfMatch[2];
    const state = readState();
    const account = requireAuthenticatedAccount(req, res, state);
    if (!account) {
      return;
    }
    if (!canAccessDiplomaRecord(state, account, courseId, memberId)) {
      return sendJson(res, 403, { ok: false, error: "No tienes acceso a este diploma" });
    }
    const pdf = buildDiplomaPdf(state, courseId, memberId);

    if (!pdf) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Diploma no encontrado");
      return;
    }

    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${sanitizeFilename(`diploma-${courseId}-${memberId}`)}.pdf"`
    });
    res.end(pdf);
    return;
  }

  const diplomaDocxMatch = requestUrl.pathname.match(/^\/api\/diplomas\/([^/]+)\/([^/]+)\.docx$/);
  if (diplomaDocxMatch && req.method === "GET") {
    const courseId = diplomaDocxMatch[1];
    const memberId = diplomaDocxMatch[2];
    const state = readState();
    const account = requireAuthenticatedAccount(req, res, state);
    if (!account) {
      return;
    }
    if (!canAccessDiplomaRecord(state, account, courseId, memberId)) {
      return sendJson(res, 403, { ok: false, error: "No tienes acceso a este diploma" });
    }

    try {
      const docx = buildCertificateDocx(state, courseId, memberId);
      if (!docx) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Certificado no encontrado");
        return;
      }

      res.writeHead(200, {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${sanitizeFilename(`certificado-${courseId}-${memberId}`)}.docx"`
      });
      res.end(docx);
      return;
    } catch (error) {
      return sendJson(res, 500, {
        ok: false,
        error: error.message || "No se pudo generar el certificado en Word"
      });
    }
  }

  const diplomaMatch = requestUrl.pathname.match(/^\/api\/diplomas\/([^/]+)\/([^/]+)$/);
  if (diplomaMatch && req.method === "GET") {
    const courseId = diplomaMatch[1];
    const memberId = diplomaMatch[2];
    const state = readState();
    const account = requireAuthenticatedAccount(req, res, state);
    if (!account) {
      return;
    }
    if (!canAccessDiplomaRecord(state, account, courseId, memberId)) {
      return sendJson(res, 403, { ok: false, error: "No tienes acceso a este diploma" });
    }
    const html = renderDiplomaHtml(state, courseId, memberId);

    if (!html) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Diploma no encontrado");
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  if (requestUrl.pathname === "/api/verify" && req.method === "GET") {
    const code = String(requestUrl.searchParams.get("code") || "").trim();
    const diploma = findDiplomaByCode(readState(), code);
    if (!diploma) {
      return sendJson(res, 404, { ok: false, error: "Diploma no encontrado" });
    }

    return sendJson(res, 200, {
      ok: true,
      diploma: {
        code: diploma.code,
        memberName: diploma.member.name,
        courseTitle: diploma.course.title,
        courseType: diploma.course.type,
        endDate: diploma.course.endDate,
        hours: diploma.course.hours
      }
    });
  }

  if (requestUrl.pathname === "/api/verify/pdf" && req.method === "GET") {
    const code = String(requestUrl.searchParams.get("code") || "").trim();
    const state = readState();
    const diploma = findDiplomaByCode(state, code);
    if (!diploma) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Diploma no encontrado");
      return;
    }

    const pdf = buildDiplomaPdf(state, diploma.course.id, diploma.member.id);
    if (!pdf) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Diploma no encontrado");
      return;
    }

    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${sanitizeFilename(`diploma-${diploma.course.id}-${diploma.member.id}`)}.pdf"`
    });
    res.end(pdf);
    return;
  }

  if (requestUrl.pathname === "/api/certificate-template-logo" && req.method === "GET") {
    if (!fs.existsSync(certificateTemplateLogoPath)) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Logo no disponible");
      return;
    }

    res.writeHead(200, { "Content-Type": "image/png" });
    fs.createReadStream(certificateTemplateLogoPath).pipe(res);
    return;
  }

  if (requestUrl.pathname === "/api/reports/courses.csv" && req.method === "GET") {
    const state = readState();
    const account = requireAdminAccount(req, res, state);
    if (!account) {
      return;
    }
    const csv = buildCoursesCsv(state);
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cursos-campus.csv"'
    });
    res.end(csv);
    return;
  }

  if (requestUrl.pathname === "/api/reports/diplomas.csv" && req.method === "GET") {
    const state = readState();
    const account = requireAdminAccount(req, res, state);
    if (!account) {
      return;
    }
    const csv = buildDiplomasCsv(state);
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="diplomas-campus.csv"'
    });
    res.end(csv);
    return;
  }

  if (requestUrl.pathname === "/api/reports/outbox.csv" && req.method === "GET") {
    const state = readState();
    const account = requireAdminAccount(req, res, state);
    if (!account) {
      return;
    }
    const csv = buildOutboxCsv(state);
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bandeja-salida-campus.csv"'
    });
    res.end(csv);
    return;
  }

  if (requestUrl.pathname === "/api/reports/associate-applications.csv" && req.method === "GET") {
    const state = readState();
    const account = requireAdminAccount(req, res, state);
    if (!account) {
      return;
    }
    const csv = buildAssociateApplicationsCsv(state);
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="solicitudes-socios.csv"'
    });
    res.end(csv);
    return;
  }

  const associateFileMatch = requestUrl.pathname.match(/^\/api\/associates\/files\/([^/]+)$/);
  if (associateFileMatch && req.method === "GET") {
    const state = readState();
    const account = requireAuthenticatedAccount(req, res, state);
    if (!account) {
      return;
    }
    if (!canAccessAssociateFile(account)) {
      return sendJson(res, 403, { ok: false, error: "No tienes acceso a estos documentos" });
    }
    return serveAssociateFile(decodeURIComponent(associateFileMatch[1]), res);
  }

  if (requestUrl.pathname === "/api/reports/associates.csv" && req.method === "GET") {
    const state = readState();
    const account = requireAdminAccount(req, res, state);
    if (!account) {
      return;
    }
    const csv = buildAssociatesCsv(state);
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="socios.csv"'
    });
    res.end(csv);
    return;
  }

  if (requestUrl.pathname === "/api/reports/associates-legacy-review.csv" && req.method === "GET") {
    const state = readState();
    const account = requireAdminAccount(req, res, state);
    if (!account) {
      return;
    }
    const csv = buildLegacyAssociateReviewCsv(state);
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="socios-legacy-revision.csv"'
    });
    res.end(csv);
    return;
  }

  if (requestUrl.pathname === "/api/reports/associate-payments.csv" && req.method === "GET") {
    const state = readState();
    const account = requireAdminAccount(req, res, state);
    if (!account) {
      return;
    }
    const csv = buildAssociatePaymentsCsv(state);
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="socios-pagos.csv"'
    });
    res.end(csv);
    return;
  }

  if (requestUrl.pathname === "/api/reports/associate-payment-submissions.csv" && req.method === "GET") {
    const state = readState();
    const account = requireAdminAccount(req, res, state);
    if (!account) {
      return;
    }
    const csv = buildAssociatePaymentSubmissionsCsv(state);
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="socios-justificantes-cuota.csv"'
    });
    res.end(csv);
    return;
  }

  if (requestUrl.pathname === "/api/reports/associate-profile-requests.csv" && req.method === "GET") {
    const state = readState();
    const account = requireAdminAccount(req, res, state);
    if (!account) {
      return;
    }
    const csv = buildAssociateProfileRequestsCsv(state);
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="socios-actualizaciones-ficha.csv"'
    });
    res.end(csv);
    return;
  }

  if (requestUrl.pathname === "/api/reports/activity.csv" && req.method === "GET") {
    const state = readState();
    const account = requireAdminAccount(req, res, state);
    if (!account) {
      return;
    }
    const csv = buildActivityCsv(state);
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="actividad-campus.csv"'
    });
    res.end(csv);
    return;
  }

  if (requestUrl.pathname === "/api/reports/automation.csv" && req.method === "GET") {
    const state = readState();
    const account = requireAdminAccount(req, res, state);
    if (!account) {
      return;
    }
    const csv = buildAutomationInboxCsv(state);
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="automatizacion-campus.csv"'
    });
    res.end(csv);
    return;
  }

  if (requestUrl.pathname === "/api/reports/agent.csv" && req.method === "GET") {
    const state = readState();
    const account = requireAdminAccount(req, res, state);
    if (!account) {
      return;
    }
    const csv = buildAgentLogCsv(state);
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="agente-campus.csv"'
    });
    res.end(csv);
    return;
  }

  if (requestUrl.pathname === "/api/templates/members.csv" && req.method === "GET") {
    const state = readState();
    const account = requireAdminAccount(req, res, state);
    if (!account) {
      return;
    }
    const csv = [
      "name;role;email;certifications;renewalsDue;accessPassword;accessRole",
      "Ana Lopez;Voluntaria;ana@isocronazero.org;ERA|Primeros auxilios;1;bomberos123;member"
    ].join("\n");
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plantilla-personas.csv"'
    });
    res.end(csv);
    return;
  }

  if (requestUrl.pathname === "/api/templates/courses.csv" && req.method === "GET") {
    const state = readState();
    const account = requireAdminAccount(req, res, state);
    if (!account) {
      return;
    }
    const csv = [
      "title;courseClass;type;status;summary;startDate;endDate;hours;capacity;diplomaTemplate",
      "Reciclaje vehiculos;practico;Vehiculos y despliegue;Planificacion;Practica operativa;2026-06-10;2026-06-11;8;15;Asistencia"
    ].join("\n");
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plantilla-cursos.csv"'
    });
    res.end(csv);
    return;
  }

  if (requestUrl.pathname === "/api/storage/import-state" && req.method === "POST") {
    const currentState = readState();
    const account = requireAdminAccount(req, res, currentState);
    if (!account) {
      return;
    }

    try {
      const payload = await readJsonBody(req, 80_000_000);
      const importedState = parseCampusSnapshotUpload(payload.snapshotFile);
      writeState(importedState);
      const nextState = readState();
      return sendJson(res, 200, {
        ok: true,
        message:
          "Estado real importado correctamente. Cierra la sesion demo y vuelve a entrar con tus credenciales reales.",
        storage: getStorageMeta(),
        counts: {
          accounts: Array.isArray(nextState.accounts) ? nextState.accounts.length : 0,
          associates: Array.isArray(nextState.associates) ? nextState.associates.length : 0,
          members: Array.isArray(nextState.members) ? nextState.members.length : 0,
          courses: Array.isArray(nextState.courses) ? nextState.courses.length : 0
        }
      });
    } catch (error) {
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo importar el state.json del campus"
      });
    }
  }

  if (requestUrl.pathname === "/api/storage/prepare-prepublication" && req.method === "POST") {
    const currentState = readState();
    const account = requireAdminAccount(req, res, currentState);
    if (!account) {
      return;
    }

    try {
      const payload = await readJsonBody(req);
      if (String(payload.confirmText || "").trim() !== "PREPUBLICACION LIMPIA") {
        return sendJson(res, 400, {
          ok: false,
          error: "Confirmacion incorrecta. Escribe PREPUBLICACION LIMPIA para limpiar la web de prueba."
        });
      }
      const cleanState = prepareCleanPrepublicationState(currentState, account.name || "Administracion");
      writeState(cleanState);
      const nextState = readState();
      return sendJson(res, 200, {
        ok: true,
        message:
          "Prepublicacion limpia preparada. Ahora importa el Excel real de socios desde Socios y cuotas > Migracion.",
        storage: getStorageMeta(),
        counts: {
          accounts: Array.isArray(nextState.accounts) ? nextState.accounts.length : 0,
          associates: Array.isArray(nextState.associates) ? nextState.associates.length : 0,
          members: Array.isArray(nextState.members) ? nextState.members.length : 0,
          courses: Array.isArray(nextState.courses) ? nextState.courses.length : 0
        }
      });
    } catch (error) {
      return sendJson(res, 400, {
        ok: false,
        error: error.message || "No se pudo preparar la prepublicacion limpia"
      });
    }
  }

  if (requestUrl.pathname === "/api/storage" && req.method === "GET") {
    const state = readState();
    const account = requireAdminAccount(req, res, state);
    if (!account) {
      return;
    }
    return sendJson(res, 200, {
      ok: true,
      storage: getStorageMeta()
    });
  }

  if (requestUrl.pathname === "/api/storage/export-state" && req.method === "GET") {
    const state = readState();
    const account = requireAdminAccount(req, res, state);
    if (!account) {
      return;
    }
    const timestamp = new Date().toISOString().replaceAll(":", "-");
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="campus-backup-${timestamp}.json"`
    });
    res.end(JSON.stringify(state, null, 2));
    return;
  }

  const emailMatch = requestUrl.pathname.match(/^\/api\/emails\/([^/]+)\.eml$/);
  if (emailMatch && req.method === "GET") {
    const emailId = emailMatch[1];
    const state = readState();
    const account = requireAuthenticatedAccount(req, res, state);
    if (!account) {
      return;
    }
    const email = (state.emailOutbox || []).find((item) => item.id === emailId);
    if (!email) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Correo no encontrado");
      return;
    }
    if (!canAccessEmailRecord(account, email)) {
      return sendJson(res, 403, { ok: false, error: "No tienes acceso a este correo" });
    }

    const eml = buildEml(email, state);
    res.writeHead(200, {
      "Content-Type": "message/rfc822; charset=utf-8",
      "Content-Disposition": `attachment; filename="${sanitizeFilename(email.subject || email.id)}.eml"`
    });
    res.end(eml);
    return;
  }

  serveStatic(requestUrl.pathname, res);
});

applyRecoveryAdminAccessFromEnv();

server.listen(port, () => {
  console.log(`Campus disponible en ${campusBaseUrl}`);
});

setInterval(() => {
  runBackgroundAutomationSweep().catch(() => {});
}, automationIntervalMs).unref();

function readJsonBody(req, maxBytes = 100_000_000) {
  return new Promise((resolve, reject) => {
    let raw = "";
    let totalBytes = 0;
    let payloadTooLarge = false;

    req.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        payloadTooLarge = true;
        return;
      }
      raw += chunk;
    });

    req.on("end", () => {
      if (payloadTooLarge) {
        reject(new Error("El archivo es demasiado grande para guardarlo en el campus. Reduce el tamano o usa un enlace."));
        return;
      }
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function serveStatic(urlPath, res) {
  const normalizedPath = urlPath === "/" ? "/index.html" : urlPath;
  const safePath = path.normalize(normalizedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8"
      });
      res.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream"
    });
    res.end(data);
  });
}

function serveAssociateFile(fileName, res) {
  const safeName = path.basename(String(fileName || ""));
  const filePath = path.join(associateUploadsDir, safeName);

  if (!filePath.startsWith(associateUploadsDir)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8"
      });
      res.end(error.code === "ENOENT" ? "Archivo no encontrado" : "Error del servidor");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Content-Disposition": `inline; filename="${safeName}"`
    });
    res.end(data);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function getMemberDocumentId(state, member) {
  const linkedAssociate = (state.associates || []).find(
    (associate) =>
      associate.linkedMemberId === member.id ||
      associate.id === member.associateId ||
      (associate.email && member.email && associate.email.toLowerCase() === member.email.toLowerCase())
  );

  return linkedAssociate?.dni || member.dni || "Pendiente de registro";
}

function hasMemberDocumentId(state, member) {
  return getMemberDocumentId(state, member) !== "Pendiente de registro";
}

function isMemberContentReadyForDiplomaServer(course, memberId) {
  if (!course || !memberId) {
    return false;
  }

  const entry = course.contentProgress?.[memberId] || {};
  const completedBlockIds = new Set(
    Array.isArray(entry.blockIds) ? entry.blockIds.map((item) => String(item).trim()).filter(Boolean) : []
  );
  const visibleBlocks = (course.modules || [])
    .flatMap((moduleItem) => moduleItem.lessons || [])
    .flatMap((lesson) => lesson.blocks || [])
    .filter((block) => block.visible !== false);

  if (!visibleBlocks.length) {
    return true;
  }

  const requiredBlocks = visibleBlocks.filter((block) => block.required);
  const targetBlocks = requiredBlocks.length ? requiredBlocks : visibleBlocks;
  return targetBlocks.every((block) => completedBlockIds.has(String(block.id || "").trim()));
}

function buildCertificateTitle(course) {
  return "CERTIFICADO DE APROVECHAMIENTO";
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

function getAssociateApplicationReviewIssues(application) {
  const issues = [];
  if (!String(application?.firstName || "").trim()) {
    issues.push("falta nombre");
  }
  if (!String(application?.lastName || "").trim()) {
    issues.push("falta apellidos");
  }
  if (!String(application?.phone || "").trim()) {
    issues.push("falta telefono");
  }
  if (!String(application?.email || "").trim()) {
    issues.push("falta email");
  }
  if (!String(application?.dni || "").trim()) {
    issues.push("falta DNI/NIE");
  }
  if (!String(application?.service || "").trim()) {
    issues.push("falta servicio");
  }
  if (!String(application?.paymentProof || "").trim()) {
    issues.push("falta justificante principal");
  }
  return issues;
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

  if (!String(associate.phone || "").trim()) {
    issues.push("sin telefono");
  }
  if (!normalizeDniValue(associate.dni)) {
    issues.push("sin DNI/NIE");
  }
  if (!String(associate.service || "").trim()) {
    issues.push("sin servicio");
  }
  if (!String(associate.email || "").trim()) {
    issues.push("sin email");
  } else if (!isLikelyEmail(String(associate.email || "").trim())) {
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

  if (nextPending.length && /Importado desde Excel legacy/i.test(String(associate.observations || ""))) {
    baseParts.push(`Pendientes: ${[...new Set(nextPending)].join(", ")}`);
  }

  associate.observations = baseParts.join(" | ");
}

function syncAssociateStatusAfterDataCompletion(associate) {
  if (!associate) {
    return { changed: false, previousStatus: "", nextStatus: "" };
  }

  const previousStatus = String(associate.status || "").trim();
  const reviewIssues = [
    ...getAssociateCurrentReviewIssues(associate),
    ...getAssociateObservationPendingExtras(associate)
  ];

  if (previousStatus !== "Revisar documentacion" || reviewIssues.length) {
    return { changed: false, previousStatus, nextStatus: previousStatus };
  }

  const nextStatus =
    getAssociateYearFeeGap(associate, String(new Date().getFullYear())) > 0
      ? "Pendiente cuota"
      : "Activa";

  if (nextStatus === previousStatus) {
    return { changed: false, previousStatus, nextStatus };
  }

  associate.status = nextStatus;
  return { changed: true, previousStatus, nextStatus };
}

function synchronizeAssociateStatuses(state) {
  let changed = false;
  (state.associates || []).forEach((associate) => {
    const beforeObservation = String(associate.observations || "");
    const beforeStatus = String(associate.status || "");
    refreshAssociateLegacyObservationSummary(associate);
    const transition = syncAssociateStatusAfterDataCompletion(associate);
    if (beforeObservation !== String(associate.observations || "") || beforeStatus !== String(associate.status || "") || transition.changed) {
      changed = true;
    }
  });
  return changed;
}

function getAssociateApplicationApprovalBlockers(state, application) {
  const blockers = [...getAssociateApplicationReviewIssues(application)];
  const email = String(application?.email || "").trim().toLowerCase();
  const phone = normalizePhone(application?.phone || "");
  const dni = normalizeDniValue(application?.dni || "");

  if (email && !isLikelyEmail(email)) {
    blockers.push("email con formato dudoso");
  }
  if (phone && phone.length < 9) {
    blockers.push("telefono con formato dudoso");
  }
  if (dni && !/^[0-9XYZ][0-9]{7}[A-Z]$|^[A-Z0-9]{6,12}$/.test(dni)) {
    blockers.push("DNI/NIE con formato dudoso");
  }

  const duplicateAssociate = (state.associates || []).find(
    (item) =>
      item.id !== application?.associateId &&
      ((email && String(item.email || "").trim().toLowerCase() === email) ||
        (dni && normalizeDniValue(item.dni) === dni))
  );
  if (duplicateAssociate) {
    blockers.push("posible duplicado con socio existente");
  }

  const duplicateApplication = (state.associateApplications || []).find(
    (item) =>
      item.id !== application?.id &&
      String(item.status || "") !== "Rechazada" &&
      ((email && String(item.email || "").trim().toLowerCase() === email) ||
        (dni && normalizeDniValue(item.dni) === dni))
  );
  if (duplicateApplication) {
    blockers.push("posible duplicado con otra solicitud");
  }

  return blockers;
}

function countReplacementChars(text) {
  return (String(text || "").match(/\uFFFD/g) || []).length;
}

function fixMojibakeText(value) {
  const raw = String(value || "");
  if (!/[\u00C0-\u00FF\uFFFD]/.test(raw)) {
    return raw;
  }
  try {
    const repaired = Buffer.from(raw, "latin1").toString("utf8");
    if (countReplacementChars(repaired) <= countReplacementChars(raw)) {
      return repaired;
    }
  } catch (error) {
    // Ignore decoding issues and fall back to raw input.
  }
  return raw;
}

function normalizeLegacyWorkbookText(value) {
  return fixMojibakeText(value).replace(/\s+/g, " ").trim();
}

function normalizeLegacyWorkbookMonth(value) {
  const raw = normalizeLegacyWorkbookText(value);
  if (!raw) {
    return "";
  }
  const normalized = raw.toLocaleLowerCase("es-ES");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function parseLegacyWorkbookNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const raw = String(value).trim();
  let normalized = raw;
  if (raw.includes(",") && raw.includes(".")) {
    normalized = raw.replace(/\./g, "").replace(",", ".");
  } else if (raw.includes(",")) {
    normalized = raw.replace(",", ".");
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function decodeXmlEntities(text) {
  return String(text || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function getXmlAttribute(fragment, attributeName) {
  const match = String(fragment || "").match(new RegExp(`${attributeName}="([^"]*)"`, "i"));
  return decodeXmlEntities(match ? match[1] : "");
}

function readZipEntries(buffer) {
  const endSignature = 0x06054b50;
  let endOffset = -1;
  for (let index = buffer.length - 22; index >= Math.max(0, buffer.length - 66000); index -= 1) {
    if (buffer.readUInt32LE(index) === endSignature) {
      endOffset = index;
      break;
    }
  }

  if (endOffset === -1) {
    throw new Error("No se ha podido leer el contenedor ZIP del Excel");
  }

  const centralDirectorySize = buffer.readUInt32LE(endOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(endOffset + 16);
  const entries = new Map();
  let cursor = centralDirectoryOffset;

  while (cursor < centralDirectoryOffset + centralDirectorySize) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error("Directorio central ZIP invalido");
    }

    const compressionMethod = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const fileNameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.toString("utf8", cursor + 46, cursor + 46 + fileNameLength);

    const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
    const compressedData = buffer.slice(dataStart, dataStart + compressedSize);

    let data = compressedData;
    if (compressionMethod === 8) {
      data = zlib.inflateRawSync(compressedData);
    } else if (compressionMethod !== 0) {
      throw new Error(`Metodo ZIP no soportado para ${name}`);
    }

    if (uncompressedSize && data.length !== uncompressedSize) {
      throw new Error(`Tamano inesperado al leer ${name}`);
    }

    entries.set(name, data);
    cursor += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function getZipEntryText(entries, entryName) {
  const entry = entries.get(entryName);
  if (!entry) {
    throw new Error(`No se ha encontrado ${entryName} dentro del Excel`);
  }
  return entry.toString("utf8");
}

function getWorkbookSheetTarget(entries, sheetName) {
  const workbookXml = getZipEntryText(entries, "xl/workbook.xml");
  const workbookRelsXml = getZipEntryText(entries, "xl/_rels/workbook.xml.rels");
  const sheets = [...workbookXml.matchAll(/<sheet\b([^>]*)\/>/g)];
  const relations = [...workbookRelsXml.matchAll(/<Relationship\b([^>]*)\/>/g)];
  const relationMap = new Map(
    relations.map((match) => {
      const attrs = match[1];
      return [getXmlAttribute(attrs, "Id"), getXmlAttribute(attrs, "Target")];
    })
  );

  const selectedSheet =
    sheets.find((match) => getXmlAttribute(match[1], "name") === sheetName) || sheets[0];
  if (!selectedSheet) {
    throw new Error("No hay hojas en el Excel");
  }

  const selectedSheetName = getXmlAttribute(selectedSheet[1], "name");
  const relationId = getXmlAttribute(selectedSheet[1], "r:id") || getXmlAttribute(selectedSheet[1], "id");
  const target = relationMap.get(relationId);
  if (!target) {
    throw new Error("No se ha encontrado la hoja de socios en el libro");
  }

  return {
    sheetName: selectedSheetName,
    entryName: target.startsWith("xl/") ? target : `xl/${target.replace(/^\//, "")}`
  };
}

function parseSharedStrings(entries) {
  if (!entries.has("xl/sharedStrings.xml")) {
    return [];
  }

  const xml = getZipEntryText(entries, "xl/sharedStrings.xml");
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) => {
    const fragment = match[1];
    const texts = [...fragment.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((item) =>
      decodeXmlEntities(item[1])
    );
    return texts.join("");
  });
}

function parseWorksheetRows(entries, entryName, sharedStrings) {
  const xml = getZipEntryText(entries, entryName);
  return [...xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
    const rowAttributes = rowMatch[1];
    const rowNumber = Number(getXmlAttribute(rowAttributes, "r") || 0);
    const cellMatches = [...rowMatch[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)];
    const cells = cellMatches.map((cellMatch) => {
      const attributes = cellMatch[1];
      const content = cellMatch[2] || "";
      const ref = getXmlAttribute(attributes, "r");
      const type = getXmlAttribute(attributes, "t");
      let value = "";

      const inlineMatch = content.match(/<is\b[^>]*>([\s\S]*?)<\/is>/);
      const valueMatch = content.match(/<v\b[^>]*>([\s\S]*?)<\/v>/);
      if (inlineMatch) {
        value = decodeXmlEntities(inlineMatch[1].replace(/<[^>]+>/g, ""));
      } else if (valueMatch) {
        value = decodeXmlEntities(valueMatch[1]);
      }

      if (type === "s" && value !== "") {
        value = sharedStrings[Number(value)] || "";
      }

      return { ref, type, value: String(value || "") };
    });

    return { rowNumber, cells };
  });
}

function normalizeLegacyWorkbookPhone(value) {
  const raw = normalizeLegacyWorkbookText(value);
  if (!raw) {
    return "";
  }

  if (/^[\d.,]+E[+-]?\d+$/i.test(raw)) {
    const normalized = Number(raw.replace(",", "."));
    if (Number.isFinite(normalized)) {
      return String(Math.round(normalized));
    }
  }

  return raw;
}

function parseLegacyWorkbookTimestamp(value) {
  const raw = normalizeLegacyWorkbookText(value);
  const numeric = Number(raw.replace(",", "."));
  if (!raw || !Number.isFinite(numeric) || numeric < 30000) {
    return raw;
  }

  const excelEpoch = Date.UTC(1899, 11, 30);
  const milliseconds = Math.round(numeric * 24 * 60 * 60 * 1000);
  return new Date(excelEpoch + milliseconds).toISOString();
}

function parseLegacyAssociateWorkbookBuffer(workbookBuffer, sourcePath = "Excel importado") {
  const entries = readZipEntries(workbookBuffer);
  const { sheetName, entryName } = getWorkbookSheetTarget(entries, "Listado de socios");
  const sharedStrings = parseSharedStrings(entries);
  const worksheetRows = parseWorksheetRows(entries, entryName, sharedStrings);

  if (!worksheetRows.length) {
    throw new Error("La hoja de socios no contiene filas");
  }

  const headerCells = worksheetRows[0].cells;
  const headerByColumn = new Map(
    headerCells.map((cell) => [String(cell.ref || "").replace(/\d/g, ""), normalizeLegacyWorkbookText(cell.value)])
  );

  const rows = worksheetRows
    .slice(1)
    .map((row) => {
      const record = { sourceRow: row.rowNumber };
      row.cells.forEach((cell) => {
        const column = String(cell.ref || "").replace(/\d/g, "");
        const header = headerByColumn.get(column);
        if (!header) {
          return;
        }
        record[header] = cell.value;
      });
      return record;
    })
    .filter((row) => row["Nombre"] || row["Apellidos"] || row["E-mail"]);

  return {
    sourcePath,
    sheetName,
    headers: [...headerByColumn.values()],
    rows
  };
}

function readLegacyAssociateWorkbookRows(workbookPath = legacyAssociateWorkbookPath) {
  if (!workbookPath || !fs.existsSync(workbookPath)) {
    throw new Error(`No se ha encontrado el Excel de socios en ${workbookPath}`);
  }

  const workbookBuffer = fs.readFileSync(workbookPath);
  return parseLegacyAssociateWorkbookBuffer(workbookBuffer, workbookPath);
}

function resolveLegacyAssociateWorkbookRows(payload = {}) {
  const workbookFile = payload.workbookFile;
  if (workbookFile && typeof workbookFile === "object" && workbookFile.contentBase64) {
    return parseLegacyAssociateWorkbookBuffer(
      Buffer.from(String(workbookFile.contentBase64), "base64"),
      normalizeLegacyWorkbookText(workbookFile.name) || "Excel subido"
    );
  }

  const workbookPath = String(payload.workbookPath || legacyAssociateWorkbookPath).trim();
  return readLegacyAssociateWorkbookRows(workbookPath);
}

const legacyAssociateWorkbookColumns = {
  submittedAt: ["Marca temporal"],
  firstName: ["Nombre"],
  lastName: ["Apellidos"],
  dni: ["DNI"],
  phone: ["Teléfono", "Telefono", "TelÃ©fono"],
  email: ["E-mail", "Email", "Correo", "Dirección de correo electrónico"],
  service: [
    "Servicio al que pertenece",
    "Servicio al que pertenece (Acrónimo)",
    "Servicio al que pertenece (AcrÃ³nimo)"
  ],
  yearly2024: ["2024"],
  yearly2025: ["2025"],
  yearly2026: ["2026"],
  yearly2027: ["2027"],
  lastQuotaMonth: [
    "MES DE LA ÚLTIMA CUOTA",
    "MES DE LA ULTIMA CUOTA",
    "MES DE LA ÃšLTIMA CUOTA"
  ],
  annualTotal: ["Anual"],
  observations: ["Observaciones"],
  associateNumber: ["Número de socio", "Numero de socio", "NÃºmero de socio"]
};

const normalizedLegacyAssociateWorkbookColumns = {
  submittedAt: ["Marca temporal"],
  firstName: ["Nombre"],
  lastName: ["Apellidos"],
  dni: ["DNI"],
  phone: ["Telefono", "Teléfono", "TelÃ©fono", "TelÃƒÂ©fono"],
  email: [
    "E-mail",
    "Email",
    "Correo",
    "Direccion de correo electronico",
    "Dirección de correo electrónico",
    "DirecciÃ³n de correo electrÃ³nico"
  ],
  service: [
    "Servicio al que pertenece",
    "Servicio al que pertenece (Acronimo)",
    "Servicio al que pertenece (Acrónimo)",
    "Servicio al que pertenece (AcrÃ³nimo)",
    "Servicio al que pertenece (AcrÃƒÂ³nimo)"
  ],
  yearly2024: ["2024"],
  yearly2025: ["2025"],
  yearly2026: ["2026"],
  yearly2027: ["2027"],
  lastQuotaMonth: [
    "MES DE LA ULTIMA CUOTA",
    "MES DE LA ÚLTIMA CUOTA",
    "MES DE LA ÃšLTIMA CUOTA",
    "MES DE LA ÃƒÅ¡LTIMA CUOTA"
  ],
  annualTotal: ["Anual"],
  observations: ["Observaciones"],
  associateNumber: ["Numero de socio", "Número de socio", "NÃºmero de socio", "NÃƒÂºmero de socio"]
};

function getLegacyAssociateWorkbookValue(row, aliases = []) {
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(row, alias)) {
      return row[alias];
    }
  }
  return "";
}

function buildLegacyAssociateImportPreview(state, workbookSource = legacyAssociateWorkbookPath) {
  const workbook =
    typeof workbookSource === "string"
      ? readLegacyAssociateWorkbookRows(workbookSource)
      : resolveLegacyAssociateWorkbookRows(workbookSource);
  const existingAssociatesByEmail = new Map();
  const existingAssociatesByDni = new Map();
  (state.associates || []).forEach((item) => {
    const normalizedEmail = String(item.email || "").trim().toLowerCase();
    const normalizedDni = normalizeDniValue(item.dni);
    if (normalizedEmail) {
      existingAssociatesByEmail.set(normalizedEmail, item);
    }
    if (normalizedDni) {
      existingAssociatesByDni.set(normalizedDni, item);
    }
  });
  const seenWorkbookEmails = new Set();
  const seenWorkbookDnis = new Set();

  const rows = (workbook.rows || []).map((row) => {
    const firstName = normalizeLegacyWorkbookText(
      getLegacyAssociateWorkbookValue(row, normalizedLegacyAssociateWorkbookColumns.firstName)
    );
    const lastName = normalizeLegacyWorkbookText(
      getLegacyAssociateWorkbookValue(row, normalizedLegacyAssociateWorkbookColumns.lastName)
    );
    const email = normalizeLegacyWorkbookText(
      getLegacyAssociateWorkbookValue(row, normalizedLegacyAssociateWorkbookColumns.email)
    ).toLowerCase();
    const phone = normalizeLegacyWorkbookPhone(
      getLegacyAssociateWorkbookValue(row, normalizedLegacyAssociateWorkbookColumns.phone)
    );
    const dni = normalizeDniValue(
      getLegacyAssociateWorkbookValue(row, normalizedLegacyAssociateWorkbookColumns.dni)
    );
    const service = normalizeLegacyWorkbookText(
      getLegacyAssociateWorkbookValue(row, normalizedLegacyAssociateWorkbookColumns.service)
    );
    const observations = normalizeLegacyWorkbookText(
      getLegacyAssociateWorkbookValue(row, normalizedLegacyAssociateWorkbookColumns.observations)
    );
    const associateNumber = Math.round(
      parseLegacyWorkbookNumber(
        getLegacyAssociateWorkbookValue(row, normalizedLegacyAssociateWorkbookColumns.associateNumber)
      )
    );
    const yearlyFees = {
      "2024": parseLegacyWorkbookNumber(
        getLegacyAssociateWorkbookValue(row, normalizedLegacyAssociateWorkbookColumns.yearly2024)
      ),
      "2025": parseLegacyWorkbookNumber(
        getLegacyAssociateWorkbookValue(row, normalizedLegacyAssociateWorkbookColumns.yearly2025)
      ),
      "2026": parseLegacyWorkbookNumber(
        getLegacyAssociateWorkbookValue(row, normalizedLegacyAssociateWorkbookColumns.yearly2026)
      ),
      "2027": parseLegacyWorkbookNumber(
        getLegacyAssociateWorkbookValue(row, normalizedLegacyAssociateWorkbookColumns.yearly2027)
      )
    };
    const notes = [];
    const blockers = [];
    const emailMatch = email ? existingAssociatesByEmail.get(email) || null : null;
    const dniMatch = dni ? existingAssociatesByDni.get(dni) || null : null;
    const matchedAssociates = [emailMatch, dniMatch].filter(Boolean);
    const distinctMatchedAssociates = matchedAssociates.filter(
      (item, index, list) => list.findIndex((entry) => entry.id === item.id) === index
    );
    const existingAssociate = distinctMatchedAssociates.length === 1 ? distinctMatchedAssociates[0] : null;

    if (!firstName) {
      blockers.push("falta nombre");
    }
    if (!lastName) {
      blockers.push("falta apellidos");
    }
    if (!email) {
      blockers.push("falta email");
    } else if (!isLikelyEmail(email)) {
      blockers.push("email con formato dudoso");
    }

    if (phone && normalizePhone(phone).length < 9) {
      notes.push("telefono con formato dudoso");
    }
    if (dni && !/^[0-9XYZ][0-9]{7}[A-Z]$|^[A-Z0-9]{6,12}$/.test(dni)) {
      notes.push("DNI/NIE con formato dudoso");
    }
    if (distinctMatchedAssociates.length > 1) {
      blockers.push("conflicto con datos existentes del socio");
    } else if (email && emailMatch && (!existingAssociate || emailMatch.id !== existingAssociate.id)) {
      blockers.push("email ya existe en socios");
    } else if (email && seenWorkbookEmails.has(email)) {
      blockers.push("email duplicado dentro del Excel");
    } else if (email) {
      seenWorkbookEmails.add(email);
    }
    if (dni && dniMatch && (!existingAssociate || dniMatch.id !== existingAssociate.id)) {
      blockers.push("DNI/NIE ya existe en socios");
    } else if (dni && seenWorkbookDnis.has(dni)) {
      blockers.push("DNI/NIE duplicado dentro del Excel");
    } else if (dni) {
      seenWorkbookDnis.add(dni);
    }

    if (!phone) {
      notes.push("sin telefono");
    }
    if (!dni) {
      notes.push("sin DNI/NIE");
    }
    if (!service) {
      notes.push("sin servicio");
    }
    if (observations) {
      notes.push(`obs.: ${observations}`);
    }

    const importStatus = blockers.length ? "blocked" : notes.length ? "review" : "ready";
    return {
      sourceRow: Number(row.sourceRow || 0),
      associateNumber: associateNumber > 0 ? associateNumber : 0,
      firstName,
      lastName,
      email,
      phone,
      dni,
      service,
      observations,
      yearlyFees,
      annualTotal: parseLegacyWorkbookNumber(
        getLegacyAssociateWorkbookValue(row, normalizedLegacyAssociateWorkbookColumns.annualTotal)
      ),
      lastQuotaMonth: normalizeLegacyWorkbookMonth(
        getLegacyAssociateWorkbookValue(row, normalizedLegacyAssociateWorkbookColumns.lastQuotaMonth)
      ),
      submittedAt: parseLegacyWorkbookTimestamp(
        getLegacyAssociateWorkbookValue(row, normalizedLegacyAssociateWorkbookColumns.submittedAt)
      ),
      existingAssociateId: existingAssociate?.id || "",
      importAction: existingAssociate ? "update" : "create",
      blockers,
      notes,
      importStatus
    };
  });

  return {
    sourcePath: workbook.sourcePath,
    sheetName: workbook.sheetName,
    headers: workbook.headers || [],
    rows,
    summary: {
      totalRows: rows.length,
      readyRows: rows.filter((item) => item.importStatus === "ready").length,
      reviewRows: rows.filter((item) => item.importStatus === "review").length,
      blockedRows: rows.filter((item) => item.importStatus === "blocked").length
    }
  };
}

function importLegacyAssociates(state, preview, actorName = "Administracion") {
  const importedAssociates = [];
  const skippedRows = [];
  let highestAssociateNumber = Math.max(
    0,
    ...((state.associates || []).map((item) => Number(item.associateNumber || 0)))
  );

  for (const row of preview.rows || []) {
    if (row.importStatus === "blocked") {
      skippedRows.push({
        sourceRow: row.sourceRow,
        name: [row.firstName, row.lastName].filter(Boolean).join(" "),
        reason: row.blockers.join(", ")
      });
      continue;
    }

    const existingAssociate = row.existingAssociateId
      ? (state.associates || []).find((item) => item.id === row.existingAssociateId)
      : null;
    const importedAssociateNumber =
      Number(row.associateNumber || 0) > 0 ? Number(row.associateNumber) : highestAssociateNumber + 1;
    highestAssociateNumber = Math.max(highestAssociateNumber, importedAssociateNumber);
    const observationText = String(row.observations || "");
    const status = /baja/i.test(observationText)
      ? "Baja"
      : row.notes.filter((note) => !note.startsWith("obs.:")).length
        ? "Revisar documentacion"
        : "Activa";
    const importObservation = [
      `Importado desde Excel legacy (fila ${row.sourceRow})`,
      row.associateNumber ? `Numero de socio heredado: ${row.associateNumber}` : "",
      row.notes.length ? `Pendientes: ${row.notes.join(", ")}` : ""
    ]
      .filter(Boolean)
      .join(" | ");

    if (existingAssociate) {
      existingAssociate.associateNumber = importedAssociateNumber;
      existingAssociate.status = status;
      existingAssociate.firstName = row.firstName;
      existingAssociate.lastName = row.lastName;
      existingAssociate.dni = row.dni;
      existingAssociate.phone = row.phone;
      existingAssociate.email = row.email;
      existingAssociate.service = row.service;
      existingAssociate.lastQuotaMonth = row.lastQuotaMonth;
      existingAssociate.annualAmount = Number(state.settings?.associates?.defaultAnnualAmount || 50);
      existingAssociate.manualYearlyFees = {
        "2024": Number(row.yearlyFees?.["2024"] || 0),
        "2025": Number(row.yearlyFees?.["2025"] || 0),
        "2026": Number(row.yearlyFees?.["2026"] || 0),
        "2027": Number(row.yearlyFees?.["2027"] || 0)
      };
      existingAssociate.yearlyFees = {
        "2024": Number(row.yearlyFees?.["2024"] || 0),
        "2025": Number(row.yearlyFees?.["2025"] || 0),
        "2026": Number(row.yearlyFees?.["2026"] || 0),
        "2027": Number(row.yearlyFees?.["2027"] || 0)
      };
      existingAssociate.observations = [existingAssociate.observations, importObservation]
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .filter((item, index, list) => list.indexOf(item) === index)
        .join(" | ");
      syncAssociateLinkedIdentity(state, existingAssociate);
      importedAssociates.push(existingAssociate);
      appendActivity(
        state,
        "admin",
        actorName,
        "Socios",
        `Actualizado socio legacy #${existingAssociate.associateNumber} (${getAssociateFullName(existingAssociate)})`
      );
      continue;
    }

    const associate = {
      id: `associate-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      associateNumber: importedAssociateNumber,
      applicationId: "",
      status,
      firstName: row.firstName,
      lastName: row.lastName,
      dni: row.dni,
      phone: row.phone,
      email: row.email,
      service: row.service,
      joinedAt: new Date().toISOString(),
      linkedMemberId: "",
      linkedAccountId: "",
      campusAccessStatus: "sin acceso",
      temporaryPassword: "",
      welcomeEmailSentAt: "",
      welcomeEmailStatus: "pending",
      lastQuotaReminderAt: "",
      lastQuotaMonth: row.lastQuotaMonth,
      annualAmount: Number(state.settings?.associates?.defaultAnnualAmount || 50),
      observations: importObservation,
      manualYearlyFees: {
        "2024": Number(row.yearlyFees?.["2024"] || 0),
        "2025": Number(row.yearlyFees?.["2025"] || 0),
        "2026": Number(row.yearlyFees?.["2026"] || 0),
        "2027": Number(row.yearlyFees?.["2027"] || 0)
      },
      yearlyFees: {
        "2024": Number(row.yearlyFees?.["2024"] || 0),
        "2025": Number(row.yearlyFees?.["2025"] || 0),
        "2026": Number(row.yearlyFees?.["2026"] || 0),
        "2027": Number(row.yearlyFees?.["2027"] || 0)
      },
      payments: []
    };

    state.associates = state.associates || [];
    state.associates.unshift(associate);
    importedAssociates.push(associate);
    appendActivity(
      state,
      "admin",
      actorName,
      "Socios",
      `Importado socio legacy #${associate.associateNumber} (${getAssociateFullName(associate)})`
    );
  }

  if (importedAssociates[0]) {
    state.selectedAssociateId = importedAssociates[0].id;
  }
  state.settings.associates.nextAssociateNumber = highestAssociateNumber + 1;

  return {
    importedCount: importedAssociates.length,
    reviewCount: importedAssociates.filter((item) => item.status === "Revisar documentacion").length,
    skippedCount: skippedRows.length,
    skippedRows
  };
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

function parseCertificateSections(lines) {
  const manualLines = Array.isArray(lines) ? lines.map((item) => String(item || "").trim()).filter(Boolean) : [];
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
    sections.unshift({
      title: "Contenidos principales",
      items: looseItems
    });
  }

  return sections;
}

function getCourseCertificateSections(course) {
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

  const objectiveSections = (course.objectives || []).length
    ? [
        {
          title: "Contenidos principales",
          items: [...new Set((course.objectives || []).map((item) => String(item || "").trim()).filter(Boolean))].slice(0, 6)
        }
      ]
    : [];

  return objectiveSections.length ? objectiveSections : fallbackCertificateContentSections;
}

function buildCertificateModel(state, courseId, memberId) {
  const diploma = getDiplomaRecord(state, courseId, memberId) || getPreviewCertificateRecord(state, courseId, memberId);
  if (!diploma) {
    return null;
  }

  const { course, member, code, registryNumber } = diploma;
  const verifyUrl = `/verify.html?code=${encodeURIComponent(code)}`;
  const city = course.certificateCity || state.settings?.certificateCity || "Madrid";

  return {
    diploma,
    course,
    member,
    code,
    registryNumber,
    verifyUrl,
    certificateTitle: buildCertificateTitle(course),
    documentId: getMemberDocumentId(state, member),
    dateRange: formatDateRange(course.startDate, course.endDate),
    issueDate: formatDate(course.endDate || new Date().toISOString()),
    city,
    sections: getCourseCertificateSections(course),
    preview: Boolean(diploma.preview)
  };
}

function buildCertificateDocx(state, courseId, memberId) {
  const model = buildCertificateModel(state, courseId, memberId);
  if (!model) {
    return null;
  }

  if (!fs.existsSync(certificateTemplateSourceDir)) {
    throw new Error("La plantilla DOCX del certificado no esta disponible.");
  }

  const { course, member, registryNumber, documentId, dateRange, issueDate, city } = model;
  const replacements = {
    Nombre_completo: member.name,
    DNI: documentId,
    Curso: course.title,
    Horas: String(course.hours || ""),
    Fecha: dateRange,
    Ciudad: city,
    Fecha_emision: issueDate,
    Numero_certificado: registryNumber
  };
  const files = collectDirectoryEntries(certificateTemplateSourceDir).map((entry) => {
    let data = entry.data;
    if (entry.name.startsWith("word/") && entry.name.endsWith(".xml")) {
      let content = data.toString("utf8");
      Object.entries(replacements).forEach(([key, value]) => {
        const token = `&lt;&lt;${key}&gt;&gt;`;
        content = content.replaceAll(token, escapeXmlText(value));
      });
      data = Buffer.from(content, "utf8");
    }

    return {
      name: entry.name,
      data
    };
  });

  return buildZipArchive(files);
}

function renderDiplomaHtml(state, courseId, memberId) {
  const model = buildCertificateModel(state, courseId, memberId);
  if (!model) {
    return null;
  }

  const {
    course,
    member,
    code,
    registryNumber,
    verifyUrl,
    certificateTitle,
    documentId,
    dateRange,
    issueDate,
    city,
    sections
  } = model;
  const logoMarkup = fs.existsSync(certificateTemplateLogoPath)
    ? `<div class="certificate-artwork" aria-hidden="true"></div>`
    : `<div class="certificate-seal">${escapeHtml(state.settings.organization)}</div>`;

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(certificateTitle)} ${escapeHtml(member.name)}</title>
    <style>
      @page {
        size: A4 landscape;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 12px;
        font-family: Georgia, "Times New Roman", serif;
        color: #2f261e;
        background: #f4ecdf;
      }
      .certificate {
        position: relative;
        overflow: hidden;
        max-width: 1400px;
        margin: 0 auto;
        min-height: calc(100vh - 44px);
        padding: 34px 44px 26px;
        background: linear-gradient(180deg, #fbf7f1, #f4ece1);
        box-shadow: 0 18px 46px rgba(54, 28, 10, 0.1);
      }
      .certificate-artwork {
        position: absolute;
        inset: 0;
        background-image: url("/api/certificate-template-logo");
        background-position: center center;
        background-repeat: no-repeat;
        background-size: cover;
        opacity: 0.26;
        pointer-events: none;
      }
      .certificate-grid {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: minmax(0, 1.34fr) minmax(300px, 0.66fr);
        gap: 34px;
        min-height: calc(100vh - 90px);
      }
      .certificate-main {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding-top: 86px;
      }
      .certificate-seal {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 64px;
        padding: 10px 16px;
        border: 1px solid rgba(140, 49, 20, 0.18);
        border-radius: 18px;
        color: #8c3114;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin: 0 auto 16px;
      }
      .eyebrow {
        margin: 0 0 18px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: #8c3114;
        font-size: 13px;
        text-align: center;
      }
      h1 {
        margin: 0 0 22px;
        font-size: 34px;
        text-align: center;
        letter-spacing: 0.06em;
      }
      .certificate-copy {
        text-align: center;
      }
      .certificate-copy p {
        margin: 16px 0;
        font-size: 19px;
        line-height: 1.72;
      }
      .certificate-name {
        margin: 18px 0 12px;
        font-size: 34px;
        font-weight: 700;
      }
      .certificate-course {
        margin: 18px auto;
        max-width: 88%;
        font-size: 28px;
        font-weight: 700;
      }
      .certificate-number {
        margin-top: 18px;
        font-size: 18px;
        text-align: center;
      }
      .certificate-preview-flag {
        margin: 0 auto 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 14px;
        border-radius: 999px;
        border: 1px solid rgba(140, 49, 20, 0.18);
        background: rgba(182, 73, 38, 0.08);
        color: #8c3114;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .signature {
        margin-top: 58px;
        text-align: center;
        font-size: 18px;
      }
      .certificate-side {
        padding-top: 16px;
      }
      .certificate-side h2 {
        margin: 0 0 16px;
        font-size: 22px;
      }
      .section {
        margin-bottom: 16px;
      }
      .section h3 {
        margin: 0 0 6px;
        font-size: 17px;
        color: #8c3114;
      }
      .section ul {
        margin: 0;
        padding-left: 18px;
      }
      .section li {
        margin-bottom: 6px;
        font-size: 14px;
        line-height: 1.46;
      }
      .verify {
        margin-top: 26px;
        padding-top: 12px;
        font-size: 12px;
        color: #6d5848;
      }
      .print {
        margin-top: 28px;
        text-align: center;
      }
      button {
        padding: 12px 18px;
        border-radius: 999px;
        border: none;
        background: #b64926;
        color: white;
        cursor: pointer;
      }
      @media (max-width: 1000px) {
        .certificate-grid {
          grid-template-columns: 1fr;
        }
        .certificate-main {
          padding-top: 70px;
        }
      }
      @media print {
        .print { display: none; }
        body { padding: 0; background: white; }
        .certificate {
          box-shadow: none;
          min-height: auto;
        }
        .certificate-artwork {
          opacity: 0.22;
        }
      }
    </style>
  </head>
  <body>
    <article class="certificate">
      <div class="certificate-grid">
        <section class="certificate-main">
          <div class="certificate-copy">
            ${logoMarkup}
            <p class="eyebrow">${escapeHtml(state.settings.organization)}</p>
            ${model.preview ? `<div style="text-align:center;"><span class="certificate-preview-flag">Vista previa de certificado</span></div>` : ""}
            <h1>${escapeHtml(certificateTitle)}</h1>
            <p>La Asociacion <strong>Isocrona Zero</strong> certifica que</p>
            <div class="certificate-name">${escapeHtml(member.name)}</div>
            <p>con DNI/NIE <strong>${escapeHtml(documentId)}</strong></p>
            <p>ha realizado y superado con <strong>aprovechamiento</strong> el curso</p>
            <div class="certificate-course">${escapeHtml(course.title)}</div>
            <p>
              con una duracion de <strong>${course.hours} horas lectivas</strong>,
              celebrado entre los dias <strong>${escapeHtml(dateRange)}</strong>.
            </p>
            <p>
              Y para que asi conste, se expide el presente certificado a los efectos oportunos.
            </p>
            <p>En <strong>${escapeHtml(city)}</strong>, a <strong>${escapeHtml(issueDate)}</strong>.</p>
            <div class="certificate-number">Certificado n.o ${escapeHtml(registryNumber)}</div>
          </div>
          <div class="signature">
            <strong>Presidente</strong>
          </div>
        </section>
        <aside class="certificate-side">
          <p class="eyebrow">&nbsp;</p>
          <h2>Contenidos formativos</h2>
          ${sections
            .map(
              (section) => `
                <section class="section">
                  <h3>${escapeHtml(section.title)}</h3>
                  <ul>
                    ${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
                  </ul>
                </section>
              `
            )
            .join("")}
          <div class="verify">
            Validacion publica: <strong>${escapeHtml(verifyUrl)}</strong><br />
            Codigo de comprobacion: <strong>${escapeHtml(code)}</strong>
          </div>
        </aside>
      </div>
      <div class="print">
        <button onclick="window.print()">Imprimir o guardar como PDF</button>
      </div>
    </article>
  </body>
</html>`;
}

function buildDiplomaPdf(state, courseId, memberId) {
  const model = buildCertificateModel(state, courseId, memberId);
  if (!model) {
    return null;
  }

  const { course, member, code, registryNumber, certificateTitle, documentId, city, issueDate, dateRange, sections } = model;
  const verifyUrl = buildAbsoluteCampusUrl(`/verify.html?code=${encodeURIComponent(code)}`);
  const lines = [];

  const addWrappedLines = (text, { x, y, size, maxChars, lineHeight = size + 4, align = "left", width = 0 }) => {
    const wrapped = wrapText(text, maxChars);
    wrapped.forEach((line, index) => {
      let lineX = x;
      if (align === "center" && width) {
        lineX = x + Math.max(0, (width - line.length * (size * 0.42)) / 2);
      }
      lines.push({ size, x: lineX, y: y - index * lineHeight, text: line });
    });
    return y - wrapped.length * lineHeight;
  };

  const pageWidth = 842;
  const pageHeight = 595;
  const leftX = 58;
  const leftWidth = 430;
  const rightX = 518;
  const rightWidth = 266;

  addWrappedLines(state.settings.organization || "Asociacion Isocrona Zero", {
    x: leftX,
    y: 550,
    size: 11,
    maxChars: 38,
    align: "center",
    width: leftWidth
  });
  addWrappedLines(certificateTitle, {
    x: leftX,
    y: 520,
    size: 20,
    maxChars: 24,
    align: "center",
    width: leftWidth
  });
  addWrappedLines("La Asociacion Isocrona Zero certifica que", {
    x: leftX,
    y: 480,
    size: 14,
    maxChars: 40,
    align: "center",
    width: leftWidth
  });
  addWrappedLines(member.name, {
    x: leftX,
    y: 448,
    size: 22,
    maxChars: 30,
    align: "center",
    width: leftWidth
  });
  addWrappedLines(`con DNI/NIE ${documentId}`, {
    x: leftX,
    y: 414,
    size: 13,
    maxChars: 38,
    align: "center",
    width: leftWidth
  });
  addWrappedLines("ha realizado y superado con aprovechamiento el curso", {
    x: leftX,
    y: 386,
    size: 14,
    maxChars: 42,
    align: "center",
    width: leftWidth
  });
  const courseBottom = addWrappedLines(course.title, {
    x: leftX,
    y: 352,
    size: 18,
    maxChars: 30,
    lineHeight: 22,
    align: "center",
    width: leftWidth
  });
  addWrappedLines(`con una duracion de ${course.hours} horas lectivas, celebrado entre los dias ${dateRange}.`, {
    x: leftX,
    y: courseBottom - 8,
    size: 12,
    maxChars: 46,
    lineHeight: 16,
    align: "center",
    width: leftWidth
  });
  addWrappedLines("Y para que asi conste, se expide el presente certificado a los efectos oportunos.", {
    x: leftX,
    y: 240,
    size: 12,
    maxChars: 48,
    lineHeight: 16,
    align: "center",
    width: leftWidth
  });
  addWrappedLines(`En ${city}, a ${issueDate}.`, {
    x: leftX,
    y: 198,
    size: 12,
    maxChars: 42,
    align: "center",
    width: leftWidth
  });
  addWrappedLines(`Certificado n.o ${registryNumber}`, {
    x: leftX,
    y: 166,
    size: 11,
    maxChars: 32,
    align: "center",
    width: leftWidth
  });
  lines.push({
    size: 12,
    x: leftX + 135,
    y: 92,
    text: state.settings.diplomaSignerB || "Presidencia"
  });
  lines.push({
    size: 10,
    x: leftX + 120,
    y: 76,
    text: state.settings.diplomaSignerA || "Direccion de Formacion"
  });

  lines.push({ size: 14, x: rightX, y: 542, text: "CONTENIDOS FORMATIVOS" });
  let contentY = 516;
  sections.slice(0, 5).forEach((section) => {
    if (contentY < 118) {
      return;
    }
    lines.push({ size: 10, x: rightX, y: contentY, text: section.title.toUpperCase() });
    contentY -= 16;
    section.items.slice(0, 5).forEach((item) => {
      wrapText(`- ${item}`, 34).forEach((line) => {
        if (contentY < 106) {
          return;
        }
        lines.push({ size: 8.6, x: rightX + 6, y: contentY, text: line });
        contentY -= 12;
      });
    });
    contentY -= 10;
  });
  lines.push({ size: 9, x: rightX, y: 86, text: `Codigo: ${code}` });
  wrapText(verifyUrl, 34).slice(0, 3).forEach((line, index) => {
    lines.push({ size: 8, x: rightX, y: 70 - index * 11, text: line });
  });

  const drawCommands = [
    "0.72 0.29 0.15 RG",
    "1.4 w",
    "26 26 790 543 re S",
    "0.93 0.89 0.82 rg",
    "36 36 470 523 re f",
    "0.98 0.97 0.95 rg",
    "518 36 288 523 re f",
    "0.6 0.45 0.31 RG",
    "1 w",
    "506 50 m 506 548 l S",
    "150 102 m 370 102 l S",
    "518 100 288 0 re S"
  ];

  const textCommands = lines
    .map(
      (line) =>
        `BT /F1 ${line.size} Tf ${line.x} ${line.y} Td (${escapePdfText(line.text)}) Tj ET`
    )
    .join("\n");

  const contentStream = `${drawCommands.join("\n")}\n${textCommands}\n`;
  return buildPdfDocument(contentStream, { pageWidth, pageHeight });
}

function buildDiplomaCode(course, member) {
  return `IZ-${course.startDate.slice(0, 4)}-${course.id.split("-")[1]}-${member.id.split("-")[1]}`;
}

function listDiplomas(state) {
  return state.courses
    .flatMap((course) =>
      (course.diplomaReady || [])
        .map((memberId) => {
          const member = state.members.find((item) => item.id === memberId);
          if (!member) {
            return null;
          }

          return {
            course,
            member,
            code: buildDiplomaCode(course, member)
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
    })
    .map((item, index) => ({
      ...item,
      registryNumber: `IZ-DIP-${String(new Date(item.course.endDate).getFullYear())}-${String(index + 1).padStart(4, "0")}`
    }));
}

function findDiplomaByCode(state, code) {
  return listDiplomas(state).find((item) => item.code === code) || null;
}

function getDiplomaRecord(state, courseId, memberId) {
  return listDiplomas(state).find(
    (item) => item.course.id === courseId && item.member.id === memberId
  ) || null;
}

function buildCoursesCsv(state) {
  const rows = [
    ["id", "titulo", "clase", "tipo", "estado", "inicio", "fin", "horas", "plazas", "inscritos", "espera"]
  ];

  state.courses.forEach((course) => {
    rows.push([
      course.id,
      course.title,
      course.courseClass || "teorico-practico",
      course.type,
      course.status,
      course.startDate,
      course.endDate,
      String(course.hours),
      String(course.capacity),
      String(course.enrolledIds.length),
      String(course.waitingIds.length)
    ]);
  });

  return toCsv(rows);
}

function buildDiplomasCsv(state) {
  const rows = [["registro", "codigo", "alumno", "curso", "tipo", "fin", "horas"]];

  listDiplomas(state).forEach((item) => {
    rows.push([
      item.registryNumber,
      item.code,
      item.member.name,
      item.course.title,
      item.course.type,
      item.course.endDate,
      String(item.course.hours)
    ]);
  });

  return toCsv(rows);
}

function buildOutboxCsv(state) {
  const rows = [["id", "para", "asunto", "fecha", "estado", "transporte", "errores", "cursoId", "miembroId", "socioId"]];

  (state.emailOutbox || []).forEach((item) => {
    rows.push([
      item.id,
      item.to,
      item.subject,
      item.sentAt,
      item.status || "",
      item.transport || "",
      item.deliveryError || "",
      item.courseId || "",
      item.memberId || "",
      item.associateId || ""
    ]);
  });

  return toCsv(rows);
}

function buildAssociateApplicationsCsv(state) {
  const rows = [[
    "id",
    "token_publico",
    "url_seguimiento",
    "fecha",
    "estado",
    "nombre",
    "apellidos",
    "dni",
    "telefono",
    "email",
    "servicio",
    "justificante1",
    "justificante2",
    "email_formulario",
    "acuse_email",
    "acuse_enviado",
    "subsanacion_mensaje",
    "subsanacion_solicitada",
    "subsanacion_por",
    "subsanacion_email",
    "subsanacion_enviada",
    "respuesta_solicitante",
    "respuesta_recibida",
    "respuesta_documentos",
    "acuse_respuesta",
    "acuse_respuesta_enviado",
    "aviso_respuesta_admin",
    "aviso_respuesta_admin_enviado",
    "reabierta",
    "reabierta_por",
    "nota_reapertura",
    "resolucion_email",
    "resolucion_enviada",
    "observaciones"
  ]];

  (state.associateApplications || []).forEach((item) => {
    rows.push([
      item.id,
      item.publicAccessToken || "",
      item.publicAccessToken ? buildAssociateApplicationPublicLink(item) : "",
      item.submittedAt,
      item.status,
      item.firstName,
      item.lastName,
      item.dni,
      item.phone,
      item.email,
      item.service,
      item.paymentProof,
      item.paymentProof2,
      item.submitterEmail,
      item.receiptEmailStatus || "",
      item.receiptEmailSentAt || "",
      item.infoRequestMessage || "",
      item.infoRequestedAt || "",
      item.infoRequestedBy || "",
      item.infoRequestEmailStatus || "",
      item.infoRequestEmailSentAt || "",
      item.applicantReplyNote || "",
      item.applicantReplyAt || "",
      (item.applicantReplyDocuments || []).join(" | "),
      item.applicantReplyReceiptStatus || "",
      item.applicantReplyReceiptSentAt || "",
      item.applicantReplyNotificationStatus || "",
      item.applicantReplyNotificationSentAt || "",
      item.reopenedAt || "",
      item.reopenedBy || "",
      item.reopenNote || "",
      item.decisionEmailStatus || "",
      item.decisionEmailSentAt || "",
      item.notes
    ]);
  });

  return toCsv(rows);
}

function buildAssociatesCsv(state) {
  const rows = [[
    "id",
    "numero_socio",
    "estado",
    "nombre",
    "apellidos",
    "dni",
    "telefono",
    "email",
    "servicio",
    "alta",
    "ultima_cuota",
    "anual",
    "2024",
    "2025",
    "2026",
    "2027",
    "campus",
    "bienvenida",
    "bienvenida_enviada",
    "ultimo_recordatorio_cuota",
    "observaciones"
  ]];

  (state.associates || []).forEach((item) => {
    rows.push([
      item.id,
      item.associateNumber,
      item.status,
      item.firstName,
      item.lastName,
      item.dni,
      item.phone,
      item.email,
      item.service,
      item.joinedAt,
      item.lastQuotaMonth,
      item.annualAmount,
      item.yearlyFees?.["2024"] || 0,
      item.yearlyFees?.["2025"] || 0,
      item.yearlyFees?.["2026"] || 0,
      item.yearlyFees?.["2027"] || 0,
      item.campusAccessStatus || "",
      item.welcomeEmailStatus || "",
      item.welcomeEmailSentAt || "",
      item.lastQuotaReminderAt || "",
      item.observations || ""
    ]);
  });

  return toCsv(rows);
}

function buildLegacyAssociateReviewCsv(state) {
  const rows = [[
    "id",
    "numero_socio",
    "estado",
    "nombre",
    "apellidos",
    "email",
    "telefono",
    "dni",
    "servicio",
    "campus",
    "bienvenida",
    "legacy",
    "pendientes",
    "observaciones"
  ]];

  (state.associates || [])
    .filter(
      (item) =>
        item.status === "Revisar documentacion" &&
        /Importado desde Excel legacy/i.test(String(item.observations || ""))
    )
    .forEach((item) => {
      const pendingTextMatch = String(item.observations || "").match(/Pendientes:\s*([^|]+)/i);
      rows.push([
        item.id,
        item.associateNumber,
        item.status,
        item.firstName,
        item.lastName,
        item.email,
        item.phone,
        item.dni,
        item.service,
        item.campusAccessStatus || "",
        item.welcomeEmailStatus || "",
        "si",
        pendingTextMatch?.[1]?.trim() || "",
        item.observations || ""
      ]);
    });

  return toCsv(rows);
}

function buildAssociatePaymentsCsv(state) {
  const rows = [[
    "payment_id",
    "associate_id",
    "numero_socio",
    "nombre",
    "fecha",
    "anio",
    "importe",
    "metodo",
    "nota",
    "registrado_en",
    "registrado_por"
  ]];

  (state.associates || []).forEach((associate) => {
    (associate.payments || []).forEach((payment) => {
      rows.push([
        payment.id,
        associate.id,
        associate.associateNumber,
        getAssociateFullName(associate),
        payment.date,
        payment.year,
        payment.amount,
        payment.method,
        payment.note || "",
        payment.createdAt || "",
        payment.createdBy || ""
      ]);
    });
  });

  return toCsv(rows);
}

function buildAssociatePaymentSubmissionsCsv(state) {
  const rows = [[
    "submission_id",
    "associate_id",
    "member_id",
    "submitted_at",
    "year",
    "amount",
    "method",
    "note",
    "proof_file",
    "status",
    "reviewed_at",
    "reviewed_by",
    "review_note",
    "notification_status",
    "notification_sent_at"
  ]];

  (state.associatePaymentSubmissions || []).forEach((item) => {
    rows.push([
      item.id,
      item.associateId,
      item.memberId,
      item.submittedAt,
      item.year,
      item.amount,
      item.method,
      item.note || "",
      item.proofFile || "",
      item.status,
      item.reviewedAt || "",
      item.reviewedBy || "",
      item.reviewNote || "",
      item.notificationStatus || "",
      item.notificationSentAt || ""
    ]);
  });

  return toCsv(rows);
}

function buildAssociateProfileRequestsCsv(state) {
  const rows = [[
    "request_id",
    "associate_id",
    "member_id",
    "submitted_at",
    "status",
    "first_name",
    "last_name",
    "phone",
    "email",
    "service",
    "note",
    "reviewed_at",
    "reviewed_by",
    "review_note",
    "notification_status",
    "notification_sent_at"
  ]];

  (state.associateProfileRequests || []).forEach((item) => {
    rows.push([
      item.id,
      item.associateId,
      item.memberId,
      item.submittedAt,
      item.status,
      item.firstName,
      item.lastName,
      item.phone,
      item.email,
      item.service,
      item.note || "",
      item.reviewedAt || "",
      item.reviewedBy || "",
      item.reviewNote || "",
      item.notificationStatus || "",
      item.notificationSentAt || ""
    ]);
  });

  return toCsv(rows);
}

function buildActivityCsv(state) {
  const rows = [["id", "fecha", "actor", "tipo", "mensaje"]];

  (state.activityLog || []).forEach((item) => {
    rows.push([
      item.id,
      item.at,
      item.actor,
      item.type,
      item.message
    ]);
  });

  return toCsv(rows);
}

function buildAutomationInboxCsv(state) {
  const rows = [["id", "fecha", "tipo", "titulo", "detalle", "curso", "persona", "email", "clave"]];

  (state.automationInbox || []).forEach((item) => {
    rows.push([
      item.id,
      item.createdAt,
      item.type,
      item.title,
      item.detail || "",
      item.courseId || "",
      item.memberId || "",
      item.emailId || "",
      item.key || ""
    ]);
  });

  return toCsv(rows);
}

function buildAgentLogCsv(state) {
  const rows = [["id", "fecha", "actor", "accion", "tipo", "destino", "resultado", "detalle"]];

  (state.agentLog || []).forEach((item) => {
    rows.push([
      item.id,
      item.at,
      item.actor,
      item.action,
      item.itemType,
      item.target,
      item.outcome,
      item.detail
    ]);
  });

  return toCsv(rows);
}

function buildAgentContext(state) {
  const pendingDiplomas = (state.courses || []).reduce(
    (sum, course) =>
      sum +
      (course.diplomaReady || []).filter((memberId) => !hasSuccessfulSmtpDelivery(state, course.id, memberId))
        .length,
    0
  );

  return {
    generatedAt: new Date().toISOString(),
    organization: state.settings?.organization || "Isocrona Zero",
    policies: state.settings?.agent || {},
    summary: {
      courses: (state.courses || []).length,
      members: (state.members || []).length,
      associates: (state.associates || []).length,
      associateApplications: (state.associateApplications || []).filter((item) => isAssociateApplicationPending(item)).length,
      associatePaymentSubmissions: (state.associatePaymentSubmissions || []).filter((item) => item.status === "Pendiente de revision").length,
      associateProfileRequests: (state.associateProfileRequests || []).filter((item) => item.status === "Pendiente de revision").length,
      automationItems: (state.automationInbox || []).length,
      pendingDiplomas,
      renewalsDue: (state.members || []).reduce((sum, member) => sum + Number(member.renewalsDue || 0), 0)
    },
    automationMeta: state.automationMeta || {},
    nextTask: pickNextAgentItem(state),
    inbox: (state.automationInbox || []).slice(0, 20),
    agentLog: (state.agentLog || []).slice(0, 20),
    suggestedPrompt: buildAgentPrompt(state)
  };
}

function buildAgentPrompt(state) {
  const meta = state.automationMeta || {};
  const inboxLines = (state.automationInbox || [])
    .slice(0, 10)
    .map((item, index) => {
      return `${index + 1}. [${item.type}] ${item.title} - ${item.detail || "Sin detalle"}`;
    })
    .join("\n");

  return [
    `Organizacion: ${state.settings?.organization || "Isocrona Zero"}`,
    `Ultima ejecucion automatica: ${meta.lastRunAt || "sin registro"} (${meta.lastReason || "sin motivo"})`,
    "Politica del agente:",
    state.settings?.agent?.notes ||
      "No modificar evaluaciones ni asistencia sin validacion humana. Resolver tareas seguras de la bandeja.",
    "Tareas abiertas:",
    inboxLines || "Sin tareas abiertas en la bandeja."
  ].join("\n");
}

function createAssociateApplication(state, payload) {
  const firstName = String(payload.firstName || "").trim();
  const lastName = String(payload.lastName || "").trim();
  const dni = String(payload.dni || "").trim().toUpperCase();
  const phone = String(payload.phone || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();
  const service = String(payload.service || "").trim();
  const paymentProof =
    storeAssociateAttachment(payload.paymentProofFile, "payment-proof") ||
    String(payload.paymentProof || "").trim();
  const paymentProof2 =
    storeAssociateAttachment(payload.paymentProof2File, "payment-proof-2") ||
    String(payload.paymentProof2 || "").trim();
  const submitterEmail = String(payload.submitterEmail || email).trim().toLowerCase();
  const privacyConsent = Boolean(payload.privacyConsent);
  const photoConsent = Boolean(payload.photoConsent);

  if (!firstName || !lastName || !phone || !email || !service) {
    throw new Error("Completa nombre, apellidos, telefono, email y servicio");
  }
  if (!privacyConsent) {
    throw new Error("Debes aceptar la politica de privacidad para enviar la solicitud");
  }

  const existingAssociate = (state.associates || []).find(
    (item) => item.email.toLowerCase() === email || (dni && item.dni === dni)
  );
  if (existingAssociate) {
    throw new Error("Ya existe un socio registrado con ese email o DNI");
  }

  const existingApplication = (state.associateApplications || []).find(
    (item) =>
      item.status !== "Rechazada" &&
      (item.email.toLowerCase() === email || (dni && item.dni === dni))
  );
  if (existingApplication) {
    throw new Error("Ya existe una solicitud abierta con ese email o DNI");
  }

  const application = {
    id: `associate-application-${Date.now()}`,
    publicAccessToken: `associate-app-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    submittedAt: new Date().toISOString(),
    source: "web",
    status: "Pendiente de revision",
    firstName,
    lastName,
    dni,
    phone,
    email,
    service,
    paymentProof,
    paymentProof2,
    submitterEmail,
    privacyConsent,
    photoConsent,
    consentAt: new Date().toISOString(),
    notes: "Solicitud recibida desde formulario web",
    receiptEmailStatus: "pending",
    receiptEmailSentAt: "",
    infoRequestMessage: "",
    infoRequestedAt: "",
    infoRequestedBy: "",
    infoRequestEmailStatus: "pending",
    infoRequestEmailSentAt: "",
    applicantReplyNote: "",
    applicantReplyAt: "",
    applicantReplyDocuments: [],
    applicantReplyReceiptStatus: "pending",
    applicantReplyReceiptSentAt: "",
    applicantReplyNotificationStatus: "pending",
    applicantReplyNotificationSentAt: "",
    reopenedAt: "",
    reopenedBy: "",
    reopenNote: "",
    decisionEmailStatus: "pending",
    decisionEmailSentAt: ""
  };

  state.associateApplications = state.associateApplications || [];
  state.associateApplications.unshift(application);
  state.selectedAssociateApplicationId = application.id;
  return application;
}

function createAssociatePaymentSubmission(state, account, payload, resolvedAssociate = null) {
  const associate = resolvedAssociate || resolveAssociateForAuthenticatedAccount(state, account);
  if (!associate) {
    throw new Error("No se ha encontrado tu ficha de socio");
  }

  const year = String(payload.year || new Date().getFullYear()).trim();
  const amount = Number(payload.amount || 0);
  const method = String(payload.method || "").trim();
  const note = String(payload.note || "").trim();
  const proofFile =
    storeAssociateAttachment(payload.proofFile, "quota-proof") ||
    String(payload.proofFileName || "").trim();

  if (!year || !amount || !method || !proofFile) {
    throw new Error("Completa anio, importe, metodo y adjunta el justificante");
  }

  const submission = {
    id: `associate-payment-submission-${Date.now()}`,
    associateId: associate.id,
    memberId: account.memberId || "",
    submittedAt: new Date().toISOString(),
    year,
    amount,
    method,
    note,
    proofFile,
    status: "Pendiente de revision",
    reviewedAt: "",
    reviewedBy: "",
    reviewNote: "",
    notificationStatus: "pending",
    notificationSentAt: ""
  };

  state.associatePaymentSubmissions = state.associatePaymentSubmissions || [];
  state.associatePaymentSubmissions.unshift(submission);
  state.selectedAssociatePaymentSubmissionId = submission.id;
  return submission;
}

function approveAssociatePaymentSubmission(state, submissionId, reviewerName) {
  const submission = (state.associatePaymentSubmissions || []).find((item) => item.id === submissionId);
  if (!submission) {
    throw new Error("Justificante de cuota no encontrado");
  }
  if (submission.status === "Aprobado") {
    throw new Error("Este justificante ya esta aprobado");
  }
  if (submission.status === "Rechazado") {
    throw new Error("Este justificante ya esta rechazado y no puede aprobarse despues");
  }

  const associate = (state.associates || []).find((item) => item.id === submission.associateId);
  if (!associate) {
    throw new Error("Socio no encontrado para este justificante");
  }

  associate.payments = associate.payments || [];
  associate.payments.unshift({
    id: `associate-payment-${Date.now()}`,
    date: submission.submittedAt.slice(0, 10),
    year: submission.year,
    amount: Number(submission.amount || 0),
    method: submission.method,
    note: submission.note || "Pago registrado desde justificante subido por socio",
    createdAt: new Date().toISOString(),
    createdBy: reviewerName || "Administracion"
  });
  recalculateAssociateFeeTotals(associate);

  submission.status = "Aprobado";
  submission.reviewedAt = new Date().toISOString();
  submission.reviewedBy = reviewerName || "Administracion";
  submission.reviewNote = "Pago validado y asentado en la ficha del socio";

  appendActivity(
    state,
    "system",
    "Socios",
    `Justificante de cuota aprobado para el socio #${associate.associateNumber} (${associate.email})`
  );

  return {
    submissionId: submission.id,
    associateId: associate.id,
    associateName: getAssociateFullName(associate),
    submission,
    associate
  };
}

function rejectAssociatePaymentSubmission(state, submissionId, reviewerName) {
  const submission = (state.associatePaymentSubmissions || []).find((item) => item.id === submissionId);
  if (!submission) {
    throw new Error("Justificante de cuota no encontrado");
  }
  if (submission.status === "Aprobado") {
    throw new Error("Este justificante ya esta aprobado y no puede rechazarse despues");
  }
  if (submission.status === "Rechazado") {
    throw new Error("Este justificante ya esta rechazado");
  }

  const associate = (state.associates || []).find((item) => item.id === submission.associateId);
  submission.status = "Rechazado";
  submission.reviewedAt = new Date().toISOString();
  submission.reviewedBy = reviewerName || "Administracion";
  submission.reviewNote = "Requiere revision manual o nuevo justificante";

  appendActivity(
    state,
    "system",
    "Socios",
    `Justificante de cuota rechazado para ${associate ? getAssociateFullName(associate) : submission.associateId}`
  );

  return {
    submissionId: submission.id,
    associateId: submission.associateId,
    associateName: associate ? getAssociateFullName(associate) : submission.associateId,
    submission,
    associate
  };
}

function createAssociateProfileRequest(state, account, payload, resolvedAssociate = null) {
  const associate = resolvedAssociate || resolveAssociateForAuthenticatedAccount(state, account);
  if (!associate) {
    throw new Error("No se ha encontrado tu ficha de socio");
  }

  const linkedMember = associate.linkedMemberId
    ? (state.members || []).find((item) => item.id === associate.linkedMemberId)
    : (state.members || []).find((item) => item.associateId === associate.id || item.id === account.memberId);
  const linkedAccount = associate.linkedAccountId
    ? (state.accounts || []).find((item) => item.id === associate.linkedAccountId)
    : (state.accounts || []).find((item) => item.associateId === associate.id || item.id === account.id);
  const resolvedName = String(associate.name || linkedMember?.name || linkedAccount?.name || account.name || "").trim();
  const resolvedNameParts = resolvedName.split(/\s+/).filter(Boolean);
  const resolvedFirstName = resolvedNameParts.slice(0, -1).join(" ") || resolvedNameParts[0] || "";
  const resolvedLastName = resolvedNameParts.length > 1 ? resolvedNameParts.slice(-1).join(" ") : "";

  const existingPendingRequest = (state.associateProfileRequests || []).find(
    (item) => item.associateId === associate.id && item.status === "Pendiente de revision"
  );
  if (existingPendingRequest) {
    throw new Error("Ya tienes una solicitud de actualizacion pendiente de revision");
  }

  const proposedData = sanitizeAssociateProfileProposal(
    {
      associate,
      linkedMember,
      linkedAccount,
      account,
      resolvedFirstName,
      resolvedLastName
    },
    payload
  );
  const { firstName, lastName, dni, phone, email, service, note } = proposedData;
  const previousFirstName = String(associate.firstName || resolvedFirstName || "").trim();
  const previousLastName = String(associate.lastName || resolvedLastName || "").trim();
  const previousDni = normalizeDniValue(associate.dni || linkedMember?.dni || "");
  const previousPhone = String(associate.phone || linkedMember?.phone || "").trim();
  const previousEmail = String(associate.email || linkedMember?.email || linkedAccount?.email || account.email || "")
    .trim()
    .toLowerCase();
  const previousService = String(associate.service || "").trim();

  if (!firstName || !lastName || !email) {
    throw new Error("Completa nombre, apellidos y email");
  }

  const hasRealChange =
    firstName !== previousFirstName ||
    lastName !== previousLastName ||
    dni !== previousDni ||
    phone !== previousPhone ||
    email !== previousEmail ||
    service !== previousService;

  if (!note && !hasRealChange) {
    throw new Error("Tu ficha ya tiene esos datos. Cambia algun campo o anade una nota para enviar la solicitud");
  }

  const request = {
    id: `associate-profile-request-${Date.now()}`,
    socio_id: associate.id,
    associateId: associate.id,
    memberId: account.memberId || associate.linkedMemberId || "",
    datos_propuestos_json: JSON.stringify(proposedData),
    proposedData,
    estado: "pendiente",
    comentario_admin: "",
    fecha_solicitud: new Date().toISOString(),
    fecha_resolucion: "",
    submittedAt: new Date().toISOString(),
    status: "Pendiente de revision",
    firstName,
    lastName,
    dni,
    phone,
    email,
    service,
    note,
    reviewedAt: "",
    reviewedBy: "",
    reviewNote: "",
    notificationStatus: "pending",
    notificationSentAt: ""
  };

  state.associateProfileRequests = state.associateProfileRequests || [];
  state.associateProfileRequests.unshift(request);
  state.selectedAssociateProfileRequestId = request.id;
  return request;
}

function getAssociateSelfEditWindow(associate) {
  const openedAt = associate?.joinedAt ? new Date(associate.joinedAt) : null;
  if (!openedAt || Number.isNaN(openedAt.getTime())) {
    return {
      active: false,
      openedAt: "",
      endsAt: "",
      daysRemaining: 0
    };
  }

  const endsAt = new Date(openedAt.getTime() + associateSelfEditWindowDays * 24 * 60 * 60 * 1000);
  const remainingMs = endsAt.getTime() - Date.now();
  return {
    active: remainingMs > 0,
    openedAt: openedAt.toISOString(),
    endsAt: endsAt.toISOString(),
    daysRemaining: Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)))
  };
}

function canAssociateSelfEditDirectly(associate) {
  return getAssociateSelfEditWindow(associate).active;
}

function sanitizeAssociateProfileProposal(context, payload) {
  const {
    associate,
    linkedMember,
    linkedAccount,
    account,
    resolvedFirstName = "",
    resolvedLastName = ""
  } = context || {};
  return {
    firstName: String(payload.firstName || associate?.firstName || resolvedFirstName || "").trim(),
    lastName: String(payload.lastName || associate?.lastName || resolvedLastName || "").trim(),
    dni: normalizeDniValue(payload.dni || associate?.dni || linkedMember?.dni || ""),
    phone: String(payload.phone || associate?.phone || linkedMember?.phone || "").trim(),
    email: String(payload.email || associate?.email || linkedMember?.email || linkedAccount?.email || account?.email || "")
      .trim()
      .toLowerCase(),
    service: String(payload.service || associate?.service || "").trim(),
    note: String(payload.note || "").trim()
  };
}

function getAssociateProfileRequestProposedData(request = {}) {
  const fromJson = (() => {
    const raw = String(request.datos_propuestos_json || "").trim();
    if (!raw) {
      return {};
    }
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  })();
  const proposedData = request.proposedData && typeof request.proposedData === "object"
    ? request.proposedData
    : fromJson;
  return {
    firstName: String(proposedData.firstName || request.firstName || "").trim(),
    lastName: String(proposedData.lastName || request.lastName || "").trim(),
    dni: normalizeDniValue(proposedData.dni || request.dni || ""),
    phone: String(proposedData.phone || request.phone || "").trim(),
    email: String(proposedData.email || request.email || "").trim().toLowerCase(),
    service: String(proposedData.service || request.service || "").trim(),
    note: String(proposedData.note || request.note || "").trim()
  };
}

function applyAssociateProfileUpdate(state, associate, account, payload, options = {}) {
  const linkedMember = associate.linkedMemberId
    ? (state.members || []).find((item) => item.id === associate.linkedMemberId)
    : (state.members || []).find((item) => item.associateId === associate.id || item.id === account?.memberId);
  const linkedAccount = associate.linkedAccountId
    ? (state.accounts || []).find((item) => item.id === associate.linkedAccountId)
    : (state.accounts || []).find((item) => item.associateId === associate.id || item.id === account?.id);
  const resolvedName = String(associate.name || linkedMember?.name || linkedAccount?.name || account?.name || "").trim();
  const resolvedNameParts = resolvedName.split(/\s+/).filter(Boolean);
  const resolvedFirstName = resolvedNameParts.slice(0, -1).join(" ") || resolvedNameParts[0] || "";
  const resolvedLastName = resolvedNameParts.length > 1 ? resolvedNameParts.slice(-1).join(" ") : "";

  const proposedData = sanitizeAssociateProfileProposal(
    {
      associate,
      linkedMember,
      linkedAccount,
      account,
      resolvedFirstName,
      resolvedLastName
    },
    payload
  );
  const { firstName, lastName, dni, phone, email, service, note } = proposedData;
  const previousFirstName = String(associate.firstName || resolvedFirstName || "").trim();
  const previousLastName = String(associate.lastName || resolvedLastName || "").trim();
  const previousDni = normalizeDniValue(associate.dni || linkedMember?.dni || "");
  const previousPhone = String(associate.phone || linkedMember?.phone || "").trim();
  const previousEmail = String(associate.email || linkedMember?.email || linkedAccount?.email || account?.email || "")
    .trim()
    .toLowerCase();
  const previousService = String(associate.service || "").trim();

  if (!firstName || !lastName || !email) {
    throw new Error("Completa nombre, apellidos y email");
  }

  const hasRealChange =
    firstName !== previousFirstName ||
    lastName !== previousLastName ||
    dni !== previousDni ||
    phone !== previousPhone ||
    email !== previousEmail ||
    service !== previousService;

  if (!note && !hasRealChange) {
    throw new Error("Tu ficha ya tiene esos datos. Cambia algun campo o anade una nota para guardar");
  }

  ensureUniqueAssociateIdentityEmail(state, associate, email);

  associate.firstName = firstName;
  associate.lastName = lastName;
  associate.dni = dni;
  associate.phone = phone;
  associate.email = email;
  associate.service = service;
  refreshAssociateLegacyObservationSummary(associate);
  const statusTransition = syncAssociateStatusAfterDataCompletion(associate);
  syncAssociateLinkedIdentity(state, associate);

  if (options.activityMessage) {
    appendActivity(
      state,
      options.actorType || "member",
      options.actorName || account?.name || "Socios",
      options.activityMessage
    );
  }

  return {
    associate,
    hasRealChange,
    note,
    statusTransition
  };
}

function ensureUniqueAssociateIdentityEmail(state, associate, nextEmail) {
  const normalizedEmail = String(nextEmail || "").trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("El email no puede quedar vacio");
  }

  const duplicateAssociate = (state.associates || []).find(
    (item) => item.id !== associate.id && String(item.email || "").toLowerCase() === normalizedEmail
  );
  if (duplicateAssociate) {
    throw new Error("Ya existe otro socio con ese email");
  }

  const duplicateAccount = (state.accounts || []).find(
    (item) => item.id !== associate.linkedAccountId && String(item.email || "").toLowerCase() === normalizedEmail
  );
  if (duplicateAccount) {
    throw new Error("Ya existe otra cuenta del campus con ese email");
  }
}

function syncAssociateLinkedIdentity(state, associate) {
  const displayName = getAssociateFullName(associate).trim();
  const normalizedEmail = String(associate.email || "").trim().toLowerCase();
  const normalizedDni = String(associate.dni || "").trim().toUpperCase();
  associate.name = displayName || associate.name || "";

  const member = associate.linkedMemberId
    ? (state.members || []).find((item) => item.id === associate.linkedMemberId)
    : null;
  if (member) {
    member.name = displayName || member.name;
    member.email = normalizedEmail || member.email;
    member.associateId = associate.id;
    member.dni = normalizedDni || member.dni || "";
    member.phone = String(associate.phone || member.phone || "").trim();
    member.service = String(associate.service || member.service || "").trim();
  }

  const account = associate.linkedAccountId
    ? (state.accounts || []).find((item) => item.id === associate.linkedAccountId)
    : null;
  if (account) {
    account.name = displayName || account.name;
    account.email = normalizedEmail || account.email;
    account.associateId = associate.id;
    if (member) {
      account.memberId = member.id;
    }
  }
}

function approveAssociateProfileRequest(state, requestId, reviewerName, adminComment = "") {
  const request = (state.associateProfileRequests || []).find((item) => item.id === requestId);
  if (!request) {
    throw new Error("Solicitud de actualizacion no encontrada");
  }
  if (request.status === "Aprobado") {
    throw new Error("Esta solicitud ya esta aprobada");
  }
  if (request.status === "Rechazado") {
    throw new Error("Esta solicitud ya esta rechazada y no puede aprobarse despues");
  }

  const associate = (state.associates || []).find((item) => item.id === request.associateId);
  if (!associate) {
    throw new Error("Socio no encontrado para esta actualizacion");
  }

  const proposedData = getAssociateProfileRequestProposedData(request);
  const applyResult = applyAssociateProfileUpdate(state, associate, null, proposedData);

  const resolutionNote = String(adminComment || "").trim();
  const finalComment = resolutionNote || "Solicitud validada y aplicada sobre la ficha del socio";
  request.estado = "aprobada";
  request.status = "Aprobado";
  request.comentario_admin = finalComment;
  request.fecha_resolucion = new Date().toISOString();
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = reviewerName || "Administracion";
  request.reviewNote = finalComment;

  appendActivity(
    state,
    "system",
    "Socios",
    `Actualizacion de ficha aprobada para el socio #${associate.associateNumber} (${associate.email})`
  );

  return {
    requestId: request.id,
    associateId: associate.id,
    associateName: getAssociateFullName(associate),
    request,
    associate,
    statusTransition: applyResult.statusTransition
  };
}

function rejectAssociateProfileRequest(state, requestId, reviewerName, adminComment = "") {
  const request = (state.associateProfileRequests || []).find((item) => item.id === requestId);
  if (!request) {
    throw new Error("Solicitud de actualizacion no encontrada");
  }

  if (request.status === "Aprobado") {
    throw new Error("Esta solicitud ya esta aprobada y no puede rechazarse despues");
  }
  if (request.status === "Rechazado") {
    throw new Error("Esta solicitud ya esta rechazada");
  }

  const associate = (state.associates || []).find((item) => item.id === request.associateId);
  const resolutionNote = String(adminComment || "").trim();
  const finalComment = resolutionNote || "Solicitud revisada. Mantener datos actuales hasta nueva revision";
  request.estado = "rechazada";
  request.status = "Rechazado";
  request.comentario_admin = finalComment;
  request.fecha_resolucion = new Date().toISOString();
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = reviewerName || "Administracion";
  request.reviewNote = finalComment;

  appendActivity(
    state,
    "system",
    "Socios",
    `Actualizacion de ficha rechazada para ${associate ? getAssociateFullName(associate) : request.associateId}`
  );

  return {
    requestId: request.id,
    associateId: request.associateId,
    associateName: associate ? getAssociateFullName(associate) : request.associateId,
    request,
    associate
  };
}

function storeAssociateAttachment(file, label) {
  if (!file || typeof file !== "object") {
    return "";
  }

  const base64 = String(file.contentBase64 || "");
  if (!base64) {
    return "";
  }

  const originalName = sanitizeFilename(file.name || `${label}.bin`);
  const mimeType = String(file.type || "application/octet-stream");
  const extension = path.extname(originalName) || guessExtensionFromMimeType(mimeType);
  const storedName = sanitizeFilename(
    `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${extension || ""}`
  );

  fs.writeFileSync(path.join(associateUploadsDir, storedName), Buffer.from(base64, "base64"));
  return storedName;
}

function guessExtensionFromMimeType(mimeType) {
  const extensionMap = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "text/plain": ".txt",
    "text/csv": ".csv",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.oasis.opendocument.presentation": ".odp"
  };

  return extensionMap[mimeType] || "";
}

function inferAttachmentMimeType(fileName, declaredType) {
  const normalizedType = String(declaredType || "").trim().toLowerCase();
  if (normalizedType && normalizedType !== "application/octet-stream") {
    return declaredType;
  }

  const extension = path.extname(String(fileName || "")).toLowerCase();
  return mimeTypes[extension] || declaredType || "application/octet-stream";
}

function approveAssociateApplication(state, applicationId) {
  const application = (state.associateApplications || []).find((item) => item.id === applicationId);
  if (!application) {
    throw new Error("Solicitud no encontrada");
  }
  if (application.status === "Aprobada") {
    throw new Error("La solicitud ya esta aprobada");
  }
  if (application.status === "Rechazada") {
    throw new Error("La solicitud ya esta rechazada");
  }

  const reviewIssues = getAssociateApplicationApprovalBlockers(state, application);
  if (reviewIssues.length) {
    throw new Error(`La solicitud no se puede aprobar: ${reviewIssues.join(", ")}`);
  }

  const nextNumber = getNextAssociateNumber(state);
  const annualBase = Number(state.settings?.associates?.defaultAnnualAmount || 50);
  const associate = {
    id: `associate-${Date.now()}`,
    associateNumber: nextNumber,
    applicationId: application.id,
    status: "Activa",
    firstName: application.firstName,
    lastName: application.lastName,
    dni: application.dni,
    phone: application.phone,
    email: application.email,
    service: application.service,
    joinedAt: new Date().toISOString(),
    linkedMemberId: "",
    linkedAccountId: "",
    campusAccessStatus: "pending",
    temporaryPassword: "",
    lastQuotaMonth: "",
    annualAmount: annualBase,
    observations: "Alta generada desde solicitud web",
    yearlyFees: {
      "2024": 0,
      "2025": 0,
      "2026": annualBase,
      "2027": 0
    },
    payments: []
  };

  state.associates = state.associates || [];
  state.associates.unshift(associate);
  provisionAssociateCampusAccess(state, associate);
  state.selectedAssociateId = associate.id;
  application.status = "Aprobada";
  application.notes = [
    application.notes,
    `Aprobada y convertida en socio #${nextNumber}`,
    associate.linkedMemberId ? "Alta interna y acceso campus generados" : ""
  ]
    .filter(Boolean)
    .join(" | ");
  state.settings.associates.nextAssociateNumber = nextNumber + 1;

  appendActivity(
    state,
    "system",
    "Socios",
    `Solicitud aprobada para ${application.firstName} ${application.lastName} y alta del socio #${nextNumber}`.trim()
  );

  return associate;
}

function requestAssociateApplicationInfo(state, applicationId, message, reviewerName) {
  const application = (state.associateApplications || []).find((item) => item.id === applicationId);
  if (!application) {
    throw new Error("Solicitud no encontrada");
  }
  if (["Aprobada", "Rechazada"].includes(application.status)) {
    throw new Error("La solicitud ya esta resuelta");
  }

  const cleanMessage = String(message || "").trim();
  if (!cleanMessage) {
    throw new Error("Escribe la documentacion o aclaracion solicitada");
  }

  application.status = "Pendiente de documentacion";
  application.infoRequestMessage = cleanMessage;
  application.infoRequestedAt = new Date().toISOString();
  application.infoRequestedBy = reviewerName || "Administracion";
  application.infoRequestEmailStatus = "pending";
  application.infoRequestEmailSentAt = "";
  application.applicantReplyNote = "";
  application.applicantReplyAt = "";
  application.applicantReplyDocuments = [];
  application.notes = [
    application.notes,
    `Subsanacion solicitada: ${cleanMessage}`
  ]
    .filter(Boolean)
    .join(" | ");

  appendActivity(
    state,
    "system",
    "Socios",
    `Solicitud de documentacion adicional para ${application.firstName} ${application.lastName}`.trim()
  );

  return application;
}

function reopenAssociateApplicationReview(state, applicationId, reviewerName, note) {
  const application = (state.associateApplications || []).find((item) => item.id === applicationId);
  if (!application) {
    throw new Error("Solicitud no encontrada");
  }
  if (application.status !== "Pendiente de documentacion") {
    throw new Error("Solo puedes reabrir solicitudes pendientes de documentacion");
  }

  application.status = "Pendiente de revision";
  application.reopenedAt = new Date().toISOString();
  application.reopenedBy = reviewerName || "Administracion";
  application.reopenNote = String(note || "").trim();
  application.notes = [
    application.notes,
    "Documentacion recibida y revision reabierta",
    application.reopenNote ? `Nota de reapertura: ${application.reopenNote}` : ""
  ]
    .filter(Boolean)
    .join(" | ");

  appendActivity(
    state,
    "system",
    "Socios",
    `Solicitud reabierta para revision de ${application.firstName} ${application.lastName}`.trim()
  );

  return application;
}

function submitAssociateApplicationReply(state, publicAccessToken, payload) {
  const application = findAssociateApplicationByToken(state, publicAccessToken);
  if (!application) {
    throw new Error("Solicitud no encontrada");
  }
  if (application.status !== "Pendiente de documentacion") {
    throw new Error("Esta solicitud no necesita documentacion adicional ahora mismo");
  }

  const replyNote = String(payload.note || "").trim();
  const replyDocuments = [
    storeAssociateAttachment(payload.replyDocumentFile, "associate-application-reply"),
    storeAssociateAttachment(payload.replyDocumentFile2, "associate-application-reply-2")
  ].filter(Boolean);

  if (!replyNote && !replyDocuments.length) {
    throw new Error("Adjunta al menos un documento o explica la aclaracion aportada");
  }

  application.applicantReplyNote = replyNote;
  application.applicantReplyAt = new Date().toISOString();
  application.applicantReplyDocuments = [
    ...new Set([...(application.applicantReplyDocuments || []), ...replyDocuments])
  ];
  application.applicantReplyReceiptStatus = "pending";
  application.applicantReplyReceiptSentAt = "";
  application.applicantReplyNotificationStatus = "pending";
  application.applicantReplyNotificationSentAt = "";
  application.status = "Pendiente de revision";
  application.reopenedAt = new Date().toISOString();
  application.reopenedBy = "Solicitante";
  application.reopenNote = "La persona solicitante ha aportado documentacion desde el portal publico.";
  application.notes = [
    application.notes,
    "La persona solicitante ha respondido a la subsanacion",
    replyNote ? `Aclaracion recibida: ${replyNote}` : "",
    replyDocuments.length ? `Documentos nuevos: ${replyDocuments.join(", ")}` : ""
  ]
    .filter(Boolean)
    .join(" | ");

  appendActivity(
    state,
    "system",
    "Socios",
    `La solicitud de ${application.firstName} ${application.lastName} ha vuelto a revision tras aportar documentacion`.trim()
  );

  return application;
}

function rejectAssociateApplication(state, applicationId) {
  const application = (state.associateApplications || []).find((item) => item.id === applicationId);
  if (!application) {
    throw new Error("Solicitud no encontrada");
  }
  if (application.status === "Aprobada") {
    throw new Error("La solicitud ya esta aprobada");
  }
  if (application.status === "Rechazada") {
    throw new Error("La solicitud ya esta rechazada");
  }

  application.status = "Rechazada";
  application.notes = [application.notes, "Solicitud rechazada desde administracion"]
    .filter(Boolean)
    .join(" | ");

  appendActivity(
    state,
    "system",
    "Socios",
    `Solicitud rechazada para ${application.firstName} ${application.lastName}`.trim()
  );

  return application;
}

function getNextAssociateNumber(state) {
  const configured = Number(state.settings?.associates?.nextAssociateNumber || 1);
  const currentMax = Math.max(0, ...((state.associates || []).map((item) => Number(item.associateNumber || 0))));
  return Math.max(configured, currentMax + 1);
}

function getAssociateFullName(associate) {
  return [associate.firstName, associate.lastName].filter(Boolean).join(" ");
}

function getAssociateApplicantName(application) {
  return [application?.firstName, application?.lastName].filter(Boolean).join(" ");
}

function isAssociateApplicationPending(application) {
  return ["Pendiente de revision", "Pendiente de documentacion"].includes(String(application?.status || ""));
}

function findAssociateApplicationByToken(state, publicAccessToken) {
  return (state.associateApplications || []).find(
    (item) => item.publicAccessToken === publicAccessToken
  );
}

function buildAssociateApplicationPublicLink(application) {
  return buildAbsoluteCampusUrl(`/application.html?token=${encodeURIComponent(application.publicAccessToken)}`);
}

function buildPublicAssociateApplicationPayload(application) {
  return {
    id: application.id,
    publicAccessToken: application.publicAccessToken,
    submittedAt: application.submittedAt,
    status: application.status,
    firstName: application.firstName,
    lastName: application.lastName,
    email: application.email,
    phone: application.phone,
    service: application.service,
    paymentProof: application.paymentProof || "",
    paymentProof2: application.paymentProof2 || "",
    infoRequestMessage: application.infoRequestMessage || "",
    infoRequestedAt: application.infoRequestedAt || "",
    infoRequestedBy: application.infoRequestedBy || "",
    applicantReplyNote: application.applicantReplyNote || "",
    applicantReplyAt: application.applicantReplyAt || "",
    applicantReplyDocuments: application.applicantReplyDocuments || [],
    applicantReplyReceiptStatus: application.applicantReplyReceiptStatus || "pending",
    applicantReplyReceiptSentAt: application.applicantReplyReceiptSentAt || "",
    receiptEmailStatus: application.receiptEmailStatus || "pending",
    infoRequestEmailStatus: application.infoRequestEmailStatus || "pending",
    decisionEmailStatus: application.decisionEmailStatus || "pending"
  };
}

function getAssociateApplicationReplyRecipients(state) {
  return [...new Map(
    (state.accounts || [])
      .filter((account) => account.role === "admin" && account.email)
      .map((account) => [
        String(account.email || "").toLowerCase(),
        {
          email: String(account.email || "").trim().toLowerCase(),
          name: account.name || "Administracion",
          memberId: account.memberId || ""
        }
      ])
  ).values()];
}

function provisionAssociateCampusAccess(state, associate, options = {}) {
  const force = Boolean(options.force);
  const requestedAccountRole = options.accountRole
    ? normalizeCampusAccountRole(options.accountRole)
    : "";
  if (!force && !state.settings?.associates?.autoCreateCampusAccess) {
    associate.campusAccessStatus = "pending";
    return associate;
  }

  state.members = state.members || [];
  state.accounts = state.accounts || [];

  let member = state.members.find(
    (item) => item.email.toLowerCase() === associate.email.toLowerCase() || (associate.dni && item.email && item.associateId === associate.id)
  );

  if (!member) {
    member = {
      id: `member-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: getAssociateFullName(associate),
      role: state.settings?.associates?.defaultMemberRole || "Socio",
      email: associate.email,
      certifications: [],
      renewalsDue: 0,
      associateId: associate.id,
      source: "associate"
    };
    state.members.unshift(member);
  } else {
    member.name = getAssociateFullName(associate);
    member.email = associate.email;
    member.role = member.role || state.settings?.associates?.defaultMemberRole || "Socio";
    member.associateId = associate.id;
    member.source = member.source || "associate";
  }

  let account = state.accounts.find((item) => item.memberId === member.id || item.email.toLowerCase() === associate.email.toLowerCase());
  if (!account) {
    const tempPassword = buildTemporaryCampusPassword(associate);
    account = {
      id: `account-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: member.name,
      email: associate.email,
      password: "",
      passwordHash: "",
      role: requestedAccountRole || "member",
      memberId: member.id,
      associateId: associate.id,
      mustChangePassword: true
    };
    setLegacyAccountPassword(account, tempPassword);
    state.accounts.push(account);
    associate.temporaryPassword = tempPassword;
  } else {
    account.name = member.name;
    account.email = associate.email;
    account.memberId = member.id;
    account.associateId = associate.id;
    if (requestedAccountRole) {
      account.role = requestedAccountRole;
    }
    if (!account.passwordHash && !account.password) {
      const tempPassword = buildTemporaryCampusPassword(associate);
      setLegacyAccountPassword(account, tempPassword);
      account.mustChangePassword = true;
      associate.temporaryPassword = tempPassword;
    }
  }

  associate.linkedMemberId = member.id;
  associate.linkedAccountId = account.id;
  associate.campusAccessStatus = "active";
  if (!associate.temporaryPassword && account.mustChangePassword) {
    associate.temporaryPassword = "";
  }

  appendActivity(
    state,
    "system",
    "Socios",
    `Se ha generado acceso al campus para el socio #${associate.associateNumber} (${associate.email})`
  );

  return associate;
}

function buildTemporaryCampusPassword(associate, options = {}) {
  const nameChunk = String(associate.firstName || "socio")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 4) || "socio";
  const base = `IZ-${nameChunk}-${associate.associateNumber || Date.now().toString().slice(-4)}`;
  return options.unique ? `${base}-${Math.random().toString(36).slice(2, 6)}` : base;
}

function resetAssociateCampusPassword(state, associate) {
  if (!associate?.email) {
    throw new Error("El socio necesita un email antes de restablecer su acceso");
  }

  const account = (state.accounts || []).find(
    (item) =>
      item.id === associate.linkedAccountId ||
      item.associateId === associate.id ||
      item.email?.toLowerCase() === associate.email.toLowerCase()
  );

  if (!account) {
    throw new Error("Primero crea el acceso al campus de este socio");
  }

  const tempPassword = buildTemporaryCampusPassword(associate, { unique: true });
  setLegacyAccountPassword(account, tempPassword);
  account.mustChangePassword = true;
  account.email = associate.email;
  account.name = getAssociateFullName(associate) || account.name;
  account.associateId = associate.id;
  associate.linkedAccountId = account.id;
  associate.temporaryPassword = tempPassword;
  associate.campusAccessStatus = "active";
  associate.welcomeEmailStatus = "pending";
  associate.welcomeEmailSentAt = "";

  return account;
}

async function maybeSendAssociateWelcomeEmail(state, associate, options = {}) {
  const config = state.settings?.associates || {};
  const force = Boolean(options.force);
  const strict = Boolean(options.strict);
  const actor = options.actor || "Socios";

  if (!associate) {
    if (strict) {
      throw new Error("No se ha indicado el socio para la bienvenida");
    }
    return { status: "skipped", reason: "missing_associate" };
  }

  if (!associate.email || !associate.linkedAccountId) {
    associate.welcomeEmailStatus = "pending";
    if (strict) {
      throw new Error("El socio no tiene todavia un acceso de campus completo");
    }
    return { status: "pending", reason: "missing_access" };
  }

  if (!force && config.autoSendWelcomeEmail === false) {
    associate.welcomeEmailStatus = associate.welcomeEmailStatus || "pending";
    return { status: "skipped", reason: "auto_disabled" };
  }

  if (!force && associate.welcomeEmailStatus === "sent" && associate.welcomeEmailSentAt) {
    return { status: "sent", reason: "already_sent" };
  }

  if (!isSmtpConfigured(state)) {
    associate.welcomeEmailStatus = "pending";
    if (strict) {
      throw new Error("Configura el SMTP antes de enviar la bienvenida del campus");
    }
    return { status: "pending", reason: "smtp_missing" };
  }

  const email = createAssociateWelcomeEmailRecord(state, associate);

  try {
    await deliverEmailRecord(state, email);
    associate.welcomeEmailStatus = "sent";
    associate.welcomeEmailSentAt = new Date().toISOString();
    appendActivity(
      state,
      "system",
      actor,
      `Correo de bienvenida del campus enviado al socio #${associate.associateNumber} (${associate.email})`
    );
    return { status: "sent", emailId: email.id };
  } catch (error) {
    associate.welcomeEmailStatus = "failed";
    appendActivity(
      state,
      "system",
      actor,
      `Fallo al enviar la bienvenida del campus al socio #${associate.associateNumber}: ${error.message || "Error SMTP"}`
    );
    if (strict) {
      throw error;
    }
    return {
      status: "failed",
      emailId: email.id,
      error: error.message || "Error SMTP"
    };
  }
}

function importMembersCsv(state, csv) {
  const rows = parseDelimitedText(csv);
  if (!rows.length) {
    throw new Error("No se han encontrado filas en el CSV de personas");
  }

  const result = { created: 0, updated: 0, skipped: 0 };

  rows.forEach((row, index) => {
    const name = readImportValue(row, ["name", "nombre"]);
    const role = readImportValue(row, ["role", "rol"]);
    const email = readImportValue(row, ["email", "correo", "mail"]).toLowerCase();
    const certificationsRaw = readImportValue(row, ["certifications", "certificaciones"]);
    const renewalsRaw = readImportValue(row, ["renewalsdue", "renovaciones", "renewals"]);
    const accessPassword = readImportValue(row, ["accesspassword", "password", "contrasena"]);
    const accessRole = readImportValue(row, ["accessrole", "rolacceso", "access"]) || "member";

    if (!name || !role || !email) {
      result.skipped += 1;
      return;
    }

    const certifications = certificationsRaw
      .split(/[|,]/)
      .map((item) => item.trim())
      .filter(Boolean);
    const renewalsDue = Number(renewalsRaw || 0);
    const existingMember = (state.members || []).find((member) => member.email.toLowerCase() === email);

    if (existingMember) {
      existingMember.name = name;
      existingMember.role = role;
      existingMember.email = email;
      existingMember.certifications = certifications;
      existingMember.renewalsDue = Number.isFinite(renewalsDue) ? renewalsDue : 0;

      const existingAccount = (state.accounts || []).find((account) => account.memberId === existingMember.id);
      if (accessPassword || existingAccount) {
        if (existingAccount) {
          existingAccount.name = name;
          existingAccount.email = email;
          existingAccount.role = accessRole;
          if (accessPassword) {
            setLegacyAccountPassword(existingAccount, accessPassword);
          }
        } else {
          const account = {
            id: `account-${Date.now()}-${index}`,
            name,
            email,
            password: "",
            passwordHash: "",
            role: accessRole,
            memberId: existingMember.id
          };
          setLegacyAccountPassword(account, accessPassword || "cambiar123");
          state.accounts.push(account);
        }
      }

      result.updated += 1;
      return;
    }

    const memberId = `member-${Date.now()}-${index}`;
    state.members.unshift({
      id: memberId,
      name,
      role,
      email,
      certifications,
      renewalsDue: Number.isFinite(renewalsDue) ? renewalsDue : 0
    });

    if (accessPassword) {
      const account = {
        id: `account-${Date.now()}-${index}`,
        name,
        email,
        password: "",
        passwordHash: "",
        role: accessRole,
        memberId
      };
      setLegacyAccountPassword(account, accessPassword);
      state.accounts.push(account);
    }

    result.created += 1;
  });

  return result;
}

function importCoursesCsv(state, csv) {
  const rows = parseDelimitedText(csv);
  if (!rows.length) {
    throw new Error("No se han encontrado filas en el CSV de cursos");
  }

  const result = { created: 0, updated: 0, skipped: 0 };

  rows.forEach((row, index) => {
    const title = readImportValue(row, ["title", "titulo", "nombre"]);
    const courseClass = normalizeCourseClass(readImportValue(row, ["courseclass", "clase", "classtype"]));
    const type = readImportValue(row, ["type", "tipo"]);
    const status = readImportValue(row, ["status", "estado"]) || "Planificacion";
    const summary =
      readImportValue(row, ["summary", "resumen"]) ||
      "Curso importado por CSV. Revisa el detalle operativo y las reglas de aptitud.";
    const startDate = normalizeImportDate(readImportValue(row, ["startdate", "fechainicio", "inicio"]));
    const endDate = normalizeImportDate(readImportValue(row, ["enddate", "fechafin", "fin"]));
    const hours = Number(readImportValue(row, ["hours", "horas"]));
    const capacity = Number(readImportValue(row, ["capacity", "plazas", "cupo"]));
    const diplomaTemplate = readImportValue(row, ["diplomatemplate", "diploma", "tipodiploma"]) || "Aprovechamiento";

    if (!title || !courseClass || !type || !startDate || !endDate || !hours || !capacity) {
      result.skipped += 1;
      return;
    }

    const existingCourse = (state.courses || []).find(
      (course) => course.title.toLowerCase() === title.toLowerCase() && course.startDate === startDate
    );

    if (existingCourse) {
      existingCourse.title = title;
      existingCourse.courseClass = courseClass;
      existingCourse.type = type;
      existingCourse.status = status;
      existingCourse.summary = summary;
      existingCourse.startDate = startDate;
      existingCourse.endDate = endDate;
      existingCourse.hours = hours;
      existingCourse.capacity = capacity;
      existingCourse.diplomaTemplate = diplomaTemplate;
      result.updated += 1;
      return;
    }

    state.courses.unshift({
      id: `course-${Date.now()}-${index}`,
      title,
      courseClass,
      type,
      status,
      summary,
      startDate,
      endDate,
      hours,
      capacity,
      enrolledIds: [],
      waitingIds: [],
      attendance: {},
      evaluations: {},
      diplomaTemplate,
      diplomaReady: [],
      mailsSent: []
    });
    result.created += 1;
  });

  return result;
}

function parseDelimitedText(input) {
  const lines = String(input || "")
    .replace(/\r/g, "")
    .split("\n")
    .filter((line) => line.trim());

  if (!lines.length) {
    return [];
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseDelimitedLine(lines[0], delimiter).map((value) => normalizeImportHeader(value));

  return lines.slice(1).map((line) => {
    const values = parseDelimitedLine(line, delimiter);
    return headers.reduce((accumulator, header, index) => {
      accumulator[header] = fixMojibakeText(String(values[index] || "").trim());
      return accumulator;
    }, {});
  });
}

function detectDelimiter(headerLine) {
  const candidates = [";", ",", "\t"];
  let best = ";";
  let bestScore = -1;

  candidates.forEach((candidate) => {
    const score = headerLine.split(candidate).length;
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  });

  return best;
}

function parseDelimitedLine(line, delimiter) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === delimiter && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
}

function normalizeImportHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function readImportValue(row, aliases) {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null) {
      return String(row[alias]).trim();
    }
  }

  return "";
}

function normalizeImportDate(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) {
    return "";
  }

  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3];
  return `${year}-${month}-${day}`;
}

function getAssociateYearFeeGap(associate, year) {
  const paid = Number(associate.yearlyFees?.[String(year)] || 0);
  return Math.max(0, Number(associate.annualAmount || 0) - paid);
}

function recalculateAssociateFeeTotals(associate) {
  if (!associate) {
    return;
  }

  const manualYearlyFees = {
    "2024": Number(associate.manualYearlyFees?.["2024"] || 0),
    "2025": Number(associate.manualYearlyFees?.["2025"] || 0),
    "2026": Number(associate.manualYearlyFees?.["2026"] || 0),
    "2027": Number(associate.manualYearlyFees?.["2027"] || 0)
  };

  const paymentTotals = (associate.payments || []).reduce((acc, payment) => {
    const year = String(payment.year || new Date(payment.date || Date.now()).getFullYear());
    acc[year] = Number(acc[year] || 0) + Number(payment.amount || 0);
    return acc;
  }, {});

  associate.yearlyFees = {
    "2024": manualYearlyFees["2024"] + Number(paymentTotals["2024"] || 0),
    "2025": manualYearlyFees["2025"] + Number(paymentTotals["2025"] || 0),
    "2026": manualYearlyFees["2026"] + Number(paymentTotals["2026"] || 0),
    "2027": manualYearlyFees["2027"] + Number(paymentTotals["2027"] || 0)
  };

  const latestPayment = [...(associate.payments || [])].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  if (latestPayment) {
    associate.lastQuotaMonth = new Date(latestPayment.date).toLocaleDateString("es-ES", {
      month: "short",
      year: "numeric"
    });
  }

  if (!["Baja", "Revisar documentacion", "Solicitud recibida", "En revision"].includes(associate.status)) {
    const currentYear = String(new Date().getFullYear());
    associate.status = getAssociateYearFeeGap(associate, currentYear) > 0 ? "Pendiente cuota" : "Activa";
  }
}

async function runAutomationEngine(state, options = {}) {
  const detectOnly = Boolean(options.detectOnly);
  const summary = {
    updatedDiplomas: 0,
    promotedWaitlist: 0,
    advancedCourses: 0,
    closedCourses: 0,
    sentDiplomas: 0,
    sentFeeReminders: 0,
    failedFeeReminders: 0,
    sentFeedbackReminders: 0,
    failedFeedbackReminders: 0,
    failedDiplomas: 0,
    inboxItems: 0
  };
  const smtpReady = isSmtpConfigured(state);
  const today = new Date().toISOString().slice(0, 10);
  let missingSmtpNotice = false;

  state.automationInbox = [];

  for (const course of state.courses || []) {
    const enrolledIds = course.enrolledIds || [];
    const waitingIds = course.waitingIds || [];
    const attendance = course.attendance || {};
    const evaluations = course.evaluations || {};
    const previousReady = new Set(course.diplomaReady || []);

    if (!detectOnly && state.settings?.automation?.autoPromoteWaitlist) {
      while (waitingIds.length && enrolledIds.length < course.capacity) {
        const promotedId = waitingIds.shift();
        enrolledIds.push(promotedId);
        summary.promotedWaitlist += 1;

        const member = state.members.find((item) => item.id === promotedId);
        appendActivity(
          state,
          "system",
          "Motor de automatizacion",
          `Promocion automatica desde espera: ${member ? member.name : promotedId} en ${course.title}`
        );
      }
    }

    const closedEvaluations = enrolledIds.filter((memberId) =>
      ["Apto", "No apto"].includes(evaluations[memberId])
    ).length;

    if (!detectOnly && state.settings?.automation?.autoAdvanceCourseStatus) {
      const enrollmentOpensAtTimestamp = getCourseEnrollmentOpensAtTimestamp(course);
      if (
        course.status === "Planificacion" &&
        (
          enrollmentOpensAtTimestamp !== null
            ? enrollmentOpensAtTimestamp <= Date.now()
            : course.startDate && course.startDate <= today
        )
      ) {
        course.status = "Inscripcion abierta";
        summary.advancedCourses += 1;
        appendActivity(
          state,
          "system",
          "Motor de automatizacion",
          `Cambio automatico de estado a Inscripcion abierta en ${course.title}`
        );
      }

      if (course.status === "Inscripcion abierta" && course.endDate && course.endDate < today && enrolledIds.length) {
        course.status = "Cierre pendiente";
        summary.advancedCourses += 1;
        appendActivity(
          state,
          "system",
          "Motor de automatizacion",
          `Cambio automatico de estado a Cierre pendiente en ${course.title}`
        );
      }
    }

    if (!detectOnly && state.settings?.automation?.autoGenerateDiplomas) {
      if (isCourseDiplomaWindowOpen(course, today)) {
        const computedReady = enrolledIds.filter((memberId) => {
          const member = (state.members || []).find((item) => item.id === memberId);
          const feedbackReady =
            !course.feedbackEnabled ||
            !course.feedbackRequiredForDiploma ||
            Boolean((course.feedbackResponses || []).find((response) => response.memberId === memberId));
          return (
            Number(attendance[memberId] || 0) >= 75 &&
            evaluations[memberId] === "Apto" &&
            isMemberContentReadyForDiplomaServer(course, memberId) &&
            feedbackReady &&
            Boolean(member) &&
            hasMemberDocumentId(state, member)
          );
        });

        if (!sameIdSet(previousReady, new Set(computedReady))) {
          course.diplomaReady = computedReady;
          summary.updatedDiplomas += 1;
        }
      }
    }

    const feedbackReminderCandidates = getCourseFeedbackReminderCandidates(state, course, today);

    feedbackReminderCandidates.forEach(({ member }) => {
      const canAutoSendReminder =
        !detectOnly &&
        state.settings?.automation?.autoSendFeedbackReminders !== false && smtpReady;
      if (canAutoSendReminder) {
        return;
      }

      pushAutomationItem(state, {
        type: "course_feedback_reminder",
        title: `Valoracion final pendiente: ${member.name} en ${course.title}`,
        detail: "El curso ya esta listo para cierre salvo la valoracion final del alumno.",
        courseId: course.id,
        memberId: member.id,
        key: `course_feedback_reminder:${course.id}:${member.id}`
      });
    });

    if (!detectOnly && state.settings?.automation?.autoSendFeedbackReminders !== false && smtpReady) {
      for (const { member } of feedbackReminderCandidates) {
        try {
          const result = await maybeSendCourseFeedbackReminder(state, course, member, {
            actor: "Motor de automatizacion"
          });
          if (result.status === "sent") {
            summary.sentFeedbackReminders += 1;
          }
        } catch (error) {
          summary.failedFeedbackReminders += 1;
        }
      }
    }

    if (!detectOnly && state.settings?.automation?.autoAdvanceCourseStatus &&
      course.status === "Cierre pendiente" &&
      enrolledIds.length &&
      closedEvaluations === enrolledIds.length) {
      course.status = "Cerrado";
      summary.closedCourses += 1;
      appendActivity(
        state,
        "system",
        "Motor de automatizacion",
        `Cierre automatico del curso ${course.title}`
      );
    }

    if (course.status === "Cierre pendiente" && enrolledIds.length && closedEvaluations === enrolledIds.length) {
      pushAutomationItem(state, {
        type: "course_ready",
        title: `Curso listo para cierre: ${course.title}`,
        detail: `Todas las evaluaciones estan cerradas y el curso puede revisarse para cierre administrativo.`,
        courseId: course.id,
        key: `course_ready:${course.id}`
      });
    } else {
      const closureNotice = getCourseClosureNoticeContext(state, course, today);
      if (closureNotice) {
        pushAutomationItem(state, {
          type: "course_closure_notice",
          title: `Curso revisable para cierre: ${course.title}`,
          detail: buildCourseClosureNoticeDetail(closureNotice),
          courseId: course.id,
          key: `course_closure_notice:${course.id}`
        });
      }
    }

    let pendingDeliveries = isCourseDiplomaWindowOpen(course, today)
      ? (course.diplomaReady || []).filter((memberId) => !hasSuccessfulSmtpDelivery(state, course.id, memberId))
      : [];

    if (!detectOnly && state.settings?.automation?.autoSendDiplomas && pendingDeliveries.length) {
      if (smtpReady) {
        for (const memberId of pendingDeliveries) {
          const member = state.members.find((item) => item.id === memberId);
          if (!member || !member.email) {
            continue;
          }

          const email = createEmailRecord(state, course, member);
          try {
            await deliverEmailRecord(state, email);
            if (email.status === "sent") {
              summary.sentDiplomas += 1;
              appendActivity(
                state,
                "system",
                "Motor de automatizacion",
                `Envio automatico de diploma a ${member.name} en ${course.title}`
              );
            }
          } catch (error) {
            summary.failedDiplomas += 1;
            appendActivity(
              state,
              "system",
              "Motor de automatizacion",
              `Fallo en envio automatico a ${member.name}: ${error.message || "Error SMTP"}`
            );
          }
        }
      } else if (!missingSmtpNotice) {
        pushAutomationItem(state, {
          type: "smtp_missing",
          title: "Falta configurar el correo saliente",
          detail: "Hay diplomas listos para envio automatico, pero el SMTP no esta configurado.",
          courseId: course.id,
          key: "smtp_missing"
        });
        missingSmtpNotice = true;
      }

      pendingDeliveries = (course.diplomaReady || []).filter(
        (memberId) => !hasSuccessfulSmtpDelivery(state, course.id, memberId)
      );
    }

    if (pendingDeliveries.length) {
      pushAutomationItem(state, {
        type: "pending_diplomas",
        title: `Diplomas pendientes de entrega en ${course.title}`,
        detail: `${pendingDeliveries.length} diploma(s) listos para enviar o revisar.`,
        courseId: course.id,
        key: `pending_diplomas:${course.id}`
      });
    }
  }

  if (state.settings?.automation?.autoDetectRenewals) {
    (state.members || [])
      .filter((member) => Number(member.renewalsDue || 0) > 0)
      .forEach((member) => {
        const lastReminderAt = member.lastRenewalReminderAt
          ? new Date(member.lastRenewalReminderAt).getTime()
          : 0;
        const reminderIsRecent =
          lastReminderAt && Date.now() - lastReminderAt < 14 * 24 * 60 * 60 * 1000;

        if (reminderIsRecent) {
          return;
        }

        pushAutomationItem(state, {
          type: "renewal",
          title: `Renovaciones pendientes de ${member.name}`,
          detail: `Tiene ${member.renewalsDue} renovacion(es) o certificacion(es) pendiente(s).`,
          memberId: member.id,
          key: `renewal:${member.id}`
        });
      });
  }

  (state.associateApplications || [])
    .filter((application) => application.status === "Pendiente de revision")
    .forEach((application) => {
      pushAutomationItem(state, {
        type: "associate_application",
        title: `Solicitud de socio pendiente: ${application.firstName} ${application.lastName}`.trim(),
        detail: `Revisar alta, justificante y datos de ${application.email}.`,
        memberId: application.id,
        key: `associate_application:${application.id}`
      });
    });

  (state.associateApplications || [])
    .filter(
      (application) =>
        application.status === "Pendiente de revision" &&
        application.receiptEmailStatus !== "sent"
    )
    .forEach((application) => {
      pushAutomationItem(state, {
        type: "associate_application_receipt",
        title: `Acuse pendiente de solicitud: ${application.firstName} ${application.lastName}`.trim(),
        detail: `La persona solicitante debe recibir confirmacion de recepcion en ${application.email}.`,
        memberId: application.id,
        key: `associate_application_receipt:${application.id}`
      });
    });

  (state.associateApplications || [])
    .filter(
      (application) =>
        application.status === "Pendiente de documentacion" &&
        application.infoRequestEmailStatus !== "sent"
    )
    .forEach((application) => {
      pushAutomationItem(state, {
        type: "associate_application_info_request",
        title: `Subsanacion pendiente de aviso: ${application.firstName} ${application.lastName}`.trim(),
        detail: `Falta enviar la peticion de documentacion o aclaracion a ${application.email}.`,
        memberId: application.id,
        key: `associate_application_info_request:${application.id}`
      });
    });

  (state.associateApplications || [])
    .filter(
      (application) =>
        application.applicantReplyAt &&
        application.applicantReplyReceiptStatus !== "sent"
    )
    .forEach((application) => {
      pushAutomationItem(state, {
        type: "associate_application_reply_receipt",
        title: `Acuse pendiente de respuesta: ${application.firstName} ${application.lastName}`.trim(),
        detail: `La persona solicitante ya ha respondido y debe recibir confirmacion de recepcion.`,
        memberId: application.id,
        key: `associate_application_reply_receipt:${application.id}:${application.applicantReplyAt}`
      });
    });

  (state.associateApplications || [])
    .filter(
      (application) =>
        application.applicantReplyAt &&
        application.applicantReplyNotificationStatus !== "sent"
    )
    .forEach((application) => {
      pushAutomationItem(state, {
        type: "associate_application_reply_notification",
        title: `Aviso interno pendiente: ${application.firstName} ${application.lastName}`.trim(),
        detail: `La solicitud ya tiene respuesta de la persona solicitante y debe notificarse a administracion.`,
        memberId: application.id,
        key: `associate_application_reply_notification:${application.id}:${application.applicantReplyAt}`
      });
    });

  (state.associateApplications || [])
    .filter(
      (application) =>
        ["Aprobada", "Rechazada"].includes(application.status) &&
        application.decisionEmailStatus !== "sent"
    )
    .forEach((application) => {
      pushAutomationItem(state, {
        type: "associate_application_decision",
        title: `Resolucion pendiente de solicitud: ${application.firstName} ${application.lastName}`.trim(),
        detail: `La persona solicitante debe recibir la resolucion ${application.status.toLowerCase()}.`,
        memberId: application.id,
        key: `associate_application_decision:${application.id}`
      });
    });

  (state.associatePaymentSubmissions || [])
    .filter((submission) => submission.status === "Pendiente de revision")
    .forEach((submission) => {
      const associate = (state.associates || []).find((item) => item.id === submission.associateId);
      pushAutomationItem(state, {
        type: "associate_payment_submission",
        title: `Justificante de cuota pendiente: ${associate ? getAssociateFullName(associate) : submission.associateId}`,
        detail: `${submission.amount} EUR | ${submission.method} | ${submission.year}. Revisar justificante subido por el socio.`,
        memberId: submission.associateId,
        key: `associate_payment_submission:${submission.id}`
      });
    });

  (state.associatePaymentSubmissions || [])
    .filter(
      (submission) =>
        ["Aprobado", "Rechazado"].includes(submission.status) &&
        submission.notificationStatus !== "sent"
    )
    .forEach((submission) => {
      const associate = (state.associates || []).find((item) => item.id === submission.associateId);
      pushAutomationItem(state, {
        type: "associate_payment_notification",
        title: `Aviso pendiente de justificante: ${associate ? getAssociateFullName(associate) : submission.associateId}`,
        detail: `El socio debe recibir la resolucion del justificante ${submission.status.toLowerCase()}.`,
        memberId: submission.associateId,
        key: `associate_payment_notification:${submission.id}`
      });
    });

  (state.associateProfileRequests || [])
    .filter((request) => request.status === "Pendiente de revision")
    .forEach((request) => {
      const associate = (state.associates || []).find((item) => item.id === request.associateId);
      pushAutomationItem(state, {
        type: "associate_profile_update",
        title: `Actualizacion de ficha pendiente: ${associate ? getAssociateFullName(associate) : request.associateId}`,
        detail: `Revisar cambios propuestos de telefono, email o servicio del socio.`,
        memberId: request.associateId,
        key: `associate_profile_update:${request.id}`
      });
    });

  (state.associateProfileRequests || [])
    .filter(
      (request) =>
        ["Aprobado", "Rechazado"].includes(request.status) &&
        request.notificationStatus !== "sent"
    )
    .forEach((request) => {
      const associate = (state.associates || []).find((item) => item.id === request.associateId);
      pushAutomationItem(state, {
        type: "associate_profile_notification",
        title: `Aviso pendiente de actualizacion: ${associate ? getAssociateFullName(associate) : request.associateId}`,
        detail: `El socio debe recibir la resolucion de su solicitud de actualizacion de ficha.`,
        memberId: request.associateId,
        key: `associate_profile_notification:${request.id}`
      });
    });

  const currentYear = String(new Date().getFullYear());
  (state.associates || [])
    .filter((associate) => {
      const gap = getAssociateYearFeeGap(associate, currentYear);
      if (gap <= 0) {
        return false;
      }

      const lastReminderAt = associate.lastQuotaReminderAt
        ? new Date(associate.lastQuotaReminderAt).getTime()
        : 0;
      const reminderIsRecent =
        lastReminderAt && Date.now() - lastReminderAt < 14 * 24 * 60 * 60 * 1000;

      return !reminderIsRecent;
    })
    .forEach((associate) => {
      const canSendReminder =
        !detectOnly &&
        state.settings?.automation?.autoSendFeeReminders !== false &&
        smtpReady &&
        String(associate.email || "").trim() &&
        isLikelyEmail(String(associate.email || "").trim());

      if (canSendReminder) {
        return;
      }

      pushAutomationItem(state, {
        type: "associate_fee",
        title: `Cuota pendiente del socio #${associate.associateNumber}`,
        detail: `${getAssociateFullName(associate)} tiene pendiente ${getAssociateYearFeeGap(associate, currentYear)} EUR del ${currentYear}.`,
        memberId: associate.id,
        key: `associate_fee:${associate.id}:${currentYear}`
      });
    });

  if (!detectOnly && state.settings?.automation?.autoSendFeeReminders !== false && smtpReady) {
    for (const associate of state.associates || []) {
      const pendingAmount = getAssociateYearFeeGap(associate, currentYear);
      const reminderIsRecent = associate.lastQuotaReminderAt
        ? Date.now() - new Date(associate.lastQuotaReminderAt).getTime() < 14 * 24 * 60 * 60 * 1000
        : false;
      if (
        pendingAmount <= 0 ||
        reminderIsRecent ||
        !String(associate.email || "").trim() ||
        !isLikelyEmail(String(associate.email || "").trim())
      ) {
        continue;
      }

      try {
        const result = await maybeSendAssociateFeeReminder(state, associate, {
          actor: "Motor de automatizacion"
        });
        if (result.status === "sent") {
          summary.sentFeeReminders += 1;
        }
      } catch (error) {
        summary.failedFeeReminders += 1;
      }
    }
  }

  (state.associates || [])
    .filter(
      (associate) =>
        associate.status === "Activa" &&
        associate.linkedAccountId &&
        associate.welcomeEmailStatus !== "sent"
    )
    .forEach((associate) => {
      pushAutomationItem(state, {
        type: "associate_welcome",
        title: `Bienvenida pendiente para socio #${associate.associateNumber}`,
        detail: `${getAssociateFullName(associate)} necesita recibir las credenciales del campus.`,
        memberId: associate.id,
        key: `associate_welcome:${associate.id}`
      });
    });

  (state.associates || [])
    .filter(
      (associate) =>
        associate.status === "Revisar documentacion" &&
        /Importado desde Excel legacy/i.test(String(associate.observations || "")) &&
        !associate.linkedAccountId &&
        associate.email
    )
    .forEach((associate) => {
      pushAutomationItem(state, {
        type: "associate_legacy_access",
        title: `Acceso campus pendiente para socio legacy #${associate.associateNumber}`,
        detail: `${getAssociateFullName(associate)} ya esta importado y puede recibir cuenta de campus.`,
        memberId: associate.id,
        key: `associate_legacy_access:${associate.id}`
      });
    });

  (state.associates || [])
    .filter(
      (associate) =>
        associate.status === "Revisar documentacion" &&
        /Importado desde Excel legacy/i.test(String(associate.observations || "")) &&
        String(associate.firstName || "").trim() &&
        String(associate.lastName || "").trim() &&
        String(associate.email || "").trim() &&
        isLikelyEmail(String(associate.email || "").trim()) &&
        String(associate.service || "").trim()
    )
    .forEach((associate) => {
      pushAutomationItem(state, {
        type: "associate_legacy_review",
        title: `Revision legacy lista para cierre: socio #${associate.associateNumber}`,
        detail: `${getAssociateFullName(associate)} ya tiene datos minimos para cerrar la revision documental.`,
        memberId: associate.id,
        key: `associate_legacy_review:${associate.id}`
      });
    });

  if (state.settings?.automation?.autoDetectFailedEmails) {
    (state.emailOutbox || [])
      .filter((mail) => mail.status === "failed")
      .slice(0, 10)
      .forEach((mail) => {
        pushAutomationItem(state, {
          type: "failed_email",
          title: `Correo fallido a ${mail.to}`,
          detail: mail.deliveryError || "El envio SMTP no se completo correctamente.",
          courseId: mail.courseId,
          memberId: mail.memberId,
          emailId: mail.id,
          key: `failed_email:${mail.id}`
        });
      });
  }

  summary.inboxItems = state.automationInbox.length;
  return summary;
}

async function materializeAutomationInboxSafely(state) {
  const summary = await runAutomationEngine(state, { detectOnly: true });
  return {
    ...summary,
    updatedDiplomas: 0,
    promotedWaitlist: 0,
    advancedCourses: 0,
    closedCourses: 0,
    sentDiplomas: 0,
    sentFeeReminders: 0,
    failedFeeReminders: 0,
    sentFeedbackReminders: 0,
    failedFeedbackReminders: 0,
    failedDiplomas: 0
  };
}

function sameIdSet(a, b) {
  if (a.size !== b.size) {
    return false;
  }
  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }
  return true;
}

function isCourseDiplomaWindowOpen(course, today = new Date().toISOString().slice(0, 10)) {
  if (!course) {
    return false;
  }

  if (["Cierre pendiente", "Cerrado"].includes(String(course.status || ""))) {
    return true;
  }

  return Boolean(course.endDate && course.endDate < today);
}

function getCourseFeedbackReminderLastSentAt(course, memberId) {
  if (!course || !memberId || !course.feedbackReminderLog || typeof course.feedbackReminderLog !== "object") {
    return 0;
  }

  const sentAt = course.feedbackReminderLog[memberId];
  return sentAt ? new Date(sentAt).getTime() : 0;
}

function isCourseFeedbackReminderEligible(state, course, member, today = new Date().toISOString().slice(0, 10)) {
  if (!course || !member) {
    return false;
  }

  if (!course.feedbackEnabled || !course.feedbackRequiredForDiploma) {
    return false;
  }

  if (!isCourseDiplomaWindowOpen(course, today)) {
    return false;
  }

  if (!(course.enrolledIds || []).includes(member.id)) {
    return false;
  }

  if ((course.feedbackResponses || []).some((response) => response.memberId === member.id)) {
    return false;
  }

  if (Number(course.attendance?.[member.id] || 0) < 75) {
    return false;
  }

  if (course.evaluations?.[member.id] !== "Apto") {
    return false;
  }

  return isMemberContentReadyForDiplomaServer(course, member.id);
}

function getCourseFeedbackReminderCandidates(state, course, today = new Date().toISOString().slice(0, 10)) {
  if (!course) {
    return [];
  }

  return (course.enrolledIds || [])
    .map((memberId) => (state.members || []).find((entry) => entry.id === memberId))
    .filter((member) => {
      if (!member) {
        return false;
      }

      if (!isCourseFeedbackReminderEligible(state, course, member, today)) {
        return false;
      }

      const email = String(member.email || "").trim();
      if (!email || !isLikelyEmail(email)) {
        return false;
      }

      const lastReminderAt = getCourseFeedbackReminderLastSentAt(course, member.id);
      const reminderIsRecent =
        lastReminderAt && Date.now() - lastReminderAt < 14 * 24 * 60 * 60 * 1000;
      return !reminderIsRecent;
    })
    .map((member) => ({ member }));
}

function getCourseClosureNoticeContext(state, course, today = new Date().toISOString().slice(0, 10)) {
  if (!course || String(course.status || "") === "Cerrado" || !isCourseDiplomaWindowOpen(course, today)) {
    return null;
  }

  const enrolledIds = Array.isArray(course.enrolledIds) ? course.enrolledIds : [];
  if (!enrolledIds.length) {
    return null;
  }

  const readyMemberIds = (course.diplomaReady || []).filter((memberId) => enrolledIds.includes(memberId));
  const feedbackPendingCount = enrolledIds.filter((memberId) => {
    if (readyMemberIds.includes(memberId)) {
      return false;
    }

    const member = (state.members || []).find((entry) => entry.id === memberId);
    return Boolean(member) && isCourseFeedbackReminderEligible(state, course, member, today);
  }).length;

  if (!readyMemberIds.length && !feedbackPendingCount) {
    return null;
  }

  return {
    readyCount: readyMemberIds.length,
    feedbackPendingCount
  };
}

function buildCourseClosureNoticeDetail(context) {
  if (!context) {
    return "";
  }

  if (context.readyCount && context.feedbackPendingCount) {
    return `${context.readyCount} alumno(s) ya pueden revisarse para diploma o cierre y ${context.feedbackPendingCount} quedan listos salvo la valoracion final.`;
  }

  if (context.readyCount) {
    return `${context.readyCount} alumno(s) ya pueden revisarse para diploma o cierre administrativo.`;
  }

  return `${context.feedbackPendingCount} alumno(s) quedan listos para cierre salvo la valoracion final.`;
}

function ensureCourseFeedbackReminderInboxItem(state, course, member) {
  if (!course || !member) {
    return;
  }

  pushAutomationItem(state, {
    type: "course_feedback_reminder",
    title: `Valoracion final pendiente: ${member.name} en ${course.title}`,
    detail: "El curso ya esta listo para cierre salvo la valoracion final del alumno.",
    courseId: course.id,
    memberId: member.id,
    key: `course_feedback_reminder:${course.id}:${member.id}`
  });
}

function removeCourseFeedbackReminderInboxItem(state, courseId, memberId) {
  state.automationInbox = (state.automationInbox || []).filter((item) => {
    const isMatchingReminder =
      item?.type === "course_feedback_reminder" &&
      String(item.courseId || "") === String(courseId || "") &&
      String(item.memberId || "") === String(memberId || "");
    const isMatchingKey = String(item?.key || "") === `course_feedback_reminder:${courseId}:${memberId}`;
    return !isMatchingReminder && !isMatchingKey;
  });
}

async function requestCourseFeedbackReminderForMember(state, courseId, memberId, options = {}) {
  const actor = options.actor || "Administracion";
  const course = (state.courses || []).find((entry) => entry.id === courseId);
  const member = (state.members || []).find((entry) => entry.id === memberId);

  if (!course || !member) {
    throw new Error("Curso o alumno no encontrado");
  }

  if (!isCourseFeedbackReminderEligible(state, course, member)) {
    removeCourseFeedbackReminderInboxItem(state, courseId, memberId);
    return {
      status: "not_applicable",
      course,
      member,
      message: `${member.name} ya no necesita el recordatorio de valoracion final`
    };
  }

  const email = String(member.email || "").trim();
  if (!email || !isLikelyEmail(email)) {
    removeCourseFeedbackReminderInboxItem(state, courseId, memberId);
    return {
      status: "not_applicable",
      course,
      member,
      message: `${member.name} no tiene un email valido para pedir la valoracion final`
    };
  }

  if (!isSmtpConfigured(state)) {
    removeCourseFeedbackReminderInboxItem(state, courseId, memberId);
    ensureCourseFeedbackReminderInboxItem(state, course, member);
    appendActivity(
      state,
      "system",
      actor,
      `Recordatorio de valoracion final dejado en bandeja para ${member.name} en ${course.title}`
    );
    return {
      status: "manual",
      course,
      member,
      message: `Se ha dejado el seguimiento manual de ${member.name} en la bandeja automatica`
    };
  }

  try {
    const result = await maybeSendCourseFeedbackReminder(state, course, member, {
      force: true,
      strict: true,
      actor
    });

    if (result.status === "sent") {
      removeCourseFeedbackReminderInboxItem(state, courseId, memberId);
      return {
        status: "sent",
        course,
        member,
        message: `Se ha pedido la valoracion final a ${member.name} en ${course.title}`
      };
    }

    removeCourseFeedbackReminderInboxItem(state, courseId, memberId);
    ensureCourseFeedbackReminderInboxItem(state, course, member);
    appendActivity(
      state,
      "system",
      actor,
      `Recordatorio de valoracion final dejado en bandeja para ${member.name} en ${course.title}`
    );
    return {
      status: "manual",
      course,
      member,
      message: `Se ha dejado el seguimiento manual de ${member.name} en la bandeja automatica`
    };
  } catch (error) {
    removeCourseFeedbackReminderInboxItem(state, courseId, memberId);
    ensureCourseFeedbackReminderInboxItem(state, course, member);
    appendActivity(
      state,
      "system",
      actor,
      `Fallo al enviar el recordatorio de valoracion final a ${member.name} en ${course.title}. Queda en bandeja automatica`
    );
    return {
      status: "fallback_manual",
      course,
      member,
      message: `No se pudo enviar el recordatorio a ${member.name}. Se ha dejado en bandeja automatica.`,
      error: error.message || "Error SMTP"
    };
  }
}

function recordAutomationRun(state, reason, summary) {
  state.automationMeta = {
    lastRunAt: new Date().toISOString(),
    lastReason: reason,
    lastSummary: summary
  };
}

function buildAutomationMessage(prefix, summary) {
  return `${prefix}: ${summary.updatedDiplomas} diploma(s), ${summary.promotedWaitlist} promocion(es), ${summary.closedCourses} cierre(s), ${summary.sentDiplomas} envio(s) de diploma, ${summary.sentFeeReminders || 0} recordatorio(s) de cuota, ${summary.sentFeedbackReminders || 0} recordatorio(s) de valoracion y ${summary.inboxItems} aviso(s).`;
}

async function runBackgroundAutomationSweep() {
  const state = readState();
  const summary = await runAutomationEngine(state);
  recordAutomationRun(state, "Revision programada", summary);

  if (hasAutomationImpact(summary)) {
    appendActivity(
      state,
      "system",
      "Motor de automatizacion",
      `Revision programada completada: ${summary.promotedWaitlist} promocion(es), ${summary.closedCourses} cierre(s), ${summary.sentDiplomas} envio(s)`
      + `${summary.sentFeeReminders ? `, ${summary.sentFeeReminders} recordatorio(s) de cuota` : ""}`
      + `${summary.sentFeedbackReminders ? `, ${summary.sentFeedbackReminders} recordatorio(s) de valoracion` : ""}`
    );
  }

  writeState(state);
}

function hasAutomationImpact(summary) {
  return Boolean(
    summary.updatedDiplomas ||
      summary.promotedWaitlist ||
      summary.advancedCourses ||
      summary.closedCourses ||
      summary.sentDiplomas ||
      summary.sentFeeReminders ||
      summary.failedFeeReminders ||
      summary.sentFeedbackReminders ||
      summary.failedFeedbackReminders ||
      summary.failedDiplomas ||
      summary.inboxItems
  );
}

function pushAutomationItem(state, item) {
  const key = item.key || `${item.type || "task"}:${item.courseId || ""}:${item.memberId || ""}:${item.emailId || ""}`;
  if ((state.automationInbox || []).some((existing) => existing.key === key)) {
    return;
  }

  state.automationInbox.push({
    id: `automation-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    key,
    status: "open",
    createdAt: new Date().toISOString(),
    ...item
  });
}

function pickNextAgentItem(state) {
  const priorities = [
    "associate_application_receipt",
    "associate_application_info_request",
    "associate_application_reply_receipt",
    "associate_application_reply_notification",
    "associate_application_decision",
    "associate_welcome",
    "associate_profile_notification",
    "associate_payment_notification",
    "associate_legacy_access",
    "associate_legacy_review",
    "associate_fee",
    "course_feedback_reminder",
    "failed_email",
    "pending_diplomas",
    "renewal",
    "course_ready"
  ];
  const smtpReady = isSmtpConfigured(state);

  for (const type of priorities) {
    const item = (state.automationInbox || []).find((entry) => entry.type === type);
    if (!item) {
      continue;
    }

    if (type === "course_ready" && !state.settings?.agent?.canCloseCourses) {
      continue;
    }

    if (["failed_email", "pending_diplomas", "associate_welcome", "associate_fee", "course_feedback_reminder", "associate_payment_notification", "associate_profile_notification", "associate_application_receipt", "associate_application_info_request", "associate_application_reply_receipt", "associate_application_reply_notification", "associate_application_decision"].includes(type) && !state.settings?.agent?.canSendDiplomas) {
      continue;
    }

    if (type === "renewal" && !state.settings?.agent?.canResolveInbox) {
      continue;
    }

    if (["associate_legacy_access", "associate_legacy_review"].includes(type) && !state.settings?.agent?.canResolveInbox) {
      continue;
    }

    if (["failed_email", "pending_diplomas", "renewal", "associate_welcome", "associate_fee", "course_feedback_reminder", "associate_payment_notification", "associate_profile_notification", "associate_application_receipt", "associate_application_info_request", "associate_application_reply_receipt", "associate_application_reply_notification", "associate_application_decision"].includes(type) && !smtpReady) {
      continue;
    }

    return item;
  }

  return null;
}

function logAgentDecision(state, item, outcome, detail) {
  state.agentLog = state.agentLog || [];
  state.agentLog.unshift({
    id: `agent-log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    actor: "Agente Campus",
    action: "resolve-next",
    itemType: item.type || "",
    target: item.title || item.courseId || item.memberId || "",
    outcome,
    detail
  });
  state.agentLog = state.agentLog.slice(0, 200);
}

async function resolveAutomationItem(state, item) {
  switch (item.type) {
    case "pending_diplomas":
      return resolvePendingDiplomasItem(state, item);
    case "failed_email":
      return resolveFailedEmailItem(state, item);
    case "renewal":
      return resolveRenewalItem(state, item);
    case "associate_fee":
      return resolveAssociateFeeItem(state, item);
    case "course_feedback_reminder":
      return resolveCourseFeedbackReminderItem(state, item);
    case "associate_application_receipt":
      return resolveAssociateApplicationReceiptItem(state, item);
    case "associate_application_info_request":
      return resolveAssociateApplicationInfoRequestItem(state, item);
    case "associate_application_reply_receipt":
      return resolveAssociateApplicationReplyReceiptItem(state, item);
    case "associate_application_reply_notification":
      return resolveAssociateApplicationReplyNotificationItem(state, item);
    case "associate_application_decision":
      return resolveAssociateApplicationDecisionItem(state, item);
    case "associate_profile_notification":
      return resolveAssociateProfileNotificationItem(state, item);
    case "associate_payment_notification":
      return resolveAssociatePaymentNotificationItem(state, item);
    case "associate_legacy_access":
      return resolveAssociateLegacyAccessItem(state, item);
    case "associate_legacy_review":
      return resolveAssociateLegacyReviewItem(state, item);
    case "associate_welcome":
      return resolveAssociateWelcomeItem(state, item);
    case "course_ready":
      return resolveCourseReadyItem(state, item);
    default:
      throw new Error("Este aviso no tiene una accion segura automatizable");
  }
}

async function resolvePendingDiplomasItem(state, item) {
  if (!state.settings?.agent?.canSendDiplomas) {
    throw new Error("El agente no tiene permiso para enviar diplomas");
  }

  if (!isSmtpConfigured(state)) {
    throw new Error("Configura el SMTP antes de enviar diplomas pendientes");
  }

  const course = (state.courses || []).find((entry) => entry.id === item.courseId);
  if (!course) {
    throw new Error("Curso no encontrado para el envio automatico");
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const memberId of course.diplomaReady || []) {
    if (hasSuccessfulSmtpDelivery(state, course.id, memberId)) {
      continue;
    }

    const member = (state.members || []).find((entry) => entry.id === memberId);
    if (!member || !member.email) {
      continue;
    }

    const email = createEmailRecord(state, course, member);
    try {
      await deliverEmailRecord(state, email);
      if (email.status === "sent") {
        sentCount += 1;
      }
    } catch (error) {
      failedCount += 1;
    }
  }

  appendActivity(
    state,
    "system",
    "Bandeja automatica",
    `Resolucion de diplomas pendientes en ${course.title}: ${sentCount} enviado(s), ${failedCount} fallido(s)`
  );

  return {
    type: item.type,
    message: `Se ha procesado la entrega de diplomas pendientes para ${course.title}`,
    sentCount,
    failedCount
  };
}

async function resolveFailedEmailItem(state, item) {
  if (!state.settings?.agent?.canSendDiplomas) {
    throw new Error("El agente no tiene permiso para reenviar correos");
  }

  if (!isSmtpConfigured(state)) {
    throw new Error("Configura el SMTP antes de reintentar un correo");
  }

  const sourceEmail = (state.emailOutbox || []).find((entry) => entry.id === item.emailId) ||
    (state.emailOutbox || []).find(
      (entry) =>
        entry.status === "failed" &&
        entry.courseId === item.courseId &&
        entry.memberId === item.memberId
    );

  if (!sourceEmail) {
    throw new Error("No se ha encontrado el correo fallido para reintentar");
  }

  const email = {
    ...sourceEmail,
    id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sentAt: new Date().toISOString(),
    status: "queued",
    transport: "smtp",
    attemptCount: 0,
    deliveryError: "",
    deliveredAt: null
  };

  state.emailOutbox.unshift(email);
  await deliverEmailRecord(state, email);

  appendActivity(
    state,
    "system",
    "Bandeja automatica",
    `Reintento de correo SMTP hacia ${email.to}`
  );

  return {
    type: item.type,
    message: `Se ha reintentado el correo hacia ${email.to}`
  };
}

async function resolveRenewalItem(state, item) {
  if (!state.settings?.agent?.canResolveInbox) {
    throw new Error("El agente no tiene permiso para resolver renovaciones");
  }

  if (!isSmtpConfigured(state)) {
    throw new Error("Configura el SMTP antes de avisar renovaciones");
  }

  const member = (state.members || []).find((entry) => entry.id === item.memberId);
  if (!member) {
    throw new Error("Persona no encontrada para el aviso de renovacion");
  }

  const email = {
    id: `mail-${Date.now()}-${member.id}-${Math.random().toString(36).slice(2, 7)}`,
    courseId: "",
    memberId: member.id,
    to: member.email,
    subject: `Aviso de renovacion pendiente - ${state.settings?.organization || "Campus"}`,
    body: buildRenewalEmailBody(state, member),
    sentAt: new Date().toISOString(),
    status: "queued",
    transport: "smtp",
    attemptCount: 0,
    deliveryError: "",
    deliveredAt: null
  };

  state.emailOutbox.unshift(email);
  await deliverEmailRecord(state, email);
  member.lastRenewalReminderAt = new Date().toISOString();
  appendActivity(
    state,
    "system",
    "Bandeja automatica",
    `Aviso de renovacion enviado a ${member.name}`
  );

  return {
    type: item.type,
    message: `Se ha enviado un aviso de renovacion a ${member.name}`
  };
}

async function resolveAssociateFeeItem(state, item) {
  if (!state.settings?.agent?.canSendDiplomas) {
    throw new Error("El agente no tiene permiso para enviar avisos de cuota");
  }

  const associate = (state.associates || []).find((entry) => entry.id === item.memberId);
  if (!associate) {
    throw new Error("Socio no encontrado para el aviso de cuota");
  }

  const result = await maybeSendAssociateFeeReminder(state, associate, {
    force: true,
    strict: true,
    actor: "Bandeja automatica"
  });

  return {
    type: item.type,
    message: result.status === "sent"
      ? `Se ha enviado un recordatorio de cuota a ${getAssociateFullName(associate)}`
      : `La cuota de ${getAssociateFullName(associate)} ya esta al dia`
  };
}

async function resolveCourseFeedbackReminderItem(state, item) {
  if (!state.settings?.agent?.canSendDiplomas) {
    throw new Error("El agente no tiene permiso para enviar recordatorios de valoracion");
  }

  const course = (state.courses || []).find((entry) => entry.id === item.courseId);
  if (!course) {
    throw new Error("Curso no encontrado para el recordatorio de valoracion");
  }
  const member = (state.members || []).find((entry) => entry.id === item.memberId);
  if (!member) {
    throw new Error("Alumno no encontrado para el recordatorio de valoracion");
  }

  const result = await maybeSendCourseFeedbackReminder(state, course, member, {
    force: true,
    strict: true,
    actor: "Bandeja automatica"
  });

  return {
    type: item.type,
    message:
      result.status === "sent"
        ? `Se ha pedido la valoracion final a ${member.name} en ${course.title}`
        : `${member.name} ya no necesita recordatorio de valoracion final`
  };
}

async function resolveAssociateApplicationReceiptItem(state, item) {
  if (!state.settings?.agent?.canSendDiplomas) {
    throw new Error("El agente no tiene permiso para enviar correos de solicitud");
  }

  if (!isSmtpConfigured(state)) {
    throw new Error("Configura el SMTP antes de enviar el acuse de solicitud");
  }

  const application = (state.associateApplications || []).find(
    (entry) => entry.id === item.memberId && entry.status === "Pendiente de revision"
  );
  if (!application) {
    throw new Error("No se ha encontrado una solicitud pendiente de acuse");
  }

  const result = await maybeSendAssociateApplicationReceiptEmail(state, application, {
    force: true,
    actor: "Bandeja automatica"
  });

  if (result.status === "failed") {
    throw new Error(result.error || "No se pudo enviar el acuse de solicitud");
  }

  return {
    type: item.type,
    message: `Se ha enviado el acuse de solicitud a ${application.email}`
  };
}

async function resolveAssociateApplicationInfoRequestItem(state, item) {
  if (!state.settings?.agent?.canSendDiplomas) {
    throw new Error("El agente no tiene permiso para enviar correos de solicitud");
  }

  if (!isSmtpConfigured(state)) {
    throw new Error("Configura el SMTP antes de enviar la solicitud de documentacion");
  }

  const application = (state.associateApplications || []).find(
    (entry) => entry.id === item.memberId && entry.status === "Pendiente de documentacion"
  );
  if (!application) {
    throw new Error("No se ha encontrado una solicitud pendiente de documentacion");
  }

  const result = await maybeSendAssociateApplicationInfoRequestEmail(state, application, {
    force: true,
    actor: "Bandeja automatica"
  });

  if (result.status === "failed") {
    throw new Error(result.error || "No se pudo enviar la solicitud de documentacion");
  }

  return {
    type: item.type,
    message: `Se ha enviado la solicitud de documentacion a ${application.email}`
  };
}

async function resolveAssociateApplicationReplyReceiptItem(state, item) {
  if (!state.settings?.agent?.canSendDiplomas) {
    throw new Error("El agente no tiene permiso para enviar acuses");
  }

  if (!isSmtpConfigured(state)) {
    throw new Error("Configura el SMTP antes de enviar el acuse al solicitante");
  }

  const application = (state.associateApplications || []).find(
    (entry) => entry.id === item.memberId && entry.applicantReplyAt
  );
  if (!application) {
    throw new Error("No se ha encontrado una respuesta pendiente de acuse");
  }

  const result = await maybeSendAssociateApplicationReplyReceiptEmail(state, application, {
    force: true,
    actor: "Bandeja automatica"
  });

  if (result.status === "failed") {
    throw new Error(result.error || "No se pudo enviar el acuse al solicitante");
  }

  return {
    type: item.type,
    message: `Se ha enviado el acuse de respuesta a ${application.email}`
  };
}

async function resolveAssociateApplicationReplyNotificationItem(state, item) {
  if (!state.settings?.agent?.canSendDiplomas) {
    throw new Error("El agente no tiene permiso para enviar avisos internos");
  }

  if (!isSmtpConfigured(state)) {
    throw new Error("Configura el SMTP antes de avisar a administracion");
  }

  const application = (state.associateApplications || []).find(
    (entry) => entry.id === item.memberId && entry.applicantReplyAt
  );
  if (!application) {
    throw new Error("No se ha encontrado una respuesta pendiente de notificar");
  }

  const result = await maybeSendAssociateApplicationReplyNotification(state, application, {
    force: true,
    actor: "Bandeja automatica"
  });

  if (result.status === "failed") {
    throw new Error(result.error || "No se pudo avisar a administracion");
  }

  return {
    type: item.type,
    message: `Se ha avisado a administracion de la respuesta de ${application.email}`
  };
}

async function resolveAssociateApplicationDecisionItem(state, item) {
  if (!state.settings?.agent?.canSendDiplomas) {
    throw new Error("El agente no tiene permiso para enviar correos de solicitud");
  }

  if (!isSmtpConfigured(state)) {
    throw new Error("Configura el SMTP antes de enviar la resolucion de solicitud");
  }

  const application = (state.associateApplications || []).find(
    (entry) =>
      entry.id === item.memberId &&
      ["Aprobada", "Rechazada"].includes(entry.status) &&
      entry.decisionEmailStatus !== "sent"
  );
  if (!application) {
    throw new Error("No se ha encontrado una solicitud pendiente de resolucion");
  }

  const result = await maybeSendAssociateApplicationDecisionEmail(
    state,
    application,
    application.status === "Aprobada",
    "Bandeja automatica",
    { force: true }
  );

  if (result.status === "failed") {
    throw new Error(result.error || "No se pudo enviar la resolucion de solicitud");
  }

  return {
    type: item.type,
    message: `Se ha enviado la resolucion de solicitud a ${application.email}`
  };
}

async function resolveAssociatePaymentNotificationItem(state, item) {
  if (!state.settings?.agent?.canSendDiplomas) {
    throw new Error("El agente no tiene permiso para enviar avisos de revision");
  }

  if (!isSmtpConfigured(state)) {
    throw new Error("Configura el SMTP antes de avisar la revision del justificante");
  }

  const submission = (state.associatePaymentSubmissions || []).find(
    (entry) =>
      entry.associateId === item.memberId &&
      ["Aprobado", "Rechazado"].includes(entry.status) &&
      entry.notificationStatus !== "sent"
  );
  if (!submission) {
    throw new Error("No se ha encontrado un justificante pendiente de notificacion");
  }

  const associate = (state.associates || []).find((entry) => entry.id === submission.associateId);
  if (!associate) {
    throw new Error("Socio no encontrado para el aviso del justificante");
  }

  const approved = submission.status === "Aprobado";
  const result = await maybeSendAssociatePaymentSubmissionNotification(
    state,
    submission,
    associate,
    approved,
    "Bandeja automatica"
  );

  if (result.status === "failed") {
    throw new Error(result.error || "No se pudo enviar el aviso del justificante");
  }

  return {
    type: item.type,
    message: `Se ha enviado la resolucion del justificante a ${getAssociateFullName(associate)}`
  };
}

async function resolveAssociateProfileNotificationItem(state, item) {
  if (!state.settings?.agent?.canSendDiplomas) {
    throw new Error("El agente no tiene permiso para enviar avisos de ficha de socio");
  }

  if (!isSmtpConfigured(state)) {
    throw new Error("Configura el SMTP antes de avisar la revision de la ficha");
  }

  const request = (state.associateProfileRequests || []).find(
    (entry) =>
      entry.associateId === item.memberId &&
      ["Aprobado", "Rechazado"].includes(entry.status) &&
      entry.notificationStatus !== "sent"
  );
  if (!request) {
    throw new Error("No se ha encontrado una actualizacion de ficha pendiente de notificacion");
  }

  const associate = (state.associates || []).find((entry) => entry.id === request.associateId);
  if (!associate) {
    throw new Error("Socio no encontrado para el aviso de actualizacion");
  }

  const approved = request.status === "Aprobado";
  const result = await maybeSendAssociateProfileRequestNotification(
    state,
    request,
    associate,
    approved,
    "Bandeja automatica"
  );

  if (result.status === "failed") {
    throw new Error(result.error || "No se pudo enviar el aviso de actualizacion");
  }

  return {
    type: item.type,
    message: `Se ha enviado la resolucion de ficha a ${getAssociateFullName(associate)}`
  };
}

async function resolveAssociateLegacyAccessItem(state, item) {
  if (!state.settings?.agent?.canResolveInbox) {
    throw new Error("El agente no tiene permiso para preparar accesos legacy");
  }

  const associate = (state.associates || []).find((entry) => entry.id === item.memberId);
  if (!associate) {
    throw new Error("Socio legacy no encontrado");
  }
  if (!associate.email) {
    throw new Error("El socio no tiene email para crear acceso");
  }

  provisionAssociateCampusAccess(state, associate, { force: true });
  appendActivity(
    state,
    "system",
    "Bandeja automatica",
    `Acceso legacy preparado para el socio #${associate.associateNumber} (${getAssociateFullName(associate)})`
  );

  return {
    type: item.type,
    message: `Acceso al campus preparado para ${getAssociateFullName(associate)}`
  };
}

async function resolveAssociateLegacyReviewItem(state, item) {
  if (!state.settings?.agent?.canResolveInbox) {
    throw new Error("El agente no tiene permiso para cerrar revisiones legacy");
  }

  const associate = (state.associates || []).find((entry) => entry.id === item.memberId);
  if (!associate) {
    throw new Error("Socio legacy no encontrado");
  }
  if (!associate.firstName || !associate.lastName || !associate.email || !associate.service) {
    throw new Error("El socio no tiene datos minimos para cerrar la revision");
  }

  associate.status =
    getAssociateYearFeeGap(associate, String(new Date().getFullYear())) > 0
      ? "Pendiente cuota"
      : "Activa";
  appendActivity(
    state,
    "system",
    "Bandeja automatica",
    `Revision legacy cerrada para el socio #${associate.associateNumber} (${getAssociateFullName(associate)})`
  );

  return {
    type: item.type,
    message: `Revision legacy cerrada para ${getAssociateFullName(associate)}`
  };
}

async function resolveAssociateWelcomeItem(state, item) {
  if (!state.settings?.agent?.canSendDiplomas) {
    throw new Error("El agente no tiene permiso para enviar comunicaciones de acceso");
  }

  const associate = (state.associates || []).find((entry) => entry.id === item.memberId);
  if (!associate) {
    throw new Error("Socio no encontrado para el correo de bienvenida");
  }

  const result = await maybeSendAssociateWelcomeEmail(state, associate, {
    force: true,
    strict: true,
    actor: "Bandeja automatica"
  });

  return {
    type: item.type,
    message:
      result.status === "sent"
        ? `Se ha enviado la bienvenida del campus a ${getAssociateFullName(associate)}`
        : `La bienvenida del campus queda pendiente para ${getAssociateFullName(associate)}`
  };
}

function resolveCourseReadyItem(state, item) {
  if (!state.settings?.agent?.canCloseCourses) {
    throw new Error("El agente no tiene permiso para cerrar cursos");
  }

  const course = (state.courses || []).find((entry) => entry.id === item.courseId);
  if (!course) {
    throw new Error("Curso no encontrado para cierre");
  }

  course.status = "Cerrado";
  appendActivity(
    state,
    "system",
    "Bandeja automatica",
    `Cierre del curso ${course.title} desde la bandeja operativa`
  );

  return {
    type: item.type,
    message: `Se ha cerrado el curso ${course.title}`
  };
}

function toCsv(rows) {
  return rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

function buildEml(email, state) {
  const smtp = getSmtpSettings(state);
  const fromAddress = smtp.fromEmail || "no-reply@isocronazero.local";
  const fromName = smtp.fromName || (state.settings && state.settings.organization) || "Isocrona Zero";
  return [
    `From: ${fromName} <${fromAddress}>`,
    `To: ${email.to}`,
    `Subject: ${email.subject}`,
    `Date: ${new Date(email.sentAt || Date.now()).toUTCString()}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    email.body || ""
  ].join("\r\n");
}

function sanitizeFilename(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]+/g, "")
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, 80);
}

function getSmtpSettings(state) {
  return {
    host: "",
    port: 465,
    secure: true,
    startTls: false,
    username: "",
    password: "",
    fromEmail: "",
    fromName: "Isocrona Zero Campus",
    testTo: "",
    ...(state.settings?.smtp || {})
  };
}

function isSmtpConfigured(state) {
  const smtp = getSmtpSettings(state);
  return Boolean(smtp.host && smtp.port && smtp.fromEmail);
}

function hasSuccessfulSmtpDelivery(state, courseId, memberId) {
  return (state.emailOutbox || []).some(
    (item) =>
      item.courseId === courseId &&
      item.memberId === memberId &&
      item.status === "sent" &&
      item.transport === "smtp"
  );
}

function createEmailRecord(state, course, member) {
  const email = {
    id: `mail-${Date.now()}-${member.id}-${Math.random().toString(36).slice(2, 7)}`,
    courseId: course.id,
    memberId: member.id,
    to: member.email,
    subject: `Diploma emitido - ${course.title}`,
    body: buildEmailBody(state, member, course),
    sentAt: new Date().toISOString(),
    status: "queued",
    transport: "smtp",
    attemptCount: 0,
    deliveryError: "",
    deliveredAt: null
  };

  state.emailOutbox.unshift(email);
  return email;
}

function createAssociateWelcomeEmailRecord(state, associate) {
  const account = (state.accounts || []).find((item) => item.id === associate.linkedAccountId);
  const member = (state.members || []).find((item) => item.id === associate.linkedMemberId);
  const email = {
    id: `mail-${Date.now()}-${associate.id}-${Math.random().toString(36).slice(2, 7)}`,
    courseId: "",
    memberId: member?.id || "",
    associateId: associate.id,
    to: associate.email,
    subject: `Bienvenida al campus - ${state.settings?.organization || "Isocrona Zero"}`,
    body: buildAssociateWelcomeEmailBody(state, associate, account, member),
    sentAt: new Date().toISOString(),
    status: "queued",
    transport: "smtp",
    attemptCount: 0,
    deliveryError: "",
    deliveredAt: null
  };

  state.emailOutbox.unshift(email);
  return email;
}

async function deliverEmailRecord(state, email) {
  const smtp = getSmtpSettings(state);
  if (!smtp.host || !smtp.port || !smtp.fromEmail) {
    throw new Error("Falta configuracion SMTP minima");
  }

  email.transport = "smtp";
  email.attemptCount = Number(email.attemptCount || 0) + 1;
  email.lastAttemptAt = new Date().toISOString();

  try {
    const result = await sendMail(smtp, {
      from: smtp.fromEmail,
      fromName: smtp.fromName,
      to: email.to,
      subject: email.subject,
      text: email.body
    });

    email.status = "sent";
    email.deliveredAt = new Date().toISOString();
    email.deliveryError = "";
    email.smtpMessageId = result.messageId || "";

  } catch (error) {
    email.status = "failed";
    email.deliveryError = error.message || "Error SMTP";
    throw error;
  }
}

function buildEmailBody(state, member, course) {
  return String(
    state.settings?.emailTemplate ||
      "Hola {{name}}, su diploma del curso {{course}} ya esta disponible."
  )
    .replaceAll("{{name}}", member.name)
    .replaceAll("{{course}}", course.title);
}

function buildRenewalEmailBody(state, member) {
  return [
    `Hola ${member.name},`,
    "",
    `Hemos detectado ${member.renewalsDue} renovacion(es) o certificacion(es) pendiente(s) en tu ficha del campus.`,
    "Revisa tu historial formativo y coordina la renovacion con administracion cuanto antes.",
    "",
    `Equipo de formacion - ${state.settings?.organization || "Isocrona Zero"}`
  ].join("\n");
}

function buildAssociateWelcomeEmailBody(state, associate, account, member) {
  const organization = state.settings?.organization || "Isocrona Zero";
  const displayName = getAssociateFullName(associate) || account?.name || member?.name || "socio";
  const loginEmail = account?.email || associate.email || "";
  const hasTemporaryPassword = Boolean(account?.mustChangePassword);
  const tempPassword = hasTemporaryPassword ? associate.temporaryPassword || "" : "";
  const service = String(associate.service || "").trim();
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
  ].join("\n");
}

function buildAssociateFeeReminderEmailBody(state, associate, year, pendingAmount) {
  const organization = state.settings?.organization || "Isocrona Zero";
  const displayName = getAssociateFullName(associate) || "socio";
  const paidAmount = Number(associate.yearlyFees?.[String(year)] || 0);

  return [
    `Hola ${displayName},`,
    "",
    `Te escribimos desde ${organization} para recordarte que tu cuota del ${year} sigue pendiente o incompleta.`,
    "",
    `Resumen actual:`,
    `- Cuota anual: ${Number(associate.annualAmount || 0)} EUR`,
    `- Importe registrado: ${paidAmount} EUR`,
    `- Pendiente: ${pendingAmount} EUR`,
    "",
    "Si ya has realizado el pago, responde a este correo para que administracion pueda revisarlo y registrarlo.",
    "Si todavia no lo has tramitado, puedes ponerte al dia en cuanto te resulte posible para mantener tu ficha activa.",
    "",
    `Equipo de administracion - ${organization}`
  ].join("\n");
}

function buildCourseFeedbackReminderEmailBody(state, member, course) {
  const organization = state.settings?.organization || "Isocrona Zero";
  const displayName = member?.name || "alumno";

  return [
    `Hola ${displayName},`,
    "",
    `Tu curso ${course.title} ya esta practicamente listo para cierre en ${organization}.`,
    "Solo nos falta que completes la valoracion final del curso para cerrar correctamente tu seguimiento formativo.",
    "",
    "Que hacer ahora:",
    "- Entra en el campus.",
    `- Abre el curso ${course.title}.`,
    "- Completa la valoracion final desde tu area del curso.",
    "",
    "Cuando quede enviada, el equipo podra continuar el cierre del curso con normalidad.",
    "",
    `Equipo de formacion - ${organization}`
  ].join("\n");
}
async function maybeSendAssociateFeeReminder(state, associate, options = {}) {
  const force = Boolean(options.force);
  const strict = Boolean(options.strict);
  const actor = options.actor || "Motor de automatizacion";

  if (!associate) {
    if (strict) {
      throw new Error("No se ha indicado el socio para el recordatorio de cuota");
    }
    return { status: "skipped", reason: "missing_associate" };
  }

  const currentYear = String(new Date().getFullYear());
  const pendingAmount = getAssociateYearFeeGap(associate, currentYear);
  if (pendingAmount <= 0) {
    return { status: "skipped", reason: "already_paid" };
  }

  const email = String(associate.email || "").trim();
  if (!email || !isLikelyEmail(email)) {
    if (strict) {
      throw new Error("El socio no tiene un email valido para el recordatorio de cuota");
    }
    return { status: "pending", reason: "missing_email" };
  }

  const lastReminderAt = associate.lastQuotaReminderAt
    ? new Date(associate.lastQuotaReminderAt).getTime()
    : 0;
  const reminderIsRecent =
    lastReminderAt && Date.now() - lastReminderAt < 14 * 24 * 60 * 60 * 1000;

  if (!force && reminderIsRecent) {
    return { status: "skipped", reason: "recent_reminder" };
  }

  if (!force && state.settings?.automation?.autoSendFeeReminders === false) {
    return { status: "skipped", reason: "auto_disabled" };
  }

  if (!isSmtpConfigured(state)) {
    if (strict) {
      throw new Error("Configura el SMTP antes de enviar recordatorios de cuota");
    }
    return { status: "pending", reason: "smtp_missing" };
  }

  const message = {
    id: `mail-${Date.now()}-${associate.id}-${Math.random().toString(36).slice(2, 7)}`,
    courseId: "",
    memberId: associate.linkedMemberId || "",
    associateId: associate.id,
    to: email,
    subject: `Recordatorio de cuota pendiente - ${state.settings?.organization || "Isocrona Zero"}`,
    body: buildAssociateFeeReminderEmailBody(state, associate, currentYear, pendingAmount),
    sentAt: new Date().toISOString(),
    status: "queued",
    transport: "smtp",
    attemptCount: 0,
    deliveryError: "",
    deliveredAt: null
  };

  state.emailOutbox.unshift(message);
  await deliverEmailRecord(state, message);
  associate.lastQuotaReminderAt = new Date().toISOString();
  appendActivity(
    state,
    "system",
    actor,
    `Aviso de cuota enviado al socio #${associate.associateNumber} (${email})`
  );

  return { status: "sent", emailId: message.id };
}

async function maybeSendCourseFeedbackReminder(state, course, member, options = {}) {
  const force = Boolean(options.force);
  const strict = Boolean(options.strict);
  const actor = options.actor || "Motor de automatizacion";
  const today = new Date().toISOString().slice(0, 10);

  if (!course || !member) {
    if (strict) {
      throw new Error("No se ha indicado el curso o el alumno para el recordatorio de valoracion");
    }
    return { status: "skipped", reason: "missing_target" };
  }

  if (!isCourseFeedbackReminderEligible(state, course, member, today)) {
    return { status: "skipped", reason: "not_eligible" };
  }

  const email = String(member.email || "").trim();
  if (!email || !isLikelyEmail(email)) {
    if (strict) {
      throw new Error("El alumno no tiene un email valido para el recordatorio de valoracion");
    }
    return { status: "pending", reason: "missing_email" };
  }

  const lastReminderAt = getCourseFeedbackReminderLastSentAt(course, member.id);
  const reminderIsRecent =
    lastReminderAt && Date.now() - lastReminderAt < 14 * 24 * 60 * 60 * 1000;

  if (!force && reminderIsRecent) {
    return { status: "skipped", reason: "recent_reminder" };
  }

  if (!force && state.settings?.automation?.autoSendFeedbackReminders === false) {
    return { status: "skipped", reason: "auto_disabled" };
  }

  if (!isSmtpConfigured(state)) {
    if (strict) {
      throw new Error("Configura el SMTP antes de enviar recordatorios de valoracion final");
    }
    return { status: "pending", reason: "smtp_missing" };
  }

  const message = {
    id: `mail-${Date.now()}-${course.id}-${member.id}-${Math.random().toString(36).slice(2, 7)}`,
    courseId: course.id,
    memberId: member.id,
    associateId: member.associateId || "",
    to: email,
    subject: `Valoracion final pendiente - ${course.title}`,
    body: buildCourseFeedbackReminderEmailBody(state, member, course),
    sentAt: new Date().toISOString(),
    status: "queued",
    transport: "smtp",
    attemptCount: 0,
    deliveryError: "",
    deliveredAt: null
  };

  state.emailOutbox.unshift(message);
  await deliverEmailRecord(state, message);
  course.feedbackReminderLog = {
    ...(course.feedbackReminderLog || {}),
    [member.id]: new Date().toISOString()
  };
  appendActivity(
    state,
    "system",
    actor,
    `Recordatorio de valoracion final enviado a ${member.name} para ${course.title} (${email})`
  );

  return { status: "sent", emailId: message.id };
}

async function maybeSendAssociatePaymentSubmissionNotification(
  state,
  submission,
  associate,
  approved,
  reviewerName,
  options = {}
) {
  if (!submission || !associate) {
    return { status: "skipped" };
  }

  const force = Boolean(options.force);

  if (!force && submission.notificationStatus === "sent" && submission.notificationSentAt) {
    return { status: "sent", reason: "already_sent" };
  }

  if (!isSmtpConfigured(state)) {
    submission.notificationStatus = "pending";
    return { status: "pending" };
  }

  const email = {
    id: `mail-${Date.now()}-${submission.id}-${Math.random().toString(36).slice(2, 7)}`,
    courseId: "",
    memberId: submission.memberId || associate.linkedMemberId || "",
    associateId: associate.id,
    to: associate.email,
    subject: approved
      ? `Justificante de cuota aprobado - ${state.settings?.organization || "Isocrona Zero"}`
      : `Revision de justificante de cuota - ${state.settings?.organization || "Isocrona Zero"}`,
    body: buildAssociatePaymentSubmissionStatusEmailBody(state, submission, associate, approved, reviewerName),
    sentAt: new Date().toISOString(),
    status: "queued",
    transport: "smtp",
    attemptCount: 0,
    deliveryError: "",
    deliveredAt: null
  };

  state.emailOutbox.unshift(email);
  try {
    await deliverEmailRecord(state, email);
    submission.notificationStatus = "sent";
    submission.notificationSentAt = new Date().toISOString();
    appendActivity(
      state,
      "system",
      reviewerName || "Socios",
      `Aviso de revision de justificante enviado al socio #${associate.associateNumber} (${associate.email})`
    );
    return { status: "sent" };
  } catch (error) {
    submission.notificationStatus = "failed";
    appendActivity(
      state,
      "system",
      reviewerName || "Socios",
      `Fallo al avisar la revision del justificante del socio #${associate.associateNumber}: ${error.message || "Error SMTP"}`
    );
    return { status: "failed", error: error.message || "Error SMTP" };
  }
}

async function maybeSendAssociateApplicationReceiptEmail(state, application, options = {}) {
  if (!application) {
    return { status: "skipped", reason: "missing_application" };
  }

  const force = Boolean(options.force);
  const actor = options.actor || "Socios";
  const config = state.settings?.associates || {};

  if (!force && config.autoSendApplicationReceipt === false) {
    application.receiptEmailStatus = application.receiptEmailStatus || "pending";
    return { status: "skipped", reason: "auto_disabled" };
  }

  if (!force && application.receiptEmailStatus === "sent" && application.receiptEmailSentAt) {
    return { status: "sent", reason: "already_sent" };
  }

  if (!isSmtpConfigured(state)) {
    application.receiptEmailStatus = "pending";
    return { status: "pending", reason: "smtp_missing" };
  }

  const email = {
    id: `mail-${Date.now()}-${application.id}-${Math.random().toString(36).slice(2, 7)}`,
    courseId: "",
    memberId: "",
    associateId: "",
    associateApplicationId: application.id,
    to: application.email,
    subject: `Solicitud de socio recibida - ${state.settings?.organization || "Isocrona Zero"}`,
    body: buildAssociateApplicationReceiptEmailBody(state, application),
    sentAt: new Date().toISOString(),
    status: "queued",
    transport: "smtp",
    attemptCount: 0,
    deliveryError: "",
    deliveredAt: null
  };

  state.emailOutbox.unshift(email);
  try {
    await deliverEmailRecord(state, email);
    application.receiptEmailStatus = "sent";
    application.receiptEmailSentAt = new Date().toISOString();
    appendActivity(
      state,
      "system",
      actor,
      `Acuse de solicitud enviado a ${application.email}`
    );
    return { status: "sent", emailId: email.id };
  } catch (error) {
    application.receiptEmailStatus = "failed";
    appendActivity(
      state,
      "system",
      actor,
      `Fallo al enviar el acuse de solicitud a ${application.email}: ${error.message || "Error SMTP"}`
    );
    return { status: "failed", error: error.message || "Error SMTP" };
  }
}

async function maybeSendAssociateApplicationInfoRequestEmail(state, application, options = {}) {
  if (!application) {
    return { status: "skipped", reason: "missing_application" };
  }

  const force = Boolean(options.force);
  const actor = options.actor || "Socios";
  const config = state.settings?.associates || {};

  if (!force && config.autoSendApplicationInfoRequest === false) {
    application.infoRequestEmailStatus = application.infoRequestEmailStatus || "pending";
    return { status: "skipped", reason: "auto_disabled" };
  }

  if (!force && application.infoRequestEmailStatus === "sent" && application.infoRequestEmailSentAt) {
    return { status: "sent", reason: "already_sent" };
  }

  if (!isSmtpConfigured(state)) {
    application.infoRequestEmailStatus = "pending";
    return { status: "pending", reason: "smtp_missing" };
  }

  const email = {
    id: `mail-${Date.now()}-${application.id}-${Math.random().toString(36).slice(2, 7)}`,
    courseId: "",
    memberId: "",
    associateId: "",
    associateApplicationId: application.id,
    to: application.email,
    subject: `Documentacion requerida - ${state.settings?.organization || "Isocrona Zero"}`,
    body: buildAssociateApplicationInfoRequestEmailBody(state, application),
    sentAt: new Date().toISOString(),
    status: "queued",
    transport: "smtp",
    attemptCount: 0,
    deliveryError: "",
    deliveredAt: null
  };

  state.emailOutbox.unshift(email);
  try {
    await deliverEmailRecord(state, email);
    application.infoRequestEmailStatus = "sent";
    application.infoRequestEmailSentAt = new Date().toISOString();
    appendActivity(
      state,
      "system",
      actor,
      `Peticion de subsanacion enviada a ${application.email}`
    );
    return { status: "sent", emailId: email.id };
  } catch (error) {
    application.infoRequestEmailStatus = "failed";
    appendActivity(
      state,
      "system",
      actor,
      `Fallo al enviar la solicitud de documentacion a ${application.email}: ${error.message || "Error SMTP"}`
    );
    return { status: "failed", error: error.message || "Error SMTP" };
  }
}

async function maybeSendAssociateApplicationReplyReceiptEmail(state, application, options = {}) {
  if (!application || !application.applicantReplyAt) {
    return { status: "skipped", reason: "missing_reply" };
  }

  const force = Boolean(options.force);
  const actor = options.actor || "Socios";
  const config = state.settings?.associates || {};

  if (!force && config.autoSendApplicantReplyReceipt === false) {
    application.applicantReplyReceiptStatus = application.applicantReplyReceiptStatus || "pending";
    return { status: "skipped", reason: "auto_disabled" };
  }

  if (!force && application.applicantReplyReceiptStatus === "sent" && application.applicantReplyReceiptSentAt) {
    return { status: "sent", reason: "already_sent" };
  }

  if (!isSmtpConfigured(state)) {
    application.applicantReplyReceiptStatus = "pending";
    return { status: "pending", reason: "smtp_missing" };
  }

  const email = {
    id: `mail-${Date.now()}-${application.id}-${Math.random().toString(36).slice(2, 7)}`,
    courseId: "",
    memberId: "",
    associateId: "",
    associateApplicationId: application.id,
    to: application.email,
    subject: `Documentacion recibida - ${state.settings?.organization || "Isocrona Zero"}`,
    body: buildAssociateApplicationReplyReceiptBody(state, application),
    sentAt: new Date().toISOString(),
    status: "queued",
    transport: "smtp",
    attemptCount: 0,
    deliveryError: "",
    deliveredAt: null
  };

  state.emailOutbox.unshift(email);
  try {
    await deliverEmailRecord(state, email);
    application.applicantReplyReceiptStatus = "sent";
    application.applicantReplyReceiptSentAt = new Date().toISOString();
    appendActivity(
      state,
      "system",
      actor,
      `Acuse de respuesta enviado a ${application.email}`
    );
    return { status: "sent", emailId: email.id };
  } catch (error) {
    application.applicantReplyReceiptStatus = "failed";
    appendActivity(
      state,
      "system",
      actor,
      `Fallo al enviar el acuse de respuesta a ${application.email}: ${error.message || "Error SMTP"}`
    );
    return { status: "failed", error: error.message || "Error SMTP" };
  }
}

async function maybeSendAssociateApplicationReplyNotification(state, application, options = {}) {
  if (!application || !application.applicantReplyAt) {
    return { status: "skipped", reason: "missing_reply" };
  }

  const force = Boolean(options.force);
  const actor = options.actor || "Socios";
  const config = state.settings?.associates || {};
  const recipients = getAssociateApplicationReplyRecipients(state);

  if (!force && config.autoSendApplicantReplyNotification === false) {
    application.applicantReplyNotificationStatus =
      application.applicantReplyNotificationStatus || "pending";
    return { status: "skipped", reason: "auto_disabled" };
  }

  if (!force && application.applicantReplyNotificationStatus === "sent" && application.applicantReplyNotificationSentAt) {
    return { status: "sent", reason: "already_sent" };
  }

  if (!recipients.length) {
    application.applicantReplyNotificationStatus = "skipped";
    return { status: "skipped", reason: "missing_admin_recipients" };
  }

  if (!isSmtpConfigured(state)) {
    application.applicantReplyNotificationStatus = "pending";
    return { status: "pending", reason: "smtp_missing" };
  }

  try {
    for (const recipient of recipients) {
      const email = {
        id: `mail-${Date.now()}-${application.id}-${Math.random().toString(36).slice(2, 7)}`,
        courseId: "",
        memberId: recipient.memberId || "",
        associateId: "",
        associateApplicationId: application.id,
        to: recipient.email,
        subject: `Respuesta recibida en solicitud de socio - ${state.settings?.organization || "Isocrona Zero"}`,
        body: buildAssociateApplicationReplyNotificationBody(state, application, recipient.name),
        sentAt: new Date().toISOString(),
        status: "queued",
        transport: "smtp",
        attemptCount: 0,
        deliveryError: "",
        deliveredAt: null
      };

      state.emailOutbox.unshift(email);
      await deliverEmailRecord(state, email);
    }

    application.applicantReplyNotificationStatus = "sent";
    application.applicantReplyNotificationSentAt = new Date().toISOString();
    appendActivity(
      state,
      "system",
      actor,
      `Aviso interno de respuesta enviado para la solicitud de ${application.email}`
    );
    return { status: "sent" };
  } catch (error) {
    application.applicantReplyNotificationStatus = "failed";
    appendActivity(
      state,
      "system",
      actor,
      `Fallo al avisar la respuesta de solicitud de ${application.email}: ${error.message || "Error SMTP"}`
    );
    return { status: "failed", error: error.message || "Error SMTP" };
  }
}

async function maybeSendAssociateApplicationDecisionEmail(
  state,
  application,
  approved,
  reviewerName,
  options = {}
) {
  if (!application) {
    return { status: "skipped", reason: "missing_application" };
  }

  const force = Boolean(options.force);
  const config = state.settings?.associates || {};

  if (!force && config.autoSendApplicationDecision === false) {
    application.decisionEmailStatus = application.decisionEmailStatus || "pending";
    return { status: "skipped", reason: "auto_disabled" };
  }

  if (!force && application.decisionEmailStatus === "sent" && application.decisionEmailSentAt) {
    return { status: "sent", reason: "already_sent" };
  }

  if (!isSmtpConfigured(state)) {
    application.decisionEmailStatus = "pending";
    return { status: "pending", reason: "smtp_missing" };
  }

  const email = {
    id: `mail-${Date.now()}-${application.id}-${Math.random().toString(36).slice(2, 7)}`,
    courseId: "",
    memberId: "",
    associateId: "",
    associateApplicationId: application.id,
    to: application.email,
    subject: approved
      ? `Solicitud de socio aprobada - ${state.settings?.organization || "Isocrona Zero"}`
      : `Resolucion de solicitud de socio - ${state.settings?.organization || "Isocrona Zero"}`,
    body: buildAssociateApplicationDecisionEmailBody(state, application, approved, reviewerName),
    sentAt: new Date().toISOString(),
    status: "queued",
    transport: "smtp",
    attemptCount: 0,
    deliveryError: "",
    deliveredAt: null
  };

  state.emailOutbox.unshift(email);
  try {
    await deliverEmailRecord(state, email);
    application.decisionEmailStatus = "sent";
    application.decisionEmailSentAt = new Date().toISOString();
    appendActivity(
      state,
      "system",
      reviewerName || "Socios",
      `Resolucion de solicitud enviada a ${application.email}`
    );
    return { status: "sent", emailId: email.id };
  } catch (error) {
    application.decisionEmailStatus = "failed";
    appendActivity(
      state,
      "system",
      reviewerName || "Socios",
      `Fallo al enviar la resolucion de solicitud a ${application.email}: ${error.message || "Error SMTP"}`
    );
    return { status: "failed", error: error.message || "Error SMTP" };
  }
}

function buildAssociateApplicationReceiptEmailBody(state, application) {
  const organization = state.settings?.organization || "Isocrona Zero";
  const displayName = getAssociateApplicantName(application) || application.email || "solicitante";
  const trackingLink = buildAssociateApplicationPublicLink(application);

  return [
    `Hola ${displayName},`,
    "",
    `Hemos recibido correctamente tu solicitud de socio en ${organization}.`,
    "",
    "Datos registrados:",
    `- Email: ${application.email}`,
    `- Telefono: ${application.phone}`,
    `- Servicio: ${application.service}`,
    "",
    `Seguimiento de tu solicitud: ${trackingLink}`,
    "",
    "Tu alta pasa ahora a revision administrativa. Cuando el equipo revise la documentacion y los justificantes, te enviaremos la resolucion por este mismo canal.",
    "",
    `Equipo de administracion - ${organization}`
  ].join("\n");
}

function buildAssociateApplicationInfoRequestEmailBody(state, application) {
  const organization = state.settings?.organization || "Isocrona Zero";
  const displayName = getAssociateApplicantName(application) || application.email || "solicitante";
  const requestedBy = application.infoRequestedBy || "Administracion";
  const trackingLink = buildAssociateApplicationPublicLink(application);

  return [
    `Hola ${displayName},`,
    "",
    `Hemos revisado tu solicitud de socio en ${organization} y necesitamos completar algunos datos o documentacion antes de continuar.`,
    "",
    "Pendiente de subsanacion:",
    application.infoRequestMessage || "Administracion necesita una aclaracion adicional sobre tu solicitud.",
    "",
    `Puedes subir la documentacion o responder desde aqui: ${trackingLink}`,
    "Tambien puedes responder a este correo si administracion te lo ha indicado asi.",
    requestedBy ? `Revision gestionada por: ${requestedBy}` : "",
    "",
    `Equipo de administracion - ${organization}`
  ]
    .filter(Boolean)
    .join("\n");
}

function buildAssociateApplicationReplyReceiptBody(state, application) {
  const organization = state.settings?.organization || "Isocrona Zero";
  const displayName = getAssociateApplicantName(application) || application.email || "solicitante";
  const trackingLink = buildAssociateApplicationPublicLink(application);

  return [
    `Hola ${displayName},`,
    "",
    `Hemos recibido correctamente la documentacion o aclaracion adicional enviada para tu solicitud en ${organization}.`,
    "",
    application.applicantReplyNote ? `Resumen recibido: ${application.applicantReplyNote}` : "",
    application.applicantReplyDocuments?.length
      ? `Documentos registrados: ${application.applicantReplyDocuments.join(", ")}`
      : "",
    "La solicitud vuelve a revision administrativa y te avisaremos cuando haya una resolucion.",
    `Seguimiento de tu solicitud: ${trackingLink}`,
    "",
    `Equipo de administracion - ${organization}`
  ]
    .filter(Boolean)
    .join("\n");
}

function buildAssociateApplicationReplyNotificationBody(state, application, recipientName) {
  const organization = state.settings?.organization || "Isocrona Zero";
  const applicantName = getAssociateApplicantName(application) || application.email || "solicitante";
  const trackingLink = buildAssociateApplicationPublicLink(application);

  return [
    recipientName ? `Hola ${recipientName},` : "Hola,",
    "",
    `La persona solicitante ${applicantName} ha respondido a la peticion de documentacion de su alta en ${organization}.`,
    "",
    `Estado actual: ${application.status}`,
    application.infoRequestMessage ? `Peticion original: ${application.infoRequestMessage}` : "",
    application.applicantReplyNote ? `Respuesta recibida: ${application.applicantReplyNote}` : "",
    application.applicantReplyDocuments?.length
      ? `Documentos aportados: ${application.applicantReplyDocuments.join(", ")}`
      : "No se han adjuntado documentos nuevos.",
    `Revisar solicitud: ${trackingLink}`,
    "",
    `Equipo de administracion - ${organization}`
  ]
    .filter(Boolean)
    .join("\n");
}

function buildAssociateApplicationDecisionEmailBody(state, application, approved, reviewerName) {
  const organization = state.settings?.organization || "Isocrona Zero";
  const displayName = getAssociateApplicantName(application) || application.email || "solicitante";
  const trackingLink = buildAssociateApplicationPublicLink(application);

  return [
    `Hola ${displayName},`,
    "",
    approved
      ? `Tu solicitud de socio en ${organization} ha quedado aprobada.`
      : `Hemos revisado tu solicitud de socio en ${organization} y por ahora no ha podido validarse.`,
    "",
    `Seguimiento de tu solicitud: ${trackingLink}`,
    "",
    approved
      ? "Si el acceso al campus ya esta preparado, recibirás tambien el correo de bienvenida con tus credenciales."
      : "Si necesitas completar documentacion o revisar algun dato, puedes responder a este correo para gestionarlo con administracion.",
    application.notes ? `Observaciones: ${application.notes}` : "",
    reviewerName ? `Revision gestionada por: ${reviewerName}` : "",
    "",
    `Equipo de administracion - ${organization}`
  ]
    .filter(Boolean)
    .join("\n");
}

function buildAssociatePaymentSubmissionStatusEmailBody(state, submission, associate, approved, reviewerName) {
  const organization = state.settings?.organization || "Isocrona Zero";
  const displayName = getAssociateFullName(associate) || "socio";

  return [
    `Hola ${displayName},`,
    "",
    approved
      ? "Hemos revisado tu justificante de cuota y ha quedado aprobado."
      : "Hemos revisado tu justificante de cuota y por ahora no ha podido validarse.",
    "",
    `Detalle enviado: ${submission.amount} EUR | ${submission.method} | ${submission.year}`,
    submission.note ? `Nota: ${submission.note}` : "",
    approved
      ? "El pago ya se ha asentado en tu ficha de socio."
      : "Necesitamos que revises el justificante o contactes con administracion para completarlo.",
    submission.reviewNote ? `Observacion de revision: ${submission.reviewNote}` : "",
    reviewerName ? `Revision realizada por: ${reviewerName}` : "",
    "",
    `Equipo de administracion - ${organization}`
  ]
    .filter(Boolean)
    .join("\n");
}

async function maybeSendAssociateProfileRequestNotification(
  state,
  request,
  associate,
  approved,
  reviewerName,
  options = {}
) {
  if (!request || !associate) {
    return { status: "skipped" };
  }

  const force = Boolean(options.force);

  if (!force && request.notificationStatus === "sent" && request.notificationSentAt) {
    return { status: "sent", reason: "already_sent" };
  }

  if (!isSmtpConfigured(state)) {
    request.notificationStatus = "pending";
    return { status: "pending" };
  }

  const email = {
    id: `mail-${Date.now()}-${request.id}-${Math.random().toString(36).slice(2, 7)}`,
    courseId: "",
    memberId: request.memberId || associate.linkedMemberId || "",
    associateId: associate.id,
    to: associate.email,
    subject: approved
      ? `Actualizacion de ficha aprobada - ${state.settings?.organization || "Isocrona Zero"}`
      : `Revision de actualizacion de ficha - ${state.settings?.organization || "Isocrona Zero"}`,
    body: buildAssociateProfileRequestStatusEmailBody(state, request, associate, approved, reviewerName),
    sentAt: new Date().toISOString(),
    status: "queued",
    transport: "smtp",
    attemptCount: 0,
    deliveryError: "",
    deliveredAt: null
  };

  state.emailOutbox.unshift(email);
  try {
    await deliverEmailRecord(state, email);
    request.notificationStatus = "sent";
    request.notificationSentAt = new Date().toISOString();
    appendActivity(
      state,
      "system",
      reviewerName || "Socios",
      `Aviso de actualizacion de ficha enviado al socio #${associate.associateNumber} (${associate.email})`
    );
    return { status: "sent" };
  } catch (error) {
    request.notificationStatus = "failed";
    appendActivity(
      state,
      "system",
      reviewerName || "Socios",
      `Fallo al avisar la actualizacion de ficha del socio #${associate.associateNumber}: ${error.message || "Error SMTP"}`
    );
    return { status: "failed", error: error.message || "Error SMTP" };
  }
}

function buildAssociateProfileRequestStatusEmailBody(state, request, associate, approved, reviewerName) {
  const organization = state.settings?.organization || "Isocrona Zero";
  const displayName = getAssociateFullName(associate) || "socio";

  return [
    `Hola ${displayName},`,
    "",
    approved
      ? "Hemos revisado tu solicitud de actualizacion de ficha y ha quedado aprobada."
      : "Hemos revisado tu solicitud de actualizacion de ficha y por ahora no ha podido validarse.",
    "",
    "Datos solicitados:",
    `- Nombre: ${request.firstName} ${request.lastName}`.trim(),
    `- Telefono: ${request.phone}`,
    `- Email: ${request.email}`,
    `- Servicio: ${request.service}`,
    request.note ? `- Nota: ${request.note}` : "",
    approved
      ? "Los datos ya se han aplicado sobre tu ficha de socio y, si correspondia, sobre tu acceso al campus."
      : "Tus datos actuales se mantienen sin cambios hasta nueva revision.",
    request.reviewNote ? `Observacion de revision: ${request.reviewNote}` : "",
    reviewerName ? `Revision realizada por: ${reviewerName}` : "",
    "",
    `Equipo de administracion - ${organization}`
  ]
    .filter(Boolean)
    .join("\n");
}

function appendActivity(state, type, actor, message) {
  state.activityLog = state.activityLog || [];
  state.activityLog.unshift({
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    actor,
    type,
    message
  });
  state.activityLog = state.activityLog.slice(0, 300);
}

function escapeXmlText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function collectDirectoryEntries(sourceDir, currentDir = sourceDir) {
  return fs.readdirSync(currentDir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      return collectDirectoryEntries(sourceDir, fullPath);
    }

    return [
      {
        name: path.relative(sourceDir, fullPath).replaceAll("\\", "/"),
        data: fs.readFileSync(fullPath)
      }
    ];
  });
}

const crc32Table = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time:
      ((date.getHours() & 0x1f) << 11) |
      ((date.getMinutes() & 0x3f) << 5) |
      Math.floor(date.getSeconds() / 2),
    date:
      (((year - 1980) & 0x7f) << 9) |
      (((date.getMonth() + 1) & 0x0f) << 5) |
      (date.getDate() & 0x1f)
  };
}

function buildZipArchive(files) {
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;
  const { time, date } = getDosDateTime();

  files.forEach((file) => {
    const fileNameBuffer = Buffer.from(file.name, "utf8");
    const fileData = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data);
    const compressedData = zlib.deflateRawSync(fileData);
    const checksum = crc32(fileData);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(date, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(compressedData.length, 18);
    localHeader.writeUInt32LE(fileData.length, 22);
    localHeader.writeUInt16LE(fileNameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localChunks.push(localHeader, fileNameBuffer, compressedData);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(time, 12);
    centralHeader.writeUInt16LE(date, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(compressedData.length, 20);
    centralHeader.writeUInt32LE(fileData.length, 24);
    centralHeader.writeUInt16LE(fileNameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralChunks.push(centralHeader, fileNameBuffer);
    offset += localHeader.length + fileNameBuffer.length + compressedData.length;
  });

  const centralDirectory = Buffer.concat(centralChunks);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(files.length, 8);
  endRecord.writeUInt16LE(files.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localChunks, centralDirectory, endRecord]);
}

function wrapText(text, maxChars) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function escapePdfText(text) {
  return String(text)
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function buildPdfDocument(contentStream, options = {}) {
  const contentBuffer = Buffer.from(contentStream, "latin1");
  const pageWidth = Number(options.pageWidth || 595);
  const pageHeight = Number(options.pageHeight || 842);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${contentBuffer.length} >>\nstream\n${contentBuffer.toString("latin1")}\nendstream`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
