import assert from "node:assert/strict";
import test from "node:test";

import {
  getAdjacentMonthForDate,
  getCalendarDays,
  toDateKey,
} from "../lib/calendar.ts";

test("2026년 8월 달력은 월요일인 7월 27일부터 시작한다", () => {
  const calendarDays = getCalendarDays(2026, 7);

  assert.equal(toDateKey(calendarDays[0].date), "2026-07-27");
  assert.equal(toDateKey(calendarDays[6].date), "2026-08-02");
});

test("월요일에 시작하는 달은 해당 월 1일부터 표시한다", () => {
  const calendarDays = getCalendarDays(2026, 5);

  assert.equal(toDateKey(calendarDays[0].date), "2026-06-01");
});

test("7월 달력의 8월 1일을 선택하면 8월로 이동한다", () => {
  assert.deepEqual(getAdjacentMonthForDate("2026-08-01", 2026, 6), {
    year: 2026,
    monthIndex: 7,
  });
});

test("현재 달의 날짜를 선택하면 달을 이동하지 않는다", () => {
  assert.equal(getAdjacentMonthForDate("2026-07-01", 2026, 6), null);
});
