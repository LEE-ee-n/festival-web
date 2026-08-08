"use client";

import { forwardRef } from "react";

import ScheduleImageUntimedLineup from "@/components/schedule-image/ScheduleImageUntimedLineup";

import {
  buildScheduleImageCardPositions,
  SCHEDULE_IMAGE_HEIGHT,
  SCHEDULE_IMAGE_WIDTH,
  type ScheduleImageItem,
  type ScheduleImagePage,
} from "@/lib/schedule/scheduleImageLayout";

type ScheduleImageCanvasProps = {
  festivalName: string;
  location: string | null;
  page: ScheduleImagePage;
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

function getArtistFontSize(item: ScheduleImageItem, cardHeight: number) {
  if (!item.isSelected) return cardHeight >= 64 ? 21 : 17;
  if (cardHeight >= 90) return 31;
  if (cardHeight >= 64) return 25;
  return 19;
}

const ScheduleImageCanvas = forwardRef<SVGSVGElement, ScheduleImageCanvasProps>(
  function ScheduleImageCanvas({ festivalName, location, page }, ref) {
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
    const timelineTop = 330;
    const timelineBottom = !isUntimedOnly && untimedItems.length > 0 ? 1640 : 1760;
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
    const selectedCount = page.items.filter((item) => item.isSelected).length;
    const conflictCount = page.items.filter((item) => item.hasConflict).length;
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
        <rect width={canvasWidth} height={canvasHeight} fill="#090A1A" />
        <rect x="34" y="34" width="1012" height="1852" rx="44" fill="#0F1020" stroke="#292B42" strokeWidth="2" />

        <text x="68" y="106" fill="#A78BFA" fontSize="24" fontWeight="700" letterSpacing="2">
          FESTIBOM · MY SCHEDULE
        </text>
        <text x="68" y="166" fill="#FFFFFF" fontSize="42" fontWeight="800">
          {truncateText(festivalName, 25)}
        </text>
        <text x="68" y="212" fill="#C4C6D4" fontSize="24" fontWeight="600">
          {formatDate(page.performanceDate)}
          {location ? ` · ${truncateText(location, 22)}` : ""}
        </text>
        <text x="1012" y="106" fill="#8C90A6" fontSize="20" textAnchor="end">
          {page.pageCount > 1 ? `${page.pageIndex + 1} / ${page.pageCount}` : ""}
        </text>
        <text x="1012" y="212" fill="#8C90A6" fontSize="20" textAnchor="end">
          선택 {selectedCount}팀{conflictCount > 0 ? ` · 겹침 ${conflictCount}팀` : ""}
        </text>

        <line x1="68" y1="252" x2="1012" y2="252" stroke="#2B2D42" strokeWidth="2" />

        {isUntimedOnly ? (
          <text
            x="540"
            y="302"
            fill="#DDD6FE"
            fontSize="22"
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
              y="302"
              fill="#DDD6FE"
              fontSize="22"
              fontWeight="800"
              textAnchor="middle"
            >
              {truncateText(stage, page.stages.length === 3 ? 13 : 20)}
            </text>
          );
        })}

        <rect
          x={isUntimedOnly ? 68 : gridLeft}
          y={timelineTop}
          width={isUntimedOnly ? 944 : gridRight - gridLeft}
          height={timelineHeight}
          fill="#0B0C17"
          stroke="#2B2D42"
          strokeWidth="2"
        />

        {!isUntimedOnly && page.stages.slice(1).map((stage, index) => {
          const x = gridLeft + (index + 1) * stageWidth + index * stageGap + stageGap / 2;
          return <line key={stage} x1={x} y1={timelineTop} x2={x} y2={timelineBottom} stroke="#242638" strokeWidth="2" />;
        })}

        {!isUntimedOnly && hourMarkers.map((marker) => {
          const y = timelineTop + (marker - page.timelineStart) * minuteHeight;
          return (
            <g key={marker}>
              <line x1={gridLeft} y1={y} x2={gridRight} y2={y} stroke="#292B3E" strokeWidth="2" />
              <text x={leftAxisWidth} y={y + 8} fill="#8C90A6" fontSize="22" fontWeight="700" textAnchor="end">
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
          const fontSize = getArtistFontSize(item, cardHeight);
          const showTime = cardHeight >= 54;
          const maxCharacters = Math.max(5, Math.floor((cardWidth - 26) / (fontSize * 0.58)));
          const artistText = truncateText(item.artistName, maxCharacters);
          const cardFill = item.isSelected ? "#EDE9FE" : "#191B2A";
          const cardStroke = item.hasConflict ? "#FB923C" : item.isSelected ? "#7C3AED" : "#34374A";
          const primaryText = item.isSelected ? "#312E81" : "#A4A8B8";

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
                <text x={cardX + 14} y={cardY + 24} fill={item.isSelected ? "#6D5F9B" : "#777B8D"} fontSize="16" fontWeight="600">
                  {formatMinutes(item.startMinutes!)}–{formatMinutes(item.endMinutes!)}
                </text>
              )}
              <text
                x={cardX + 14}
                y={showTime ? cardY + Math.min(cardHeight - 14, 58) : cardY + cardHeight / 2 + fontSize * 0.35}
                fill={primaryText}
                fontSize={fontSize}
                fontWeight={item.isSelected ? "800" : "600"}
              >
                {artistText}
              </text>
              {item.hasConflict && (
                <g>
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
          />
        )}

        {!isUntimedOnly && untimedItems.length > 0 && (
          <g>
            <text x="68" y="1702" fill="#A78BFA" fontSize="20" fontWeight="800">시간 미정</text>
            <text x="68" y="1742" fill="#C4C6D4" fontSize="22">
              {truncateText(untimedItems.map((item) => item.artistName).join(" · "), 58)}
            </text>
          </g>
        )}

        <line x1="68" y1="1810" x2="1012" y2="1810" stroke="#2B2D42" strokeWidth="2" />
        <text x="68" y="1854" fill="#777B8D" fontSize="18">선택한 공연은 크게 표시됩니다.</text>
        <text x="1012" y="1854" fill="#A78BFA" fontSize="20" fontWeight="800" textAnchor="end">Festibom</text>
      </svg>
    );
  },
);

export default ScheduleImageCanvas;
