import type { MetadataRoute } from "next";

import {
  buildSitemapRoutes,
  type SitemapArtistEntry,
  type SitemapFestivalEntry,
} from "@/lib/seo";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return buildSitemapRoutes([], []);
  }

  const [festivalsResult, lineupResult] = await Promise.all([
    supabase
      .from("festivals")
      .select("id, created_at, updated_at")
      .eq("verification_status", "approved")
      .in("status", ["scheduled", "ongoing", "ended"])
      .order("id", { ascending: true }),
    supabase
      .from("festival_artists")
      .select(`
        artist_id,
        created_at,
        festivals!inner (
          verification_status,
          status
        )
      `)
      .in("status", ["scheduled", "confirmed"])
      .eq("festivals.verification_status", "approved")
      .in("festivals.status", ["scheduled", "ongoing", "ended"])
      .order("artist_id", { ascending: true }),
  ]);

  if (festivalsResult.error) {
    throw festivalsResult.error;
  }

  if (lineupResult.error) {
    throw lineupResult.error;
  }

  const festivals: SitemapFestivalEntry[] =
    festivalsResult.data ?? [];

  const artistEntries = new Map<number, string | null>();

  (lineupResult.data ?? []).forEach((lineup) => {
    const existing = artistEntries.get(lineup.artist_id);

    if (!existing || (lineup.created_at && lineup.created_at > existing)) {
      artistEntries.set(
        lineup.artist_id,
        lineup.created_at || existing || null,
      );
    }
  });

  const artists: SitemapArtistEntry[] = [...artistEntries.entries()]
    .sort(([a], [b]) => a - b)
    .map(([id, lastModified]) => ({
      id,
      last_modified: lastModified,
    }));

  return buildSitemapRoutes(festivals, artists);
}
