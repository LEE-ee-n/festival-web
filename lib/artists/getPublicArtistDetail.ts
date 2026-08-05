import { cache } from "react";

import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type {
  PublicArtistDetail,
  PublicArtistFestivalAppearance,
} from "@/lib/types";

export type PublicArtistDetailData = {
  artist: PublicArtistDetail;
  festivalRows: PublicArtistFestivalAppearance[];
};

export const getPublicArtistDetail = cache(
  async (
    routeId: string,
  ): Promise<PublicArtistDetailData | null> => {
    const artistId = Number(routeId);

    if (
      !Number.isSafeInteger(artistId) ||
      artistId <= 0
    ) {
      return null;
    }

    const supabase = createPublicSupabaseClient();

    if (!supabase) {
      return null;
    }

    const { data: festivalRows, error: festivalRowsError } = await supabase
      .from("festival_artists")
      .select(`
        performance_date, performance_time, stage_name,
        festivals!inner (
          id, name, start_date, end_date, location, region,
          verification_status, status
        )
      `)
      .eq("artist_id", artistId)
      .in("status", ["scheduled", "confirmed"])
      .eq("festivals.verification_status", "approved")
      .in("festivals.status", ["scheduled", "ongoing", "ended"])
      .order("performance_date", {
        ascending: true,
        nullsFirst: false,
      });

    if (festivalRowsError) {
      throw festivalRowsError;
    }

    if (!festivalRows?.length) {
      return null;
    }

    const { data, error } = await supabase
      .from("artists")
      .select(`
        id, name, image_url, instagram_url, featured_playlist_url
      `)
      .eq("id", artistId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      artist: data,
      festivalRows: festivalRows as PublicArtistFestivalAppearance[],
    };
  },
);
