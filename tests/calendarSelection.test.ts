import assert from "node:assert/strict";
import test from "node:test";

import {
  getAdjacentMonthForDate,
  getCalendarMonthFromSearchParams,
  getCalendarDays,
  getShiftedCalendarMonth,
  toDateKey,
} from "../lib/calendar.ts";

test("쿼리 주소 직접 진입 시 해당 연월을 초기 표시 월로 사용한다", () => {
  const searchParams = new URLSearchParams("year=2026&month=8");

  assert.deepEqual(
    getCalendarMonthFromSearchParams(
      searchParams,
      new Date(2026, 6, 1),
    ),
    { year: 2026, monthIndex: 7 },
  );
});

test("연월 쿼리가 없으면 오늘이 속한 달을 사용한다", () => {
  assert.deepEqual(
    getCalendarMonthFromSearchParams(
      new URLSearchParams(),
      new Date(2026, 7, 1),
    ),
    { year: 2026, monthIndex: 7 },
  );
});

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

test("12월 다음 달은 다음 해 1월이다", () => {
  assert.deepEqual(getShiftedCalendarMonth(2026, 11, 1), {
    year: 2027,
    monthIndex: 0,
  });
});

test("월 이동 결과를 기준으로 연속 이동할 수 있다", () => {
  const september = getShiftedCalendarMonth(2026, 7, 1);
  const october = getShiftedCalendarMonth(
    september.year,
    september.monthIndex,
    1,
  );

  assert.deepEqual(october, {
    year: 2026,
    monthIndex: 9,
  });
});
