function cleanId(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function getInstructorAssociateName(associate) {
  return [associate?.firstName, associate?.lastName]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ");
}

export function getInstructorAssociateLabel(associate) {
  const name = getInstructorAssociateName(associate);
  const number = Number(associate?.associateNumber || 0);
  return number > 0 ? `${name} · Socio nº ${number}` : name;
}

export function normalizeInstructorSelection(ids = []) {
  const result = [];
  const seen = new Set();
  for (const rawId of Array.isArray(ids) ? ids : []) {
    const id = cleanId(rawId);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

export function buildInstructorPickerModel(associates = [], selectedIds = []) {
  const selected = normalizeInstructorSelection(selectedIds);
  const byId = new Map((Array.isArray(associates) ? associates : []).map((associate) => [associate.id, associate]));
  const selectedItems = selected
    .map((id) => {
      const associate = byId.get(id);
      if (!associate) {
        return { id, associate: null, label: id, historicalUnavailable: true, missing: true };
      }
      const label = getInstructorAssociateLabel(associate) || id;
      return {
        id,
        associate,
        label,
        historicalUnavailable: associate.instructorEnabled !== true || !getInstructorAssociateName(associate),
        missing: false
      };
    });
  const selectedSet = new Set(selected);
  const options = (Array.isArray(associates) ? associates : [])
    .filter((associate) =>
      associate &&
      cleanId(associate.id) &&
      associate.instructorEnabled === true &&
      Boolean(getInstructorAssociateName(associate)) &&
      !selectedSet.has(associate.id)
    )
    .map((associate) => ({
      id: associate.id,
      associate,
      label: getInstructorAssociateLabel(associate)
    }));
  return { selectedIds: selected, selectedItems, options };
}

export function addInstructorSelection(associates = [], selectedIds = [], associateId = "") {
  const id = cleanId(associateId);
  const current = normalizeInstructorSelection(selectedIds);
  if (!id || current.includes(id)) return current;
  const associate = (Array.isArray(associates) ? associates : []).find((item) => item?.id === id);
  if (!associate || associate.instructorEnabled !== true || !getInstructorAssociateName(associate)) {
    return current;
  }
  return [...current, id];
}

export function removeInstructorSelection(selectedIds = [], associateId = "") {
  const id = cleanId(associateId);
  return normalizeInstructorSelection(selectedIds).filter((item) => item !== id);
}
