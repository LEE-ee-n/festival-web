"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { MapPin, Music2 } from "lucide-react";

import { useFestivalRecordDetail } from "@/lib/hooks/useFestivalRecordDetail";
import { typography } from "@/lib/typography";
import type { FestivalExperienceStatus } from "@/lib/diaries/festivalDiaries";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(`${date}T00:00:00+09:00`));
}

const STATUS_LABELS: Record<FestivalExperienceStatus, string> = {
  watched: "봤어요",
  briefly: "잠깐 봤어요",
  missed: "못 봐서 아쉬워요",
};

export default function FestivalRecordDetailView({ recordId }: { recordId: number }) {
  const state = useFestivalRecordDetail(recordId);
  if (state.isLoading) return <p className="text-sm text-ink-muted">기록을 불러오는 중...</p>;
  if (!state.isAuthenticated) return <p className="text-sm text-ink-tertiary">로그인이 필요합니다.</p>;
  if (state.errorMessage || !state.record) return <p className="text-sm text-red-600">{state.errorMessage || "기록을 찾을 수 없습니다."}</p>;

  const record = state.record;
  const heroImage = record.coverImageUrl || record.festivalThumbnailUrl;
  const memoCount = record.performances.filter((item) => item.memo).length;
  const favorite = record.performances.find((item) => item.recordPerformanceId === record.favoritePerformanceId)
    ?? [...record.performances].filter((item) => item.rating).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
  const performanceGroups = record.performances.reduce<Array<{ date: string; items: typeof record.performances }>>((groups, item) => {
    const date = item.performanceDate ?? "날짜 미정";
    const current = groups.at(-1);
    if (current?.date === date) current.items.push(item);
    else groups.push({ date, items: [item] });
    return groups;
  }, []);

  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
      <header className="relative min-h-[420px] bg-surface-dark text-white">
        {heroImage && <><div className="absolute inset-0"><img src={heroImage} alt="" className="h-full w-full object-cover" /></div><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" /></>}
        <div className="relative flex min-h-[420px] flex-col justify-end p-6 sm:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="text-3xl font-black sm:text-5xl">{record.festivalName.replace(/^\d{4}\s*/, "")}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/85 sm:justify-end">
              <p>{record.attendedDates.map(formatDate).join(" · ")}</p>
              {record.festivalLocation && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{record.festivalLocation}</p>}
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 sm:p-10">
        <div className="mb-10 border-b border-line pb-8 whitespace-pre-wrap text-base leading-8 text-ink-secondary">
          {record.summary}
        </div>
        {record.performances.length === 0 ? <p className="text-sm text-ink-tertiary">아직 기록할 아티스트를 선택하지 않았습니다.</p> : (
          <div className="space-y-10">
            {performanceGroups.map((group) => (
              <section key={group.date}>
                <h3 className={`${typography.metaStrong} mb-3 text-ink`}>{group.date === "날짜 미정" ? group.date : formatDate(group.date)}</h3>
                <div className="divide-y divide-line border-t border-line">
                  {group.items.map((item) => (
                    <article key={item.recordPerformanceId} className="py-5 pl-5 sm:pl-7">
                      <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <Link href={`/artist/${item.artistId}`} className="text-xl font-bold text-ink hover:underline">{item.artistName}</Link>
                          {item.experienceStatus && <span className="inline-flex rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-ink-secondary">{STATUS_LABELS[item.experienceStatus]}</span>}
                          {item.rating && <span className="text-sm text-amber-500">{"★".repeat(item.rating)}</span>}
                        </div>
                        {(item.performanceTime || item.stageName) && (
                          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm text-ink-tertiary">
                            {item.performanceTime && <p className="font-mono font-semibold text-festival-purple">{item.performanceTime.slice(0, 5)}{item.performanceEndTime ? ` ~ ${item.performanceEndTime.slice(0, 5)}` : ""}</p>}
                            {item.stageName && <p>{item.stageName}</p>}
                          </div>
                        )}
                      </div>
                      <div>
                        {item.memo && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-secondary">“{item.memo}”</p>}
                        {item.songs.map((song) => <p key={song.id} className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink-secondary"><Music2 className="h-4 w-4" />{song.songName}</p>)}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <footer className="mt-12 border-t border-line pt-5 text-sm text-ink-tertiary">
          <p>이날의 기록　아티스트 {record.performances.length}팀 · 작성한 기록 {memoCount}</p>
          {favorite && <p className="mt-2">최고의 공연　{favorite.artistName}{favorite.rating ? ` ${"★".repeat(favorite.rating)}` : ""}</p>}
        </footer>
      </div>
    </article>
  );
}
