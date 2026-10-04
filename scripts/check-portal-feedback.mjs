import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
function fn(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0);
  return source.slice(start, source.indexOf("\nfunction ", start + 1));
}
for (const reduced of [false, true]) {
  const calls = [];
  const ctx = { window: { matchMedia: () => ({ matches: reduced }) },
    document: { getElementById: id => id === "mainPanel" ? { scrollIntoView: options => calls.push(options) } : null } };
  vm.runInNewContext(fn("focusElementById"), ctx);
  ctx.focusElementById("mainPanel"); ctx.focusElementById("missing");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].block, "start");
  assert.equal(calls[0].behavior, reduced ? "auto" : "smooth");
}
// Exercise the actual click branch so navigation cannot forget to request scrolling.
const navStart = source.indexOf('  if (action === "nav") {');
const navEnd = source.indexOf('  if (action === "toggle-nav-group")', navStart);
for (const view of ["test", "tests", "reports", "join"]) {
  let anchorAtRender;
  const ctx = { action: "nav", actionTarget: { dataset: { view } },
    state: { activeView: "overview" }, expandedNavViews: new Set(), navItems: [],
    ADMIN_ONLY_TOP_LEVEL_VIEWS: new Set(), pendingViewAnchorId: "", courseId: "", memberId: "",
    shouldUseMemberProfileAsPrimaryView: () => false, resolveCampusAliasView: value => value,
    isAdminView: () => true, isAdminSession: () => true, isCurrentMemberLimitedToAssociateProfile: () => false,
    navigateWithFrontendRouter: activeView => ({ activeView }), setFocusedViewMode: () => {},
    saveUiSnapshot: () => {}, closeMobileMenu: () => {}, render: () => { anchorAtRender = ctx.pendingViewAnchorId; } };
  await vm.runInNewContext(`(async () => { ${source.slice(navStart, navEnd)} })()`, ctx);
  assert.equal(anchorAtRender, "mainPanel", `${view} must scroll after render`);
}
for (const read of [false, true]) {
  const ctx = { sortCurrentMemberNotifications: () => [{ id: "normal", title: "Normal" }, { id: "urgent", title: "Important", priority: "important" }],
    isMemberNotificationRead: () => read, escapeHtml: value => value, formatDateTime: () => "", isAdminView: () => false,
    renderNoticeAttachments: () => "attachment", renderNoticeLinks: () => "link" };
  vm.runInNewContext(fn("renderMemberNotifications"), ctx);
  const html = ctx.renderMemberNotifications("member-qa");
  if (read) { assert.doesNotMatch(html, /is-unread|class="small-chip notice-count"/); assert.match(html, /is-read/); }
  else { assert.match(html, /is-unread is-important/); assert.match(html, /notice-count/); assert.match(html, /Marcar como leido/); }
  assert.match(html, /attachment/); assert.match(html, /link/);
}
console.log("Portal feedback checks passed: navigation scroll, reduced motion, unread priorities and preserved attachments.");
