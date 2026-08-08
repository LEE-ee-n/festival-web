import Link from "next/link";
import { Heart } from "lucide-react";

import type { UserScheduleListItem } from "@/lib/schedule/userScheduleItems";
import { typography } from "@/lib/typography";

type ScheduleItemRowProps = {
  item: UserScheduleListItem;
  isFavorite: boolean;
};

export default function ScheduleItemRow({
  item,
  isFavorite,
}: ScheduleItemRowProps) {
  const timeText = [
    item.performanceTime?.slice(0, 5),
    item.performanceEndTime?.slice(0, 5),
  ].filter(Boolean).join(" ~ ");

  return (
    <article className="border-b border-line px-1 py-4 sm:grid sm:grid-cols-[minmax(180px,1.4fr)_140px_minmax(150px,1fr)] sm:items-center sm:gap-4 sm:px-3">
      <div className="flex min-w-0 items-center justify-between gap-4 sm:justify-center">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={`/artist/${item.artistId}`}
            className={`${typography.label} min-w-0 truncate text-ink hover:underline`}
          >
            {item.artistName}
          </Link>
          {isFavorite && (
            <Heart
              className="h-4 w-4 shrink-0 fill-red-500 text-red-500"
              aria-label="좋아하는 아티스트"
            />
          )}
        </div>
        {timeText && (
          <span className={`${typography.metaStrong} shrink-0 font-mono text-festival-purple sm:hidden`}>
            {timeText}
          </span>
        )}
      </div>

      <span className={`${typography.metaStrong} hidden text-center font-mono text-festival-purple sm:block`}>
        {timeText}
      </span>

      <span className={`${typography.meta} mt-1 hidden truncate text-center text-ink-tertiary sm:block`}>
        {item.stageName || ""}
      </span>

      {item.stageName && (
        <p className={`${typography.meta} mt-1 truncate text-ink-tertiary sm:hidden`}>
          {item.stageName}
        </p>
      )}
    </article>
  );
}
