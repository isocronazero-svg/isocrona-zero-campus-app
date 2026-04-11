const joinForm = document.getElementById("joinForm");
const joinNotice = document.getElementById("joinNotice");
const joinStatus = document.getElementById("joinStatus");
const joinTracking = document.getElementById("joinTracking");
const joinPrivacyConsent = document.getElementById("joinPrivacyConsent");
const joinPhotoConsent = document.getElementById("joinPhotoConsent");

bootstrapJoin();

async function bootstrapJoin() {
  try {
    const response = await fetch("/api/associates/public-config");
    const payload = await response.json();
    if (response.ok && payload.ok) {
      joinNotice.textContent = payload.notice || joinNotice.textContent;
      if (payload.uploadHint) {
        joinStatus.textContent = payload.uploadHint;
      }
    }
  } catch (error) {
    // Keep default copy if config is unavailable.
  }
}

joinForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (joinPrivacyConsent && !joinPrivacyConsent.checked) {
    joinStatus.textContent = "Necesitas aceptar la politica de privacidad para continuar.";
    return;
  }

  joinStatus.textContent = "Enviando solicitud...";

  const paymentProofFile = await readFileInput(document.getElementById("joinPaymentProof"));
  const paymentProof2File = await readFileInput(document.getElementById("joinPaymentProof2"));

  const payload = {
    firstName: document.getElementById("joinFirstName").value.trim(),
    lastName: document.getElementById("joinLastName").value.trim(),
    dni: document.getElementById("joinDni").value.trim(),
    phone: document.getElementById("joinPhone").value.trim(),
    email: document.getElementById("joinEmail").value.trim(),
    service: document.getElementById("joinService").value.trim(),
    paymentProofFile,
    paymentProof2File,
    submitterEmail: document.getElementById("joinSubmitterEmail").value.trim(),
    privacyConsent: Boolean(joinPrivacyConsent && joinPrivacyConsent.checked),
    photoConsent: Boolean(joinPhotoConsent && joinPhotoConsent.checked)
  };

  try {
    const response = await fetch("/api/associates/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok || result.ok === false) {
      throw new Error(result.error || "No se pudo registrar la solicitud");
    }

    joinStatus.textContent = "Solicitud enviada correctamente. Queda pendiente de revision administrativa.";
    if (result.trackingUrl) {
      joinTracking.style.display = "block";
      joinTracking.innerHTML = `
        <p class="eyebrow">Seguimiento</p>
        <h3 style="margin: 0 0 8px;">Solicitud registrada</h3>
        <p class="muted">Guarda este enlace para consultar el estado o aportar documentacion si administracion te la pide.</p>
        <p><a class="button-link" href="${escapeHtml(result.trackingUrl)}">${escapeHtml(result.trackingUrl)}</a></p>
      `;
    }
    joinForm.reset();
  } catch (error) {
    joinStatus.textContent = error.message || "No se pudo registrar la solicitud";
  }
});

async function readFileInput(input) {
  const file = input.files && input.files[0];
  if (!file) {
    return null;
  }

  const contentBase64 = await readFileAsBase64(file);
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    contentBase64
  };
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo seleccionado"));
    reader.readAsDataURL(file);
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
