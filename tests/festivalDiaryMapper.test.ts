import assert from "node:assert/strict";
import test from "node:test";

import { toFestivalDiaryRecord } from "../lib/diaries/festivalDiaryMapper.ts";

const baseRow = {
  id: 1,
  festival_id: 10,
  attended_date: "2026-08-01",
  title: "기록",
  content: "내용",
  created_at: "2026-08-02T00:00:00Z",
  updated_at: "2026-08-02T00:00:00Z",
};

test("참여 날짜 배열이 없으면 대표 참여일을 배열로 사용한다", () => {
  assert.deepEqual(toFestivalDiaryRecord(baseRow).attendedDates, ["2026-08-01"]);
});

test("여러 참여 날짜가 저장돼 있으면 해당 배열을 유지한다", () => {
  const attendedDates = ["2026-08-01", "2026-08-02"];

  assert.equal(toFestivalDiaryRecord({ ...baseRow, attended_dates: attendedDates }).attendedDates, attendedDates);
});
