export {
  createFestivalIdentityKey,
  findExactFestivalIdentityMatch,
  isCompleteFestivalIdentity,
} from "../../operations/discord-instagram-bot/src/festivalIdentity.js";
export type {
  FestivalIdentity,
  FestivalIdentityMatch,
} from "../../operations/discord-instagram-bot/src/festivalIdentity.js";

const MINUTE_TIME_PATTERN = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;

export function normalizeMinuteTime(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return "";

  const match = text.match(MINUTE_TIME_PATTERN);
  if (!match) return "";

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return "";

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function isSameMinuteTime(left: unknown, right: unknown) {
  return normalizeMinuteTime(left) === normalizeMinuteTime(right);
}

function hasIncomingValue(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true;
}

export function mergeWithoutBlankOverwrite<T extends Record<string, unknown>>(
  existing: T,
  incoming: { [K in keyof T]?: T[K] | null | undefined },
): T {
  const merged = { ...existing };

  for (const [key, value] of Object.entries(incoming)) {
    if (hasIncomingValue(value)) {
      merged[key as keyof T] = value as T[keyof T];
    }
  }

  return merged;
}
