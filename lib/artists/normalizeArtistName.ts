export const ARTIST_NORMALIZED_NAME_PATTERN = /^[a-z0-9]+$/;

export function normalizeArtistName(value: string) {
  return value
    .toLowerCase()
    .replaceAll("&", "and")
    .replace(/[^a-z0-9]/g, "");
}

export function isValidArtistNormalizedName(value: string) {
  return ARTIST_NORMALIZED_NAME_PATTERN.test(value);
}
