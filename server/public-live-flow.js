const ACTIVE_MS = 30_000;
const REVEAL_MS = 6_000;

// Presence is ephemeral; answers, scores and phase deadlines remain in persisted state.
function createPublicLiveFlow(now = Date.now) {
  const bootAt = now();
  const seen = new Map();
  let sweptAt = bootAt;
  const key = (session, participant) => `${session.id}:${participant.id}`;
  function touch(session, participantId) {
    const time = now();
    if (time - sweptAt >= ACTIVE_MS) {
      for (const [id, lastSeen] of seen) if (time - lastSeen >= ACTIVE_MS) seen.delete(id);
      sweptAt = time;
    }
    const participant = (session.participants || []).find(p => p.id === participantId);
    if (participant) seen.set(key(session, participant), time);
  }
  function progress(session) {
    const time = now();
    const questionId = session.questionIds?.[session.currentQuestionIndex];
    const active = (session.participants || []).filter(p => {
      const lastSeen = seen.get(key(session, p)) ?? Math.max(Date.parse(p.joinedAt) || 0, bootAt);
      return time - lastSeen < ACTIVE_MS;
    });
    return {
      activeCount: active.length,
      answeredCount: active.filter(p => session.participantAnswers?.[p.id]?.[questionId]).length
    };
  }
  function advance(session) {
    if (session.autoAdvance !== true || session.status !== "active" || !Number.isInteger(session.currentQuestionIndex)) return false;
    const time = now();
    if (!session.questionClosed) {
      const { activeCount, answeredCount } = progress(session);
      const deadline = Date.parse(session.questionStartedAt) + Number(session.questionTimeLimitSeconds || 20) * 1000;
      if (!(Number.isFinite(deadline) && time >= deadline) && !(activeCount > 0 && answeredCount === activeCount)) return false;
      session.questionClosed = true;
      session.questionClosedAt = new Date(time).toISOString();
      session.nextQuestionAt = new Date(time + REVEAL_MS).toISOString();
      return true;
    }
    // Manual reveal remains compatible with automatic rooms.
    if (!session.nextQuestionAt) {
      session.nextQuestionAt = new Date(time + REVEAL_MS).toISOString();
      return true;
    }
    if (time < Date.parse(session.nextQuestionAt)) return false;
    session.nextQuestionAt = "";
    if (session.currentQuestionIndex >= session.questionIds.length - 1) {
      session.status = "finished";
      session.finishedAt = new Date(time).toISOString();
    } else {
      session.currentQuestionIndex++;
      session.questionClosed = false;
      session.questionClosedAt = "";
      session.questionStartedAt = new Date(time).toISOString();
    }
    return true;
  }
  return { touch, progress, advance };
}

function answerDistribution(session, optionCount) {
  const counts = Array.from({ length: optionCount }, () => 0);
  const questionId = session.questionIds?.[session.currentQuestionIndex];
  for (const participant of session.participants || []) {
    const index = session.participantAnswers?.[participant.id]?.[questionId]?.answerIndex;
    if (Number.isInteger(index) && index >= 0 && index < counts.length) counts[index]++;
  }
  return counts;
}

module.exports = { createPublicLiveFlow, answerDistribution };
