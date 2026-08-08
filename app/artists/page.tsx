import type { Metadata } from "next";
import Link from "next/link";

import ArtistDirectory from "@/components/artists/ArtistDirectory";
import { parseArtistDirectoryPage } from "@/lib/artists/artistDirectory";
import { getPublicArtistDirectory } from "@/lib/artists/getPublicArtistDirectory";
import { typography } from "@/lib/typography";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "아티스트 찾기",
  description: "페스티봄에 등록된 아티스트를 이름과 초성으로 찾아보세요.",
};

type ArtistsPageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

export default async function ArtistsPage({ searchParams }: ArtistsPageProps) {
  const { page } = await searchParams;
  const artists = await getPublicArtistDirectory();
  const initialPage = parseArtistDirectoryPage(page);

  return (
    <main className="min-h-screen bg-surface px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className={`${typography.metaStrong} text-ink-tertiary hover:text-ink`}
        >
          ← 달력으로 돌아가기
        </Link>

        <header className="mt-5">
          <h1 className={`${typography.pageTitle} text-ink`}>아티스트 찾기</h1>
          <p className={`${typography.bodyCompact} mt-2 text-ink-tertiary`}>
            이름을 검색하거나 초성·알파벳으로 아티스트를 찾아보세요.
          </p>
        </header>

        <ArtistDirectory artists={artists} initialPage={initialPage} />
      </div>
    </main>
  );
}
