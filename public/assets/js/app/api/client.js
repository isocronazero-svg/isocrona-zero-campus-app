export function createApiClient(config = {}) {
  async function request(path, options = {}) {
    const method = String(options.method || "GET").toUpperCase();
    const headers = {
      ...(options.headers || {})
    };
    let body = options.body;

    if (body !== undefined && body !== null && !(body instanceof FormData)) {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
      body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers,
      body
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || `Error ${response.status}`);
    }

    return payload;
  }

  return {
    config,
    request,
    get(path, options = {}) {
      return request(path, { ...options, method: "GET" });
    },
    post(path, body, options = {}) {
      return request(path, { ...options, method: "POST", body });
    }
  };
}

export default createApiClient;
