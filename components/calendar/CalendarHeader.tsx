type CalendarHeaderProps = {
  currentYear: number;
  currentMonthIndex: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onMoveToToday: () => void;
};

export default function CalendarHeader({
  currentYear,
  currentMonthIndex,
  onPreviousMonth,
  onNextMonth,
  onMoveToToday,
}: CalendarHeaderProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 pt-3 sm:px-6">
      <div className="flex items-center gap-2 justify-self-start">
        <button
          type="button"
          onClick={onPreviousMonth}
          aria-label="이전 달"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl leading-none text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={onNextMonth}
          aria-label="다음 달"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl leading-none text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          ›
        </button>
      </div>

      <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
        {currentYear}년 {currentMonthIndex + 1}월
      </h1>

      <button
        type="button"
        onClick={onMoveToToday}
        className="justify-self-end rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        오늘
      </button>
    </div>
  );
}