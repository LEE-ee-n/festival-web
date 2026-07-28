import { cache } from "react";

import type { FestivalSeoData } from "@/lib/seo";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

const PUBLIC_FESTIVAL_STATUSES = [
  "scheduled",
  "ongoing",
  "ended",
];

export const getPublicFestivalSeoData = cache(
  async (routeId: string): Promise<FestivalSeoData | null> => {
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
        id, name, start_date, end_date, location, address,
        region, description, status
      `)
      .eq("id", festivalId)
      .eq("verification_status", "approved")
      .in("status", PUBLIC_FESTIVAL_STATUSES)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data;
  },
);

export const getPublicArtistSeoData = cache(
  async (
    routeId: string,
  ): Promise<{ id: number; name: string } | null> => {
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

    const appearanceResult = await supabase
      .from("festival_artists")
      .select(`
        artist_id,
        festivals!inner (
          id,
          verification_status,
          status
        )
      `)
      .eq("artist_id", artistId)
      .in("status", ["scheduled", "confirmed"])
      .eq("festivals.verification_status", "approved")
      .in("festivals.status", PUBLIC_FESTIVAL_STATUSES)
      .limit(1);

    if (
      appearanceResult.error ||
      !appearanceResult.data?.length
    ) {
      return null;
    }

    const { data, error } = await supabase
      .from("artists")
      .select("id, name")
      .eq("id", artistId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data;
  },
);
