import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createOnboardingStateAccess } = require("../server/onboarding-state.js");

let stored = {
  associates: [{ id: "s1", firstName: "Ana", lastName: "Prueba", v13Preferences: { shirtSize: "M", diplomaLanguage: "es" } }],
  members: [], accounts: [], courses: [], associateApplications: [], emailOutbox: [],
  settings: { smtp: {} }
};
const access = createOnboardingStateAccess({
  readState: () => structuredClone(stored),
  writeState: state => { stored = structuredClone(state); }
});
const stale = access.readState();
const updated = access.readState();
updated.associates[0].v13Preferences = { shirtSize: "L", diplomaLanguage: "es-va" };
access.writeState(updated);
stale.settings.otherSetting = "unrelated update";
access.writeState(stale);
assert.equal(stored.associates[0].v13Preferences.shirtSize, "L");
assert.equal(stored.associates[0].v13Preferences.diplomaLanguage, "es-va");

const first = access.readState();
const second = access.readState();
first.associates[0].v13Preferences.shirtCut = "unisex";
access.writeState(first);
second.associates[0].v13Preferences.sex = "prefiero-no-indicar";
access.writeState(second);
assert.equal(stored.associates[0].v13Preferences.shirtCut, "unisex");
assert.equal(stored.associates[0].v13Preferences.sex, "prefiero-no-indicar");
// Importing or saving an untouched legacy member must not add empty V1.3 metadata.
stored.associates.push({ id: "s2", firstName: "Socio", lastName: "Antiguo" });
const legacy = access.readState();
legacy.settings.legacyImport = true;
access.writeState(legacy);
assert.equal(Object.hasOwn(stored.associates.find(a => a.id === "s2"), "v13Preferences"), false);
console.log("V1.3 preferencias: concurrencia y fichas antiguas conservadas");
