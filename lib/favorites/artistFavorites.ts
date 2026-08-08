import { supabase } from "@/lib/supabase/client";

export type FavoriteArtistListItem = {
  id: number;
  name: string;
  imageUrl: string | null;
  addedAt: string;
};

export async function getIsFavoriteArtist(
  userId: string,
  artistId: number,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_favorite_artists")
    .select("artist_id")
    .eq("user_id", userId)
    .eq("artist_id", artistId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function addFavoriteArtist(
  userId: string,
  artistId: number,
): Promise<void> {
  const { error } = await supabase
    .from("user_favorite_artists")
    .insert({ user_id: userId, artist_id: artistId });

  if (error) throw error;
}

export async function removeFavoriteArtist(
  userId: string,
  artistId: number,
): Promise<void> {
  const { error } = await supabase
    .from("user_favorite_artists")
    .delete()
    .eq("user_id", userId)
    .eq("artist_id", artistId);

  if (error) throw error;
}

export async function getFavoriteArtistList(
  userId: string,
): Promise<FavoriteArtistListItem[]> {
  const { data, error } = await supabase
    .from("user_favorite_artists")
    .select("created_at, artists(id, name, image_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).flatMap((row) => {
    const artist = Array.isArray(row.artists)
      ? row.artists[0]
      : row.artists;

    if (!artist) return [];

    return [
      {
        id: artist.id,
        name: artist.name,
        imageUrl: artist.image_url,
        addedAt: row.created_at,
      },
    ];
  });
}
