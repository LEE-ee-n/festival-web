import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  ACCOUNT_DELETION_CONFIRMATION,
  ACCOUNT_DELETION_REAUTH_WINDOW_MS,
  isRecentAccountSignIn,
  parseAccountDeletionRequest,
  parseBearerAccessToken,
} from "../lib/auth/accountDeletion.ts";

const routeSource = readFileSync(
  new URL("../app/api/account/delete/route.ts", import.meta.url),
  "utf8",
);
const adminSource = readFileSync(
  new URL("../lib/supabase/admin.ts", import.meta.url),
  "utf8",
);
const loginSource = readFileSync(
  new URL("../app/login/page.tsx", import.meta.url),
  "utf8",
);

test("account deletion request accepts only a string confirmation", () => {
  assert.deepEqual(parseAccountDeletionRequest({ confirmation: "회원탈퇴" }), {
    confirmation: "회원탈퇴",
  });
  assert.equal(parseAccountDeletionRequest(null), null);
  assert.equal(parseAccountDeletionRequest({ confirmation: 1 }), null);
});

test("bearer parser rejects malformed authorization headers", () => {
  assert.equal(parseBearerAccessToken("Bearer access-token"), "access-token");
  assert.equal(parseBearerAccessToken("bearer access-token"), "access-token");
  assert.equal(parseBearerAccessToken("Basic access-token"), null);
  assert.equal(parseBearerAccessToken("Bearer token extra"), null);
});

test("recent sign-in is limited to ten minutes and rejects future timestamps", () => {
  const now = Date.parse("2026-08-11T12:00:00.000Z");
  assert.equal(
    isRecentAccountSignIn(
      new Date(now - ACCOUNT_DELETION_REAUTH_WINDOW_MS).toISOString(),
      now,
    ),
    true,
  );
  assert.equal(
    isRecentAccountSignIn(
      new Date(now - ACCOUNT_DELETION_REAUTH_WINDOW_MS - 1).toISOString(),
      now,
    ),
    false,
  );
  assert.equal(
    isRecentAccountSignIn(new Date(now + 1).toISOString(), now),
    false,
  );
});

test("server route restricts deletion to regular users and revokes sessions", () => {
  assert.match(routeSource, /profile\?\.role !== "user"/);
  assert.doesNotMatch(routeSource, /schema\("storage"\)/);
  assert.match(routeSource, /auth\.admin\.signOut/);
  assert.match(routeSource, /auth\.admin\.deleteUser\(user\.id\)/);
  assert.match(routeSource, new RegExp(ACCOUNT_DELETION_CONFIRMATION));
});

test("admin key stays server-only and reauthentication forces Google login", () => {
  assert.match(adminSource, /import "server-only"/);
  assert.match(adminSource, /SUPABASE_SECRET_KEY/);
  assert.doesNotMatch(adminSource, /NEXT_PUBLIC_SUPABASE_(SECRET|SERVICE)/);
  assert.match(loginSource, /prompt: "login"/);
});
