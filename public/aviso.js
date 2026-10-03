import { escapeHtml } from './assets/js/app/ui/formatters.js';
import { renderNoticeAttachments } from './assets/js/app/ui/notices.js';

const content = document.getElementById('noticeContent');
const params = new URLSearchParams(location.search);
const kind = params.get('kind'), id = params.get('id');
async function load() {
  try {
    if (!['campus', 'member'].includes(kind) || !/^[a-zA-Z0-9_-]+$/.test(id || '')) throw new Error('El enlace del aviso no es válido');
    const response = await fetch(`/api/notices/${kind}/${id}`, { cache: 'no-store' });
    if (response.status === 401) {
      const login = new URL('/', location.origin);
      login.searchParams.set('notice', id);
      login.searchParams.set('noticeKind', kind);
      content.innerHTML = `<h1>Entra para ver el aviso</h1><p>Accede con tu cuenta del portal para consultar este aviso y sus archivos.</p><a class="primary-button" href="${escapeHtml(login.href)}">Iniciar sesión</a>`;
      return;
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo cargar el aviso');
    const notice = result.notice;
    document.title = `${notice.title} | Isócrona Zero`;
    content.innerHTML = `<h1>${escapeHtml(notice.title)}</h1><p class="muted">${escapeHtml(new Date(notice.createdAt).toLocaleString('es-ES'))}</p><p class="notice-body">${escapeHtml(notice.body)}</p>${renderNoticeAttachments(notice)}`;
  } catch (error) {
    content.innerHTML = `<h1>Aviso no disponible</h1><p>${escapeHtml(error.message)}</p><button class="mini-button" id="retryNotice">Volver a intentar</button>`;
    document.getElementById('retryNotice').onclick = load;
  }
}
load();
