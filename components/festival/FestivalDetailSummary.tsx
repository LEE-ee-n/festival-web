type FestivalSummary = {
  name: string;
  location: string | null;
  address: string | null;
  region: string | null;
  price_type: string | null;
  price_info: string | null;
};

type FestivalDetailSummaryProps = {
  festival: FestivalSummary;
  categoryLabel: string;
  categoryClassName: string;
  periodText: string;
};

export default function FestivalDetailSummary({
  festival,
  categoryLabel,
  categoryClassName,
  periodText,
}: FestivalDetailSummaryProps) {
  const summaryRowClass =
  "grid grid-cols-[44px_minmax(0,1fr)] items-baseline gap-2 text-sm";

    return (
    <>
      <header className="pt-3">
        <span
          className={[
            "inline-flex rounded-full border px-3 py-3 text-sm font-medium",
            categoryClassName,
          ].join(" ")}
        >
          {categoryLabel}
        </span>

        <h1 className="pt-3 text-center text-2xl font-bold leading-tight tracking-tight text-slate-700">
          {festival.name}
        </h1>
      </header>

        <dl className="space-y-3 pt-3">
            <div className={summaryRowClass}>
                <dt className="text-slate-700">기간</dt>
                <dd className="font-semibold text-slate-700">
                {periodText}
                </dd>
            </div>

            <div className={summaryRowClass}>
                <dt className="text-slate-700">지역</dt>
                <dd className="font-semibold text-slate-700">
                {festival.region || "지역 확인 중"}
                </dd>
            </div>

            <div className={summaryRowClass}>
                <dt className="text-slate-700">장소</dt>
                <dd className="font-semibold text-slate-700">
                {festival.location || "장소 확인 중"}
                </dd>
            </div>

            <div className={summaryRowClass}>
                <dt className="text-slate-700">주소</dt>
                <dd className="break-words font-semibold text-slate-700">
                {festival.address || "주소 확인 중"}
                </dd>
            </div>

            {festival.price_type && (
                <div className={summaryRowClass}>
                <dt className="text-slate-700">요금</dt>
                <dd className="font-semibold text-slate-700">
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
                <dd className="break-words font-semibold text-slate-700">
                    {festival.price_info}
                </dd>
                </div>
            )}
            </dl>
        <div className="pt-3 border-b border-slate-200" />
      </>
  );
}