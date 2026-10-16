// Certifiable identities are association records, never campus names or coordinator text.
const EnrollmentTime = require('../public/enrollment-time');
const pendingInstructorAssignments = new Map();

function reserveInstructorAssignments(ids, existingIds = []) {
  const added = ids.filter(id => !existingIds.includes(id));
  for (const id of added) pendingInstructorAssignments.set(id, (pendingInstructorAssignments.get(id) || 0) + 1);
  return () => {
    for (const id of added) {
      const remaining = pendingInstructorAssignments.get(id) - 1;
      if (remaining) pendingInstructorAssignments.set(id, remaining);
      else pendingInstructorAssignments.delete(id);
    }
  };
}

function assertInstructorAssignmentEditable(associateId) {
  if (!pendingInstructorAssignments.has(associateId)) return;
  const error = new Error("Este instructor tiene un curso guardandose. Espera a que termine y vuelve a intentarlo.");
  error.statusCode = 409;
  throw error;
}

function hasInstructorName(associate) {
  return [associate?.firstName, associate?.lastName].some(value => String(value || "").trim());
}

function validateInstructorAssociateUpdate(state, associateId, nextAssociate) {
  const previous = (state.associates || []).find(a => a.id === associateId);
  const nameChanged = ["firstName", "lastName"].some(key =>
    String(previous?.[key] || "").trim() !== String(nextAssociate?.[key] || "").trim());
  if (nameChanged) assertInstructorAssignmentEditable(associateId);
  if (nameChanged && !hasInstructorName(nextAssociate) &&
      (state.courses || []).some(course => (course.instructorAssociateIds || []).includes(associateId))) {
    throw new Error("No puedes borrar el nombre de un socio asignado como instructor. Introduce un nombre valido.");
  }
}

function validateInstructorAssociateIds(state, ids, existingIds = []) {
  if (!Array.isArray(ids) || ids.length > 100 || ids.some(id => typeof id !== "string" || !id)) {
    throw new Error("Selecciona instructores desde las fichas de socios existentes");
  }
  const associates = state.associates || [];
  if (new Set(ids).size !== ids.length || ids.some(id => !associates.some(a => a.id === id))) {
    throw new Error("Todos los instructores deben tener una ficha de socio existente");
  }
  // Existing historical assignments may remain after an instructor is disabled or an old record becomes incomplete.
  const newIds = ids.filter(id => !existingIds.includes(id));
  if (newIds.some(id => !hasInstructorName(associates.find(a => a.id === id)))) {
    throw new Error("Completa el nombre del socio antes de asignarlo como instructor");
  }
  if (newIds.some(id => associates.find(a => a.id === id)?.instructorEnabled !== true)) {
    throw new Error("El socio debe estar habilitado como instructor antes de asignarlo");
  }
  return [...ids];
}

function canDownloadInstructorCertificate(state, account, associateId, resolvedAssociate = null) {
  const associate = (state.associates || []).find(a => a.id === associateId);
  if (!associate || !account) return false;
  if (account.role === "admin") return true;
  const member = (state.members || []).find(item => item.id === account.memberId);
  const explicitId = member?.associateId || account.associateId;
  if (explicitId) return explicitId === associate.id;
  if (resolvedAssociate) return resolvedAssociate.id === associate.id;
  return Boolean(associate.linkedAccountId && associate.linkedAccountId === account.id) ||
    Boolean(account.memberId && (associate.linkedMemberId === account.memberId ||
      (state.members || []).some(m => m.id === account.memberId && m.associateId === associate.id)));
}

function isInstructorCertificateAvailable(course, today = EnrollmentTime.calendarDateInMadrid(new Date())) {
  const end = String(course?.endDate || "");
  return course?.status === "Cerrado" && /^\d{4}-\d{2}-\d{2}$/.test(end) &&
    Number.isFinite(Date.parse(end)) && new Date(end).toISOString().slice(0, 10) === end && end < today;
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

module.exports = { reserveInstructorAssignments, assertInstructorAssignmentEditable, validateInstructorAssociateIds, validateInstructorAssociateUpdate, canDownloadInstructorCertificate, isInstructorCertificateAvailable, buildInstructorCertificateModel };
