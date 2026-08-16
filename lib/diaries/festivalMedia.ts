import type { FestivalRecordMedia } from "./festivalRecordTypes";

export type FestivalMediaFilter = "all" | "image" | "video";
export type FestivalMediaArtistFilter = "all" | "unassigned" | readonly number[];

export function getFeaturedFestivalMedia(media: FestivalRecordMedia[]) {
  return {
    images: media.filter((item) => item.fileType === "image" && item.featuredImageOrder !== null)
      .sort((a, b) => (a.featuredImageOrder ?? 99) - (b.featuredImageOrder ?? 99)).slice(0, 4),
    video: media.find((item) => item.fileType === "video" && item.isFeaturedVideo) ?? null,
  };
}

export function filterFestivalMedia(media: FestivalRecordMedia[], filter: FestivalMediaFilter) {
  return filter === "all" ? media : media.filter((item) => item.fileType === filter);
}

export function filterFestivalMediaByArtist(
  media: FestivalRecordMedia[],
  filter: FestivalMediaArtistFilter,
) {
  if (filter === "all") return media;
  if (filter === "unassigned") {
    return media.filter((item) => item.recordPerformanceId === null);
  }

  const performanceIds = new Set(filter);
  return media.filter((item) => item.recordPerformanceId !== null && performanceIds.has(item.recordPerformanceId));
}

export function nextFeaturedImageOrder(media: FestivalRecordMedia[]) {
  const used = new Set(media.map((item) => item.featuredImageOrder).filter((value): value is number => value !== null));
  return [1, 2, 3, 4].find((value) => !used.has(value)) ?? null;
}
