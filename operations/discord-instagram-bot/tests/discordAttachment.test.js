import test from "node:test";
import assert from "node:assert/strict";

import { parseDiscordAttachmentRegistration } from "../src/discordAttachment.js";

const attachment = (overrides = {}) => ({
  id: "1",
  name: "poster.png",
  contentType: "image/png",
  url: "https://cdn.discordapp.com/attachments/1/2/poster.png",
  size: 1024,
  ...overrides,
});

test("신규등록으로 시작하고 이미지가 있으면 첨부 등록을 판정한다", () => {
  const result = parseDiscordAttachmentRegistration(
    "신규등록\n공식 포스터입니다.",
    [attachment()],
  );

  assert.equal(result.caption, "공식 포스터입니다.");
  assert.equal(result.images.length, 1);
  assert.equal(result.rejectedCount, 0);
});

test("신규등록 명령이 없으면 이미지가 있어도 작동하지 않는다", () => {
  assert.equal(parseDiscordAttachmentRegistration("공식 포스터", [attachment()]), null);
});

test("명령과 비슷한 단어는 신규등록으로 인식하지 않는다", () => {
  assert.equal(parseDiscordAttachmentRegistration("신규등록부탁", [attachment()]), null);
});

test("지원하지 않는 첨부는 이미지 목록에서 제외한다", () => {
  const result = parseDiscordAttachmentRegistration("신규등록", [
    attachment({ name: "guide.pdf", contentType: "application/pdf" }),
  ]);

  assert.equal(result.images.length, 0);
  assert.equal(result.rejectedCount, 1);
});

test("content type이 없으면 이미지 확장자로 판정한다", () => {
  const result = parseDiscordAttachmentRegistration("신규등록: 설명", [
    attachment({ name: "poster.GIF", contentType: null }),
  ]);

  assert.equal(result.caption, "설명");
  assert.equal(result.images.length, 1);
});
