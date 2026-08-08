import assert from "node:assert/strict";
import test from "node:test";

import { normalizeAuthReturnPath } from "../lib/auth/authReturnPath.ts";

test("공개 상세 경로는 로그인 후 복귀 경로로 허용한다", () => {
  assert.equal(normalizeAuthReturnPath("/artist/1?from=calendar"), "/artist/1?from=calendar");
});

test("외부 URL과 관리자 경로는 로그인 복귀 경로로 거부한다", () => {
  assert.equal(normalizeAuthReturnPath("https://example.com"), null);
  assert.equal(normalizeAuthReturnPath("//example.com"), null);
  assert.equal(normalizeAuthReturnPath("/admin"), null);
  assert.equal(normalizeAuthReturnPath("/admin/artists"), null);
});
