export const NORMALIZED_NAME_PATTERN = /^[a-z0-9]+$/;

export function normalizeNormalizedName(value: string) {
  return value
    .toLowerCase()
    .replaceAll("&", "and")
    .replace(/[^a-z0-9]/g, "");
}

export function isValidNormalizedName(value: string) {
  return NORMALIZED_NAME_PATTERN.test(value);
}

export function findYearLikeSequence(value: string) {
  return value.match(/(?:19|20)\d{2}/)?.[0] ?? null;
}
