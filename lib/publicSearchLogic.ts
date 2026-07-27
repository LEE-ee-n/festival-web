export type PublicArtistSearchResult = {
  id: number;
  name: string;
  normalized_name: string;
  aliases: string[];
};

export function normalizePublicSearchText(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export function escapeIlikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export function uniqueById<T extends { id: number }>(items: T[]) {
  return Array.from(
    new Map(items.map((item) => [item.id, item])).values(),
  );
}

function artistRelevance(
  artist: PublicArtistSearchResult,
  normalizedKeyword: string,
) {
  const values = [
    artist.name,
    artist.normalized_name,
    ...artist.aliases,
  ].map(normalizePublicSearchText);

  if (values.some((value) => value === normalizedKeyword)) return 0;
  if (values.some((value) => value.startsWith(normalizedKeyword))) return 1;
  return 2;
}

export function sortAndLimitArtists(
  artists: PublicArtistSearchResult[],
  keyword: string,
  limit = 10,
) {
  const normalizedKeyword = normalizePublicSearchText(keyword);

  return uniqueById(artists)
    .sort((left, right) => {
      const relevance =
        artistRelevance(left, normalizedKeyword) -
        artistRelevance(right, normalizedKeyword);
      return relevance || left.name.localeCompare(right.name, "ko");
    })
    .slice(0, limit);
}
