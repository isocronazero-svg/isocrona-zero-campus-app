import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const nodeModulesCandidates = [
  path.join(repoRoot, "node_modules"),
  path.join(path.dirname(repoRoot), "Isocrona Zero", "node_modules")
];
const nodeModulesPath = nodeModulesCandidates.find((candidate) => existsSync(candidate)) || "";
const allowFlag = "IZ_ALLOW_EPHEMERAL_STORAGE_IN_PRODUCTION";

function startProductionServer({ databaseUrl = "", dataDir = "", allowEphemeral = false } = {}) {
  const env = { ...process.env };
  delete env.DATABASE_URL;
  delete env.IZ_DATA_DIR;
  delete env[allowFlag];
  return spawn(process.execPath, ["server.js"], {
    cwd: repoRoot,
    env: {
      ...env,
      ...(nodeModulesPath ? { NODE_PATH: nodeModulesPath } : {}),
      NODE_ENV: "production",
      PORT: "0",
      IZ_BASE_URL: "http://127.0.0.1:0",
      AUTOMATION_INTERVAL_MS: "3600000",
      IZ_RECOVERY_ADMIN_EMAIL: "",
      IZ_RECOVERY_ADMIN_PASSWORD: "",
      ...(databaseUrl ? { DATABASE_URL: databaseUrl } : {}),
      ...(dataDir ? { IZ_DATA_DIR: dataDir } : {}),
      ...(allowEphemeral ? { [allowFlag]: "true" } : {})
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
}

async function waitForExit(child, timeoutMs = 5000) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return { code: child.exitCode, signal: child.signalCode };
  }
  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("El servidor no se detuvo como se esperaba"));
    }, timeoutMs);
    timeout.unref();
    child.once("exit", (code, signal) => {
      clearTimeout(timeout);
      resolve({ code, signal });
    });
  });
}

async function stopServer(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, 1000);
    timeout.unref();
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
    child.kill();
  });
}

async function captureExit(options) {
  const child = startProductionServer(options);
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += String(chunk);
  });
  child.stderr.on("data", (chunk) => {
    stderr += String(chunk);
  });

  try {
    const exit = await waitForExit(child);
    return { exit, output: `${stdout}\n${stderr}` };
  } finally {
    await stopServer(child);
  }
}

function assertBlocked(result, message) {
  assert.notEqual(result.exit.code, 0, message);
  assert.match(result.output, /Arranque bloqueado: produccion necesita persistencia real/);
  assert.match(result.output, /IZ_DATA_DIR/);
  assert.match(result.output, new RegExp(allowFlag));
}

async function assertProductionRequiresStorage() {
  const result = await captureExit();
  assertBlocked(result, "Produccion sin IZ_DATA_DIR debe bloquear el arranque");
}

async function assertDatabaseUrlDoesNotReplaceLocalStateStorage() {
  const result = await captureExit({ databaseUrl: "postgresql://example.invalid/isocrona" });
  assertBlocked(
    result,
    "DATABASE_URL no debe permitir produccion sin IZ_DATA_DIR: app_state y uploads siguen siendo locales"
  );
}

function assertEmergencyBypassIsExplicitAndLoud() {
  const storageContent = readFileSync(path.join(repoRoot, "storage.js"), "utf8");
  assert.match(storageContent, new RegExp(allowFlag));
  assert.match(storageContent, /console\.warn\(/);
  assert.match(storageContent, /El estado puede perderse al reiniciar/);
}

async function main() {
  // Execute the actual guard without opening /data or contacting PostgreSQL.
  const content = readFileSync(path.join(repoRoot, "storage.js"), "utf8");
  const guard = content.slice(content.indexOf("function assertProductionStorageIsConfigured()"), content.indexOf("function writeAutomaticBackup("));
  for (const scenario of [
    { env: { NODE_ENV: "development" }, blocked: false },
    { env: { NODE_ENV: "production" }, dir: "/synthetic-volume", blocked: false },
    { env: { NODE_ENV: "production" }, blocked: true },
    { env: { NODE_ENV: "production", DATABASE_URL: "postgresql://example.invalid/db" }, blocked: true },
    { env: { NODE_ENV: "production", [allowFlag]: "false" }, blocked: true },
    { env: { NODE_ENV: "production", [allowFlag]: "true" }, blocked: false, warning: true }
  ]) {
    const warnings = [];
    const sandbox = { configuredDataDir: scenario.dir || "", allowEphemeralStorageInProductionFlag: allowFlag,
      isTrue: value => String(value || "").trim().toLowerCase() === "true",
      process: { env: scenario.env, exit: () => { throw new Error("blocked"); } },
      console: { warn: message => warnings.push(message), error: () => {} } };
    const run = () => vm.runInNewContext(guard + "\nassertProductionStorageIsConfigured();", sandbox);
    if (scenario.blocked) assert.throws(run, /blocked/); else run();
    assert.equal(warnings.length, scenario.warning ? 1 : 0);
    if (scenario.warning) assert.match(warnings[0], /PELIGRO.*SQLite.*uploads/);
  }
  await assertProductionRequiresStorage();
  await assertDatabaseUrlDoesNotReplaceLocalStateStorage();
  assertEmergencyBypassIsExplicitAndLoud();
  console.log("Production storage guard check passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
