import { escapeHtml } from './formatters.js';

export function renderNoticeFileInput(id) {
  return `<label class="inline-field studio-full">Documentos e imágenes
    <input id="${id}" type="file" name="attachments" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif" />
    <span class="field-hint">Hasta 5 archivos. Máximo 5 MB por archivo y 10 MB en total. PDF, Word, JPG, PNG, WebP o GIF.</span>
  </label>`;
}

export async function readNoticeFiles(input) {
  const files = Array.from(input?.files || []);
  if (files.length > 5) throw new Error('Puedes adjuntar hasta 5 archivos por aviso');
  if (files.some(file => !file.size || file.size > 5 * 1024 * 1024) || files.reduce((n, file) => n + file.size, 0) > 10 * 1024 * 1024) {
    throw new Error('Máximo 5 MB por archivo y 10 MB en total. No se admiten archivos vacíos');
  }
  if (files.some(file => !/\.(pdf|docx?|png|jpe?g|webp|gif)$/i.test(file.name))) throw new Error('Usa PDF, Word o imágenes JPG, PNG, WebP y GIF');
  return Promise.all(files.map(file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, contentBase64: String(reader.result).split(',')[1] });
    reader.onerror = () => reject(new Error(`No se ha podido leer ${file.name}. Vuelve a seleccionarlo`));
    reader.readAsDataURL(file);
  })));
}

export function noticeLink(notice, kind, origin = window.location.origin) {
  const url = new URL('/aviso.html', origin);
  url.searchParams.set('kind', kind);
  url.searchParams.set('id', notice.id);
  return url.href;
}

export function renderNoticeLinks(notice, kind, share = false) {
  const url = noticeLink(notice, kind);
  // A private, individually addressed notice must never be offered as a community announcement.
  const canShare = share && !(kind === 'member' && notice.targetType === 'member') && notice.active !== false;
  const text = `Isócrona Zero · ${notice.title || 'Nuevo aviso'}\nConsulta el aviso y sus adjuntos en el portal (acceso con tu cuenta):\n${url}`;
  return `<div class="chip-row notice-links"><a class="mini-button" href="${escapeHtml(url)}">Abrir aviso</a>${canShare ?
    `<a class="mini-button" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=${encodeURIComponent(text)}">Compartir en WhatsApp</a>` : ''}</div>${canShare ?
    '<p class="field-hint">WhatsApp abrirá el mensaje preparado. Selecciona el grupo de avisos de la comunidad y pulsa enviar.</p>' : ''}`;
}

export function renderNoticeAttachments(notice) {
  const files = (notice.attachments || []).filter(file => /^\/api\/notices\/(campus|member)\/[a-zA-Z0-9_-]+\/attachments\/[a-zA-Z0-9-]+$/.test(file.transportUrl || ''));
  if (!files.length) return '';
  return `<div class="notice-attachments">${files.map(file => {
    const url = escapeHtml(file.transportUrl), name = escapeHtml(file.name);
    const image = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type);
    return `<div class="notice-file">${image ? `<a href="${url}" target="_blank" rel="noopener"><img src="${url}" alt="${name}" loading="lazy" /></a>` : ''}
      <strong>${name}</strong><span class="muted">${Math.max(1, Math.ceil(Number(file.size || 0) / 1024))} KB</span>
      <div class="chip-row">${image || file.type === 'application/pdf' ? `<a class="mini-button" href="${url}" target="_blank" rel="noopener">Ver</a>` : ''}
      <a class="mini-button" href="${url}?download=1" download>Descargar</a></div></div>`;
  }).join('')}</div>`;
}
