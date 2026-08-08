import assert from "node:assert/strict";
import test from "node:test";

import { validateLineupSchedule } from "../lib/festivals/lineupScheduleValidation.ts";

const festivalPeriod = {
  festivalStartDate: "2026-08-08",
  festivalEndDate: "2026-08-09",
};

test("날짜와 시간이 모두 없는 출연 발표를 허용한다", () => {
  assert.equal(validateLineupSchedule({
    performanceDate: null,
    performanceTime: null,
    performanceEndTime: null,
    ...festivalPeriod,
  }), null);
});

test("시간을 입력하면 날짜가 필요하다", () => {
  assert.match(validateLineupSchedule({
    performanceDate: null,
    performanceTime: "18:00",
    performanceEndTime: null,
    ...festivalPeriod,
  }) ?? "", /날짜/);
});

test("페스티벌 기간 밖의 공연 날짜를 차단한다", () => {
  assert.match(validateLineupSchedule({
    performanceDate: "2026-08-10",
    performanceTime: "18:00",
    performanceEndTime: "19:00",
    ...festivalPeriod,
  }) ?? "", /페스티벌 기간/);
});

test("종료 시간만 입력하거나 종료 시간이 빠른 일정을 차단한다", () => {
  assert.match(validateLineupSchedule({
    performanceDate: "2026-08-08",
    performanceTime: null,
    performanceEndTime: "19:00",
    ...festivalPeriod,
  }) ?? "", /시작 시간/);
  assert.match(validateLineupSchedule({
    performanceDate: "2026-08-08",
    performanceTime: "19:00",
    performanceEndTime: "18:00",
    ...festivalPeriod,
  }) ?? "", /늦어야/);
});
