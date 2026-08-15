import { randomBytes } from "node:crypto";
import { decryptDriveSecret, encryptDriveSecret } from "./tokenCipher.ts";

const STATE_MAX_AGE_MS = 10 * 60 * 1000;
type OAuthStatePayload = { nonce: string; userId: string; returnTo: string; issuedAt: number };

export function normalizeDriveReturnPath(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/mypage";
}

export function createDriveOAuthState(userId: string, returnTo: string, encodedKey: string): string {
  return encryptDriveSecret(JSON.stringify({
    nonce: randomBytes(16).toString("base64url"), userId,
    returnTo: normalizeDriveReturnPath(returnTo), issuedAt: Date.now(),
  } satisfies OAuthStatePayload), encodedKey);
}

export function parseDriveOAuthState(state: string, encodedKey: string, now = Date.now()): OAuthStatePayload {
  const parsed = JSON.parse(decryptDriveSecret(state, encodedKey)) as Partial<OAuthStatePayload>;
  if (typeof parsed.nonce !== "string" || typeof parsed.userId !== "string" || typeof parsed.returnTo !== "string" || typeof parsed.issuedAt !== "number" || parsed.issuedAt > now + 60_000 || now - parsed.issuedAt > STATE_MAX_AGE_MS) {
    throw new Error("Invalid or expired Google Drive OAuth state.");
  }
  return parsed as OAuthStatePayload;
}
