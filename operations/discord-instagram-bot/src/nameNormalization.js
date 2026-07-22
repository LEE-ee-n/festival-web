export const NORMALIZED_NAME_PATTERN = /^[a-z0-9]+$/;

export function normalizeAsciiName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replaceAll("&", "and")
    .replace(/[^a-z0-9]/g, "");
}

export function normalizeFestivalName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replaceAll("&", "and")
    .replace(/20\d{2}/g, "")
    .replace(/festival/g, "")
    .replace(/[^a-z0-9]/g, "");
}
