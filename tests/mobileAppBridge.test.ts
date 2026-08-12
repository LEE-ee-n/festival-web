import assert from "node:assert/strict";
import test from "node:test";

import {
  isFestibomApp,
  parseMobileBridgeMessage,
} from "../lib/mobile/appBridge.ts";

test("mobile bridge accepts only a valid Google auth request", () => {
  assert.deepEqual(
    parseMobileBridgeMessage(JSON.stringify({
      type: "auth:start",
      payload: { url: "https://example.supabase.co/auth/v1/authorize", returnPath: "/festival/97" },
    })),
    {
      type: "auth:start",
      payload: { url: "https://example.supabase.co/auth/v1/authorize", returnPath: "/festival/97" },
    },
  );
  assert.equal(parseMobileBridgeMessage(JSON.stringify({
    type: "auth:start",
    payload: { url: "javascript:alert(1)", returnPath: "//evil.example" },
  })), null);
});
test("mobile bridge rejects unknown messages and unsafe exported files", () => {
  assert.equal(parseMobileBridgeMessage("not-json"), null);
  assert.equal(parseMobileBridgeMessage(JSON.stringify({ type: "admin:open", payload: {} })), null);
  assert.equal(parseMobileBridgeMessage(JSON.stringify({
    type: "image:export",
    payload: { filename: "../secret.png", mimeType: "image/png", base64: "abc" },
  })), null);
});

test("mobile bridge validates app-ready push tokens", () => {
  assert.ok(parseMobileBridgeMessage(JSON.stringify({
    type: "app:ready",
    payload: { platform: "android", version: "0.1.0", expoPushToken: "ExpoPushToken[test-token]" },
  })));
  assert.equal(parseMobileBridgeMessage(JSON.stringify({
    type: "app:ready",
    payload: { platform: "android", version: "0.1.0", expoPushToken: "invalid" },
  })), null);
  assert.equal(isFestibomApp("Mozilla/5.0 FestibomApp/0.1.0"), true);
  assert.equal(isFestibomApp("Mozilla/5.0 Chrome"), false);
});
