// Owns the persistent navigation chrome; page renders keep their existing actions.
export function createMobileNavigation({ shell, sidebar, content, mediaQuery }) {
  if (!shell || !sidebar || !content) return { close() {}, update() {} };
  let open = false, authenticated = false;
  const bar = document.createElement('div');
  bar.className = 'mobile-shell-bar';
  bar.innerHTML = `<button class="ghost-button mobile-shell-toggle" id="mobileShellToggle" type="button" aria-expanded="false" aria-controls="sidebar" aria-label="Abrir menú principal">
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Menú</span></button>
    <div class="portal-location"><span>Isócrona Zero</span><strong class="mobile-shell-title">Mi portal</strong></div><span class="portal-mode"></span>`;
  content.prepend(bar);
  const toggle = bar.querySelector('#mobileShellToggle'), title = bar.querySelector('.mobile-shell-title'), mode = bar.querySelector('.portal-mode');
  const closeButton = document.createElement('button');
  closeButton.type = 'button'; closeButton.className = 'ghost-button mobile-menu-close';
  closeButton.textContent = 'Cerrar menú ×'; closeButton.setAttribute('aria-label', 'Cerrar menú principal');
  sidebar.prepend(closeButton);
  const backdrop = document.createElement('button');
  backdrop.type = 'button'; backdrop.className = 'shell-mobile-backdrop'; backdrop.tabIndex = -1;
  backdrop.setAttribute('aria-label', 'Cerrar menú principal'); shell.append(backdrop);
  sidebar.tabIndex = -1;
  sidebar.setAttribute('aria-label', 'Menú principal');
  function setOpen(value, restoreFocus = true) {
    const wasOpen = open;
    open = Boolean(value && mediaQuery.matches && authenticated);
    shell.classList.toggle('shell-mobile-menu-open', open);
    document.body.classList.toggle('shell-mobile-lock', open);
    content.inert = open;
    sidebar.inert = mediaQuery.matches && !open;
    sidebar.toggleAttribute('aria-hidden', sidebar.inert);
    if (sidebar.inert) sidebar.setAttribute('aria-hidden', 'true');
    backdrop.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú principal' : 'Abrir menú principal');
    if (open) { sidebar.setAttribute('role', 'dialog'); sidebar.setAttribute('aria-modal', 'true'); }
    else { sidebar.removeAttribute('role'); sidebar.removeAttribute('aria-modal'); }
    if (open && !wasOpen) { sidebar.scrollTop = 0; closeButton.focus({preventScroll:true}); }
    if (!open && wasOpen && restoreFocus && authenticated) {
      if (mediaQuery.matches) toggle.focus({preventScroll:true});
      else if (document.activeElement === closeButton) sidebar.querySelector('.nav-main-button')?.focus({preventScroll:true});
    }
  }
  const close = () => setOpen(false);
  toggle.addEventListener('click', () => setOpen(!open));
  closeButton.addEventListener('click', close); backdrop.addEventListener('click', close);
  mediaQuery.addEventListener('change', () => setOpen(false));
  document.addEventListener('keydown', event => {
    if (!open) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...sidebar.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')]
      .filter(node => !node.disabled && node.tabIndex >= 0 && !node.closest('[hidden], [inert]') && node.getClientRects().length);
    const first = focusable[0] || sidebar, last = focusable.at(-1) || sidebar;
    if (!sidebar.contains(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
      event.preventDefault(); (event.shiftKey ? last : first).focus();
    }
  });
  return {
    close,
    update({ label = 'Mi portal', modeLabel = '', visible = false } = {}) {
      const entering = visible && !authenticated;
      const changedMode = mode.textContent !== modeLabel;
      authenticated = visible;
      if (entering || changedMode) sidebar.scrollTop = 0;
      title.textContent = label; mode.textContent = modeLabel;
      mode.hidden = !modeLabel; shell.hidden = !visible;
      setOpen(open, false);
    }
  };
}
