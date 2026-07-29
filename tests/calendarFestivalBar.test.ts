import assert from "node:assert/strict";
import test from "node:test";

import { getFestivalBarSegment } from "../lib/calendarFestivalBar.ts";

test("토요일부터 일요일까지인 축제 막대는 같은 줄에서 이어진다", () => {
  const segment = getFestivalBarSegment("2026-08-01", "2026-08-02", 5);

  assert.deepEqual(segment, {
    spanDays: 2,
    endsInThisRow: true,
  });
});

test("월요일까지 이어지는 축제는 일요일 뒤 다음 줄로 이어진다", () => {
  const segment = getFestivalBarSegment("2026-08-01", "2026-08-03", 5);

  assert.deepEqual(segment, {
    spanDays: 2,
    endsInThisRow: false,
  });
});
