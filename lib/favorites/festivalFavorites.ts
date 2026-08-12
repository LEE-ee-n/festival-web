import { supabase } from "@/lib/supabase/client";

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
