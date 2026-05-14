const crypto = require("crypto");
const {
  findUserById,
  isDatabaseEnabled,
  normalizeRole: normalizePlatformRole,
  verifyAuthToken
} = require("../db");
const { sendJson } = require("./http");

const activeSessions = new Map();

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

function shouldUseSecureSessionCookie() {
  const baseUrl = String(process.env.IZ_BASE_URL || "").trim();
  const nodeEnv = String(process.env.NODE_ENV || "").trim().toLowerCase();
  return /^https:\/\//i.test(baseUrl) || nodeEnv === "production";
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
  res.setHeader(
    "Set-Cookie",
    `iz_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${shouldUseSecureSessionCookie() ? "; Secure" : ""}`
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `iz_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax${shouldUseSecureSessionCookie() ? "; Secure" : ""}`
  );
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

function normalizeCampusAccountRole(role) {
  return role === "admin" ? "admin" : "member";
}

function generateLegacyId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function ensureLegacyAccountForDbUser(state, dbUser, options = {}) {
  state.accounts = Array.isArray(state.accounts) ? state.accounts : [];
  state.members = Array.isArray(state.members) ? state.members : [];
  state.associates = Array.isArray(state.associates) ? state.associates : [];
  state.testModules = Array.isArray(state.testModules) ? state.testModules : [];
  state.tests = Array.isArray(state.tests) ? state.tests : [];
  state.questions = Array.isArray(state.questions) ? state.questions : [];
  state.testAttempts = Array.isArray(state.testAttempts) ? state.testAttempts : [];
  state.liveTestSessions = Array.isArray(state.liveTestSessions) ? state.liveTestSessions : [];
  state.liveTestPlayers = Array.isArray(state.liveTestPlayers) ? state.liveTestPlayers : [];
  state.liveTestAnswers = Array.isArray(state.liveTestAnswers) ? state.liveTestAnswers : [];
  state.liveTestPublicSessions = Array.isArray(state.liveTestPublicSessions) ? state.liveTestPublicSessions : [];
  state.liveTestParticipantResults = Array.isArray(state.liveTestParticipantResults)
    ? state.liveTestParticipantResults
    : [];
  state.testResults = Array.isArray(state.testResults) ? state.testResults : [];
  state.testZoneQuestions = Array.isArray(state.testZoneQuestions) ? state.testZoneQuestions : [];
  state.testZoneResults = Array.isArray(state.testZoneResults) ? state.testZoneResults : [];
  state.testZoneReviewMarks = Array.isArray(state.testZoneReviewMarks) ? state.testZoneReviewMarks : [];
  state.testZoneLiveSessions = Array.isArray(state.testZoneLiveSessions) ? state.testZoneLiveSessions : [];

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

module.exports = {
  buildLegacyCurrentUser,
  buildPlatformSessionPayload,
  buildSessionPayload,
  canAccessAssociateFile,
  canAccessEmailRecord,
  canAccessMemberResource,
  clearRequestSession,
  clearSessionCookie,
  createSessionToken,
  ensureLegacyAccountForDbUser,
  generateLegacyId,
  getAuthenticatedAccount,
  getAuthenticatedDbUser,
  getBearerTokenFromRequest,
  getSessionTokenFromRequest,
  hasLegacyAccountPasswordHash,
  hashLegacyAccountPassword,
  isLegacySha256PasswordHash,
  isScryptPasswordHash,
  listLegacyUsersFromState,
  mapPlatformRoleToLegacyAccountRole,
  mapPlatformRoleToLegacyMemberRole,
  needsPasswordHashUpgrade,
  normalizeCampusAccountRole,
  parseCookies,
  requireAdminAccount,
  requireAdminDbUser,
  requireAuthenticatedAccount,
  requireAuthenticatedDbUser,
  setLegacyAccountPassword,
  setSessionCookie,
  verifyLegacyAccountPassword
};
