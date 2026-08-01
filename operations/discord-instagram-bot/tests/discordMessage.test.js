import test from "node:test";
import assert from "node:assert/strict";

import {
  formatDiscordError,
  getErrorMessage,
  truncateDiscordContent,
} from "../src/discordMessage.js";

test("짧은 Discord 메시지는 그대로 유지한다", () => {
  assert.equal(truncateDiscordContent("처리 완료"), "처리 완료");
});

test("긴 Discord 오류 메시지는 안전한 길이로 줄인다", () => {
  const content = formatDiscordError("처리 실패", new Error("오류".repeat(2000)));

  assert.ok(content.length <= 1900);
  assert.match(content, /^처리 실패: 오류/);
  assert.match(content, /…\(내용 생략\)$/);
});

test("Error가 아닌 오류 값도 문자열로 변환한다", () => {
  assert.equal(getErrorMessage("연결 실패"), "연결 실패");
});
