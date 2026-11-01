import {
  getApplicableCourseFee,
  getMemberEnrollmentFee,
  getNonMemberEnrollmentFee
} from "./coursePricing.js";

const pricingByCourseId = new Map();
let latestSelectedCourseId = "";
let installed = false;
let observer = null;
let selectionListenerInstalled = false;

function numberFromInput(input, fallback = 0) {
  const value = Number(input?.value);
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : fallback;
}

function rememberPricingFromState(payload) {
  if (!payload || typeof payload !== "object") return payload;
  latestSelectedCourseId = String(payload.selectedCourseId || latestSelectedCourseId || "");
  (Array.isArray(payload.courses) ? payload.courses : []).forEach((course) => {
    if (!course?.id) return;
    pricingByCourseId.set(course.id, {
      memberFee: getMemberEnrollmentFee(course),
      nonMemberFee: getNonMemberEnrollmentFee(course)
    });
  });
  return payload;
}

export function adaptStatePricing(payload) {
  rememberPricingFromState(payload);
  if (!payload || payload.role !== "member" || !Array.isArray(payload.courses)) return payload;
  const participantType = payload.selectedAssociateId ? "member" : "external";
  return {
    ...payload,
    courses: payload.courses.map((course) => ({
      ...course,
      // The legacy renderer still reads enrollmentFee. Feed it the correct price for this account.
      enrollmentFee: getApplicableCourseFee(course, participantType)
    }))
  };
}

function pricingFromVisibleForm() {
  const editMember = document.getElementById("editCourseMemberEnrollmentFee");
  const editNonMember = document.getElementById("editCourseNonMemberEnrollmentFee");
  if (editMember && editNonMember) {
    return {
      memberEnrollmentFee: numberFromInput(editMember),
      nonMemberEnrollmentFee: numberFromInput(editNonMember)
    };
  }

  const createMember = document.getElementById("courseMemberEnrollmentFee");
  const createNonMember = document.getElementById("courseNonMemberEnrollmentFee");
  if (createMember && createNonMember) {
    return {
      memberEnrollmentFee: numberFromInput(createMember),
      nonMemberEnrollmentFee: numberFromInput(createNonMember)
    };
  }
  return null;
}

export function applyCoursePricingToRequestBody(body, pricing) {
  if (!pricing || !body || typeof body !== "object") return body;
  const memberEnrollmentFee = Number(pricing.memberEnrollmentFee || 0);
  const nonMemberEnrollmentFee = Number(pricing.nonMemberEnrollmentFee || 0);
  const target = body.course && typeof body.course === "object" ? body.course : body;
  target.memberEnrollmentFee = memberEnrollmentFee;
  target.nonMemberEnrollmentFee = nonMemberEnrollmentFee;
  // Public/general price remains in the legacy field while old renderers are phased out.
  target.enrollmentFee = nonMemberEnrollmentFee;
  return body;
}

function enhanceCreateForm(form) {
  if (!form || form.dataset.pricingEnhanced === "true") return;
  const capacity = form.querySelector("#courseCapacity")?.closest("label");
  if (!capacity) return;

  const memberLabel = document.createElement("label");
  memberLabel.className = "inline-field";
  memberLabel.innerHTML = 'Precio socio (€)<input id="courseMemberEnrollmentFee" type="number" min="0" step="0.01" value="0" /><span class="field-hint">0 = gratuito para socios.</span>';
  const nonMemberLabel = document.createElement("label");
  nonMemberLabel.className = "inline-field";
  nonMemberLabel.innerHTML = 'Precio no socio (€)<input id="courseNonMemberEnrollmentFee" type="number" min="0" step="0.01" value="0" /><span class="field-hint">Se aplica a participantes externos y accesos solo campus.</span>';
  capacity.after(memberLabel, nonMemberLabel);
  form.dataset.pricingEnhanced = "true";
}

function enhanceEditForm(form) {
  if (!form || form.dataset.pricingEnhanced === "true") return;
  const legacyInput = form.querySelector("#editCourseEnrollmentFee");
  const legacyLabel = legacyInput?.closest("label");
  if (!legacyInput || !legacyLabel) return;

  const saved = pricingByCourseId.get(latestSelectedCourseId) || {
    memberFee: Number(legacyInput.value || 0),
    nonMemberFee: Number(legacyInput.value || 0)
  };

  const wrapper = document.createElement("div");
  wrapper.className = "studio-full studio-grid";
  wrapper.dataset.coursePricingFields = "true";
  wrapper.innerHTML = `
    <label class="inline-field">
      Precio socio (€)
      <input id="editCourseMemberEnrollmentFee" type="number" min="0" step="0.01" value="${saved.memberFee}" />
      <span class="field-hint">0 = gratuito para socios.</span>
    </label>
    <label class="inline-field">
      Precio no socio (€)
      <input id="editCourseNonMemberEnrollmentFee" type="number" min="0" step="0.01" value="${saved.nonMemberFee}" />
      <span class="field-hint">Precio general para participantes externos.</span>
    </label>
  `;
  legacyLabel.hidden = true;
  legacyLabel.after(wrapper);

  const syncLegacyPrice = () => {
    legacyInput.value = String(numberFromInput(wrapper.querySelector("#editCourseNonMemberEnrollmentFee")));
  };
  wrapper.querySelector("#editCourseNonMemberEnrollmentFee")?.addEventListener("input", syncLegacyPrice);
  syncLegacyPrice();
  form.dataset.pricingEnhanced = "true";
}

function enhanceForms() {
  enhanceCreateForm(document.getElementById("courseForm"));
  enhanceEditForm(document.getElementById("courseEditForm"));
}

function trackCourseSelection(event) {
  const target = event.target?.closest?.("[data-course-id]");
  const courseId = String(target?.dataset?.courseId || "").trim();
  const action = String(target?.dataset?.action || "").trim();
  if (!courseId || !["select-course", "open-course-workbench-tab", "open-course-academic", "prepare-course-enrollment"].includes(action)) return;
  latestSelectedCourseId = courseId;
}

async function transformResponse(response, target) {
  if (!response?.ok || target.pathname !== "/api/state") return response;
  const contentType = String(response.headers.get("content-type") || "");
  if (!contentType.includes("application/json")) return response;
  try {
    const payload = await response.clone().json();
    const adapted = adaptStatePricing(payload);
    const headers = new Headers(response.headers);
    headers.set("content-type", "application/json; charset=utf-8");
    return new Response(JSON.stringify(adapted), {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } catch {
    return response;
  }
}

function shouldInjectPricing(target, init) {
  const method = String(init?.method || "GET").toUpperCase();
  if (method === "POST" && target.pathname === "/api/courses") return true;
  return method === "PATCH" && /^\/api\/courses\/[^/]+$/.test(target.pathname);
}

function withPricingBody(init, pricing) {
  if (!pricing || typeof init?.body !== "string") return init;
  const contentType = new Headers(init.headers || {}).get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) return init;
  try {
    const payload = JSON.parse(init.body || "{}");
    applyCoursePricingToRequestBody(payload, pricing);
    return { ...init, body: JSON.stringify(payload) };
  } catch {
    return init;
  }
}

export function installCoursePricingEnhancer() {
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

    let nextInit = init;
    if (target.origin === window.location.origin && shouldInjectPricing(target, init)) {
      nextInit = withPricingBody(init, pricingFromVisibleForm());
    }
    const response = await baseFetch(input, nextInit);
    return target.origin === window.location.origin ? transformResponse(response, target) : response;
  };

  if (!selectionListenerInstalled) {
    document.addEventListener("click", trackCourseSelection, true);
    selectionListenerInstalled = true;
  }
  enhanceForms();
  if (typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(() => enhanceForms());
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

export function resetCoursePricingEnhancerForTests() {
  observer?.disconnect();
  observer = null;
  if (selectionListenerInstalled && typeof document !== "undefined") {
    document.removeEventListener("click", trackCourseSelection, true);
  }
  selectionListenerInstalled = false;
  installed = false;
  pricingByCourseId.clear();
  latestSelectedCourseId = "";
}
