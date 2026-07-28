import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getPublicArtistSeoData } from "@/lib/publicSeoData";
import {
  createArtistDescription,
  createArtistTitle,
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
  const description = createArtistDescription(artist.name);

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: `/artist/${artist.id}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/artist/${artist.id}`,
    },
  };
}

export default function ArtistDetailLayout({
  children,
}: ArtistDetailLayoutProps) {
  return children;
}
