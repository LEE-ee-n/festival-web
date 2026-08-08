import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { FestivalPanelSummary } from "@/lib/types";
import { typography } from "@/lib/typography";

type FestivalDetailSummaryProps = {
  festival: FestivalPanelSummary & { id: number };
  periodText: string;
};

export default function FestivalDetailSummary({
  festival,
  periodText,
}: FestivalDetailSummaryProps) {
  const summaryRowClass =
    `${typography.meta} grid grid-cols-[44px_minmax(0,1fr)] items-baseline gap-2`;

    return (
    <>
      <header className="pt-6">
        <h1 className={`${typography.panelTitle} text-center text-ink`}>
          <Link href={`/festival/${festival.id}`} className="inline-flex max-w-full items-center justify-center gap-1 transition-colors hover:text-ink-secondary" title="독립 상세페이지 보기">
            <span className="min-w-0">{festival.name}</span>
            <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
          </Link>
        </h1>
      </header>

        <dl className="space-y-3 pt-3">
            <div className={summaryRowClass}>
                <dt className="text-ink-secondary">일정</dt>
                <dd className={`${typography.label} text-ink-secondary`}>
                {periodText}
                </dd>
            </div>

            <div className={summaryRowClass}>
                <dt className="text-ink-secondary">지역</dt>
                <dd className={`${typography.label} text-ink-secondary`}>
                {festival.region || "지역 확인 중"}
                </dd>
            </div>

            <div className={summaryRowClass}>
                <dt className="text-ink-secondary">장소</dt>
                <dd className={`${typography.label} text-ink-secondary`}>
                {festival.location || "장소 확인 중"}
                </dd>
            </div>

            <div className={summaryRowClass}>
                <dt className="text-ink-secondary">주소</dt>
                <dd className={`${typography.label} break-words text-ink-secondary`}>
                {festival.address || "주소 확인 중"}
                </dd>
            </div>

            {festival.price_type && (
                <div className={summaryRowClass}>
                <dt className="text-ink-secondary">관람</dt>
                <dd className={`${typography.label} text-ink-secondary`}>
                    {festival.price_type === "free" && "무료"}
                    {festival.price_type === "paid" && "유료"}
                    {festival.price_type === "partial_free" && "부분 무료"}
                    {festival.price_type === "unknown" && "확인 필요"}
                </dd>
                </div>
            )}

            {festival.price_info && (
                <div className={summaryRowClass}>
                <dt className="text-ink-secondary">가격</dt>
                <dd className={`${typography.label} break-words text-ink-secondary`}>
                    {festival.price_info}
                </dd>
                </div>
            )}
            </dl>
        <div className="pt-6 border-b border-line" />
      </>
  );
}
