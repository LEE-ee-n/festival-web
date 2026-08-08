"use client";

import FestivalRecordGrid from "@/components/festival-records/FestivalRecordGrid";
import { useFestivalDiaryList } from "@/lib/hooks/useFestivalDiaryList";
import { typography } from "@/lib/typography";

export default function FestivalRecordsPageContent() {
  const records = useFestivalDiaryList();

  if (records.isLoading) return <p className="text-sm text-ink-muted">기록을 불러오는 중...</p>;
  if (!records.isAuthenticated) return <p className="text-sm text-ink-tertiary">로그인이 필요합니다.</p>;

  return (
    <>
      <div className="mb-7">
        <p className={`${typography.meta} text-ink-tertiary`}>총 {records.items.length}개</p>
      </div>
      {records.errorMessage ? (
        <p className="text-sm text-red-600">{records.errorMessage}</p>
      ) : records.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong p-10 text-center text-sm text-ink-tertiary">아직 기록한 페스티벌이 없습니다.</div>
      ) : (
        <FestivalRecordGrid items={records.items} />
      )}
    </>
  );
}
