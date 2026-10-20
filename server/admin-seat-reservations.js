const { randomUUID } = require('node:crypto');

function activeAdminReservations(course) {
  return (Array.isArray(course?.adminReservations) ? course.adminReservations : []).filter(
    (reservation) => String(reservation?.status || 'reserved') !== 'released'
  );
}

function getCourseGuestReservationCount(course) {
  return activeAdminReservations(course).filter((reservation) => reservation.kind === 'guest').length;
}

function getCourseOccupiedSeatCount(course) {
  const enrolled = new Set((course?.enrolledIds || []).map((id) => String(id || '').trim()).filter(Boolean));
  return enrolled.size + getCourseGuestReservationCount(course);
}

function getCourseSeatsLeft(course) {
  return Math.max(Number(course?.capacity || 0) - getCourseOccupiedSeatCount(course), 0);
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function reservationLabel(state, reservation) {
  if (reservation.kind === 'member') {
    return (state.members || []).find((member) => member.id === reservation.memberId)?.name || 'Socio';
  }
  return reservation.guestName || 'Invitado externo';
}

function buildReservationResponse(course, reservation) {
  return {
    reservation,
    occupiedSeats: getCourseOccupiedSeatCount(course),
    seatsLeft: getCourseSeatsLeft(course),
    capacity: Number(course.capacity || 0)
  };
}

function createAdminSeatReservationsHandler(deps) {
  return async (req, res, url) => {
    const createMatch = url.pathname.match(/^\/api\/courses\/([^/]+)\/admin-reservations$/);
    const reservationMatch = url.pathname.match(/^\/api\/courses\/([^/]+)\/admin-reservations\/([^/]+)$/);
    const paymentMatch = url.pathname.match(/^\/api\/courses\/([^/]+)\/admin-reservations\/([^/]+)\/payment$/);
    if (!createMatch && !reservationMatch && !paymentMatch) return false;

    res.setHeader('Cache-Control', 'private, no-store');
    let state = null;
    try {
      state = deps.readState();
      let account = deps.requireAdminAccount(req, res, state);
      if (!account) return true;

      const courseId = decodeURIComponent((createMatch || reservationMatch || paymentMatch)[1]);
      let course = (state.courses || []).find((item) => item.id === courseId);
      if (!course) {
        deps.sendJson(res, 404, { ok: false, error: 'Curso no encontrado' });
        return true;
      }
      course.adminReservations = Array.isArray(course.adminReservations) ? course.adminReservations : [];

      if (createMatch && req.method === 'POST') {
        const body = await deps.readJsonBody(req, 16 * 1024);
        state = deps.readState();
        account = deps.requireAdminAccount(req, res, state);
        if (!account) return true;
        course = (state.courses || []).find((item) => item.id === courseId);
        if (!course) {
          deps.sendJson(res, 404, { ok: false, error: 'Curso no encontrado' });
          return true;
        }
        course.adminReservations = Array.isArray(course.adminReservations) ? course.adminReservations : [];

        if (getCourseSeatsLeft(course) <= 0) {
          deps.sendJson(res, 409, { ok: false, error: 'No quedan plazas libres para reservar' });
          return true;
        }

        const kind = String(body.kind || '').trim() === 'guest' ? 'guest' : 'member';
        const now = new Date().toISOString();
        let reservation = null;

        if (kind === 'member') {
          const memberId = String(body.memberId || '').trim();
          const member = (state.members || []).find((item) => item.id === memberId);
          if (!member) {
            deps.sendJson(res, 400, { ok: false, error: 'Selecciona un socio válido' });
            return true;
          }
          const duplicate =
            (course.enrolledIds || []).includes(memberId) ||
            (course.waitingIds || []).includes(memberId) ||
            activeAdminReservations(course).some((item) => item.kind === 'member' && item.memberId === memberId);
          if (duplicate) {
            deps.sendJson(res, 409, { ok: false, error: 'Esta persona ya tiene inscripción, espera o reserva en el curso' });
            return true;
          }

          reservation = {
            id: `admin-reservation-${randomUUID()}`,
            kind: 'member',
            memberId,
            guestName: '',
            email: normalizeEmail(member.email),
            phone: '',
            status: 'reserved',
            paymentStatus: Number(course.enrollmentFee || 0) > 0 ? 'pending' : 'not-required',
            createdAt: now,
            createdByAccountId: account.id || '',
            createdBy: account.name || 'Administración'
          };

          course.enrolledIds = [...new Set([...(course.enrolledIds || []), memberId])];
          course.waitingIds = (course.waitingIds || []).filter((id) => id !== memberId);
          course.enrollmentSubmissions = Array.isArray(course.enrollmentSubmissions) ? course.enrollmentSubmissions : [];
          course.enrollmentSubmissions = [
            ...course.enrollmentSubmissions.filter((submission) => submission.memberId !== memberId),
            {
              id: `enrollment-${randomUUID()}`,
              memberId,
              submittedAt: now,
              status: Number(course.enrollmentFee || 0) > 0 ? 'pending-proof' : 'confirmed',
              note: 'Reserva administrativa previa',
              paymentProof: null,
              amount: Number(course.enrollmentFee || 0),
              method: 'Transferencia',
              source: 'admin-reservation',
              adminReservationId: reservation.id
            }
          ];
        } else {
          const guestName = normalizeName(body.guestName);
          const email = normalizeEmail(body.email);
          const phone = String(body.phone || '').trim();
          if (!guestName || guestName.length > 160) {
            deps.sendJson(res, 400, { ok: false, error: 'Indica el nombre y apellidos del invitado externo' });
            return true;
          }
          if (email && (!/^\S+@\S+\.\S+$/.test(email) || email.length > 180)) {
            deps.sendJson(res, 400, { ok: false, error: 'El email del invitado no es válido' });
            return true;
          }
          if (phone.length > 50) {
            deps.sendJson(res, 400, { ok: false, error: 'El teléfono del invitado es demasiado largo' });
            return true;
          }
          const duplicate = activeAdminReservations(course).some((item) => {
            if (item.kind !== 'guest') return false;
            if (email && normalizeEmail(item.email) === email) return true;
            return !email && normalizeName(item.guestName).toLowerCase() === guestName.toLowerCase();
          });
          if (duplicate) {
            deps.sendJson(res, 409, { ok: false, error: 'Este invitado ya tiene una reserva en el curso' });
            return true;
          }

          reservation = {
            id: `admin-reservation-${randomUUID()}`,
            kind: 'guest',
            memberId: '',
            guestName,
            email,
            phone,
            status: 'reserved',
            paymentStatus: Number(course.enrollmentFee || 0) > 0 ? 'pending' : 'not-required',
            createdAt: now,
            createdByAccountId: account.id || '',
            createdBy: account.name || 'Administración'
          };
        }

        course.adminReservations.push(reservation);
        deps.appendActivity(
          state,
          'admin',
          account.name || 'Administración',
          `Reserva plaza para ${reservationLabel(state, reservation)} en ${course.title}`
        );
        deps.writeState(state);
        deps.sendJson(res, 201, { ok: true, ...buildReservationResponse(course, reservation) });
        return true;
      }

      const reservationId = decodeURIComponent((reservationMatch || paymentMatch)?.[2] || '');
      const reservation = activeAdminReservations(course).find((item) => item.id === reservationId);
      if (!reservation) {
        deps.sendJson(res, 404, { ok: false, error: 'Reserva no encontrada' });
        return true;
      }

      if (paymentMatch && req.method === 'POST') {
        const body = await deps.readJsonBody(req, 4 * 1024);
        reservation.paymentStatus = body.paid === false ? 'pending' : 'paid';
        reservation.paymentUpdatedAt = new Date().toISOString();
        reservation.paymentUpdatedBy = account.name || 'Administración';
        deps.appendActivity(
          state,
          'admin',
          account.name || 'Administración',
          `${reservation.paymentStatus === 'paid' ? 'Marca pagada' : 'Marca pendiente'} la reserva de ${reservationLabel(state, reservation)} en ${course.title}`
        );
        deps.writeState(state);
        deps.sendJson(res, 200, { ok: true, ...buildReservationResponse(course, reservation) });
        return true;
      }

      if (reservationMatch && req.method === 'DELETE') {
        const label = reservationLabel(state, reservation);
        course.adminReservations = course.adminReservations.filter((item) => item.id !== reservationId);
        if (reservation.kind === 'member' && reservation.memberId) {
          course.enrolledIds = (course.enrolledIds || []).filter((id) => id !== reservation.memberId);
          course.waitingIds = (course.waitingIds || []).filter((id) => id !== reservation.memberId);
          course.enrollmentSubmissions = (course.enrollmentSubmissions || []).filter(
            (submission) => !(submission.memberId === reservation.memberId && submission.adminReservationId === reservationId)
          );
        }
        deps.appendActivity(state, 'admin', account.name || 'Administración', `Libera la reserva de ${label} en ${course.title}`);
        deps.writeState(state);
        deps.sendJson(res, 200, {
          ok: true,
          releasedReservationId: reservationId,
          occupiedSeats: getCourseOccupiedSeatCount(course),
          seatsLeft: getCourseSeatsLeft(course),
          capacity: Number(course.capacity || 0)
        });
        return true;
      }

      deps.sendJson(res, 405, { ok: false, error: 'Método no permitido' });
      return true;
    } catch (error) {
      deps.sendJsonError(res, error, 'No se pudo gestionar la reserva administrativa');
      return true;
    }
  };
}

module.exports = {
  activeAdminReservations,
  getCourseGuestReservationCount,
  getCourseOccupiedSeatCount,
  getCourseSeatsLeft,
  createAdminSeatReservationsHandler
};
