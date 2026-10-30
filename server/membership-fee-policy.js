function madridYearMonth(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  const safeDate = Number.isFinite(date.getTime()) ? date : new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(safeDate);
  return {
    year: Number(parts.find((part) => part.type === "year")?.value || safeDate.getUTCFullYear()),
    month: Number(parts.find((part) => part.type === "month")?.value || safeDate.getUTCMonth() + 1)
  };
}

function associateJoinDate(associate) {
  return associate?.joinedAt || associate?.campusOnboardingCreatedAt || associate?.createdAt || "";
}

function autumnMembershipBenefit(associate) {
  const feeYear = Number(associate?.membershipFeeYear || 0);
  const sourceDate = associateJoinDate(associate);
  if (!Number.isInteger(feeYear) || !sourceDate) return null;
  const { year: joinedYear, month: joinedMonth } = madridYearMonth(sourceDate);
  if (joinedMonth < 10 || feeYear !== joinedYear + 1) return null;
  return { joinedYear, joinedMonth, feeYear };
}

function effectiveMembershipFeeYear(associate, value = new Date()) {
  const { year: currentYear } = madridYearMonth(value);
  const benefit = autumnMembershipBenefit(associate);
  if (
    benefit &&
    currentYear >= benefit.joinedYear &&
    currentYear <= benefit.feeYear
  ) {
    return benefit.feeYear;
  }
  return currentYear;
}

function associateFeeGapForDate(associate, value = new Date()) {
  if (!associate) return 0;
  const year = String(effectiveMembershipFeeYear(associate, value));
  const annualAmount = Number(associate.annualAmount || 0);
  const paid = Number(associate.yearlyFees?.[year] || 0);
  return Math.max(0, annualAmount - paid);
}

function isAssociateAccessLimitedByFee(associate, value = new Date()) {
  return associateFeeGapForDate(associate, value) > 0;
}

module.exports = {
  associateFeeGapForDate,
  autumnMembershipBenefit,
  effectiveMembershipFeeYear,
  isAssociateAccessLimitedByFee,
  madridYearMonth
};
