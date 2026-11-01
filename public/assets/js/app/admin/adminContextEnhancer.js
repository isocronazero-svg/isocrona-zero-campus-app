let installed = false;
let observer = null;
let identity = null;
let latestState = null;
const renderedBannerMarkup = new WeakMap();

const STORAGE_PREFIX = "iz-admin-working-member:";

function clean(value) {
  return String(value || "").trim();
}

export function normalizeAdminIdentity(session) {
  if (!session || clean(session.role).toLowerCase() !== "admin") return null;
  const accountId = clean(session.accountId || session.id || session.email);
  const memberId = clean(session.memberId);
  if (!accountId) return null;
  return {
    accountId,
    memberId,
    name: clean(session.name || session.email || "Administrador"),
    role: "admin"
  };
}

export function contextStorageKey(accountId) {
  return `${STORAGE_PREFIX}${clean(accountId)}`;
}

function readStoredContext(adminIdentity = identity) {
  if (!adminIdentity?.accountId) return "";
  try {
    return clean(sessionStorage.getItem(contextStorageKey(adminIdentity.accountId)));
  } catch {
    return "";
  }
}

function writeStoredContext(memberId, adminIdentity = identity) {
  if (!adminIdentity?.accountId) return;
  const normalized = clean(memberId) || clean(adminIdentity.memberId);
  try {
    sessionStorage.setItem(contextStorageKey(adminIdentity.accountId), normalized);
  } catch {
    // Session storage can be disabled by the browser. The in-memory identity still remains safe.
  }
}

function preferredMemberId(adminIdentity = identity, statePayload = latestState) {
  if (!adminIdentity) return "";
  const members = Array.isArray(statePayload?.members) ? statePayload.members : [];
  const stored = readStoredContext(adminIdentity);
  if (stored && members.some((member) => clean(member.id) === stored)) return stored;
  return clean(adminIdentity.memberId);
}

export function rewriteAdminStatePayload(payload, adminIdentity, storedMemberId = "", ui = {}) {
  if (!payload || typeof payload !== "object" || !adminIdentity) return payload;
  const members = Array.isArray(payload.members) ? payload.members : [];
  const requested = clean(storedMemberId);
  const fallback = clean(adminIdentity.memberId);
  const selectedMemberId = requested && members.some((member) => clean(member.id) === requested)
    ? requested
    : fallback;
  return {
    ...payload,
    activeView: clean(ui.activeView) || "overview",
    selectedMemberId: selectedMemberId || null,
    selectedAssociateId: (payload.associates || []).find(item => item.id === ui.selectedAssociateId)?.id
      || (payload.associates || []).find(item => item.linkedAccountId === adminIdentity.accountId
        || (adminIdentity.memberId && item.linkedMemberId === adminIdentity.memberId))?.id || null,
    selectedCourseId: (payload.courses || []).find(item => item.id === ui.selectedCourseId)?.id || null
  };
}

export function sanitizeAdminStateWrite(payload, adminIdentity) {
  if (!payload || typeof payload !== "object" || !adminIdentity) return payload;
  return {
    ...payload,
    // Never persist a UI working-person selection as shared application state.
    selectedMemberId: null,
    selectedAssociateId: null,
    selectedCourseId: null
  };
}

function responseWithJson(response, payload) {
  const headers = new Headers(response.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "private, no-store");
  return new Response(JSON.stringify(payload), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function rememberSessionResponse(response, pathname) {
  if (!response?.ok || !["/api/login", "/api/session"].includes(pathname)) return response;
  try {
    const payload = await response.clone().json();
    const nextIdentity = normalizeAdminIdentity(payload?.session);
    if (!nextIdentity) {
      identity = null;
      latestState = null;
      return response;
    }
    identity = nextIdentity;
    if (pathname === "/api/login" || !readStoredContext(nextIdentity)) {
      // An explicit login must always begin on the administrator's own profile.
      writeStoredContext(nextIdentity.memberId, nextIdentity);
    }
    if (pathname === "/api/login") {
      try { sessionStorage.removeItem(`iz-campus-ui-snapshot:${nextIdentity.accountId}`); } catch {}
    }
    queueMicrotask(renderContextBanner);
  } catch {
    // Keep original authentication response untouched.
  }
  return response;
}

async function rewriteStateResponse(response, method, pathname) {
  if (!response?.ok || pathname !== "/api/state" || !identity) return response;
  try {
    const payload = await response.clone().json();
    let ui = {};
    try { ui = JSON.parse(sessionStorage.getItem(`iz-campus-ui-snapshot:${identity.accountId}`) || "{}"); } catch {}
    const source = method === "POST" ? payload.state : payload;
    if (!source || source.role !== "admin") return response;
    const rewritten = rewriteAdminStatePayload(source, identity, readStoredContext(identity), ui);
    latestState = rewritten;
    if (clean(rewritten.selectedMemberId) !== readStoredContext(identity)) {
      writeStoredContext(rewritten.selectedMemberId, identity);
    }
    queueMicrotask(renderContextBanner);
    return responseWithJson(response, method === "POST" ? { ...payload, state: rewritten } : rewritten);
  } catch {
    return response;
  }
}

function rewriteStateRequest(target, init = {}) {
  const method = clean(init.method || "GET").toUpperCase() || "GET";
  if (!identity || target.pathname !== "/api/state" || method !== "POST" || typeof init.body !== "string") return init;
  try {
    const payload = JSON.parse(init.body || "{}");
    return { ...init, body: JSON.stringify(sanitizeAdminStateWrite(payload, identity)) };
  } catch {
    return init;
  }
}

function memberName(memberId) {
  const member = (latestState?.members || []).find((item) => clean(item.id) === clean(memberId));
  return clean(member?.name || member?.email || memberId || "Perfil");
}

function returnToOwnProfile() {
  if (!identity) return;
  writeStoredContext(identity.memberId, identity);
  const switcher = document.getElementById("memberSwitcher");
  if (switcher) {
    switcher.value = identity.memberId;
    switcher.dispatchEvent(new Event("change", { bubbles: true }));
  }
  if (latestState) latestState.selectedMemberId = identity.memberId;
  renderContextBanner();
}

function ensureStyles() {
  if (document.getElementById("adminContextStyles")) return;
  const style = document.createElement("style");
  style.id = "adminContextStyles";
  style.textContent = `
    .admin-context-banner{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:11px 14px;margin:0 0 14px;border-radius:14px;border:1px solid rgba(127,127,127,.28);background:var(--surface,#fff)}
    .admin-context-banner strong{font-size:.98rem}
    .admin-context-banner.is-other{border-color:#d97706;background:rgba(245,158,11,.12)}
    .admin-context-banner.is-other strong{color:#9a5200}
    @media(max-width:600px){.admin-context-banner{align-items:flex-start}.admin-context-banner .mini-button{width:100%}}
  `;
  document.head.append(style);
}

function renderContextBanner() {
  const existing = document.getElementById("adminContextBanner");
  const hero = document.getElementById("hero");
  const shell = document.getElementById("shell");
  if (!identity || !latestState || !hero || !shell || shell.offsetParent === null) {
    existing?.remove();
    return;
  }
  ensureStyles();
  const selected = preferredMemberId(identity, latestState) || identity.memberId;
  const own = selected === identity.memberId;
  const selectedName = memberName(selected) || identity.name;
  let banner = existing;
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "adminContextBanner";
    hero.before(banner);
  }
  const className = `admin-context-banner${own ? "" : " is-other"}`;
  if (banner.className !== className) banner.className = className;
  const markup = own
    ? `<div><span class="muted">Contexto de trabajo</span><br><strong>Trabajando como: ${escapeHtml(selectedName || identity.name)}</strong></div>`
    : `<div><span class="muted">Contexto de trabajo</span><br><strong>Estás gestionando a: ${escapeHtml(selectedName)}</strong></div><button type="button" class="mini-button" data-return-own-profile>Volver a mi perfil</button>`;
  // Our own child mutations must settle, including names normalized by innerHTML.
  if (renderedBannerMarkup.get(banner) === markup) return;
  banner.innerHTML = markup;
  renderedBannerMarkup.set(banner, markup);
  banner.querySelector("[data-return-own-profile]")?.addEventListener("click", returnToOwnProfile);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function trackMemberSwitcher(event) {
  if (!identity || event.target?.id !== "memberSwitcher") return;
  const memberId = clean(event.target.value);
  if (!memberId) return;
  writeStoredContext(memberId, identity);
  if (latestState) latestState.selectedMemberId = memberId;
  queueMicrotask(renderContextBanner);
}

export function installAdminContextEnhancer() {
  if (installed || typeof window === "undefined" || typeof document === "undefined") return;
  installed = true;
  const baseFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    let target;
    try {
      const raw = typeof input === "string" ? input : input?.url || String(input || "");
      target = new URL(raw, window.location.href);
    } catch {
      return baseFetch(input, init);
    }
    if (target.origin !== window.location.origin) return baseFetch(input, init);
    const method = clean(init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase() || "GET";
    const nextInit = rewriteStateRequest(target, init);
    let response = await baseFetch(input, nextInit);
    response = await rememberSessionResponse(response, target.pathname);
    response = await rewriteStateResponse(response, method, target.pathname);
    if (target.pathname === "/api/logout" && response.ok) {
      identity = null;
      latestState = null;
      document.getElementById("adminContextBanner")?.remove();
    }
    return response;
  };
  document.addEventListener("change", trackMemberSwitcher, true);
  if (typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(renderContextBanner);
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
