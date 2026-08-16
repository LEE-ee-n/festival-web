import { NextResponse } from "next/server";
import { authenticateGoogleDriveRequest, getDriveConnection, refreshGoogleDriveAccessToken } from "@/lib/google-drive/server";
import { GOOGLE_DRIVE_PROVIDER } from "@/lib/google-drive/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await authenticateGoogleDriveRequest(request);
  if (!user) return NextResponse.json({ error: "로그인이 필요하거나 이용 권한이 없습니다." }, { status: 401 });
  try {
    const mediaId = Number((await context.params).id);
    if (!Number.isInteger(mediaId) || mediaId <= 0) return NextResponse.json({ error: "올바른 미디어 번호가 필요합니다." }, { status: 400 });
    const admin = createSupabaseAdminClient();
    const { data: media, error: mediaError } = await admin.from("user_festival_media")
      .select("external_file_id, file_type, user_festival_diary_id")
      .eq("id", mediaId).eq("provider", GOOGLE_DRIVE_PROVIDER).maybeSingle();
    if (mediaError) throw mediaError;
    if (!media?.external_file_id || media.file_type !== "video") return NextResponse.json({ error: "영상을 찾을 수 없습니다." }, { status: 404 });
    const { data: diary, error: diaryError } = await admin.from("user_festival_diaries")
      .select("id").eq("id", media.user_festival_diary_id).eq("user_id", user.id).maybeSingle();
    if (diaryError) throw diaryError;
    if (!diary) return NextResponse.json({ error: "이 미디어를 볼 권한이 없습니다." }, { status: 403 });
    const connection = await getDriveConnection(user.id);
    if (!connection) return NextResponse.json({ error: "Google Drive를 다시 연결해 주세요." }, { status: 404 });
    const token = await refreshGoogleDriveAccessToken(connection.encrypted_refresh_token);
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(media.external_file_id)}?fields=videoMediaMetadata(width,height)`, {
      headers: { Authorization: `Bearer ${token.accessToken}` }, cache: "no-store",
    });
    if (!response.ok) throw new Error(`Google Drive video metadata failed: ${response.status}`);
    const metadata = await response.json() as { videoMediaMetadata?: { width?: number | string; height?: number | string } };
    const width = Number(metadata.videoMediaMetadata?.width);
    const height = Number(metadata.videoMediaMetadata?.height);
    return NextResponse.json(Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 ? { width, height } : { width: 16, height: 9 }, { headers: { "Cache-Control": "private, max-age=3600" } });
  } catch (error) {
    console.error("Failed to load Google Drive video metadata", error);
    return NextResponse.json({ error: "Drive 영상 정보를 불러오지 못했습니다." }, { status: 502 });
  }
}
