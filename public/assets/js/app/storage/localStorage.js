export function getCampusDraftStorageKey(groupId, accountId = "") {
  return `campus_draft_${encodeURIComponent(String(accountId || "").trim())}_${encodeURIComponent(String(groupId || "").trim())}`;
}

export function clearCampusDraft(groupId, accountId = "") {
  const normalizedGroupId = String(groupId || "").trim();
  if (!normalizedGroupId) {
    return;
  }

  try {
    sessionStorage.removeItem(getCampusDraftStorageKey(normalizedGroupId, accountId));
  } catch (error) {
  }
}
