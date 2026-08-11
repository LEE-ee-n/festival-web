import {
  findExactFestivalIdentityMatch,
  findSimilarFestivalCandidates,
  normalizeComparableFestivalName,
  type FestivalIdentity,
  type SimilarFestival,
} from "./ingestionRules.ts";

export type FestivalDuplicateReference = FestivalIdentity & {
  id: number;
  name: string;
  normalized_name: string;
  search_aliases: string | null;
  start_date: string;
  end_date: string;
};

export type FestivalDuplicateReview = {
  fingerprint: string;
  exact: FestivalDuplicateReference | null;
  possible: Array<SimilarFestival<FestivalDuplicateReference>>;
};

export function buildFestivalDuplicateFingerprint(festival: FestivalIdentity): string {
  return [
    normalizeComparableFestivalName(festival.name),
    String(festival.normalized_name ?? "").trim(),
    String(festival.start_date ?? "").trim(),
    String(festival.end_date ?? "").trim(),
  ].join("|");
}

export function reviewFestivalDuplicates(
  incoming: FestivalIdentity,
  festivals: FestivalDuplicateReference[],
): FestivalDuplicateReview {
  const exactMatch = findExactFestivalIdentityMatch(incoming, festivals);
  const exact = exactMatch.status === "existing" ? exactMatch.festival : null;
  return {
    fingerprint: buildFestivalDuplicateFingerprint(incoming),
    exact,
    possible: exact ? [] : findSimilarFestivalCandidates(incoming, festivals),
  };
}

export function hasConfirmedSeparateFestival(
  review: FestivalDuplicateReview,
  confirmation: {
    fingerprint: string;
    decision: "create_new";
    reviewed_festival_ids: number[];
  } | undefined,
): boolean {
  if (!confirmation || confirmation.fingerprint !== review.fingerprint) return false;
  const reviewedIds = [...confirmation.reviewed_festival_ids].sort((a, b) => a - b);
  const currentIds = review.possible.map(({ id }) => id).sort((a, b) => a - b);
  return reviewedIds.length === currentIds.length
    && reviewedIds.every((id, index) => id === currentIds[index]);
}
