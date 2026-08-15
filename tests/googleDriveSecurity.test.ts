import assert from "node:assert/strict";
import test from "node:test";
import { createDriveOAuthState, normalizeDriveReturnPath, parseDriveOAuthState } from "../lib/google-drive/oauthState.ts";
import { decryptDriveSecret, encryptDriveSecret } from "../lib/google-drive/tokenCipher.ts";

const key = Buffer.alloc(32, 7).toString("base64");

test("Google Drive refresh token is encrypted and restored", () => {
  const encrypted = encryptDriveSecret("refresh-token", key);
  assert.notEqual(encrypted, "refresh-token");
  assert.equal(decryptDriveSecret(encrypted, key), "refresh-token");
});

test("tampered encrypted Google Drive token is rejected", () => {
  const encrypted = encryptDriveSecret("refresh-token", key);
  const parts = encrypted.split(".");
  parts[3] = `${parts[3][0] === "A" ? "B" : "A"}${parts[3].slice(1)}`;
  assert.throws(() => decryptDriveSecret(parts.join("."), key));
});

test("OAuth state only accepts safe local return paths", () => {
  assert.equal(normalizeDriveReturnPath("/mypage/festival-records/1"), "/mypage/festival-records/1");
  assert.equal(normalizeDriveReturnPath("https://evil.example"), "/mypage");
  assert.equal(normalizeDriveReturnPath("//evil.example"), "/mypage");
});

test("OAuth state expires after ten minutes", () => {
  const now = Date.now();
  const state = createDriveOAuthState("user-id", "/mypage", key);
  assert.equal(parseDriveOAuthState(state, key, now).userId, "user-id");
  assert.throws(() => parseDriveOAuthState(state, key, now + 11 * 60 * 1000));
});
