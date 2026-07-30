"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  searchPublicContent,
  type PublicArtistSearchResult,
  type PublicSearchResults,
} from "@/lib/publicSearch";
import type { Festival } from "@/lib/types";
import { typography } from "@/lib/typography";

type FestivalSearchProps = {
  onSelectFestival: (festival: Festival) => void;
  onSelectArtist: (artist: PublicArtistSearchResult) => void;
};

const EMPTY_RESULTS: PublicSearchResults = {
  festivals: [],
  artists: [],
};

export default function FestivalSearch({
  onSelectFestival,
  onSelectArtist,
}: FestivalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [results, setResults] =
    useState<PublicSearchResults>(EMPTY_RESULTS);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  useEffect(() => {
    const searchKeyword = keyword.trim();
    if (!isOpen || !searchKeyword) return;

    let isCancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        setErrorMessage(null);
        const nextResults =
          await searchPublicContent(searchKeyword);

        if (!isCancelled) setResults(nextResults);
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "검색에 실패했습니다.",
          );
        }
      } finally {
        if (!isCancelled) setIsSearching(false);
      }
    }, 300);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [isOpen, keyword]);

  function clearResults() {
    setResults(EMPTY_RESULTS);
    setErrorMessage(null);
  }

  function closeSearch() {
    setIsOpen(false);
    setKeyword("");
    clearResults();
  }

  const hasResults =
    results.festivals.length > 0 || results.artists.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="축제 및 아티스트 검색"
        title="축제 및 아티스트 검색"
        className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-secondary transition hover:bg-surface-muted hover:ring-1 hover:ring-slate-300"
      >
        <Search size={22} strokeWidth={2} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-surface-dark/45 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="축제 및 아티스트 검색"
            className="mx-auto mt-16 max-h-[75dvh] max-w-md overflow-hidden rounded-2xl bg-surface shadow-2xl sm:mt-24"
          >
            <div className="flex items-center gap-2 border-b border-line p-4">
              <Search
                className="shrink-0 text-ink-tertiary"
                size={19}
              />
              <input
                autoFocus
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  if (!event.target.value.trim()) clearResults();
                }}
                placeholder="축제 또는 아티스트 검색"
                className={`${typography.searchInput} min-w-0 flex-1 border-0 bg-transparent outline-none`}
              />
              <button
                type="button"
                onClick={closeSearch}
                aria-label="검색 닫기"
                className="rounded-lg p-2 text-ink-tertiary"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[calc(75dvh-77px)] overflow-y-auto p-3">
              {isSearching && (
                <p className={`${typography.body} p-4 text-center text-ink-tertiary`}>
                  검색 중...
                </p>
              )}
              {errorMessage && (
                <p className={`${typography.label} rounded-xl bg-red-50 p-3 text-red-700`}>
                  {errorMessage}
                </p>
              )}
              {!isSearching &&
                keyword.trim() &&
                !hasResults &&
                !errorMessage && (
                  <p className={`${typography.body} p-4 text-center text-ink-tertiary`}>
                    검색 결과가 없습니다.
                  </p>
                )}

              <div className="space-y-2">
                {results.festivals.map((festival) => (
                  <button
                    key={`festival-${festival.id}`}
                    type="button"
                    onClick={() => {
                      onSelectFestival(festival);
                      closeSearch();
                    }}
                    className="w-full rounded-xl border border-line p-3 text-left transition hover:border-line-strong hover:bg-surface-subtle"
                  >
                    <p className={`${typography.subsectionTitle} text-ink`}>
                      {festival.name}
                    </p>
                    <p className={`${typography.caption} mt-1 text-ink-tertiary`}>
                      {festival.start_date === festival.end_date
                        ? festival.start_date
                        : `${festival.start_date} ~ ${festival.end_date}`}
                    </p>
                  </button>
                ))}

                {results.artists.map((artist) => (
                  <button
                    key={`artist-${artist.id}`}
                    type="button"
                    onClick={() => {
                      onSelectArtist(artist);
                      closeSearch();
                    }}
                    className="w-full rounded-xl border border-line p-3 text-left transition hover:border-line-strong hover:bg-surface-subtle"
                  >
                    <p className={`${typography.subsectionTitle} text-ink`}>
                      {artist.name}
                    </p>
                    <p className={`${typography.caption} mt-1 truncate text-ink-tertiary`}>
                      {artist.aliases.length > 0
                        ? artist.aliases.join(", ")
                        : artist.normalized_name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
