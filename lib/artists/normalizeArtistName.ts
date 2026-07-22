import {
  isValidNormalizedName,
  NORMALIZED_NAME_PATTERN,
} from "../normalizedName.ts";
import { normalizeAsciiName } from "../../operations/discord-instagram-bot/src/nameNormalization.js";

export const ARTIST_NORMALIZED_NAME_PATTERN = NORMALIZED_NAME_PATTERN;

export const normalizeArtistName = normalizeAsciiName;

export const isValidArtistNormalizedName = isValidNormalizedName;
