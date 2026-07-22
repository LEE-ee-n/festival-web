import {
  NORMALIZED_NAME_PATTERN,
  normalizeFestivalName,
} from "../operations/discord-instagram-bot/src/nameNormalization.js";

export { NORMALIZED_NAME_PATTERN };
export const normalizeNormalizedName = normalizeFestivalName;

export function isValidNormalizedName(value: string) {
  return NORMALIZED_NAME_PATTERN.test(value);
}

export function findYearLikeSequence(value: string) {
  return value.match(/(?:19|20)\d{2}/)?.[0] ?? null;
}
