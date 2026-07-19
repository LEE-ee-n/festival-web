import type { Festival } from "@/lib/types";
import { getFestivalBarSegment } from "@/lib/calendarFestivalBar";
import { MAX_VISIBLE_FESTIVAL_LANES } from "@/lib/calendarFestivalLanes";

type CalendarDay = {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

type CalendarDayCellProps = {
  day: CalendarDay;
  dayIndex: number;
  festivals: Festival[];
  festivalLanes: Map<number, number>;
  isSelected: boolean;
  isLoading: boolean;
  getFestivalColorClass: (festivalId: number) => string;
  onSelectDate: (dateKey: string) => void;
  onSelectFestival: (festival: Festival) => void;
};

const FESTIVAL_LANE_POSITION_CLASSES = [
  "top-0",
  "top-6 sm:top-[30px]",
  "top-12 sm:top-[60px]",
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
        "relative min-h-0 border-slate-200 text-center transition sm:min-h-40",
        day.isCurrentMonth
          ? "text-slate-800"
          : "bg-gray-100 text-gray-400",
        hasFestivals && day.isCurrentMonth
          ? "hover:bg-blue-50"
          : "hover:bg-slate-50",
        isSelected
          ? "z-10 ring-2 ring-inset ring-blue-500"
          : "",
      ].join(" ")}
    >
      <span
        className={[
          "absolute left-2 top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold sm:h-7 sm:min-w-7 sm:text-[15px]",
          day.isToday ? "bg-slate-900 text-white" : "",
          dayIndex % 7 === 0 && !day.isToday
            ? "text-red-600"
            : "",
          dayIndex % 7 === 6 && !day.isToday
            ? "text-blue-600"
            : "",
        ].join(" ")}
      >
        {day.dayNumber}
      </span>

      {isLoading ? (
        <div className="mx-auto mt-4 h-2 w-5 animate-pulse rounded-full bg-slate-200" />
      ) : (
        hasFestivals && (
          <div className="relative mt-11 min-h-[72px] text-left sm:min-h-[84px]">
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
                    "absolute left-0 right-0 h-6",
                    FESTIVAL_LANE_POSITION_CLASSES[lane] ?? "top-0",
                  ].join(" ")}
                >
                  {showName && (
                    <div className="relative z-20 h-6">
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
                          "absolute left-0 top-0 flex h-6 cursor-pointer items-center gap-1.5 overflow-hidden px-2 text-left hover:opacity-90",
                          getFestivalColorClass(festival.id),
                          startsToday ? "rounded-l-full" : "",
                          endsInThisRow ? "rounded-r-full" : "",
                        ].join(" ")}
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" />

                        <span className="whitespace-nowrap text-[11px] font-semibold text-white">
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

            {hiddenFestivalCount > 0 && (
              <span className="absolute left-1 top-[72px] text-[10px] font-medium text-slate-500 sm:top-[90px]">
                +{hiddenFestivalCount}개
              </span>
            )}
          </div>
        )
      )}
    </button>
  );
}
