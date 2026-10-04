import { escapeHtml } from './formatters.js';

let cached = null, pending = null, generation = 0;
const controllers = new WeakMap(), renderTokens = new WeakMap(), editors = new WeakMap();
export function invalidateBanners() { generation++; cached = null; pending = null; }
function safeUrl(value, image = false) {
  const text = String(value || '').trim();
  if (image && text.length < 670000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(text)) return text;
  try {
    const url = new URL(text, location.origin);
    return text && text.length <= 2048 && !/[\\\u0000-\u001f\u007f]/.test(text) && !url.username && !url.password &&
      ((text.startsWith('/') && !text.startsWith('//')) || text.startsWith('https://')) ? text : '';
  } catch { return ''; }
}
const el = (tag, text = '', className = '') => {
  const node = document.createElement(tag); node.textContent = text; if (className) node.className = className; return node;
};

export function createBannerCarousel(container, payload) {
  let items = (payload.banners || []).filter(item => item.enabled && safeUrl(item.imageUrl, true)).slice(0,10);
  let index = 0, timer = null, disposed = false, hover = false, focus = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 640px)');
  let paused = reduced.matches;
  const display = payload.display || {};
  const interval = Math.max(5, Math.min(30, Number(display.intervalSeconds) || 6)) * 1000;
  const count = () => Math.min(items.length, compact.matches ? 1 : display.slots === 2 ? 2 : 1);
  const header = el('div','','sponsor-heading'), title = el('p','Nuestros colaboradores','sponsor-label');
  const controls = el('div','','sponsor-controls'), previous = el('button','‹'), next = el('button','›'), pause = el('button','Pausar');
  for (const button of [previous,pause,next]) button.type = 'button';
  previous.setAttribute('aria-label','Mostrar patrocinadores anteriores'); next.setAttribute('aria-label','Mostrar siguientes patrocinadores');
  const progress = el('span','','sponsor-progress');
  controls.append(previous,pause,next,progress); header.append(title,controls);
  const grid = el('div','','sponsor-grid');
  container.replaceChildren(header,grid);
  container.setAttribute('aria-label','Patrocinadores de Isócrona Zero');
  function cancel() { if (timer !== null) clearTimeout(timer); timer = null; }
  function schedule() {
    cancel();
    if (disposed || paused || hover || focus || document.hidden || items.length <= count()) return;
    timer = setTimeout(() => {
      if (!container.isConnected) { destroy(); return; }
      index = (index + count()) % items.length; draw();
    },interval);
  }
  function draw() {
    cancel();
    if (disposed) return;
    grid.replaceChildren(); container.hidden = !items.length;
    if (!items.length) return;
    index %= items.length;
    grid.dataset.slots = String(count());
    controls.hidden = items.length <= count();
    pause.textContent = paused ? 'Reanudar' : 'Pausar';
    pause.setAttribute('aria-label',paused ? 'Reanudar rotación automática' : 'Pausar rotación automática');
    pause.setAttribute('aria-pressed',String(paused));
    progress.textContent = `${index + 1} / ${items.length}`;
    for (let offset = 0; offset < count(); offset++) {
      const item = items[(index + offset) % items.length];
      const target = safeUrl(item.targetUrl), card = el(target ? 'a' : 'article','','sponsor-card');
      const content = el('div','','sponsor-image-wrap');
      if (target) { card.href = target; card.target = '_blank'; card.rel = 'noopener noreferrer sponsored'; card.setAttribute('aria-label',`${item.title} (abre en otra pestaña)`); }
      const image = el('img'); image.alt = String(item.title || 'Patrocinador'); image.referrerPolicy = 'no-referrer'; image.decoding = 'async';
      image.addEventListener('error',() => { if (disposed || !grid.contains(image)) return; items = items.filter(banner => banner !== item); draw(); });
      image.src = safeUrl(item.imageUrl,true);
      content.append(image); card.append(content,el('span',String(item.title || ''),'sponsor-name')); grid.append(card);
    }
    schedule();
  }
  const onPrevious = () => { index = (index - count() + items.length) % items.length; draw(); };
  const onNext = () => { index = (index + count()) % items.length; draw(); };
  const onPause = () => { paused = !paused; draw(); };
  const onEnter = () => { hover = true; cancel(); }, onLeave = () => { hover = false; schedule(); };
  const onFocus = () => { focus = true; cancel(); }, onBlur = event => { focus = container.contains(event.relatedTarget); schedule(); };
  const onVisibility = () => { if (!container.isConnected) destroy(); else schedule(); };
  const onReduced = () => { paused = reduced.matches; draw(); }, onCompact = () => draw();
  previous.addEventListener('click',onPrevious); next.addEventListener('click',onNext); pause.addEventListener('click',onPause);
  container.addEventListener('mouseenter',onEnter); container.addEventListener('mouseleave',onLeave);
  container.addEventListener('focusin',onFocus); container.addEventListener('focusout',onBlur);
  document.addEventListener('visibilitychange',onVisibility); reduced.addEventListener('change',onReduced); compact.addEventListener('change',onCompact);
  function destroy() {
    if (disposed) return; disposed = true; cancel();
    container.removeEventListener('mouseenter',onEnter); container.removeEventListener('mouseleave',onLeave);
    container.removeEventListener('focusin',onFocus); container.removeEventListener('focusout',onBlur);
    document.removeEventListener('visibilitychange',onVisibility); reduced.removeEventListener('change',onReduced); compact.removeEventListener('change',onCompact);
  }
  draw(); return { destroy, signature: payload.revision };
}

export async function renderBanners(container, { visible = true } = {}) {
  if (!container) return;
  const token = {}; renderTokens.set(container,token);
  if (!visible) { controllers.get(container)?.destroy(); controllers.delete(container); container.replaceChildren(); container.hidden = true; return; }
  try {
    if (!cached || cached.expiresAt < Date.now()) {
      if (!pending) {
        const requestedGeneration = generation;
        const request = fetch('/api/public/banners',{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(10000)})
          .then(async response => { if (!response.ok) throw new Error('Patrocinadores no disponibles'); return response.json(); })
          .then(payload => { if (requestedGeneration !== generation) return null; cached = {...payload,expiresAt:Date.now()+60000}; return cached; })
          .finally(() => { if (pending === request) pending = null; });
        pending = request;
      }
      await pending;
    }
    if (!container.isConnected || renderTokens.get(container) !== token || !cached) return;
    const signature = `${generation}:${cached.revision}`;
    if (controllers.get(container)?.signature === signature) return;
    controllers.get(container)?.destroy(); controllers.delete(container);
    if (!cached.display?.enabled || !cached.banners?.length) { container.replaceChildren(); container.hidden = true; return; }
    const controller = createBannerCarousel(container,cached); controller.signature = signature; controllers.set(container,controller);
  } catch {
    if (renderTokens.get(container) !== token) return;
    controllers.get(container)?.destroy(); controllers.delete(container); container.replaceChildren(); container.hidden = true;
  }
}

export function renderBannerSettings(banners = [], display = {}) {
  return `<form id="bannersForm" class="sponsor-settings">
    <h3>Patrocinadores</h3><p>Sube hasta diez logos o carteles. Se mostrarán en la parte superior del portal, sin interrumpir la Zona Test.</p>
    <div class="sponsor-settings-grid">
      <label class="checkbox-field"><input type="checkbox" name="sponsorsEnabled" ${display.enabled ? 'checked' : ''}>Mostrar patrocinadores</label>
      <label class="inline-field">Espacios visibles<select name="slots"><option value="1" ${display.slots !== 2 ? 'selected' : ''}>Uno grande</option><option value="2" ${display.slots === 2 ? 'selected' : ''}>Dos en paralelo</option></select></label>
      <label class="inline-field">Cambiar cada (segundos)<input name="intervalSeconds" type="number" min="5" max="30" step="1" value="${Number(display.intervalSeconds) || 6}" required></label>
    </div>
    <label class="sponsor-batch">Añadir varias imágenes<input type="file" data-sponsor-batch multiple accept="image/png,image/jpeg,image/webp"></label>
    <p class="muted">PNG, JPG o WebP. Las imágenes se adaptan automáticamente para que carguen rápido. En móvil se muestra un espacio. Los visitantes pueden pausar o avanzar.</p>
    <div class="sponsor-editor-list">${Array.from({length:10},(_,index) => {
      const banner = banners[index] || {};
      return `<details class="sponsor-editor" ${index === 0 ? 'open' : ''}><summary>${index+1}. <span data-sponsor-title="${index}">${escapeHtml(banner.title || 'Añadir patrocinador')}</span></summary>
        <div class="sponsor-edit-fields"><label class="checkbox-field"><input type="checkbox" name="enabled-${index}" ${banner.enabled ? 'checked' : ''}>Activo</label>
        <label class="inline-field">Nombre<input name="title-${index}" maxlength="120" value="${escapeHtml(banner.title || '')}"></label>
        <label class="inline-field">Imagen<input type="file" data-sponsor-file="${index}" accept="image/png,image/jpeg,image/webp"></label>
        <img data-sponsor-preview="${index}" class="sponsor-preview" alt="Vista previa del patrocinador ${index+1}" hidden>
        <label class="inline-field">O usar una URL de imagen<input name="imageUrl-${index}" maxlength="2048" placeholder="https://…" value="${escapeHtml(banner.imageUrl?.startsWith('data:') ? '' : banner.imageUrl || '')}"></label>
        <label class="inline-field">Enlace al pulsar (opcional)<input name="targetUrl-${index}" maxlength="2048" placeholder="https://…" value="${escapeHtml(banner.targetUrl || '')}"></label>
        <button type="button" class="ghost-button" data-sponsor-remove="${index}">Eliminar patrocinador</button></div></details>`;
    }).join('')}</div>
    <button class="primary-button" type="submit">Guardar patrocinadores</button><p data-banner-status role="status" aria-live="polite"></p>
  </form>`;
}

export async function resizeSponsorImage(file) {
  if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 10_000_000) throw new Error('Elige una imagen PNG, JPG o WebP de hasta 10 MB');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise((resolve,reject) => {
      const timer = setTimeout(() => reject(new Error('No se pudo leer la imagen')),15000);
      image.onload = () => { clearTimeout(timer); resolve(); };
      image.onerror = () => { clearTimeout(timer); reject(new Error('No se pudo leer la imagen')); };
      image.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40_000_000) throw new Error('La imagen tiene dimensiones demasiado grandes');
    const scale = Math.min(1,1600/image.naturalWidth,600/image.naturalHeight), canvas = document.createElement('canvas');
    canvas.width = Math.max(1,Math.round(image.naturalWidth*scale)); canvas.height = Math.max(1,Math.round(image.naturalHeight*scale));
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
    let data = canvas.toDataURL('image/webp',0.85);
    if (data.length > 666700) data = canvas.toDataURL('image/webp',0.65);
    if (!safeUrl(data,true) || data.length > 666700) throw new Error('La imagen sigue siendo demasiado grande. Prueba otra de menor tamaño');
    return data;
  } finally { URL.revokeObjectURL(url); }
}

export function readBannerSettings(form) {
  const editor = editors.get(form), data = new FormData(form);
  return { expectedRevision: editor?.revision || 0,
    display:{enabled:data.has('sponsorsEnabled'),slots:Number(data.get('slots')),intervalSeconds:Number(data.get('intervalSeconds'))},
    banners:Array.from({length:10},(_,i) => ({enabled:data.has(`enabled-${i}`),title:data.get(`title-${i}`) || '',
      imageUrl:editor?.images[i] || '',targetUrl:data.get(`targetUrl-${i}`) || ''})) };
}

export function bindBannerSettings(form, {banners = [], revision = 0, onSaved = () => {}, imageReader = resizeSponsorImage} = {}) {
  if (!form || editors.has(form)) return;
  const editor = {images:Array.from({length:10},(_,i)=>banners[i]?.imageUrl || ''),revision,busy:false}; editors.set(form,editor);
  const field = name => form.elements.namedItem(name);
  const status = form.querySelector('[data-banner-status]');
  const preview = i => {
    const image = form.querySelector(`[data-sponsor-preview="${i}"]`), url = safeUrl(editor.images[i],true);
    image.hidden = !url; image.onerror = () => { image.hidden = true; };
    if (url) image.src = url; else image.removeAttribute('src');
  };
  const refreshTitle = i => { form.querySelector(`[data-sponsor-title="${i}"]`).textContent = field(`title-${i}`).value || 'Añadir patrocinador'; };
  const lock = busy => { editor.busy = busy; [...form.elements].forEach(control => { control.disabled = busy; }); };
  for (let i=0;i<10;i++) preview(i);
  form.addEventListener('input',event => {
    const title = event.target.name?.match(/^title-(\d+)$/), image = event.target.name?.match(/^imageUrl-(\d+)$/);
    if (title) refreshTitle(Number(title[1]));
    if (image) { editor.images[Number(image[1])] = event.target.value.trim(); preview(Number(image[1])); }
  });
  form.addEventListener('click',event => {
    const button = event.target.closest('[data-sponsor-remove]'); if (!button || editor.busy) return;
    const i = Number(button.dataset.sponsorRemove); editor.images[i] = '';
    for (const name of ['title','imageUrl','targetUrl']) field(`${name}-${i}`).value = '';
    field(`enabled-${i}`).checked = false; preview(i); refreshTitle(i); status.textContent = 'Patrocinador retirado del formulario. Guarda para aplicar el cambio.';
  });
  form.addEventListener('change',async event => {
    const input = event.target;
    if (!input.matches('[data-sponsor-file],[data-sponsor-batch]') || editor.busy) return;
    const files = [...input.files]; if (!files.length) return;
    const indices = input.hasAttribute('data-sponsor-file') ? [Number(input.dataset.sponsorFile)] : editor.images.map((url,i)=>url ? -1 : i).filter(i=>i>=0);
    if (files.length > indices.length) { status.textContent = 'No hay suficientes espacios libres. Puedes tener hasta diez patrocinadores.'; input.value = ''; return; }
    lock(true); status.textContent = 'Preparando imágenes…';
    try {
      const prepared = [];
      for (const file of files) prepared.push(await imageReader(file));
      if (!form.isConnected) return;
      prepared.forEach((image,i) => {
        const index = indices[i]; editor.images[index] = image; field(`imageUrl-${index}`).value = '';
        if (!field(`title-${index}`).value) field(`title-${index}`).value = files[i].name.replace(/\.[^.]+$/,'').slice(0,120);
        field(`enabled-${index}`).checked = true; preview(index); refreshTitle(index);
      });
      status.textContent = `${prepared.length} imagen(es) preparada(s). Guarda para aplicar los cambios.`;
    } catch (error) { status.textContent = error.message; }
    finally { input.value = ''; lock(false); }
  });
  form.addEventListener('submit',async event => {
    event.preventDefault(); event.stopPropagation(); if (editor.busy) return;
    const payload = readBannerSettings(form); lock(true); status.textContent = 'Guardando patrocinadores…';
    try {
      const response = await fetch('/api/admin/banners',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)});
      const result = await response.json().catch(()=>null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || 'No se pudo confirmar el guardado. Tu formulario se conserva; puedes volver a intentarlo.');
      editor.revision = result.revision; invalidateBanners();
      status.textContent = result.display.enabled ? 'Patrocinadores guardados y visibles en el portal.' : 'Configuración guardada. La sección de patrocinadores está desactivada.';
      if (form.isConnected) onSaved(result);
    } catch (error) { status.textContent = error.message || 'No se pudo guardar. Puedes volver a intentarlo.'; }
    finally { lock(false); }
  });
}
