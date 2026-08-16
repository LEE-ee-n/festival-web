import { supabase } from "@/lib/supabase/client";
import { firstRelation } from "@/lib/supabase/relations";
import { toFestivalDiaryRecord } from "./festivalDiaryMapper";
import type {
  FestivalExperienceStatus,
  FestivalRecordDetail,
} from "./festivalRecordTypes";

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
      user_festival_media!user_festival_media_user_festival_diary_id_fkey (
        id, user_festival_performance_id, provider, external_file_id, external_file_name,
        mime_type, file_size, preview_url, file_type, featured_image_order, is_featured_video
      ),
      user_festival_performances!user_festival_performances_user_festival_diary_id_fkey (
        id, experience_status, rating, memo,
        festival_artists (
          id, performance_date, performance_time, performance_end_time, stage_name,
          artists (id, name, image_url)
        ),
        user_festival_songs (id, song_name)
      )
    `)
    .eq("id", recordId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const festival = firstRelation(data.festivals);
  if (!festival) return null;

  const media = (data.user_festival_media ?? []).map((item) => ({
    id: item.id,
    recordPerformanceId: item.user_festival_performance_id,
    provider: item.provider,
    externalFileId: item.external_file_id,
    externalFileName: item.external_file_name,
    mimeType: item.mime_type,
    fileSize: item.file_size,
    previewUrl: item.preview_url,
    fileType: item.file_type,
    featuredImageOrder: item.featured_image_order,
    isFeaturedVideo: item.is_featured_video,
  }));

  const performances = (data.user_festival_performances ?? []).flatMap((row) => {
    const lineup = firstRelation(row.festival_artists);
    const artist = lineup ? firstRelation(lineup.artists) : null;
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
      media: media.filter((item) => item.recordPerformanceId === row.id),
    }];
  }).sort((a, b) =>
    (a.performanceDate ?? "9999").localeCompare(b.performanceDate ?? "9999") ||
    (a.performanceTime ?? "99:99").localeCompare(b.performanceTime ?? "99:99"),
  );

  return {
    ...toFestivalDiaryRecord(data),
    festivalName: festival.name,
    festivalLocation: festival.location,
    festivalStartDate: festival.start_date,
    festivalEndDate: festival.end_date,
    festivalThumbnailUrl: festival.thumbnail_url,
    summary: data.summary || data.title,
    coverImageUrl: data.cover_image_url,
    favoritePerformanceId: data.favorite_performance_id,
    performances,
    media,
  };
}
