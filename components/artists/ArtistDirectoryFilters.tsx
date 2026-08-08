"use client";

import { Heart, Search } from "lucide-react";

import {
  ENGLISH_INITIAL_FILTERS,
  KOREAN_INITIAL_FILTERS,
  type ArtistDirectoryFilter,
} from "@/lib/artists/artistDirectory";
import { typography } from "@/lib/typography";

type ArtistDirectoryFiltersProps = {
  keyword: string;
  onKeywordChange: (value: string) => void;
  initialFilter: ArtistDirectoryFilter;
  onInitialFilterChange: (value: ArtistDirectoryFilter) => void;
  favoriteOnly: boolean;
  onFavoriteOnlyClick: () => void;
  isFavoriteLoading: boolean;
};

function FilterButton({
  label,
  value,
  activeValue,
  onClick,
}: {
  label: string;
  value: ArtistDirectoryFilter;
  activeValue: ArtistDirectoryFilter;
  onClick: (value: ArtistDirectoryFilter) => void;
}) {
  const isActive = value === activeValue;

  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      aria-pressed={isActive}
      className={`${typography.metaStrong} shrink-0 border-b-2 px-1 py-1 transition-colors ${
        isActive
          ? "border-ink text-ink"
          : "border-transparent text-ink-tertiary hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

export default function ArtistDirectoryFilters({
  keyword,
  onKeywordChange,
  initialFilter,
  onInitialFilterChange,
  favoriteOnly,
  onFavoriteOnlyClick,
  isFavoriteLoading,
}: ArtistDirectoryFiltersProps) {
  return (
    <section className="space-y-3">
      <label className="relative block">
        <span className="sr-only">아티스트 이름 검색</span>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary"
          aria-hidden="true"
        />
        <input
          type="search"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="아티스트 이름 검색"
          className="h-12 w-full rounded-xl border border-line-strong bg-surface pl-11 pr-4 text-sm text-ink outline-none focus:border-ink-muted"
        />
      </label>

      <div className="flex items-center gap-4 overflow-x-auto pb-1">
        <FilterButton label="전체" value="all" activeValue={initialFilter} onClick={onInitialFilterChange} />
        <FilterButton label="0-9" value="number" activeValue={initialFilter} onClick={onInitialFilterChange} />
        <button
          type="button"
          onClick={onFavoriteOnlyClick}
          disabled={isFavoriteLoading}
          aria-pressed={favoriteOnly}
          className={`${typography.metaStrong} inline-flex shrink-0 items-center gap-1.5 border-b-2 px-1 py-1 transition-colors disabled:opacity-50 ${
            favoriteOnly
              ? "border-rose-600 text-rose-700"
              : "border-transparent text-ink-tertiary hover:text-ink"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${favoriteOnly ? "fill-current" : ""}`} aria-hidden="true" />
          좋아하는 아티스트만
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1" aria-label="한글 초성 필터">
        {KOREAN_INITIAL_FILTERS.map((initial) => (
          <FilterButton key={initial} label={initial} value={initial} activeValue={initialFilter} onClick={onInitialFilterChange} />
        ))}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1" aria-label="영문 알파벳 필터">
        {ENGLISH_INITIAL_FILTERS.map((initial) => (
          <FilterButton key={initial} label={initial} value={initial} activeValue={initialFilter} onClick={onInitialFilterChange} />
        ))}
      </div>
    </section>
  );
}
