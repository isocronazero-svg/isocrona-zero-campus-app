const {
  payloadLimitBytes,
  readJsonBody,
  sendJsonError
} = require("./http");

function matchRoute(requestUrl, route = {}) {
  if (route.method && route.method !== requestUrl?.method) {
    return null;
  }

  const pathname = String(requestUrl?.pathname || "");
  if (typeof route.path === "string") {
    return pathname === route.path ? { params: [] } : null;
  }

  if (route.path instanceof RegExp) {
    const match = pathname.match(route.path);
    return match ? { params: match.slice(1) } : null;
  }

  return null;
}

async function handleRoute(req, res, requestUrl, route, handler) {
  const match = matchRoute({ pathname: requestUrl?.pathname, method: req.method }, route);
  if (!match) {
    return false;
  }

  const context = {
    req,
    res,
    requestUrl,
    params: match.params
  };

  try {
    await handler(context);
  } catch (error) {
    handleRouteError(res, error, route, context);
  }
  return true;
}

function handleRouteError(res, error, route = {}, context = {}) {
  if (typeof route.onError === "function") {
    return route.onError(error, context);
  }
  return sendJsonError(res, error, route.fallbackMessage || "Solicitud invalida", route.statusCode || 400);
}

function withAuth(options, handler) {
  const { readState, requireAuthenticatedAccount } = options || {};
  return async (context) => {
    const state = readState();
    const account = requireAuthenticatedAccount(context.req, context.res, state);
    if (!account) {
      return null;
    }
    return handler({ ...context, state, account });
  };
}

function withAdmin(options, handler) {
  const { readState, requireAdminAccount } = options || {};
  return async (context) => {
    const state = readState();
    const account = requireAdminAccount(context.req, context.res, state);
    if (!account) {
      return null;
    }
    return handler({ ...context, state, account });
  };
}

function withJsonBodyLimit(maxBytes, handler) {
  const limit = Math.max(1, Number(maxBytes || payloadLimitBytes.defaultJson));
  return async (context) => {
    const body = await readJsonBody(context.req, limit);
    return handler({ ...context, body });
  };
}

module.exports = {
  handleRoute,
  handleRouteError,
  matchRoute,
  withAdmin,
  withAuth,
  withJsonBodyLimit
};
