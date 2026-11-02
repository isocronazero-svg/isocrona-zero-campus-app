const crypto = require("node:crypto");
const auth = require("./auth");
const { canAuthenticateAccount } = require("./fixture-account-policy");
const { sendJson } = require("./http");

const ephemeralSessions = new Map();
let installed = false;

function credentialHash(account) {
  return crypto
    .createHash("sha256")
    .update(String(account?.passwordHash || account?.password || ""))
    .digest("hex");
}

function installSessionCredentialGuard() {
  if (installed) return;
  installed = true;

  const previousCreateSessionToken = auth.createSessionToken;
  const previousGetAuthenticatedAccount = auth.getAuthenticatedAccount;
  const previousClearRequestSession = auth.clearRequestSession;

  auth.createSessionToken = function createCredentialBoundSession(account, rememberMe = false) {
    if (rememberMe === true) return previousCreateSessionToken(account, true);
    if (!canAuthenticateAccount(account)) throw new Error("Credenciales invalidas");
    const token = `izs_${crypto.randomBytes(32).toString("hex")}`;
    ephemeralSessions.set(token, {
      accountId: account.id,
      credentialHash: credentialHash(account),
      createdAt: Date.now()
    });
    return token;
  };

  auth.clearRequestSession = function clearCredentialBoundSession(req) {
    const token = auth.getSessionTokenFromRequest(req);
    if (token && ephemeralSessions.has(token)) {
      ephemeralSessions.delete(token);
      return;
    }
    previousClearRequestSession(req);
  };

  auth.getAuthenticatedAccount = function getCredentialBoundAccount(req, state) {
    const token = auth.getSessionTokenFromRequest(req);
    const session = token ? ephemeralSessions.get(token) : null;
    if (!session) return previousGetAuthenticatedAccount(req, state);

    const account = (state.accounts || []).find(item => item.id === session.accountId) || null;
    if (!canAuthenticateAccount(account) || credentialHash(account) !== session.credentialHash) {
      ephemeralSessions.delete(token);
      return null;
    }

    const associate = account.associateId
      ? (state.associates || []).find(item => item.id === account.associateId)
      : null;
    if (associate && associate.status === "Baja") {
      ephemeralSessions.delete(token);
      return null;
    }
    return account;
  };

  auth.requireAuthenticatedAccount = function requireCredentialBoundAccount(req, res, state) {
    const account = auth.getAuthenticatedAccount(req, state);
    if (!account) {
      sendJson(res, 401, { ok: false, error: "Inicia sesion para acceder al campus" });
      return null;
    }
    return account;
  };

  auth.requireAdminAccount = function requireCredentialBoundAdmin(req, res, state) {
    const account = auth.requireAuthenticatedAccount(req, res, state);
    if (!account) return null;
    if (account.role !== "admin") {
      sendJson(res, 403, { ok: false, error: "Esta accion esta reservada a administracion" });
      return null;
    }
    return account;
  };

  auth.requireLiveHostAccount = function requireCredentialBoundLiveHost(req, res, state) {
    const account = auth.requireAuthenticatedAccount(req, res, state);
    if (!account) return null;
    if (!auth.canHostPublicLive(account)) {
      sendJson(res, 403, { ok: false, error: "Solo administracion o instructores pueden dirigir tests en vivo" });
      return null;
    }
    return account;
  };
}

module.exports = { installSessionCredentialGuard };
