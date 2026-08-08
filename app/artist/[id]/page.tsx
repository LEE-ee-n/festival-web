import Link from "next/link";
import { notFound } from "next/navigation";

import ArtistProfileHeader from "@/components/artist/ArtistProfileHeader";
import { getPublicArtistDetail } from "@/lib/artists/getPublicArtistDetail";
import { formatFestivalPeriod } from "@/lib/calendar";
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

        <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
          <div className="p-6 sm:p-9">
            <h2 className={`${typography.sectionTitle} text-ink`}>
              출연 페스티벌
            </h2>

            {festivalRows.length === 0 ? (
              <p className="mt-4 text-ink-tertiary">
                등록된 출연 페스티벌이 없습니다.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {festivalRows.map((row, index) => {
                  const festival = Array.isArray(row.festivals)
                    ? row.festivals[0]
                    : row.festivals;

                  if (!festival) {
                    return null;
                  }

                  return (
                    <Link
                      key={`${festival.id}-${index}`}
                      href={`/festival/${festival.id}`}
                      className="block rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-md"
                    >
                      <h3 className={`${typography.cardTitle} text-ink`}>
                        {festival.name}
                      </h3>

                      <p className={`${typography.metaStrong} mt-2 text-ink-secondary`}>
                        {formatFestivalPeriod(
                          festival.start_date,
                          festival.end_date,
                        )}
                      </p>

                      {(festival.location ||
                        festival.region) && (
                        <p className={`${typography.meta} mt-1 text-ink-tertiary`}>
                          {[festival.region, festival.location]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}

                      {(row.performance_date ||
                        row.performance_time ||
                        row.stage_name) && (
                        <p className={`${typography.meta} mt-3 text-ink-tertiary`}>
                          {row.performance_date}

                          {row.performance_time &&
                            ` · ${row.performance_time.slice(0, 5)}`}

                          {row.stage_name &&
                            ` · ${row.stage_name}`}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </article>
    </main>
  );
}
