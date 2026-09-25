function safeBannerUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.length > 2048 || /[\\\u0000-\u001f\u007f]/.test(text)) throw new Error("Enlace del banner no valido");
  const url = new URL(text, "https://banner.invalid");
  if (url.username || url.password || !(text.startsWith("/") && !text.startsWith("//") || text.startsWith("https://"))) {
    throw new Error("Usa una ruta local o un enlace HTTPS para el banner");
  }
  return text;
}

function normalizeBanners(value = []) {
  if (!Array.isArray(value) || value.length > 3) throw new Error("Se permiten hasta tres banners propios");
  return value.map((item, index) => {
    const title = String(item?.title || "").trim();
    if (title.length > 120) throw new Error("El titulo del banner no puede superar 120 caracteres");
    const banner = { id: `banner-${index + 1}`, enabled: item?.enabled === true, title,
      imageUrl: safeBannerUrl(item?.imageUrl), targetUrl: safeBannerUrl(item?.targetUrl) };
    if (banner.enabled && (!banner.title || !banner.imageUrl)) throw new Error("Un banner activo necesita titulo e imagen");
    return banner;
  });
}

function publicBanners(value) {
  try { return normalizeBanners(value).filter(banner => banner.enabled); }
  catch { return []; }
}

function createBannerHandler(deps) {
  return async (req, res, url) => {
    const isPublic = url.pathname === "/api/public/banners";
    const isAdmin = url.pathname === "/api/admin/banners";
    if (!isPublic && !isAdmin) return false;
    res.setHeader("Cache-Control", "no-store");
    try {
      if (isPublic && req.method === "GET") {
        deps.sendJson(res, 200, { ok: true, banners: publicBanners(deps.readState().settings?.banners) });
      } else if (isAdmin && req.method === "PUT") {
        if (!deps.requireAdminAccount(req, res, deps.readState())) return true;
        const body = await deps.readJsonBody(req, 16384);
        const banners = normalizeBanners(body.banners);
        const state = deps.readState();
        const account = deps.requireAdminAccount(req, res, state);
        if (!account) return true;
        state.settings = { ...state.settings, banners };
        deps.writeState(state);
        deps.sendJson(res, 200, { ok: true, banners, state: deps.prepareStateForTransport(state, account), message: "Banners guardados" });
      } else {
        deps.sendJson(res, 405, { ok: false, error: "Metodo no permitido" });
      }
    } catch (error) {
      deps.sendJsonError(res, error, "No se pudieron guardar los banners");
    }
    return true;
  };
}

module.exports = { normalizeBanners, publicBanners, createBannerHandler };
