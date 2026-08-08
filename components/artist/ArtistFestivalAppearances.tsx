"use client";

import Link from "next/link";
import { CalendarCheck2 } from "lucide-react";
import { useMemo, useState } from "react";

import { formatFestivalPeriod } from "@/lib/calendar";
import { useUserScheduleList } from "@/lib/hooks/useUserScheduleList";
import { typography } from "@/lib/typography";
import type { PublicArtistFestivalAppearance } from "@/lib/types";

type FestivalFilter = "ongoing" | "scheduled" | "ended" | "all";

const FILTERS: Array<{ value: FestivalFilter; label: string }> = [
  { value: "ongoing", label: "진행" },
  { value: "scheduled", label: "예정" },
  { value: "ended", label: "종료" },
  { value: "all", label: "전체" },
];

function getFestival(row: PublicArtistFestivalAppearance) {
  return Array.isArray(row.festivals) ? row.festivals[0] : row.festivals;
}

function getInitialFilter(rows: PublicArtistFestivalAppearance[]): FestivalFilter {
  const statuses = new Set(rows.map((row) => getFestival(row)?.status).filter(Boolean));
  if (statuses.has("ongoing")) return "ongoing";
  if (statuses.has("scheduled")) return "scheduled";
  if (statuses.has("ended")) return "ended";
  return "all";
}

export default function ArtistFestivalAppearances({
  festivalRows,
}: {
  festivalRows: PublicArtistFestivalAppearance[];
}) {
  const [filter, setFilter] = useState<FestivalFilter>(() => getInitialFilter(festivalRows));
  const schedule = useUserScheduleList();
  const scheduledFestivalIds = new Set(schedule.items.map((item) => item.festivalId));
  const visibleRows = useMemo(
    () => festivalRows.filter((row) => filter === "all" || getFestival(row)?.status === filter),
    [festivalRows, filter],
  );

  return (
    <section className="mt-6 border-t border-line px-5 pt-6 sm:px-6 sm:pt-8">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className={`${typography.sectionTitle} text-ink`}>출연 페스티벌</h2>
          {festivalRows.length > 0 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="출연 페스티벌 상태 필터">
              {FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFilter(option.value)}
                  aria-pressed={filter === option.value}
                  className={`${typography.button} rounded-xl border px-3 py-2 transition-colors ${filter === option.value ? "border-line-strong bg-surface-muted text-ink" : "border-line-strong bg-surface text-ink-secondary hover:bg-surface-muted"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {festivalRows.length === 0 ? (
          <p className="mt-4 text-ink-tertiary">등록된 출연 페스티벌이 없습니다.</p>
        ) : visibleRows.length === 0 ? (
          <p className="mt-5 text-sm text-ink-tertiary">해당 상태의 출연 페스티벌이 없습니다.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {visibleRows.map((row, index) => {
              const festival = getFestival(row);
              if (!festival) return null;

              return (
                <Link
                  key={`${festival.id}-${index}`}
                  href={`/festival/${festival.id}`}
                  className="block rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 className={`${typography.cardTitle} text-ink`}>{festival.name}</h3>
                      {scheduledFestivalIds.has(festival.id) && (
                        <CalendarCheck2
                          className="h-5 w-5 shrink-0 text-blue-600"
                          aria-label="내 공연 일정에 등록된 페스티벌"
                        />
                      )}
                    </div>
                    {row.performance_date && (
                      <p className={`${typography.meta} text-ink-tertiary`}>
                        {[row.performance_date, row.stage_name, "출연"].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className={`${typography.metaStrong} text-ink-secondary`}>
                      {formatFestivalPeriod(festival.start_date, festival.end_date)}
                    </p>
                    {(festival.location || festival.region) && (
                      <p className={`${typography.meta} text-ink-tertiary`}>
                        {[festival.region, festival.location].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
