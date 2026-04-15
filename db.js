const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const { getStorageMeta } = require("./storage");

let pool = null;
let initPromise = null;

function isDatabaseEnabled() {
  return Boolean(String(process.env.DATABASE_URL || "").trim());
}

function getJwtSecret() {
  return String(process.env.JWT_SECRET || process.env.IZ_JWT_SECRET || "").trim();
}

function isTrue(value) {
  return String(value || "").trim().toLowerCase() === "true";
}

function getPostgresSslConfig() {
  const useSsl = isTrue(process.env.DATABASE_SSL);
  if (!useSsl) {
    return false;
  }

  const isProduction = String(process.env.NODE_ENV || "").trim().toLowerCase() === "production";
  const allowSelfSigned = isTrue(process.env.DB_SSL_ALLOW_SELF_SIGNED);

  if (isProduction && allowSelfSigned) {
    throw new Error(
      "Configuracion insegura: DB_SSL_ALLOW_SELF_SIGNED=true no esta permitido en produccion"
    );
  }

  return {
    rejectUnauthorized: allowSelfSigned ? false : true
  };
}

function getPool() {
  if (!isDatabaseEnabled()) {
    return null;
  }

  if (!pool) {
    const connectionString = String(process.env.DATABASE_URL || "").trim();

    pool = new Pool({
      connectionString,
      ssl: getPostgresSslConfig()
    });
  }

  return pool;
}

function getDatabaseMeta() {
  const storageMeta = getStorageMeta();
  return {
    mode: isDatabaseEnabled() ? "postgres" : "sqlite-state",
    databaseUrlConfigured: isDatabaseEnabled(),
    storagePath: storageMeta.dbPath
  };
}

function nowIso() {
  return new Date().toISOString();
}

function generateId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function normalizeRole(role) {
  const normalized = String(role || "socio").trim().toLowerCase();
  if (["admin", "socio", "instructor"].includes(normalized)) {
    return normalized;
  }
  return "socio";
}

function hashPassword(password) {
  const normalizedPassword = String(password || "");
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(normalizedPassword, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const normalizedHash = String(storedHash || "");
  const [salt, hash] = normalizedHash.split(":");
  if (!salt || !hash) {
    return false;
  }
  const candidate = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
}

function sanitizeUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: String(row.id || ""),
    name: String(row.name || ""),
    email: String(row.email || ""),
    role: normalizeRole(row.role),
    status: String(row.status || "active"),
    phone: String(row.phone || ""),
    service: String(row.service || ""),
    memberId: String(row.member_id || row.memberId || ""),
    associateId: String(row.associate_id || row.associateId || ""),
    createdAt: String(row.created_at || row.createdAt || ""),
    updatedAt: String(row.updated_at || row.updatedAt || "")
  };
}

function signAuthToken(user) {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error("JWT_SECRET no configurado");
  }
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: normalizeRole(user.role)
    },
    secret,
    { expiresIn: "7d" }
  );
}

function verifyAuthToken(token) {
  const secret = getJwtSecret();
  if (!secret || !token) {
    return null;
  }

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

async function initDatabase() {
  if (!isDatabaseEnabled()) {
    return { enabled: false };
  }

  if (!initPromise) {
    initPromise = (async () => {
      const db = getPool();
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'socio',
          status TEXT NOT NULL DEFAULT 'active',
          phone TEXT NOT NULL DEFAULT '',
          service TEXT NOT NULL DEFAULT '',
          member_id TEXT NOT NULL DEFAULT '',
          associate_id TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS cursos (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'draft',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS inscripciones (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          curso_id TEXT NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS resultados_test (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          score INTEGER NOT NULL DEFAULT 0,
          total INTEGER NOT NULL DEFAULT 0,
          percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
          answers JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_resultados_test_user_id
        ON resultados_test (user_id, created_at DESC);
      `);

      await seedAdminUser();
      return { enabled: true };
    })();
  }

  return initPromise;
}

async function seedAdminUser() {
  const email = String(process.env.IZ_RECOVERY_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.IZ_RECOVERY_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "").trim();
  const name = String(process.env.ADMIN_NAME || "Administrador Campus").trim();

  if (!email || !password) {
    return;
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return;
  }

  await createUser({
    name,
    email,
    password,
    role: "admin",
    status: "active"
  });
}

async function findUserByEmail(email) {
  if (!isDatabaseEnabled()) {
    return null;
  }
  const db = getPool();
  const result = await db.query(`SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`, [
    String(email || "").trim()
  ]);
  return sanitizeUser(result.rows[0]);
}

async function findUserRecordByEmail(email) {
  if (!isDatabaseEnabled()) {
    return null;
  }
  const db = getPool();
  const result = await db.query(`SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`, [
    String(email || "").trim()
  ]);
  return result.rows[0] || null;
}

async function findUserById(userId) {
  if (!isDatabaseEnabled()) {
    return null;
  }
  const db = getPool();
  const result = await db.query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [String(userId || "")]);
  return sanitizeUser(result.rows[0]);
}

async function listUsers() {
  if (!isDatabaseEnabled()) {
    return [];
  }
  const db = getPool();
  const result = await db.query(`
    SELECT * FROM users
    ORDER BY LOWER(name) ASC, created_at ASC
  `);
  return result.rows.map(sanitizeUser);
}

async function createUser({ name, email, password, role = "socio", status = "active", phone = "", service = "", memberId = "", associateId = "" }) {
  if (!isDatabaseEnabled()) {
    throw new Error("Base de datos no configurada");
  }

  const normalizedName = String(name || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "").trim();

  if (!normalizedName) {
    throw new Error("El nombre es obligatorio");
  }
  if (!normalizedEmail) {
    throw new Error("El email es obligatorio");
  }
  if (!normalizedPassword) {
    throw new Error("La contraseña es obligatoria");
  }

  const db = getPool();
  const createdAt = nowIso();
  const result = await db.query(
    `
      INSERT INTO users (
        id, name, email, password_hash, role, status, phone, service, member_id, associate_id, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `,
    [
      generateId("user"),
      normalizedName,
      normalizedEmail,
      hashPassword(normalizedPassword),
      normalizeRole(role),
      String(status || "active"),
      String(phone || ""),
      String(service || ""),
      String(memberId || ""),
      String(associateId || ""),
      createdAt,
      createdAt
    ]
  );

  return sanitizeUser(result.rows[0]);
}

async function updateUser(userId, updates = {}) {
  if (!isDatabaseEnabled()) {
    throw new Error("Base de datos no configurada");
  }

  const existing = await findUserRecordById(userId);
  if (!existing) {
    throw new Error("Usuario no encontrado");
  }

  const nextName = String(updates.name ?? existing.name ?? "").trim();
  const nextEmail = String(updates.email ?? existing.email ?? "").trim().toLowerCase();
  const nextRole = normalizeRole(updates.role ?? existing.role);
  const nextStatus = String(updates.status ?? existing.status ?? "active");
  const nextPhone = String(updates.phone ?? existing.phone ?? "");
  const nextService = String(updates.service ?? existing.service ?? "");
  const nextMemberId = String(updates.memberId ?? existing.member_id ?? "");
  const nextAssociateId = String(updates.associateId ?? existing.associate_id ?? "");
  const nextUpdatedAt = nowIso();
  const nextPasswordHash =
    typeof updates.password === "string" && updates.password.trim()
      ? hashPassword(updates.password.trim())
      : existing.password_hash;

  const db = getPool();
  const result = await db.query(
    `
      UPDATE users
      SET name = $2,
          email = $3,
          password_hash = $4,
          role = $5,
          status = $6,
          phone = $7,
          service = $8,
          member_id = $9,
          associate_id = $10,
          updated_at = $11
      WHERE id = $1
      RETURNING *
    `,
    [
      String(userId || ""),
      nextName,
      nextEmail,
      nextPasswordHash,
      nextRole,
      nextStatus,
      nextPhone,
      nextService,
      nextMemberId,
      nextAssociateId,
      nextUpdatedAt
    ]
  );

  return sanitizeUser(result.rows[0]);
}

async function findUserRecordById(userId) {
  if (!isDatabaseEnabled()) {
    return null;
  }
  const db = getPool();
  const result = await db.query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [String(userId || "")]);
  return result.rows[0] || null;
}

async function authenticateUser(email, password) {
  if (!isDatabaseEnabled()) {
    return null;
  }

  const userRecord = await findUserRecordByEmail(email);
  if (!userRecord) {
    return null;
  }
  if (!verifyPassword(password, userRecord.password_hash)) {
    return null;
  }
  return sanitizeUser(userRecord);
}

async function saveTestResult({ userId, score = 0, total = 0, percentage = 0, answers = [] }) {
  if (!isDatabaseEnabled()) {
    throw new Error("Base de datos no configurada");
  }

  const db = getPool();
  const result = await db.query(
    `
      INSERT INTO resultados_test (id, user_id, score, total, percentage, answers, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,
    [
      generateId("test-result"),
      String(userId || ""),
      Number(score || 0),
      Number(total || 0),
      Number(percentage || 0),
      JSON.stringify(Array.isArray(answers) ? answers : []),
      nowIso()
    ]
  );
  return normalizeTestResult(result.rows[0]);
}

async function listTestResultsForUser(userId) {
  if (!isDatabaseEnabled()) {
    return [];
  }
  const db = getPool();
  const result = await db.query(
    `
      SELECT * FROM resultados_test
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [String(userId || "")]
  );
  return result.rows.map(normalizeTestResult);
}

function normalizeTestResult(row) {
  if (!row) {
    return null;
  }
  return {
    id: String(row.id || ""),
    userId: String(row.user_id || row.userId || ""),
    score: Number(row.score || 0),
    total: Number(row.total || 0),
    percentage: Number(row.percentage || 0),
    answers: Array.isArray(row.answers)
      ? row.answers
      : typeof row.answers === "string"
        ? safeJsonParse(row.answers, [])
        : row.answers || [],
    createdAt: String(row.created_at || row.createdAt || "")
  };
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

module.exports = {
  authenticateUser,
  createUser,
  findUserByEmail,
  findUserById,
  getDatabaseMeta,
  getPool,
  hashPassword,
  initDatabase,
  isDatabaseEnabled,
  listTestResultsForUser,
  listUsers,
  normalizeRole,
  sanitizeUser,
  saveTestResult,
  signAuthToken,
  updateUser,
  verifyAuthToken
};
