import type { DraftMergeDiff, DraftMergeSection, FestivalDraftMergeResult } from "./festivalDraftMerge";
import type { FestivalDraftJson } from "@/lib/types";

export type PendingCandidate = {
  id: number;
  title: string;
  source_url: string | null;
  festival_name: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  category: string | null;
  draft_json: FestivalDraftJson | null;
  review_notes: string | null;
};

export type MergePreview = {
  candidate: PendingCandidate;
  result: FestivalDraftMergeResult;
};

export type RegisteredFestival = {
  id: number;
  name: string;
  normalized_name: string;
  start_date: string;
  end_date: string;
};

export type DiffChoice = "current" | "incoming";

export const FESTIVAL_DRAFT_SECTION_LABEL: Record<DraftMergeSection, string> = {
  basic: "기본정보",
  lineup: "라인업",
  ticket: "티켓",
};

export function createCandidateDraft(candidate: PendingCandidate): FestivalDraftJson {
  return {
    festival: {
      name: candidate.festival_name ?? "",
      normalized_name: "",
      start_date: candidate.start_date ?? "",
      end_date: candidate.end_date ?? "",
      location: candidate.location ?? undefined,
      category: candidate.category ?? undefined,
      source_url: candidate.source_url ?? undefined,
    },
    artists: [],
    tickets: [],
  };
}

export function hasExactFestivalIdentity(
  current: FestivalDraftJson,
  incoming: FestivalDraftJson,
): boolean {
  return Boolean(
    current.festival.normalized_name
    && incoming.festival.normalized_name
    && current.festival.normalized_name === incoming.festival.normalized_name
    && current.festival.start_date === incoming.festival.start_date
    && current.festival.end_date === incoming.festival.end_date
  );
}

export function hasSameFestivalDates(
  current: FestivalDraftJson,
  incoming: FestivalDraftJson,
): boolean {
  return Boolean(
    current.festival.start_date
    && current.festival.end_date
    && current.festival.start_date === incoming.festival.start_date
    && current.festival.end_date === incoming.festival.end_date
  );
}

export function festivalDraftDiffChoiceKey(diff: DraftMergeDiff): string {
  return `${diff.section}:${diff.key}`;
}

export function unresolvedFestivalDraftReviewNotes(
  diffs: DraftMergeDiff[],
  choices: Record<string, DiffChoice>,
): string {
  const unresolved = diffs.filter(
    (diff) =>
      (diff.status === "change" || diff.status === "expression")
      && choices[festivalDraftDiffChoiceKey(diff)] !== "incoming",
  );

  if (unresolved.length === 0) return "";

  return [
    "JSON 병합 후 확인 필요",
    ...unresolved.map(
      (diff) =>
        `- ${FESTIVAL_DRAFT_SECTION_LABEL[diff.section]} / ${diff.label}: 현재 [${diff.current || "-"}] · 신규 [${diff.incoming || "-"}]`,
    ),
  ].join("\n");
}
