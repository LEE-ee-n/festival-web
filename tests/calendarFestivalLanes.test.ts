import assert from "node:assert/strict";
import test from "node:test";

import {
  assignFestivalLanes,
  MAX_VISIBLE_FESTIVAL_LANES,
} from "../lib/calendarFestivalLanes.ts";
import type { Festival } from "../lib/types.ts";

function createFestival(
  id: number,
  startDate: string,
  endDate: string,
): Festival {
  return {
    id,
    name: `축제 ${id}`,
    start_date: startDate,
    end_date: endDate,
  } as Festival;
}

test("달력에는 축제 막대를 최대 3줄 표시한다", () => {
  assert.equal(MAX_VISIBLE_FESTIVAL_LANES, 3);
});

test("겹치는 축제는 월 전체에서 서로 다른 고정 줄을 사용한다", () => {
  const lanes = assignFestivalLanes([
    createFestival(10, "2026-07-31", "2026-08-02"),
    createFestival(20, "2026-08-01", "2026-08-02"),
  ]);

  assert.equal(lanes.get(10), 0);
  assert.equal(lanes.get(20), 1);
});

test("시작일이 같으면 ID가 작은 축제를 위에 배치한다", () => {
  const lanes = assignFestivalLanes([
    createFestival(20, "2026-08-01", "2026-08-02"),
    createFestival(10, "2026-08-01", "2026-08-03"),
  ]);

  assert.equal(lanes.get(10), 0);
  assert.equal(lanes.get(20), 1);
});

test("수요일-금요일과 목요일-토요일 축제의 줄이 중간에 바뀌지 않는다", () => {
  const lanes = assignFestivalLanes([
    createFestival(1, "2026-08-05", "2026-08-07"),
    createFestival(2, "2026-08-06", "2026-08-08"),
  ]);

  assert.equal(lanes.get(1), 0);
  assert.equal(lanes.get(2), 1);
});

test("앞 축제가 끝난 다음 날부터 같은 줄을 재사용한다", () => {
  const lanes = assignFestivalLanes([
    createFestival(1, "2026-08-01", "2026-08-02"),
    createFestival(2, "2026-08-03", "2026-08-04"),
  ]);

  assert.equal(lanes.get(1), 0);
  assert.equal(lanes.get(2), 0);
});
