export const ASSOCIATION_DEFAULT_IBAN = "ES23 0073 0100 5905 0627 3646";

let installed = false;
let observer = null;
let scheduled = false;

const PAYMENT_ACCOUNT_IDS = [
  "coursePaymentAccount",
  "courseIban",
  "courseIBAN"
];

function normalizeIban(value) {
  return String(value || "").replace(/\s+/g, "").toUpperCase();
}

function isOfficialIban(value) {
  return normalizeIban(value) === normalizeIban(ASSOCIATION_DEFAULT_IBAN);
}

function enhancePaymentAccountField(field) {
  if (!field || field.dataset.izPaymentDefault === "true") return;
  field.dataset.izPaymentDefault = "true";
  if (!String(field.value || "").trim()) field.value = ASSOCIATION_DEFAULT_IBAN;
  field.placeholder = ASSOCIATION_DEFAULT_IBAN;
  field.autocomplete = "off";

  const container = field.closest("label") || field.parentElement;
  if (container && !container.querySelector(".iz-payment-account-hint")) {
    const hint = document.createElement("span");
    hint.className = "field-hint iz-payment-account-hint";
    hint.textContent = isOfficialIban(field.value)
      ? "Cuenta oficial de Isócrona Zero. Puedes modificarla solo para esta formación."
      : "Cuenta específica de esta formación. No modifica la cuenta oficial de la asociación.";
    container.append(hint);
    field.addEventListener("input", () => {
      hint.textContent = isOfficialIban(field.value)
        ? "Cuenta oficial de Isócrona Zero. Puedes modificarla solo para esta formación."
        : "Cuenta específica de esta formación. No modifica la cuenta oficial de la asociación.";
    });
  }
}

function applyDefaultPaymentAccount() {
  PAYMENT_ACCOUNT_IDS.forEach((id) => {
    const field = document.getElementById(id);
    if (field?.closest("#courseForm")) enhancePaymentAccountField(field);
  });
  // Only creation fields: editing existing courses must never fill an intentionally empty account.
  document.querySelectorAll('form[data-course-create] input[name="paymentAccount"], form[data-course-create] input[name="iban"]').forEach(enhancePaymentAccountField);
}

function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    applyDefaultPaymentAccount();
  });
}

export function installAssociationPaymentDefaults() {
  if (installed || typeof window === "undefined" || typeof document === "undefined") return;
  installed = true;
  applyDefaultPaymentAccount();
  if (typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(scheduleApply);
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

export function resetAssociationPaymentDefaultsForTests() {
  observer?.disconnect();
  observer = null;
  installed = false;
  scheduled = false;
}
