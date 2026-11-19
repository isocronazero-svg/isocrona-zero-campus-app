import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { mkdtempSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./verify-s3-backup-offline.mjs", import.meta.url));
const directory = mkdtempSync(join(tmpdir(), "iz-s3-verify-"));
const key = randomBytes(32);
const key64 = key.toString("base64");
const proof = Buffer.from("SYNTHETIC-ATTACHMENT");
const groupBytes = Buffer.from("SYNTHETIC-GROUP-ATTACHMENT");
const state = Buffer.from(JSON.stringify({
  accounts: [{ id: "account-test", role: "admin" }],
  members: [{ id: "member-test" }],
  associates: [{ id: "associate-test", proofFile: "fake" }],
  courses: [{ id: "course-test" }],
  campusGroups: [{
    id: "test-group",
    documents: [{ id: "test-entry", attachment: { name: "test.pdf", contentBase64: groupBytes.toString("base64") } }]
  }]
}));
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
function encrypt(bytes) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return Buffer.concat([Buffer.from([73,90,66,75,50,0]), iv, body, cipher.getAuthTag()]);
}
const manifest = {
  format: "isocrona-campus-backup-v2",
  state: { file: "state.json.aes256gcm", size: state.length, sha256: sha256(state) },
  files: [
    { slot: "file-0001.bin.aes256gcm", route: "/api/associates/files/fake", size: proof.length, sha256: sha256(proof) },
    { slot: "file-0002.bin.aes256gcm", route: "/api/campus-groups/attachment?groupId=test-group&category=documents&entryId=test-entry", size: groupBytes.length, sha256: sha256(groupBytes) }
  ],
  missingReferencedFiles: []
};
const manifestPath = join(directory, "manifest.json.aes256gcm");
const statePath = join(directory, "state.json.aes256gcm");
const attachmentPath = join(directory, "file-0001.bin.aes256gcm");
function run(...args) {
  return spawnSync(process.execPath, [script, directory, ...args], {
    env: { ...process.env, BACKUP_AES_KEY_B64: key64, TMPDIR: directory },
    encoding: "utf8"
  });
}
try {
  writeFileSync(statePath, encrypt(state));
  writeFileSync(attachmentPath, encrypt(proof));
  writeFileSync(join(directory, manifest.files[1].slot), encrypt(groupBytes));
  writeFileSync(manifestPath, encrypt(Buffer.from(JSON.stringify(manifest))));
  const good = run();
  assert.equal(good.status, 0, good.stderr);
  const expected = { ok: true, attachmentsVerified: 2, plaintextBytesVerified: state.length + proof.length + groupBytes.length };
  assert.deepEqual(JSON.parse(good.stdout), expected);
  const restored = run("--restore");
  assert.equal(restored.status, 0, restored.stderr);
  assert.deepEqual(JSON.parse(restored.stdout), { ...expected, sqliteRestored: true, attachmentsRestored: 2 });
  assert.ok(!readdirSync(directory).some((name) => name.startsWith("iz-s3-restore-")));
  const broken = encrypt(Buffer.from("ALTERED-ATTACHMENT"));
  writeFileSync(attachmentPath, broken);
  const bad = run();
  assert.notEqual(bad.status, 0, "Must reject an altered attachment");
  assert.match(bad.stderr, /SHA incorrecto|Tamaño incorrecto/);
  writeFileSync(attachmentPath, encrypt(proof));
  const wrongKey = spawnSync(process.execPath, [script, directory], { env: { ...process.env, BACKUP_AES_KEY_B64: randomBytes(32).toString("base64") }, encoding: "utf8" });
  assert.notEqual(wrongKey.status, 0, "Must reject an incorrect key");
  const incompleteManifest = {
    ...manifest,
    missingReferencedFiles: [{ route: "/api/associates/files/missing", status: 404 }]
  };
  writeFileSync(manifestPath, encrypt(Buffer.from(JSON.stringify(incompleteManifest))));
  const incomplete = run();
  assert.notEqual(incomplete.status, 0, "Must reject an authenticated manifest with missing attachments");
  assert.match(incomplete.stderr, /no se pudieron copiar/);
  assert.doesNotMatch(incomplete.stderr, /associates\/files\/missing/);

  writeFileSync(manifestPath, encrypt(Buffer.from(JSON.stringify({ ...manifest, missingReferencedFiles: undefined }))));
  const unchecked = run();
  assert.notEqual(unchecked.status, 0, "Must reject a manifest without a missing-attachment inventory");
  assert.match(unchecked.stderr, /no informa de adjuntos faltantes/);

  const mismatched = { ...manifest, files: [manifest.files[0], { ...manifest.files[1], route: "/api/campus-groups/attachment?groupId=missing" }] };
  writeFileSync(manifestPath, encrypt(Buffer.from(JSON.stringify(mismatched))));
  const unrecoverable = run("--restore");
  assert.notEqual(unrecoverable.status, 0, "Must reject a verified attachment that is missing from the restored application state");
  assert.match(unrecoverable.stderr, /Falló la restauración aislada/);
  assert.ok(!readdirSync(directory).some((name) => name.startsWith("iz-s3-restore-")));

  console.log("S3 synthetic backup: crypto checks and fresh SQLite recovery passed; incomplete and unrecoverable copies rejected");
} finally {
  rmSync(directory, { recursive: true, force: true });
}
