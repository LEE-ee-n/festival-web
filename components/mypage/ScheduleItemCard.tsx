import Link from "next/link";
import { Clock3, MapPin, Music2 } from "lucide-react";

import type { UserScheduleListItem } from "@/lib/schedule/userScheduleItems";
import { typography } from "@/lib/typography";

type ScheduleItemCardProps = {
  item: UserScheduleListItem;
};

export default function ScheduleItemCard({ item }: ScheduleItemCardProps) {
  const timeText = [
    item.performanceTime?.slice(0, 5),
    item.performanceEndTime?.slice(0, 5),
  ].filter(Boolean).join(" ~ ") || "시간 미정";

  return (
    <article className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`/artist/${item.artistId}`}
            className={`${typography.cardTitle} block truncate text-ink hover:underline`}
          >
            {item.artistName}
          </Link>
          <Link
            href={`/festival/${item.festivalId}`}
            className={`${typography.metaStrong} mt-1 block truncate text-ink-secondary hover:underline`}
          >
            {item.festivalName}
          </Link>
        </div>

        <span className={`${typography.metaStrong} shrink-0 font-mono text-festival-purple`}>
          {timeText}
        </span>
      </div>

      <div className={`${typography.meta} mt-3 flex flex-wrap gap-x-4 gap-y-2 text-ink-tertiary`}>
        {item.stageName && (
          <span className="inline-flex items-center gap-1.5">
            <Music2 className="h-3.5 w-3.5" aria-hidden="true" />
            {item.stageName}
          </span>
        )}
        {item.festivalLocation && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {item.festivalLocation}
          </span>
        )}
        {!item.stageName && !item.festivalLocation && (
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            공연 정보
          </span>
        )}
      </div>
    </article>
  );
}
