import type { FestivalPanelSummary } from "@/lib/types";
import { typography } from "@/lib/typography";

type FestivalDetailSummaryProps = {
  festival: FestivalPanelSummary;
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
        <h1 className={`${typography.panelTitle} text-center text-slate-700`}>
          {festival.name}
        </h1>
      </header>

        <dl className="space-y-3 pt-3">
            <div className={summaryRowClass}>
                <dt className="text-slate-700">기간</dt>
                <dd className={`${typography.label} text-slate-700`}>
                {periodText}
                </dd>
            </div>

            <div className={summaryRowClass}>
                <dt className="text-slate-700">지역</dt>
                <dd className={`${typography.label} text-slate-700`}>
                {festival.region || "지역 확인 중"}
                </dd>
            </div>

            <div className={summaryRowClass}>
                <dt className="text-slate-700">장소</dt>
                <dd className={`${typography.label} text-slate-700`}>
                {festival.location || "장소 확인 중"}
                </dd>
            </div>

            <div className={summaryRowClass}>
                <dt className="text-slate-700">주소</dt>
                <dd className={`${typography.label} break-words text-slate-700`}>
                {festival.address || "주소 확인 중"}
                </dd>
            </div>

            {festival.price_type && (
                <div className={summaryRowClass}>
                <dt className="text-slate-700">요금</dt>
                <dd className={`${typography.label} text-slate-700`}>
                    {festival.price_type === "free" && "무료"}
                    {festival.price_type === "paid" && "유료"}
                    {festival.price_type === "partial_free" && "부분 무료"}
                    {festival.price_type === "unknown" && "확인 필요"}
                </dd>
                </div>
            )}

            {festival.price_info && (
                <div className={summaryRowClass}>
                <dt className="text-slate-700">가격</dt>
                <dd className={`${typography.label} break-words text-slate-700`}>
                    {festival.price_info}
                </dd>
                </div>
            )}
            </dl>
        <div className="pt-6 border-b border-slate-200" />
      </>
  );
}
