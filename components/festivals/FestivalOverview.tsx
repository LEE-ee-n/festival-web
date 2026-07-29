"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { formatFestivalPeriod, toDateKey } from "@/lib/calendar";
import {
  countPublicFestivalStates,
  getPublicFestivalState,
  sortPublicFestivals,
  type PublicFestivalState,
} from "@/lib/festivals/publicFestivalOverview";
import { supabase } from "@/lib/supabase/client";
import { typography } from "@/lib/typography";

type FestivalOverviewItem = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  location: string | null;
  region: string | null;
  thumbnail_url: string | null;
};

type FestivalFilter = "all" | PublicFestivalState;

const FILTERS: Array<{
  value: FestivalFilter;
  label: string;
}> = [
  { value: "all", label: "전체" },
  { value: "scheduled", label: "예정" },
  { value: "ongoing", label: "진행중" },
  { value: "ended", label: "종료" },
];

const STATE_LABELS: Record<PublicFestivalState, string> = {
  scheduled: "예정",
  ongoing: "진행중",
  ended: "종료",
};

export default function FestivalOverview() {
  const [festivals, setFestivals] = useState<
    FestivalOverviewItem[]
  >([]);
  const [activeFilter, setActiveFilter] =
    useState<FestivalFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null,
  );
  const todayKey = toDateKey(new Date());

  useEffect(() => {
    let isCancelled = false;

    async function loadFestivals() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const { data, error } = await supabase
          .from("festivals")
          .select(`
            id,
            name,
            start_date,
            end_date,
            location,
            region,
            thumbnail_url
          `)
          .eq("verification_status", "approved")
          .in("status", ["scheduled", "ongoing", "ended"])
          .order("start_date", { ascending: true });

        if (error) {
          throw error;
        }

        if (!isCancelled) {
          setFestivals(data ?? []);
        }
      } catch (error) {
        console.error(error);

        if (!isCancelled) {
          setErrorMessage("페스티벌 목록을 불러오지 못했습니다.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadFestivals();

    return () => {
      isCancelled = true;
    };
  }, []);

  const counts = useMemo(
    () => countPublicFestivalStates(festivals, todayKey),
    [festivals, todayKey],
  );

  const visibleFestivals = useMemo(() => {
    const filteredFestivals =
      activeFilter === "all"
        ? festivals
        : festivals.filter(
            (festival) =>
              getPublicFestivalState(festival, todayKey) ===
              activeFilter,
          );

    return sortPublicFestivals(filteredFestivals, todayKey);
  }, [activeFilter, festivals, todayKey]);

  return (
    <section>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              aria-pressed={isActive}
              className={[
                `${typography.button} rounded-full border bg-white px-4 py-2 text-festival-night transition`,
                isActive
                  ? "border-festival-night"
                  : "border-festival-night/20 hover:border-festival-night/50",
              ].join(" ")}
            >
              {filter.label}({counts[filter.value]})
            </button>
          );
        })}
      </div>

      {errorMessage && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      )}

      {isLoading ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-[4/5] rounded-2xl bg-slate-100" />
              <div className="mt-3 h-5 rounded bg-slate-100" />
              <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : visibleFestivals.length === 0 ? (
        <p className={`${typography.body} mt-8 rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-500`}>
          해당 상태의 페스티벌이 없습니다.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {visibleFestivals.map((festival) => {
            const state = getPublicFestivalState(
              festival,
              todayKey,
            );

            return (
              <Link
                key={festival.id}
                href={`/festival/${festival.id}`}
                className="group min-w-0"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100">
                  {festival.thumbnail_url ? (
                    <>
                      {/* External thumbnail hosts are configured by administrators. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={festival.thumbnail_url}
                        alt={`${festival.name} 대표 이미지`}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-400">
                      대표 이미지 준비 중
                    </div>
                  )}

                  <span
                    className={`${typography.badge} absolute right-3 top-3 rounded-full border border-festival-night/20 bg-white px-2.5 py-1 text-festival-night shadow-sm`}
                  >
                    {STATE_LABELS[state]}
                  </span>
                </div>

                <h2 className={`${typography.subsectionTitle} mt-3 line-clamp-2 leading-snug text-slate-950 group-hover:underline`}>
                  {festival.name}
                </h2>
                <p className={`${typography.meta} mt-1 text-slate-500`}>
                  {formatFestivalPeriod(
                    festival.start_date,
                    festival.end_date,
                  )}
                </p>
                <p className={`${typography.meta} mt-1 truncate text-slate-500`}>
                  {festival.location ||
                    festival.region ||
                    "장소 확인 중"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
