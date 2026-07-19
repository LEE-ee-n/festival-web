import { supabase } from "@/lib/supabase/client";

export async function getFestivalLineupData(
  festivalId: string,
) {
  const [
    festivalResult,
    lineupResult,
    ticketRoundsResult,
  ] = await Promise.all([
    supabase
      .from("festivals")
      .select(`
        name,
        normalized_name,
        search_aliases,
        start_date,
        end_date,
        location,
        address,
        region,
        category,
        description,
        thumbnail_url,
        official_url,
        price_type,
        price_info,
        program_info,
        status,
        verification_status
      `)
      .eq("id", festivalId)
      .single(),

    supabase
      .from("festival_artists")
      .select(`
        id,
        artist_id,
        performance_date,
        performance_time,
        performance_end_time,
        stage_name,
        status,
        artists (
          id,
          name
        )
      `)
      .eq("festival_id", festivalId)
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
        id,
        round_type,
        round_name,
        open_at,
        price_info,
        ticket_url,
        ticket_platform
      `)
      .eq("festival_id", festivalId)
      .order("open_at", {
        ascending: false,
        nullsFirst: false,
      }),
  ]);

  if (festivalResult.error) {
    throw festivalResult.error;
  }

  if (lineupResult.error) {
    throw lineupResult.error;
  }

  if (ticketRoundsResult.error) {
    throw ticketRoundsResult.error;
  }

  return {
    festival: festivalResult.data,
    lineup: lineupResult.data ?? [],
    ticketRounds: ticketRoundsResult.data ?? [],
  };
}
