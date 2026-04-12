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
import { renderTestView } from "./views/testView.js";

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
    views: {
      courses: renderCoursesView,
      diplomas: renderDiplomasView,
      join: renderJoinView,
      admin: renderAdminView,
      test: renderTestView
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
