const { createHash } = require("node:crypto");
const { sendMail: sendSmtpMail } = require("../smtp");

// Resolve credentials on the server only. Resend is opt-in and starts paused.
function getMailSettings(state = {}, env = process.env) {
  const smtp = {
    host: "", port: 465, secure: true, startTls: false, username: "", password: "",
    fromEmail: "", fromName: "Isocrona Zero Campus", testTo: "",
    ...(state.settings?.smtp || {})
  };
  const provider = String(env.IZ_EMAIL_PROVIDER || "smtp").trim().toLowerCase();
  if (provider !== "resend") return { ...smtp, provider, enabled: true };
  return {
    provider,
    apiKey: String(env.RESEND_API_KEY || "").trim(),
    fromEmail: String(env.IZ_EMAIL_FROM || "").trim(),
    fromName: String(env.IZ_EMAIL_FROM_NAME || "Isócrona Zero · Campus").trim(),
    replyTo: String(env.IZ_EMAIL_REPLY_TO || "").trim(),
    testTo: String(env.IZ_EMAIL_TEST_TO || "").trim(),
    enabled: env.IZ_EMAIL_ENABLED === "true"
  };
}

function isMailConfigured(config) {
  if (config.provider === "resend") return Boolean(config.apiKey && config.fromEmail);
  return config.provider === "smtp" && Boolean(config.host && config.port && config.fromEmail);
}

function isMailReady(config) {
  return isMailConfigured(config) && config.enabled !== false;
}

function getMailDeliveryStatus(state, env = process.env) {
  const config = getMailSettings(state, env);
  return {
    provider: config.provider,
    configured: isMailConfigured(config),
    enabled: config.enabled,
    ready: isMailReady(config),
    fromEmail: config.fromEmail,
    fromName: config.fromName,
    replyTo: config.replyTo || "",
    testTo: config.testTo
  };
}

function createMailSender({ fetchImpl = (...args) => fetch(...args), smtpSend = sendSmtpMail } = {}) {
  return async function sendMail(config, message, { testOnly = false } = {}) {
    if (!isMailConfigured(config)) {
      throw new Error("Falta configurar el correo saliente (proveedor y remitente)");
    }
    if (!testOnly && !isMailReady(config)) {
      throw new Error("El correo saliente esta en pausa; completa la prueba antes de activarlo");
    }
    if (config.provider === "smtp") return smtpSend(config, message);

    const payload = {
      from: config.fromName ? `${config.fromName} <${config.fromEmail}>` : config.fromEmail,
      to: [message.to],
      subject: message.subject,
      text: String(message.text || ""),
      ...(config.replyTo ? { reply_to: config.replyTo } : {})
    };
    const body = JSON.stringify(payload);
    // Same outbox record + same payload = same provider request on retry (24h).
    const idempotencyKey = message.deliveryId
      ? `campus/${createHash("sha256").update(`${message.deliveryId}\n${body}`).digest("hex")}`
      : "";
    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {})
      },
      body,
      signal: AbortSignal.timeout(15000),
      redirect: "error"
    };

    // Keep the academic revalidation synchronous, immediately before transmission.
    message.beforeData?.();
    let response;
    try {
      response = await fetchImpl("https://api.resend.com/emails", options);
    } catch {
      throw new Error("Resend no confirmo el envio; comprueba su registro antes de reintentar");
    }
    if (!response.ok) {
      try { await response.body?.cancel(); } catch {}
      // Never store raw provider responses: they may contain recipient data or secrets.
      const hints = {
        401: "Revisa la clave de Resend",
        403: "Revisa los permisos de la clave y el dominio verificado en Resend",
        409: "Hay un envio equivalente en curso; revisa el registro antes de reintentar",
        422: "Revisa el remitente, el destinatario y la verificacion del dominio en Resend",
        429: "Se ha alcanzado el limite de envios de Resend; espera antes de reintentar"
      };
      throw new Error(`Resend HTTP ${response.status}: ${hints[response.status] || "El proveedor no ha confirmado el envio; revisa su registro"}`);
    }
    let result;
    try { result = await response.json(); } catch {}
    if (!result?.id || typeof result.id !== "string") {
      throw new Error("Resend no devolvio un identificador de envio; revisa su registro antes de reintentar");
    }
    return { messageId: result.id, response: "Aceptado por Resend", provider: "resend" };
  };
}

module.exports = {
  getMailSettings, getMailDeliveryStatus, isMailConfigured, isMailReady,
  createMailSender, sendMail: createMailSender()
};
