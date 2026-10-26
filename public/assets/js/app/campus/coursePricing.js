function hasOwn(object, key) {
  return Boolean(object) && Object.prototype.hasOwnProperty.call(object, key);
}

function normalizeFee(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    const fallbackValue = Number(fallback);
    return Number.isFinite(fallbackValue) && fallbackValue >= 0 ? fallbackValue : 0;
  }
  return Math.round(parsed * 100) / 100;
}

export function getLegacyEnrollmentFee(course) {
  return normalizeFee(course?.enrollmentFee, 0);
}

export function getMemberEnrollmentFee(course) {
  const legacy = getLegacyEnrollmentFee(course);
  return hasOwn(course, "memberEnrollmentFee")
    ? normalizeFee(course.memberEnrollmentFee, legacy)
    : legacy;
}

export function getNonMemberEnrollmentFee(course) {
  const legacy = getLegacyEnrollmentFee(course);
  return hasOwn(course, "nonMemberEnrollmentFee")
    ? normalizeFee(course.nonMemberEnrollmentFee, legacy)
    : legacy;
}

export function getApplicableCourseFee(course, participantType) {
  const type = String(participantType || "").trim().toLowerCase();
  return ["member", "socio", "associate"].includes(type)
    ? getMemberEnrollmentFee(course)
    : getNonMemberEnrollmentFee(course);
}

export function formatCourseFee(value) {
  const fee = normalizeFee(value, 0);
  if (fee <= 0) return "Sin coste";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(fee) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(fee);
}
