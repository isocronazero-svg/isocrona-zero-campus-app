export const ROLE_PERMISSIONS = Object.freeze({
  admin: ["*"],
  member: ["join", "courses", "diplomas", "test"]
});

export const TEST_ACTION_PERMISSIONS = Object.freeze({
  admin: ["addQuestion", "generateTest", "evaluateTest"],
  member: ["generateTest", "evaluateTest"]
});

export function canAccessView(role, view) {
  const normalizedRole = String(role || "member").trim() || "member";
  const normalizedView = String(view || "").trim();
  const permissions = ROLE_PERMISSIONS[normalizedRole] || [];

  if (permissions.includes("*")) {
    return true;
  }

  return permissions.includes(normalizedView);
}

export function canPerformTestAction(role, action) {
  const normalizedRole = String(role || "member").trim() || "member";
  const normalizedAction = String(action || "").trim();
  const permissions = TEST_ACTION_PERMISSIONS[normalizedRole] || [];

  if (permissions.includes("*")) {
    return true;
  }

  return permissions.includes(normalizedAction);
}

export default ROLE_PERMISSIONS;
