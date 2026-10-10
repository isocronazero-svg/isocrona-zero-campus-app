const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const INK = "#17191c";
const RED = "#b91c32";
const MUTED = "#51565e";

// Helvetica widths (ASCII, in thousandths of an em); accented Latin letters use their base glyph.
const WIDTHS = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,
  556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,
  667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,
  278,278,278,469,556,333,
  556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,
  334,260,334,584];

function printable(value) {
  return String(value ?? "").normalize("NFC").replace(/[\r\n\t]+/g, " ")
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-").replace(/[^\x20-\x7e\xa0-\xff]/g, "?");
}

function textWidth(text, size) {
  return [...printable(text)].reduce((sum, char) => {
    const code = char.normalize("NFD")[0].charCodeAt(0);
    return sum + (WIDTHS[code - 32] ?? 600);
  }, 0) * size / 1000;
}

function wrap(text, width, size) {
  const lines = [];
  let line = "";
  for (const word of printable(text).split(/\s+/).filter(Boolean)) {
    if (line && textWidth(`${line} ${word}`, size) > width) {
      lines.push(line); line = "";
    }
    for (const char of (line ? ` ${word}` : word)) {
      if (line && textWidth(line + char, size) > width) {
        lines.push(line); line = "";
      }
      line += char;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function text(page, value, x, y, size, width, color = INK, align = "left") {
  const lines = wrap(value, width, size);
  for (const [index, line] of lines.entries()) {
    page.push({ type: "text", text: line, x: align === "center" ? x + (width - textWidth(line, size)) / 2 : x,
      y: y + index * (size + 4), size, color });
  }
  return y + lines.length * (size + 4);
}

function basePage(label) {
  const page = [{ type: "image", x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT }];
  if (label === "VISTA PREVIA") text(page, label, 84, 130, 9, 150, RED);
  return page;
}

function buildDiplomaLayout(model, settings, verifyUrl) {
  const front = basePage(model.preview ? "VISTA PREVIA" : "CERTIFICADO");
  const bodyStart = front.length;
  const center = (value, y, size, width = 658, color = INK) => text(front, value, (PAGE_WIDTH - width) / 2, y, size, width, color, "center");
  let y = center(model.certificateTitle, 158, 23, 658, RED) + 8;
  y = center("La asociaci\u00f3n certifica que", y, 12) + 8;
  // Fit unusually long names/titles without touching the fixed signature/footer area.
  const nameSize = textWidth(model.member.name, 28) > 1400 ? 19 : 28;
  y = center(model.member.name, y, nameSize) + 5;
  y = center(`con DNI/NIE ${model.documentId}`, y, 11) + 10;
  const participation = /asistencia/i.test(model.certificateTitle)
    ? "ha asistido a la actividad formativa" : "ha realizado y superado con aprovechamiento la actividad formativa";
  y = center(participation, y, 12) + 8;
  const titleSize = textWidth(model.course.title, 23) > 1400 ? 16 : 23;
  y = center(model.course.title, y, titleSize) + 10;
  y = center(`Duraci\u00f3n: ${model.course.hours} horas lectivas. ${model.dateRange}.`, y, 11) + 8;
  y = center(`En ${model.city}, a ${model.issueDate}.`, y, 11) + 8;
  center(`Certificado n.o ${model.registryNumber}`, y, 10, 658, MUTED);
  if (y > 424) {
    // Compress only the variable body for exceptionally long metadata, never truncate it.
    const scale = (438 - 158) / (y + 14 - 158);
    for (const item of front.slice(bodyStart)) if (item.type === "text") {
      item.y = 158 + (item.y - 158) * scale;
      item.size *= scale;
      item.x = (PAGE_WIDTH - textWidth(item.text, item.size)) / 2;
    }
  }
  for (const [value, top] of [[settings.diplomaSignerA || "Direccion de Formacion", 452], [settings.diplomaSignerB || "Presidencia", 570]]) {
    const size = Math.min(10, 5600 / Math.max(1, textWidth(value, 10)));
    text(front, value, 141, top, size, 560, INK, "center");
  }
  const pages = [front];
  let back;
  let cursor;
  const newBack = () => {
    back = basePage(pages.length === 1 ? "REVERSO" : "ANEXO");
    pages.push(back);
    cursor = text(back, "CONTENIDOS FORMATIVOS", 84, 158, 21, 658, RED) + 10;
    // A compact repeated heading leaves space for long curricula on every page.
    cursor = text(back, model.course.title, 84, cursor, 12, 658) + 10;
  };
  newBack();
  const sections = model.sections.length ? model.sections : [{ title: "Programa del curso", items: ["No hay contenidos formativos detallados registrados para esta actividad."] }];
  for (const section of sections) {
    if (cursor > 396) newBack();
    for (const line of wrap(section.title, 658, 12)) {
      if (cursor > 428) newBack();
      text(back, line, 84, cursor, 12, 658, RED); cursor += 18;
    }
    for (const item of section.items) {
      for (const line of wrap(`- ${item}`, 646, 11)) {
        if (cursor > 428) newBack();
        text(back, line, 96, cursor, 11, 646); cursor += 15;
      }
    }
    cursor += 9;
  }
  pages.forEach((page, index) => {
    if (index > 0) {
      text(page, `Certificado n.o ${model.registryNumber}`, 84, 452, 9, 658, MUTED);
      text(page, `C\u00f3digo de verificaci\u00f3n: ${model.code}`, 84, 468, 9, 658);
      text(page, verifyUrl, 84, 484, 8, 658, MUTED);
    }
    text(page, `${index + 1} / ${pages.length}`, 738, 579, 9, 60, MUTED);
  });
  return pages;
}

function buildDiplomaPdfStreams(pages, escapePdfText) {
  const rgb = hex => [1, 3, 5].map(i => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(4)).join(" ");
  return pages.map(page => page.map(item => {
    if (item.type === "image") return `q ${item.width} 0 0 ${item.height} ${item.x} ${PAGE_HEIGHT - item.y - item.height} cm /Template Do Q`;
    const fill = `${rgb(item.color)} rg`;
    return item.type === "rect"
      ? `${fill}\n${item.x} ${PAGE_HEIGHT - item.y - item.height} ${item.width} ${item.height} re f`
      : `${fill}\nBT /F1 ${item.size} Tf ${item.x} ${PAGE_HEIGHT - item.y - item.size} Td (${escapePdfText(printable(item.text))}) Tj ET`;
  }).join("\n") + "\n");
}

function renderDiplomaPagesHtml(pages, title, escapeHtml) {
  const markup = pages.map((page, index) => `<section class="diploma-page" aria-label="${index === 0 ? "Anverso" : index === 1 ? "Reverso" : "Anexo"}"><div class="sheet">${page.map(item => item.type === "image"
    ? `<img src="/api/certificate-template-logo" alt="Plantilla institucional Isocrona Zero" style="position:absolute;left:${item.x}pt;top:${item.y}pt;width:${item.width}pt;height:${item.height}pt" />`
    : item.type === "rect"
    ? `<span aria-hidden="true" style="position:absolute;left:${item.x}pt;top:${item.y}pt;width:${item.width}pt;height:${item.height}pt;background:${item.color}"></span>`
    : `<span style="position:absolute;left:${item.x}pt;top:${item.y}pt;font-size:${item.size}pt;color:${item.color};white-space:pre">${escapeHtml(item.text)}</span>`).join("")}</div></section>`).join("");
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title>
<style>
@page{size:A4 landscape;margin:0}
*{box-sizing:border-box}body{margin:0;background:#e8eaed;font-family:Arial,Helvetica,sans-serif;color:#17191c;line-height:1}
.toolbar{padding:16px;text-align:center;line-height:1.5}.toolbar button{padding:10px 18px;border:0;border-radius:4px;background:#b91c32;color:white;cursor:pointer}
.diploma-page{width:842pt;height:595pt;margin:16px auto;background:white;overflow:hidden}.sheet{position:relative;width:842pt;height:595pt}
@media screen and (max-width:1140px){.diploma-page{width:100%;height:auto;aspect-ratio:842/595}.sheet{transform-origin:top left}}
@media print{body{background:white}.toolbar{display:none}.diploma-page{margin:0;break-after:page;print-color-adjust:exact;-webkit-print-color-adjust:exact}.diploma-page:last-child{break-after:auto}}
</style></head><body><div class="toolbar"><button onclick="window.print()">Imprimir o guardar como PDF</button><p>A4 horizontal. Para imprimir anverso y reverso: doble cara y giro por el borde corto.</p></div>${markup}<script>
const resize = () => document.querySelectorAll(".diploma-page").forEach(page => {
  page.firstElementChild.style.transform = "scale(" + Math.min(1, page.clientWidth / (842 * 4 / 3)) + ")";
});
new ResizeObserver(resize).observe(document.body);
window.addEventListener("beforeprint", () => document.querySelectorAll(".sheet").forEach(sheet => { sheet.style.transform = "none"; }));
window.addEventListener("afterprint", resize);
resize();
</script></body></html>`;
}

module.exports = { buildDiplomaLayout, buildDiplomaPdfStreams, renderDiplomaPagesHtml, PAGE_WIDTH, PAGE_HEIGHT };
