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
    const benefit = autumnMembershipBenefit(associate);
    // A manual future exercise outside the autumn-join policy must not waive
    // the current year's fee. Later years expire the initial extension.
    return benefit && year >= benefit.joinedYear && year <= benefit.feeYear ? benefit.feeYear : year;
  }

  function autumnMembershipBenefit(associate) {
    const sourceDate = associate?.joinedAt || associate?.campusOnboardingCreatedAt || associate?.createdAt;
    if (!sourceDate || !Number.isFinite(Date.parse(sourceDate))) return null;
    const { year, month } = madridYearMonth(sourceDate);
    const feeYear = Number(associate?.membershipFeeYear);
    if (month < 10 || feeYear !== year + 1) return null;
    return { feeYear, joinedYear: year, joinedMonth: month };
  }

  function rolloverBenefit(associate, now = new Date()) {
    const benefit = autumnMembershipBenefit(associate);
    return benefit && madridYearMonth(now).year === benefit.joinedYear ? benefit : null;
  }

  function associateFeeGapForDate(associate, now = new Date()) {
    if (!associate) return 0;
    const paid = Number(associate.yearlyFees?.[effectiveMembershipFeeYear(associate, now)] || 0);
    return Math.max(0, Number(associate.annualAmount || 0) - paid);
  }

  function isAssociateAccessLimitedByFee(associate, now = new Date()) {
    return associateFeeGapForDate(associate, now) > 0;
  }

  const policy = { madridYearMonth, membershipFeeYearForDate, effectiveMembershipFeeYear,
    autumnMembershipBenefit, rolloverBenefit, associateFeeGapForDate, isAssociateAccessLimitedByFee };
  if (typeof module !== "undefined" && module.exports) module.exports = policy;
  else root.MembershipFeePolicy = policy;
})(globalThis);
