export type FestivalIdentity = {
  normalized_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};
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
