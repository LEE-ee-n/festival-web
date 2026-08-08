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
      className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-line-strong bg-surface text-ink-secondary transition-colors hover:text-ink sm:h-[42px] sm:w-[42px]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={iconPath} alt="" className="h-5 w-5" />
    </a>
  );
}

function ArtistProfileImage({
  name,
  imageUrl,
}: Pick<ArtistProfileHeaderProps, "name" | "imageUrl">) {
  return (
    <div className="relative flex aspect-square w-24 shrink-0 items-center justify-center overflow-hidden rounded-[28px] border border-line bg-surface shadow-sm sm:w-[152px]">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${name} 아티스트 로고`}
          fill
          sizes="(max-width: 640px) 96px, 152px"
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
    <header className="mt-5 flex min-h-44 flex-wrap items-center gap-5 rounded-3xl border border-line bg-surface p-6 shadow-sm sm:min-h-52 sm:gap-8 sm:p-9">
      <div className="flex min-w-0 flex-col">
        <h1 className={`${typography.pageTitle} break-keep text-ink`}>{name}</h1>

        <div className="mt-5 flex flex-wrap gap-2">
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

      <ArtistProfileImage name={name} imageUrl={imageUrl} />
    </header>
  );
}
