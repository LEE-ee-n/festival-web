import assert from "node:assert/strict";
import test from "node:test";

import { getFestivalBarSegment } from "../lib/calendarFestivalBar.ts";

test("17일부터 18일까지인 축제 막대는 18일에서 둥글게 끝난다", () => {
  const segment = getFestivalBarSegment("2026-07-17", "2026-07-18", 19);

  assert.deepEqual(segment, {
    spanDays: 2,
    endsInThisRow: true,
  });
});

test("다음 주까지 이어지는 축제는 현재 줄에서 둥글게 끝나지 않는다", () => {
  const segment = getFestivalBarSegment("2026-07-17", "2026-07-20", 19);

  assert.deepEqual(segment, {
    spanDays: 2,
    endsInThisRow: false,
  });
});
