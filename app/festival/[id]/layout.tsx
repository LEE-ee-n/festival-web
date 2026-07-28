import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getPublicFestivalSeoData } from "@/lib/publicSeoData";
import {
  createFestivalDescription,
  createFestivalEventJsonLd,
  createFestivalTitle,
  serializeJsonLd,
} from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";

type FestivalDetailLayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: FestivalDetailLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const festival = await getPublicFestivalSeoData(id);

  if (!festival) {
    return {
      title: {
        absolute: `축제를 찾을 수 없습니다 | ${SITE_NAME}`,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = createFestivalTitle(festival.name);
  const description = createFestivalDescription(festival);

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: `/festival/${festival.id}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/festival/${festival.id}`,
    },
  };
}

export default async function FestivalDetailLayout({
  children,
  params,
}: FestivalDetailLayoutProps) {
  const { id } = await params;
  const festival = await getPublicFestivalSeoData(id);

  return (
    <>
      {festival && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(
              createFestivalEventJsonLd(festival),
            ),
          }}
        />
      )}

      {children}
    </>
  );
}
