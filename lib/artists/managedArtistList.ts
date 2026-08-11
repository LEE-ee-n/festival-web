export type ManagedArtistRow = {
  id: number;
  name: string;
  normalized_name: string;
  aliases: string[];
  image_url: string | null;
  instagram_url: string | null;
  featured_playlist_url: string | null;
};

export type ArtistSortKey = "id" | "name" | "normalized_name";
export type SortDirection = "asc" | "desc";

export function filterAndSortManagedArtists(
  artists: ManagedArtistRow[],
  filter: string,
  sortKey: ArtistSortKey,
  sortDirection: SortDirection,
): ManagedArtistRow[] {
  const query = filter.trim().toLowerCase();
  const filtered = query
    ? artists.filter(
        (artist) =>
          artist.name.toLowerCase().includes(query)
          || artist.normalized_name.toLowerCase().includes(query)
          || artist.aliases.some((alias) => alias.toLowerCase().includes(query))
          || String(artist.id).includes(query),
      )
    : [...artists];

  return filtered.sort((left, right) => {
    const comparison = sortKey === "id"
      ? left.id - right.id
      : left[sortKey].localeCompare(right[sortKey], "ko");

    return sortDirection === "asc" ? comparison : -comparison;
  });
}
