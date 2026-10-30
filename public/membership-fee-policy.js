(function (root) {
  const madrid = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid", year: "numeric", month: "2-digit"
  });

  function madridYearMonth(value = new Date()) {
    const parsed = new Date(value);
    const date = Number.isFinite(parsed.getTime()) ? parsed : new Date();
    const parts = Object.fromEntries(madrid.formatToParts(date).map(part => [part.type, part.value]));
    return { year: Number(parts.year), month: Number(parts.month) };
  }

  function membershipFeeYearForDate(value = new Date()) {
    const { year, month } = madridYearMonth(value);
    return month >= 10 ? year + 1 : year;
  }

  function effectiveMembershipFeeYear(associate, now = new Date()) {
    const { year } = madridYearMonth(now);
    const assigned = Number(associate?.membershipFeeYear);
    // Only an explicitly assigned exercise can extend coverage. Never infer a
    // new join from an old member's renewal/payment date. Later years expire it.
    return Number.isInteger(assigned) && assigned >= 2000 && assigned <= 2100
      ? Math.max(year, assigned) : year;
  }

  function rolloverBenefit(associate, now = new Date()) {
    const sourceDate = associate?.joinedAt || associate?.campusOnboardingCreatedAt || associate?.createdAt;
    if (!sourceDate || !Number.isFinite(Date.parse(sourceDate))) return null;
    const { year, month } = madridYearMonth(sourceDate);
    const feeYear = Number(associate?.membershipFeeYear);
    if (month < 10 || feeYear !== year + 1 || madridYearMonth(now).year !== year) return null;
    return { feeYear, joinedYear: year };
  }

  const policy = { madridYearMonth, membershipFeeYearForDate, effectiveMembershipFeeYear, rolloverBenefit };
  if (typeof module !== "undefined" && module.exports) module.exports = policy;
  else root.MembershipFeePolicy = policy;
})(globalThis);
