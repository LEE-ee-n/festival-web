export type FestivalThumbnailIdentity = {
  id: number;
  normalized_name: string;
  start_date: string;
  end_date: string;
  thumbnail_url: string | null;
};

export function getFestivalThumbnailFileName(
  festival: Pick<
    FestivalThumbnailIdentity,
    "normalized_name" | "start_date" | "end_date"
  >,
) {
  const normalizedName = festival.normalized_name.trim().toLowerCase();
  const startDate = festival.start_date.replaceAll("-", "");
  const endDate = festival.end_date.replaceAll("-", "");

  if (
    !/^[a-z0-9]+$/.test(normalizedName)
    || !/^\d{8}$/.test(startDate)
    || !/^\d{8}$/.test(endDate)
  ) {
    return null;
  }

  return `${normalizedName}${startDate}${endDate}.webp`;
}

export function findFestivalThumbnailMatches(
  festivals: FestivalThumbnailIdentity[],
  storageFileNames: string[],
) {
  const fileNames = new Set(storageFileNames);
  const festivalsByFileName = new Map<string, FestivalThumbnailIdentity[]>();

  festivals.forEach((festival) => {
    if (festival.thumbnail_url) return;
    const fileName = getFestivalThumbnailFileName(festival);
    if (!fileName) return;
    const matches = festivalsByFileName.get(fileName) ?? [];
    matches.push(festival);
    festivalsByFileName.set(fileName, matches);
  });

  const matched: Array<{
    festival: FestivalThumbnailIdentity;
    fileName: string;
  }> = [];
  const duplicateFileNames: string[] = [];

  festivalsByFileName.forEach((matches, fileName) => {
    if (!fileNames.has(fileName)) return;
    if (matches.length !== 1) {
      duplicateFileNames.push(fileName);
      return;
    }
    matched.push({ festival: matches[0], fileName });
  });

  return { matched, duplicateFileNames };
}
