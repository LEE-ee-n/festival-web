"use client";

import { forwardRef } from "react";

import ScheduleImageUntimedLineup from "@/components/schedule-image/ScheduleImageUntimedLineup";
import ScheduleImageStickerLayer from "@/components/schedule-image/ScheduleImageStickerLayer";
import {
  getScheduleImageTheme,
  SCHEDULE_IMAGE_TYPOGRAPHY,
} from "@/lib/schedule/scheduleImageTheme";
import type { ScheduleImageSticker } from "@/lib/schedule/scheduleImageSticker";
import type { FestivalCalendarColor } from "@/lib/types";

import {
  buildScheduleImageCardPositions,
  SCHEDULE_IMAGE_HEIGHT,
  SCHEDULE_IMAGE_WIDTH,
  type ScheduleImagePage,
} from "@/lib/schedule/scheduleImageLayout";

type ScheduleImageCanvasProps = {
  festivalName: string;
  location: string | null;
  page: ScheduleImagePage;
  accentColor: FestivalCalendarColor;
  stickers: ScheduleImageSticker[];
  selectedStickerId: string | null;
  onStickerSelect: (id: string | null) => void;
  onStickerChange: (sticker: ScheduleImageSticker) => void;
};

function formatDate(date: string | null) {
  if (!date) return "날짜 미정";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00+09:00`));
}

function formatMinutes(minutes: number) {
  const normalizedMinutes = minutes % (24 * 60);
  return `${String(Math.floor(normalizedMinutes / 60)).padStart(2, "0")}:${String(normalizedMinutes % 60).padStart(2, "0")}`;
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(1, maxLength - 1))}…`;
}

function getEstimatedCharacterWidth(character: string, fontSize: number) {
  if (/\s/.test(character)) return fontSize * 0.34;
  if (/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/.test(character)) {
    return fontSize;
  }
  if (/[A-Z0-9]/.test(character)) return fontSize * 0.68;
  return fontSize * 0.56;
}

function getEstimatedTextWidth(value: string, fontSize: number) {
  return Array.from(value).reduce(
    (width, character) => width + getEstimatedCharacterWidth(character, fontSize),
    0,
  );
}

const ScheduleImageCanvas = forwardRef<SVGSVGElement, ScheduleImageCanvasProps>(
  function ScheduleImageCanvas({
    festivalName,
    location,
    page,
    accentColor,
    stickers,
    selectedStickerId,
    onStickerSelect,
    onStickerChange,
  }, ref) {
    const theme = getScheduleImageTheme(accentColor);
    const canvasWidth = SCHEDULE_IMAGE_WIDTH;
    const canvasHeight = SCHEDULE_IMAGE_HEIGHT;
    const leftAxisWidth = 92;
    const gridLeft = 118;
    const gridRight = 1032;
    const stageGap = 10;
    const stageWidth =
      (gridRight - gridLeft - stageGap * (page.stages.length - 1)) /
      page.stages.length;
    const untimedItems = page.items.filter((item) => item.startMinutes === null);
    const isUntimedOnly = page.items.every((item) => item.startMinutes === null);
    const timelineTop = 304;
    const timelineBottom = !isUntimedOnly && untimedItems.length > 0 ? 1622 : 1788;
    const timelineHeight = timelineBottom - timelineTop;
    const minutesRange = Math.max(60, page.timelineEnd - page.timelineStart);
    const minuteHeight = timelineHeight / minutesRange;
    const cardPositions = buildScheduleImageCardPositions(
      page.items,
      page.stages,
      page.timelineStart,
      page.timelineEnd,
      timelineTop,
      timelineHeight,
    );
    const timedItems = page.items
      .filter((item) => item.startMinutes !== null)
      .sort((left, right) => Number(left.isSelected) - Number(right.isSelected));
    const hourMarkers: number[] = [];

    for (
      let marker = Math.ceil(page.timelineStart / 60) * 60;
      marker <= page.timelineEnd;
      marker += 60
    ) {
      hourMarkers.push(marker);
    }

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        width={canvasWidth}
        height={canvasHeight}
        className="block h-auto w-full"
        role="img"
        aria-label={`${festivalName} 내 일정 이미지 미리보기`}
        style={{ fontFamily: "Arial, 'Noto Sans KR', sans-serif" }}
      >
        <rect width={canvasWidth} height={canvasHeight} fill={theme.background} />

        <text x="68" y="132" fill={theme.text} fontSize="48" fontWeight="800">
          {truncateText(festivalName, 25)}
        </text>
        <text x="68" y="178" fill={theme.secondaryText} fontSize="27" fontWeight="600">
          {formatDate(page.performanceDate)}
          {location ? ` · ${truncateText(location, 22)}` : ""}
        </text>
        <text x="1012" y="122" fill={theme.mutedText} fontSize="22" textAnchor="end">
          {page.pageCount > 1 ? `${page.pageIndex + 1} / ${page.pageCount}` : ""}
        </text>
        <line x1="68" y1="226" x2="1012" y2="226" stroke={theme.line} strokeWidth="2" />

        {isUntimedOnly ? (
          <text
            x="540"
            y="276"
            fill={theme.accentText}
            fontSize="25"
            fontWeight="800"
            textAnchor="middle"
          >
            LINEUP
          </text>
        ) : page.stages.map((stage, index) => {
          const centerX = gridLeft + index * (stageWidth + stageGap) + stageWidth / 2;
          return (
            <text
              key={stage}
              x={centerX}
              y="276"
              fill={theme.accentText}
              fontSize="25"
              fontWeight="800"
              textAnchor="middle"
            >
              {truncateText(stage, page.stages.length === 3 ? 13 : 20)}
            </text>
          );
        })}

        {!isUntimedOnly && hourMarkers.map((marker) => {
          const y = timelineTop + (marker - page.timelineStart) * minuteHeight;
          return (
            <g key={marker}>
              <line x1={gridLeft} y1={y} x2={gridRight} y2={y} stroke={theme.line} strokeWidth="2" />
              <text x={leftAxisWidth} y={y + 8} fill={theme.mutedText} fontSize="24" fontWeight="700" textAnchor="end">
                {String(Math.floor((marker % (24 * 60)) / 60)).padStart(2, "0")}
              </text>
            </g>
          );
        })}

        {timedItems.map((item) => {
          const stageIndex = page.stages.indexOf(item.stageName);
          const slotX = gridLeft + stageIndex * (stageWidth + stageGap);
          const cardPosition = cardPositions.get(item.id);
          if (!cardPosition) return null;

          const horizontalInset = item.isSelected ? 3 : 11;
          const cardX = slotX + horizontalInset;
          const cardY = cardPosition.y;
          const cardWidth = stageWidth - horizontalInset * 2;
          const cardHeight = cardPosition.height;
          const baseArtistFontSize = item.isSelected
            ? SCHEDULE_IMAGE_TYPOGRAPHY.selectedArtistFontSize
            : SCHEDULE_IMAGE_TYPOGRAPHY.defaultArtistFontSize;
          const performanceDuration =
            item.endMinutes! - item.startMinutes!;
          const isCompactTimedCard = performanceDuration < 20;
          const showTime = true;
          const timeFontSize = isCompactTimedCard
            ? 18
            : SCHEDULE_IMAGE_TYPOGRAPHY.timeFontSize;
          const minimumGap = 2;
          const availableArtistHeight = showTime
            ? cardHeight - timeFontSize - minimumGap * 3
            : cardHeight - minimumGap * 2;
          const artistFontSize = Math.min(
            baseArtistFontSize,
            Math.max(16, availableArtistHeight),
          );
          const verticalGap = showTime
            ? Math.max(
                minimumGap,
                (cardHeight - timeFontSize - artistFontSize) / 3,
              )
            : Math.max(minimumGap, (cardHeight - artistFontSize) / 2);
          const timeY = cardY + verticalGap + timeFontSize * 0.8;
          const artistY = showTime
            ? cardY +
              verticalGap +
              timeFontSize +
              verticalGap +
              artistFontSize * 0.8
            : cardY + verticalGap + artistFontSize * 0.8;
          const artistText = item.artistName;
          const artistMaxWidth =
            cardWidth - (item.hasConflict ? 70 : 28);
          const compressArtistText =
            getEstimatedTextWidth(artistText, artistFontSize) > artistMaxWidth;
          const cardFill = item.isSelected ? theme.accentFill : theme.surface;
          const cardStroke = item.isSelected
            ? theme.accentStroke
            : theme.strongLine;
          const primaryText = item.isSelected ? theme.text : theme.secondaryText;

          return (
            <g key={item.id}>
              <rect
                x={cardX}
                y={cardY}
                width={cardWidth}
                height={cardHeight}
                rx={item.isSelected ? 18 : 12}
                fill={cardFill}
                stroke={cardStroke}
                strokeWidth={item.isSelected ? 4 : 2}
              />
              {showTime && (
                <text x={cardX + cardWidth / 2} y={timeY} fill={item.isSelected ? theme.text : theme.mutedText} fontSize={timeFontSize} fontWeight="600" textAnchor="middle">
                  {formatMinutes(item.startMinutes!)}–{formatMinutes(item.endMinutes!)}
                </text>
              )}
              <text
                x={cardX + cardWidth / 2}
                y={artistY}
                fill={primaryText}
                fontSize={artistFontSize}
                fontWeight={item.isSelected ? "800" : "600"}
                textAnchor="middle"
                textLength={compressArtistText ? artistMaxWidth : undefined}
                lengthAdjust={compressArtistText ? "spacingAndGlyphs" : undefined}
              >
                {artistText}
              </text>
              {item.hasConflict && (
                <g data-export-exclude="true">
                  <circle cx={cardX + cardWidth - 18} cy={cardY + 18} r="13" fill="#F97316" />
                  <text x={cardX + cardWidth - 18} y={cardY + 25} fill="#FFFFFF" fontSize="18" fontWeight="900" textAnchor="middle">!</text>
                </g>
              )}
            </g>
          );
        })}

        {isUntimedOnly && (
          <ScheduleImageUntimedLineup
            items={untimedItems}
            x={68}
            y={timelineTop}
            width={944}
            height={timelineHeight}
            theme={theme}
          />
        )}

        {!isUntimedOnly && untimedItems.length > 0 && (
          <g>
            <text x="68" y="1678" fill={theme.accentText} fontSize="23" fontWeight="800">시간 미정</text>
            <text x="68" y="1718" fill={theme.secondaryText} fontSize="25">
              {truncateText(untimedItems.map((item) => item.artistName).join(" · "), 58)}
            </text>
          </g>
        )}

        <text x="1012" y="1838" fill={theme.accentText} fontSize="22" fontWeight="800" textAnchor="end">Festibom</text>

        <ScheduleImageStickerLayer
          stickers={stickers}
          selectedId={selectedStickerId}
          accentColor={theme.accentStroke}
          onSelect={onStickerSelect}
          onChange={onStickerChange}
        />
      </svg>
    );
  },
);

export default ScheduleImageCanvas;
