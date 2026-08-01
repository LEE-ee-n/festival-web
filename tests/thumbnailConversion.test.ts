import assert from "node:assert/strict";
import test from "node:test";

import {
  FESTIVAL_THUMBNAIL_MAX_EDGE,
  FESTIVAL_THUMBNAIL_WEBP_QUALITY,
  getFestivalThumbnailOutputSize,
} from "../lib/festivals/thumbnailConversion.ts";

test("큰 가로 썸네일은 비율을 유지해 긴 변을 1600px로 줄인다", () => {
  assert.deepEqual(
    getFestivalThumbnailOutputSize(4000, 2000),
    { width: 1600, height: 800 },
  );
});

test("큰 세로 썸네일은 비율을 유지해 긴 변을 1600px로 줄인다", () => {
  assert.deepEqual(
    getFestivalThumbnailOutputSize(1500, 3000),
    { width: 800, height: 1600 },
  );
});

test("작은 썸네일은 확대하지 않는다", () => {
  assert.deepEqual(
    getFestivalThumbnailOutputSize(800, 1200),
    { width: 800, height: 1200 },
  );
});

test("썸네일 변환 기본값은 최대 1600px와 WebP 품질 85다", () => {
  assert.equal(FESTIVAL_THUMBNAIL_MAX_EDGE, 1600);
  assert.equal(FESTIVAL_THUMBNAIL_WEBP_QUALITY, 0.85);
});
