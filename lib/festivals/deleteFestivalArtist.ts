import { supabase } from "@/lib/supabase/client";

export async function deleteFestivalArtist(
  festivalId: number,
  lineupId: number,
) {
  const { error } = await supabase
    .from("festival_artists")
    .delete()
    .eq("festival_id", festivalId)
    .eq("id", lineupId);

  if (error) {
    throw error;
  }
}
