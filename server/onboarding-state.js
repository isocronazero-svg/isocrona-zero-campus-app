// Protect only onboarding-owned access/delivery fields from async stale writers.
// Unrelated application state keeps the existing storage behavior.
const associateFields = ["firstName", "lastName", "email", "status", "observations", "linkedMemberId", "linkedAccountId", "campusAccessStatus",
  "temporaryPassword", "campusOnboardingCreatedAt", "welcomeEmailStatus", "welcomeEmailSentAt", "welcomeEmailError"];
const memberFields = ["id", "associateId", "email", "name", "source"];

function capture(state) {
  const associates = (state.associates || []).filter(item => item.campusOnboardingCreatedAt);
  return {
    smtp: structuredClone(state.settings?.smtp),
    associates: new Map(associates.map(item => [item.id, structuredClone(item)])),
    members: new Map((state.members || []).filter(item => associates.some(a => a.linkedMemberId === item.id)).map(item => [item.id, structuredClone(item)])),
    accounts: new Map((state.accounts || []).filter(item => associates.some(a => a.linkedAccountId === item.id)).map(item => [item.id, structuredClone(item)])),
    emailOutbox: new Map((state.emailOutbox || []).filter(item => item.kind === "associate_welcome").map(item => [item.id, structuredClone(item)]))
  };
}

function mergeConcurrentAccessChanges(state, baseline, current) {
  if (baseline && JSON.stringify(baseline.smtp) !== JSON.stringify(current.smtp)) {
    state.settings = { ...(state.settings || {}), smtp: structuredClone(current.smtp) };
  }
  for (const collection of ["associates", "members", "accounts", "emailOutbox"]) {
    const previous = baseline?.[collection] || new Map();
    const latest = current[collection];
    const rows = new Map((state[collection] || []).map(item => [item.id, item]));
    for (const [id, record] of latest) {
      const before = previous.get(id);
      const fields = collection === "associates" ? associateFields : collection === "members" ? memberFields :
        [...new Set([...Object.keys(before || {}), ...Object.keys(record)])];
      if (!before) {
        const incoming = rows.get(id);
        if (incoming && ["associates", "members"].includes(collection)) {
          for (const key of fields) incoming[key] = record[key];
        } else rows.set(id, structuredClone(record));
        continue;
      }
      const changed = fields.filter(key => JSON.stringify(before[key]) !== JSON.stringify(record[key]));
      if (!changed.length) continue;
      if (!rows.has(id)) rows.set(id, structuredClone(record));
      else for (const key of changed) rows.get(id)[key] = record[key];
    }
    // A deliberate deletion after the reader's snapshot must not be resurrected.
    for (const id of previous.keys()) if (!latest.has(id)) rows.delete(id);
    state[collection] = [...rows.values()];
  }
  return state;
}

function createOnboardingStateAccess(storage) {
  const snapshots = new WeakMap();
  return {
    readState() {
      const state = storage.readState();
      snapshots.set(state, capture(state));
      return state;
    },
    writeState(state) {
      const latest = capture(storage.readState());
      mergeConcurrentAccessChanges(state, snapshots.get(state), latest);
      storage.writeState(state);
      snapshots.set(state, capture(state));
    }
  };
}

module.exports = { createOnboardingStateAccess };
