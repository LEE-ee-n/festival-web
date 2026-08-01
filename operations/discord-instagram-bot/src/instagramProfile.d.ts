export type InstagramProfileCandidate = {
  href?: string;
  text?: string;
  visible?: boolean;
  top?: number;
  hasMatchingProfileImage?: boolean;
};

export function normalizeInstagramProfileUrl(value: string): string;
export function findInstagramProfileUrl(
  candidates: InstagramProfileCandidate[],
): string;
