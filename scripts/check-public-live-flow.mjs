import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { createPublicLiveFlow, answerDistribution } = createRequire(import.meta.url)("../server/public-live-flow.js");
let now = Date.now();
const flow = createPublicLiveFlow(() => now);
const room = { id: "qa", status: "active", autoAdvance: true, questionIds: ["q1", "q2"],
  currentQuestionIndex: 0, questionTimeLimitSeconds: 120, questionStartedAt: new Date(now).toISOString(),
  participants: [{ id: "one", joinedAt: new Date(now).toISOString() }, { id: "two", joinedAt: new Date(now).toISOString() }],
  participantAnswers: { one: { q1: { answerIndex: 0 } } } };
flow.touch(room, "one"); flow.touch(room, "two");
assert.deepEqual(flow.progress(room), { activeCount: 2, answeredCount: 1 });
assert.equal(flow.advance(room), false);
room.participantAnswers.one.q1.answerIndex = 1;
room.participantAnswers.two = { q1: { answerIndex: 0 } };
assert.equal(flow.advance(room), true);
assert.equal(room.questionClosed, true);
assert.deepEqual(answerDistribution(room, 3), [1, 1, 0]);
assert.equal(flow.advance(room), false);
now += 5999;
assert.equal(flow.advance(room), false);
now++;
assert.equal(flow.advance(room), true);
assert.equal(room.currentQuestionIndex, 1);
assert.equal(room.questionClosed, false);
now += 120_000;
assert.equal(flow.advance(room), true, "Timer closes even without answers");
const restored = JSON.parse(JSON.stringify(room));
const restarted = createPublicLiveFlow(() => now);
now += 6000;
assert.equal(restarted.advance(restored), true);
assert.equal(restored.status, "finished", "Persisted transition survives restart");
assert.equal(restarted.advance(restored), false);

const disconnected = { ...room, status: "active", currentQuestionIndex: 0, questionClosed: false,
  nextQuestionAt: "", questionStartedAt: new Date(now).toISOString(), participantAnswers: { one: { q1: { answerIndex: 0 } } } };
const presence = createPublicLiveFlow(() => now);
now += 31000;
assert.equal(presence.advance(disconnected), false, "Zero active participants never close early");
presence.touch(disconnected, "one");
assert.deepEqual(presence.progress(disconnected), { activeCount: 1, answeredCount: 1 });
assert.equal(presence.advance(disconnected), true, "Disconnected participant does not hold room open");
assert.equal(presence.advance({ ...disconnected, autoAdvance: false }), false, "Existing rooms remain manual");
console.log("Public live automatic flow checks passed.");
