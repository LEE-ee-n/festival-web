import {
  FESTIVAL_REGION_PREFIXES,
  getFestivalRegionPrefix,
  type FestivalRegionPrefix,
} from "./regionValidation.ts";

export type PublicFestivalState =
  | "scheduled"
  | "ongoing"
  | "ended";

export type FestivalDateRange = {
  start_date: string;
  end_date: string;
};

export const PUBLIC_FESTIVAL_REGIONS = FESTIVAL_REGION_PREFIXES;

export type PublicFestivalRegion = FestivalRegionPrefix;

export type PublicFestivalRegionFilter =
  | "all"
  | PublicFestivalRegion;

const PUBLIC_FESTIVAL_REGION_ALIASES: Record<
  string,
  PublicFestivalRegion
> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원도: "강원",
  강원특별자치도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전라북도: "전북",
  전북특별자치도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주도: "제주",
  제주특별자치도: "제주",
};

export type PublicFestivalRegionEntry = {
  region: string | null;
};

export function normalizePublicFestivalRegion(
  region: string | null,
): PublicFestivalRegion | null {
  const trimmed = region?.trim();

  if (!trimmed) {
    return null;
  }

  const canonicalRegion = getFestivalRegionPrefix(trimmed);

  if (canonicalRegion) {
    return canonicalRegion;
  }

  return PUBLIC_FESTIVAL_REGION_ALIASES[trimmed] ?? null;
}

export function getPublicFestivalRegions<
  FestivalType extends PublicFestivalRegionEntry,
>(festivals: FestivalType[]): PublicFestivalRegion[] {
  const found = new Set<PublicFestivalRegion>();

  festivals.forEach((festival) => {
    const region = normalizePublicFestivalRegion(festival.region);

    if (region) {
      found.add(region);
    }
  });

  return PUBLIC_FESTIVAL_REGIONS.filter((region) =>
    found.has(region),
  );
}

export function filterPublicFestivalsByRegion<
  FestivalType extends PublicFestivalRegionEntry,
>(
  festivals: FestivalType[],
  activeRegion: PublicFestivalRegionFilter,
): FestivalType[] {
  if (activeRegion === "all") {
    return festivals;
  }

  return festivals.filter(
    (festival) =>
      normalizePublicFestivalRegion(festival.region) ===
      activeRegion,
  );
}

export type PublicFestivalStateCounts = Record<
  "all" | PublicFestivalState,
  number
>;

export function getPublicFestivalState(
  festival: FestivalDateRange,
  todayKey: string,
): PublicFestivalState {
  if (festival.start_date > todayKey) {
    return "scheduled";
  }

  if (festival.end_date < todayKey) {
    return "ended";
  }

  return "ongoing";
}

export function countPublicFestivalStates(
  festivals: FestivalDateRange[],
  todayKey: string,
): PublicFestivalStateCounts {
  const counts: PublicFestivalStateCounts = {
    all: festivals.length,
    scheduled: 0,
    ongoing: 0,
    ended: 0,
  };

  festivals.forEach((festival) => {
    counts[getPublicFestivalState(festival, todayKey)] += 1;
  });

  return counts;
}

export function sortPublicFestivals<
  FestivalType extends FestivalDateRange & { name: string },
>(
  festivals: FestivalType[],
  todayKey: string,
): FestivalType[] {
  const stateOrder: Record<PublicFestivalState, number> = {
    ongoing: 0,
    scheduled: 1,
    ended: 2,
  };

  return [...festivals].sort((left, right) => {
    const leftState = getPublicFestivalState(left, todayKey);
    const rightState = getPublicFestivalState(right, todayKey);
    const stateComparison =
      stateOrder[leftState] - stateOrder[rightState];

    if (stateComparison !== 0) {
      return stateComparison;
    }

    const dateComparison =
      leftState === "ended"
        ? right.start_date.localeCompare(left.start_date)
        : left.start_date.localeCompare(right.start_date);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return left.name.localeCompare(right.name, "ko");
  });
}
