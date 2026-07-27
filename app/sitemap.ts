import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database";

const SITE_URL = "https://festibom.com";

export const revalidate = 3600;

function createPublicSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
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
  const supabase = createPublicSupabaseClient();

  if (!supabase) return routes;

  const [festivalsResult, lineupResult] = await Promise.all([
    supabase
      .from("festivals")
      .select("id, created_at, updated_at")
      .eq("verification_status", "approved")
      .in("status", ["scheduled", "ongoing", "ended"])
      .order("id", { ascending: true }),
    supabase
      .from("festival_artists")
      .select("artist_id")
      .in("status", ["scheduled", "confirmed"])
      .order("artist_id", { ascending: true }),
  ]);

  if (!festivalsResult.error) {
    routes.push(
      ...(festivalsResult.data ?? []).map((festival) => ({
        url: `${SITE_URL}/festival/${festival.id}`,
        lastModified:
          festival.updated_at || festival.created_at || undefined,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    );
  }

  if (!lineupResult.error) {
    const artistIds = [
      ...new Set(
        (lineupResult.data ?? []).map((lineup) => lineup.artist_id),
      ),
    ];

    routes.push(
      ...artistIds.map((artistId) => ({
        url: `${SITE_URL}/artist/${artistId}`,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    );
  }

  return routes;
}
