import Link from "next/link";
import { notFound } from "next/navigation";

import ArtistFestivalAppearances from "@/components/artist/ArtistFestivalAppearances";
import ArtistProfileHeader from "@/components/artist/ArtistProfileHeader";
import { getPublicArtistDetail } from "@/lib/artists/getPublicArtistDetail";
import { typography } from "@/lib/typography";

export const revalidate = 3600;

type ArtistDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ArtistDetailPage({
  params,
}: ArtistDetailPageProps) {
  const { id } = await params;
  const detail = await getPublicArtistDetail(id);

  if (!detail) {
    notFound();
  }

  const { artist, festivalRows } = detail;

  return (
    <main className="min-h-screen bg-surface px-4 py-8 sm:py-12">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/"
          className={`${typography.metaStrong} text-ink-tertiary hover:text-ink`}
        >
          ← 달력으로 돌아가기
        </Link>

        <ArtistProfileHeader
          artistId={artist.id}
          name={artist.name}
          imageUrl={artist.image_url}
          instagramUrl={artist.instagram_url}
          featuredPlaylistUrl={artist.featured_playlist_url}
        />

        <ArtistFestivalAppearances festivalRows={festivalRows} />
      </article>
    </main>
  );
}
