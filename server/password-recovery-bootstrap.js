const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const storage = require("../storage");
const auth = require("./auth");
const dbApi = require("../db");
const { appendAuditEvent } = require("./audit-log");
const { getMailSettings, isMailReady, sendMail } = require("./mail-delivery");
const { sendJson } = require("./http");

const RESET_TTL_MS = 30 * 60 * 1000;
const REQUEST_WINDOW_MS = 60 * 60 * 1000;
const REQUEST_LIMIT_PER_EMAIL = 3;
const REQUEST_LIMIT_PER_IP = 8;
const RESET_LIMIT_PER_IP = 12;
const GENERIC_REQUEST_MESSAGE =
  "Si existe una cuenta con ese correo, recibirás un enlace para crear una nueva contraseña.";
const publicDir = path.join(__dirname, "..", "public");
const appJsPath = path.join(publicDir, "app.js");

const requestBuckets = new Map();
const trackedSessions = new Map();
const legacyInvalidAfter = new Map();
const dbInvalidAfter = new Map();
let installed = false;

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function safeIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || String(req.socket?.remoteAddress || "unknown");
}

function consumeRateLimit(key, limit, windowMs = REQUEST_WINDOW_MS) {
  const now = Date.now();
  const current = requestBuckets.get(key);
  if (!current || current.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  current.count += 1;
  return current.count > limit;
}

async function readJsonBody(req, maxBytes = 16 * 1024) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > maxBytes) throw new Error("Solicitud demasiado grande");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("Solicitud no válida");
  }
}

function openResetDatabase() {
  const dataDir = path.resolve(String(process.env.IZ_DATA_DIR || "").trim() || "/data");
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, "campus.db"));
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token_hash TEXT PRIMARY KEY,
      email_hash TEXT NOT NULL,
      legacy_account_id TEXT NOT NULL DEFAULT '',
      db_user_id TEXT NOT NULL DEFAULT '',
      expires_at INTEGER NOT NULL,
      used_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_password_reset_email_hash
      ON password_reset_tokens(email_hash, created_at DESC);
  `);
  return db;
}

const resetDb = openResetDatabase();

function findResetRecord(token) {
  const tokenHash = sha256(token);
  return resetDb
    .prepare(`
      SELECT token_hash AS tokenHash,
             email_hash AS emailHash,
             legacy_account_id AS legacyAccountId,
             db_user_id AS dbUserId,
             expires_at AS expiresAt,
             used_at AS usedAt,
             created_at AS createdAt
      FROM password_reset_tokens
      WHERE token_hash = ?
      LIMIT 1
    `)
    .get(tokenHash);
}

function isResetRecordUsable(record) {
  return Boolean(record && !record.usedAt && Number(record.expiresAt) > Date.now());
}

function invalidateEarlierResetTokens(emailHash, usedAt = Date.now()) {
  resetDb
    .prepare("UPDATE password_reset_tokens SET used_at = ? WHERE email_hash = ? AND used_at IS NULL")
    .run(usedAt, emailHash);
}

function buildResetUrl(token) {
  const fallback = `http://localhost:${process.env.PORT || 3210}`;
  const baseUrl = String(process.env.IZ_BASE_URL || fallback).trim().replace(/\/+$/, "");
  const url = new URL(baseUrl || fallback);
  url.pathname = "/";
  url.search = "";
  url.searchParams.set("reset", token);
  return url.toString();
}

function appendPrivateTestOutbox(message) {
  const target = String(process.env.IZ_PASSWORD_RESET_TEST_OUTBOX || "").trim();
  if (!target) return false;
  let entries = [];
  try {
    entries = JSON.parse(fs.readFileSync(target, "utf8"));
    if (!Array.isArray(entries)) entries = [];
  } catch {}
  entries.push({
    to: String(message.to || ""),
    subject: String(message.subject || ""),
    text: String(message.text || ""),
    at: new Date().toISOString()
  });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(entries, null, 2));
  return true;
}

async function deliverResetEmail(state, email, token, tokenHash) {
  const resetUrl = buildResetUrl(token);
  const message = {
    from: "",
    fromName: "",
    to: email,
    subject: "Recupera tu acceso · Isócrona Zero",
    text: [
      "Has solicitado crear una nueva contraseña para el Portal Socios de Isócrona Zero.",
      "",
      "Pulsa o copia este enlace:",
      resetUrl,
      "",
      "El enlace es válido durante 30 minutos y solo puede utilizarse una vez.",
      "Si no has solicitado este cambio, puedes ignorar este correo."
    ].join("\n"),
    deliveryId: `password-reset-${tokenHash.slice(0, 24)}`
  };

  if (appendPrivateTestOutbox(message)) return;

  const settings = getMailSettings(state);
  if (!isMailReady(settings)) {
    throw new Error("El correo saliente no está disponible");
  }
  message.from = settings.fromEmail;
  message.fromName = settings.fromName;
  await sendMail(settings, message);
}

function auditPasswordEvent(state, account, action) {
  if (!state || !account) return;
  appendAuditEvent(state, {
    actor: { name: "Recuperación de acceso", role: "system" },
    module: "auth",
    entityType: "account",
    entityId: String(account.id || ""),
    entityLabel: String(account.email || ""),
    action,
    metadata: { channel: "email" }
  });
}

async function requestPasswordReset(req, res) {
  const ip = safeIp(req);
  if (consumeRateLimit(`password-reset-request:ip:${ip}`, REQUEST_LIMIT_PER_IP)) {
    sendJson(res, 429, { ok: false, error: "Demasiados intentos. Prueba de nuevo más tarde." });
    return true;
  }

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error.message });
    return true;
  }

  const email = cleanEmail(payload.email);
  const emailHash = sha256(email);
  if (consumeRateLimit(`password-reset-request:email:${emailHash}`, REQUEST_LIMIT_PER_EMAIL)) {
    sendJson(res, 429, { ok: false, error: "Demasiados intentos. Prueba de nuevo más tarde." });
    return true;
  }

  const state = storage.readState();
  const legacyAccount = (state.accounts || []).find((item) => cleanEmail(item.email) === email) || null;
  let dbUser = null;
  if (email && dbApi.isDatabaseEnabled()) {
    try {
      dbUser = await dbApi.findUserByEmail(email);
    } catch {
      dbUser = null;
    }
  }

  if (!email || (!legacyAccount && !dbUser)) {
    sendJson(res, 200, { ok: true, message: GENERIC_REQUEST_MESSAGE });
    return true;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(token);
  const now = Date.now();
  invalidateEarlierResetTokens(emailHash, now);
  resetDb
    .prepare(`
      INSERT INTO password_reset_tokens
        (token_hash, email_hash, legacy_account_id, db_user_id, expires_at, used_at, created_at)
      VALUES (?, ?, ?, ?, ?, NULL, ?)
    `)
    .run(tokenHash, emailHash, legacyAccount?.id || "", dbUser?.id || "", now + RESET_TTL_MS, now);

  try {
    await deliverResetEmail(state, email, token, tokenHash);
    if (legacyAccount) {
      // Mail delivery is asynchronous: never persist the pre-delivery snapshot.
      // Another request may have updated courses, payments or accounts meanwhile.
      const latestState = storage.readState();
      const currentAccount = (latestState.accounts || []).find((item) => item.id === legacyAccount.id);
      if (currentAccount) {
        auditPasswordEvent(latestState, currentAccount, "password-reset-requested");
        storage.writeState(latestState);
      }
    }
  } catch (error) {
    resetDb.prepare("UPDATE password_reset_tokens SET used_at = ? WHERE token_hash = ?").run(Date.now(), tokenHash);
    console.warn("No se pudo entregar un correo de recuperación de contraseña:", String(error?.message || error));
  }

  sendJson(res, 200, { ok: true, message: GENERIC_REQUEST_MESSAGE });
  return true;
}

async function validatePasswordReset(req, res, requestUrl) {
  const token = String(requestUrl.searchParams.get("token") || "").trim();
  const record = token ? findResetRecord(token) : null;
  sendJson(res, 200, { ok: true, valid: isResetRecordUsable(record) });
  return true;
}

async function completePasswordReset(req, res) {
  const ip = safeIp(req);
  if (consumeRateLimit(`password-reset-complete:ip:${ip}`, RESET_LIMIT_PER_IP)) {
    sendJson(res, 429, { ok: false, error: "Demasiados intentos. Prueba de nuevo más tarde." });
    return true;
  }

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error.message });
    return true;
  }

  const token = String(payload.token || "").trim();
  const newPassword = String(payload.newPassword || "");
  const confirmPassword = String(payload.confirmPassword || "");
  const record = token ? findResetRecord(token) : null;

  if (!isResetRecordUsable(record)) {
    sendJson(res, 400, { ok: false, error: "El enlace ha caducado o ya ha sido utilizado." });
    return true;
  }
  if (newPassword.length < 8) {
    sendJson(res, 400, { ok: false, error: "La nueva contraseña debe tener al menos 8 caracteres." });
    return true;
  }
  if (newPassword !== confirmPassword) {
    sendJson(res, 400, { ok: false, error: "Las contraseñas no coinciden." });
    return true;
  }

  const resetAt = Date.now();
  // Claim the one-time token synchronously before any asynchronous password update.
  // SQLite serializes this conditional UPDATE, so only one concurrent request can proceed.
  const claim = resetDb.prepare(
    "UPDATE password_reset_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?"
  ).run(resetAt, record.tokenHash, resetAt);
  if (claim.changes !== 1) {
    sendJson(res, 400, { ok: false, error: "El enlace ha caducado o ya ha sido utilizado." });
    return true;
  }
  const state = storage.readState();
  const legacyAccount = record.legacyAccountId
    ? (state.accounts || []).find((item) => item.id === record.legacyAccountId) || null
    : null;

  try {
    if (record.dbUserId && dbApi.isDatabaseEnabled()) {
      await dbApi.updateUser(record.dbUserId, { password: newPassword });
      dbInvalidAfter.set(record.dbUserId, resetAt);
    }

    if (legacyAccount) {
      auth.setLegacyAccountPassword(legacyAccount, newPassword);
      legacyAccount.mustChangePassword = false;
      const associate = legacyAccount.associateId
        ? (state.associates || []).find((item) => item.id === legacyAccount.associateId)
        : null;
      if (associate) associate.temporaryPassword = "";
      auditPasswordEvent(state, legacyAccount, "password-reset-completed");
      storage.writeState(state);
      legacyInvalidAfter.set(legacyAccount.id, resetAt);
    }

    invalidateEarlierResetTokens(record.emailHash, resetAt);
  } catch (error) {
    console.error("No se pudo completar una recuperación de contraseña:", String(error?.message || error));
    sendJson(res, 500, { ok: false, error: "No se pudo actualizar la contraseña. Prueba de nuevo." });
    return true;
  }

  sendJson(res, 200, { ok: true, message: "Contraseña actualizada. Ya puedes iniciar sesión." });
  return true;
}

async function handlePasswordRecoveryRequest(req, res) {
  let requestUrl;
  try {
    requestUrl = new URL(req.url || "/", "http://localhost");
  } catch {
    return false;
  }

  if (requestUrl.pathname === "/api/password-recovery/request" && req.method === "POST") {
    return requestPasswordReset(req, res);
  }
  if (requestUrl.pathname === "/api/password-recovery/validate" && req.method === "GET") {
    return validatePasswordReset(req, res, requestUrl);
  }
  if (requestUrl.pathname === "/api/password-recovery/reset" && req.method === "POST") {
    return completePasswordReset(req, res);
  }
  if (requestUrl.pathname === "/app.js" && req.method === "GET") {
    const source = fs.readFileSync(appJsPath, "utf8");
    const body = `import "./password-recovery.js";\n${source}`;
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.end(body);
    return true;
  }
  return false;
}

function patchSessionInvalidation() {
  const originalCreateSessionToken = auth.createSessionToken;
  const originalGetAuthenticatedAccount = auth.getAuthenticatedAccount;
  const originalGetAuthenticatedDbUser = auth.getAuthenticatedDbUser;

  auth.createSessionToken = function createTrackedSession(account, rememberMe = false) {
    const token = originalCreateSessionToken(account, rememberMe);
    trackedSessions.set(token, { accountId: account.id, createdAt: Date.now() });
    return token;
  };

  auth.getAuthenticatedAccount = function getResetAwareAccount(req, state) {
    const account = originalGetAuthenticatedAccount(req, state);
    if (!account) return null;
    const invalidAfter = legacyInvalidAfter.get(account.id);
    if (!invalidAfter) return account;
    const token = auth.getSessionTokenFromRequest(req);
    const tracked = trackedSessions.get(token);
    if (tracked && tracked.accountId === account.id && tracked.createdAt <= invalidAfter) {
      auth.clearRequestSession(req);
      trackedSessions.delete(token);
      return null;
    }
    return account;
  };

  auth.requireAuthenticatedAccount = function requireResetAwareAccount(req, res, state) {
    const account = auth.getAuthenticatedAccount(req, state);
    if (!account) {
      sendJson(res, 401, { ok: false, error: "Inicia sesion para acceder al campus" });
      return null;
    }
    return account;
  };

  auth.requireAdminAccount = function requireResetAwareAdmin(req, res, state) {
    const account = auth.requireAuthenticatedAccount(req, res, state);
    if (!account) return null;
    if (account.role !== "admin") {
      sendJson(res, 403, { ok: false, error: "Esta accion esta reservada a administracion" });
      return null;
    }
    return account;
  };

  auth.requireLiveHostAccount = function requireResetAwareLiveHost(req, res, state) {
    const account = auth.requireAuthenticatedAccount(req, res, state);
    if (!account) return null;
    if (!auth.canHostPublicLive(account)) {
      sendJson(res, 403, { ok: false, error: "Solo administracion o instructores pueden dirigir tests en vivo" });
      return null;
    }
    return account;
  };

  auth.getAuthenticatedDbUser = async function getResetAwareDbUser(req) {
    const user = await originalGetAuthenticatedDbUser(req);
    if (!user) return null;
    const invalidAfter = dbInvalidAfter.get(user.id);
    if (!invalidAfter) return user;
    const payload = dbApi.verifyAuthToken(auth.getBearerTokenFromRequest(req));
    const issuedAt = Number(payload?.iat || 0) * 1000;
    return issuedAt && issuedAt > invalidAfter ? user : null;
  };

  auth.requireAuthenticatedDbUser = async function requireResetAwareDbUser(req, res) {
    const user = await auth.getAuthenticatedDbUser(req);
    if (!user) {
      sendJson(res, 401, { ok: false, error: "Inicia sesion para continuar" });
      return null;
    }
    return user;
  };

  auth.requireAdminDbUser = async function requireResetAwareAdminDb(req, res) {
    const user = await auth.requireAuthenticatedDbUser(req, res);
    if (!user) return null;
    if (dbApi.normalizeRole(user.role) !== "admin") {
      sendJson(res, 403, { ok: false, error: "Esta accion esta reservada a administracion" });
      return null;
    }
    return user;
  };
}

function patchHttpServer() {
  const originalCreateServer = http.createServer;
  http.createServer = function createPasswordRecoveryServer(options, requestListener) {
    const hasOptions = typeof options !== "function";
    const listener = hasOptions ? requestListener : options;
    if (typeof listener !== "function") {
      return originalCreateServer.apply(http, arguments);
    }
    const wrapped = async (req, res) => {
      try {
        if (await handlePasswordRecoveryRequest(req, res)) return;
      } catch (error) {
        console.error("Fallo controlado en recuperación de contraseña:", String(error?.message || error));
        if (!res.headersSent) sendJson(res, 500, { ok: false, error: "No se pudo procesar la solicitud." });
        else res.end();
        return;
      }
      return listener(req, res);
    };
    return hasOptions ? originalCreateServer.call(http, options, wrapped) : originalCreateServer.call(http, wrapped);
  };
}

function installPasswordRecovery() {
  if (installed) return;
  installed = true;
  patchSessionInvalidation();
  patchHttpServer();
}

module.exports = {
  GENERIC_REQUEST_MESSAGE,
  RESET_TTL_MS,
  installPasswordRecovery
};
