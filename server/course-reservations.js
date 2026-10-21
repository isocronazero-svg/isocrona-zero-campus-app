const { randomUUID } = require("node:crypto");

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return clean(value).toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function conflict(message, code = "COURSE_RESERVATION_CONFLICT") {
  const error = new Error(message);
  error.code = code;
  error.status = 409;
  error.statusCode = 409;
  return error;
}

function findCourse(state, courseId) {
  return ensureArray(state?.courses).find((course) => course.id === courseId) || null;
}

function findMember(state, memberId) {
  return ensureArray(state?.members).find((member) => member.id === memberId) || null;
}

function findAssociateForMember(state, member) {
  if (!member) return null;
  return ensureArray(state?.associates).find((associate) =>
    associate.linkedMemberId === member.id ||
    (member.associateId && associate.id === member.associateId)
  ) || null;
}

function getCourseCapacity(course) {
  const capacity = Number(course?.capacity || 0);
  return Number.isFinite(capacity) && capacity > 0 ? Math.floor(capacity) : 0;
}

function getOccupiedSeatCount(course) {
  return new Set(ensureArray(course?.enrolledIds).filter(Boolean)).size;
}

function getSeatsLeft(course) {
  return Math.max(getCourseCapacity(course) - getOccupiedSeatCount(course), 0);
}

function assertCourseCanReserve(course) {
  if (!course) throw new Error("Curso no encontrado");
  const capacity = getCourseCapacity(course);
  if (!capacity) throw new Error("El curso no tiene un aforo valido");
  if (getOccupiedSeatCount(course) >= capacity) {
    throw conflict("No quedan plazas libres para realizar una reserva administrativa", "COURSE_CAPACITY_CONFLICT");
  }
}

function isActiveReservationSubmission(submission) {
  return submission && !["rejected", "cancelled"].includes(clean(submission.status).toLowerCase());
}

function findExternalGuestByEmail(state, email) {
  if (!email) return null;
  return ensureArray(state?.members).find(
    (member) => member.source === "admin-course-guest" && normalizeEmail(member.email) === email
  ) || null;
}

function createExternalGuest(state, payload) {
  const firstName = clean(payload.firstName);
  const lastName = clean(payload.lastName);
  if (!firstName || !lastName) {
    throw new Error("Indica el nombre y apellidos del participante externo");
  }

  const email = normalizeEmail(payload.email);
  if (!isValidEmail(email)) {
    throw new Error("Indica un correo electronico valido para el participante externo");
  }

  const existing = findExternalGuestByEmail(state, email);
  if (existing) return existing;

  const member = {
    id: `member-guest-${randomUUID()}`,
    name: `${firstName} ${lastName}`.trim(),
    role: "Participante externo",
    email,
    phone: clean(payload.phone),
    certifications: [],
    renewalsDue: 0,
    source: "admin-course-guest",
    createdAt: new Date().toISOString()
  };
  state.members = ensureArray(state.members);
  state.members.push(member);
  return member;
}

function resolveReservationMember(state, payload) {
  const participantType = clean(payload.participantType || payload.type).toLowerCase();
  if (participantType === "member" || participantType === "socio") {
    const memberId = clean(payload.memberId);
    const member = findMember(state, memberId);
    if (!member || !findAssociateForMember(state, member)) {
      throw new Error("Selecciona un socio con ficha personal vinculada");
    }
    return { member, participantType: "member", createdGuest: false };
  }
  if (participantType === "external" || participantType === "externo") {
    const before = ensureArray(state.members).length;
    const member = createExternalGuest(state, payload);
    return {
      member,
      participantType: "external",
      createdGuest: ensureArray(state.members).length > before
    };
  }
  throw new Error("Selecciona si la reserva es para un socio o para una persona externa");
}

function assertNotAlreadyRegistered(course, memberId) {
  const registered = ensureArray(course.enrolledIds).includes(memberId) || ensureArray(course.waitingIds).includes(memberId);
  const activeSubmission = ensureArray(course.enrollmentSubmissions).some(
    (submission) => submission.memberId === memberId && isActiveReservationSubmission(submission)
  );
  if (registered || activeSubmission) {
    throw conflict("Esta persona ya figura en el curso o tiene una solicitud activa", "COURSE_DUPLICATE_PARTICIPANT");
  }
}

function reserveAdministrativeSeat(state, courseId, payload = {}) {
  if (!state || typeof state !== "object") throw new Error("Estado del campus no valido");
  const course = findCourse(state, courseId);
  assertCourseCanReserve(course);

  const { member, participantType, createdGuest } = resolveReservationMember(state, payload);
  try {
    assertNotAlreadyRegistered(course, member.id);
    assertCourseCanReserve(course);

    course.enrolledIds = ensureArray(course.enrolledIds);
    course.waitingIds = ensureArray(course.waitingIds).filter((id) => id !== member.id);
    course.enrollmentSubmissions = ensureArray(course.enrollmentSubmissions);
    course.enrolledIds.push(member.id);

    const fee = Number(course.enrollmentFee || 0);
    const now = new Date().toISOString();
    const submission = {
      id: `reservation-${randomUUID()}`,
      memberId: member.id,
      submittedAt: now,
      updatedAt: now,
      status: fee > 0 ? "pending-proof" : "confirmed",
      note: clean(payload.note),
      paymentProof: null,
      amount: Number.isFinite(fee) ? fee : 0,
      method: clean(payload.method) || "Transferencia",
      source: "admin-reservation",
      participantType,
      reservedBy: clean(payload.reservedBy),
      reservedAt: now
    };
    course.enrollmentSubmissions.push(submission);

    return {
      course,
      member,
      submission,
      createdGuest,
      seatsLeft: getSeatsLeft(course)
    };
  } catch (error) {
    if (createdGuest) {
      state.members = ensureArray(state.members).filter((item) => item.id !== member.id);
    }
    throw error;
  }
}

function containsExactReference(value, memberId, seen = new Set()) {
  if (value === memberId) return true;
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some((item) => containsExactReference(item, memberId, seen));
  return Object.entries(value).some(([key, item]) => key === memberId || containsExactReference(item, memberId, seen));
}

function memberHasStoredReference(state, memberId) {
  const withoutOwnMemberRow = {
    ...state,
    members: ensureArray(state?.members).filter((member) => member.id !== memberId)
  };
  return containsExactReference(withoutOwnMemberRow, memberId);
}

function releaseAdministrativeSeat(state, courseId, reservationId) {
  const course = findCourse(state, courseId);
  if (!course) throw new Error("Curso no encontrado");
  const submission = ensureArray(course.enrollmentSubmissions).find(
    (item) => item.id === reservationId && item.source === "admin-reservation"
  );
  if (!submission) throw new Error("Reserva administrativa no encontrada");

  const memberId = submission.memberId;
  course.enrollmentSubmissions = ensureArray(course.enrollmentSubmissions).filter((item) => item.id !== reservationId);
  const hasOtherActiveSubmission = course.enrollmentSubmissions.some(
    (item) => item.memberId === memberId && isActiveReservationSubmission(item)
  );
  if (!hasOtherActiveSubmission) {
    course.enrolledIds = ensureArray(course.enrolledIds).filter((id) => id !== memberId);
    course.waitingIds = ensureArray(course.waitingIds).filter((id) => id !== memberId);
  }

  const member = findMember(state, memberId);
  const removeGuest = member?.source === "admin-course-guest" && !memberHasStoredReference(state, memberId);
  if (removeGuest) {
    state.members = ensureArray(state.members).filter((item) => item.id !== memberId);
  }

  return {
    course,
    member,
    removedGuest: Boolean(removeGuest),
    seatsLeft: getSeatsLeft(course)
  };
}

module.exports = {
  getOccupiedSeatCount,
  getSeatsLeft,
  releaseAdministrativeSeat,
  reserveAdministrativeSeat
};
