import { createRouter } from "./router/router.js";
import { ROLE_PERMISSIONS, canAccessView } from "./router/viewPermissions.js";
import { state, getState, setState } from "./state/store.js";
import { createApiClient } from "./api/client.js";
import { createAuthApi } from "./api/authApi.js";
import { loadQuestions } from "./modules/tests/questionService.js";
import { renderCoursesView } from "./views/coursesView.js";
import { renderDiplomasView } from "./views/diplomasView.js";
import { renderJoinView } from "./views/joinView.js";
import { renderAdminView } from "./views/adminView.js";
import { renderTestView, resetTestView } from "./views/testView.js";
import { renderTestsView } from "./views/testsView.js";

function ensureTestFocusStyles() {
  if (typeof document === "undefined" || document.querySelector('link[data-test-focus-styles]')) {
    return;
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/assets/css/test-focus.css?v=20261010";
  link.dataset.testFocusStyles = "true";
  document.head.append(link);
}

export function createApp() {
  const router = createRouter();
  const apiClient = createApiClient();
  const authApi = createAuthApi(apiClient);

  loadQuestions();

  return {
    store: {
      state,
      getState,
      setState
    },
    router,
    apiClient,
    authApi,
    resetTestView,
    views: {
      courses: renderCoursesView,
      diplomas: renderDiplomasView,
      join: renderJoinView,
      admin: renderAdminView,
      test: renderTestView,
      tests: renderTestsView
    },
    permissions: {
      map: ROLE_PERMISSIONS,
      canAccessView
    }
  };
}

export function initializeApp() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return createApp();
  }

  ensureTestFocusStyles();

  if (window.__IZ_FRONTEND_APP__) {
    return window.__IZ_FRONTEND_APP__;
  }

  const app = createApp();
  window.__IZ_FRONTEND_APP__ = app;
  window.__IZ_NAVIGATE_TO__ = (view) => app.router.navigateTo(view);

  document.dispatchEvent(
    new CustomEvent("iz:frontend-app-ready", {
      detail: app
    })
  );

  return app;
}

const app = initializeApp();

export default app;
