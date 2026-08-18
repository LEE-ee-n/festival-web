import { supabase } from "@/lib/supabase/client";

export type FavoriteFestivalListItem = {
  id: number;
  name: string;
  thumbnailUrl: string | null;
  addedAt: string;
};

export async function getIsFavoriteFestival(userId: string, festivalId: number) {
  const { data, error } = await supabase
    .from("user_favorite_festivals")
    .select("festival_id")
    .eq("user_id", userId)
    .eq("festival_id", festivalId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
export async function addFavoriteFestival(userId: string, festivalId: number) {
  const { error } = await supabase
    .from("user_favorite_festivals")
    .insert({ user_id: userId, festival_id: festivalId });

  if (error) throw error;
}

export async function removeFavoriteFestival(userId: string, festivalId: number) {
  const { error } = await supabase
    .from("user_favorite_festivals")
    .delete()
    .eq("user_id", userId)
    .eq("festival_id", festivalId);

  if (error) throw error;
}

export async function getFavoriteFestivalList(
  userId: string,
): Promise<FavoriteFestivalListItem[]> {
  const { data, error } = await supabase
    .from("user_favorite_festivals")
    .select("created_at, festivals(id, name, thumbnail_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).flatMap((row) => {
    const festival = Array.isArray(row.festivals)
      ? row.festivals[0]
      : row.festivals;

    if (!festival) return [];

    return [{
      id: festival.id,
      name: festival.name,
      thumbnailUrl: festival.thumbnail_url,
      addedAt: row.created_at,
    }];
  });
}
