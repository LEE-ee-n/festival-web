import CalendarDayCell from "@/components/calendar/CalendarDayCell";
import type { CalendarSwipeHandlers } from "@/components/calendar/useCalendarSwipe";
import type {
  CalendarDay,
  Festival,
  FestivalCalendarColor,
} from "@/lib/types";

type CalendarGridProps = {
  calendarDays: CalendarDay[];
  festivalsByDate: Map<string, Festival[]>;
  festivalLanes: Map<number, number>;
  selectedDateKey: string;
  isLoading: boolean;
  getFestivalColorClass: (
    festivalId: number,
    calendarColor?: FestivalCalendarColor | null,
  ) => string;
  swipeHandlers: CalendarSwipeHandlers;
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
  swipeHandlers,
  onSelectDate,
  onSelectFestival,
}: CalendarGridProps) {
  return (
    // 달력 본체 전체: 스와이프 이벤트와 외곽 영역 관리
    <div
      {...swipeHandlers}
      className="touch-pan-y overflow-hidden border border-line"
    >
      {/* 날짜 셀을 7열로 배치하는 실제 달력 그리드 */}
      <div className="grid grid-cols-7 auto-rows-[92px] [&>*]:border-b [&>*]:border-r [&>*:nth-child(7n)]:border-r-0 [&>*:nth-last-child(-n+7)]:border-b-0 sm:auto-rows-auto">
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
