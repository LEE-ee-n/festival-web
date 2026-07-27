import assert from "node:assert/strict";
import test from "node:test";

import { getSupabaseErrorMessage } from "../lib/supabase/errorMessage.ts";

test("Supabase 오류 객체의 상세 내용을 표시한다", () => {
  assert.equal(
    getSupabaseErrorMessage(
      {
        message: "삭제할 수 없습니다.",
        details: "승인 이력이 잠겨 있습니다.",
        hint: "연결 상태를 확인하세요.",
        code: "55000",
      },
      "삭제 실패",
    ),
    "삭제할 수 없습니다. / 승인 이력이 잠겨 있습니다. / 연결 상태를 확인하세요. / 55000",
  );
});

test("일반 Error와 알 수 없는 값에 대응한다", () => {
  assert.equal(
    getSupabaseErrorMessage(new Error("네트워크 오류"), "실패"),
    "네트워크 오류",
  );
  assert.equal(getSupabaseErrorMessage(null, "실패"), "실패");
});
