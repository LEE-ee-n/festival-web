import Link from "next/link";
import { Heart } from "lucide-react";
import ScheduleItemButton from "@/components/schedule/ScheduleItemButton";
import type { ScheduleSelectionState } from "@/lib/hooks/useScheduleSelection";
import { canSelectScheduleItem } from "@/lib/schedule/scheduleEligibility";
import type { FestivalArtist, FestivalStatus } from "@/lib/types";
import { typography } from "@/lib/typography";

type ArtistScheduleRowProps = {
  item: FestivalArtist;
  festivalStatus: FestivalStatus | null;
  loginReturnPath: string;
  scheduleSelection: ScheduleSelectionState;
  favoriteArtistIds: ReadonlySet<number>;
  layout?: "panel" | "page";
  isFirstAfterStage?: boolean;
};

export default function ArtistScheduleRow({
  item,
  festivalStatus,
  loginReturnPath,
  scheduleSelection,
  favoriteArtistIds,
  layout = "panel",
  isFirstAfterStage = false,
}: ArtistScheduleRowProps) {
  const artist = Array.isArray(item.artists)
    ? item.artists[0]
    : item.artists;

  const canSelect = canSelectScheduleItem(festivalStatus, item);
  const artistName = artist?.name ?? "아티스트";
  const isFavorite = artist ? favoriteArtistIds.has(artist.id) : false;

  return (
    <div
      className={
        layout === "page"
          ? `grid grid-cols-[minmax(0,1fr)_max-content] items-center gap-3 px-3 pb-3 sm:px-6 ${isFirstAfterStage ? "pt-1" : "pt-3"}`
          : `flex items-center justify-between gap-3 px-6 pb-3 ${isFirstAfterStage ? "pt-1" : "pt-3"}`
      }
    >
      <div className="min-w-0">
        {artist ? (
          <Link
            href={`/artist/${artist.id}`}
            className={`${typography.label} inline-flex items-center gap-1.5 text-ink-secondary hover:underline`}
          >
            <span>{artist.name}</span>
            {isFavorite && <Heart className="h-3.5 w-3.5 shrink-0 fill-red-500 text-red-500" aria-label="좋아하는 아티스트" />}
          </Link>
        ) : (
          <p className={`${typography.label} text-ink-secondary`}>
            아티스트 정보 없음
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {(item.performance_time || item.performance_end_time) && (
          <span className={`${typography.metaStrong} shrink-0 font-mono text-festival-purple`}>
            {item.performance_time
              ? item.performance_time.slice(0, 5)
              : "시작 미정"}

            {item.performance_end_time &&
              ` ~ ${item.performance_end_time.slice(0, 5)}`}
          </span>
        )}

        {canSelect && (
          <ScheduleItemButton
            festivalArtistId={item.id}
            artistName={artistName}
            loginReturnPath={loginReturnPath}
            isAuthenticated={scheduleSelection.isAuthenticated}
            isSelected={scheduleSelection.isSelected(item.id)}
            isLoading={scheduleSelection.isLoading}
            isSaving={scheduleSelection.isSaving(item.id)}
            hasPersonalServiceAccess={scheduleSelection.hasPersonalServiceAccess}
            onToggle={scheduleSelection.toggle}
          />
        )}
      </div>
    </div>
  );
}
