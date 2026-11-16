import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

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
// Release guard: isolated demo access must never be shipped with the candidate.
assert.equal(existsSync(new URL("../server/demo-access-gate.js", import.meta.url)), false,
  "V1.4 release candidate must not contain the demo access gate");
const serverEntry = readFileSync(new URL("../server-entry.js", import.meta.url), "utf8");
assert.doesNotMatch(serverEntry, /demo-access-gate|IZ_DEMO_ACCESS/i,
  "Production entry point must not import or enable demo-only access");
assert.doesNotMatch(app, /IZ_DEMO_ACCESS|demo-access-gate/i,
  "Production client must not expose demo-only access");
const mobile = readFileSync(new URL("../public/assets/js/app/ui/mobile-navigation.js", import.meta.url), "utf8");
for (const contract of [
  [/aria-expanded="false"/, "Menu toggle must expose collapsed state"],
  [/aria-controls="sidebar"/, "Menu toggle must target existing sidebar"],
  [/event\.key === 'Escape'/, "Escape must close the mobile menu"],
  [/event\.key !== 'Tab'/, "Mobile menu must trap keyboard focus"],
  [/content\.inert = open/, "Background content must be inert while menu is open"],
  [/sidebar\.inert = mediaQuery\.matches && !open/, "Closed sidebar must be inert on mobile"],
  [/backdrop\.hidden = !open/, "Backdrop must be hidden when menu closes"],
  [/toggle\.focus\(/, "Closing menu must restore keyboard focus"],
  [/mediaQuery\.addEventListener\('change'/, "Resizing must close menu"],
  [/shell\.hidden = !visible/, "Unauthenticated users must not see the mobile shell"]
]) assert.match(mobile, contract[0], contract[1]);
console.log("V1.4 mobile navigation and release isolation contracts passed.");
