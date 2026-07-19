import { supabase } from "@/lib/supabase/client";

type AddFestivalArtistInput = {
  artistId: number;
  performanceDate: string;
  performanceTime: string;
  performanceEndTime: string;
  stageName: string;
  status: string;
};

export async function addFestivalArtist(
  festivalId: string,
  input: AddFestivalArtistInput,
) {
  const { data, error } = await supabase
    .from("festival_artists")
    .insert({
      festival_id: Number(festivalId),
      artist_id: input.artistId,
      performance_date: input.performanceDate || null,
      performance_time: input.performanceTime || null,
      performance_end_time:
        input.performanceEndTime || null,
      stage_name: input.stageName.trim() || null,
      status: input.status,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
