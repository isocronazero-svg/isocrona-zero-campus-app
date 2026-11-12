const { PAGE_WIDTH, PAGE_HEIGHT } = require("./activity-certificate");
function buildEnrollmentCertificatePages(model, escapePdfText) {
  const safe = (value) => String(value ?? "").replace(/[\r\n\t]+/g, " ").replace(/[\x00-\x1f\x7f]/g, "").replace(/[^\x20-\xff]/g, "?").slice(0, 180);
  const commands = [];
  const text = (value, x, y, size = 11) => commands.push(`0.15 0.15 0.15 rg BT /F1 ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(safe(value))}) Tj ET`);
  const date = (value) => { const d = new Date(value); return Number.isNaN(d.getTime()) ? "Por determinar" : d.toLocaleDateString("es-ES", { timeZone: "UTC" }); };
  commands.push("0.85 0.47 0.19 RG 1.5 w 45 45 505 752 re S");
  text("ISÓCRONA ZERO", 70, 742, 23);
  text("ASOCIACIÓN SIN ÁNIMO DE LUCRO", 70, 720, 9);
  text("CERTIFICADO DE INSCRIPCIÓN CONFIRMADA", 70, 661, 16);
  text("La Asociación Isócrona Zero certifica que:", 70, 616, 11);
  text(model.name, 70, 581, 16);
  text("tiene confirmada su inscripción en la siguiente formación:", 70, 550, 11);
  text(model.title, 70, 516, 14);
  text(`Fechas: ${date(model.startDate)} - ${date(model.endDate || model.startDate)}`, 70, 473);
  text(`Duración: ${model.hours ?? "No especificada"} horas`, 70, 446);
  text(`Lugar: ${model.location || "Según convocatoria del curso"}`, 70, 419);
  text(`Entidad organizadora: ${model.organizer}`, 70, 392);
  if (model.instructors.length) text(`Instructores: ${model.instructors.join(", ")}`, 70, 365, 10);
  text(`Fecha de emisión: ${date(model.issuedAt)}`, 70, 285, 10);
  text("Este documento acredita la inscripción, no la asistencia efectiva.", 70, 208, 10);
  text("La asistencia se acreditará tras la realización y verificación del curso.", 70, 190, 10);
  text("ISÓCRONA ZERO · Registro Nacional de Asociaciones n.º 622652", 70, 87, 9);
  return [commands.join("\n")];
}
module.exports = { buildEnrollmentCertificatePages, PAGE_WIDTH, PAGE_HEIGHT };
