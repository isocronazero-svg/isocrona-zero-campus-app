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

function getLegacyEnrollmentFee(course) {
  return normalizeFee(course?.enrollmentFee, 0);
}

function getMemberEnrollmentFee(course) {
  const legacy = getLegacyEnrollmentFee(course);
  return hasOwn(course, "memberEnrollmentFee")
    ? normalizeFee(course.memberEnrollmentFee, legacy)
    : legacy;
}

function getNonMemberEnrollmentFee(course) {
  const legacy = getLegacyEnrollmentFee(course);
  return hasOwn(course, "nonMemberEnrollmentFee")
    ? normalizeFee(course.nonMemberEnrollmentFee, legacy)
    : legacy;
}

function normalizeParticipantType(value) {
  const type = String(value || "").trim().toLowerCase();
  return ["member", "socio", "associate"].includes(type) ? "member" : "external";
}

function getApplicableCourseFee(course, participantType) {
  return normalizeParticipantType(participantType) === "member"
    ? getMemberEnrollmentFee(course)
    : getNonMemberEnrollmentFee(course);
}

function getCoursePricing(course) {
  return {
    memberFee: getMemberEnrollmentFee(course),
    nonMemberFee: getNonMemberEnrollmentFee(course),
    legacyFee: getLegacyEnrollmentFee(course)
  };
}

module.exports = {
  getApplicableCourseFee,
  getCoursePricing,
  getLegacyEnrollmentFee,
  getMemberEnrollmentFee,
  getNonMemberEnrollmentFee,
  normalizeFee,
  normalizeParticipantType
};
