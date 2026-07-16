import { supabase } from "@/lib/supabase/client";

export type ArtistSearchResult = {
  id: number;
  name: string;
  normalized_name: string;
  similarity_score: number;
};

export async function searchArtists(
  keyword: string,
): Promise<ArtistSearchResult[]> {
  // 1. 대표 이름 부분 검색
  const { data: nameMatches, error: nameError } =
    await supabase
      .from("artists")
      .select(`
        id,
        name,
        normalized_name
      `)
      .ilike("name", `%${keyword}%`)
      .limit(20);

  if (nameError) {
    throw nameError;
  }

  // 2. 별칭 부분 검색
  const { data: aliasMatches, error: aliasError } =
    await supabase
      .from("artist_aliases")
      .select(`
        artist_id,
        artists!inner (
          id,
          name,
          normalized_name
        )
      `)
      .ilike("alias_name", `%${keyword}%`)
      .limit(20);

  if (aliasError) {
    throw aliasError;
  }

  const directResults: ArtistSearchResult[] = [
    ...(nameMatches ?? []).map((artist) => ({
      id: artist.id,
      name: artist.name,
      normalized_name: artist.normalized_name,
      similarity_score: 1,
    })),

    ...(aliasMatches ?? []).flatMap((row) => {
      const artist = Array.isArray(row.artists)
        ? row.artists[0]
        : row.artists;

      return artist
        ? [
            {
              id: artist.id,
              name: artist.name,
              normalized_name: artist.normalized_name,
              similarity_score: 1,
            },
          ]
        : [];
    }),
  ];

  // 대표명과 별칭 검색 결과 중복 제거
  const uniqueDirectResults = Array.from(
    new Map(
      directResults.map((artist) => [
        artist.id,
        artist,
      ]),
    ).values(),
  );

  if (uniqueDirectResults.length > 0) {
    return uniqueDirectResults;
  }

  // 3. 직접 검색 결과가 없으면 유사도 검색
  const { data, error } = await supabase.rpc(
    "search_similar_artists",
    {
      input_name: keyword,
    },
  );

  if (error) {
    throw error;
  }

  return (data ?? []) as ArtistSearchResult[];
}