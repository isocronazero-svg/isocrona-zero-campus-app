function countReplacementChars(text) {
  return (String(text || "").match(/\uFFFD/g) || []).length;
}

function fixMojibakeText(value) {
  const raw = String(value ?? "");
  if (!/[\u00C0-\u00FF\uFFFD]/.test(raw)) {
    return raw;
  }
  try {
    const bytes = Uint8Array.from(raw, (char) => char.charCodeAt(0));
    const repaired = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    if (countReplacementChars(repaired) <= countReplacementChars(raw)) {
      return repaired;
    }
  } catch (error) {
    // Ignore decoding issues and fall back to raw input.
  }
  return raw;
}

function normalizeDisplayTextForHtml(value) {
  const rawValue = String(value ?? "");
  if (/^(https?:|data:|mailto:)/i.test(rawValue) || rawValue.includes("://")) {
    return rawValue;
  }
  const raw = fixMojibakeText(rawValue);
  if (!raw.includes("?") && !raw.includes("\uFFFD")) {
    return raw;
  }
  const replacements = [
    ["Rodr?guez", "Rodríguez"],
    ["T?cnicas", "Técnicas"],
    ["T?cnico", "Técnico"],
    ["T?cnicos", "Técnicos"],
    ["t?cnicas", "técnicas"],
    ["t?cnico", "técnico"],
    ["t?cnicos", "técnicos"],
    ["Pr?ctica", "Práctica"],
    ["pr?ctica", "práctica"],
    ["Pr?cticas", "Prácticas"],
    ["pr?cticas", "prácticas"],
    ["activaci?n", "activación"],
    ["evacuaci?n", "evacuación"],
    ["intervenci?n", "intervención"],
    ["evaluaci?n", "evaluación"],
    ["situaci?n", "situación"],
    ["localizaci?n", "localización"],
    ["extracci?n", "extracción"],
    ["progresi?n", "progresión"],
    ["estabilizaci?n", "estabilización"],
    ["inscripci?n", "inscripción"],
    ["matr?cula", "matrícula"],
    ["presentaci?n", "presentación"],
    ["com?n", "común"],
    ["compa?ero", "compañero"],
    ["compa?eros", "compañeros"],
    ["m?nimo", "mínimo"],
    ["m?nimos", "mínimos"],
    ["b?squeda", "búsqueda"],
    ["b?sicas", "básicas"],
    ["b?sica", "básica"],
    ["v?deo", "vídeo"],
    ["v?ctima", "víctima"],
    ["r?pido", "rápido"],
    ["qu? ", "qué "],
    ["Qu? ", "Qué "],
    ["?Cuando", "¿Cuándo"],
    ["?Que", "¿Qué"],
    ["?Cual", "¿Cuál"],
    ["?Donde", "¿Dónde"],
    ["?Como", "¿Cómo"],
    ["?Por", "¿Por"],
    ["?Se", "¿Se"],
    ["m�quina", "máquina"],
    ["m��quina", "máquina"],
    ["M�quina", "Máquina"],
    ["M��quina", "Máquina"],
    ["tr�fico", "tráfico"],
    ["Tr�fico", "Tráfico"]
  ];
  return replacements.reduce((result, [from, to]) => result.replaceAll(from, to), raw);
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function escapeHtml(value) {
  return normalizeDisplayTextForHtml(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
