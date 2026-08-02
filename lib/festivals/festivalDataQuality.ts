export const FESTIVAL_DATA_QUALITY_ISSUES = [
  { key: "instagram", label: "공식 Instagram 없음" },
  { key: "official_url", label: "공식 홈페이지 없음" },
  { key: "thumbnail", label: "썸네일 없음" },
  { key: "venue", label: "장소·주소 미완성" },
  { key: "price_type", label: "가격 구분 미정" },
] as const;

export type FestivalDataQualityIssue =
  (typeof FESTIVAL_DATA_QUALITY_ISSUES)[number]["key"];

export type FestivalDataQualityFestival = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: string | null;
  instagram_url: string | null;
  instagram_url_unavailable: boolean;
  official_url: string | null;
  official_url_unavailable: boolean;
  thumbnail_url: string | null;
  location: string | null;
  address: string | null;
  price_type: string | null;
};

export type FestivalDataQualityItem =
  FestivalDataQualityFestival & {
    issues: FestivalDataQualityIssue[];
  };

function isBlank(value: string | null): boolean {
  return !value || value.trim().length === 0;
}

export function getFestivalDataQualityIssues(
  festival: FestivalDataQualityFestival,
): FestivalDataQualityIssue[] {
  const issues: FestivalDataQualityIssue[] = [];

  if (
    isBlank(festival.instagram_url) &&
    !festival.instagram_url_unavailable
  ) {
    issues.push("instagram");
  }
  if (
    isBlank(festival.official_url) &&
    !festival.official_url_unavailable
  ) {
    issues.push("official_url");
  }
  if (isBlank(festival.thumbnail_url)) issues.push("thumbnail");
  if (isBlank(festival.location) || isBlank(festival.address)) {
    issues.push("venue");
  }
  if (
    isBlank(festival.price_type) ||
    festival.price_type === "unknown"
  ) {
    issues.push("price_type");
  }

  return issues;
}

export function createFestivalDataQualityReport(
  festivals: FestivalDataQualityFestival[],
) {
  const counts: Record<FestivalDataQualityIssue, number> = {
    instagram: 0,
    official_url: 0,
    thumbnail: 0,
    venue: 0,
    price_type: 0,
  };
  const items: FestivalDataQualityItem[] = [];

  festivals.forEach((festival) => {
    if (
      festival.status === "ended" ||
      festival.status === "cancelled"
    ) {
      return;
    }

    const issues = getFestivalDataQualityIssues(festival);

    if (issues.length === 0) return;

    issues.forEach((issue) => {
      counts[issue] += 1;
    });
    items.push({ ...festival, issues });
  });

  return { counts, items };
}
