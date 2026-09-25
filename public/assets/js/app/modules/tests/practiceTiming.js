export function remainingSeconds(run, now = Date.now()) {
  return run?.deadline ? Math.max(0, Math.ceil((run.deadline - now) / 1000)) : null;
}

export function formatDuration(seconds) {
  if (seconds === null) return "Sin limite";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function correctionLabel(divisor) {
  return divisor ? `${divisor}/1 (cada fallo resta 1/${divisor})` : "Sin penalizacion";
}
