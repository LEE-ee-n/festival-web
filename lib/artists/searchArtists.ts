import { supabase } from "@/lib/supabase/client";

export type ArtistSearchResult = {
  id: number;
  name: string;
  normalized_name: string;
  aliases?: string[];
  similarity_score: number;
};

type ArtistAliasRow = { alias_name: string };
type ArtistRelation = {
  id: number;
  name: string;
  normalized_name: string;
  artist_aliases: ArtistAliasRow[];
};
type SimilarArtistRow = {
  id: number;
  name: string;
  normalized_name: string;
  similarity_score: number;
};
function getArtistAliases(artist: ArtistRelation) {
  return (artist.artist_aliases ?? []).map((alias) => alias.alias_name);
}

function firstArtistRelation(
  value: ArtistRelation | ArtistRelation[] | null,
) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

async function addAliasesToSimilarResults(
  artists: SimilarArtistRow[],
): Promise<ArtistSearchResult[]> {
  if (artists.length === 0) return [];
  const { data, error } = await supabase
    .from("artist_aliases")
    .select("artist_id, alias_name")
    .in("artist_id", artists.map((artist) => artist.id));
  if (error) throw error;

  const aliasesByArtistId = new Map<number, string[]>();
  (data ?? []).forEach((alias) => {
    const aliases = aliasesByArtistId.get(alias.artist_id) ?? [];
    aliases.push(alias.alias_name);
    aliasesByArtistId.set(alias.artist_id, aliases);
  });

  return artists.map((artist) => ({
    ...artist,
    aliases: aliasesByArtistId.get(artist.id) ?? [],
  }));
}

function compactSearchText(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "");
}

function searchSimilarity(left: string, right: string) {
  const leftText = compactSearchText(left);
  const rightText = compactSearchText(right);
  if (leftText === rightText) return 1;
  if (!leftText || !rightText) return 0;

  const leftParts = leftText.length < 2
    ? [leftText]
    : Array.from(
      { length: leftText.length - 1 },
      (_, index) => leftText.slice(index, index + 2),
    );
  const rightParts = rightText.length < 2
    ? [rightText]
    : Array.from(
      { length: rightText.length - 1 },
      (_, index) => rightText.slice(index, index + 2),
    );
  const rightCounts = new Map<string, number>();
  rightParts.forEach((part) => {
    rightCounts.set(part, (rightCounts.get(part) ?? 0) + 1);
  });

  let overlap = 0;
  leftParts.forEach((part) => {
    const count = rightCounts.get(part) ?? 0;
    if (count > 0) {
      overlap += 1;
      rightCounts.set(part, count - 1);
    }
  });

  return (2 * overlap) / (leftParts.length + rightParts.length);
}

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
        normalized_name,
        artist_aliases (alias_name)
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
        alias_name,
        artist_id,
        artists!inner (
          id,
          name,
          normalized_name,
          artist_aliases (alias_name)
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
      aliases: getArtistAliases(artist),
      similarity_score: searchSimilarity(keyword, artist.name),
    })),

    ...(aliasMatches ?? []).flatMap((row) => {
      const artist = firstArtistRelation(row.artists);

      return artist
        ? [
            {
              id: artist.id,
              name: artist.name,
              normalized_name: artist.normalized_name,
              aliases: getArtistAliases(artist),
              similarity_score: searchSimilarity(keyword, row.alias_name),
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

  return addAliasesToSimilarResults(data ?? []);
}
