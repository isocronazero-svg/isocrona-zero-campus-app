export function getCampusDraftStorageKey(groupId) {
  return `campus_draft_${String(groupId || "").trim()}`;
}

export function clearCampusDraft(groupId) {
  const normalizedGroupId = String(groupId || "").trim();
  if (!normalizedGroupId) {
    return;
  }

  try {
    sessionStorage.removeItem(getCampusDraftStorageKey(normalizedGroupId));
  } catch (error) {
  }
}
