import { supabase } from "@/lib/supabase/client";
import { firstRelation } from "@/lib/supabase/relations";
import { toFestivalDiaryRecord } from "./festivalDiaryMapper";
import type {
  FestivalDiaryInput,
  FestivalDiaryListItem,
  FestivalDiaryRecord,
} from "./festivalRecordTypes";

export type * from "./festivalRecordTypes";
export { getFestivalLineupOptions, getFestivalRecordOptions } from "./festivalRecordOptions";
export { getFestivalRecordDetail, saveFestivalArtistRecord, saveFestivalRecord } from "./festivalRecords";

export async function getFestivalDiary(
  userId: string,
  festivalId: number,
): Promise<FestivalDiaryRecord | null> {
  const { data, error } = await supabase
    .from("user_festival_diaries")
    .select("id, festival_id, attended_date, title, content, created_at, updated_at")
    .eq("user_id", userId)
    .eq("festival_id", festivalId)
    .maybeSingle();

  if (error) throw error;
  return data ? toFestivalDiaryRecord(data) : null;
}

export async function saveFestivalDiary(
  userId: string,
  festivalId: number,
  diaryId: number | null,
  input: FestivalDiaryInput,
): Promise<FestivalDiaryRecord> {
  const values = {
    attended_date: input.attendedDate,
    title: input.title.trim(),
    content: input.content.trim(),
  };

  const query = diaryId
    ? supabase
        .from("user_festival_diaries")
        .update(values)
        .eq("id", diaryId)
        .eq("user_id", userId)
    : supabase
        .from("user_festival_diaries")
        .insert({
          ...values,
          attended_dates: [input.attendedDate],
          user_id: userId,
          festival_id: festivalId,
        });

  const { data, error } = await query
    .select("id, festival_id, attended_date, title, content, created_at, updated_at")
    .single();

  if (error) throw error;
  return toFestivalDiaryRecord(data);
}

export async function deleteFestivalDiary(
  userId: string,
  diaryId: number,
): Promise<void> {
  const { error } = await supabase
    .from("user_festival_diaries")
    .delete()
    .eq("id", diaryId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function getFestivalDiaryList(
  userId: string,
): Promise<FestivalDiaryListItem[]> {
  const { data, error } = await supabase
    .from("user_festival_diaries")
    .select(`
      id, festival_id, attended_date, attended_dates, title, content, summary, cover_image_url,
      created_at, updated_at,
      festivals (id, name, location, start_date, end_date, thumbnail_url)
    `)
    .eq("user_id", userId)
    .order("attended_date", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;

  return (data ?? []).flatMap((row) => {
    const festival = firstRelation(row.festivals);

    if (!festival) return [];

    return [{
      ...toFestivalDiaryRecord(row),
      festivalName: festival.name,
      festivalLocation: festival.location,
      festivalStartDate: festival.start_date,
      festivalEndDate: festival.end_date,
      festivalThumbnailUrl: festival.thumbnail_url,
      summary: row.summary || row.title,
      coverImageUrl: row.cover_image_url,
    }];
  });
}
