import assert from "node:assert/strict";
import test from "node:test";

import {
  buildScheduleImageCardPositions,
  buildScheduleImagePages,
  distributeStages,
} from "../lib/schedule/scheduleImageLayout.ts";
import type { ScheduleImageItem } from "../lib/schedule/scheduleImageLayout.ts";
import type { FestivalArtist } from "../lib/types.ts";

test("무대를 페이지당 최대 3개로 균등하게 나눈다", () => {
  assert.deepEqual(distributeStages(["A", "B", "C"]), [["A", "B", "C"]]);
  assert.deepEqual(distributeStages(["A", "B", "C", "D"]), [
    ["A", "B"],
    ["C", "D"],
  ]);
  assert.deepEqual(distributeStages(["A", "B", "C", "D", "E"]), [
    ["A", "B", "C"],
    ["D", "E"],
  ]);
});

test("날짜별 페이지를 만들고 겹치는 선택 일정을 표시한다", () => {
  const artists: FestivalArtist[] = [
    {
      id: 1,
      artist_id: 1,
      performance_date: "2026-08-08",
      performance_time: "17:00:00",
      performance_end_time: "18:00:00",
      stage_name: "A",
      status: "scheduled",
      artists: { id: 1, name: "가수 A", normalized_name: "가수a" },
    },
    {
      id: 2,
      artist_id: 2,
      performance_date: "2026-08-08",
      performance_time: "17:30:00",
      performance_end_time: "18:30:00",
      stage_name: "B",
      status: "scheduled",
      artists: { id: 2, name: "가수 B", normalized_name: "가수b" },
    },
  ];

  const pages = buildScheduleImagePages(artists, new Set([1, 2]));

  assert.equal(pages.length, 1);
  assert.equal(pages[0].items.every((item) => item.hasConflict), true);
});

test("같은 무대의 카드는 겹치지 않고 선택 카드는 더 크게 배치한다", () => {
  const items: ScheduleImageItem[] = [
    {
      id: 1,
      artistName: "선택 공연",
      stageName: "A",
      performanceDate: "2026-08-08",
      startMinutes: 14 * 60,
      endMinutes: 14 * 60 + 40,
      isSelected: true,
      hasConflict: false,
    },
    {
      id: 2,
      artistName: "일반 공연",
      stageName: "A",
      performanceDate: "2026-08-08",
      startMinutes: 14 * 60 + 10,
      endMinutes: 15 * 60,
      isSelected: false,
      hasConflict: false,
    },
  ];
  const positions = buildScheduleImageCardPositions(
    items,
    ["A"],
    14 * 60,
    18 * 60,
    100,
    800,
  );
  const selected = positions.get(1)!;
  const unselected = positions.get(2)!;

  assert.ok(selected.height > unselected.height);
  assert.ok(selected.y + selected.height < unselected.y);
  assert.ok(unselected.y + unselected.height <= 900);
});
