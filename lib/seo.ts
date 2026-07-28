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

export function createFestivalTitle(name: string): string {
  return `${name} 일정·라인업·티켓 | ${SITE_NAME}`;
}

export function createFestivalDescription(
  festival: FestivalSeoData,
): string {
  const period = formatPeriod(
    festival.start_date,
    festival.end_date,
  );
  const place =
    festival.location || festival.region || festival.address;
  const locationText = place ? ` ${place}에서 열리는` : " 열리는";

  return `${period}${locationText} ${festival.name}의 일정, 라인업, 타임테이블과 티켓 정보를 확인하세요.`;
}

export function createArtistTitle(name: string): string {
  return `${name} 출연 페스티벌 | ${SITE_NAME}`;
}

export function createArtistDescription(name: string): string {
  return `${name}의 출연 예정 및 지난 페스티벌 일정과 공연 정보를 확인하세요.`;
}

export function createFestivalEventJsonLd(
  festival: FestivalSeoData,
) {
  const placeName =
    festival.location || festival.address || festival.region;
  const address = festival.address || festival.region;

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
    url: `${SITE_URL}/festival/${festival.id}`,
    description:
      festival.description?.trim() ||
      createFestivalDescription(festival),
    ...(placeName
      ? {
          location: {
            "@type": "Place",
            name: placeName,
            ...(address
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
  };
}

export function serializeJsonLd(value: object): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
