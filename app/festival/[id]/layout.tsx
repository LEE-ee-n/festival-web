import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getPublicFestivalSeoData } from "@/lib/publicSeoData";
import {
  createBreadcrumbJsonLd,
  createFestivalDescription,
  createFestivalEventJsonLd,
  createFestivalPagePath,
  createFestivalTitle,
  isSafeHttpUrl,
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
  const description = createFestivalDescription(
    festival,
    festival.performers.map((performer) => performer.name),
  );
  const pagePath = createFestivalPagePath(festival.id);
  const imageUrl = isSafeHttpUrl(festival.thumbnail_url)
    ? festival.thumbnail_url
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

export default async function FestivalDetailLayout({
  children,
  params,
}: FestivalDetailLayoutProps) {
  const { id } = await params;
  const festival = await getPublicFestivalSeoData(id);

  if (!festival) {
    return children;
  }

  const eventJsonLd = createFestivalEventJsonLd(festival, {
    imageUrl: festival.thumbnail_url,
    performers: festival.performers,
    offer: festival.offer,
  });
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "전체 페스티벌", path: "/festivals" },
    {
      name: festival.name,
      path: createFestivalPagePath(festival.id),
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(eventJsonLd),
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
