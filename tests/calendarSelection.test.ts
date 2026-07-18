import assert from "node:assert/strict";
import test from "node:test";

import { getAdjacentMonthForDate } from "../lib/calendar.ts";

test("7월 달력의 8월 1일을 선택하면 8월로 이동한다", () => {
  assert.deepEqual(getAdjacentMonthForDate("2026-08-01", 2026, 6), {
    year: 2026,
    monthIndex: 7,
  });
});

test("현재 달의 날짜를 선택하면 달을 이동하지 않는다", () => {
  assert.equal(getAdjacentMonthForDate("2026-07-01", 2026, 6), null);
});
