import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const nodeModulesCandidates = [
  path.join(repoRoot, "node_modules"),
  path.join(path.dirname(repoRoot), "Isocrona Zero", "node_modules")
];
const nodeModulesPath = nodeModulesCandidates.find((candidate) => existsSync(candidate)) || "";
const allowFlag = "IZ_ALLOW_EPHEMERAL_STORAGE_IN_PRODUCTION";

function startProductionServerWithoutStorage() {
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
      IZ_RECOVERY_ADMIN_PASSWORD: ""
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

async function assertProductionRequiresStorage() {
  const child = startProductionServerWithoutStorage();
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
    assert.notEqual(exit.code, 0, "Produccion sin DATABASE_URL ni IZ_DATA_DIR debe bloquear el arranque");
    const combinedOutput = `${stdout}\n${stderr}`;
    assert.match(combinedOutput, /Arranque bloqueado: produccion necesita persistencia real/);
    assert.match(combinedOutput, /DATABASE_URL/);
    assert.match(combinedOutput, /IZ_DATA_DIR/);
    assert.match(combinedOutput, new RegExp(allowFlag));
  } finally {
    await stopServer(child);
  }
}

function assertEmergencyBypassIsExplicitAndLoud() {
  const storageContent = readFileSync(path.join(repoRoot, "storage.js"), "utf8");
  assert.match(storageContent, new RegExp(allowFlag));
  assert.match(storageContent, /console\.warn\(/);
  assert.match(storageContent, /El estado puede perderse al reiniciar/);
}

async function main() {
  await assertProductionRequiresStorage();
  assertEmergencyBypassIsExplicitAndLoud();
  console.log("Production storage guard check passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
