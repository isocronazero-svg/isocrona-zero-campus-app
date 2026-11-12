const { enrollmentCertificateEligibility } = require("./enrollment-certificate-eligibility");
const { buildFinanceRow } = require("./course-finance");

function buildEnrollmentCertificateModel(state, courseId, memberId) {
  const course = (state?.courses || []).find(item => item.id === courseId);
  const member = (state?.members || []).find(item => item.id === memberId);
  // A cancelled historical registration must not shadow a later valid registration.
  const submission = (course?.enrollmentSubmissions || []).find(item => item.memberId === memberId && item.status !== "cancelled");
  if (!course || !member || !submission) return null;
  // Use the same effective fee and payment normalization as treasury, including legacy records.
  const financeRow = buildFinanceRow(state, course, submission);
  const eligibility = enrollmentCertificateEligibility(course, {
    status: financeRow.enrollmentStatus,
    amount: financeRow.amount,
    paymentStatus: financeRow.paymentStatus
  });
  if (!(course.enrolledIds || []).includes(memberId)) return null;
  if (!eligibility.allowed) return null;
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
module.exports = { buildEnrollmentCertificateModel };
