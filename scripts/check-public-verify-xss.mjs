import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync("public/verify.html", "utf8");

for (const forbidden of [".innerHTML", ".outerHTML", ".insertAdjacentHTML"]) {
  assert.equal(html.includes(forbidden), false, `verify.html no debe usar ${forbidden} para render publico`);
}

const scriptMatch = html.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
assert.ok(scriptMatch, "verify.html debe contener el script de validacion");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

class FakeElement {
  constructor(tagName, id = "") {
    this.tagName = String(tagName || "").toLowerCase();
    this.id = id;
    this.children = [];
    this.listeners = new Map();
    this.attributes = new Map();
    this.className = "";
    this.value = "";
    this._textContent = "";
  }

  set textContent(value) {
    this._textContent = String(value ?? "");
    this.children = [];
  }

  get textContent() {
    return `${this._textContent}${this.children.map((child) => child.textContent).join("")}`;
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value ?? ""));
  }

  toHtml() {
    const classAttribute = this.className ? ` class="${escapeHtml(this.className)}"` : "";
    const idAttribute = this.id ? ` id="${escapeHtml(this.id)}"` : "";
    const otherAttributes = Array.from(this.attributes.entries())
      .map(([name, value]) => ` ${escapeHtml(name)}="${escapeHtml(value)}"`)
      .join("");
    return `<${this.tagName}${idAttribute}${classAttribute}${otherAttributes}>${escapeHtml(this._textContent)}${this.children
      .map((child) => child.toHtml())
      .join("")}</${this.tagName}>`;
  }
}

const createdTags = [];
const elementsById = {
  verifyForm: new FakeElement("form", "verifyForm"),
  codeInput: new FakeElement("input", "codeInput"),
  resultCard: new FakeElement("section", "resultCard")
};

const document = {
  getElementById(id) {
    assert.ok(elementsById[id], `Elemento esperado no encontrado en DOM simulado: ${id}`);
    return elementsById[id];
  },
  createElement(tagName) {
    createdTags.push(String(tagName).toLowerCase());
    return new FakeElement(tagName);
  }
};

const maliciousDiploma = {
  code: 'IZ-XSS"><img src=x onerror="globalThis.__verifyXss = true">',
  memberName: "<script>globalThis.__verifyXss = true</script>",
  courseTitle: '<svg onload="globalThis.__verifyXss = true">Curso</svg>',
  courseType: 'Aprovechamiento <iframe src="javascript:alert(1)"></iframe>',
  endDate: "2026-05-15",
  hours: '8<script type="module">globalThis.__verifyXss = true</script>'
};

const context = {
  document,
  window: { location: { search: "" } },
  URLSearchParams,
  console,
  globalThis: {},
  fetch: async (url) => {
    assert.match(String(url), /^\/api\/verify\?code=/);
    return {
      ok: true,
      json: async () => ({ ok: true, diploma: maliciousDiploma })
    };
  }
};

vm.createContext(context);
vm.runInContext(scriptMatch[1], context, { filename: "public/verify.html" });

elementsById.codeInput.value = "IZ-XSS";
const submitHandler = elementsById.verifyForm.listeners.get("submit");
assert.equal(typeof submitHandler, "function", "verify.html debe registrar submit handler");
await submitHandler({ preventDefault() {} });

const renderedHtml = elementsById.resultCard.toHtml();

assert.equal(context.globalThis.__verifyXss, undefined, "El payload HTML no debe ejecutarse");
assert.equal(createdTags.includes("script"), false, "El payload no debe crear nodos script");
assert.equal(createdTags.includes("img"), false, "El payload no debe crear nodos img desde datos de servidor");
assert.equal(createdTags.includes("svg"), false, "El payload no debe crear nodos svg desde datos de servidor");
assert.ok(renderedHtml.includes("&lt;script&gt;globalThis.__verifyXss = true&lt;/script&gt;"));
assert.ok(renderedHtml.includes("&lt;svg onload=&quot;globalThis.__verifyXss = true&quot;&gt;Curso&lt;/svg&gt;"));
assert.ok(renderedHtml.includes("Diploma valido"), "El resultado util debe seguir renderizandose");
assert.ok(renderedHtml.includes("IZ-XSS"), "El codigo del diploma debe seguir visible");
assert.ok(renderedHtml.includes("Aprovechamiento"), "El tipo de diploma debe seguir visible");

console.log("Public verify XSS check passed.");
