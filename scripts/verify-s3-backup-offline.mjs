import { createDecipheriv, createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import assert from "node:assert/strict";
import { restoreVerifiedS3Backup } from "./restore-s3-backup-isolated.mjs";

// Offline only. --restore uses a fresh temporary data directory and never starts the server.
const directory = process.argv[2];
const restore = process.argv[3] === "--restore";
if (!directory || process.argv.length > (restore ? 4 : 3)) {
  throw new Error("Uso: node scripts/verify-s3-backup-offline.mjs /directorio/copia [--restore]");
}
const encodedKey = (process.env.BACKUP_AES_KEY_B64 || "").trim();
const key = Buffer.from(encodedKey, "base64");
if (key.length !== 32 || key.toString("base64") !== encodedKey) throw new Error("Clave AES-256 base64 inválida");
const root = resolve(directory);
function decrypt(name) {
  if (!/^[a-zA-Z0-9_.-]+$/.test(name) || basename(name) !== name) throw new Error("Nombre de objeto inválido");
  const path = join(root, name);
  if (!existsSync(path)) throw new Error("Objeto ausente: " + name);
  const data = readFileSync(path);
  if (data.length < 34 || !data.subarray(0, 6).equals(Buffer.from([73, 90, 66, 75, 50, 0]))) throw new Error("Cabecera inválida: " + name);
  const decipher = createDecipheriv("aes-256-gcm", key, data.subarray(6, 18));
  decipher.setAuthTag(data.subarray(-16));
  try { return Buffer.concat([decipher.update(data.subarray(18, -16)), decipher.final()]); }
  catch { throw new Error("Autenticidad AES-GCM fallida: " + name); }
}
function verify(bytes, item, name) {
  assert(Number.isSafeInteger(item?.size) && item.size >= 0, "Tamaño inválido: " + name);
  assert.match(item.sha256 || "", /^[a-f0-9]{64}$/, "SHA inválido: " + name);
  assert.equal(bytes.length, item.size, "Tamaño incorrecto: " + name);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), item.sha256, "SHA incorrecto: " + name);
}
const manifestBytes = decrypt("manifest.json.aes256gcm");
let manifest;
try { manifest = JSON.parse(manifestBytes.toString("utf8")); }
catch { throw new Error("El manifiesto descifrado no es JSON válido"); }
assert.equal(manifest.format, "isocrona-campus-backup-v2");
assert.equal(manifest.state?.file, "state.json.aes256gcm");
assert(Array.isArray(manifest.files), "Adjuntos ausentes del manifiesto");
assert(Array.isArray(manifest.missingReferencedFiles), "El manifiesto no informa de adjuntos faltantes");
assert(manifest.missingReferencedFiles.length === 0, "El respaldo contiene adjuntos referenciados que no se pudieron copiar");
const state = decrypt(manifest.state.file);
verify(state, manifest.state, "estado");
let parsedState;
try { parsedState = JSON.parse(state.toString("utf8")); }
catch { throw new Error("El estado descifrado no es JSON válido"); }
let bytes = state.length;
const names = new Set(["manifest.json.aes256gcm", manifest.state.file]);
for (const [i, file] of manifest.files.entries()) {
  assert(file?.slot && !names.has(file.slot), "Adjunto repetido");
  assert(typeof file.route === "string" && file.route.startsWith("/"), "Ruta inválida");
  names.add(file.slot);
  const data = decrypt(file.slot);
  verify(data, file, "adjunto " + (i + 1));
  bytes += data.length;
}
// No print personal data, document contents, source paths or secrets.
const evidence = { ok: true, attachmentsVerified: manifest.files.length, plaintextBytesVerified: bytes };
if (restore) Object.assign(evidence, restoreVerifiedS3Backup(state, parsedState, manifest.files, (file) => {
  const data = decrypt(file.slot);
  verify(data, file, "adjunto");
  return data;
}));
console.log(JSON.stringify(evidence));
