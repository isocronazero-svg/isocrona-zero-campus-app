import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  clearRequestSession,
  createSessionToken,
  getAuthenticatedAccount,
  setLegacyAccountPassword,
  setSessionCookie,
  verifyLegacyAccountPassword
} = require("../server/auth");

function createResponseRecorder() {
  return {
    headers: {},
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    }
  };
}

function createRequestWithSession(token) {
  return {
    headers: {
      cookie: `iz_session=${encodeURIComponent(token)}`
    }
  };
}

const originalBaseUrl = process.env.IZ_BASE_URL;
const originalNodeEnv = process.env.NODE_ENV;

try {
  delete process.env.IZ_BASE_URL;
  process.env.NODE_ENV = "test";

  const account = {
    id: "account-auth-check",
    name: "Auth Check",
    email: "auth-check@example.com",
    role: "member",
    memberId: "member-auth-check",
    associateId: "associate-auth-check"
  };
  const state = {
    accounts: [account],
    associates: [{ id: "associate-auth-check", status: "Alta" }]
  };
  const token = createSessionToken(account);
  const req = createRequestWithSession(token);

  assert.equal(getAuthenticatedAccount(req, state)?.id, account.id, "session should resolve the account");

  const res = createResponseRecorder();
  setSessionCookie(res, token);
  assert.match(res.headers["set-cookie"], /^iz_session=/, "session cookie should be written");
  assert.match(res.headers["set-cookie"], /HttpOnly/, "session cookie should stay HttpOnly");
  assert.match(res.headers["set-cookie"], /SameSite=Lax/, "session cookie should keep SameSite=Lax");
  assert.doesNotMatch(res.headers["set-cookie"], /; Secure/, "local test session cookie should not be Secure");

  clearRequestSession(req);
  assert.equal(getAuthenticatedAccount(req, state), null, "cleared session should not authenticate");

  const legacyAccount = { password: "temporal", passwordHash: "" };
  assert.equal(verifyLegacyAccountPassword(legacyAccount, "temporal"), true, "legacy plain password should verify");
  setLegacyAccountPassword(legacyAccount, "nueva-contrasena");
  assert.equal(legacyAccount.password, "", "legacy plain password should be cleared after hashing");
  assert.match(legacyAccount.passwordHash, /^scrypt:/, "new legacy password hash should use scrypt");
  assert.equal(
    verifyLegacyAccountPassword(legacyAccount, "nueva-contrasena"),
    true,
    "scrypt password should verify"
  );
} finally {
  if (originalBaseUrl === undefined) {
    delete process.env.IZ_BASE_URL;
  } else {
    process.env.IZ_BASE_URL = originalBaseUrl;
  }

  if (originalNodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalNodeEnv;
  }
}

console.log("Auth utility regression check passed.");
