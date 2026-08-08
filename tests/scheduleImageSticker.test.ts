import assert from "node:assert/strict";
import test from "node:test";

import {
  clampStickerSize,
  createRockCatSticker,
  SCHEDULE_IMAGE_STICKER_SIZE,
} from "../lib/schedule/scheduleImageSticker.ts";

test("롹옹이 스티커는 이미지 중앙에 기본 크기로 생성된다", () => {
  const sticker = createRockCatSticker("sticker-1");

  assert.equal(sticker.id, "sticker-1");
  assert.equal(sticker.source, "/stickers/rock-cat.png");
  assert.equal(sticker.x, 540);
  assert.equal(sticker.y, 960);
  assert.equal(sticker.size, SCHEDULE_IMAGE_STICKER_SIZE.default);
  assert.equal(sticker.rotation, 0);
});

test("스티커 크기는 허용 범위 안으로 제한된다", () => {
  assert.equal(clampStickerSize(10), SCHEDULE_IMAGE_STICKER_SIZE.min);
  assert.equal(clampStickerSize(300), 300);
  assert.equal(clampStickerSize(900), SCHEDULE_IMAGE_STICKER_SIZE.max);
});
