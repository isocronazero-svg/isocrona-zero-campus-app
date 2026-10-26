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

function findLinkedAssociate(state, account = {}, member = {}) {
  const associates = Array.isArray(state?.associates) ? state.associates : [];
  const accountId = String(account?.id || "").trim();
  const memberId = String(member?.id || account?.memberId || "").trim();
  const associateId = String(member?.associateId || account?.associateId || "").trim();
  return associates.find((associate) =>
    (associateId && associate.id === associateId) ||
    (memberId && associate.linkedMemberId === memberId) ||
    (accountId && associate.linkedAccountId === accountId)
  ) || null;
}

function getParticipantTypeForAccount(state, account = {}, member = {}) {
  return findLinkedAssociate(state, account, member) ? "member" : "external";
}

function getApplicableCourseFeeForAccount(state, course, account = {}, member = {}) {
  return getApplicableCourseFee(course, getParticipantTypeForAccount(state, account, member));
}

function coursePricingConfig(payload, previous = {}) {
  const source = payload?.course && typeof payload.course === "object" ? payload.course : payload || {};
  const sourceLegacy = hasOwn(source, "enrollmentFee")
    ? normalizeFee(source.enrollmentFee, previous.enrollmentFee)
    : getLegacyEnrollmentFee(previous);
  const memberFee = hasOwn(source, "memberEnrollmentFee")
    ? normalizeFee(source.memberEnrollmentFee, sourceLegacy)
    : hasOwn(previous, "memberEnrollmentFee")
      ? getMemberEnrollmentFee(previous)
      : sourceLegacy;
  const nonMemberFee = hasOwn(source, "nonMemberEnrollmentFee")
    ? normalizeFee(source.nonMemberEnrollmentFee, sourceLegacy)
    : hasOwn(previous, "nonMemberEnrollmentFee")
      ? getNonMemberEnrollmentFee(previous)
      : sourceLegacy;

  return {
    memberEnrollmentFee: memberFee,
    nonMemberEnrollmentFee: nonMemberFee,
    // Keep the legacy field as the public/general price until the old UI no longer reads it.
    enrollmentFee: nonMemberFee
  };
}

module.exports = {
  coursePricingConfig,
  findLinkedAssociate,
  getApplicableCourseFee,
  getApplicableCourseFeeForAccount,
  getCoursePricing,
  getLegacyEnrollmentFee,
  getMemberEnrollmentFee,
  getNonMemberEnrollmentFee,
  getParticipantTypeForAccount,
  normalizeFee,
  normalizeParticipantType
};
