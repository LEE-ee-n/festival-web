import assert from "node:assert/strict";
import test from "node:test";

import {
  createFestivalDataQualityReport,
  getFestivalDataQualityIssues,
  type FestivalDataQualityFestival,
} from "../lib/festivals/festivalDataQuality.ts";

function createFestival(
  overrides: Partial<FestivalDataQualityFestival> = {},
): FestivalDataQualityFestival {
  return {
    id: 1,
    name: "테스트 페스티벌",
    start_date: "2026-08-01",
    end_date: "2026-08-02",
    status: "scheduled",
    instagram_url: "https://www.instagram.com/test/",
    instagram_url_unavailable: false,
    official_url: "https://example.com",
    official_url_unavailable: false,
    thumbnail_url: "https://example.com/poster.webp",
    location: "테스트 공연장",
    address: "서울특별시 테스트로 1",
    price_type: "paid",
    ...overrides,
  };
}

test("공백과 unknown 값을 누락 정보로 판정한다", () => {
  const issues = getFestivalDataQualityIssues(createFestival({
    instagram_url: " ",
    address: null,
    price_type: "unknown",
  }));

  assert.deepEqual(issues, ["instagram", "venue", "price_type"]);
});

test("종료·취소 페스티벌은 기본 점검 대상에서 제외한다", () => {
  const report = createFestivalDataQualityReport([
    createFestival({ id: 1, status: "ended", instagram_url: null }),
    createFestival({ id: 2, status: "cancelled", thumbnail_url: null }),
  ]);

  assert.deepEqual(report.items, []);
  assert.equal(report.counts.instagram, 0);
  assert.equal(report.counts.thumbnail, 0);
});

test("여러 누락 항목이 있어도 페스티벌 목록에는 한 번만 표시한다", () => {
  const report = createFestivalDataQualityReport([
    createFestival({
      instagram_url: null,
      official_url: null,
      thumbnail_url: null,
    }),
  ]);

  assert.equal(report.items.length, 1);
  assert.deepEqual(report.items[0].issues, [
    "instagram",
    "official_url",
    "thumbnail",
  ]);
  assert.equal(report.counts.instagram, 1);
  assert.equal(report.counts.official_url, 1);
  assert.equal(report.counts.thumbnail, 1);
});

test("누락 정보가 없는 페스티벌은 목록에 표시하지 않는다", () => {
  const report = createFestivalDataQualityReport([createFestival()]);

  assert.deepEqual(report.items, []);
});

test("공식 링크가 실제로 없음 확인된 빈 URL은 누락에서 제외한다", () => {
  const report = createFestivalDataQualityReport([
    createFestival({
      instagram_url: null,
      instagram_url_unavailable: true,
      official_url: null,
      official_url_unavailable: true,
    }),
  ]);

  assert.deepEqual(report.items, []);
  assert.equal(report.counts.instagram, 0);
  assert.equal(report.counts.official_url, 0);
});
