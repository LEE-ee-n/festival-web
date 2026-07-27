import assert from "node:assert/strict";
import test from "node:test";

import {
  findFestivalThumbnailMatches,
  getFestivalThumbnailFileName,
} from "../lib/festivals/festivalThumbnailSync.ts";

test("대표 이미지 파일명은 normalized_name과 축제 기간으로 만든다", () => {
  assert.equal(
    getFestivalThumbnailFileName({
      normalized_name: "zandarifesta",
      start_date: "2024-10-03",
      end_date: "2024-10-05",
    }),
    "zandarifesta2024100320241005.webp",
  );
});

test("대표 이미지가 비어 있고 파일명이 정확히 일치할 때만 연결한다", () => {
  const result = findFestivalThumbnailMatches(
    [
      {
        id: 1,
        normalized_name: "zandarifesta",
        start_date: "2024-10-03",
        end_date: "2024-10-05",
        thumbnail_url: null,
      },
      {
        id: 2,
        normalized_name: "existing",
        start_date: "2026-01-01",
        end_date: "2026-01-02",
        thumbnail_url: "https://example.com/manual.webp",
      },
    ],
    [
      "zandarifesta2024100320241005.webp",
      "existing2026010120260102.webp",
    ],
  );

  assert.deepEqual(
    result.matched.map(({ festival, fileName }) => ({
      festivalId: festival.id,
      fileName,
    })),
    [
      {
        festivalId: 1,
        fileName: "zandarifesta2024100320241005.webp",
      },
    ],
  );
});

test("동일 키 축제가 여러 개면 자동 연결하지 않는다", () => {
  const festivals = [1, 2].map((id) => ({
    id,
    normalized_name: "duplicate",
    start_date: "2026-07-01",
    end_date: "2026-07-02",
    thumbnail_url: null,
  }));
  const fileName = "duplicate2026070120260702.webp";
  const result = findFestivalThumbnailMatches(festivals, [fileName]);

  assert.equal(result.matched.length, 0);
  assert.deepEqual(result.duplicateFileNames, [fileName]);
});
