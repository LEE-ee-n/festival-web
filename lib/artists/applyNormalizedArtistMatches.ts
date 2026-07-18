import type { FestivalDraftJson } from "@/lib/types";

export type ExistingArtistMatch = {
  id: number;
  name: string;
  normalized_name: string;
};

export function applyNormalizedArtistMatches(
  draft: FestivalDraftJson,
  existingArtists: ExistingArtistMatch[],
): FestivalDraftJson {
  const artistByNormalizedName = new Map(
    existingArtists.map((artist) => [artist.normalized_name, artist]),
  );

  return {
    ...draft,
    artists: draft.artists.map((artist) => {
      const normalizedName = artist.normalized_name.trim();
      const existingArtist = artistByNormalizedName.get(normalizedName);

      if (!normalizedName) {
        return {
          ...artist,
          matched_artist_id: null,
          match_status: "pending",
        };
      }

      if (!existingArtist) {
        return {
          ...artist,
          matched_artist_id: null,
          match_status: "new",
        };
      }

      return {
        ...artist,
        display_name: existingArtist.name,
        normalized_name: existingArtist.normalized_name,
        matched_artist_id: existingArtist.id,
        match_status: "matched",
      };
    }),
  };
}
