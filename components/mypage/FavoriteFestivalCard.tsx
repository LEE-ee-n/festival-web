import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";

import type { FavoriteFestivalListItem } from "@/lib/favorites/festivalFavorites";
import { typography } from "@/lib/typography";

type FavoriteFestivalCardProps = {
  festival: FavoriteFestivalListItem;
};

export default function FavoriteFestivalCard({
  festival,
}: FavoriteFestivalCardProps) {
  return (
    <Link
      href={`/festival/${festival.id}`}
      className="flex w-full min-w-0 max-w-full items-center gap-4 overflow-hidden rounded-2xl border border-line bg-surface p-4 transition-shadow hover:shadow-md"
    >
      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-subtle">
        {festival.thumbnailUrl ? (
          <Image
            src={festival.thumbnailUrl}
            alt={`${festival.name} 축제 썸네일`}
            fill
            sizes="64px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <CalendarDays className="h-6 w-6 text-ink-tertiary" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className={`${typography.cardTitle} min-w-0 truncate text-ink`}>
          {festival.name}
        </h3>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-ink-tertiary" aria-hidden="true" />
    </Link>
  );
}
