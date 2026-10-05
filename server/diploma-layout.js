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

function rule(page, x, y, width, color = RED, height = 1) {
  page.push({ type: "rect", x, y, width, height, color });
}

function basePage(organization, label) {
  const page = [{ type: "rect", x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: "#ffffff" }];
  rule(page, 44, 28, 754, RED, 4);
  text(page, organization, 48, 46, 11, 616);
  text(page, label, 674, 46, 9, 120, MUTED);
  rule(page, 44, 556, 754, "#d7dadd");
  return page;
}

function buildDiplomaLayout(model, settings, verifyUrl) {
  const organization = settings.organization || "Asociacion Isocrona Zero";
  const front = basePage(organization, model.preview ? "VISTA PREVIA" : "CERTIFICADO");
  const center = (value, y, size, width = 718, color = INK) => text(front, value, (PAGE_WIDTH - width) / 2, y, size, width, color, "center");
  let y = center(model.certificateTitle, 91, 25, 740, RED) + 14;
  y = center("La asociaci\u00f3n certifica que", y, 12) + 12;
  // Fit unusually long names/titles without touching the fixed signature/footer area.
  const nameSize = textWidth(model.member.name, 28) > 1400 ? 19 : 28;
  y = center(model.member.name, y, nameSize) + 8;
  y = center(`con DNI/NIE ${model.documentId}`, y, 11) + 17;
  const participation = /asistencia/i.test(model.certificateTitle)
    ? "ha asistido a la actividad formativa" : "ha realizado y superado con aprovechamiento la actividad formativa";
  y = center(participation, y, 12) + 8;
  const titleSize = textWidth(model.course.title, 23) > 1400 ? 16 : 23;
  y = center(model.course.title, y, titleSize) + 12;
  y = center(`Duraci\u00f3n: ${model.course.hours} horas lectivas. ${model.dateRange}.`, y, 11) + 8;
  y = center(`En ${model.city}, a ${model.issueDate}.`, y, 11) + 8;
  center(`Certificado n.o ${model.registryNumber}`, y, 10, 718, MUTED);
  if (y > 448) {
    // Compress only the variable body for exceptionally long metadata, never truncate it.
    const scale = (436 - 91) / (y + 14 - 91);
    for (const item of front.slice(5)) if (item.type === "text") {
      item.y = 91 + (item.y - 91) * scale;
      item.size *= scale;
      item.x = (PAGE_WIDTH - textWidth(item.text, item.size)) / 2;
    }
  }
  for (const [index, signer] of [settings.diplomaSignerA || "Direccion de Formacion", settings.diplomaSignerB || "Presidencia"].entries()) {
    const x = 110 + index * 342;
    rule(front, x, 498, 280, MUTED);
    text(front, signer, x, 509, 10, 280, INK, "center");
  }
  const pages = [front];
  let back;
  let cursor;
  const newBack = () => {
    back = basePage(organization, pages.length === 1 ? "REVERSO" : "ANEXO");
    pages.push(back);
    cursor = text(back, "CONTENIDOS FORMATIVOS", 48, 88, 21, 746, RED) + 10;
    cursor = text(back, model.course.title, 48, cursor, 13, 746) + 12;
  };
  newBack();
  const sections = model.sections.length ? model.sections : [{ title: "Programa del curso", items: ["No hay contenidos formativos detallados registrados para esta actividad."] }];
  for (const section of sections) {
    if (cursor > 420) newBack();
    for (const line of wrap(section.title, 746, 12)) {
      if (cursor > 464) newBack();
      text(back, line, 48, cursor, 12, 746, RED); cursor += 18;
    }
    for (const item of section.items) {
      for (const line of wrap(`- ${item}`, 730, 11)) {
        if (cursor > 464) newBack();
        text(back, line, 60, cursor, 11, 730); cursor += 15;
      }
    }
    cursor += 9;
  }
  pages.forEach((page, index) => {
    if (index > 0) {
      text(page, `Certificado n.o ${model.registryNumber} | ${model.member.name}`, 48, 499, 9, 746, MUTED);
      text(page, `C\u00f3digo de verificaci\u00f3n: ${model.code}`, 48, 523, 9, 746);
      text(page, verifyUrl, 48, 539, 8, 746, MUTED);
    }
    text(page, `${index + 1} / ${pages.length}`, 738, 570, 9, 60, MUTED);
  });
  return pages;
}

function buildDiplomaPdfStreams(pages, escapePdfText) {
  const rgb = hex => [1, 3, 5].map(i => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(4)).join(" ");
  return pages.map(page => page.map(item => {
    const fill = `${rgb(item.color)} rg`;
    return item.type === "rect"
      ? `${fill}\n${item.x} ${PAGE_HEIGHT - item.y - item.height} ${item.width} ${item.height} re f`
      : `${fill}\nBT /F1 ${item.size} Tf ${item.x} ${PAGE_HEIGHT - item.y - item.size} Td (${escapePdfText(printable(item.text))}) Tj ET`;
  }).join("\n") + "\n");
}

function renderDiplomaPagesHtml(pages, title, escapeHtml) {
  const markup = pages.map((page, index) => `<section class="diploma-page" aria-label="${index === 0 ? "Anverso" : index === 1 ? "Reverso" : "Anexo"}"><div class="sheet">${page.map(item => item.type === "rect"
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
