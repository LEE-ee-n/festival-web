"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";

import type { ArtistDirectoryItem } from "@/lib/artists/artistDirectory";
import { typography } from "@/lib/typography";

type ArtistDirectoryRowProps = {
  artist: ArtistDirectoryItem;
  isFavorite: boolean;
  isLoading: boolean;
  isSaving: boolean;
  onFavoriteClick: () => void;
};

export default function ArtistDirectoryRow({
  artist,
  isFavorite,
  isLoading,
  isSaving,
  onFavoriteClick,
}: ArtistDirectoryRowProps) {
  return (
    <li className="flex min-h-20 items-center border-b border-line last:border-b-0">
      <Link
        href={`/artist/${artist.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 sm:pl-5"
      >
        <span className={`${typography.label} min-w-0 truncate text-ink`}>{artist.name}</span>

        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl" aria-hidden={!artist.imageUrl}>
          {artist.imageUrl && (
            <Image
              src={artist.imageUrl}
              alt={`${artist.name} 로고`}
              fill
              sizes="56px"
              className="object-contain p-1"
              unoptimized
            />
          )}
        </span>
      </Link>

      <button
        type="button"
        onClick={onFavoriteClick}
        disabled={isLoading || isSaving}
        aria-pressed={isFavorite}
        aria-label={`${artist.name} ${isFavorite ? "좋아하는 아티스트에서 삭제" : "좋아하는 아티스트로 추가"}`}
        className={`mr-3 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-40 sm:mr-4 ${
          isFavorite
            ? "text-red-500"
            : "text-ink-tertiary hover:bg-surface-muted hover:text-ink"
        }`}
      >
        <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} aria-hidden="true" />
      </button>
    </li>
  );
}
