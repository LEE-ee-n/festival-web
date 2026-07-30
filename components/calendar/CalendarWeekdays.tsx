import { typography } from "@/lib/typography";

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

export default function CalendarWeekdays() {
  return (
    <div className="pt-[2px] sm:pt-3">
      <div className="grid grid-cols-7 overflow-hidden rounded-2xl">
        {WEEKDAYS.map((weekday, index) => (
          <div
            key={weekday}
            className={[
              `${typography.calendarWeekday} flex h-7 items-center justify-center text-center sm:h-11`,
              index === 5
                ? "text-festival-indigo"
                : index === 6
                  ? "text-festival-coral"
                  : "text-ink",
            ].join(" ")}
          >
            {weekday}
          </div>
        ))}
      </div>
    </div>
  );
}
