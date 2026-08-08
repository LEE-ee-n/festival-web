import assert from "node:assert/strict";
import test from "node:test";

import { getDefaultAttendedDate, getFestivalDateOptions } from "../lib/diaries/diaryDates.ts";

test("오늘이 축제 기간이면 오늘을 기본 관람일로 사용한다", () => {
  assert.equal(
    getDefaultAttendedDate("2026-08-07", "2026-08-09", "2026-08-08"),
    "2026-08-08",
  );
});

test("축제가 끝났으면 마지막 날을 기본 관람일로 사용한다", () => {
  assert.equal(
    getDefaultAttendedDate("2026-08-01", "2026-08-03", "2026-08-07"),
    "2026-08-03",
  );
});

test("축제 시작 전이면 첫날을 기본 관람일로 사용한다", () => {
  assert.equal(
    getDefaultAttendedDate("2026-08-09", "2026-08-10", "2026-08-07"),
    "2026-08-09",
  );
});

test("3일 페스티벌은 참여 날짜 선택지를 3개 만든다", () => {
  assert.deepEqual(getFestivalDateOptions("2026-08-01", "2026-08-03"), [
    "2026-08-01",
    "2026-08-02",
    "2026-08-03",
  ]);
});

test("잘못된 페스티벌 기간은 참여 날짜 선택지를 만들지 않는다", () => {
  assert.deepEqual(getFestivalDateOptions("2026-08-03", "2026-08-01"), []);
});
