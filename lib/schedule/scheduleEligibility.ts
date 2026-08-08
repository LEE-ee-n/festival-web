import type { FestivalArtist, FestivalStatus } from "@/lib/types";

export function canSelectScheduleItem(
  festivalStatus: FestivalStatus | null,
  item: FestivalArtist,
): boolean {
  return Boolean(
    (festivalStatus === "scheduled" || festivalStatus === "ongoing") &&
      (item.status === "scheduled" || item.status === "confirmed"),
  );
}
