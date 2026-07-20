"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";
import type { Festival } from "@/lib/types";

type FestivalSearchProps = {
  onSelectFestival: (festival: Festival) => void;
};

const FESTIVAL_SELECT_COLUMNS = `
  id,
  name,
  start_date,
  end_date,
  location,
  address,
  region,
  category,
  description,
  official_url,
  thumbnail_url,
  price_info,
  price_type,
  program_info,
  source_url,
  slug,
  status,
  confidence_score,
  verification_status,
  created_at,
  updated_at
`;

function normalizeSearchText(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

async function searchFestivals(keyword: string) {
  const normalizedKeyword = normalizeSearchText(keyword);
  const columns = ["name", "search_aliases"];

  if (normalizedKeyword) {
    columns.push("normalized_name");
  }

  const results = await Promise.all(
    columns.map((column) =>
      supabase
        .from("festivals")
        .select(FESTIVAL_SELECT_COLUMNS)
        .eq("verification_status", "approved")
        .neq("status", "cancelled")
        .ilike(
          column,
          `%${column === "normalized_name" ? normalizedKeyword : keyword}%`,
        )
        .order("start_date", { ascending: true })
        .limit(20),
    ),
  );

  const failedResult = results.find((result) => result.error);
  if (failedResult?.error) throw failedResult.error;

  return Array.from(
    new Map(
      results
        .flatMap((result) => (result.data ?? []) as Festival[])
        .map((festival) => [festival.id, festival]),
    ).values(),
  ).sort((left, right) =>
    left.start_date.localeCompare(right.start_date),
  );
}

export default function FestivalSearch({
  onSelectFestival,
}: FestivalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<Festival[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const searchKeyword = keyword.trim();
    if (!isOpen || !searchKeyword) return;

    let isCancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        setErrorMessage(null);
        const nextResults = await searchFestivals(searchKeyword);

        if (!isCancelled) setResults(nextResults);
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "축제 검색에 실패했습니다.",
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

  function closeSearch() {
    setIsOpen(false);
    setKeyword("");
    setResults([]);
    setErrorMessage(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="축제 검색"
        className="flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm sm:hidden"
      >
        <Search size={17} />
        검색
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/45 p-4 sm:hidden">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="축제 검색"
            className="mx-auto mt-16 max-h-[75dvh] max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-slate-200 p-4">
              <Search className="shrink-0 text-slate-500" size={19} />
              <input
                autoFocus
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  if (!event.target.value.trim()) setResults([]);
                }}
                placeholder="축제명 검색"
                className="min-w-0 flex-1 border-0 bg-transparent text-base outline-none"
              />
              <button
                type="button"
                onClick={closeSearch}
                aria-label="검색 닫기"
                className="rounded-lg p-2 text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[calc(75dvh-77px)] overflow-y-auto p-3">
              {isSearching && (
                <p className="p-4 text-center text-sm text-slate-500">
                  검색 중...
                </p>
              )}
              {errorMessage && (
                <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {errorMessage}
                </p>
              )}
              {!isSearching && keyword.trim() && results.length === 0 && !errorMessage && (
                <p className="p-4 text-center text-sm text-slate-500">
                  검색 결과가 없습니다.
                </p>
              )}
              <div className="space-y-2">
                {results.map((festival) => (
                  <button
                    key={festival.id}
                    type="button"
                    onClick={() => {
                      onSelectFestival(festival);
                      closeSearch();
                    }}
                    className="w-full rounded-xl border border-slate-200 p-3 text-left"
                  >
                    <p className="font-bold text-slate-900">{festival.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {festival.start_date === festival.end_date
                        ? festival.start_date
                        : `${festival.start_date} ~ ${festival.end_date}`}
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
