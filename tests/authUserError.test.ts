import assert from "node:assert/strict";
import test from "node:test";

import {
  isDeletedAuthUserError,
  recoverDeletedAuthUser,
} from "../lib/auth/authUserError.ts";

test("deleted auth users are detected by error code", () => {
  assert.equal(
    isDeletedAuthUserError({
      code: "user_not_found",
      message: "User from sub claim in JWT does not exist",
    }),
    true,
  );
});

test("legacy deleted-user messages are detected without an error code", () => {
  assert.equal(
    isDeletedAuthUserError({
      message: "User from sub claim in JWT does not exist",
    }),
    true,
  );
});

test("unrelated authentication errors are not treated as deleted users", () => {
  assert.equal(
    isDeletedAuthUserError({
      code: "over_request_rate_limit",
      message: "Too many requests",
    }),
    false,
  );
  assert.equal(isDeletedAuthUserError(null), false);
});

test("deleted users clear the local session before redirecting home", async () => {
  const actions: string[] = [];
  const recovered = await recoverDeletedAuthUser({
    error: { code: "user_not_found" },
    currentPath: "/mypage",
    clearLocalSession: async () => {
      actions.push("clear-session");
    },
    redirectHome: () => {
      actions.push("redirect-home");
    },
  });

  assert.equal(recovered, true);
  assert.deepEqual(actions, ["clear-session", "redirect-home"]);
});

test("deleted users already on home only clear the local session", async () => {
  const actions: string[] = [];
  const recovered = await recoverDeletedAuthUser({
    error: { code: "user_not_found" },
    currentPath: "/",
    clearLocalSession: async () => {
      actions.push("clear-session");
    },
    redirectHome: () => {
      actions.push("redirect-home");
    },
  });

  assert.equal(recovered, true);
  assert.deepEqual(actions, ["clear-session"]);
});

test("unrelated errors do not clear sessions or redirect", async () => {
  const actions: string[] = [];
  const recovered = await recoverDeletedAuthUser({
    error: { code: "over_request_rate_limit" },
    currentPath: "/mypage",
    clearLocalSession: async () => {
      actions.push("clear-session");
    },
    redirectHome: () => {
      actions.push("redirect-home");
    },
  });

  assert.equal(recovered, false);
  assert.deepEqual(actions, []);
});
