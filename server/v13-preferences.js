"use strict";

// V1.3: shared validation and export projection; no migration of existing member records.
const SIZES = Object.freeze(["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"]);
const CUTS = Object.freeze(["unisex", "mujer"]);
const SEXES = Object.freeze(["hombre", "mujer", "otro", "prefiero-no-indicar"]);
const DIPLOMA_LANGUAGES = Object.freeze(["es", "es-va"]);

function normalizeV13Preferences(input = {}, previous = {}) {
  const value = { ...previous };
  for (const [field, allowed] of [
    ["shirtSize", SIZES],
    ["shirtCut", CUTS],
    ["sex", SEXES],
    ["diplomaLanguage", DIPLOMA_LANGUAGES]
  ]) {
    if (!Object.prototype.hasOwnProperty.call(input, field)) continue;
    const raw = String(input[field] ?? "").trim();
    if (raw && !allowed.includes(raw)) throw new RangeError("Valor no permitido para " + field);
    value[field] = raw;
  }
  if (Object.prototype.hasOwnProperty.call(input, "shirtConfirmed")) {
    if (typeof input.shirtConfirmed !== "boolean") throw new RangeError("Confirmación de camiseta inválida");
    value.shirtConfirmed = input.shirtConfirmed;
  }
  if (value.shirtConfirmed && (value.shirtSize !== previous.shirtSize || value.shirtCut !== previous.shirtCut)
      && !Object.prototype.hasOwnProperty.call(input, "shirtConfirmed")) {
    value.shirtConfirmed = false;
  }
  if (value.shirtConfirmed && (!value.shirtSize || !value.shirtCut)) {
    throw new RangeError("Para confirmar el pedido es obligatorio indicar talla y corte");
  }
  return value;
}

function excelSafe(value) {
  const text = String(value ?? "").replace(/[\r\n\t]+/g, " ").trim();
  // Protect spreadsheet users against CSV/XLSX formula injection.
  return /^[=+@\-]/.test(text) ? "'" + text : text;
}

function projectV13Export(associates = [], type = "shirts") {
  if (!["shirts", "diplomas"].includes(type)) throw new RangeError("Exportación desconocida");
  const headers = type === "shirts"
    ? ["ID socio", "Nombre", "Apellidos", "Sexo", "Talla", "Corte", "Confirmada"]
    : ["ID socio", "Nombre", "Apellidos", "Idioma diploma"];
  const rows = associates.map(a => {
    const p = a.v13Preferences || {};
    const common = [a.id || "", a.firstName || a.name || "", a.lastName || a.surname || ""];
    return (type === "shirts"
      ? [...common, p.sex || "", p.shirtSize || "", p.shirtCut || "", p.shirtConfirmed ? "Sí" : "No"]
      : [...common, p.diplomaLanguage === "es-va" ? "Castellano + valenciano" : "Castellano"])
      .map(excelSafe);
  });
  return { headers, rows };
}

module.exports = { SIZES, CUTS, SEXES, DIPLOMA_LANGUAGES, normalizeV13Preferences, projectV13Export };
