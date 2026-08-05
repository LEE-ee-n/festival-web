import Link from "next/link";
import { CalendarDays, LayoutGrid } from "lucide-react";

import FestivalSearch from "@/components/calendar/FestivalSearch";
import FestivalRegionFilter from "@/components/festivals/filters/FestivalRegionFilter";
import type {
  PublicFestivalRegion,
  PublicFestivalRegionFilter,
} from "@/lib/festivals/publicFestivalOverview";
import type { PublicArtistSearchResult } from "@/lib/publicSearch";
import type { Festival } from "@/lib/types";
import { typography } from "@/lib/typography";

type CalendarHeaderProps = {
  currentYear: number;
  currentMonthIndex: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onMoveToToday: () => void;
  regions: PublicFestivalRegion[];
  activeRegion: PublicFestivalRegionFilter;
  onRegionChange: (value: PublicFestivalRegionFilter) => void;
  onSelectSearchFestival: (festival: Festival) => void;
  onSelectSearchArtist: (artist: PublicArtistSearchResult) => void;
};

export default function CalendarHeader({
  currentYear,
  currentMonthIndex,
  onPreviousMonth,
  onNextMonth,
  onMoveToToday,
  regions,
  activeRegion,
  onRegionChange,
  onSelectSearchFestival,
  onSelectSearchArtist,
}: CalendarHeaderProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center px-0 pt-[10px] sm:px-6 sm:pt-3">
      <div className="flex items-center gap-1 justify-self-start sm:gap-2">
        <div className="sm:hidden">
          <FestivalSearch
            onSelectFestival={onSelectSearchFestival}
            onSelectArtist={onSelectSearchArtist}
          />
        </div>
        <div className="sm:hidden">
          <FestivalRegionFilter
            regions={regions}
            value={activeRegion}
            onChange={onRegionChange}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onPreviousMonth}
          aria-label="이전 달"
          className="hidden h-7 w-7 items-center justify-center text-2xl leading-none text-ink-secondary transition hover:text-ink sm:flex"
        >
          ‹
        </button>

        <h1 className={`${typography.calendarTitle} text-ink`}>
          {currentYear}년 {currentMonthIndex + 1}월
        </h1>

        <button
          type="button"
          onClick={onNextMonth}
          aria-label="다음 달"
          className="hidden h-7 w-7 items-center justify-center text-2xl leading-none text-ink-secondary transition hover:text-ink sm:flex"
        >
          ›
        </button>
      </div>

      <div className="flex items-center gap-1 justify-self-end sm:gap-2">
        <div className="hidden sm:block">
          <FestivalSearch
            onSelectFestival={onSelectSearchFestival}
            onSelectArtist={onSelectSearchArtist}
          />
        </div>
        <div className="hidden sm:block">
          <FestivalRegionFilter
            regions={regions}
            value={activeRegion}
            onChange={onRegionChange}
            desktopAlign="right"
          />
        </div>
        <Link
          href="/festivals"
          aria-label="전체 페스티벌 보기"
          title="전체 페스티벌 보기"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-secondary transition hover:bg-surface-muted hover:ring-1 hover:ring-slate-300"
        >
          <LayoutGrid size={22} strokeWidth={2} />
        </Link>
        <button
          type="button"
          onClick={onMoveToToday}
          aria-label="오늘로 이동"
          title="오늘로 이동"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-secondary transition hover:bg-surface-muted hover:ring-1 hover:ring-slate-300"
        >
          <CalendarDays size={22} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
