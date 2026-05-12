import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const bundledDefaultStatePath = path.join(repoRoot, "data", "default-state.json");
const nodeModulesCandidates = [
  path.join(repoRoot, "node_modules"),
  path.join(path.dirname(repoRoot), "Isocrona Zero", "node_modules")
];
const nodeModulesPath = nodeModulesCandidates.find((candidate) => existsSync(candidate)) || "";
const tempRoot = mkdtempSync(path.join(os.tmpdir(), "iz-member-notifications-check-"));
const tempDataDir = path.join(tempRoot, "data");
const tempDefaultStatePath = path.join(tempRoot, "default-state.json");
const serverOut = [];
const serverErr = [];

async function getAvailablePort() {
  return await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
}

function buildSeedState() {
  const seed = JSON.parse(readFileSync(bundledDefaultStatePath, "utf8"));
  seed.memberNotifications = [];
  return seed;
}

function createJsonClient(label, baseUrl) {
  const cookies = new Map();

  return {
    async request(method, requestPath, body, options = {}) {
      const headers = { Accept: "application/json", ...(options.headers || {}) };
      const cookieHeader = Array.from(cookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");

      if (cookieHeader) {
        headers.Cookie = cookieHeader;
      }

      let payload;
      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        payload = JSON.stringify(body);
      }

      const response = await fetch(new URL(requestPath, baseUrl), {
        method,
        headers,
        body: payload
      });

      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        const cookiePair = setCookie.split(";")[0];
        const separator = cookiePair.indexOf("=");
        if (separator > 0) {
          cookies.set(cookiePair.slice(0, separator), cookiePair.slice(separator + 1));
        }
      }

      const text = await response.text();
      const parsedBody = text ? JSON.parse(text) : null;
      if (!response.ok && options.allowFailure !== true) {
        throw new Error(`${label} ${method} ${requestPath} -> ${response.status}: ${parsedBody?.error || text}`);
      }

      return {
        status: response.status,
        body: parsedBody
      };
    }
  };
}

function startServer(port, baseUrl) {
  mkdirSync(tempDataDir, { recursive: true });
  writeFileSync(tempDefaultStatePath, JSON.stringify(buildSeedState(), null, 2));

  const child = spawn(process.execPath, ["server.js"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...(nodeModulesPath ? { NODE_PATH: nodeModulesPath } : {}),
      PORT: String(port),
      IZ_BASE_URL: baseUrl,
      IZ_DATA_DIR: tempDataDir,
      IZ_DEFAULT_STATE_PATH: tempDefaultStatePath,
      AUTOMATION_INTERVAL_MS: "3600000",
      IZ_RECOVERY_ADMIN_PASSWORD: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk) => {
    serverOut.push(String(chunk));
  });
  child.stderr.on("data", (chunk) => {
    serverErr.push(String(chunk));
  });

  return child;
}

async function waitForServer(baseUrl, attempts = 40) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(new URL("/healthz", baseUrl));
      if (response.ok) {
        return;
      }
    } catch (error) {
    }
    await delay(250);
  }

  throw new Error(`Servidor no disponible.\nSTDOUT:\n${serverOut.join("")}\nSTDERR:\n${serverErr.join("")}`);
}

async function login(client, email, password) {
  const response = await client.request("POST", "/api/login", {
    email,
    password
  });
  assert.equal(response.body?.ok, true, `Login esperado para ${email}`);
}

function assertNoPrivateNotificationFields(notifications, label) {
  for (const notification of notifications || []) {
    assert.equal(Object.prototype.hasOwnProperty.call(notification, "readByMemberIds"), false, `${label} no debe exponer readByMemberIds`);
    assert.equal(Object.prototype.hasOwnProperty.call(notification, "memberId"), false, `${label} no debe exponer memberId`);
    assert.equal(Object.prototype.hasOwnProperty.call(notification, "createdByMemberId"), false, `${label} no debe exponer createdByMemberId`);
  }
}

function countUnreadNotifications(notifications = []) {
  return notifications.filter((notification) => notification?.read !== true).length;
}

async function main() {
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = startServer(port, baseUrl);

  try {
    await waitForServer(baseUrl);

    const adminClient = createJsonClient("admin", baseUrl);
    const memberClient = createJsonClient("member", baseUrl);
    const secondMemberClient = createJsonClient("member-2", baseUrl);

    await login(adminClient, "admin@isocronazero.org", "campus123");
    await login(memberClient, "lucia@isocronazero.org", "bomberos123");
    await login(secondMemberClient, "javier@isocronazero.org", "bomberos123");

    const adminStateResponse = await adminClient.request("GET", "/api/state");
    const memberOne = (adminStateResponse.body?.members || []).find((member) => member.email === "lucia@isocronazero.org");
    const memberTwo = (adminStateResponse.body?.members || []).find((member) => member.email === "javier@isocronazero.org");
    assert.ok(memberOne?.id, "Debe existir Lucia en el state de prueba");
    assert.ok(memberTwo?.id, "Debe existir Javier en el state de prueba");

    const globalNotificationResponse = await adminClient.request("POST", "/api/member-notifications", {
      title: "Aviso general",
      body: "Mensaje para todos los socios",
      targetType: "all",
      priority: "important"
    });
    assert.equal(globalNotificationResponse.body?.ok, true);

    const memberNotificationsResponse = await memberClient.request("GET", "/api/member-notifications/me");
    assert.equal(memberNotificationsResponse.body?.ok, true);
    assertNoPrivateNotificationFields(memberNotificationsResponse.body?.notifications, "avisos del socio");
    assert.equal(memberNotificationsResponse.body?.notifications?.[0]?.title, "Aviso general");
    assert.equal(memberNotificationsResponse.body?.notifications?.[0]?.read, false);
    assert.equal(countUnreadNotifications(memberNotificationsResponse.body?.notifications), 1);

    const readResponse = await memberClient.request(
      "POST",
      `/api/member-notifications/${encodeURIComponent(memberNotificationsResponse.body?.notifications?.[0]?.id || "")}/read`,
      {}
    );
    assert.equal(readResponse.body?.ok, true);
    assert.equal(readResponse.body?.notification?.read, true);

    const memberNotificationsAfterReadResponse = await memberClient.request("GET", "/api/member-notifications/me");
    assert.equal(memberNotificationsAfterReadResponse.body?.notifications?.[0]?.read, true);
    assert.equal(countUnreadNotifications(memberNotificationsAfterReadResponse.body?.notifications), 0);

    const secondMemberNotificationsResponse = await secondMemberClient.request("GET", "/api/member-notifications/me");
    assert.equal(secondMemberNotificationsResponse.body?.ok, true);
    assert.equal(secondMemberNotificationsResponse.body?.notifications?.some((item) => item.title === "Aviso general"), true);
    const secondMemberGlobalNotification = (secondMemberNotificationsResponse.body?.notifications || []).find(
      (item) => item.title === "Aviso general"
    );
    assert.equal(secondMemberGlobalNotification?.read, false);
    assert.equal(countUnreadNotifications(secondMemberNotificationsResponse.body?.notifications), 1);

    const targetedNotificationResponse = await adminClient.request("POST", "/api/member-notifications", {
      title: "Aviso individual",
      body: "Solo para Lucia",
      targetType: "member",
      memberId: memberOne.id,
      priority: "normal"
    });
    assert.equal(targetedNotificationResponse.body?.ok, true);

    const memberOneTargetedResponse = await memberClient.request("GET", "/api/member-notifications/me");
    assert.equal(memberOneTargetedResponse.body?.notifications?.some((item) => item.title === "Aviso individual"), true);
    assert.equal(countUnreadNotifications(memberOneTargetedResponse.body?.notifications), 1);

    const memberTwoTargetedResponse = await secondMemberClient.request("GET", "/api/member-notifications/me");
    assert.equal(memberTwoTargetedResponse.body?.notifications?.some((item) => item.title === "Aviso individual"), false);
    assert.equal(countUnreadNotifications(memberTwoTargetedResponse.body?.notifications), 1);

    console.log("Member notification checks passed.");
  } finally {
    server.kill("SIGTERM");
    await delay(250);
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  rmSync(tempRoot, { recursive: true, force: true });
  process.exit(1);
});
