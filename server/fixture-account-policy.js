const crypto = require("crypto");
const fixture = require("../data/default-state.json");

// The bundled public fixture is the catalog, never the configurable runtime seed.
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const fixtureEmails = new Set(
  [...(fixture.accounts || []), ...(fixture.members || [])].map((item) => normalizeEmail(item.email)).filter(Boolean)
);
const fixturePasswords = new Set(
  (fixture.accounts || []).map((item) => String(item.password || "").trim()).filter(Boolean)
);
const credentialCache = new Map();
const demoAdminEmail = normalizeEmail(fixture.accounts.find((item) => item.role === "admin")?.email);

function isProduction() {
  return String(process.env.NODE_ENV || "").trim().toLowerCase() === "production";
}

function isFixtureEmail(email) {
  return fixtureEmails.has(normalizeEmail(email));
}

function isFixturePassword(password) {
  return fixturePasswords.has(String(password || "").trim());
}

function hasFixtureCredential(account) {
  const hash = String(account?.passwordHash || account?.password_hash || "").trim();
  if (!hash) return isFixturePassword(account?.password);
  if (credentialCache.has(hash)) return credentialCache.get(hash);
  let matches = false;
  for (const password of fixturePasswords) {
    if (/^[a-f0-9]{64}$/i.test(hash)) {
      matches = crypto.createHash("sha256").update(password).digest("hex") === hash.toLowerCase();
    } else {
      // Legacy state and PostgreSQL use different scrypt encodings.
      const legacy = /^scrypt:([a-f0-9]+):([a-f0-9]+)$/i.exec(hash);
      const postgres = /^([^:]+):([a-f0-9]{128})$/i.exec(hash);
      const parts = legacy || postgres;
      if (parts) {
        const salt = legacy ? Buffer.from(parts[1], "hex") : parts[1];
        const expected = Buffer.from(parts[2], "hex");
        matches = expected.length === 0 ||
          crypto.timingSafeEqual(crypto.scryptSync(password, salt, expected.length), expected);
      }
    }
    if (matches) break;
  }
  // Bound memory and avoid repeating expensive derivations on every session read.
  if (credentialCache.size >= 256) credentialCache.clear();
  credentialCache.set(hash, matches);
  return matches;
}

function canAuthenticateAccount(account) {
  return Boolean(account) && (!isProduction() || (!isFixtureEmail(account.email) && !hasFixtureCredential(account)));
}

module.exports = { canAuthenticateAccount, demoAdminEmail, isFixtureEmail, isFixturePassword, isProduction };
