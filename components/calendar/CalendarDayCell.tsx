import type {
  CalendarDay,
  Festival,
  FestivalCalendarColor,
} from "@/lib/types";
import { getFestivalBarSegment } from "@/lib/calendarFestivalBar";
import { MAX_VISIBLE_FESTIVAL_LANES } from "@/lib/calendarFestivalLanes";
import { typography } from "@/lib/typography";

type CalendarDayCellProps = {
  day: CalendarDay;
  dayIndex: number;
  festivals: Festival[];
  festivalLanes: Map<number, number>;
  isSelected: boolean;
  isLoading: boolean;
  getFestivalColorClass: (
    festivalId: number,
    calendarColor?: FestivalCalendarColor | null,
  ) => string;
  onSelectDate: (dateKey: string) => void;
  onSelectFestival: (festival: Festival) => void;
};

const FESTIVAL_LANE_POSITION_CLASSES = [
  "top-0",
  "top-[22px] sm:top-[30px]",
  "top-[44px] sm:top-[60px]",
];

export default function CalendarDayCell({
  day,
  dayIndex,
  festivals,
  festivalLanes,
  isSelected,
  isLoading,
  getFestivalColorClass,
  onSelectDate,
  onSelectFestival,
}: CalendarDayCellProps) {
  const hasFestivals = festivals.length > 0;
  const visibleFestivals = festivals.filter(
    (festival) =>
      (festivalLanes.get(festival.id) ?? 0) < MAX_VISIBLE_FESTIVAL_LANES,
  );
  const hiddenFestivalCount = festivals.length - visibleFestivals.length;

  return (
    <button
      type="button"
      onClick={() => onSelectDate(day.dateKey)}
      className={[
        "relative min-h-0 border-line text-center transition sm:min-h-40",
        day.isCurrentMonth
          ? "text-ink"
          : "bg-surface-muted text-ink-muted",
        hasFestivals && day.isCurrentMonth
          ? "hover:bg-blue-50"
          : "hover:bg-surface-subtle",
        isSelected
          ? "z-10 ring-2 ring-inset ring-blue-500"
          : "",
      ].join(" ")}
    >
      <span
        className={[
          `${typography.calendarDate} absolute left-1 top-[2px] inline-flex h-6 min-w-6 items-center justify-center sm:left-2 sm:top-2 sm:h-7 sm:min-w-7`,
          dayIndex % 7 === 5 && !day.isToday
            ? "text-festival-indigo"
            : "",
          dayIndex % 7 === 6 && !day.isToday
            ? "text-festival-coral"
            : "",
        ].join(" ")}
      >
        <span
          className={
            day.isToday
              ? "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-surface-dark px-0.5 text-white sm:h-7 sm:min-w-7 sm:px-1"
              : undefined
          }
        >
          {day.dayNumber}
        </span>
      </span>

      {!isLoading && hiddenFestivalCount > 0 && (
        <span className={`${typography.calendarOverflow} absolute right-2 top-[2px] inline-flex h-6 items-center text-ink-tertiary sm:top-2 sm:h-7`}>
          +{hiddenFestivalCount}개
        </span>
      )}

      {isLoading ? (
        <div className="mx-auto mt-4 h-2 w-5 animate-pulse rounded-full bg-surface-strong" />
      ) : (
        hasFestivals && (
          <div className="relative mt-[26px] min-h-[64px] text-left sm:mt-11 sm:min-h-[84px]">
            {visibleFestivals.map((festival) => {
              const lane = festivalLanes.get(festival.id) ?? 0;
              const startsToday =
                festival.start_date === day.dateKey;

              const isRowStart = dayIndex % 7 === 0;
              const showName = startsToday || isRowStart;

              const { spanDays, endsInThisRow } =
                getFestivalBarSegment(
                  day.dateKey,
                  festival.end_date,
                  dayIndex,
                );

              return (
                <div
                  key={`${day.dateKey}-${festival.id}`}
                  className={[
                    "absolute left-0 right-0 h-5 sm:h-6",
                    FESTIVAL_LANE_POSITION_CLASSES[lane] ?? "top-0",
                  ].join(" ")}
                >
                  {showName && (
                    <div className="relative z-20 h-5 sm:h-6">
                      <div
                        role="button"
                        tabIndex={0}
                        title={festival.name.replace(
                          /^\d{4}\s*/,
                          "",
                        )}
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectFestival(festival);
                        }}
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();
                            event.stopPropagation();
                            onSelectFestival(festival);
                          }
                        }}
                        style={{
                          width: `calc(${spanDays * 100}% + ${
                            spanDays - 1
                          }px)`,
                        }}
                        className={[
                          "absolute left-0 top-0 flex h-5 cursor-pointer items-center overflow-hidden px-2 text-left hover:opacity-90 sm:h-6",
                          getFestivalColorClass(
                            festival.id,
                            festival.calendar_color,
                          ),
                          startsToday ? "rounded-l-md" : "",
                          endsInThisRow ? "rounded-r-md" : "",
                        ].join(" ")}
                      >
                        <span className={`${typography.calendarEvent} whitespace-nowrap text-festival-night sm:translate-y-px`}>
                          {festival.name.replace(
                            /^\d{4}\s*/,
                            "",
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          </div>
        )
      )}
    </button>
  );
}
