import assert from "node:assert/strict";
import test from "node:test";

import {
  buildScheduleImageCardPositions,
  buildScheduleImagePages,
  distributeStages,
  getScheduleImageTimelineHeight,
  getVisibleScheduleImagePages,
  shouldShowScheduleImageStageTitle,
} from "../lib/schedule/scheduleImageLayout.ts";
import type { ScheduleImageItem } from "../lib/schedule/scheduleImageLayout.ts";
import type { FestivalArtist } from "../lib/types.ts";
import { SCHEDULE_IMAGE_TYPOGRAPHY } from "../lib/schedule/scheduleImageTheme.ts";
import {
  SCHEDULE_IMAGE_DEFAULT_CARD_MAX_HEIGHT,
  SCHEDULE_IMAGE_SELECTED_CARD_MAX_HEIGHT,
} from "../lib/schedule/scheduleImageCardHeight.ts";
import {
  buildScheduleImageUntimedCardLayouts,
  SCHEDULE_IMAGE_UNTIMED_DEFAULT_MAX_HEIGHT,
  SCHEDULE_IMAGE_UNTIMED_SELECTED_MAX_HEIGHT,
} from "../lib/schedule/scheduleImageUntimedLayout.ts";

test("짧은 시간표는 세로로 과도하게 늘이지 않는다", () => {
  assert.equal(getScheduleImageTimelineHeight(160, 1484), 480);
  assert.equal(getScheduleImageTimelineHeight(540, 1484), 1484);
});

test("일정 이미지 글자 크기와 간격은 공통 상수로 고정한다", () => {
  assert.deepEqual(SCHEDULE_IMAGE_TYPOGRAPHY, {
    timeFontSize: 20,
    defaultArtistFontSize: 25,
    selectedArtistFontSize: 36,
    artistTextInset: 30,
  });
});

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

test("일정 이미지에서 무대 미정 제목만 숨긴다", () => {
  assert.equal(shouldShowScheduleImageStageTitle("무대 미정"), false);
  assert.equal(shouldShowScheduleImageStageTitle("TINY DISCO"), true);
  assert.equal(shouldShowScheduleImageStageTitle("메인 스테이지"), true);
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
  assert.equal(pages[0].timelineEnd, 18 * 60 + 30);
});

test("선택한 공연이 없으면 모든 날짜의 이미지 페이지를 표시한다", () => {
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
      performance_date: "2026-08-09",
      performance_time: "18:00:00",
      performance_end_time: "19:00:00",
      stage_name: "B",
      status: "scheduled",
      artists: { id: 2, name: "가수 B", normalized_name: "가수b" },
    },
  ];

  const unselectedPages = buildScheduleImagePages(artists, new Set());
  assert.deepEqual(
    getVisibleScheduleImagePages(unselectedPages).map(
      (page) => page.performanceDate,
    ),
    ["2026-08-08", "2026-08-09"],
  );

  const selectedPages = buildScheduleImagePages(artists, new Set([2]));
  assert.deepEqual(
    getVisibleScheduleImagePages(selectedPages).map(
      (page) => page.performanceDate,
    ),
    ["2026-08-09"],
  );
});

test("시간 공연이 1개나 3개여도 카드 최대 높이를 넘지 않는다", () => {
  const selectedItems: ScheduleImageItem[] = ["A", "B", "C"].map(
    (stageName, index) => ({
      id: index + 1,
      artistName: `선택 공연 ${index + 1}`,
      stageName,
      performanceDate: "2026-08-08",
      startMinutes: 18 * 60,
      endMinutes: 18 * 60 + 40,
      isSelected: true,
      hasConflict: false,
    }),
  );
  const selectedPositions = buildScheduleImageCardPositions(
    selectedItems,
    ["A", "B", "C"],
    18 * 60,
    19 * 60,
    100,
    1484,
  );

  selectedItems.forEach((item) => {
    assert.equal(
      selectedPositions.get(item.id)?.height,
      SCHEDULE_IMAGE_SELECTED_CARD_MAX_HEIGHT,
    );
  });

  const normalItem = { ...selectedItems[0], isSelected: false };
  const normalPositions = buildScheduleImageCardPositions(
    [normalItem],
    ["A"],
    18 * 60,
    19 * 60,
    100,
    1484,
  );
  assert.equal(
    normalPositions.get(normalItem.id)?.height,
    SCHEDULE_IMAGE_DEFAULT_CARD_MAX_HEIGHT,
  );
});

test("카드는 실제 시작 시각에 맞추고 선택 카드는 다음 공연 전까지만 확대한다", () => {
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
      startMinutes: 15 * 60,
      endMinutes: 15 * 60 + 40,
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
  assert.equal(selected.y, 100);
  assert.equal(unselected.y, 300);
  assert.ok(selected.y + selected.height < unselected.y);
  assert.ok(unselected.y + unselected.height <= 900);
});

test("15시 40분 공연은 15시와 16시 선 사이의 40분 위치에 놓인다", () => {
  const item: ScheduleImageItem = {
    id: 1,
    artistName: "15시 40분 공연",
    stageName: "A",
    performanceDate: "2026-08-08",
    startMinutes: 15 * 60 + 40,
    endMinutes: 16 * 60 + 10,
    isSelected: false,
    hasConflict: false,
  };
  const positions = buildScheduleImageCardPositions(
    [item],
    ["A"],
    15 * 60,
    17 * 60,
    100,
    600,
  );

  assert.equal(positions.get(1)?.y, 300);
});

test("적은 시간 미정 출연진은 카드 최대 높이로 위에서부터 배치한다", () => {
  const layouts = buildScheduleImageUntimedCardLayouts(
    [{ isSelected: true }, { isSelected: true }],
    1484,
  );

  assert.equal(layouts[0].height, SCHEDULE_IMAGE_UNTIMED_SELECTED_MAX_HEIGHT);
  assert.equal(layouts[0].offsetY, 0);
  assert.equal(layouts[1].height, SCHEDULE_IMAGE_UNTIMED_SELECTED_MAX_HEIGHT);
  assert.equal(layouts[1].offsetY, 180);
});

test("시간 미정 카드가 영역을 넘으면 선택 비율을 유지해 축소한다", () => {
  const layouts = buildScheduleImageUntimedCardLayouts(
    [{ isSelected: true }, { isSelected: false }],
    300,
  );

  assert.ok(Math.abs(layouts[0].height - 172.8) < 0.001);
  assert.ok(Math.abs(layouts[1].height - 115.2) < 0.001);
  assert.ok(Math.abs(layouts[1].offsetY - 184.8) < 0.001);
  assert.ok(Math.abs(layouts[1].offsetY + layouts[1].height - 300) < 0.001);
  assert.ok(layouts[1].height < SCHEDULE_IMAGE_UNTIMED_DEFAULT_MAX_HEIGHT);
});
