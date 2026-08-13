import assert from "node:assert/strict";
import test from "node:test";

import {
  sanitizeSentryBreadcrumb,
  sanitizeSentryEvent,
} from "../lib/monitoring/sentryPrivacy.ts";

test("Sentry event에서 개인정보와 입력 데이터를 제거한다", () => {
  const event = sanitizeSentryEvent({
    user: { id: "user-id", email: "user@example.com" },
    extra: { diary: "개인 일기 내용" },
    request: {
      url: "https://festibom.com/mypage?record=secret#memo",
      method: "POST",
      data: { memo: "개인 기록" },
      cookies: { session: "secret" },
      headers: { authorization: "Bearer secret" },
      query_string: "record=secret",
    },
    logentry: { message: "save failed", params: ["개인 기록"] },
    message: "사용자가 입력한 내용",
    exception: {
      values: [{ type: "DatabaseError", value: "개인 기록이 너무 깁니다" }],
    },
  });

  assert.equal(event.user, undefined);
  assert.equal(event.extra, undefined);
  assert.deepEqual(event.request, {
    method: "POST",
    url: "https://festibom.com/mypage",
  });
  assert.equal(event.message, undefined);
  assert.equal(event.logentry, undefined);
  assert.equal(event.exception?.values?.[0]?.type, "DatabaseError");
  assert.equal(event.exception?.values?.[0]?.value, undefined);
});

test("일반 breadcrumb 메시지는 입력 내용일 수 있어 제거한다", () => {
  assert.deepEqual(
    sanitizeSentryBreadcrumb({
      category: "http",
      message: "사용자가 입력한 내용",
      data: { url: "https://festibom.com/mypage?secret=1" },
    }),
    {
      category: "http",
      message: undefined,
      data: undefined,
    },
  );
});

test("콘솔과 입력 breadcrumb는 전송하지 않는다", () => {
  assert.equal(
    sanitizeSentryBreadcrumb({ category: "console", message: "secret" }),
    null,
  );
  assert.equal(
    sanitizeSentryBreadcrumb({ category: "ui.input", message: "secret" }),
    null,
  );
});

test("허용한 breadcrumb에서도 URL 상세정보와 data를 제거한다", () => {
  assert.deepEqual(
    sanitizeSentryBreadcrumb({
      category: "navigation",
      message: "https://festibom.com/artist/1?token=secret",
      data: { from: "/login", to: "/mypage?secret=1" },
    }),
    {
      category: "navigation",
      message: "https://festibom.com/artist/1",
      data: undefined,
    },
  );
});
