function canManageAssignedCourse(account, course) {
  if (!account) return false;
  if (account.role === "admin") return true;
  if (!course) return false;
  return ["member", "instructor"].includes(account.role) &&
    Boolean(account.associateId) &&
    (course.instructorAssociateIds || []).includes(account.associateId);
}

module.exports = { canManageAssignedCourse };
