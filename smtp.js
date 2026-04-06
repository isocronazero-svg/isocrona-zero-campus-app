const net = require("net");
const tls = require("tls");

async function sendMail(config, message) {
  const client = new SmtpClient(normalizeConfig(config));

  try {
    await client.connect();
    const result = await client.sendMail(message);
    await client.quit();
    return result;
  } catch (error) {
    await client.close();
    throw error;
  }
}

class SmtpClient {
  constructor(config) {
    this.config = config;
    this.socket = null;
    this.buffer = "";
    this.pending = null;
    this.lines = [];
  }

  async connect() {
    const socket = this.config.secure
      ? await connectTls(this.config)
      : await connectPlain(this.config);

    this.attachSocket(socket);
    await this.expectResponse([220]);

    let ehloResponse = await this.command(`EHLO ${this.config.clientName}`, [250]);

    if (!this.config.secure && this.config.startTls && supportsExtension(ehloResponse, "STARTTLS")) {
      await this.command("STARTTLS", [220]);
      const upgraded = await upgradeToTls(this.socket, this.config);
      this.attachSocket(upgraded);
      ehloResponse = await this.command(`EHLO ${this.config.clientName}`, [250]);
    }

    if (this.config.username) {
      await this.command("AUTH LOGIN", [334]);
      await this.command(Buffer.from(this.config.username).toString("base64"), [334]);
      await this.command(Buffer.from(this.config.password).toString("base64"), [235]);
    }
  }

  async sendMail(message) {
    await this.command(`MAIL FROM:<${message.from}>`, [250]);
    await this.command(`RCPT TO:<${message.to}>`, [250, 251]);
    await this.command("DATA", [354]);

    const rawMessage = buildRawMessage(message);
    this.socket.write(`${rawMessage}\r\n.\r\n`);
    const response = await this.expectResponse([250]);

    return {
      response: response.message,
      messageId: extractMessageId(response.message)
    };
  }

  async quit() {
    if (!this.socket) {
      return;
    }

    try {
      this.socket.write("QUIT\r\n");
      await this.expectResponse([221], 3000);
    } catch (error) {
      // Best-effort shutdown.
    }

    this.socket.end();
    this.socket = null;
  }

  async close() {
    if (!this.socket) {
      return;
    }

    try {
      this.socket.destroy();
    } catch (error) {
      // Ignore close errors in prototype mode.
    }
    this.socket = null;
  }

  attachSocket(socket) {
    if (this.socket) {
      this.socket.removeAllListeners("data");
      this.socket.removeAllListeners("error");
      this.socket.removeAllListeners("close");
    }

    this.socket = socket;
    this.buffer = "";
    this.lines = [];
    socket.setEncoding("utf8");
    socket.on("data", (chunk) => this.handleData(chunk));
    socket.on("error", (error) => this.handleError(error));
    socket.on("close", () => this.handleError(new Error("Conexion SMTP cerrada")));
  }

  handleData(chunk) {
    this.buffer += chunk;

    while (this.buffer.includes("\n")) {
      const index = this.buffer.indexOf("\n");
      const rawLine = this.buffer.slice(0, index + 1);
      this.buffer = this.buffer.slice(index + 1);
      const line = rawLine.replace(/\r?\n$/, "");
      if (!line) {
        continue;
      }

      this.lines.push(line);
      if (/^\d{3} /.test(line)) {
        const response = {
          code: Number(line.slice(0, 3)),
          lines: [...this.lines],
          message: this.lines.join("\n")
        };
        this.lines = [];

        if (this.pending) {
          const pending = this.pending;
          this.pending = null;
          clearTimeout(pending.timer);
          pending.resolve(response);
        }
      }
    }
  }

  handleError(error) {
    if (!this.pending) {
      return;
    }

    const pending = this.pending;
    this.pending = null;
    clearTimeout(pending.timer);
    pending.reject(error);
  }

  async command(command, expectedCodes) {
    this.socket.write(`${command}\r\n`);
    return this.expectResponse(expectedCodes);
  }

  expectResponse(expectedCodes, timeoutMs = this.config.timeoutMs) {
    if (this.pending) {
      return Promise.reject(new Error("Ya hay una respuesta SMTP pendiente"));
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending = null;
        reject(new Error("Tiempo de espera agotado en SMTP"));
      }, timeoutMs);

      this.pending = {
        timer,
        resolve: (response) => {
          if (!expectedCodes.includes(response.code)) {
            reject(new Error(`SMTP ${response.code}: ${response.message}`));
            return;
          }
          resolve(response);
        },
        reject
      };
    });
  }
}

function normalizeConfig(config) {
  return {
    host: String(config.host || "").trim(),
    port: Number(config.port || 0),
    secure: Boolean(config.secure),
    startTls: config.startTls !== false,
    username: String(config.username || "").trim(),
    password: String(config.password || ""),
    clientName: String(config.clientName || "localhost"),
    timeoutMs: Number(config.timeoutMs || 15000)
  };
}

function buildRawMessage(message) {
  const headers = [
    `From: ${message.fromName ? `${message.fromName} <${message.from}>` : message.from}`,
    `To: ${message.to}`,
    `Subject: ${message.subject}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: 8bit"
  ];

  const body = String(message.text || "")
    .replace(/\r?\n/g, "\r\n")
    .split("\r\n")
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join("\r\n");

  return `${headers.join("\r\n")}\r\n\r\n${body}`;
}

function supportsExtension(response, extension) {
  return response.lines.some((line) => line.toUpperCase().includes(extension.toUpperCase()));
}

function extractMessageId(message) {
  const match = message.match(/([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+)/);
  return match ? match[1] : null;
}

function connectPlain(config) {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: config.host, port: config.port }, () => resolve(socket));
    socket.once("error", reject);
  });
}

function connectTls(config) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host: config.host,
        port: config.port,
        servername: config.host
      },
      () => resolve(socket)
    );
    socket.once("error", reject);
  });
}

function upgradeToTls(socket, config) {
  return new Promise((resolve, reject) => {
    const upgraded = tls.connect(
      {
        socket,
        servername: config.host
      },
      () => resolve(upgraded)
    );
    upgraded.once("error", reject);
  });
}

module.exports = {
  sendMail
};
