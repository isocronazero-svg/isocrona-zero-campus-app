const { enrollmentCertificateEligibility } = require("./enrollment-certificate-eligibility");
const { buildFinanceRow } = require("./course-finance");

function canIssueEnrollmentCertificate(state, course, memberId) {
  if (!(course?.enrolledIds || []).includes(memberId)) return false;
  // A cancelled historical registration must not shadow a later valid registration.
  const submission = (course.enrollmentSubmissions || []).find(item =>
    item.memberId === memberId && !["cancelled", "rejected"].includes(item.status));
  if (!submission) return false;

  // Use the effective fee and payment normalization from treasury for legacy records.
  const financeRow = buildFinanceRow(state, course, submission);
  return enrollmentCertificateEligibility(course, {
    status: financeRow.enrollmentStatus,
    amount: financeRow.amount,
    paymentStatus: financeRow.paymentStatus
  }).allowed;
}

function buildEnrollmentCertificateModel(state, courseId, memberId) {
  const course = (state?.courses || []).find(item => item.id === courseId);
  const member = (state?.members || []).find(item => item.id === memberId);
  if (!member || !canIssueEnrollmentCertificate(state, course, memberId)) return null;
  const hours = Number(course.hours);
  return {
    courseId: course.id,
    memberId: member.id,
    name: String(member.name || "").trim(),
    title: String(course.title || "").trim(),
    startDate: String(course.startDate || ""),
    endDate: String(course.endDate || ""),
    hours: Number.isFinite(hours) && hours >= 0 ? hours : null,
    location: String(course.location || course.venue || "").trim(),
    organizer: String(state.settings?.organization || "Asociación Isócrona Zero"),
    instructors: Array.isArray(course.instructors) ? course.instructors.filter(item => typeof item === "string" && item.trim()) : [],
    issuedAt: new Date().toISOString(),
    // This document never claims actual attendance.
    certificateType: "confirmed-enrollment"
  };
}
module.exports = { buildEnrollmentCertificateModel, canIssueEnrollmentCertificate };
