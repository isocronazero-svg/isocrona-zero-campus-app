(() => {
  "use strict";
  const open = document.getElementById("v13PreferencesOpen");
  const exportsPanel = document.getElementById("v13AdminExports");
  const roleSwitcher = document.getElementById("roleSwitcher");
  let isAdmin = false;
  let preferencesLoaded = false;
  let saveInProgress = false;
  let preferencesRequestVersion = 0;
  let roleCheckVersion = 0;
  const syncExports = async () => {
    if (exportsPanel) exportsPanel.hidden = true;
    const version = ++roleCheckVersion;
    if (roleSwitcher?.value !== "admin") return;
    try {
      const response = await fetch("/api/auth/me", { credentials: "same-origin" });
      const data = response.ok ? await response.json() : null;
      if (version !== roleCheckVersion) return;
      isAdmin = data?.user?.role === "admin";
      if (exportsPanel) exportsPanel.hidden = !isAdmin || roleSwitcher?.value !== "admin";
    } catch {
      if (version === roleCheckVersion) isAdmin = false;
    }
  };
  roleSwitcher?.addEventListener("change", syncExports);
  document.getElementById("loginForm")?.addEventListener("submit", () => {
    roleCheckVersion++;
    isAdmin = false;
    if (exportsPanel) exportsPanel.hidden = true;
  });
  document.getElementById("logoutButton")?.addEventListener("click", () => {
    preferencesRequestVersion++;
    preferencesLoaded = false;
    if (dialog?.open) dialog.close();
    roleCheckVersion++;
    isAdmin = false;
    if (exportsPanel) exportsPanel.hidden = true;
  });
  document.addEventListener("click", event => {
    if (event.target.closest("#roleSwitcher, #v13PreferencesOpen")) syncExports();
  });
  syncExports();
  const dialog = document.getElementById("v13PreferencesDialog");
  const form = document.getElementById("v13PreferencesForm");
  const status = document.getElementById("v13PreferencesStatus");
  const size = document.getElementById("v13ShirtSize");
  const sex = document.getElementById("v13Sex");
  const cut = document.getElementById("v13ShirtCut");
  const language = document.getElementById("v13DiplomaLanguage");
  const confirmed = document.getElementById("v13ShirtConfirmed");
  if (!open || !dialog || !form) return;
  // A changed size/cut requires a fresh, explicit confirmation on a later save.
  size.addEventListener("change", () => { confirmed.checked = false; });
  cut.addEventListener("change", () => { confirmed.checked = false; });
  const setStatus = message => { status.textContent = message; };
  async function request(method, body) {
    const response = await fetch("/api/v1.3/preferences", {
      method,
      credentials: "same-origin",
      headers: body ? { "Content-Type": "application/json" } : {},
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || "No se ha podido completar la operación.");
    return data.preferences || {};
  }
  open.addEventListener("click", async () => {
    const requestVersion = ++preferencesRequestVersion;
    preferencesLoaded = false;
    form.querySelector('button[type="submit"]').disabled = true;
    setStatus("Cargando tus preferencias…");
    dialog.showModal();
    try {
      const p = await request("GET");
      if (requestVersion !== preferencesRequestVersion || !dialog.open) return;
      size.value = p.shirtSize || "";
      sex.value = p.sex || "";
      cut.value = p.shirtCut || "";
      language.value = p.diplomaLanguage || "es";
      confirmed.checked = p.shirtConfirmed === true;
      preferencesLoaded = true;
      form.querySelector('button[type="submit"]').disabled = false;
      setStatus("");
    } catch (error) {
      if (requestVersion === preferencesRequestVersion && dialog.open) setStatus(error.message);
    }
  });
  dialog.addEventListener("close", () => { preferencesRequestVersion++; preferencesLoaded = false; });
  document.getElementById("v13PreferencesClose")?.addEventListener("click", () => dialog.close());
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!preferencesLoaded) return setStatus("No se han podido cargar tus preferencias. Cierra y vuelve a abrir el formulario.");
    if (saveInProgress) return;
    saveInProgress = true;
    const requestVersion = preferencesRequestVersion;
    const saveButton = form.querySelector('button[type="submit"]');
    saveButton.disabled = true;
    setStatus("Guardando…");
    try {
      if (confirmed.checked && (!size.value || !cut.value)) throw new Error("Selecciona talla y corte antes de confirmar el pedido.");
      await request("PATCH", { sex: sex.value, shirtSize: size.value, shirtCut: cut.value, shirtConfirmed: confirmed.checked, diplomaLanguage: language.value });
      if (requestVersion === preferencesRequestVersion && dialog.open) setStatus("Preferencias guardadas correctamente.");
    } catch (error) {
      if (requestVersion === preferencesRequestVersion && dialog.open) setStatus(error.message);
    } finally {
      saveInProgress = false;
      if (requestVersion === preferencesRequestVersion && dialog.open) saveButton.disabled = false;
    }
  });
})();
