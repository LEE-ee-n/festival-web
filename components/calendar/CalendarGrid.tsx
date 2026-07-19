import CalendarDayCell from "@/components/calendar/CalendarDayCell";
import type { Festival } from "@/lib/types";

type CalendarDay = {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

type CalendarGridProps = {
  calendarDays: CalendarDay[];
  festivalsByDate: Map<string, Festival[]>;
  festivalLanes: Map<number, number>;
  selectedDateKey: string;
  isLoading: boolean;
  getFestivalColorClass: (festivalId: number) => string;
  onPointerDown: (
    event: React.PointerEvent<HTMLDivElement>,
  ) => void;
  onPointerUp: (
    event: React.PointerEvent<HTMLDivElement>,
  ) => void;
  onSelectDate: (dateKey: string) => void;
  onSelectFestival: (festival: Festival) => void;
};

export default function CalendarGrid({
  calendarDays,
  festivalsByDate,
  festivalLanes,
  selectedDateKey,
  isLoading,
  getFestivalColorClass,
  onPointerDown,
  onPointerUp,
  onSelectDate,
  onSelectFestival,
}: CalendarGridProps) {
  return (
    // 달력 본체 전체: 스와이프 이벤트와 외곽 영역 관리
    <div
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      className="touch-pan-y overflow-hidden border border-slate-200"
    >
      {/* 날짜 셀을 7열로 배치하는 실제 달력 그리드 */}
      <div className="grid min-h-[calc(100dvh-250px)] grid-cols-7 auto-rows-fr [&>*]:border-b [&>*]:border-r [&>*:nth-child(7n)]:border-r-0 [&>*:nth-last-child(-n+7)]:border-b-0 sm:min-h-0 sm:auto-rows-auto">
        {calendarDays.map((day, dayIndex) => (
          // 날짜 한 칸의 표시와 동작은 CalendarDayCell이 담당
          <CalendarDayCell
            key={day.dateKey}
            day={day}
            dayIndex={dayIndex}
            festivals={
              festivalsByDate.get(day.dateKey) ?? []
            }
            festivalLanes={festivalLanes}
            isSelected={
              selectedDateKey === day.dateKey
            }
            isLoading={isLoading}
            getFestivalColorClass={
              getFestivalColorClass
            }
            onSelectDate={onSelectDate}
            onSelectFestival={onSelectFestival}
          />
        ))}
      </div>
    </div>
  );
}
