import Link from "next/link";
import { CalendarDays, LayoutGrid } from "lucide-react";

import FestivalSearch from "@/components/calendar/FestivalSearch";
import type { PublicArtistSearchResult } from "@/lib/publicSearch";
import type { Festival } from "@/lib/types";
import { typography } from "@/lib/typography";

type CalendarHeaderProps = {
  currentYear: number;
  currentMonthIndex: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onMoveToToday: () => void;
  onSelectSearchFestival: (festival: Festival) => void;
  onSelectSearchArtist: (artist: PublicArtistSearchResult) => void;
};

export default function CalendarHeader({
  currentYear,
  currentMonthIndex,
  onPreviousMonth,
  onNextMonth,
  onMoveToToday,
  onSelectSearchFestival,
  onSelectSearchArtist,
}: CalendarHeaderProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 pt-[10px] sm:px-6 sm:pt-3">
      <div className="hidden items-center gap-2 justify-self-start sm:flex">
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

      <div className="justify-self-start sm:hidden">
        <FestivalSearch
          onSelectFestival={onSelectSearchFestival}
          onSelectArtist={onSelectSearchArtist}
        />
      </div>

      <h1 className={`${typography.calendarTitle} text-slate-950`}>
        {currentYear}년 {currentMonthIndex + 1}월
      </h1>

      <div className="flex items-center gap-2 justify-self-end">
        <div className="hidden sm:block">
          <FestivalSearch
            onSelectFestival={onSelectSearchFestival}
            onSelectArtist={onSelectSearchArtist}
          />
        </div>
        <Link
          href="/festivals"
          aria-label="전체 페스티벌 보기"
          title="전체 페스티벌 보기"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 hover:ring-1 hover:ring-slate-300"
        >
          <LayoutGrid size={22} strokeWidth={2} />
        </Link>
        <button
          type="button"
          onClick={onMoveToToday}
          aria-label="오늘로 이동"
          title="오늘로 이동"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 hover:ring-1 hover:ring-slate-300"
        >
          <CalendarDays size={22} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
