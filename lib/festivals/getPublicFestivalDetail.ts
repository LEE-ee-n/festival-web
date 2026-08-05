import { cache } from "react";

import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type {
  Festival,
  FestivalArtist,
  FestivalTicketRound,
} from "@/lib/types";

export type PublicFestivalDetail = {
  festival: Festival;
  festivalArtists: FestivalArtist[];
  ticketRounds: FestivalTicketRound[];
};

export const getPublicFestivalDetail = cache(
  async (
    routeId: string,
  ): Promise<PublicFestivalDetail | null> => {
    const festivalId = Number(routeId);

    if (
      !Number.isSafeInteger(festivalId) ||
      festivalId <= 0
    ) {
      return null;
    }

    const supabase = createPublicSupabaseClient();

    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("festivals")
      .select(`
        id, name, start_date, end_date, location, address, region,
        category, description, official_url, instagram_url, thumbnail_url, price_info,
        price_type, program_info, source_url, slug, status, timetable_status,
        confidence_score, verification_status, created_at, updated_at
      `)
      .eq("id", festivalId)
      .eq("verification_status", "approved")
      .neq("status", "cancelled")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    const festival = {
      ...data,
      calendar_color: null,
      timetable_status:
        data.timetable_status === "unpublished"
          ? "unpublished"
          : "published",
    } as Festival;

    const [artistsResult, ticketsResult] = await Promise.all([
      supabase
        .from("festival_artists")
        .select(`
          artist_id, performance_date, performance_time,
          performance_end_time, stage_name, status, artists (id, name)
        `)
        .eq("festival_id", festivalId)
        .neq("status", "cancelled")
        .order("performance_date", {
          ascending: true,
          nullsFirst: false,
        })
        .order("performance_time", {
          ascending: true,
          nullsFirst: false,
        }),
      supabase
        .from("festival_ticket_rounds")
        .select(`
          id, round_type, round_name, open_at, price_info,
          ticket_url, ticket_platform
        `)
        .eq("festival_id", festivalId)
        .order("open_at", {
          ascending: true,
          nullsFirst: false,
        }),
    ]);

    if (artistsResult.error) {
      throw artistsResult.error;
    }

    if (ticketsResult.error) {
      throw ticketsResult.error;
    }

    return {
      festival,
      festivalArtists:
        (artistsResult.data ?? []) as FestivalArtist[],
      ticketRounds:
        (ticketsResult.data ?? []) as FestivalTicketRound[],
    };
  },
);
