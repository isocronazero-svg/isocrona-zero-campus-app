(function (root) {
  const madrid = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
  });
  function timestamp(value) {
    const raw = String(value || "").trim().replace(" ", "T");
    if (!raw) return null;
    if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)) {
      const time = Date.parse(raw);
      return Number.isFinite(time) ? time : null;
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(raw);
    if (!match) return null;
    const [, y, m, d, h, min, s = "0"] = match;
    const wall = Date.UTC(+y, +m - 1, +d, +h, +min, +s);
    // Enumerate Madrid's two offsets; never use the host process timezone.
    // Repeated autumn hours choose the earlier occurrence; nonexistent spring hours are invalid.
    for (const offset of [120, 60]) {
      const candidate = wall - offset * 60000;
      const parts = Object.fromEntries(madrid.formatToParts(candidate).map(p => [p.type, p.value]));
      if (+parts.year === +y && +parts.month === +m && +parts.day === +d &&
          +parts.hour === +h && +parts.minute === +min && +parts.second === +s) return candidate;
    }
    return null;
  }
  function canonical(value, field = "apertura") {
    if (!String(value || "").trim()) return "";
    const time = timestamp(value);
    if (time === null) throw new Error(`Indica una fecha de ${field} de inscripción válida`);
    return new Date(time).toISOString();
  }
  function fromLocalInput(value, field = "apertura") {
    if (!String(value || "").trim()) return "";
    const raw = String(value).trim();
    const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(raw);
    const date = new Date(raw);
    if (!parts || !Number.isFinite(date.getTime()) ||
        date.getFullYear() !== +parts[1] || date.getMonth() + 1 !== +parts[2] ||
        date.getDate() !== +parts[3] || date.getHours() !== +parts[4] ||
        date.getMinutes() !== +parts[5] || date.getSeconds() !== +(parts[6] || 0)) {
      throw new Error(`Indica una fecha de ${field} válida; esa hora local no existe`);
    }
    return date.toISOString();
  }
  function localInput(value) {
    const time = timestamp(value);
    if (time === null) return "";
    const date = new Date(time);
    const pad = n => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  function calendarDateInMadrid(value = Date.now()) {
    const parts = Object.fromEntries(madrid.formatToParts(value).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  function courseStartTimestamp(course) {
    const day = String(course?.startDate || "").trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(day) ? timestamp(`${day}T00:00`) : null;
  }
  function courseCloseTimestamp(course) {
    const start = courseStartTimestamp(course);
    const explicit = timestamp(course?.enrollmentClosesAt);
    // Imported/legacy state cannot extend enrollment beyond the start of the course.
    return explicit === null ? start : start === null ? explicit : Math.min(explicit, start);
  }
  function courseWindowState(course, nowValue = Date.now()) {
    const now = typeof nowValue === "number" ? nowValue : new Date(nowValue).getTime();
    const opens = timestamp(course?.enrollmentOpensAt);
    const closes = courseCloseTimestamp(course);
    if (!Number.isFinite(now) ||
        (course?.startDate && courseStartTimestamp(course) === null) ||
        (course?.enrollmentOpensAt && opens === null) ||
        (course?.enrollmentClosesAt && timestamp(course.enrollmentClosesAt) === null)) return "closed";
    if (closes !== null && now >= closes) return "closed";
    return opens !== null && now < opens ? "future" : "open";
  }
  function validateCourseWindow(course, previous = null) {
    const fields = ["startDate", "enrollmentOpensAt", "enrollmentClosesAt"];
    const comparable = (item, field) => field === "startDate"
      ? String(item?.[field] || "").trim()
      : timestamp(item?.[field]) ?? String(item?.[field] || "").trim();
    // Leave unrelated edits of legacy records possible; revalidate every temporal change.
    if (previous && fields.every(field => comparable(course, field) === comparable(previous, field))) return;
    const start = courseStartTimestamp(course);
    if (start === null) throw new Error("Indica una fecha de inicio válida para el curso");
    const opens = timestamp(canonical(course.enrollmentOpensAt));
    const explicit = timestamp(canonical(course.enrollmentClosesAt, "cierre"));
    if (explicit !== null && explicit >= start) {
      throw new Error("El cierre de inscripción debe ser anterior al inicio del día del curso (00:00 Europe/Madrid)");
    }
    if (opens !== null && opens >= (explicit ?? start)) {
      throw new Error("La apertura de inscripción debe ser anterior al cierre de inscripción");
    }
  }
  const api = { timestamp, canonical, fromLocalInput, localInput, calendarDateInMadrid,
    courseStartTimestamp, courseCloseTimestamp, courseWindowState, validateCourseWindow };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.EnrollmentTime = api;
})(globalThis);
