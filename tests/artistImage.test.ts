import assert from "node:assert/strict";
import test from "node:test";

import {
  getArtistImageFileName,
  getArtistImageOutputSize,
  getArtistImageStoragePath,
} from "../lib/artists/artistImage.ts";

test("아티스트 로고 파일명은 normalized_name 기준 WebP로 만든다", () => {
  assert.equal(getArtistImageFileName("jannabi"), "jannabi.webp");
  assert.throws(() => getArtistImageFileName("잔나비"));
});

test("아티스트 로고는 비율을 유지해 긴 변을 최대 800px로 줄인다", () => {
  assert.deepEqual(getArtistImageOutputSize(1600, 800), {
    width: 800,
    height: 400,
  });
  assert.deepEqual(getArtistImageOutputSize(150, 150), {
    width: 150,
    height: 150,
  });
});

test("Storage 로고만 관리 대상 경로로 판별한다", () => {
  assert.equal(
    getArtistImageStoragePath(
      "https://example.supabase.co/storage/v1/object/public/artist-images/jannabi.webp?v=1",
    ),
    "jannabi.webp",
  );
  assert.equal(getArtistImageStoragePath("/artists/jannabi.jpg"), null);
  assert.equal(getArtistImageStoragePath("https://example.com/jannabi.webp"), null);
});
