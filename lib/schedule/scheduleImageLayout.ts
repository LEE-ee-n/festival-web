import type { FestivalArtist } from "@/lib/types";

export const SCHEDULE_IMAGE_MAX_STAGES = 3;
export const SCHEDULE_IMAGE_WIDTH = 1080;
export const SCHEDULE_IMAGE_HEIGHT = 1920;

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

type StageFlow = {
  items: ScheduleImageItem[];
  topWeight: number;
  bottomWeight: number;
  cardWeights: number[];
  gapWeights: number[];
  totalWeight: number;
};

const SELECTED_CARD_WEIGHT = 1.5;
const UNSELECTED_CARD_WEIGHT = 1;
const MINUTES_PER_GAP_WEIGHT = 50;
const CARD_VISUAL_GAP = 7;

function buildStageFlow(
  items: ScheduleImageItem[],
  timelineStart: number,
  timelineEnd: number,
): StageFlow {
  const sortedItems = items
    .filter((item) => item.startMinutes !== null && item.endMinutes !== null)
    .sort((left, right) => left.startMinutes! - right.startMinutes!);
  const topWeight = sortedItems.length > 0
    ? Math.max(0, sortedItems[0].startMinutes! - timelineStart) /
      MINUTES_PER_GAP_WEIGHT
    : 0;
  const cardWeights = sortedItems.map((item) =>
    item.isSelected ? SELECTED_CARD_WEIGHT : UNSELECTED_CARD_WEIGHT,
  );
  const gapWeights = sortedItems.slice(1).map((item, index) => {
    const previous = sortedItems[index];
    const gapMinutes = Math.max(0, item.startMinutes! - previous.endMinutes!);
    return gapMinutes / MINUTES_PER_GAP_WEIGHT;
  });
  const lastItem = sortedItems.at(-1);
  const bottomWeight = lastItem
    ? Math.max(0, timelineEnd - lastItem.endMinutes!) /
      MINUTES_PER_GAP_WEIGHT
    : 0;
  const totalWeight =
    topWeight +
    bottomWeight +
    cardWeights.reduce((sum, weight) => sum + weight, 0) +
    gapWeights.reduce((sum, weight) => sum + weight, 0);

  return {
    items: sortedItems,
    topWeight,
    bottomWeight,
    cardWeights,
    gapWeights,
    totalWeight,
  };
}

export function buildScheduleImageCardPositions(
  items: ScheduleImageItem[],
  stages: string[],
  timelineStart: number,
  timelineEnd: number,
  timelineTop: number,
  timelineHeight: number,
): Map<number, ScheduleImageCardPosition> {
  const flows = stages.map((stage) =>
    buildStageFlow(
      items.filter((item) => item.stageName === stage),
      timelineStart,
      timelineEnd,
    ),
  );
  const maxWeight = Math.max(1, ...flows.map((flow) => flow.totalWeight));
  const pixelsPerWeight = timelineHeight / maxWeight;
  const positions = new Map<number, ScheduleImageCardPosition>();

  flows.forEach((flow) => {
    let y = timelineTop + flow.topWeight * pixelsPerWeight;

    flow.items.forEach((item, index) => {
      const allocatedHeight = flow.cardWeights[index] * pixelsPerWeight;
      positions.set(item.id, {
        y,
        height: Math.max(1, allocatedHeight - CARD_VISUAL_GAP),
      });
      y += allocatedHeight;

      if (index < flow.gapWeights.length) {
        y += flow.gapWeights[index] * pixelsPerWeight;
      }
    });
  });

  return positions;
}

function getArtistName(item: FestivalArtist) {
  const artist = Array.isArray(item.artists) ? item.artists[0] : item.artists;
  return artist?.name ?? "아티스트 미정";
}

function getStageName(item: FestivalArtist) {
  return item.stage_name?.trim() || "무대 미정";
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
  if (stages.length === 0) return [["무대 미정"]];

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
  const roundedEnd = Math.ceil(latest / 60) * 60;

  return {
    timelineStart,
    timelineEnd: Math.max(roundedEnd, timelineStart + 4 * 60),
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
