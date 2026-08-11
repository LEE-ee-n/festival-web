export const ACCOUNT_DELETION_CONFIRMATION = "회원탈퇴";
export const ACCOUNT_DELETION_REAUTH_WINDOW_MS = 10 * 60 * 1000;

type AccountDeletionRequest = {
  confirmation: string;
};

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseAccountDeletionRequest(
  value: unknown,
): AccountDeletionRequest | null {
  if (!isStringRecord(value) || typeof value.confirmation !== "string") {
    return null;
  }

  return { confirmation: value.confirmation };
}

export function parseBearerAccessToken(header: string | null): string | null {
  if (!header) return null;

  const match = /^Bearer\s+([^\s]+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}

export function isRecentAccountSignIn(
  lastSignInAt: string | null | undefined,
  nowMs = Date.now(),
): boolean {
  if (!lastSignInAt) return false;

  const signedInAtMs = Date.parse(lastSignInAt);
  if (!Number.isFinite(signedInAtMs)) return false;

  const ageMs = nowMs - signedInAtMs;
  return ageMs >= 0 && ageMs <= ACCOUNT_DELETION_REAUTH_WINDOW_MS;
}
