import { NextResponse } from "next/server";

import {
  createFigmaCardNewsDraft,
  type FigmaCardNewsFestivalSource,
} from "@/lib/festivals/figmaCardNews";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

function getAugust2026SearchParams(searchParams: URLSearchParams) {
  const year = Number(searchParams.get("year") ?? "2026");
  const month = Number(searchParams.get("month") ?? "8");

  return year === 2026 && month === 8 ? { year, month } : null;
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const period = getAugust2026SearchParams(url.searchParams);

  if (!period) {
    return NextResponse.json(
      { error: "현재는 2026년 8월 초안 생성만 지원합니다." },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "카드뉴스 데이터를 불러올 수 없습니다." },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  const { data: festivals, error: festivalError } = await supabase
    .from("festivals")
    .select("id, name, start_date, end_date, location, region, thumbnail_url, calendar_color")
    .eq("verification_status", "approved")
    .in("status", ["scheduled", "ongoing"])
    .lte("start_date", "2026-08-31")
    .gte("end_date", "2026-08-01")
    .order("start_date", { ascending: true });

  if (festivalError) {
    return NextResponse.json(
      { error: "페스티벌 데이터를 불러오지 못했습니다." },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  const festivalIds = (festivals ?? []).map((festival) => festival.id);
  const [{ data: tickets, error: ticketError }, { data: festivalArtists, error: festivalArtistError }] =
    await Promise.all([
      festivalIds.length > 0
        ? supabase
            .from("festival_ticket_rounds")
            .select("festival_id, ticket_platform")
            .in("festival_id", festivalIds)
        : Promise.resolve({ data: [], error: null }),
      festivalIds.length > 0
        ? supabase
            .from("festival_artists")
            .select("festival_id, artist_id, input_name")
            .in("festival_id", festivalIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (ticketError || festivalArtistError) {
    return NextResponse.json(
      { error: "카드뉴스 부가 정보를 불러오지 못했습니다." },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  const artistIds = [...new Set((festivalArtists ?? []).map((artist) => artist.artist_id))];
  const { data: artists, error: artistError } = artistIds.length > 0
    ? await supabase
        .from("artists")
        .select("id, name")
        .in("id", artistIds)
    : { data: [], error: null };

  if (artistError) {
    return NextResponse.json(
      { error: "출연진 정보를 불러오지 못했습니다." },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  const artistNameById = new Map(
    (artists ?? []).map((artist) => [artist.id, artist.name]),
  );
  const sourceFestivals: FigmaCardNewsFestivalSource[] = (festivals ?? []).map(
    (festival) => ({
      id: festival.id,
      name: festival.name,
      startDate: festival.start_date,
      endDate: festival.end_date,
      location: festival.location,
      region: festival.region,
      thumbnailUrl: festival.thumbnail_url,
      calendarColor: festival.calendar_color,
      ticketPlatforms: (tickets ?? [])
        .filter((ticket) => ticket.festival_id === festival.id)
        .map((ticket) => ticket.ticket_platform ?? ""),
      artistNames: (festivalArtists ?? [])
        .filter((artist) => artist.festival_id === festival.id)
        .map(
          (artist) =>
            artist.input_name ?? artistNameById.get(artist.artist_id) ?? "",
        ),
    }),
  );

  return NextResponse.json(
    createFigmaCardNewsDraft(period.year, period.month, sourceFestivals),
    { headers: CORS_HEADERS },
  );
}
