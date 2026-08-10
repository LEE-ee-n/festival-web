import type { ScheduleImageItem } from "@/lib/schedule/scheduleImageLayout";
import {
  SCHEDULE_IMAGE_TYPOGRAPHY,
  type ScheduleImageTheme,
} from "@/lib/schedule/scheduleImageTheme";
import { buildScheduleImageUntimedCardLayouts } from "@/lib/schedule/scheduleImageUntimedLayout";

type ScheduleImageUntimedLineupProps = {
  items: ScheduleImageItem[];
  x: number;
  y: number;
  width: number;
  height: number;
  theme: ScheduleImageTheme;
};

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
  const cardLayouts = buildScheduleImageUntimedCardLayouts(items, height);

  return (
    <g>
      {items.map((item, index) => {
        const cardLayout = cardLayouts[index];
        const cardHeight = cardLayout.height;
        const horizontalInset = item.isSelected ? 0 : 12;
        const cardX = x + horizontalInset;
        const cardWidth = width - horizontalInset * 2;
        const cardY = y + cardLayout.offsetY;
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
              x={cardX + cardWidth / 2}
              y={cardY + cardHeight / 2 + fontSize * 0.35}
              fill={item.isSelected ? theme.text : theme.secondaryText}
              fontSize={fontSize}
              fontWeight={item.isSelected ? "800" : "600"}
              textAnchor="middle"
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
