import { cache } from "react";

import {
  getLatestTicketRoundGroup,
  getOpenTicketLinks,
} from "@/lib/festivals/ticketDisplay";
import {
  isSafeHttpUrl,
  parseWonPrice,
  type FestivalOffer,
  type FestivalPerformer,
  type FestivalSeoData,
} from "@/lib/seo";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

const PUBLIC_FESTIVAL_STATUSES = [
  "scheduled",
  "ongoing",
  "ended",
];

export type PublicFestivalSeoData = FestivalSeoData & {
  thumbnail_url: string | null;
  performers: FestivalPerformer[];
  offer: FestivalOffer | null;
};

export type PublicArtistSeoData = {
  id: number;
  name: string;
  artist_type: string | null;
  image_url: string | null;
  instagram_url: string | null;
  featured_playlist_url: string | null;
  festival_names: string[];
};

export const getPublicFestivalSeoData = cache(
  async (
    routeId: string,
  ): Promise<PublicFestivalSeoData | null> => {
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
        region, description, status, thumbnail_url, price_info
      `)
      .eq("id", festivalId)
      .eq("verification_status", "approved")
      .in("status", PUBLIC_FESTIVAL_STATUSES)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    const [lineupResult, ticketResult] = await Promise.all([
      supabase
        .from("festival_artists")
        .select("artists!inner ( name, artist_type )")
        .eq("festival_id", festivalId)
        .neq("status", "cancelled")
        .order("performance_date", {
          ascending: true,
          nullsFirst: false,
        }),
      supabase
        .from("festival_ticket_rounds")
        .select("open_at, price_info, ticket_url")
        .eq("festival_id", festivalId)
        .order("open_at", {
          ascending: true,
          nullsFirst: false,
        }),
    ]);

    if (lineupResult.error) {
      throw lineupResult.error;
    }

    if (ticketResult.error) {
      throw ticketResult.error;
    }

    const performers: FestivalPerformer[] = [];
    const seenNames = new Set<string>();

    (lineupResult.data ?? []).forEach((row) => {
      const artist = Array.isArray(row.artists)
        ? row.artists[0]
        : row.artists;
      const name = artist?.name?.trim();

      if (!name || seenNames.has(name)) {
        return;
      }

      seenNames.add(name);
      performers.push({
        name,
        artist_type: artist.artist_type ?? null,
      });
    });

    let offer: FestivalOffer | null = null;

    const { latestOpenAt, latestTicketRounds } =
      getLatestTicketRoundGroup(ticketResult.data ?? []);
    const openRounds = getOpenTicketLinks(
      latestTicketRounds,
      latestOpenAt,
      Date.now(),
    );

    for (const round of openRounds) {
      if (!isSafeHttpUrl(round.ticket_url)) {
        continue;
      }

      const price =
        parseWonPrice(round.price_info) ??
        parseWonPrice(data.price_info);

      if (price === null) {
        continue;
      }

      offer = { url: round.ticket_url, price };
      break;
    }

    return {
      ...data,
      performers,
      offer,
    };
  },
);

export const getPublicArtistSeoData = cache(
  async (
    routeId: string,
  ): Promise<PublicArtistSeoData | null> => {
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
          name,
          start_date,
          verification_status,
          status
        )
      `)
      .eq("artist_id", artistId)
      .in("status", ["scheduled", "confirmed"])
      .eq("festivals.verification_status", "approved")
      .in("festivals.status", PUBLIC_FESTIVAL_STATUSES)
      .order("performance_date", {
        ascending: true,
        nullsFirst: false,
      });

    if (appearanceResult.error) {
      throw appearanceResult.error;
    }

    const festivalNames: string[] = [];
    const seenNames = new Set<string>();

    appearanceResult.data.forEach((row) => {
      const festival = Array.isArray(row.festivals)
        ? row.festivals[0]
        : row.festivals;
      const name = festival?.name?.trim();

      if (!name || seenNames.has(name)) {
        return;
      }

      seenNames.add(name);
      festivalNames.push(name);
    });

    const { data, error } = await supabase
      .from("artists")
      .select(`
        id, name, artist_type, image_url, instagram_url,
        featured_playlist_url
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
      ...data,
      festival_names: festivalNames,
    };
  },
);
