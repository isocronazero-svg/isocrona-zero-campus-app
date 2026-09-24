import assert from "node:assert/strict";
import { generateTest } from "../public/assets/js/app/modules/tests/testService.js";
import { renderTopicPicker, matchesTopics } from "../public/assets/js/app/modules/tests/topicPicker.js";
const questions = [
  { id: "a", part: "IVASPE", category: "Incendios", difficulty: "media" },
  { id: "b", part: "IVASPE", category: "Rescate", difficulty: "facil" },
  { id: "c", part: "GUADALAJARA", category: "Incendios", difficulty: "media" },
  { id: "d", part: "TEMARIO COMÚN", category: "Constitución", difficulty: "media" }
];
const topics = [{ part: "IVASPE", category: "Rescate" }, { part: "GUADALAJARA", category: "Incendios" }];
const run = generateTest({ questions, numQuestions: 100, filters: { topics } });
assert.deepEqual(run.questions.map(q => q.id).sort(), ["b", "c"]);
assert.deepEqual(run.filters.topics, topics);
assert.equal(matchesTopics(questions[0], topics), false, "Mismo nombre de tema en distinto temario no se mezcla");
assert.throws(() => generateTest({ questions, filters: { topics: [] } }), /No hay preguntas/);
assert.equal(generateTest({ questions, filters: { topics: null }, numQuestions: 100 }).questions.length, 4);
assert.deepEqual(generateTest({ questions, filters: { topics, difficulty: "facil" } }).questions.map(q => q.id), ["b"]);
const markup = renderTopicPicker([...questions, { part: "IVASPE", category: "<script>" }], topics);
assert.ok(markup.includes("&lt;script&gt;"));
for (const part of ["IVASPE", "TEMARIO COMÚN", "GUADALAJARA"]) assert.ok(markup.includes(part));
assert.equal((renderTopicPicker([], []).match(/data-topic-all[^>]*disabled/g) || []).length, 3);
console.log("Multi-topic selection passed: combined blocks, isolated categories, empty selection, difficulty and escaped labels.");
