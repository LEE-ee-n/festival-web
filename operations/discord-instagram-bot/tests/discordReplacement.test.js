import test from "node:test";
import assert from "node:assert/strict";

import {
  canReplaceDiscordSourceDraft,
  createSourceReplacementButtonId,
  parseSourceReplacementButtonId,
} from "../src/discordReplacement.js";

test("pending 임시 작업만 있으면 교체할 수 있다", () => {
  assert.equal(canReplaceDiscordSourceDraft(
    [{ id: 1, status: "pending" }],
    [{ id: 2, status: "pending" }],
  ), true);
});

test("승인 또는 완료 이력이 하나라도 있으면 교체할 수 없다", () => {
  assert.equal(canReplaceDiscordSourceDraft(
    [{ id: 1, status: "approved" }],
    [{ id: 2, status: "pending" }],
  ), false);
  assert.equal(canReplaceDiscordSourceDraft([], [{ id: 3, status: "finalized" }]), false);
});

test("중복 작업이 없으면 교체 버튼을 표시하지 않는다", () => {
  assert.equal(canReplaceDiscordSourceDraft([], []), false);
});

test("교체 버튼 ID에 Discord 원본 메시지 ID를 안전하게 보존한다", () => {
  const customId = createSourceReplacementButtonId("123456789012345678");
  assert.equal(customId, "source-replace:123456789012345678");
  assert.equal(parseSourceReplacementButtonId(customId), "123456789012345678");
});

test("다른 버튼과 잘못된 메시지 ID는 거부한다", () => {
  assert.equal(parseSourceReplacementButtonId("db-retry:123456789012345678"), null);
  assert.equal(parseSourceReplacementButtonId("source-replace:not-a-message"), null);
  assert.throws(() => createSourceReplacementButtonId("123"));
});
