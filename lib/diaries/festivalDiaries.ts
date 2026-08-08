import { supabase } from "@/lib/supabase/client";

export type FestivalDiaryRecord = {
  id: number;
  festivalId: number;
  attendedDate: string;
  attendedDates: string[];
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type FestivalDiaryListItem = FestivalDiaryRecord & {
  festivalName: string;
  festivalLocation: string | null;
  festivalStartDate: string;
  festivalEndDate: string;
  festivalThumbnailUrl: string | null;
  summary: string;
  coverImageUrl: string | null;
};

export type FestivalRecordOption = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  location: string | null;
  thumbnailUrl: string | null;
};

export type FestivalLineupOption = {
  id: number;
  performanceDate: string | null;
  performanceTime: string | null;
  performanceEndTime: string | null;
  stageName: string | null;
  artistId: number;
  artistName: string;
};

export type FestivalExperienceStatus = "watched" | "briefly" | "missed";

export type FestivalRecordPerformance = FestivalLineupOption & {
  recordPerformanceId: number;
  experienceStatus: FestivalExperienceStatus | null;
  rating: number | null;
  memo: string | null;
  artistImageUrl: string | null;
  songs: Array<{ id: number; songName: string }>;
  media: Array<{
    id: number;
    provider: string;
    externalFileId: string | null;
    previewUrl: string | null;
    fileType: string;
  }>;
};

export type FestivalRecordDetail = FestivalDiaryListItem & {
  favoritePerformanceId: number | null;
  performances: FestivalRecordPerformance[];
};

type FestivalDiaryInput = {
  attendedDate: string;
  title: string;
  content: string;
};

function toDiaryRecord(row: {
  id: number;
  festival_id: number;
  attended_date: string;
  attended_dates?: string[];
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}): FestivalDiaryRecord {
  return {
    id: row.id,
    festivalId: row.festival_id,
    attendedDate: row.attended_date,
    attendedDates: row.attended_dates ?? [row.attended_date],
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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
  return data ? toDiaryRecord(data) : null;
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
  return toDiaryRecord(data);
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
    const festival = Array.isArray(row.festivals)
      ? row.festivals[0]
      : row.festivals;

    if (!festival) return [];

    return [{
      ...toDiaryRecord(row),
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
    const artist = Array.isArray(row.artists) ? row.artists[0] : row.artists;
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

export async function saveFestivalRecord(input: {
  recordId: number | null;
  festivalId: number;
  attendedDates: string[];
  summary: string;
  coverImageUrl: string | null;
  festivalArtistIds: number[];
}): Promise<number> {
  const { data, error } = await supabase.rpc("save_user_festival_record", {
    // PostgreSQL 함수는 신규 기록에서 NULL을 허용하지만 생성 타입에는 nullable이 표현되지 않는다.
    p_record_id: input.recordId as number,
    p_festival_id: input.festivalId,
    p_attended_dates: input.attendedDates,
    p_summary: input.summary.trim(),
    p_cover_image_url: input.coverImageUrl ?? "",
    p_festival_artist_ids: input.festivalArtistIds,
  });

  if (error) throw error;
  return data;
}

export async function saveFestivalArtistRecord(input: {
  recordPerformanceId: number;
  experienceStatus: FestivalExperienceStatus;
  rating: number | null;
  memo: string;
  songNames: string[];
}): Promise<number> {
  const { data, error } = await supabase.rpc("save_user_festival_artist_record", {
    p_record_performance_id: input.recordPerformanceId,
    p_experience_status: input.experienceStatus,
    // PostgreSQL 함수는 선택하지 않은 평점에서 NULL을 허용한다.
    p_rating: input.rating as number,
    p_memo: input.memo.trim(),
    p_song_names: input.songNames,
  });

  if (error) throw error;
  return data;
}

export async function getFestivalRecordDetail(
  userId: string,
  recordId: number,
): Promise<FestivalRecordDetail | null> {
  const { data, error } = await supabase
    .from("user_festival_diaries")
    .select(`
      id, festival_id, attended_date, attended_dates, title, content, summary, cover_image_url,
      favorite_performance_id, created_at, updated_at,
      festivals (id, name, location, start_date, end_date, thumbnail_url),
      user_festival_performances!user_festival_performances_user_festival_diary_id_fkey (
        id, experience_status, rating, memo,
        festival_artists (
          id, performance_date, performance_time, performance_end_time, stage_name,
          artists (id, name, image_url)
        ),
        user_festival_songs (id, song_name),
        user_festival_media (id, provider, external_file_id, preview_url, file_type)
      )
    `)
    .eq("id", recordId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const festival = Array.isArray(data.festivals) ? data.festivals[0] : data.festivals;
  if (!festival) return null;

  const performances = (data.user_festival_performances ?? []).flatMap((row) => {
    const lineup = Array.isArray(row.festival_artists)
      ? row.festival_artists[0]
      : row.festival_artists;
    const artist = lineup
      ? Array.isArray(lineup.artists) ? lineup.artists[0] : lineup.artists
      : null;
    if (!lineup || !artist) return [];
    return [{
      recordPerformanceId: row.id,
      experienceStatus: row.experience_status as FestivalExperienceStatus | null,
      id: lineup.id,
      performanceDate: lineup.performance_date,
      performanceTime: lineup.performance_time,
      performanceEndTime: lineup.performance_end_time,
      stageName: lineup.stage_name,
      artistId: artist.id,
      artistName: artist.name,
      artistImageUrl: artist.image_url,
      rating: row.rating,
      memo: row.memo,
      songs: (row.user_festival_songs ?? []).map((song) => ({
        id: song.id,
        songName: song.song_name,
      })),
      media: (row.user_festival_media ?? []).map((media) => ({
        id: media.id,
        provider: media.provider,
        externalFileId: media.external_file_id,
        previewUrl: media.preview_url,
        fileType: media.file_type,
      })),
    }];
  }).sort((a, b) =>
    (a.performanceDate ?? "9999").localeCompare(b.performanceDate ?? "9999") ||
    (a.performanceTime ?? "99:99").localeCompare(b.performanceTime ?? "99:99"),
  );

  return {
    ...toDiaryRecord(data),
    festivalName: festival.name,
    festivalLocation: festival.location,
    festivalStartDate: festival.start_date,
    festivalEndDate: festival.end_date,
    festivalThumbnailUrl: festival.thumbnail_url,
    summary: data.summary || data.title,
    coverImageUrl: data.cover_image_url,
    favoritePerformanceId: data.favorite_performance_id,
    performances,
  };
}
