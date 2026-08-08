"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

import ScheduleItemRow from "@/components/mypage/ScheduleItemRow";
import type { UserScheduleListItem } from "@/lib/schedule/userScheduleItems";
import { typography } from "@/lib/typography";

type ScheduleListProps = {
  items: UserScheduleListItem[];
  favoriteArtistIds: number[];
};

type ScheduleGroup = {
  key: string;
  date: string | null;
  festivalId: number;
  festivalName: string;
  location: string | null;
  items: UserScheduleListItem[];
};

function formatPerformanceDate(date: string | null) {
  if (!date) return "날짜 미정";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00+09:00`));
}

function groupScheduleItems(items: UserScheduleListItem[]) {
  return items.reduce<Map<string, ScheduleGroup>>((groups, item) => {
    const key = [
      item.performanceDate ?? "undated",
      item.festivalId,
      item.festivalLocation ?? "",
    ].join("::");
    const group = groups.get(key) ?? {
      key,
      date: item.performanceDate,
      festivalId: item.festivalId,
      festivalName: item.festivalName,
      location: item.festivalLocation,
      items: [],
    };

    group.items.push(item);
    groups.set(key, group);
    return groups;
  }, new Map());
}

export default function ScheduleList({
  items,
  favoriteArtistIds,
}: ScheduleListProps) {
  const [collapsedOverrides, setCollapsedOverrides] = useState<Map<string, boolean>>(
    () => new Map(),
  );

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong px-5 py-10 text-center text-sm text-ink-tertiary">
        아직 선택한 공연 일정이 없습니다.
      </div>
    );
  }

  const groups = [...groupScheduleItems(items).values()];
  const favoriteArtistIdSet = new Set(favoriteArtistIds);

  function toggleGroup(key: string, isCollapsed: boolean) {
    setCollapsedOverrides((current) => {
      const next = new Map(current);
      next.set(key, !isCollapsed);
      return next;
    });
  }

  return (
    <div className="border-t border-line">
      {groups.map((group, index) => {
        const isCollapsed = collapsedOverrides.get(group.key) ?? (index !== 0);
        const showDate = index === 0 || groups[index - 1].date !== group.date;
        const sectionSpacing = index === 0
          ? ""
          : showDate
            ? "pt-6"
            : "pt-5";

        return (
          <section
            key={group.key}
            className={`${sectionSpacing} pb-2`}
          >
            {showDate && (
              <h3 className={`${typography.subsectionTitle} px-1 pt-5 pb-1 text-ink sm:px-3`}>
                {formatPerformanceDate(group.date)}
              </h3>
            )}

            <div className="mx-4 flex items-center gap-3 border-b border-line px-1 pt-2 pb-3 sm:mx-6 sm:px-3">
              <div className="flex min-w-0 items-center gap-3">
                <Link
                  href={`/festival/${group.festivalId}`}
                  className={`${typography.metaStrong} min-w-0 truncate text-ink-secondary hover:underline`}
                >
                  {group.festivalName}
                </Link>
                {group.location && (
                  <span className={`${typography.meta} min-w-0 truncate text-ink-tertiary`}>
                    {group.location}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key, isCollapsed)}
                  aria-expanded={!isCollapsed}
                  aria-label={`${group.festivalName} 일정 ${isCollapsed ? "펼치기" : "접기"}`}
                  className="shrink-0 p-1 text-ink-tertiary hover:text-ink"
                >
                  <ChevronRight
                    className={`h-5 w-5 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>

            {!isCollapsed && (
              <div className="mx-4 sm:mx-6">
                <div className={`${typography.metaStrong} hidden grid-cols-[minmax(180px,1.4fr)_140px_minmax(150px,1fr)] gap-4 border-b border-line px-3 py-3 text-ink-tertiary sm:grid`}>
                  <span className="text-center">아티스트</span>
                  <span className="text-center">시간</span>
                  <span className="text-center">무대</span>
                </div>
                {group.items.map((item) => (
                  <ScheduleItemRow
                    key={item.festivalArtistId}
                    item={item}
                    isFavorite={favoriteArtistIdSet.has(item.artistId)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
