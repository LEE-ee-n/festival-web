"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import FestivalArtistRecordCard from "@/components/festival-records/FestivalArtistRecordCard";
import { useFestivalRecordDetail } from "@/lib/hooks/useFestivalRecordDetail";
import { typography } from "@/lib/typography";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul" })
    .format(new Date(`${date}T00:00:00+09:00`));
}

export default function FestivalArtistRecordEditor({ recordId }: { recordId: number }) {
  const state = useFestivalRecordDetail(recordId);
  const [openId, setOpenId] = useState<number | null | undefined>(undefined);
  const performances = state.record?.performances;
  const firstId = performances?.[0]?.recordPerformanceId ?? null;
  const activeOpenId = openId === undefined ? firstId : openId;

  const groups = useMemo(() => (performances ?? []).reduce<Array<{ date: string; items: NonNullable<typeof performances> }>>((result, item) => {
    const date = item.performanceDate ?? "날짜 미정";
    const current = result.at(-1);
    if (current?.date === date) current.items.push(item);
    else result.push({ date, items: [item] });
    return result;
  }, []), [performances]);
  const indexById = useMemo(() => new Map(
    (performances ?? []).map((item, index) => [item.recordPerformanceId, index + 1]),
  ), [performances]);

  if (state.isLoading) return <p className="text-sm text-ink-muted">아티스트 기록을 불러오는 중...</p>;
  if (!state.isAuthenticated) return <p className="text-sm text-ink-tertiary">로그인이 필요합니다.</p>;
  if (state.errorMessage || !state.record) return <p className="text-sm text-red-600">{state.errorMessage || "기록을 찾을 수 없습니다."}</p>;

  return (
    <div>
      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className={`${typography.meta} text-ink-tertiary`}>선택한 아티스트 {state.record.performances.length}팀</p>
        <h2 className={`${typography.sectionTitle} mt-1 text-ink`}>{state.record.festivalName}</h2>
        <p className={`${typography.meta} mt-2 text-ink-secondary`}>카드를 순서대로 열어 기록하세요. 상태는 세 가지 중 하나를 선택합니다.</p>
      </div>

      {groups.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line-strong p-6 text-sm text-ink-tertiary">
          선택한 아티스트가 없습니다. <Link href={`/mypage/festival-records/${recordId}/edit`} className="font-semibold text-ink underline">이전 단계로 돌아가기</Link>
        </div>
      ) : (
        <div className="mt-7 space-y-8">
          {groups.map((group) => (
            <section key={group.date}>
              <h3 className={`${typography.sectionTitle} mb-3 text-ink`}>{group.date === "날짜 미정" ? group.date : formatDate(group.date)}</h3>
              <div className="space-y-3">
                {group.items.map((item) => <FestivalArtistRecordCard key={item.recordPerformanceId} item={item} index={indexById.get(item.recordPerformanceId) ?? 0} isOpen={activeOpenId === item.recordPerformanceId} onToggle={() => setOpenId(activeOpenId === item.recordPerformanceId ? null : item.recordPerformanceId)} />)}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href={`/mypage/festival-records/${recordId}/edit`} className={`${typography.button} rounded-xl border border-line-strong px-4 py-3 text-ink-secondary`}>이전 단계</Link>
        <Link href={`/mypage/festival-records/${recordId}`} className={`${typography.button} rounded-xl bg-surface-dark px-4 py-3 text-white`}>기록 상세보기</Link>
      </div>
    </div>
  );
}
