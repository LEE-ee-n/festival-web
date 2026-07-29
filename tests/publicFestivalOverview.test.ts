import assert from "node:assert/strict";
import test from "node:test";

import {
  countPublicFestivalStates,
  getPublicFestivalState,
  sortPublicFestivals,
} from "../lib/festivals/publicFestivalOverview.ts";

const todayKey = "2026-07-30";

test("오늘 날짜를 기준으로 예정·진행중·종료를 판정한다", () => {
  assert.equal(
    getPublicFestivalState(
      { start_date: "2026-08-01", end_date: "2026-08-02" },
      todayKey,
    ),
    "scheduled",
  );
  assert.equal(
    getPublicFestivalState(
      { start_date: "2026-07-30", end_date: "2026-07-30" },
      todayKey,
    ),
    "ongoing",
  );
  assert.equal(
    getPublicFestivalState(
      { start_date: "2026-07-01", end_date: "2026-07-29" },
      todayKey,
    ),
    "ended",
  );
});

test("전체와 상태별 개수를 계산한다", () => {
  const counts = countPublicFestivalStates(
    [
      { start_date: "2026-08-01", end_date: "2026-08-02" },
      { start_date: "2026-07-29", end_date: "2026-07-31" },
      { start_date: "2026-07-01", end_date: "2026-07-02" },
    ],
    todayKey,
  );

  assert.deepEqual(counts, {
    all: 3,
    scheduled: 1,
    ongoing: 1,
    ended: 1,
  });
});

test("진행중, 가까운 예정, 최근 종료 순서로 정렬한다", () => {
  const festivals = sortPublicFestivals(
    [
      {
        name: "지난 축제",
        start_date: "2026-07-01",
        end_date: "2026-07-02",
      },
      {
        name: "예정 축제",
        start_date: "2026-08-01",
        end_date: "2026-08-02",
      },
      {
        name: "진행 축제",
        start_date: "2026-07-29",
        end_date: "2026-07-31",
      },
    ],
    todayKey,
  );

  assert.deepEqual(
    festivals.map((festival) => festival.name),
    ["진행 축제", "예정 축제", "지난 축제"],
  );
});
