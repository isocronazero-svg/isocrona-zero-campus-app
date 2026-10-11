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
  function canonical(value) {
    if (!String(value || "").trim()) return "";
    const time = timestamp(value);
    if (time === null) throw new Error("Indica una fecha de apertura de inscripción válida");
    return new Date(time).toISOString();
  }
  function fromLocalInput(value) {
    if (!String(value || "").trim()) return "";
    const raw = String(value).trim();
    const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(raw);
    const date = new Date(raw);
    if (!parts || !Number.isFinite(date.getTime()) ||
        date.getFullYear() !== +parts[1] || date.getMonth() + 1 !== +parts[2] ||
        date.getDate() !== +parts[3] || date.getHours() !== +parts[4] ||
        date.getMinutes() !== +parts[5] || date.getSeconds() !== +(parts[6] || 0)) {
      throw new Error("Indica una fecha de apertura válida; esa hora local no existe");
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
  const api = { timestamp, canonical, fromLocalInput, localInput };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.EnrollmentTime = api;
})(globalThis);
