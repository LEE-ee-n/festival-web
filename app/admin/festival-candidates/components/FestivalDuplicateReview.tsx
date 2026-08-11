import type { FestivalDuplicateReview as DuplicateReview } from "@/lib/festivals/festivalDuplicateReview";

type Props = {
  review: DuplicateReview | null;
  isLoading: boolean;
  isConfirmed: boolean;
  isMutating: boolean;
  onConfirmCreateNew: () => void;
  onUseExisting: (festivalId: number) => void;
};

type CandidateCardProps = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  similarityScore?: number;
  isContained?: boolean;
  isMutating: boolean;
  onUseExisting: (festivalId: number) => void;
};

function CandidateCard({
  id,
  name,
  startDate,
  endDate,
  similarityScore,
  isContained,
  isMutating,
  onUseExisting,
}: CandidateCardProps) {
  return (
    <div className="rounded-xl border border-white/80 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold text-ink">{name}</p>
          <p className="mt-1 text-xs text-ink-tertiary">{startDate} ~ {endDate}</p>
          {similarityScore !== undefined && (
            <p className="mt-1 text-xs font-semibold text-amber-800">
              이름 유사도 {Math.round(similarityScore * 100)}%
              {isContained ? " · 이름 포함" : ""}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={isMutating}
          onClick={() => onUseExisting(id)}
          className="rounded-lg border border-line-strong bg-white px-3 py-2 text-xs font-bold text-ink-secondary disabled:opacity-50"
        >
          기존 축제로 수정
        </button>
      </div>
    </div>
  );
}

export default function FestivalDuplicateReview({
  review,
  isLoading,
  isConfirmed,
  isMutating,
  onConfirmCreateNew,
  onUseExisting,
}: Props) {
  if (isLoading) {
    return <p className="rounded-xl border border-line bg-surface-subtle p-4 text-sm text-ink-tertiary">유사 축제를 확인하고 있습니다...</p>;
  }
  if (!review || (!review.exact && review.possible.length === 0)) return null;

  return (
    <section className={`rounded-2xl border p-5 ${review.exact ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
      <h3 className="font-bold text-ink">
        {review.exact ? "이미 등록된 동일 축제가 있습니다" : "유사 축제 후보를 확인해 주세요"}
      </h3>
      <div className="mt-3 space-y-2">
        {review.exact ? (
          <CandidateCard
            id={review.exact.id}
            name={review.exact.name}
            startDate={review.exact.start_date}
            endDate={review.exact.end_date}
            isMutating={isMutating}
            onUseExisting={onUseExisting}
          />
        ) : review.possible.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            id={candidate.id}
            name={candidate.name}
            startDate={candidate.start_date}
            endDate={candidate.end_date}
            similarityScore={candidate.similarity_score}
            isContained={candidate.similarity_reason === "name_contains"}
            isMutating={isMutating}
            onUseExisting={onUseExisting}
          />
        ))}
      </div>
      {!review.exact && (
        <button
          type="button"
          onClick={onConfirmCreateNew}
          disabled={isConfirmed || isMutating}
          className="mt-4 rounded-xl bg-surface-dark px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {isConfirmed ? "별도 신규 축제로 확인 완료" : "위 후보와 다른 별도 축제로 등록"}
        </button>
      )}
    </section>
  );
}
