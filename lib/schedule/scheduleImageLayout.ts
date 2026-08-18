import type { FestivalArtist } from "@/lib/types";
import {
  SCHEDULE_IMAGE_DEFAULT_CARD_MAX_HEIGHT,
  SCHEDULE_IMAGE_SELECTED_CARD_MAX_HEIGHT,
} from "./scheduleImageCardHeight.ts";

export const SCHEDULE_IMAGE_MAX_STAGES = 3;
export const SCHEDULE_IMAGE_WIDTH = 1080;
export const SCHEDULE_IMAGE_HEIGHT = 1920;
export const SCHEDULE_IMAGE_UNKNOWN_STAGE_NAME = "무대 미정";

export type ScheduleImageItem = {
  id: number;
  artistName: string;
  stageName: string;
  performanceDate: string | null;
  startMinutes: number | null;
  endMinutes: number | null;
  isSelected: boolean;
  hasConflict: boolean;
};

export type ScheduleImagePage = {
  key: string;
  performanceDate: string | null;
  pageIndex: number;
  pageCount: number;
  stages: string[];
  items: ScheduleImageItem[];
  timelineStart: number;
  timelineEnd: number;
};

export type ScheduleImageCardPosition = {
  y: number;
  height: number;
};

const CARD_VISUAL_GAP = 7;
const SELECTED_HEIGHT_SCALE = 1.35;
const MAX_TIMELINE_PIXELS_PER_MINUTE = 3;

export function getScheduleImageTimelineHeight(
  minutesRange: number,
  availableHeight: number,
) {
  return Math.min(
    availableHeight,
    Math.max(1, minutesRange) * MAX_TIMELINE_PIXELS_PER_MINUTE,
  );
}

export function buildScheduleImageCardPositions(
  items: ScheduleImageItem[],
  stages: string[],
  timelineStart: number,
  timelineEnd: number,
  timelineTop: number,
  timelineHeight: number,
): Map<number, ScheduleImageCardPosition> {
  const minutesRange = Math.max(1, timelineEnd - timelineStart);
  const pixelsPerMinute = timelineHeight / minutesRange;
  const timelineBottom = timelineTop + timelineHeight;
  const positions = new Map<number, ScheduleImageCardPosition>();

  stages.forEach((stage) => {
    const stageItems = items
      .filter(
        (item) =>
          item.stageName === stage &&
          item.startMinutes !== null &&
          item.endMinutes !== null,
      )
      .sort((left, right) => left.startMinutes! - right.startMinutes!);

    stageItems.forEach((item, index) => {
      const y = timelineTop +
        (item.startMinutes! - timelineStart) * pixelsPerMinute;
      const durationHeight = Math.max(
        1,
        (item.endMinutes! - item.startMinutes!) * pixelsPerMinute -
          CARD_VISUAL_GAP,
      );
      const desiredHeight = item.isSelected
        ? durationHeight * SELECTED_HEIGHT_SCALE
        : durationHeight;
      const maximumHeight = item.isSelected
        ? SCHEDULE_IMAGE_SELECTED_CARD_MAX_HEIGHT
        : SCHEDULE_IMAGE_DEFAULT_CARD_MAX_HEIGHT;
      const nextItem = stageItems[index + 1];
      const availableHeight = nextItem
        ? (nextItem.startMinutes! - item.startMinutes!) * pixelsPerMinute -
          CARD_VISUAL_GAP
        : timelineBottom - y;

      positions.set(item.id, {
        y,
        height: Math.max(
          1,
          Math.min(
            desiredHeight,
            availableHeight,
            timelineBottom - y,
            maximumHeight,
          ),
        ),
      });
    });
  });

  return positions;
}

function getArtistName(item: FestivalArtist) {
  const artist = Array.isArray(item.artists) ? item.artists[0] : item.artists;
  return artist?.name ?? "아티스트 미정";
}

function getStageName(item: FestivalArtist) {
  return item.stage_name?.trim() || SCHEDULE_IMAGE_UNKNOWN_STAGE_NAME;
}

export function shouldShowScheduleImageStageTitle(stageName: string) {
  return stageName !== SCHEDULE_IMAGE_UNKNOWN_STAGE_NAME;
}

export function parseScheduleTime(value: string | null): number | null {
  if (!value) return null;

  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  return hours * 60 + minutes;
}

export function distributeStages(
  stages: string[],
  maxStages = SCHEDULE_IMAGE_MAX_STAGES,
): string[][] {
  if (stages.length === 0) return [[SCHEDULE_IMAGE_UNKNOWN_STAGE_NAME]];

  const pageCount = Math.ceil(stages.length / maxStages);
  const baseSize = Math.floor(stages.length / pageCount);
  const remainder = stages.length % pageCount;
  const groups: string[][] = [];
  let offset = 0;

  for (let index = 0; index < pageCount; index += 1) {
    const size = baseSize + (index < remainder ? 1 : 0);
    groups.push(stages.slice(offset, offset + size));
    offset += size;
  }

  return groups;
}

function getConflictIds(items: ScheduleImageItem[]) {
  const selectedTimedItems = items.filter(
    (item) =>
      item.isSelected &&
      item.startMinutes !== null &&
      item.endMinutes !== null,
  );
  const conflictIds = new Set<number>();

  for (let leftIndex = 0; leftIndex < selectedTimedItems.length; leftIndex += 1) {
    const left = selectedTimedItems[leftIndex];

    for (
      let rightIndex = leftIndex + 1;
      rightIndex < selectedTimedItems.length;
      rightIndex += 1
    ) {
      const right = selectedTimedItems[rightIndex];

      if (
        left.startMinutes! < right.endMinutes! &&
        right.startMinutes! < left.endMinutes!
      ) {
        conflictIds.add(left.id);
        conflictIds.add(right.id);
      }
    }
  }

  return conflictIds;
}

function getTimelineRange(items: ScheduleImageItem[]) {
  const timedItems = items.filter(
    (item) => item.startMinutes !== null && item.endMinutes !== null,
  );

  if (timedItems.length === 0) {
    return { timelineStart: 12 * 60, timelineEnd: 22 * 60 };
  }

  const earliest = Math.min(...timedItems.map((item) => item.startMinutes!));
  const latest = Math.max(...timedItems.map((item) => item.endMinutes!));
  const timelineStart = Math.floor(earliest / 60) * 60;

  return {
    timelineStart,
    timelineEnd: Math.max(latest, timelineStart + 60),
  };
}

export function buildScheduleImagePages(
  festivalArtists: FestivalArtist[],
  selectedIds: ReadonlySet<number>,
): ScheduleImagePage[] {
  const normalizedItems = festivalArtists.map<ScheduleImageItem>((item) => {
    const startMinutes = parseScheduleTime(item.performance_time);
    let endMinutes = parseScheduleTime(item.performance_end_time);

    if (startMinutes !== null) {
      if (endMinutes === null) endMinutes = startMinutes + 40;
      if (endMinutes <= startMinutes) endMinutes += 24 * 60;
    }

    return {
      id: item.id,
      artistName: getArtistName(item),
      stageName: getStageName(item),
      performanceDate: item.performance_date,
      startMinutes,
      endMinutes,
      isSelected: selectedIds.has(item.id),
      hasConflict: false,
    };
  });

  const dates = [...new Set(normalizedItems.map((item) => item.performanceDate))]
    .sort((left, right) => {
      if (left === null) return 1;
      if (right === null) return -1;
      return left.localeCompare(right);
    });

  return dates.flatMap((performanceDate) => {
    const dateItems = normalizedItems.filter(
      (item) => item.performanceDate === performanceDate,
    );
    const conflictIds = getConflictIds(dateItems);
    const itemsWithConflicts = dateItems.map((item) => ({
      ...item,
      hasConflict: conflictIds.has(item.id),
    }));
    const stages = [...new Set(itemsWithConflicts.map((item) => item.stageName))];
    const stageGroups = distributeStages(stages);
    const { timelineStart, timelineEnd } = getTimelineRange(itemsWithConflicts);

    return stageGroups.map((stageGroup, pageIndex) => ({
      key: `${performanceDate ?? "undated"}-${pageIndex + 1}`,
      performanceDate,
      pageIndex,
      pageCount: stageGroups.length,
      stages: stageGroup,
      items: itemsWithConflicts.filter((item) => stageGroup.includes(item.stageName)),
      timelineStart,
      timelineEnd,
    }));
  });
}

export function getVisibleScheduleImagePages(
  pages: readonly ScheduleImagePage[],
): ScheduleImagePage[] {
  const selectedDates = new Set(
    pages.flatMap((page) =>
      page.items
        .filter((item) => item.isSelected)
        .map((item) => item.performanceDate),
    ),
  );

  if (selectedDates.size === 0) return [...pages];

  return pages.filter((page) => selectedDates.has(page.performanceDate));
}
