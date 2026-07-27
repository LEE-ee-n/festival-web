import { supabase } from "@/lib/supabase/client";
import type { Festival } from "@/lib/types";
import {
  escapeIlikePattern,
  normalizePublicSearchText,
  sortAndLimitArtists,
  uniqueById,
  type PublicArtistSearchResult,
} from "@/lib/publicSearchLogic";

export type { PublicArtistSearchResult } from "@/lib/publicSearchLogic";

export type PublicSearchResults = {
  festivals: Festival[];
  artists: PublicArtistSearchResult[];
};

const FESTIVAL_SELECT_COLUMNS = `
  id, name, start_date, end_date, location, address, region,
  category, description, official_url, thumbnail_url,
  timetable_status, price_info, price_type, program_info,
  source_url, slug, status, confidence_score,
  verification_status, created_at, updated_at
`;

async function searchPublicFestivals(
  keyword: string,
  normalizedKeyword: string,
) {
  const escapedKeyword = escapeIlikePattern(keyword);
  const queries = [
    supabase
      .from("festivals")
      .select(FESTIVAL_SELECT_COLUMNS)
      .eq("verification_status", "approved")
      .neq("status", "cancelled")
      .ilike("name", `%${escapedKeyword}%`)
      .limit(20),
    supabase
      .from("festivals")
      .select(FESTIVAL_SELECT_COLUMNS)
      .eq("verification_status", "approved")
      .neq("status", "cancelled")
      .ilike("search_aliases", `%${escapedKeyword}%`)
      .limit(20),
  ];

  if (normalizedKeyword) {
    queries.push(
      supabase
        .from("festivals")
        .select(FESTIVAL_SELECT_COLUMNS)
        .eq("verification_status", "approved")
        .neq("status", "cancelled")
        .ilike(
          "normalized_name",
          `%${escapeIlikePattern(normalizedKeyword)}%`,
        )
        .limit(20),
    );
  }

  const results = await Promise.all(queries);
  const failedResult = results.find((result) => result.error);
  if (failedResult?.error) throw failedResult.error;

  return uniqueById(
    results.flatMap((result) => (result.data ?? []) as Festival[]),
  )
    .sort((left, right) =>
      right.start_date.localeCompare(left.start_date))
    .slice(0, 10);
}

async function searchPublicArtists(
  keyword: string,
  normalizedKeyword: string,
) {
  const escapedKeyword = escapeIlikePattern(keyword);
  const aliasQueries = [
    supabase
      .from("artist_aliases")
      .select("artist_id")
      .ilike("alias_name", `%${escapedKeyword}%`)
      .limit(20),
  ];
  const artistQueries = [
    supabase
      .from("artists")
      .select("id")
      .ilike("name", `%${escapedKeyword}%`)
      .limit(20),
  ];

  if (normalizedKeyword) {
    const normalizedPattern =
      `%${escapeIlikePattern(normalizedKeyword)}%`;
    artistQueries.push(
      supabase
        .from("artists")
        .select("id")
        .ilike("normalized_name", normalizedPattern)
        .limit(20),
    );
    aliasQueries.push(
      supabase
        .from("artist_aliases")
        .select("artist_id")
        .ilike("normalized_alias", normalizedPattern)
        .limit(20),
    );
  }

  const [artistResults, aliasResults] = await Promise.all([
    Promise.all(artistQueries),
    Promise.all(aliasQueries),
  ]);
  const failedResult = [...artistResults, ...aliasResults]
    .find((result) => result.error);
  if (failedResult?.error) throw failedResult.error;

  const artistIds = Array.from(new Set([
    ...artistResults.flatMap((result) =>
      (result.data ?? []).map((artist) => artist.id)),
    ...aliasResults.flatMap((result) =>
      (result.data ?? []).map((alias) => alias.artist_id)),
  ]));
  if (artistIds.length === 0) return [];

  const { data, error } = await supabase
    .from("artists")
    .select("id, name, normalized_name, artist_aliases (alias_name)")
    .in("id", artistIds);
  if (error) throw error;

  return sortAndLimitArtists(
    (data ?? []).map((artist) => ({
      id: artist.id,
      name: artist.name,
      normalized_name: artist.normalized_name,
      aliases: (artist.artist_aliases ?? [])
        .map((alias) => alias.alias_name),
    })),
    keyword,
  );
}

export async function searchPublicContent(
  keyword: string,
): Promise<PublicSearchResults> {
  const searchKeyword = keyword.trim();
  if (!searchKeyword) return { festivals: [], artists: [] };

  const normalizedKeyword =
    normalizePublicSearchText(searchKeyword);
  const [festivals, artists] = await Promise.all([
    searchPublicFestivals(searchKeyword, normalizedKeyword),
    searchPublicArtists(searchKeyword, normalizedKeyword),
  ]);

  return { festivals, artists };
}
