import { getArtistYoutubeSearchUrl } from "@/lib/artists/profileLinks";

type ArtistProfileStatusProps = {
  artistName: string;
  imageUrl: string | null;
  instagramUrl: string | null;
  featuredPlaylistUrl: string | null;
};

type StatusBadgeProps = {
  label: string;
  isActive: boolean;
  href?: string;
};

function StatusBadge({ label, isActive, href }: StatusBadgeProps) {
  const className = [
    "inline-flex h-7 items-center rounded-lg border px-2 text-[11px] font-semibold",
    isActive
      ? "border-line-strong bg-surface-muted text-ink-secondary"
      : "border-line bg-surface text-ink-muted",
  ].join(" ");

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {label} {isActive ? "✓" : "－"}
      </a>
    );
  }

  return <span className={className}>{label} {isActive ? "✓" : "－"}</span>;
}

export default function ArtistProfileStatus({
  artistName,
  imageUrl,
  instagramUrl,
  featuredPlaylistUrl,
}: ArtistProfileStatusProps) {
  return (
    <div className="mx-auto grid w-fit grid-cols-2 gap-1">
      <StatusBadge label="로고" isActive={Boolean(imageUrl)} />
      <StatusBadge
        label="YT"
        isActive
        href={getArtistYoutubeSearchUrl(artistName)}
      />
      <StatusBadge
        label="IG"
        isActive={Boolean(instagramUrl)}
        href={instagramUrl ?? undefined}
      />
      <StatusBadge
        label="플리"
        isActive={Boolean(featuredPlaylistUrl)}
        href={featuredPlaylistUrl ?? undefined}
      />
    </div>
  );
}
