import { createDecipheriv, createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import assert from "node:assert/strict";

// Offline only: reads a locally downloaded S3 prefix; never contacts Railway or writes application data.
const directory = process.argv[2];
if (!directory) throw new Error("Uso: BACKUP_AES_KEY_B64=... node scripts/verify-s3-backup-offline.mjs /directorio/copia");
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
const manifest = JSON.parse(decrypt("manifest.json.aes256gcm").toString("utf8"));
assert.equal(manifest.format, "isocrona-campus-backup-v2");
assert.equal(manifest.state?.file, "state.json.aes256gcm");
assert(Array.isArray(manifest.files), "Adjuntos ausentes del manifiesto");
const state = decrypt(manifest.state.file);
verify(state, manifest.state, "estado");
JSON.parse(state.toString("utf8"));
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
console.log(JSON.stringify({ ok: true, attachmentsVerified: manifest.files.length, plaintextBytesVerified: bytes }));
