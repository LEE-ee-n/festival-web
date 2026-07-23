import { supabase } from "@/lib/supabase/client";
import {
  applyNormalizedArtistMatches,
  type ExistingArtistMatch,
} from "@/lib/artists/applyNormalizedArtistMatches";
import type { FestivalDraftJson } from "@/lib/types";

export async function matchFestivalDraftArtists(
  draft: FestivalDraftJson,
) {
  const normalizedNames = Array.from(
    new Set(
      draft.artists
        .map((artist) => artist.normalized_name.trim())
        .filter(Boolean),
    ),
  );

  if (normalizedNames.length === 0) {
    return applyNormalizedArtistMatches(draft, []);
  }

  const { data, error } = await supabase
    .from("artists")
    .select("id, name, normalized_name, artist_aliases (alias_name)")
    .in("normalized_name", normalizedNames);

  if (error) throw error;

  return applyNormalizedArtistMatches(
    draft,
    (data ?? []).map((artist): ExistingArtistMatch => ({
      id: Number(artist.id),
      name: artist.name,
      normalized_name: artist.normalized_name,
      aliases: (artist.artist_aliases ?? []).map((alias) => alias.alias_name),
    })),
  );
}
