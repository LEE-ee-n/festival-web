import Image from "next/image";
import { Music2 } from "lucide-react";

import FavoriteArtistButton from "@/components/artist/FavoriteArtistButton";
import { getArtistYoutubeSearchUrl } from "@/lib/artists/profileLinks";
import { typography } from "@/lib/typography";

type ArtistProfileHeaderProps = {
  artistId: number;
  name: string;
  imageUrl: string | null;
  instagramUrl: string | null;
  featuredPlaylistUrl: string | null;
};

type ExternalIconLinkProps = {
  href: string;
  ariaLabel: string;
  iconPath: string;
};

function ExternalIconLink({
  href,
  ariaLabel,
  iconPath,
}: ExternalIconLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={ariaLabel}
      className="inline-flex h-[38px] w-[38px] items-center justify-start text-ink-secondary transition-colors hover:text-ink sm:h-[42px] sm:w-[42px]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={iconPath}
        alt=""
        className={`h-6 w-6 origin-left ${iconPath.endsWith("/youtube.svg") ? "scale-x-90" : ""}`}
      />
    </a>
  );
}

function ArtistProfileImage({
  name,
  imageUrl,
}: Pick<ArtistProfileHeaderProps, "name" | "imageUrl">) {
  return (
    <div className="relative flex aspect-square w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-line bg-surface shadow-sm sm:w-28">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${name} 아티스트 로고`}
          fill
          sizes="(max-width: 640px) 96px, 112px"
          className="object-contain p-3"
          unoptimized
        />
      ) : (
        <Music2 className="h-9 w-9 text-ink-tertiary" aria-hidden="true" />
      )}
    </div>
  );
}

export default function ArtistProfileHeader({
  artistId,
  name,
  imageUrl,
  instagramUrl,
  featuredPlaylistUrl,
}: ArtistProfileHeaderProps) {
  return (
    <header className="mt-5 flex items-center gap-5 px-5 py-4 sm:gap-6 sm:px-6 sm:py-5">
      <ArtistProfileImage name={name} imageUrl={imageUrl} />

      <div className="flex min-w-0 flex-col">
        <h1 className={`${typography.pageTitle} break-keep text-ink`}>{name}</h1>

        <div className="mt-3 ml-1 flex flex-wrap gap-2">
          <ExternalIconLink
            href={getArtistYoutubeSearchUrl(name)}
            ariaLabel={`${name} YouTube에서 검색하기`}
            iconPath="/icons/youtube.svg"
          />
          {instagramUrl && (
            <ExternalIconLink
              href={instagramUrl}
              ariaLabel={`${name} Instagram 열기`}
              iconPath="/icons/instagram.svg"
            />
          )}
          {featuredPlaylistUrl && (
            <a
              href={featuredPlaylistUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-[38px] items-center rounded-xl border border-line-strong bg-surface px-3 text-sm font-semibold text-ink-secondary transition-colors hover:text-ink sm:h-[42px]"
            >
              추천 플레이리스트
            </a>
          )}
          <FavoriteArtistButton artistId={artistId} artistName={name} />
        </div>
      </div>
    </header>
  );
}
