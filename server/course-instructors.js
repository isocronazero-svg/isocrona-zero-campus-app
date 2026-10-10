const { randomUUID } = require("node:crypto");

function isAssociateInstructor(state, memberId) {
  const member = (state.members || []).find(item => item.id === memberId);
  return Boolean(member && (state.associates || []).some(associate =>
    associate.id === member.associateId || associate.linkedMemberId === memberId));
}

function validateCourseInstructors(state, course) {
  if (course.instructors === undefined) return;
  if (!Array.isArray(course.instructors) || course.instructors.length > 100) {
    throw new Error("Selecciona un equipo de hasta 100 instructores");
  }
  const seen = new Set();
  course.instructors = course.instructors.map(item => {
    const memberId = String(item?.memberId || "").trim();
    const hours = Number(item?.hours);
    if (!isAssociateInstructor(state, memberId) || seen.has(memberId)) {
      throw new Error("Cada instructor debe ser un socio con ficha de campus, sin duplicados");
    }
    if (!Number.isFinite(hours) || hours <= 0 || hours > Number(course.hours) ||
        Math.abs(hours * 100 - Math.round(hours * 100)) > 0.000001) {
      throw new Error("Las horas de cada instructor deben ser positivas y no superar las del curso (maximo dos decimales)");
    }
    seen.add(memberId);
    return { memberId, hours };
  });
}

function issueInstructorDiplomas(state, course, now = new Date()) {
  // Only a closed, finished course accredits teaching. Issued records are additive.
  if (course.status !== "Cerrado" || !/^\d{4}-\d{2}-\d{2}$/.test(course.endDate || "") ||
      course.endDate > now.toISOString().slice(0, 10)) return;
  const issued = Array.isArray(course.instructorDiplomas) ? course.instructorDiplomas : [];
  for (const assignment of course.instructors || []) {
    if (issued.some(item => item.memberId === assignment.memberId) ||
        !isAssociateInstructor(state, assignment.memberId)) continue;
    const hours = Number(assignment.hours);
    if (!Number.isFinite(hours) || hours <= 0 || hours > Number(course.hours)) continue;
    issued.push({
      memberId: assignment.memberId, hours, issuedAt: now.toISOString(),
      code: `IZ-INSTR-${randomUUID()}`,
      title: course.title, type: course.type, startDate: course.startDate, endDate: course.endDate
    });
  }
  course.instructorDiplomas = issued;
}

function listInstructorDiplomas(state) {
  return (state.courses || []).flatMap(course => (course.instructorDiplomas || []).flatMap(record => {
    const member = (state.members || []).find(item => item.id === record.memberId);
    if (!member || !record.code) return [];
    return [{
      role: "instructor", member, code: record.code, registryNumber: record.code,
      issuedAt: record.issuedAt,
      course: { ...course, title: record.title, type: record.type, hours: record.hours,
        startDate: record.startDate, endDate: record.endDate }
    }];
  }));
}

function getInstructorDiplomaRecord(state, courseId, memberId) {
  return listInstructorDiplomas(state).find(item => item.course.id === courseId && item.member.id === memberId) || null;
}

module.exports = { validateCourseInstructors, issueInstructorDiplomas, listInstructorDiplomas, getInstructorDiplomaRecord };
