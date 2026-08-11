export type FestivalIdentity = {
  id?: number;
  name?: string | null;
  normalized_name?: string | null;
  search_aliases?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};
export type SimilarFestival<T extends FestivalIdentity> = T & {
  similarity_score: number;
  similarity_reason: "name_contains" | "name_similarity";
  same_dates: boolean;
};
export const FESTIVAL_NAME_SIMILARITY_THRESHOLD: number;
export type FestivalIdentityMatch<T extends FestivalIdentity> =
  | { status: "incomplete"; festival: null }
  | { status: "new"; festival: null }
  | { status: "existing"; festival: T }
  | { status: "ambiguous"; festival: null };
export function isCompleteFestivalIdentity(input: FestivalIdentity): boolean;
export function createFestivalIdentityKey(input: FestivalIdentity): string | null;
export function findExactFestivalIdentityMatch<T extends FestivalIdentity>(
  incoming: FestivalIdentity,
  festivals: readonly T[],
): FestivalIdentityMatch<T>;
export function normalizeComparableFestivalName(value: unknown): string;
export function calculateFestivalNameSimilarity(left: unknown, right: unknown): number;
export function findSimilarFestivalCandidates<T extends FestivalIdentity>(
  incoming: FestivalIdentity,
  festivals: readonly T[],
  threshold?: number,
): Array<SimilarFestival<T>>;
