let installed = false;
let observer = null;

const ADVANCED_FIELD_IDS = [
  "editAssociateAccountRole",
  "editAssociateTreasuryEnabled"
];

function ensureStyles() {
  if (document.getElementById("associateFormSimplifierStyles")) return;
  const style = document.createElement("style");
  style.id = "associateFormSimplifierStyles";
  style.textContent = `
    #associateEditForm .associate-form-intro{grid-column:1/-1;margin:0 0 4px}
    #associateEditForm .associate-form-intro h4{margin:0 0 4px}
    #associateEditForm .associate-form-intro p{margin:0}
    #associateEditForm .associate-form-advanced{grid-column:1/-1;border:1px solid rgba(127,127,127,.25);border-radius:14px;padding:0;margin-top:6px}
    #associateEditForm .associate-form-advanced>summary{cursor:pointer;font-weight:700;padding:12px 14px;list-style-position:inside}
    #associateEditForm .associate-form-advanced-body{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;padding:0 14px 14px}
    #associateEditForm .associate-form-advanced-hint{grid-column:1/-1;margin:0}
    #associateEditForm .associate-form-primary-badge{display:inline-flex;align-items:center;gap:6px;font-size:.82rem;font-weight:700;margin-left:6px}
    @media(max-width:600px){#associateEditForm .associate-form-advanced-body{grid-template-columns:1fr;padding:0 12px 12px}}
  `;
  document.head.append(style);
}

function fieldContainer(input) {
  if (!input) return null;
  return input.closest("label") || input.parentElement;
}

function ensureIntro(form) {
  let intro = form.querySelector(":scope > .associate-form-intro");
  if (intro) return intro;
  intro = document.createElement("div");
  intro.className = "associate-form-intro";
  intro.innerHTML = `
    <h4>Datos y estado del socio</h4>
    <p class="muted">Aquí quedan las acciones de uso habitual. La configuración excepcional se agrupa al final.</p>
  `;
  form.prepend(intro);
  return intro;
}

function ensureAdvanced(form) {
  let details = form.querySelector(":scope > .associate-form-advanced");
  if (details) return details;
  details = document.createElement("details");
  details.className = "associate-form-advanced";
  details.innerHTML = `
    <summary>Opciones avanzadas</summary>
    <div class="associate-form-advanced-body">
      <p class="muted associate-form-advanced-hint">Permisos y responsabilidades especiales. No es necesario abrir este bloque para la gestión diaria del socio.</p>
    </div>
  `;
  form.append(details);
  return details;
}

function keepInstructorVisible(form) {
  const input = form.querySelector("#editAssociateInstructorEnabled");
  const container = fieldContainer(input);
  if (!container || container.dataset.primaryAssociateField === "true") return;
  container.dataset.primaryAssociateField = "true";
  const text = container.querySelector("span") || container;
  if (!container.querySelector(".associate-form-primary-badge")) {
    const badge = document.createElement("span");
    badge.className = "associate-form-primary-badge";
    badge.textContent = "· uso frecuente";
    text.append(badge);
  }
}

function moveAdvancedFields(form, details) {
  const body = details.querySelector(".associate-form-advanced-body");
  if (!body) return;
  for (const id of ADVANCED_FIELD_IDS) {
    const input = form.querySelector(`#${id}`);
    const container = fieldContainer(input);
    if (!container || details.contains(container)) continue;
    body.append(container);
  }
}

function simplifyAssociateForm() {
  const form = document.getElementById("associateEditForm");
  if (!form) return;
  ensureStyles();
  ensureIntro(form);
  const details = ensureAdvanced(form);
  keepInstructorVisible(form);
  moveAdvancedFields(form, details);
  form.dataset.progressiveSimplification = "v1.2";
}

export function installAssociateFormSimplifier() {
  if (installed || typeof document === "undefined") return;
  installed = true;
  simplifyAssociateForm();
  observer = new MutationObserver(() => simplifyAssociateForm());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("iz:state", simplifyAssociateForm);
  document.addEventListener("iz:render", simplifyAssociateForm);
}

export function __resetAssociateFormSimplifierForTests() {
  observer?.disconnect();
  observer = null;
  installed = false;
}
