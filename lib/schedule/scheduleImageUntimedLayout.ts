export const SCHEDULE_IMAGE_UNTIMED_CARD_GAP = 12;
export const SCHEDULE_IMAGE_UNTIMED_DEFAULT_MAX_HEIGHT = 125;
export const SCHEDULE_IMAGE_UNTIMED_SELECTED_MAX_HEIGHT = 168;

type UntimedLayoutItem = {
  isSelected: boolean;
};

export type ScheduleImageUntimedCardLayout = {
  offsetY: number;
  height: number;
};

const DEFAULT_WEIGHT = 1;
const SELECTED_WEIGHT = 1.5;

function getWeight(item: UntimedLayoutItem) {
  return item.isSelected ? SELECTED_WEIGHT : DEFAULT_WEIGHT;
}

function getPreferredHeight(item: UntimedLayoutItem) {
  return item.isSelected
    ? SCHEDULE_IMAGE_UNTIMED_SELECTED_MAX_HEIGHT
    : SCHEDULE_IMAGE_UNTIMED_DEFAULT_MAX_HEIGHT;
}

export function buildScheduleImageUntimedCardLayouts(
  items: readonly UntimedLayoutItem[],
  availableHeight: number,
): ScheduleImageUntimedCardLayout[] {
  if (items.length === 0) return [];

  const safeHeight = Math.max(items.length, availableHeight);
  const gapCount = Math.max(0, items.length - 1);
  const gap = gapCount > 0
    ? Math.min(
        SCHEDULE_IMAGE_UNTIMED_CARD_GAP,
        Math.max(0, (safeHeight - items.length) / gapCount),
      )
    : 0;
  const preferredHeights = items.map(getPreferredHeight);
  const preferredTotal = preferredHeights.reduce(
    (sum, height) => sum + height,
    gap * gapCount,
  );
  const cardHeights = preferredTotal <= safeHeight
    ? preferredHeights
    : (() => {
        const availableCardHeight = Math.max(
          items.length,
          safeHeight - gap * gapCount,
        );
        const totalWeight = items.reduce(
          (sum, item) => sum + getWeight(item),
          0,
        );

        return items.map(
          (item) => availableCardHeight * (getWeight(item) / totalWeight),
        );
      })();

  let offsetY = 0;
  return cardHeights.map((height) => {
    const layout = { offsetY, height };
    offsetY += height + gap;
    return layout;
  });
}
