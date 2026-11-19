import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const associateRoute = /^\/api\/associates\/files\/([^/?]+)$/;
const noticeRoute = /^\/api\/notices\/(campus|member)\/([^/]+)\/attachments\/([^/]+)$/;
const courseProofRoute = /^\/api\/course-finance\/courses\/([^/]+)\/submissions\/([^/]+)\/proof$/;

function findById(items, id) {
  return Array.isArray(items) ? items.find((item) => item.id === id) : undefined;
}

function embeddedAttachment(state, route) {
  const url = new URL(route, "https://restore.invalid");
  if (url.origin !== "https://restore.invalid") return null;
  const notice = noticeRoute.exec(url.pathname);
  if (notice) {
    const [, kind, noticeId, attachmentId] = notice;
    const notices = kind === "campus" ? state.manualCampusNotices : state.memberNotifications;
    return findById(findById(notices, noticeId)?.attachments, attachmentId);
  }
  const proof = courseProofRoute.exec(url.pathname);
  if (proof) {
    const course = findById(state.courses, decodeURIComponent(proof[1]));
    return findById(course?.enrollmentSubmissions, decodeURIComponent(proof[2]))?.paymentProof;
  }
  if (url.pathname === "/api/campus-groups/attachment") {
    const { searchParams: params } = url;
    const group = findById(state.campusGroups, params.get("groupId"));
    const scope = params.get("moduleId") ? findById(group?.modules, params.get("moduleId")) : group;
    return findById(scope?.[params.get("category")], params.get("entryId"))?.attachment;
  }
  return null;
}

function associateFilename(route) {
  const url = new URL(route, "https://restore.invalid");
  const match = url.origin === "https://restore.invalid" && associateRoute.exec(url.pathname);
  if (!match) return null;
  const name = decodeURIComponent(match[1]);
  assert(name && name !== "." && name !== ".." && !/[\\/\x00-\x1f\x7f]/.test(name), "Nombre de justificante inválido");
  return name;
}

// The original export can contain personal data and auth material. Only the normal SQLite
// storage module is loaded, with an explicit temporary path and no web server or mail worker.
export function restoreVerifiedS3Backup(stateBytes, expected, files, readVerified) {
  const destination = mkdtempSync(join(tmpdir(), "iz-s3-restore-"));
  try {
    const uploads = join(destination, "uploads", "associates");
    mkdirSync(uploads, { recursive: true, mode: 0o700 });
    const snapshot = join(destination, "state.json");
    writeFileSync(snapshot, stateBytes, { flag: "wx", mode: 0o600 });
    const collections = ["members", "associates", "accounts", "courses"];
    assert(collections.every((name) => Array.isArray(expected[name])), "Faltan colecciones esenciales en el estado");

    for (const file of files) {
      const name = associateFilename(file.route);
      if (!name) continue;
      const path = join(uploads, name);
      // Different routes can point to the same file. Every route is checked against its hash below.
      if (!existsSync(path)) writeFileSync(path, readVerified(file), { flag: "wx", mode: 0o600 });
    }

    process.env.IZ_DATA_DIR = destination;
    process.env.NODE_ENV = "test";
    process.env.IZ_AUTOMATIC_BACKUP_INTERVAL_MS = "0";
    const { readState, dbPath } = require("../storage.js");
    assert(dbPath === join(destination, "campus.db"), "SQLite está fuera del destino temporal");
    const state = readState();
    for (const name of collections) {
      assert(state[name].length === expected[name].length &&
        state[name].every((record, index) => record.id === expected[name][index].id &&
          (expected[name][index].role === undefined || record.role === expected[name][index].role)),
      "No coinciden las identidades o roles recuperados");
    }

    const { DatabaseSync } = require("node:sqlite");
    const sqlite = new DatabaseSync(dbPath, { readOnly: true });
    try {
      const checks = sqlite.prepare("PRAGMA integrity_check").all();
      assert(checks.length === 1 && checks[0].integrity_check === "ok", "La SQLite recuperada no pasó integridad");
    } finally {
      sqlite.close();
    }

    for (const file of files) {
      const name = associateFilename(file.route);
      const attachment = name ? null : embeddedAttachment(state, file.route);
      assert(name || attachment?.contentBase64, "No se pudo reconstruir un adjunto desde la SQLite recuperada");
      const bytes = name ? readFileSync(join(uploads, name)) : Buffer.from(attachment.contentBase64, "base64");
      assert(bytes.length === file.size && createHash("sha256").update(bytes).digest("hex") === file.sha256,
        "El tamaño o el SHA-256 de un adjunto recuperado no coincide");
    }
    return { sqliteRestored: true, attachmentsRestored: files.length };
  } catch {
    // Never print state fragments, attachment paths or identifiers from the source data.
    throw new Error("Falló la restauración aislada de estado o adjuntos");
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
}
