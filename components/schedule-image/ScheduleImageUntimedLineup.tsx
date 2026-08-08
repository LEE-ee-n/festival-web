import type { ScheduleImageItem } from "@/lib/schedule/scheduleImageLayout";

type ScheduleImageUntimedLineupProps = {
  items: ScheduleImageItem[];
  x: number;
  y: number;
  width: number;
  height: number;
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
        const fontSize = Math.min(
          item.isSelected ? 30 : 22,
          Math.max(10, cardHeight * 0.38),
        );
        const result = (
          <g key={item.id}>
            <rect
              x={cardX}
              y={cardY}
              width={cardWidth}
              height={cardHeight}
              rx={item.isSelected ? 18 : 12}
              fill={item.isSelected ? "#EDE9FE" : "#191B2A"}
              stroke={item.isSelected ? "#7C3AED" : "#34374A"}
              strokeWidth={item.isSelected ? 4 : 2}
            />
            <text
              x={cardX + 20}
              y={cardY + cardHeight / 2 + fontSize * 0.35}
              fill={item.isSelected ? "#312E81" : "#A4A8B8"}
              fontSize={fontSize}
              fontWeight={item.isSelected ? "800" : "600"}
            >
              {truncateText(item.artistName, item.isSelected ? 34 : 42)}
            </text>
          </g>
        );

        return result;
      })}
    </g>
  );
}
