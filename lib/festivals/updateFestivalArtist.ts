import { supabase } from "@/lib/supabase/client";

export type FestivalArtistUpdate = {
  id: number;
  artist_id: number;
  performance_date: string | null;
  performance_time: string | null;
  performance_end_time: string | null;
  stage_name: string | null;
  status: string;
};

export async function updateFestivalArtist(
  festivalId: string,
  row: FestivalArtistUpdate,
) {
  const { error } = await supabase
    .from("festival_artists")
    .update({
      performance_date: row.performance_date,
      performance_time: row.performance_time,
      performance_end_time: row.performance_end_time,
      stage_name: row.stage_name,
      status: row.status,
    })
    .eq("festival_id", festivalId)
    .eq("id", row.id);

  if (error) {
    throw error;
  }
}
