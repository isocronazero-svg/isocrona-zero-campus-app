const { createHash } = require('node:crypto');
const MAX_IMAGE_BYTES = 500_000;
const MAX_BODY_BYTES = 7_000_000;
function safeBannerUrl(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (text.length > 2048 || /[\\\u0000-\u001f\u007f]/.test(text)) throw new Error('Enlace de patrocinador no válido');
  const url = new URL(text, 'https://banner.invalid');
  if (url.username || url.password || !((text.startsWith('/') && !text.startsWith('//')) || text.startsWith('https://'))) {
    throw new Error('Usa una ruta local o un enlace HTTPS');
  }
  return text;
}
function safeBannerImage(value) {
  const text = String(value || '').trim();
  if (!text.startsWith('data:')) return safeBannerUrl(text);
  const match = text.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match || match[2].length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) throw new Error('La imagen debe ser PNG, JPEG o WebP y ocupar como máximo 500 KB');
  const bytes = Buffer.from(match[2], 'base64');
  const valid = match[1] === 'png' ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : match[1] === 'jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP';
  if (!valid || bytes.length > MAX_IMAGE_BYTES || bytes.toString('base64') !== match[2]) throw new Error('El archivo no es una imagen válida');
  return text;
}
function normalizeBanners(value = []) {
  if (!Array.isArray(value) || value.length > 10) throw new Error('Puedes añadir hasta diez patrocinadores');
  return value.map((item, index) => {
    const title = String(item?.title || '').trim();
    if (title.length > 120) throw new Error('El nombre no puede superar 120 caracteres');
    const banner = { id: `banner-${index + 1}`, enabled: item?.enabled === true, title,
      imageUrl: safeBannerImage(item?.imageUrl), targetUrl: safeBannerUrl(item?.targetUrl) };
    if (banner.enabled && (!banner.title || !banner.imageUrl)) throw new Error('Cada patrocinador activo necesita nombre e imagen');
    return banner;
  });
}
function normalizeDisplay(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Configuración de patrocinadores inválida');
  const slots = value.slots ?? 1, intervalSeconds = value.intervalSeconds ?? 6;
  if (![1,2].includes(slots) || !Number.isInteger(intervalSeconds) || intervalSeconds < 5 || intervalSeconds > 30) {
    throw new Error('Elige uno o dos espacios y un intervalo de 5 a 30 segundos');
  }
  return { enabled: value.enabled === true, slots, intervalSeconds };
}
function publicBanners(value) {
  try { return normalizeBanners(value).filter(item => item.enabled); } catch { return []; }
}
function bannerSnapshot(state) {
  return { banners: normalizeBanners(state.settings?.banners), display: normalizeDisplay(state.settings?.bannerDisplay), revision: Number(state.settings?.bannersRevision || 0) };
}
function preserveBannerSettings(current, next) {
  next.settings = { ...next.settings, banners: current.settings?.banners || [],
    bannerDisplay: current.settings?.bannerDisplay || {enabled:false,slots:1,intervalSeconds:6},
    bannersRevision: Number(current.settings?.bannersRevision || 0) };
}
function createBannerHandler(deps) {
  return async (req, res, url) => {
    const isPublic = url.pathname === '/api/public/banners';
    const isAdmin = url.pathname === '/api/admin/banners';
    if (!isPublic && !isAdmin) return false;
    res.setHeader('Cache-Control', 'no-store');
    try {
      if (isPublic && req.method === 'GET') {
        const snapshot = bannerSnapshot(deps.readState());
        const banners = snapshot.display.enabled ? snapshot.banners.filter(item => item.enabled) : [];
        deps.sendJson(res, 200, { ok:true, banners, display:snapshot.display, revision:snapshot.revision });
      } else if (isAdmin && ['GET','PUT'].includes(req.method)) {
        if (!deps.requireAdminAccount(req, res, deps.readState())) return true;
        if (req.method === 'GET') { deps.sendJson(res, 200, {ok:true,...bannerSnapshot(deps.readState())}); return true; }
        const body = await deps.readJsonBody(req, MAX_BODY_BYTES);
        const banners = normalizeBanners(body.banners), display = normalizeDisplay(body.display);
        const state = deps.readState();
        if (!deps.requireAdminAccount(req, res, state)) return true;
        const current = bannerSnapshot(state);
        const digest = object => createHash('sha256').update(JSON.stringify(object)).digest('hex');
        const unchanged = digest({banners,display}) === digest({banners:current.banners,display:current.display});
        if (!Number.isSafeInteger(body.expectedRevision) || body.expectedRevision < 0) throw new Error('Recarga la configuración antes de guardar');
        if (!unchanged && body.expectedRevision !== current.revision) {
          deps.sendJson(res,409,{ok:false,error:'Otra pestaña ha actualizado los patrocinadores. Tu formulario se conserva. Copia los cambios que quieras mantener y recarga la configuración.'});return true;
        }
        if (!unchanged) {
          state.settings = {...state.settings,banners,bannerDisplay:display,bannersRevision:current.revision+1};
          deps.writeState(state);
        }
        deps.sendJson(res,200,{ok:true,...bannerSnapshot(state),message:'Patrocinadores guardados'});
      } else deps.sendJson(res,405,{ok:false,error:'Método no permitido'});
    } catch (error) { deps.sendJsonError(res,error,'No se pudieron guardar los patrocinadores'); }
    return true;
  };
}
module.exports = { normalizeBanners, normalizeDisplay, publicBanners, safeBannerImage, preserveBannerSettings, createBannerHandler, MAX_BODY_BYTES };
