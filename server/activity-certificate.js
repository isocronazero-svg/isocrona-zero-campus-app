const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

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
        id: course.id,
        title: String(course.title || "Actividad"),
        type: String(course.type || "Formacion"),
        startDate: course.startDate,
        endDate: course.endDate,
        hours: Number.isFinite(hours) && hours >= 0 ? Math.round(hours * 100) / 100 : null
      };
    })
    .sort((a, b) => String(a.endDate || "").localeCompare(String(b.endDate || "")) || a.id.localeCompare(b.id));
  return {
    name: String(member.name || ""),
    documentId: String(member.dni || member.documentId || ""),
    organization: String(state.settings?.organization || "Asociacion Isocrona Zero"),
    issuedAt: new Date().toISOString(),
    activities,
    totalHours: activities.reduce((sum, activity) => sum + Math.round((activity.hours || 0) * 100), 0) / 100
  };
}

function buildActivityCertificatePages(model, escapePdfText) {
  const safe = (value) => String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[\x00-\x1f\x7f]/g, " ")
    .replace(/[^\x20-\xff]/g, "?")
    .replace(/\s+/g, " ")
    .trim();
  const pdfText = (value) => escapePdfText(safe(value));
  const number = (value) => Number(value || 0).toLocaleString("es-ES", { maximumFractionDigits: 2 });
  const date = (value) => {
    const parsed = value && new Date(value);
    return parsed && Number.isFinite(parsed.getTime())
      ? parsed.toLocaleDateString("es-ES", { timeZone: "UTC" })
      : "Sin fecha";
  };
  const approxChars = (width, size) => Math.max(10, Math.floor(width / Math.max(3.1, size * 0.53)));
  const wrap = (value, width, size) => {
    const text = safe(value);
    const limit = approxChars(width, size);
    if (!text) return [""];
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      let remaining = word;
      while (remaining.length > limit) {
        if (line) {
          lines.push(line);
          line = "";
        }
        lines.push(remaining.slice(0, limit));
        remaining = remaining.slice(limit);
      }
      if (!remaining) continue;
      const candidate = line ? `${line} ${remaining}` : remaining;
      if (candidate.length > limit && line) {
        lines.push(line);
        line = remaining;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  };
  const commands = [];
  const text = (value, x, y, size, opts = {}) => {
    const color = opts.color || "0.12 0.12 0.12";
    const matrix = opts.matrix || `1 0 0 1 ${x} ${y}`;
    commands.push(`${color} rg BT /F1 ${size} Tf ${matrix} Tm (${pdfText(value)}) Tj ET`);
  };
  const line = (x1, y1, x2, y2, width = 1, color = "0.78 0.78 0.78") => {
    commands.push(`${color} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
  };
  const rect = (x, y, width, height, stroke = "0.64 0.64 0.64", fill = null) => {
    if (fill) commands.push(`${fill} rg ${x} ${y} ${width} ${height} re f`);
    commands.push(`${stroke} RG 0.8 w ${x} ${y} ${width} ${height} re S`);
  };

  // Institutional A4 portrait composition based on the supplied Isocrona Zero certificate template.
  rect(24, 24, PAGE_WIDTH - 48, PAGE_HEIGHT - 48, "0.78 0.78 0.78");
  rect(32, 32, PAGE_WIDTH - 64, PAGE_HEIGHT - 64, "0.91 0.58 0.34");
  text("ISÓCRONA ZERO", 190, 792, 20, { color: "0.08 0.08 0.08" });
  text("ASOCIACIÓN SIN ÁNIMO DE LUCRO", 202, 776, 8.5, { color: "0.18 0.18 0.18" });
  text("FIRE & RESCUE TRAINING", 227, 760, 7.5, { color: "0.85 0.45 0.20" });
  text("INSCRITO EN EL REGISTRO NACIONAL DE ASOCIACIONES · Nº 622652", 18, 190, 7.5,
    { color: "0.20 0.20 0.20", matrix: "0 1 -1 0 18 190" });
  text("ISÓCRONA ZERO", 92, 390, 46,
    { color: "0.94 0.94 0.94", matrix: "0.82 0.18 -0.18 0.82 92 390" });
  text("FORMACIÓN · COOPERACIÓN · ENTRENAMIENTO", 153, 356, 12, { color: "0.95 0.95 0.95" });
  line(72, 742, 523, 742, 1.2, "0.91 0.58 0.34");

  text("CERTIFICADO DE FORMACIÓN ACUMULADA", 117, 714, 17, { color: "0.12 0.12 0.12" });
  text("La Asociación Isócrona Zero certifica que", 166, 686, 10.5, { color: "0.32 0.32 0.32" });
  text(model.name || "", 90, 660, 16, { color: "0.08 0.08 0.08" });
  if (model.documentId) text(`DNI/NIE: ${model.documentId}`, 90, 642, 9.5, { color: "0.32 0.32 0.32" });
  text("ha realizado las siguientes actividades formativas acreditadas por la asociación:", 90, 622, 9.5,
    { color: "0.32 0.32 0.32" });

  const activities = model.activities || [];
  const columns = activities.length > 12 ? 2 : 1;
  const columnGap = 18;
  const areaX = 76;
  const areaWidth = 443;
  const columnWidth = columns === 1 ? areaWidth : (areaWidth - columnGap) / 2;
  const perColumn = Math.ceil(activities.length / columns);
  const availableHeight = 382;
  const chooseFont = () => {
    for (const size of [9.2, 8.6, 8, 7.4, 6.8, 6.2, 5.6, 5.1, 4.7]) {
      const rowGap = size + 4.2;
      let worst = 0;
      for (let col = 0; col < columns; col += 1) {
        let used = 0;
        const subset = activities.slice(col * perColumn, (col + 1) * perColumn);
        for (const activity of subset) {
          const titleWidth = columnWidth - 58;
          const titleLines = wrap(activity.title, titleWidth, size).length;
          used += Math.max(1, titleLines) * rowGap + 3.5;
        }
        worst = Math.max(worst, used);
      }
      if (worst <= availableHeight) return size;
    }
    throw new Error("El listado de cursos es demasiado extenso para un certificado acumulado de una sola pagina");
  };
  const fontSize = chooseFont();
  const rowGap = fontSize + 4.2;
  const topY = 596;
  for (let col = 0; col < columns; col += 1) {
    const x = areaX + col * (columnWidth + columnGap);
    let y = topY;
    const subset = activities.slice(col * perColumn, (col + 1) * perColumn);
    subset.forEach((activity, localIndex) => {
      const index = col * perColumn + localIndex + 1;
      const hours = activity.hours === null ? "—" : `${number(activity.hours)} h`;
      const numberWidth = fontSize * 2.6;
      const hoursWidth = 48;
      const titleX = x + numberWidth;
      const titleWidth = columnWidth - numberWidth - hoursWidth - 4;
      const titleLines = wrap(activity.title, titleWidth, fontSize);
      text(`${index}.`, x, y, fontSize, { color: "0.28 0.28 0.28" });
      titleLines.forEach((part, lineIndex) => {
        text(part, titleX, y - lineIndex * rowGap, fontSize, { color: "0.10 0.10 0.10" });
      });
      text(hours, x + columnWidth - hoursWidth, y, fontSize, { color: "0.10 0.10 0.10" });
      y -= Math.max(1, titleLines.length) * rowGap + 3.5;
      line(x, y + 1.5, x + columnWidth, y + 1.5, 0.35, "0.88 0.88 0.88");
    });
  }

  line(90, 186, 505, 186, 1.1, "0.91 0.58 0.34");
  text(`TOTAL FORMACIÓN ACUMULADA: ${number(model.totalHours)} HORAS`, 132, 160, 14,
    { color: "0.12 0.12 0.12" });
  text(`Actividades acreditadas: ${activities.length}`, 90, 136, 9, { color: "0.35 0.35 0.35" });
  text(`Emitido el ${date(model.issuedAt)}`, 398, 136, 9, { color: "0.35 0.35 0.35" });
  text("Las horas corresponden a la duración acreditada de cada actividad formativa.", 129, 112, 8,
    { color: "0.42 0.42 0.42" });
  line(90, 86, 505, 86, 0.7, "0.82 0.82 0.82");
  text("ISÓCRONA ZERO · Asociación sin ánimo de lucro", 90, 68, 7.5, { color: "0.38 0.38 0.38" });
  text("Registro Nacional de Asociaciones nº 622652", 328, 68, 7.5, { color: "0.38 0.38 0.38" });

  return [commands.join("\n")];
}

module.exports = { buildActivityCertificate, buildActivityCertificatePages, PAGE_WIDTH, PAGE_HEIGHT };
