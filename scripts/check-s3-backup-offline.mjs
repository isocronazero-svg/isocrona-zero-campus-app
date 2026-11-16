import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./verify-s3-backup-offline.mjs", import.meta.url));
const directory = mkdtempSync(join(tmpdir(), "iz-s3-verify-"));
const key = randomBytes(32);
const key64 = key.toString("base64");
const state = Buffer.from(JSON.stringify({ accounts: [], courses: [], documents: [] }));
const proof = Buffer.from("SYNTHETIC-ATTACHMENT");
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
  files: [{ slot: "file-0001.bin.aes256gcm", route: "/api/associates/files/fake", size: proof.length, sha256: sha256(proof) }]
};
const manifestPath = join(directory, "manifest.json.aes256gcm");
const statePath = join(directory, "state.json.aes256gcm");
const attachmentPath = join(directory, "file-0001.bin.aes256gcm");
function run() {
  return spawnSync(process.execPath, [script, directory], { env: { ...process.env, BACKUP_AES_KEY_B64: key64 }, encoding: "utf8" });
}
try {
  writeFileSync(statePath, encrypt(state));
  writeFileSync(attachmentPath, encrypt(proof));
  writeFileSync(manifestPath, encrypt(Buffer.from(JSON.stringify(manifest))));
  const good = run();
  assert.equal(good.status, 0, good.stderr);
  assert.deepEqual(JSON.parse(good.stdout), { ok: true, attachmentsVerified: 1, plaintextBytesVerified: state.length + proof.length });
  const broken = encrypt(Buffer.from("ALTERED-ATTACHMENT"));
  writeFileSync(attachmentPath, broken);
  const bad = run();
  assert.notEqual(bad.status, 0, "Must reject an altered attachment");
  assert.match(bad.stderr, /SHA incorrecto|Tamaño incorrecto/);
  writeFileSync(attachmentPath, encrypt(proof));
  const wrongKey = spawnSync(process.execPath, [script, directory], { env: { ...process.env, BACKUP_AES_KEY_B64: randomBytes(32).toString("base64") }, encoding: "utf8" });
  assert.notEqual(wrongKey.status, 0, "Must reject an incorrect key");
  console.log("S3 offline verifier: valid fixture accepted, tampering and wrong key rejected");
} finally {
  rmSync(directory, { recursive: true, force: true });
}
