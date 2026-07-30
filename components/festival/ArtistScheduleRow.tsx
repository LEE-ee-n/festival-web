import Link from "next/link";
import type { FestivalArtist } from "@/lib/types";
import { typography } from "@/lib/typography";

type ArtistScheduleRowProps = {
  item: FestivalArtist;
  layout?: "panel" | "page";
};

export default function ArtistScheduleRow({
  item,
  layout = "panel",
}: ArtistScheduleRowProps) {
  const artist = Array.isArray(item.artists)
    ? item.artists[0]
    : item.artists;

  return (
    <div
      className={
        layout === "page"
          ? "grid grid-cols-[minmax(0,1fr)_max-content] items-center gap-3 px-6 py-3 sm:grid-cols-[180px_max-content] sm:gap-6"
          : "flex items-center justify-between gap-3 px-6 py-3"
      }
    >
      <div className="min-w-0">
        {artist ? (
          <Link
            href={`/artist/${artist.id}`}
            className={`${typography.label} text-ink-secondary hover:underline`}
          >
            {artist.name}
          </Link>
        ) : (
          <p className={`${typography.label} text-ink-secondary`}>
            아티스트 정보 없음
          </p>
        )}
      </div>

      {(item.performance_time ||
        item.performance_end_time) && (
        <span className={`${typography.metaStrong} shrink-0 font-mono text-festival-purple`}>
          {item.performance_time
            ? item.performance_time.slice(0, 5)
            : "시작 미정"}

          {item.performance_end_time &&
            ` ~ ${item.performance_end_time.slice(0, 5)}`}
        </span>
      )}
    </div>
  );
}
