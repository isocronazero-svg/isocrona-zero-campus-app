const rateLimitBuckets = new Map();
const rateLimitMaxBuckets = 20000;

const payloadLimitBytes = Object.freeze({
  small: 16 * 1024,
  registration: 32 * 1024,
  liveJoin: 32 * 1024,
  liveAttempt: 128 * 1024,
  testAttempt: 256 * 1024,
  defaultJson: 100_000_000
});

class PayloadTooLargeError extends Error {
  constructor(maxBytes) {
    super("El contenido enviado es demasiado grande. Reduce el tamano del archivo o usa un enlace.");
    this.name = "PayloadTooLargeError";
    this.maxBytes = maxBytes;
    this.statusCode = 413;
  }
}

function isEnvEnabled(value) {
  return String(value || "").trim().toLowerCase() === "true";
}

function normalizeRateLimitKeyPart(value) {
  return String(value || "unknown").trim().toLowerCase() || "unknown";
}

function getClientIp(req) {
  if (isEnvEnabled(process.env.IZ_TRUST_PROXY_HEADERS)) {
    const forwardedFor = String(req.headers["x-forwarded-for"] || "")
      .split(",")[0]
      .trim();
    const realIp = String(req.headers["x-real-ip"] || "").trim();
    if (forwardedFor) {
      return forwardedFor;
    }
    if (realIp) {
      return realIp;
    }
  }

  return String(req.socket?.remoteAddress || req.connection?.remoteAddress || "unknown")
    .trim()
    .replace(/^::ffff:/, "") || "unknown";
}

function pruneRateLimitBuckets(now = Date.now()) {
  for (const [key, entry] of rateLimitBuckets.entries()) {
    if (!entry || Number(entry.resetAt || 0) <= now) {
      rateLimitBuckets.delete(key);
    }
  }
}

function checkRateLimit(key, limit, windowMs) {
  const normalizedKey = normalizeRateLimitKeyPart(key);
  const normalizedLimit = Math.max(1, Number(limit || 1));
  const normalizedWindowMs = Math.max(1000, Number(windowMs || 1000));
  const now = Date.now();

  if (rateLimitBuckets.size > rateLimitMaxBuckets) {
    pruneRateLimitBuckets(now);
  }

  let entry = rateLimitBuckets.get(normalizedKey);
  if (!entry || Number(entry.resetAt || 0) <= now) {
    entry = {
      count: 0,
      resetAt: now + normalizedWindowMs
    };
    rateLimitBuckets.set(normalizedKey, entry);
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  if (entry.count >= normalizedLimit) {
    return {
      limited: true,
      retryAfterSeconds,
      limit: normalizedLimit,
      resetAt: entry.resetAt
    };
  }

  entry.count += 1;
  return {
    limited: false,
    retryAfterSeconds,
    limit: normalizedLimit,
    remaining: Math.max(0, normalizedLimit - entry.count),
    resetAt: entry.resetAt
  };
}

function sendRateLimited(res, result) {
  const retryAfterSeconds = Math.max(1, Number(result?.retryAfterSeconds || 1));
  res.writeHead(429, {
    "Content-Type": "application/json; charset=utf-8",
    "Retry-After": String(retryAfterSeconds),
    "Cache-Control": "no-store"
  });
  res.end(
    JSON.stringify({
      ok: false,
      error: "Demasiados intentos. Espera unos minutos y vuelve a probar.",
      retryAfterSeconds
    })
  );
}

function isPayloadTooLargeError(error) {
  return error instanceof PayloadTooLargeError || error?.name === "PayloadTooLargeError";
}

async function readJsonBodyOrDefault(req, maxBytes = payloadLimitBytes.defaultJson) {
  try {
    return await readJsonBody(req, maxBytes);
  } catch (error) {
    if (isPayloadTooLargeError(error)) {
      throw error;
    }
    return {};
  }
}

function readJsonBody(req, maxBytes = payloadLimitBytes.defaultJson) {
  return new Promise((resolve, reject) => {
    const normalizedMaxBytes = Math.max(1, Number(maxBytes || payloadLimitBytes.defaultJson));
    const chunks = [];
    let totalBytes = 0;
    let settled = false;

    const rejectPayloadTooLarge = () => {
      if (settled) {
        return;
      }
      settled = true;
      chunks.length = 0;
      req.removeListener("data", handleData);
      req.resume();
      reject(new PayloadTooLargeError(normalizedMaxBytes));
    };

    const contentLengthHeader = Array.isArray(req.headers["content-length"])
      ? req.headers["content-length"][0]
      : req.headers["content-length"];
    const contentLength = Number(contentLengthHeader || 0);

    const handleData = (chunk) => {
      if (settled) {
        return;
      }
      totalBytes += chunk.length;
      if (totalBytes > normalizedMaxBytes) {
        rejectPayloadTooLarge();
        return;
      }
      chunks.push(chunk);
    };

    req.on("data", handleData);
    req.on("end", () => {
      if (settled) {
        return;
      }
      settled = true;
      try {
        const raw = Buffer.concat(chunks, totalBytes).toString("utf8");
        resolve(JSON.parse(raw || "{}"));
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", (error) => {
      if (settled) {
        return;
      }
      settled = true;
      reject(error);
    });

    if (Number.isFinite(contentLength) && contentLength > normalizedMaxBytes) {
      rejectPayloadTooLarge();
    }
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendPayloadTooLarge(res, error) {
  const maxBytes = Math.max(1, Number(error?.maxBytes || 1));
  res.writeHead(413, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(
    JSON.stringify({
      ok: false,
      error: "El contenido enviado es demasiado grande. Reduce el tamaño del archivo o usa un enlace.",
      maxBytes
    })
  );
}

function sendJsonError(res, error, fallbackMessage, statusCode = 400) {
  if (isPayloadTooLargeError(error)) {
    return sendPayloadTooLarge(res, error);
  }
  return sendJson(res, error.statusCode || statusCode, {
    ok: false,
    error: error.message || fallbackMessage
  });
}

module.exports = {
  PayloadTooLargeError,
  checkRateLimit,
  getClientIp,
  isPayloadTooLargeError,
  payloadLimitBytes,
  readJsonBody,
  readJsonBodyOrDefault,
  sendJson,
  sendJsonError,
  sendPayloadTooLarge,
  sendRateLimited
};
