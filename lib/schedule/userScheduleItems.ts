import { supabase } from "@/lib/supabase/client";

export type UserScheduleListItem = {
  festivalArtistId: number;
  festivalId: number;
  festivalName: string;
  festivalLocation: string | null;
  artistId: number;
  artistName: string;
  performanceDate: string | null;
  performanceTime: string | null;
  performanceEndTime: string | null;
  stageName: string | null;
  addedAt: string;
};

export async function getSelectedScheduleItemIds(
  userId: string,
  festivalArtistIds: number[],
): Promise<number[]> {
  if (festivalArtistIds.length === 0) return [];

  const { data, error } = await supabase
    .from("user_schedule_items")
    .select("festival_artist_id")
    .eq("user_id", userId)
    .in("festival_artist_id", festivalArtistIds);

  if (error) throw error;
  return (data ?? []).map((row) => row.festival_artist_id);
}

export async function addScheduleItem(
  userId: string,
  festivalArtistId: number,
): Promise<void> {
  const { error } = await supabase
    .from("user_schedule_items")
    .insert({
      user_id: userId,
      festival_artist_id: festivalArtistId,
    });

  if (error) throw error;
}

export async function removeScheduleItem(
  userId: string,
  festivalArtistId: number,
): Promise<void> {
  const { error } = await supabase
    .from("user_schedule_items")
    .delete()
    .eq("user_id", userId)
    .eq("festival_artist_id", festivalArtistId);

  if (error) throw error;
}

export async function getUserScheduleList(
  userId: string,
): Promise<UserScheduleListItem[]> {
  const { data, error } = await supabase
    .from("user_schedule_items")
    .select(`
      created_at,
      festival_artists (
        id, artist_id, performance_date, performance_time,
        performance_end_time, stage_name,
        artists (id, name),
        festivals (id, name, location)
      )
    `)
    .eq("user_id", userId);

  if (error) throw error;

  return (data ?? [])
    .flatMap((row) => {
      const performance = Array.isArray(row.festival_artists)
        ? row.festival_artists[0]
        : row.festival_artists;
      const artist = performance
        ? Array.isArray(performance.artists)
          ? performance.artists[0]
          : performance.artists
        : null;
      const festival = performance
        ? Array.isArray(performance.festivals)
          ? performance.festivals[0]
          : performance.festivals
        : null;

      if (
        !performance ||
        !artist ||
        !festival
      ) {
        return [];
      }

      return [{
        festivalArtistId: performance.id,
        festivalId: festival.id,
        festivalName: festival.name,
        festivalLocation: festival.location,
        artistId: artist.id,
        artistName: artist.name,
        performanceDate: performance.performance_date,
        performanceTime: performance.performance_time,
        performanceEndTime: performance.performance_end_time,
        stageName: performance.stage_name,
        addedAt: row.created_at,
      }];
    })
    .sort((a, b) =>
      (a.performanceDate ?? "9999-99-99").localeCompare(
        b.performanceDate ?? "9999-99-99",
      ) ||
      (a.performanceTime ?? "99:99:99").localeCompare(
        b.performanceTime ?? "99:99:99",
      ) ||
      a.festivalName.localeCompare(b.festivalName, "ko") ||
      a.artistName.localeCompare(b.artistName, "ko"),
    );
}
