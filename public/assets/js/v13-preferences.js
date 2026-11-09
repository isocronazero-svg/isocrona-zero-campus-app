(() => {
  "use strict";
  const open = document.getElementById("v13PreferencesOpen");
  const exportsPanel = document.getElementById("v13AdminExports");
  const roleSwitcher = document.getElementById("roleSwitcher");
  const syncExports = () => {
    if (exportsPanel) exportsPanel.hidden = roleSwitcher?.value !== "admin" || !document.getElementById("shell")?.offsetParent;
  };
  roleSwitcher?.addEventListener("change", syncExports);
  document.addEventListener("click", syncExports);
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
    setStatus("Cargando tus preferencias…");
    dialog.showModal();
    try {
      const p = await request("GET");
      size.value = p.shirtSize || "";
      sex.value = p.sex || "";
      cut.value = p.shirtCut || "";
      language.value = p.diplomaLanguage || "es";
      confirmed.checked = p.shirtConfirmed === true;
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    }
  });
  document.getElementById("v13PreferencesClose")?.addEventListener("click", () => dialog.close());
  form.addEventListener("submit", async event => {
    event.preventDefault();
    setStatus("Guardando…");
    try {
      if (confirmed.checked && (!size.value || !cut.value)) throw new Error("Selecciona talla y corte antes de confirmar el pedido.");
      await request("PATCH", { sex: sex.value, shirtSize: size.value, shirtCut: cut.value, shirtConfirmed: confirmed.checked, diplomaLanguage: language.value });
      setStatus("Preferencias guardadas correctamente.");
    } catch (error) {
      setStatus(error.message);
    }
  });
})();
