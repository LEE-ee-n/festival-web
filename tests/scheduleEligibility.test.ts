import assert from "node:assert/strict";
import test from "node:test";

import { canSelectScheduleItem } from "../lib/schedule/scheduleEligibility.ts";
import type { FestivalArtist } from "../lib/types.ts";

const scheduledItem: FestivalArtist = {
  id: 10,
  artist_id: 1,
  performance_date: "2026-08-08",
  performance_time: "18:00:00",
  performance_end_time: "19:00:00",
  stage_name: "메인 스테이지",
  status: "scheduled",
  artists: null,
};

test("예정·진행 중인 페스티벌의 공연은 선택할 수 있다", () => {
  assert.equal(canSelectScheduleItem("scheduled", scheduledItem), true);
  assert.equal(canSelectScheduleItem("ongoing", scheduledItem), true);
  assert.equal(canSelectScheduleItem("ended", scheduledItem), false);
});

test("날짜와 시간이 미정이어도 아티스트를 선택할 수 있다", () => {
  assert.equal(
    canSelectScheduleItem("scheduled", {
      ...scheduledItem,
      performance_date: null,
      performance_time: null,
    }),
    true,
  );
});

test("취소된 공연은 선택할 수 없다", () => {
  assert.equal(
    canSelectScheduleItem("scheduled", {
      ...scheduledItem,
      status: "cancelled",
    }),
    false,
  );
});
