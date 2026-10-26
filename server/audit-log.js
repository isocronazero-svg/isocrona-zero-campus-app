const { randomUUID } = require("node:crypto");

const MAX_AUDIT_EVENTS = 5000;
const MAX_OBJECT_DEPTH = 5;
const SENSITIVE_KEY = /(password|secret|token|authorization|cookie|contentbase64|smtp|credential|hash)$/i;

function clean(value) {
  return String(value || "").trim();
}

function sanitizeAuditValue(value, depth = 0, key = "") {
  if (SENSITIVE_KEY.test(key)) return "[redacted]";
  if (value === null || value === undefined) return value ?? null;
  if (depth >= MAX_OBJECT_DEPTH) return "[max-depth]";
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitizeAuditValue(item, depth + 1));
  if (typeof value === "object") {
    const result = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      if (SENSITIVE_KEY.test(childKey)) result[childKey] = "[redacted]";
      else result[childKey] = sanitizeAuditValue(childValue, depth + 1, childKey);
    }
    return result;
  }
  if (typeof value === "string") return value.length > 1000 ? `${value.slice(0, 1000)}…` : value;
  if (["number", "boolean"].includes(typeof value)) return value;
  return String(value);
}

function normalizeActor(account = {}, fallback = {}) {
  return {
    accountId: clean(account.id || fallback.accountId),
    memberId: clean(account.memberId || fallback.memberId),
    associateId: clean(account.associateId || fallback.associateId),
    name: clean(account.name || fallback.name || "Sistema"),
    role: clean(account.role || fallback.role || "system")
  };
}

function appendAuditEvent(state, event = {}) {
  if (!state || typeof state !== "object") return null;
  const entry = {
    id: event.id || `audit-${randomUUID()}`,
    at: event.at || new Date().toISOString(),
    actor: normalizeActor(event.account, event.actor),
    module: clean(event.module || "general"),
    entityType: clean(event.entityType || "record"),
    entityId: clean(event.entityId),
    entityLabel: clean(event.entityLabel),
    action: clean(event.action || "update"),
    result: clean(event.result || "success"),
    before: sanitizeAuditValue(event.before ?? null),
    after: sanitizeAuditValue(event.after ?? null),
    metadata: sanitizeAuditValue(event.metadata ?? {})
  };
  state.auditLog = Array.isArray(state.auditLog) ? state.auditLog : [];
  state.auditLog.unshift(entry);
  if (state.auditLog.length > MAX_AUDIT_EVENTS) state.auditLog.length = MAX_AUDIT_EVENTS;
  return entry;
}

function listAuditEvents(state, filters = {}) {
  const user = clean(filters.user).toLowerCase();
  const moduleName = clean(filters.module).toLowerCase();
  const action = clean(filters.action).toLowerCase();
  const entity = clean(filters.entity).toLowerCase();
  const courseId = clean(filters.courseId);
  const from = clean(filters.from);
  const to = clean(filters.to);
  const limit = Math.max(1, Math.min(500, Number(filters.limit || 200)));
  return (Array.isArray(state?.auditLog) ? state.auditLog : [])
    .filter((entry) => !user || [entry.actor?.name, entry.actor?.accountId].some((value) => clean(value).toLowerCase().includes(user)))
    .filter((entry) => !moduleName || clean(entry.module).toLowerCase() === moduleName)
    .filter((entry) => !action || clean(entry.action).toLowerCase() === action)
    .filter((entry) => !entity || [entry.entityId, entry.entityLabel, entry.entityType].some((value) => clean(value).toLowerCase().includes(entity)))
    .filter((entry) => !courseId || entry.metadata?.courseId === courseId || (entry.entityType === "course" && entry.entityId === courseId))
    .filter((entry) => !from || clean(entry.at) >= from)
    .filter((entry) => !to || clean(entry.at) <= to)
    .slice(0, limit)
    .map((entry) => sanitizeAuditValue(entry));
}

function createAuditLogHandler(deps) {
  return async function handle(req, res, url) {
    if (url.pathname !== "/api/audit-log") return false;
    const state = deps.readState();
    const account = deps.requireAuthenticatedAccount(req, res, state);
    if (!account) return true;
    if (account.role !== "admin") {
      deps.sendJson(res, 403, { ok: false, error: "El registro de auditoria esta reservado a administracion" });
      return true;
    }
    if (req.method !== "GET") {
      deps.sendJson(res, 405, { ok: false, error: "El registro de auditoria es de solo lectura" });
      return true;
    }
    const events = listAuditEvents(state, {
      user: url.searchParams.get("user"),
      module: url.searchParams.get("module"),
      action: url.searchParams.get("action"),
      entity: url.searchParams.get("entity"),
      courseId: url.searchParams.get("courseId"),
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
      limit: url.searchParams.get("limit")
    });
    deps.sendJson(res, 200, {
      ok: true,
      events,
      totalStored: Array.isArray(state.auditLog) ? state.auditLog.length : 0,
      maxStored: MAX_AUDIT_EVENTS
    });
    return true;
  };
}

module.exports = {
  MAX_AUDIT_EVENTS,
  appendAuditEvent,
  createAuditLogHandler,
  listAuditEvents,
  sanitizeAuditValue
};
