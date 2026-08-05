export const FESTIVAL_REGION_PREFIXES = [
  "서울",
  "경기",
  "인천",
  "강원",
  "대전",
  "세종",
  "충북",
  "충남",
  "광주",
  "전북",
  "전남",
  "대구",
  "경북",
  "부산",
  "울산",
  "경남",
  "제주",
] as const;

export type FestivalRegionPrefix =
  (typeof FESTIVAL_REGION_PREFIXES)[number];

const FESTIVAL_REGION_ERROR =
  "지역은 서울 또는 충남 아산시처럼 표준 광역지역 2글자로 시작해 주세요.";

export function getFestivalRegionPrefix(
  region: string | null,
): FestivalRegionPrefix | null {
  const trimmed = region?.trim();

  if (!trimmed) {
    return null;
  }

  return (
    FESTIVAL_REGION_PREFIXES.find(
      (prefix) => trimmed === prefix || trimmed.startsWith(`${prefix} `),
    ) ?? null
  );
}

export function isValidFestivalRegion(region: string): boolean {
  if (!region || region !== region.trim()) {
    return false;
  }

  const prefix = getFestivalRegionPrefix(region);

  if (!prefix || region === prefix) {
    return Boolean(prefix);
  }

  const detail = region.slice(prefix.length + 1);
  return Boolean(detail) && detail[0] !== " ";
}

export function normalizeFestivalRegion(region: string): string {
  const normalized = region.trim();

  if (!isValidFestivalRegion(normalized)) {
    throw new Error(FESTIVAL_REGION_ERROR);
  }

  return normalized;
}
