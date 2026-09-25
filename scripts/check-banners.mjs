import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { renderBanners, renderBannerSettings, invalidateBanners } from "../public/assets/js/app/ui/banners.js";
const { normalizeBanners, publicBanners } = createRequire(import.meta.url)("../server/banners.js");

assert.deepEqual(publicBanners(), [], "Desactivados por defecto");
for (const url of ["javascript:alert(1)", "data:text/html,bad", "//evil.test/x", "/\\evil.test/x", "https://user:password@evil.test/x", "http://evil.test/x"]) {
  assert.throws(() => normalizeBanners([{ enabled: true, title: "QA", imageUrl: url }]));
  assert.deepEqual(publicBanners([{ enabled: true, title: "QA", imageUrl: url }]), []);
}
assert.throws(() => normalizeBanners(Array(4).fill({})));
assert.throws(() => normalizeBanners([{ enabled: true }]));
const safe = normalizeBanners([{ title: "Borrador", imageUrl: "/assets/banner.png" }]);
assert.equal(safe[0].enabled, false);
assert.deepEqual(publicBanners(safe), []);
const attack = '<img src=x onerror="alert(1)">';
assert.ok(!renderBannerSettings([{ title: attack }]).includes(attack), "Formulario escapado");

const original = { fetch: globalThis.fetch, document: globalThis.document, location: globalThis.location };
const node = tag => ({ tag, children: [], events: {}, append(...items) { this.children.push(...items); },
  replaceChildren(...items) { this.children = items; }, addEventListener(name, fn) { this.events[name] = fn; },
  set innerHTML(_) { throw new Error("No se permite HTML dinamico en banners"); } });
try {
  globalThis.document = { createElement: node };
  globalThis.location = { origin: "https://local.test" };
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ banners: [
    { enabled: true, title: attack, imageUrl: "/assets/banner.png", targetUrl: "javascript:alert(1)" },
    { enabled: true, title: "Bad", imageUrl: "data:text/html,bad" }
  ] }) });
  const container = { ...node("section"), isConnected: true };
  invalidateBanners();
  await renderBanners(container);
  assert.equal(container.children.length, 1);
  const content = container.children[0].children[1];
  assert.equal(content.tag, "div", "Un destino peligroso nunca crea un enlace");
  assert.equal(content.children[0].alt, attack, "Titulo como texto, no HTML");
  assert.equal(content.children[0].referrerPolicy, "no-referrer");
  globalThis.fetch = async () => { throw new Error("offline"); };
  invalidateBanners();
  await renderBanners(container);
  assert.equal(container.hidden, true, "Una caida de banners no bloquea el portal");
} finally { Object.assign(globalThis, original); }
console.log("Own banner checks passed (disabled defaults, safe URLs, escaped DOM and network errors).");
