"use strict";

// Only loaded by the dedicated V1.4 demo branch. Fail closed if credentials are missing.
const http = require("node:http");
const { timingSafeEqual } = require("node:crypto");

function safeEqual(a, b) {
  const left = Buffer.from(String(a), "utf8");
  const right = Buffer.from(String(b), "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

function installDemoGate() {
  const username = process.env.IZ_DEMO_ACCESS_USER || "";
  const password = process.env.IZ_DEMO_ACCESS_PASSWORD || "";
  if (!username || password.length < 16) {
    throw new Error("Demo access blocked: IZ_DEMO_ACCESS_USER and a strong IZ_DEMO_ACCESS_PASSWORD are required");
  }
  const originalCreateServer = http.createServer;
  http.createServer = function gatedCreateServer(...args) {
    const listenerIndex = args.findIndex((item) => typeof item === "function");
    if (listenerIndex < 0) throw new Error("Demo gate requires an HTTP request handler");
    const handler = args[listenerIndex];
    args[listenerIndex] = function demoAccessGate(req, res) {
      const pathname = String(req.url || "").split("?")[0];
      if (pathname === "/healthz") return handler(req, res);
      const auth = String(req.headers.authorization || "");
      let decoded = "";
      if (auth.startsWith("Basic ")) {
        try { decoded = Buffer.from(auth.slice(6), "base64").toString("utf8"); } catch {}
      }
      const separator = decoded.indexOf(":");
      const suppliedUser = separator >= 0 ? decoded.slice(0, separator) : "";
      const suppliedPassword = separator >= 0 ? decoded.slice(separator + 1) : "";
      if (!safeEqual(suppliedUser, username) || !safeEqual(suppliedPassword, password)) {
        res.writeHead(401, {
          "WWW-Authenticate": 'Basic realm="Isocrona Zero V1.4 Demo", charset="UTF-8"',
          "Cache-Control": "no-store",
          "Content-Type": "text/plain; charset=utf-8"
        });
        res.end("Demo privada: acceso autorizado obligatorio.");
        return;
      }
      res.setHeader("Cache-Control", "no-store");
      return handler(req, res);
    };
    return originalCreateServer.apply(this, args);
  };
}

module.exports = { installDemoGate };
