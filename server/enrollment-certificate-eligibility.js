// Eligibility for a pre-course enrollment confirmation, not an attendance certificate.
function enrollmentCertificateEligibility(course, submission) {
  if (!course || !submission) return { allowed: false, reason: "not-found" };
  const status = String(submission.status || "").toLowerCase();
  if (status !== "confirmed") return { allowed: false, reason: "enrollment-not-confirmed" };
  const amount = Number(submission.amount);
  if (!Number.isFinite(amount) || amount < 0) return { allowed: false, reason: "invalid-amount" };
  if (amount > 0 && String(submission.paymentStatus || "").toLowerCase() !== "validated") {
    return { allowed: false, reason: "payment-not-validated" };
  }
  return { allowed: true, reason: "confirmed" };
}

module.exports = { enrollmentCertificateEligibility };
