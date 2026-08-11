import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { resolveAdminMfaStep } from "../lib/auth/adminMfa.ts";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260811054600_enforce_admin_aal2.sql",
    import.meta.url,
  ),
  "utf8",
);

test("non-admin users are denied regardless of AAL", () => {
  assert.equal(
    resolveAdminMfaStep({
      hasAdminRole: false,
      currentLevel: "aal2",
      verifiedTotpFactorId: "factor-1",
    }),
    "denied",
  );
});

test("admin without a verified factor must enroll", () => {
  assert.equal(
    resolveAdminMfaStep({
      hasAdminRole: true,
      currentLevel: "aal1",
      verifiedTotpFactorId: null,
    }),
    "enroll",
  );
});

test("aal1 admin with a verified factor must complete a challenge", () => {
  assert.equal(
    resolveAdminMfaStep({
      hasAdminRole: true,
      currentLevel: "aal1",
      verifiedTotpFactorId: "factor-1",
    }),
    "challenge",
  );
});

test("aal2 admin is authorized", () => {
  assert.equal(
    resolveAdminMfaStep({
      hasAdminRole: true,
      currentLevel: "aal2",
      verifiedTotpFactorId: "factor-1",
    }),
    "authorized",
  );
});

test("is_admin requires both admin role and aal2", () => {
  assert.match(migration, /auth\.jwt\(\)\s*->>\s*'aal'/);
  assert.match(migration, /=\s*'aal2'/);
  assert.match(migration, /role\s*=\s*'admin'/);
  assert.match(migration, /set search_path = ''/);
});
