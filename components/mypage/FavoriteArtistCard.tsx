import Image from "next/image";
import Link from "next/link";
import { Music2 } from "lucide-react";

import type { FavoriteArtistListItem } from "@/lib/favorites/artistFavorites";
import { typography } from "@/lib/typography";

type FavoriteArtistCardProps = {
  artist: FavoriteArtistListItem;
};

export default function FavoriteArtistCard({
  artist,
}: FavoriteArtistCardProps) {
  return (
    <Link
      href={`/artist/${artist.id}`}
      className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-shadow hover:shadow-md"
    >
      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface-subtle">
        {artist.imageUrl ? (
          <Image
            src={artist.imageUrl}
            alt={`${artist.name} 아티스트 로고`}
            fill
            sizes="64px"
            className="object-contain p-2"
            unoptimized
          />
        ) : (
          <Music2 className="h-6 w-6 text-ink-tertiary" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0">
        <h3 className={`${typography.cardTitle} truncate text-ink`}>
          {artist.name}
        </h3>
        <p className={`${typography.meta} mt-1 text-ink-tertiary`}>
          아티스트 상세 보기
        </p>
      </div>
    </Link>
  );
}
