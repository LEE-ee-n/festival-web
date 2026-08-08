import type { ScheduleImageItem } from "@/lib/schedule/scheduleImageLayout";
import {
  SCHEDULE_IMAGE_TYPOGRAPHY,
  type ScheduleImageTheme,
} from "@/lib/schedule/scheduleImageTheme";

type ScheduleImageUntimedLineupProps = {
  items: ScheduleImageItem[];
  x: number;
  y: number;
  width: number;
  height: number;
  theme: ScheduleImageTheme;
};

const SELECTED_WEIGHT = 1.5;
const DEFAULT_WEIGHT = 1;
const CARD_GAP = 8;

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(1, maxLength - 1))}…`;
}

export default function ScheduleImageUntimedLineup({
  items,
  x,
  y,
  width,
  height,
  theme,
}: ScheduleImageUntimedLineupProps) {
  const totalWeight = items.reduce(
    (sum, item) => sum + (item.isSelected ? SELECTED_WEIGHT : DEFAULT_WEIGHT),
    0,
  );
  const unitHeight = totalWeight > 0 ? height / totalWeight : height;
  return (
    <g>
      {items.map((item, index) => {
        const precedingWeight = items
          .slice(0, index)
          .reduce(
            (sum, precedingItem) =>
              sum +
              (precedingItem.isSelected ? SELECTED_WEIGHT : DEFAULT_WEIGHT),
            0,
          );
        const allocatedHeight =
          unitHeight * (item.isSelected ? SELECTED_WEIGHT : DEFAULT_WEIGHT);
        const cardHeight = Math.max(1, allocatedHeight - CARD_GAP);
        const horizontalInset = item.isSelected ? 0 : 12;
        const cardX = x + horizontalInset;
        const cardWidth = width - horizontalInset * 2;
        const cardY = y + precedingWeight * unitHeight;
        const fontSize = item.isSelected
          ? SCHEDULE_IMAGE_TYPOGRAPHY.selectedArtistFontSize
          : SCHEDULE_IMAGE_TYPOGRAPHY.defaultArtistFontSize;
        const maxCharacters = Math.max(
          5,
          Math.floor((cardWidth - 52) / (fontSize * 0.58)),
        );
        const result = (
          <g key={item.id}>
            <rect
              x={cardX}
              y={cardY}
              width={cardWidth}
              height={cardHeight}
              rx={item.isSelected ? 18 : 12}
              fill={item.isSelected ? theme.accentFill : theme.surface}
              stroke={item.isSelected ? theme.accentStroke : theme.strongLine}
              strokeWidth={item.isSelected ? 4 : 2}
            />
            <text
              x={cardX + SCHEDULE_IMAGE_TYPOGRAPHY.artistTextInset}
              y={cardY + cardHeight / 2 + fontSize * 0.35}
              fill={item.isSelected ? theme.accentText : theme.secondaryText}
              fontSize={fontSize}
              fontWeight={item.isSelected ? "800" : "600"}
            >
              {truncateText(item.artistName, maxCharacters)}
            </text>
          </g>
        );

        return result;
      })}
    </g>
  );
}
