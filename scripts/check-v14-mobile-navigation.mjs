import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../public/assets/css/portal-ui.css", import.meta.url), "utf8");
const navigation = app.slice(app.indexOf("function renderNav() {"), app.indexOf("function renderMetrics()", app.indexOf("function renderNav() {")));

assert.match(html, /<nav class="member-quick-nav" id="memberQuickNav"[^>]*hidden><\/nav>/, "Quick navigation starts hidden");
assert.match(html, /portal-ui\.css\?v=20261116-v14/, "New mobile CSS must bypass old browser cache");
assert.match(html, /styles\.css\?v=20261116-v14/, "New ledger CSS must bypass old browser cache");
assert.match(css, /\.member-quick-nav\[hidden\]\s*\{\s*display:\s*none\s*!important;/, "Hidden must override mobile grid");
assert.match(css, /@media\s*\(max-width:\s*900px\)/, "Quick navigation needs mobile breakpoint");
assert.match(navigation, /!isAdminView\(\) && session && !session\.mustChangePassword/, "Quick links require member session");
for (const id of ["overview", "campus", "test", "diplomas"]) {
  assert.ok(navigation.includes(`"${id}"`), `Missing existing member route: ${id}`);
}
assert.match(navigation, /isViewAllowed\(item\.id\)/, "Quick links must respect existing permissions");
assert.match(navigation, /data-action=.*item\.action/, "Quick links must reuse existing handlers");
assert.match(navigation, /memberQuickNav\.hidden = quickItems\.length === 0/, "No quick links for admin or logged-out users");
console.log("V1.4 mobile quick navigation contracts passed.");
