import assert from "node:assert/strict";
import test from "node:test";

import {
  countOutOfRangePerformanceDates,
  createFestivalDataQualityReport,
  getFestivalDataQualityIssues,
  getPerformanceDateRangeError,
  type FestivalDataQualityFestival,
  type FestivalDataQualityLineupRow,
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

test("공연 날짜가 축제 기간 시작·종료일과 같으면 정상이다", () => {
  assert.equal(
    getPerformanceDateRangeError("2026-08-01", "2026-08-01", "2026-08-02"),
    null,
  );
  assert.equal(
    getPerformanceDateRangeError("2026-08-02", "2026-08-01", "2026-08-02"),
    null,
  );
  assert.equal(
    getPerformanceDateRangeError("2026-08-01", "2026-08-01", "2026-08-01"),
    null,
  );
});

test("공연 날짜가 축제 기간 밖이면 오류 문구를 만든다", () => {
  assert.equal(
    getPerformanceDateRangeError("2026-07-31", "2026-08-01", "2026-08-02"),
    "축제 기간(2026-08-01 ~ 2026-08-02) 밖의 날짜입니다.",
  );
  assert.equal(
    getPerformanceDateRangeError("2026-08-03", "2026-08-01", "2026-08-02"),
    "축제 기간(2026-08-01 ~ 2026-08-02) 밖의 날짜입니다.",
  );
});

test("날짜 미정·축제 기간 없이는 오류로 판정하지 않는다", () => {
  assert.equal(getPerformanceDateRangeError(null, "2026-08-01", "2026-08-02"), null);
  assert.equal(getPerformanceDateRangeError("", "2026-08-01", "2026-08-02"), null);
  assert.equal(getPerformanceDateRangeError("2026-08-05", null, "2026-08-02"), null);
  assert.equal(getPerformanceDateRangeError("2026-08-05", "", ""), null);
});

test("기간 밖 공연일 집계는 종료·취소 축제와 날짜 미정을 제외한다", () => {
  const rows: FestivalDataQualityLineupRow[] = [
    { festival_id: 1, performance_date: "2026-07-30" },
    { festival_id: 1, performance_date: null },
    { festival_id: 2, performance_date: "2026-09-01" },
  ];

  assert.equal(
    countOutOfRangePerformanceDates(
      { start_date: "2026-08-01", end_date: "2026-08-02" },
      rows.filter((row) => row.festival_id === 1),
    ),
    1,
  );

  const report = createFestivalDataQualityReport([
    createFestival({ id: 1 }),
    createFestival({ id: 2, status: "ended" }),
  ], rows);

  assert.equal(report.counts.performance_date, 1);
  assert.equal(report.items.length, 1);
  assert.deepEqual(report.items[0].issues, ["performance_date"]);
  assert.equal(
    report.items[0].out_of_range_performance_date_count,
    1,
  );
});

test("한 축제의 기간 밖 공연일이 여러 건이어도 점검 목록에는 한 번만 표시한다", () => {
  const report = createFestivalDataQualityReport(
    [createFestival({ id: 1 })],
    [
      { festival_id: 1, performance_date: "2026-07-30" },
      { festival_id: 1, performance_date: "2026-08-05" },
      { festival_id: 1, performance_date: "2026-08-01" },
    ],
  );

  assert.equal(report.counts.performance_date, 1);
  assert.equal(report.items.length, 1);
  assert.deepEqual(report.items[0].issues, ["performance_date"]);
  assert.equal(
    report.items[0].out_of_range_performance_date_count,
    2,
  );
});
