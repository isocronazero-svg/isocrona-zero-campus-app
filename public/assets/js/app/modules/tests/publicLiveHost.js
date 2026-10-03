let stopCurrent = () => {};

export function stopPublicLiveHost() { stopCurrent(); }

// Update only the room list. The create-room form keeps its values and focus.
export function startPublicLiveHost({ container, loadSessions, renderSessions, getGeneration }) {
  stopPublicLiveHost();
  const list = container.querySelector('[data-live-host-list]');
  const status = container.querySelector('[data-live-host-status]');
  if (!list) return;
  const generation = getGeneration();
  let stopped = false, suspended = false, busy = false, controller, timer, clock, signature = '', delay = 3000;
  const valid = () => !stopped && list.isConnected && getGeneration() === generation
    && container.querySelector('[data-live-host-list]') === list;
  function stop() {
    stopped = true; clearTimeout(timer); clearInterval(clock); controller?.abort();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('pageshow', onPageShow);
  }
  stopCurrent = stop;
  function schedule(ms = delay) {
    clearTimeout(timer);
    if (!valid()) { stop(); return; }
    if (!document.hidden && !suspended) timer = setTimeout(poll, ms);
  }
  async function poll() {
    if (!valid()) { stop(); return; }
    if (document.hidden || suspended || busy) return;
    busy = true;
    const request = new AbortController(); controller = request;
    const timeout = setTimeout(() => request.abort(), 10000);
    try {
      const sessions = await loadSessions({ signal: request.signal, isCurrent: () => valid() && !request.signal.aborted });
      if (!valid() || request.signal.aborted || !sessions) return;
      const next = JSON.stringify(sessions.map(({ serverNow, ...session }) => session));
      if (next !== signature) {
        const active = document.activeElement;
        const focus = list.contains(active) ? { action: active.dataset?.action, sessionId: active.dataset?.sessionId } : null;
        list.innerHTML = renderSessions(sessions); signature = next;
        if (focus?.action) {
          const target = [...list.querySelectorAll('[data-action]')].find(node =>
            node.dataset.action === focus.action && node.dataset.sessionId === focus.sessionId);
          target?.focus({ preventScroll: true });
        }
      }
      delay = 3000;
      if (status) status.textContent = 'Actualización automática activa.';
      tick();
    } catch (error) {
      if (!valid() || document.hidden || suspended) return;
      if ([401, 403].includes(error.status)) { if (status) status.textContent = 'Vuelve a iniciar sesión para actualizar la sala.'; stop(); return; }
      delay = Math.min(30000, delay * 2);
      if (status) status.textContent = 'No se pudo actualizar. Reintentando automáticamente…';
    } finally {
      clearTimeout(timeout); busy = false;
      if (controller === request) controller = null;
      if (valid()) schedule();
    }
  }
  function tick() {
    if (!valid()) { stop(); return; }
    if (document.hidden || suspended) return;
    for (const node of list.querySelectorAll('[data-public-live-countdown]')) {
      const deadline = Date.parse(node.dataset.deadline), serverNow = Date.parse(node.dataset.serverNow);
      const receivedAt = Number(node.dataset.receivedAt);
      if (Number.isFinite(deadline) && Number.isFinite(serverNow) && Number.isFinite(receivedAt)) {
        const remaining = Math.max(0, Math.ceil((deadline - serverNow - Math.max(0, Date.now() - receivedAt)) / 1000));
        node.textContent = remaining ? `${remaining} s` : 'Tiempo agotado';
      }
    }
  }
  function onVisibility() {
    if (document.hidden) { clearTimeout(timer); controller?.abort(); }
    else { tick(); schedule(0); }
  }
  function onPageHide() {
    suspended = true; clearTimeout(timer); clearInterval(clock); controller?.abort();
  }
  function onPageShow() {
    if (!valid()) { stop(); return; }
    suspended = false; clearInterval(clock); clock = setInterval(tick, 1000);
    tick(); schedule(0);
  }
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);
  clock = setInterval(tick, 1000); tick(); schedule();
}
