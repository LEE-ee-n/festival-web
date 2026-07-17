import assert from "node:assert/strict";
import test from "node:test";

import {
  FESTIVAL_THUMBNAIL_MAX_BYTES,
  validateFestivalThumbnailFile,
  validateFestivalThumbnailUrl,
} from "../lib/festivals/thumbnailValidation.ts";

test("SVG 썸네일 URL을 거부한다", () => {
  assert.throws(
    () => validateFestivalThumbnailUrl("https://example.com/image.svg"),
    /JPG, PNG 또는 WebP/,
  );
});

test("WebP 썸네일 URL을 허용한다", () => {
  assert.doesNotThrow(() =>
    validateFestivalThumbnailUrl(
      "https://example.com/calendar_empty.webp?version=2",
    ),
  );
});

test("SVG 내용을 PNG로 이름만 바꾼 파일을 거부한다", async () => {
  const fakePng = new File(["<svg></svg>"], "fake.png", {
    type: "image/png",
  });

  await assert.rejects(
    validateFestivalThumbnailFile(fakePng),
    /파일 내용이 올바른/,
  );
});

test("5MB를 초과한 썸네일을 거부한다", async () => {
  const oversizedJpeg = new File(
    [new Uint8Array(FESTIVAL_THUMBNAIL_MAX_BYTES + 1)],
    "large.jpg",
    { type: "image/jpeg" },
  );

  await assert.rejects(
    validateFestivalThumbnailFile(oversizedJpeg),
    /5MB 이하/,
  );
});
