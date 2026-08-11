import { supabase } from "@/lib/supabase/client";
import { firstRelation } from "@/lib/supabase/relations";
import type { FestivalLineupOption, FestivalRecordOption } from "./festivalRecordTypes";

export async function getFestivalRecordOptions(
  userId: string,
): Promise<FestivalRecordOption[]> {
  const [festivalsResult, recordsResult] = await Promise.all([
    supabase
      .from("festivals")
      .select("id, name, start_date, end_date, location, thumbnail_url")
      .eq("verification_status", "approved")
      .in("status", ["ongoing", "ended"])
      .order("start_date", { ascending: false }),
    supabase
      .from("user_festival_diaries")
      .select("festival_id")
      .eq("user_id", userId),
  ]);

  if (festivalsResult.error) throw festivalsResult.error;
  if (recordsResult.error) throw recordsResult.error;

  const recordedIds = new Set((recordsResult.data ?? []).map((row) => row.festival_id));
  return (festivalsResult.data ?? [])
    .filter((festival) => !recordedIds.has(festival.id))
    .map((festival) => ({
      id: festival.id,
      name: festival.name,
      startDate: festival.start_date,
      endDate: festival.end_date,
      location: festival.location,
      thumbnailUrl: festival.thumbnail_url,
    }));
}

export async function getFestivalLineupOptions(
  festivalId: number,
): Promise<FestivalLineupOption[]> {
  const { data, error } = await supabase
    .from("festival_artists")
    .select(`
      id, performance_date, performance_time, performance_end_time, stage_name,
      artists (id, name)
    `)
    .eq("festival_id", festivalId)
    .neq("status", "cancelled")
    .order("performance_date", { ascending: true, nullsFirst: false })
    .order("performance_time", { ascending: true, nullsFirst: false });

  if (error) throw error;

  return (data ?? []).flatMap((row) => {
    const artist = firstRelation(row.artists);
    if (!artist) return [];
    return [{
      id: row.id,
      performanceDate: row.performance_date,
      performanceTime: row.performance_time,
      performanceEndTime: row.performance_end_time,
      stageName: row.stage_name,
      artistId: artist.id,
      artistName: artist.name,
    }];
  });
}
