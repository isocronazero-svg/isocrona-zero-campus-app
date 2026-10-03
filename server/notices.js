const { randomUUID } = require('node:crypto');

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;
const MAX_NOTICE_BODY_BYTES = 15 * 1024 * 1024;
const TYPES = {
  pdf: 'application/pdf', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif'
};

function isActiveAssociate(associate) {
  const status = String(associate?.status || associate?.situation || associate?.estado || '').toLowerCase();
  return Boolean(associate) && (!status || /activa|activo|alta/.test(status));
}

function queueNoticeEmails(state, notice, baseUrl) {
  const members = (state.members || []).map(member => {
    const associate = (state.associates || []).find(item => item.id === member.associateId || item.linkedMemberId === member.id ||
      (item.email && String(item.email).toLowerCase() === String(member.email || '').toLowerCase()));
    return { memberId: member.id, associateId: associate?.id || member.associateId || '', name: member.name, email: member.email };
  });
  const associates = (state.associates || []).filter(item => notice.audience !== 'active-associates' || isActiveAssociate(item))
    .map(item => ({ memberId: item.linkedMemberId || '', associateId: item.id,
      name: [item.firstName, item.lastName].filter(Boolean).join(' '), email: item.email }));
  let recipients = [...associates, ...members];
  if (notice.audience === 'associates') recipients = [...associates, ...members.filter(item => item.associateId)];
  if (notice.audience === 'active-associates') recipients = associates;
  if (notice.audience === 'campus-only') recipients = members.filter(item => !item.associateId);
  if (notice.audience === 'course') {
    const course = (state.courses || []).find(item => item.id === notice.courseId);
    const ids = new Set([...(course?.enrolledIds || []), ...(course?.waitingIds || []), ...(course?.diplomaReady || [])]);
    recipients = members.filter(item => ids.has(item.memberId));
  }
  const seen = new Set();
  state.emailOutbox ||= [];
  for (const recipient of recipients) {
    const email = String(recipient.email || '').trim(), key = email.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    state.emailOutbox.unshift({ id: `mail-notice-${randomUUID()}`, manualNoticeId: notice.id,
      courseId: notice.courseId, memberId: recipient.memberId, associateId: recipient.associateId, to: email,
      subject: `${notice.title} - Isocrona Zero`, sentAt: new Date().toISOString(),
      body: `Hola ${recipient.name || 'socio'},\n\n${notice.title}\n\n${notice.detail}\n\nConsulta el aviso y sus adjuntos en el portal:\n${baseUrl}/aviso.html?kind=campus&id=${encodeURIComponent(notice.id)}\n\nIsócrona Zero`,
      status: state.settings?.smtp?.host ? 'queued' : 'manual', transport: state.settings?.smtp?.host ? 'smtp-pending' : 'manual' });
  }
  return seen.size;
}

function normalizeNoticeAttachments(value = []) {
  if (!Array.isArray(value) || value.length > 5) throw new Error('Puedes adjuntar hasta 5 archivos por aviso');
  let total = 0;
  return value.map(file => {
    const name = String(file?.name || '').replace(/[\\/\u0000-\u001f\u007f]/g, '_').trim();
    const ext = name.split('.').pop().toLowerCase();
    const type = TYPES[ext];
    const encoded = String(file?.contentBase64 || '');
    if (!name || name.length > 180 || !type) throw new Error('Usa PDF, Word o imágenes PNG, JPG, WebP y GIF');
    if (!encoded || encoded.length > Math.ceil(MAX_FILE_BYTES / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
      throw new Error('Cada archivo debe ocupar entre 1 byte y 5 MB');
    }
    const bytes = Buffer.from(encoded, 'base64');
    total += bytes.length;
    if (!bytes.length || bytes.length > MAX_FILE_BYTES || total > MAX_TOTAL_BYTES || bytes.toString('base64') !== encoded) {
      throw new Error('Máximo 5 MB por archivo y 10 MB en total por aviso');
    }
    const signature = ext === 'pdf' ? bytes.subarray(0, 5).toString() === '%PDF-'
      : ext === 'doc' ? bytes.subarray(0, 8).equals(Buffer.from('d0cf11e0a1b11ae1', 'hex'))
      : ext === 'docx' ? bytes.subarray(0, 4).equals(Buffer.from('504b0304', 'hex'))
      : ext === 'png' ? bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
      : ['jpg', 'jpeg'].includes(ext) ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : ext === 'gif' ? /^GIF8[79]a$/.test(bytes.subarray(0, 6).toString())
      : bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
    if (!signature) throw new Error(`El contenido de ${name} no coincide con su formato`);
    return { id: randomUUID(), name, type, size: bytes.length, contentBase64: encoded };
  });
}

function compactNotice(notice, kind) {
  return { ...notice, attachments: (notice.attachments || []).map(file => ({
    id: file.id, name: file.name, type: file.type, size: file.size,
    transportUrl: `/api/notices/${kind}/${encodeURIComponent(notice.id)}/attachments/${encodeURIComponent(file.id)}`
  })) };
}

function canAccessCampusNotice(state, account, notice) {
  if (!account || !notice) return false;
  if (account.role === 'admin') return true;
  if (notice.active === false || notice.channels?.campus === false ||
      (notice.expiresAt && new Date(notice.expiresAt).getTime() <= Date.now())) return false;
  const member = (state.members || []).find(item => item.id === account.memberId);
  const email = String(member?.email || account.email || '').trim().toLowerCase();
  const associate = (state.associates || []).find(item =>
    item.id === member?.associateId || item.id === account.associateId ||
    (account.memberId && item.linkedMemberId === account.memberId) ||
    (email && String(item.email || '').trim().toLowerCase() === email));
  switch (notice.audience) {
    case 'active-associates': return isActiveAssociate(associate);
    case 'associates': return Boolean(associate);
    case 'campus-only': return !associate;
    case 'course': return Boolean(account.memberId && (state.courses || []).some(course =>
      course.id === notice.courseId && ['enrolledIds', 'waitingIds', 'diplomaReady'].some(key =>
        (course[key] || []).includes(account.memberId))));
    case 'all': case undefined: return true;
    default: return false;
  }
}

function publicNotice(notice, kind) {
  const { attachments } = compactNotice(notice, kind);
  return { id: notice.id, kind, title: notice.title, body: kind === 'campus' ? notice.detail : notice.body,
    createdAt: notice.publishedAt || notice.createdAt, attachments };
}

function createNoticesHandler(deps) {
  return async (req, res, url) => {
    const create = url.pathname === '/api/campus-notices';
    const match = url.pathname.match(/^\/api\/notices\/(campus|member)\/([^/]+)(?:\/attachments\/([^/]+))?$/);
    if (!create && !match) return false;
    res.setHeader('Cache-Control', 'private, no-store');
    try {
      let state = deps.readState();
      let account = deps.requireAuthenticatedAccount(req, res, state);
      if (!account) return true;
      if (create && req.method === 'POST') {
        if (!deps.requireAdminAccount(req, res, state)) return true;
        const body = await deps.readJsonBody(req, MAX_NOTICE_BODY_BYTES);
        state = deps.readState();
        account = deps.requireAdminAccount(req, res, state);
        if (!account) return true;
        const requestId = String(body.clientRequestId || '');
        if (requestId && !/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) throw new Error('Identificador de publicación inválido');
        const previous = requestId && (state.manualCampusNotices || []).find(item =>
          item.clientRequestId === requestId && item.createdByAccountId === account.id);
        if (previous) { deps.sendJson(res, 200, { ok: true, notice: compactNotice(previous, 'campus'), duplicate: true, queuedEmails: previous.queuedEmails || 0 }); return true; }
        const title = String(body.title || '').trim(), detail = String(body.detail || '').trim();
        if (!title || title.length > 120 || !detail || detail.length > 10000) throw new Error('Escribe un título (máximo 120 caracteres) y un mensaje (máximo 10.000)');
        if (!['all', 'associates', 'active-associates', 'campus-only', 'course'].includes(body.audience)) throw new Error('Destinatarios no válidos');
        const courseId = String(body.courseId || '');
        if (courseId && !(state.courses || []).some(course => course.id === courseId)) throw new Error('El curso no existe');
        if (body.audience === 'course' && !courseId) throw new Error('Selecciona el curso destinatario');
        const expiresAt = String(body.expiresAt || '');
        if (expiresAt && (!Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now())) throw new Error('La caducidad debe ser una fecha futura');
        const notice = { id: `notice-${randomUUID()}`, title, detail, audience: body.audience, courseId,
          tone: ['info', 'warning', 'success'].includes(body.tone) ? body.tone : 'info',
          actionLabel: String(body.actionLabel || '').trim().slice(0, 80), expiresAt, active: true,
          publishedAt: new Date().toISOString(), createdByAccountId: account.id, clientRequestId: requestId,
          channels: { campus: true, email: body.sendEmail === true, whatsapp: false }, attachments: normalizeNoticeAttachments(body.attachments) };
        notice.queuedEmails = body.sendEmail === true ? queueNoticeEmails(state, notice, deps.baseUrl) : 0;
        state.manualCampusNotices = [notice, ...(state.manualCampusNotices || [])];
        deps.appendActivity(state, 'admin', account.name || 'Administración', `Publica novedad: ${title}`);
        deps.writeState(state);
        deps.sendJson(res, 201, { ok: true, notice: compactNotice(notice, 'campus'), queuedEmails: notice.queuedEmails });
        return true;
      }
      if (!match) { deps.sendJson(res, 405, { ok: false, error: 'Método no permitido' }); return true; }
      const [, kind, id, fileId] = match;
      const collection = kind === 'campus' ? 'manualCampusNotices' : 'memberNotifications';
      const notice = (state[collection] || []).find(item => item.id === id);
      const allowed = kind === 'campus' ? canAccessCampusNotice(state, account, notice)
        : notice && (account.role === 'admin' || (account.memberId && (notice.targetType === 'all' || notice.memberId === account.memberId)));
      if (!allowed) { deps.sendJson(res, 404, { ok: false, error: 'Este aviso no está disponible para tu cuenta' }); return true; }
      if (req.method === 'GET' && !fileId) {
        deps.sendJson(res, 200, { ok: true, notice: publicNotice(notice, kind) });
      } else if (req.method === 'GET' && fileId) {
        const file = (notice.attachments || []).find(item => item.id === fileId);
        if (!file?.contentBase64) { deps.sendJson(res, 404, { ok: false, error: 'Archivo no disponible' }); return true; }
        const bytes = Buffer.from(file.contentBase64, 'base64');
        const inline = url.searchParams.get('download') !== '1' && (file.type.startsWith('image/') || file.type === 'application/pdf');
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        res.writeHead(200, { 'Content-Type': file.type, 'Content-Length': bytes.length,
          'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox; default-src 'none'",
          'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(file.name).replace(/'/g, '%27')}` });
        res.end(bytes);
      } else if (kind === 'campus' && !fileId && ['PATCH', 'DELETE'].includes(req.method)) {
        if (!deps.requireAdminAccount(req, res, state)) return true;
        const body = req.method === 'PATCH' ? await deps.readJsonBody(req, 1024) : {};
        state = deps.readState();
        if (!deps.requireAdminAccount(req, res, state)) return true;
        const current = (state.manualCampusNotices || []).find(item => item.id === id);
        if (!current) { deps.sendJson(res, 404, { ok: false, error: 'Aviso no disponible' }); return true; }
        if (req.method === 'DELETE') state.manualCampusNotices = state.manualCampusNotices.filter(item => item.id !== id);
        else { if (typeof body.active !== 'boolean') throw new Error('Estado no válido'); current.active = body.active; }
        deps.appendActivity(state, 'admin', account.name || 'Administración', `${req.method === 'DELETE' ? 'Elimina' : body.active ? 'Publica de nuevo' : 'Oculta'} novedad: ${current.title}`);
        deps.writeState(state);
        deps.sendJson(res, 200, { ok: true });
      } else deps.sendJson(res, 405, { ok: false, error: 'Método no permitido' });
    } catch (error) { deps.sendJsonError(res, error, 'No se pudo guardar el aviso'); }
    return true;
  };
}

module.exports = { normalizeNoticeAttachments, compactNotice, canAccessCampusNotice, createNoticesHandler, MAX_NOTICE_BODY_BYTES };
