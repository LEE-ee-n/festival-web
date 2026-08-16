import assert from "node:assert/strict";
import test from "node:test";

import { filterFestivalMedia, getFeaturedFestivalMedia, nextFeaturedImageOrder } from "../lib/diaries/festivalMedia.ts";
import type { FestivalRecordMedia } from "../lib/diaries/festivalRecordTypes.ts";

function media(
  id: number,
  fileType: "image" | "video",
  featuredImageOrder: number | null = null,
  isFeaturedVideo = false,
): FestivalRecordMedia {
  return {
    id,
    recordPerformanceId: null,
    provider: "google_drive",
    externalFileId: `file-${id}`,
    externalFileName: `file-${id}`,
    mimeType: fileType === "image" ? "image/jpeg" : "video/mp4",
    fileSize: null,
    previewUrl: null,
    fileType,
    featuredImageOrder,
    isFeaturedVideo,
  };
}

test("featured festival media is ordered and limited to four images", () => {
  const items = [media(1, "image", 3), media(2, "image", 1), media(3, "video", null, true), media(4, "image")];
  const featured = getFeaturedFestivalMedia(items);

  assert.deepEqual(featured.images.map((item) => item.id), [2, 1]);
  assert.equal(featured.video?.id, 3);
});

test("media filters separate images and videos", () => {
  const items = [media(1, "image"), media(2, "video")];

  assert.deepEqual(filterFestivalMedia(items, "all"), items);
  assert.deepEqual(filterFestivalMedia(items, "image").map((item) => item.id), [1]);
  assert.deepEqual(filterFestivalMedia(items, "video").map((item) => item.id), [2]);
});

test("next featured image order finds an open slot and stops at four", () => {
  assert.equal(nextFeaturedImageOrder([media(1, "image", 1), media(2, "image", 3)]), 2);
  assert.equal(
    nextFeaturedImageOrder([
      media(1, "image", 1),
      media(2, "image", 2),
      media(3, "image", 3),
      media(4, "image", 4),
    ]),
    null,
  );
});
