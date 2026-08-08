import type { FestivalArtist } from "@/lib/types";

export type ArtistsByDateAndStage = Record<
  string,
  Record<string, FestivalArtist[]>
>;

export function compareStageNames(left: string, right: string) {
  const leftPart = left.match(/^(\d+)\s*부$/);
  const rightPart = right.match(/^(\d+)\s*부$/);

  if (leftPart && rightPart) {
    return Number(leftPart[1]) - Number(rightPart[1]);
  }
  if (leftPart) return -1;
  if (rightPart) return 1;
  return 0;
}

export function groupArtistsByDateAndStage(
  festivalArtists: FestivalArtist[],
): ArtistsByDateAndStage {
  const groups = festivalArtists.reduce<ArtistsByDateAndStage>(
    (dateGroups, artist) => {
      const date = artist.performance_date || "날짜 미정";
      const stage = artist.stage_name?.trim() || "무대 미정";

      dateGroups[date] ??= {};
      dateGroups[date][stage] ??= [];
      dateGroups[date][stage].push(artist);
      return dateGroups;
    },
    {},
  );

  Object.values(groups).forEach((stageGroups) => {
    Object.values(stageGroups).forEach((artists) => {
      artists.sort((a, b) => {
        if (!a.performance_time && !b.performance_time) return 0;
        if (!a.performance_time) return 1;
        if (!b.performance_time) return -1;
        return a.performance_time.localeCompare(b.performance_time);
      });
    });
  });

  return groups;
}
