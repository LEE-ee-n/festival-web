import Link from "next/link";

import FestivalRecordCard from "@/components/festival-records/FestivalRecordCard";
import type { FestivalDiaryListItem } from "@/lib/diaries/festivalDiaries";
import { typography } from "@/lib/typography";

type FestivalRecordSliderProps = { items: FestivalDiaryListItem[] };

export default function FestivalRecordSlider({ items }: FestivalRecordSliderProps) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className={`${typography.sectionTitle} text-ink`}>페스티벌 기록보기</h2>
        <Link href="/mypage/festival-records" className={`${typography.metaStrong} shrink-0 text-ink-secondary hover:underline`}>
          전체보기 →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-line-strong px-5 py-10 text-center">
          <p className="text-sm text-ink-tertiary">아직 기록한 페스티벌이 없습니다.</p>
          <Link href="/mypage/festival-records/new" className={`${typography.button} mt-4 inline-flex rounded-xl bg-surface-dark px-4 py-2.5 text-white`}>
            첫 기록 남기기
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
            {items.slice(0, 10).map((record) => (
              <FestivalRecordCard key={record.id} record={record} compact />
            ))}
          </div>
          <Link href="/mypage/festival-records/new" className={`${typography.button} mt-3 inline-flex rounded-xl border border-line-strong px-4 py-2.5 text-ink-secondary`}>
            기록 추가
          </Link>
        </>
      )}
    </section>
  );
}
