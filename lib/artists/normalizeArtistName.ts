import {
  isValidNormalizedName,
  NORMALIZED_NAME_PATTERN,
  normalizeNormalizedName,
} from "../normalizedName.ts";

export const ARTIST_NORMALIZED_NAME_PATTERN = NORMALIZED_NAME_PATTERN;

export const normalizeArtistName = normalizeNormalizedName;

export const isValidArtistNormalizedName = isValidNormalizedName;
