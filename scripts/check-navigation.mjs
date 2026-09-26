import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const config = readFileSync(new URL("../public/assets/js/app/navigation/config.js", import.meta.url), "utf8");
const { navItems, TEST_SECTION_LINKS } = await import(`data:text/javascript;base64,${Buffer.from(config).toString("base64")}`);
const start = app.indexOf("function renderNav() {");
const end = app.indexOf("function renderMetrics()", start);
assert.ok(start >= 0 && end > start, "Navigation renderer must exist");

function render(admin, allowed = () => true) {
  const context = {
    navItems,
    TEST_SECTION_LINKS,
    navElement: { innerHTML: "" },
    state: { activeView: "overview" },
    session: { memberId: "member-qa" },
    campusSectionMode: "courses",
    isCampusOnlySession: () => false,
    shouldUseMemberProfileAsPrimaryView: () => !admin,
    getCurrentMember: () => ({ id: "member-qa" }),
    getUnreadMemberNotifications: () => [{}],
    isAdminView: () => admin,
    isViewAllowed: allowed,
    isNavGroupExpanded: () => false,
    escapeHtml: (value) => value
  };
  vm.runInNewContext(`${app.slice(start, end)}\nrenderNav();`, context);
  return [...context.navElement.innerHTML.matchAll(/<button class="nav-main-button[^>]*>/g)].map(([tag]) => tag);
}

const adminButtons = render(true);
assert.equal(adminButtons.length, navItems.length);
for (const [index, item] of navItems.entries()) {
  assert.ok(adminButtons[index].includes(`data-view="${item.id}"`), `${item.label} needs a navigation target`);
  assert.ok(adminButtons[index].includes('data-action="nav"'));
}
assert.equal(render(true, (id) => id !== "reports").length, navItems.length - 1);
const memberButtons = render(false);
assert.equal(memberButtons.length, 4);
assert.equal(navItems.filter((item) => item.id === "test").length, 1);
assert.ok(!navItems.some((item) => item.id === "tests"), "Live must be inside Zona Test, not a second main item");
assert.deepEqual(TEST_SECTION_LINKS.map((item) => item.label), ["Test", "Test en Vivo"]);

const switchStart = app.indexOf("async function changeViewRole(");
const switchEnd = app.indexOf('\nroleSwitcher.addEventListener("change"', switchStart);
for (const success of [true, false]) {
  const context = {
    session: { role: "admin", accountId: "own-account", memberId: "" },
    state: { activeView: "overview", selectedMemberId: "another-member" },
    viewRole: "admin", roleSwitcher: {},
    isAdminSession: () => true,
    isAdminView: () => context.viewRole === "admin",
    persistSession: () => {}, persistViewRole: () => {}, render: () => {}, showToast: () => {},
    applySessionToState: () => {},
    fetch: async (url, options) => {
      assert.equal(url, "/api/account/member-profile");
      assert.equal(options.method, "POST");
      assert.equal(options.body, undefined, "Never send the selected person's ID");
      return { ok: success };
    },
    readJsonResponse: async () => ({ memberId: "own-member", error: "Unavailable" }),
    refreshState: async () => {}
  };
  await vm.runInNewContext(app.slice(switchStart, switchEnd) + '\nchangeViewRole("member-self");', context);
  assert.equal(context.session.accountId, "own-account");
  assert.equal(context.session.role, "admin");
  assert.equal(context.viewRole, success ? "member-self" : "admin");
  assert.equal(context.roleSwitcher.disabled, false);
}

const view = readFileSync(new URL("../public/assets/js/app/views/testsView.js", import.meta.url), "utf8");
const viewStart = view.indexOf("function renderTestsMarkup(");
const viewEnd = view.indexOf("async function refreshTestsView(", viewStart);
for (const role of ["admin", "member"]) {
  for (const displayMode of ["live", "practice"]) {
    const context = {
      testsViewState: { role, displayMode, message: "" },
      isAdminRole: (value) => value === "admin",
      escapeHtml: (value) => value, renderTestNavigation: () => "<nav>Test / Test en Vivo</nav>",
      buildAdminLiveSessionsMarkup: () => "HOST-LIVE",
      buildStudentLiveJoinMarkup: () => "JOIN-LIVE",
      buildStudentLiveSessionMarkup: () => "ROOM-LIVE",
      buildPublicLiveAdminMarkup: () => "CREATE-PUBLIC-LIVE",
      renderAdminMarkup: () => "MANAGE-TESTS",
      renderStudentMarkup: () => "PUBLISHED-TESTS",
      container: { innerHTML: "" }
    };
    vm.runInNewContext(view.slice(viewStart, viewEnd) + '\nrenderTestsMarkup(container);', context);
    const html = context.container.innerHTML;
    if (displayMode === "live") {
      assert.match(html, role === "admin" ? /HOST-LIVE/ : /JOIN-LIVE/);
      assert.equal(html.includes("CREATE-PUBLIC-LIVE"), role === "admin");
      assert.ok(!html.includes("PUBLISHED-TESTS"));
    } else {
      assert.match(html, role === "admin" ? /MANAGE-TESTS/ : /PUBLISHED-TESTS/);
      assert.ok(!html.includes("ROOM-LIVE"));
    }
  }
}
for (const view of ["overview", "test", "join"]) {
  assert.ok(memberButtons.some((tag) => tag.includes(`data-view="${view}"`) && tag.includes('data-action="nav"')));
}
assert.ok(memberButtons.some((tag) => tag.includes('data-action="open-member-campus-mode"') && tag.includes('data-mode="diplomas"')));
const sessionStart = app.indexOf("function applySessionToState() {");
const sessionEnd = app.indexOf("function getPreferredMemberCourseForMode(", sessionStart);
assert.ok(sessionStart >= 0 && sessionEnd > sessionStart);
for (const mode of ["admin", "member-self", "member-preview"]) {
  const context = {
    session: { role: "admin", memberId: "member-qa" },
    state: {
      accounts: [],
      activeView: "campus",
      selectedCourseId: "course-created",
      courses: [
        { id: "course-created", enrolledIds: [], waitingIds: [] },
        { id: "course-own", enrolledIds: ["member-qa"], waitingIds: [] }
      ]
    },
    getEffectiveRole: () => mode === "admin" ? "admin" : "member",
    isSelfMemberSession: () => mode === "member-self",
    isMemberPreviewSession: () => mode === "member-preview",
    getCurrentAssociate: () => null,
    getPrimaryMemberCourse: () => ({ id: "course-own" }),
    isViewAllowed: () => true
  };
  vm.runInNewContext(`${app.slice(sessionStart, sessionEnd)}\napplySessionToState();`, context);
  assert.equal(context.state.selectedCourseId, mode === "member-self" ? "course-own" : "course-created", `${mode} must keep the correct course context`);
}
const actionsStart = app.indexOf("async function invokeServerAction(");
const actionsEnd = app.indexOf("function getAssociateDeletionImpactSummary(", actionsStart);
assert.ok(actionsStart >= 0 && actionsEnd > actionsStart);
const refreshStart = app.indexOf("async function refreshState(");
const refreshEnd = app.indexOf("async function ensureAdminStateLoaded(", refreshStart);
assert.ok(refreshStart >= 0 && refreshEnd > refreshStart);
const refreshSource = app.slice(refreshStart, refreshEnd);
for (const hasLoaded of [false, true]) {
  const context = {
    state: { activeView: "associates" }, session: { role: "member" }, hasLoaded, URL,
    window: { location: { origin: "http://localhost" } },
    fetch: async () => ({ ok: true, status: 200, json: async () => ({ activeView: "campus" }) }),
    normalizeState: (value) => value,
    loadStorageMeta: async () => null
  };
  await vm.runInNewContext(`${refreshSource}\nrefreshState();`, context);
  assert.equal(context.state.activeView, hasLoaded ? "associates" : "campus", "Initial load must still use server state");
}
for (const helper of ["invokeServerAction", "invokeJsonAction"]) {
  for (const allowed of [true, false]) {
    const context = {
      state: { activeView: "associates" },
      session: { role: "member" },
      hasLoaded: true,
      URL,
      window: { location: { origin: "http://localhost" } },
      render: () => {},
      fetch: async () => ({ ok: true, status: 200, json: async () => ({ ok: true, activeView: "campus", updated: true }) }),
      readJsonResponse: async (response) => response.json(),
      normalizeState: (value) => value,
      loadStorageMeta: async () => null,
      applySessionToState: () => { if (!allowed) context.state.activeView = "overview"; },
      syncAssociateSelectionTargets: () => {},
      showToast: () => {}
    };
    const result = await vm.runInNewContext(`${refreshSource}\n${app.slice(actionsStart, actionsEnd)}\n${helper}("/qa", {});`, context);
    assert.equal(result, true);
    assert.equal(context.state.activeView, allowed ? "associates" : "overview", `${helper} must preserve the view without bypassing permissions`);
    assert.equal(context.state.updated, true, "Server data must still refresh");
  }
}
const modeStart = app.indexOf("function activateMemberCampusMode(");
const modeEnd = app.indexOf("\nfunction ", modeStart + 1);
assert.ok(modeStart >= 0 && modeEnd > modeStart);
for (const campusOnly of [true, false]) {
  for (const mode of ["diplomas", "groups"]) {
    const context = {
      state: { selectedMemberId: "member-qa", campusGroups: [{ id: "group-qa", modules: [] }] },
      isCampusOnlySession: () => campusOnly,
      syncMemberContextSelection: () => null,
      getSelectedCampusGroup: () => null,
      campusSectionMode: "all",
      learnerEnrollmentIntent: false,
      learnerCourseDetailsMode: "overview",
      coursesSectionMode: "all",
      selectedCampusGroupModuleId: ""
    };
    vm.runInNewContext(`${app.slice(modeStart, modeEnd)}\nactivateMemberCampusMode("${mode}");`, context);
    assert.equal(context.state.activeView, "campus");
    assert.equal(context.campusSectionMode, campusOnly && mode === "groups" ? "courses" : mode);
  }
}
const storageStart = app.indexOf("async function loadStorageMeta() {");
const storageEnd = app.indexOf("function formatFileSize(", storageStart);
assert.ok(storageStart >= 0 && storageEnd > storageStart);
for (const admin of [true, false]) {
  let calls = 0;
  const storage = { engine: "sqlite" };
  const context = {
    isAdminSession: () => admin,
    fetch: async (url) => {
      assert.equal(url, "/api/storage");
      calls += 1;
      return { ok: true };
    },
    readJsonResponse: async () => ({ storage })
  };
  const result = await vm.runInNewContext(`${app.slice(storageStart, storageEnd)}\nloadStorageMeta();`, context);
  assert.equal(calls, admin ? 1 : 0, "Members must not request admin-only storage metadata");
  assert.equal(result, admin ? storage : null);
}
console.log("Frontend navigation, session and course context check passed.");

const permissionStart = app.indexOf("function isViewAllowed(");
const permissionEnd = app.indexOf("\nfunction ", permissionStart + 1);
for (const admin of [true, false]) {
  const context = {
    isAdminView: () => false,
    isCurrentMemberLimitedToAssociateProfile: () => false,
    ADMIN_ONLY_VIEWS: new Set(["reports", "associates"]),
    isAdminSession: () => admin,
    isSelfMemberSession: () => true,
    isCampusOnlySession: () => true
  };
  vm.runInNewContext(app.slice(permissionStart, permissionEnd), context);
  assert.equal(context.isViewAllowed("test"), admin, "Own admin learning does not widen external campus permissions");
  assert.equal(context.isViewAllowed("tests"), admin);
  assert.equal(context.isViewAllowed("reports"), false);
}
