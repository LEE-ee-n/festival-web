import { supabase } from "@/lib/supabase/client";

export async function deleteFestivalArtist(
  festivalId: string,
  artistId: number,
) {
  const { error } = await supabase
    .from("festival_artists")
    .delete()
    .eq("festival_id", festivalId)
    .eq("artist_id", artistId);

  if (error) {
    throw error;
  }
}