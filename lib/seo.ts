import type { MetadataRoute } from "next";

import { SITE_NAME, SITE_URL } from "./site.ts";

export type FestivalSeoData = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  location: string | null;
  address: string | null;
  region: string | null;
  description: string | null;
  status: string | null;
};

export type FestivalPerformer = {
  name: string;
  artist_type: string | null;
};

export type FestivalOffer = {
  url: string;
  price: number;
};

export type FestivalEventJsonLdOptions = {
  imageUrl?: string | null;
  performers?: FestivalPerformer[];
  offer?: FestivalOffer | null;
};

export type ArtistSeoData = {
  id: number;
  name: string;
  artist_type: string | null;
  image_url: string | null;
  instagram_url: string | null;
  featured_playlist_url: string | null;
};

export type BreadcrumbItem = {
  name: string;
  path: string;
};

function formatDate(date: string): string {
  const [year, month, day] = date.split("-");

  if (!year || !month || !day) {
    return date;
  }

  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

function formatPeriod(startDate: string, endDate: string): string {
  if (startDate === endDate) {
    return formatDate(startDate);
  }

  return `${formatDate(startDate)}부터 ${formatDate(endDate)}까지`;
}

export function createFestivalPagePath(id: number): string {
  return `/festival/${id}`;
}

export function createArtistPagePath(id: number): string {
  return `/artist/${id}`;
}

export function createFestivalTitle(name: string): string {
  return `${name} 일정·라인업·티켓 | ${SITE_NAME}`;
}

export function createFestivalDescription(
  festival: FestivalSeoData,
  artistNames: string[] = [],
): string {
  const period = formatPeriod(
    festival.start_date,
    festival.end_date,
  );
  const place =
    festival.location || festival.region || festival.address;
  const locationText = place ? ` ${place}에서 열리는` : " 열리는";

  const base = `${period}${locationText} ${festival.name}의 일정, 라인업, 타임테이블, 티켓 예매 정보를 확인하세요.`;

  const names = artistNames
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (names.length === 0) {
    return base;
  }

  const suffix = artistNames.length > names.length ? " 등" : "";

  return `${base} ${names.join(", ")}${suffix} 출연.`;
}

export function createArtistTitle(name: string): string {
  return `${name} 출연 페스티벌 | ${SITE_NAME}`;
}

export function createArtistDescription(
  name: string,
  festivalNames: string[] = [],
): string {
  const names = festivalNames
    .map((festivalName) => festivalName.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (names.length === 0) {
    return `${name}의 출연 예정 및 지난 페스티벌 일정과 공연 정보를 확인하세요.`;
  }

  const suffix = festivalNames.length > names.length ? " 등" : "";

  return `${name}의 ${names.join(", ")}${suffix} 출연 일정과 공연 정보를 확인하세요.`;
}

export function isSafeHttpUrl(
  value: string | null | undefined,
): value is string {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseWonPrice(
  text: string | null | undefined,
): number | null {
  if (!text) {
    return null;
  }

  const match = text.match(/(\d[\d,]*)\s*원/);

  if (!match?.[1]) {
    return null;
  }

  const price = Number(match[1].replace(/,/g, ""));

  if (!Number.isFinite(price) || price <= 0) {
    return null;
  }

  return price;
}

export function getArtistSchemaType(
  artistType: string | null,
): "Person" | "MusicGroup" {
  return artistType === "singer" || artistType === "dj"
    ? "Person"
    : "MusicGroup";
}

export function createFestivalEventJsonLd(
  festival: FestivalSeoData,
  options: FestivalEventJsonLdOptions = {},
) {
  const placeName =
    festival.location || festival.address || festival.region;

  const performers = (options.performers ?? [])
    .filter((performer) => performer.name.trim())
    .map((performer) => ({
      "@type": getArtistSchemaType(performer.artist_type),
      name: performer.name.trim(),
    }));

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: festival.name,
    startDate: festival.start_date,
    endDate: festival.end_date,
    eventStatus:
      festival.status === "ended"
        ? "https://schema.org/EventCompleted"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode:
      "https://schema.org/OfflineEventAttendanceMode",
    url: `${SITE_URL}${createFestivalPagePath(festival.id)}`,
    description:
      festival.description?.trim() ||
      createFestivalDescription(festival),
    ...(isSafeHttpUrl(options.imageUrl)
      ? { image: options.imageUrl }
      : {}),
    ...(placeName
      ? {
          location: {
            "@type": "Place",
            name: placeName,
            ...(festival.address || festival.region
              ? {
                  address: {
                    "@type": "PostalAddress",
                    streetAddress: festival.address || undefined,
                    addressRegion: festival.region || undefined,
                    addressCountry: "KR",
                  },
                }
              : {}),
          },
        }
      : {}),
    ...(performers.length > 0 ? { performer: performers } : {}),
    ...(options.offer && isSafeHttpUrl(options.offer.url)
      ? {
          offers: {
            "@type": "Offer",
            url: options.offer.url,
            price: options.offer.price,
            priceCurrency: "KRW",
          },
        }
      : {}),
  };
}

export function createArtistJsonLd(artist: ArtistSeoData) {
  const sameAs = [artist.instagram_url].filter(isSafeHttpUrl);

  return {
    "@context": "https://schema.org",
    "@type": getArtistSchemaType(artist.artist_type),
    name: artist.name,
    url: `${SITE_URL}${createArtistPagePath(artist.id)}`,
    ...(isSafeHttpUrl(artist.image_url)
      ? { image: artist.image_url }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function createBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export type SitemapFestivalEntry = {
  id: number;
  updated_at: string | null;
  created_at: string | null;
};

export type SitemapArtistEntry = {
  id: number;
  last_modified: string | null;
};

export function buildSitemapRoutes(
  festivals: SitemapFestivalEntry[],
  artists: SitemapArtistEntry[],
): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/festivals`,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/notices`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/terms`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/report`,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
  const seenUrls = new Set(routes.map((route) => route.url));

  festivals.forEach((festival) => {
    const url = `${SITE_URL}${createFestivalPagePath(festival.id)}`;

    if (seenUrls.has(url)) {
      return;
    }

    seenUrls.add(url);

    routes.push({
      url,
      lastModified:
        festival.updated_at || festival.created_at || undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  });

  artists.forEach((artist) => {
    const url = `${SITE_URL}${createArtistPagePath(artist.id)}`;

    if (seenUrls.has(url)) {
      return;
    }

    seenUrls.add(url);

    routes.push({
      url,
      lastModified: artist.last_modified || undefined,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  });

  return routes;
}

export function serializeJsonLd(value: object): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
