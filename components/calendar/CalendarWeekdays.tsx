const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function CalendarWeekdays() {
  return (
    <div className="pt-3">
      <div className="grid grid-cols-7 overflow-hidden rounded-2xl">
        {WEEKDAYS.map((weekday, index) => (
          <div
            key={weekday}
            className={[
              "flex h-11 items-center justify-center text-center text-[13px] font-semibold",
              index === 0
                ? "text-red-600"
                : index === 6
                  ? "text-blue-600"
                  : "text-black",
            ].join(" ")}
          >
            {weekday}
          </div>
        ))}
      </div>
    </div>
  );
}