import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getPublicArtistSeoData } from "@/lib/publicSeoData";
import {
  createArtistDescription,
  createArtistJsonLd,
  createArtistPagePath,
  createArtistTitle,
  createBreadcrumbJsonLd,
  isSafeHttpUrl,
  serializeJsonLd,
} from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";

type ArtistDetailLayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: ArtistDetailLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const artist = await getPublicArtistSeoData(id);

  if (!artist) {
    return {
      title: {
        absolute: `아티스트를 찾을 수 없습니다 | ${SITE_NAME}`,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = createArtistTitle(artist.name);
  const description = createArtistDescription(
    artist.name,
    artist.festival_names,
  );
  const pagePath = createArtistPagePath(artist.id);
  const imageUrl = isSafeHttpUrl(artist.image_url)
    ? artist.image_url
    : null;

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: pagePath,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: pagePath,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export default async function ArtistDetailLayout({
  children,
  params,
}: ArtistDetailLayoutProps) {
  const { id } = await params;
  const artist = await getPublicArtistSeoData(id);

  if (!artist) {
    return children;
  }

  const artistJsonLd = createArtistJsonLd(artist);
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "홈", path: "/" },
    {
      name: artist.name,
      path: createArtistPagePath(artist.id),
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(artistJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd),
        }}
      />

      {children}
    </>
  );
}
