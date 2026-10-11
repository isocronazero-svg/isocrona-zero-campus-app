// Certifiable identities are association records, never campus names or coordinator text.
function validateInstructorAssociateIds(state, ids) {
  if (!Array.isArray(ids) || ids.length > 100 || ids.some(id => typeof id !== "string" || !id)) {
    throw new Error("Selecciona instructores desde las fichas de socios existentes");
  }
  if (new Set(ids).size !== ids.length || ids.some(id => !(state.associates || []).some(a => a.id === id))) {
    throw new Error("Todos los instructores deben tener una ficha de socio existente");
  }
  if (ids.some(id => {
    const associate = state.associates.find(a => a.id === id);
    return ![associate.firstName, associate.lastName].some(value => String(value || "").trim());
  })) {
    throw new Error("Completa el nombre del socio antes de asignarlo como instructor");
  }
  return [...ids];
}

function canDownloadInstructorCertificate(state, account, associateId, resolvedAssociate = null) {
  const associate = (state.associates || []).find(a => a.id === associateId);
  if (!associate || !account) return false;
  if (account.role === "admin") return true;
  if (resolvedAssociate?.id === associate.id) return true;
  return account.associateId === associate.id ||
    Boolean(associate.linkedAccountId && associate.linkedAccountId === account.id) ||
    Boolean(account.memberId && (associate.linkedMemberId === account.memberId ||
      (state.members || []).some(m => m.id === account.memberId && m.associateId === associate.id)));
}

function isInstructorCertificateAvailable(course, today = new Date().toISOString().slice(0, 10)) {
  const end = String(course?.endDate || "");
  return course?.status === "Cerrado" && /^\d{4}-\d{2}-\d{2}$/.test(end) &&
    Number.isFinite(Date.parse(end)) && new Date(end).toISOString().slice(0, 10) === end && end <= today;
}

function buildInstructorCertificateModel(state, courseId, associateId, dates) {
  const course = (state.courses || []).find(c => c.id === courseId);
  const associate = (state.associates || []).find(a => a.id === associateId);
  if (!isInstructorCertificateAvailable(course) || !associate || !(course.instructorAssociateIds || []).includes(associateId)) return null;
  const name = [associate.firstName, associate.lastName].filter(Boolean).join(" ").trim();
  if (!name) return null;
  return {
    kind: "instructor", certificateTitle: "CERTIFICADO DE INSTRUCTOR/A",
    member: { id: associate.id, name }, course,
    documentId: String(associate.dni || associate.nie || associate.documentId || ""),
    dateRange: dates.dateRange, issueDate: dates.issueDate,
    city: course.certificateCity || state.settings?.certificateCity || "Madrid",
    sections: [], preview: false
  };
}

module.exports = { validateInstructorAssociateIds, canDownloadInstructorCertificate, isInstructorCertificateAvailable, buildInstructorCertificateModel };
