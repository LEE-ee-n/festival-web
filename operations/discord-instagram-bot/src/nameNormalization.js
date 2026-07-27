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

export function formatFestivalDisplayName(value, startDate) {
  const name = String(value ?? "").trim();
  const dateMatch = String(startDate ?? "")
    .trim()
    .match(/^(20\d{2})-\d{2}-\d{2}$/);

  if (!name || !dateMatch) return name;

  const baseName = name
    .replace(/^20\d{2}\s+/, "")
    .trim();

  return baseName ? `${dateMatch[1]} ${baseName}` : name;
}
