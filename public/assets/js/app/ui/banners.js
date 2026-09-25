import { escapeHtml } from "./formatters.js";

let cached = null;
let pending = null;
export function invalidateBanners() { cached = null; pending = null; }

export function renderBannerSettings(banners = []) {
  return `<form id="bannersForm" class="stack">
    <h3>Banners propios</h3>
    ${[0, 1, 2].map(index => {
      const banner = banners[index] || {};
      return `<fieldset class="own-banner-editor"><legend>Banner ${index + 1}</legend>
        <label class="checkbox-field"><input type="checkbox" name="enabled-${index}" ${banner.enabled ? "checked" : ""}>Activo</label>
        <label class="inline-field">Titulo<input name="title-${index}" maxlength="120" value="${escapeHtml(banner.title || "")}"></label>
        <label class="inline-field">URL de imagen<input name="imageUrl-${index}" maxlength="2048" placeholder="https://... o /assets/..." value="${escapeHtml(banner.imageUrl || "")}"></label>
        <label class="inline-field">Enlace de destino (opcional)<input name="targetUrl-${index}" maxlength="2048" placeholder="https://... o /join.html" value="${escapeHtml(banner.targetUrl || "")}"></label>
      </fieldset>`;
    }).join("")}
    <div><button class="primary-button" type="submit">Guardar banners</button></div>
    <p data-banner-status role="status"></p>
  </form>`;
}

export function readBannerSettings(form) {
  const data = new FormData(form);
  return [0, 1, 2].map(index => ({ enabled: data.has(`enabled-${index}`), title: data.get(`title-${index}`),
    imageUrl: data.get(`imageUrl-${index}`), targetUrl: data.get(`targetUrl-${index}`) }));
}

function safeUrl(value) {
  const text = String(value || "").trim();
  try {
    const url = new URL(text, location.origin);
    return text && !/[\\\u0000-\u001f\u007f]/.test(text) && !url.username && !url.password &&
      ((text.startsWith("/") && !text.startsWith("//")) || text.startsWith("https://")) ? text : "";
  } catch { return ""; }
}

export async function renderBanners(container) {
  if (!container) return;
  try {
    if (!cached || cached.expiresAt < Date.now()) {
      pending ||= fetch("/api/public/banners", { credentials: "omit", cache: "no-store" })
        .then(async response => { if (!response.ok) throw new Error("Banners no disponibles"); return response.json(); })
        .then(payload => { cached = { items: payload.banners || [], expiresAt: Date.now() + 60000 }; return cached; })
        .finally(() => { pending = null; });
      await pending;
    }
    if (!container.isConnected) return;
    container.replaceChildren();
    for (const banner of cached.items.slice(0, 3)) {
      const imageUrl = safeUrl(banner.imageUrl), targetUrl = safeUrl(banner.targetUrl);
      if (!banner.enabled || !imageUrl) continue;
      const item = document.createElement("article");
      item.className = "own-banner";
      const label = document.createElement("p");
      label.textContent = "Publicidad propia";
      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = String(banner.title || "");
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("error", () => { item.remove(); container.hidden = !container.children.length; });
      const content = targetUrl ? document.createElement("a") : document.createElement("div");
      if (targetUrl) { content.href = targetUrl; content.rel = "noopener noreferrer sponsored"; }
      content.append(image);
      item.append(label, content);
      container.append(item);
    }
    container.hidden = !container.children.length;
  } catch {
    container.replaceChildren();
    container.hidden = true;
  }
}
