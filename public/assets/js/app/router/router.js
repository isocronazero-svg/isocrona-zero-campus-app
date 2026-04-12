import { canAccessView } from "./viewPermissions.js";
import { getState, setState } from "../state/store.js";

const VIEW_ALIASES = Object.freeze({
  campus: "courses"
});

function resolveRequestedView(view) {
  const normalizedView = String(view || "").trim() || "overview";
  return VIEW_ALIASES[normalizedView] || normalizedView;
}

export function navigateTo(view) {
  const currentState = getState();
  const requestedView = String(view || currentState.activeView || "overview").trim() || "overview";
  const effectiveRequestedView = resolveRequestedView(requestedView);
  const role = String(currentState.role || "member").trim() || "member";

  if (!canAccessView(role, effectiveRequestedView)) {
    const fallbackView = role === "member" ? "join" : "overview";
    setState({
      activeView: fallbackView
    });
    return {
      ok: false,
      requestedView,
      effectiveRequestedView,
      role,
      allowed: false,
      activeView: fallbackView
    };
  }

  let nextActiveView = effectiveRequestedView;
  let campusSectionMode = currentState.campusSectionMode || null;

  if (role === "admin") {
    if (effectiveRequestedView === "courses") {
      nextActiveView = "campus";
      campusSectionMode = "courses";
    } else if (effectiveRequestedView === "operations") {
      nextActiveView = "campus";
      campusSectionMode = "operations";
    } else if (effectiveRequestedView === "diplomas") {
      nextActiveView = "campus";
      campusSectionMode = "diplomas";
    }
  }

  const nextState = setState({
    activeView: nextActiveView,
    campusSectionMode
  });

  return {
    ok: true,
    requestedView,
    effectiveRequestedView,
    role,
    allowed: true,
    activeView: nextState.activeView,
    campusSectionMode: nextState.campusSectionMode || null
  };
}

export function createRouter() {
  return {
    navigateTo,
    current() {
      return getState().activeView;
    }
  };
}

export default createRouter;
