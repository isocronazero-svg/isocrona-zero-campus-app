function buildActivityCertificate(state, memberId) {
  const member = (state.members || []).find((item) => item.id === memberId);
  if (!member) return null;
  const seen = new Set();
  const activities = (state.courses || [])
    .filter((course) => {
      if (!course.id || seen.has(course.id) || !(course.diplomaReady || []).includes(memberId)) return false;
      seen.add(course.id);
      return true;
    })
    .map((course) => {
      const hours = Number(course.hours);
      return {
        id: course.id, title: String(course.title || "Actividad"), type: String(course.type || "Formacion"),
        startDate: course.startDate, endDate: course.endDate,
        hours: Number.isFinite(hours) && hours >= 0 ? Math.round(hours * 100) / 100 : null
      };
    })
    .sort((a, b) => String(a.endDate || "").localeCompare(String(b.endDate || "")) || a.id.localeCompare(b.id));
  return {
    name: String(member.name || ""), organization: String(state.settings?.organization || "Asociacion Isocrona Zero"),
    issuedAt: new Date().toISOString(), activities,
    totalHours: activities.reduce((sum, activity) => sum + Math.round((activity.hours || 0) * 100), 0) / 100
  };
}

function buildActivityCertificatePages(model, escapePdfText) {
  const pages = [];
  let lines = [];
  let y = 790;
  const number = (value) => value.toLocaleString("es-ES", { maximumFractionDigits: 2 });
  const date = (value) => {
    const parsed = value && new Date(value);
    return parsed && Number.isFinite(parsed.getTime()) ? parsed.toLocaleDateString("es-ES", { timeZone: "UTC" }) : "Sin fecha";
  };
  // Bound each line, including long unbroken titles, and escape PDF string syntax.
  const wrap = (text, width) => String(text).replace(/[\r\n\t]+/g, " ").match(new RegExp(`.{1,${width}}(?:\\s|$)|.{1,${width}}`, "g")) || [""];
  const line = (text, size = 11) => {
    const safe = String(text).replace(/[\x00-\x1f\x7f]/g, " ").replace(/[^\x20-\xff]/g, "?");
    lines.push(`BT /F1 ${size} Tf 48 ${y} Td (${escapePdfText(safe)}) Tj ET`);
    y -= size + 7;
  };
  const flush = () => {
    lines.push(`BT /F1 9 Tf 48 30 Td (Pagina ${pages.length + 1}) Tj ET`);
    pages.push(lines.join("\n"));
    lines = [];
    y = 790;
  };
  const paragraph = (text, size = 11, width = 72) => {
    for (const part of wrap(text, width)) {
      if (y < 65) flush();
      line(part.trim(), size);
    }
  };
  paragraph(model.organization, 12, 62);
  y -= 8;
  paragraph("CERTIFICADO DE ACTIVIDAD FORMATIVA", 17, 43);
  paragraph(model.name, 14, 52);
  paragraph(`Emitido el ${date(model.issuedAt)}`);
  y -= 8;
  paragraph(`Actividades acreditadas: ${model.activities.length} | Total: ${number(model.totalHours)} horas lectivas`, 12, 62);
  paragraph("Resumen de actividades registradas con diploma emitido. No incluye inscripciones pendientes ni sustituye los diplomas individuales.", 10, 78);
  y -= 12;
  model.activities.forEach((activity, index) => {
    if (y < 140) flush();
    paragraph(`${index + 1}. ${activity.title}`, 12, 62);
    paragraph(`${activity.type} | ${date(activity.startDate)} - ${date(activity.endDate)}`, 10, 78);
    paragraph(activity.hours === null ? "Horas no registradas (no incluidas en el total)" : `${number(activity.hours)} horas lectivas`, 11);
    y -= 10;
  });
  if (y < 115) flush();
  paragraph(`TOTAL ACUMULADO: ${number(model.totalHours)} HORAS LECTIVAS`, 13, 58);
  paragraph("Las horas corresponden a la duracion acreditada de cada actividad, no a un registro horario de presencia.", 9, 85);
  flush();
  return pages;
}

module.exports = { buildActivityCertificate, buildActivityCertificatePages };
