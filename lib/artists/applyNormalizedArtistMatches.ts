import type { FestivalDraftJson } from "@/lib/types";

export type ExistingArtistMatch = {
  id: number;
  name: string;
  normalized_name: string;
  aliases: string[];
};

type FestivalDraftArtist = FestivalDraftJson["artists"][number];

export function applyExistingArtistSelection(
  artist: FestivalDraftArtist,
  existingArtist: ExistingArtistMatch,
): FestivalDraftArtist {
  return {
    ...artist,
    display_name: existingArtist.name,
    normalized_name: existingArtist.normalized_name,
    aliases: [...existingArtist.aliases],
    matched_artist_id: existingArtist.id,
    match_status: "matched",
  };
}

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
          match_status: "pending",
        };
      }

      return applyExistingArtistSelection(artist, existingArtist);
    }),
  };
}
