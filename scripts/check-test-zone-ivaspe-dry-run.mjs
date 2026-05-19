import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempRoot = mkdtempSync(path.join(os.tmpdir(), "iz-ivaspe-dry-run-check-"));
const dataDir = path.join(tempRoot, "data");

try {
  const result = spawnSync(process.execPath, ["scripts/import-test-zone-ivaspe.mjs", "--dry-run"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      NODE_ENV: "test",
      IZ_DATA_DIR: dataDir
    },
    encoding: "utf8"
  });

  assert.equal(result.status, 0, `Dry-run IVASPE debe terminar OK.\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
  assert.match(result.stdout, /Vista previa IVASPE finalizada/);
  assert.match(result.stdout, /Total importadas:/);
  assert.ok(!existsSync(dataDir), "El dry-run IVASPE no debe crear ni modificar IZ_DATA_DIR");

  console.log("IVASPE dry-run no-write check passed.");
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
