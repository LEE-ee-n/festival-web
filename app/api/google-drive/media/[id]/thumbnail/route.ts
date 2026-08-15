import { NextResponse } from "next/server";

import {
  authenticateGoogleDriveRequest,
  getDriveConnection,
  refreshGoogleDriveAccessToken,
} from "@/lib/google-drive/server";
import { GOOGLE_DRIVE_PROVIDER } from "@/lib/google-drive/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await authenticateGoogleDriveRequest(request);
  if (!user) return NextResponse.json({ error: "로그인이 필요하거나 이용 권한이 없습니다." }, { status: 401 });

  try {
    const { id } = await context.params;
    const mediaId = Number(id);
    if (!Number.isInteger(mediaId) || mediaId <= 0) {
      return NextResponse.json({ error: "올바른 미디어 정보가 필요합니다." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: media, error: mediaError } = await admin.from("user_festival_media")
      .select("external_file_id, file_type, user_festival_performance_id")
      .eq("id", mediaId).eq("provider", GOOGLE_DRIVE_PROVIDER).maybeSingle();
    if (mediaError) throw mediaError;
    if (!media?.external_file_id || media.file_type !== "image") {
      return NextResponse.json({ error: "사진을 찾을 수 없습니다." }, { status: 404 });
    }

    const { data: performance, error: performanceError } = await admin.from("user_festival_performances")
      .select("user_festival_diary_id").eq("id", media.user_festival_performance_id).maybeSingle();
    if (performanceError) throw performanceError;
    if (!performance) return NextResponse.json({ error: "사진 기록을 찾을 수 없습니다." }, { status: 404 });

    const { data: diary, error: diaryError } = await admin.from("user_festival_diaries")
      .select("id").eq("id", performance.user_festival_diary_id).eq("user_id", user.id).maybeSingle();
    if (diaryError) throw diaryError;
    if (!diary) return NextResponse.json({ error: "이 사진을 볼 권한이 없습니다." }, { status: 403 });

    const connection = await getDriveConnection(user.id);
    if (!connection) return NextResponse.json({ error: "Google Drive를 다시 연결해 주세요." }, { status: 404 });
    const token = await refreshGoogleDriveAccessToken(connection.encrypted_refresh_token);
    const authorization = { Authorization: `Bearer ${token.accessToken}` };
    const metadataResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(media.external_file_id)}?fields=mimeType,thumbnailLink`,
      { headers: authorization, cache: "no-store" },
    );
    if (!metadataResponse.ok) throw new Error(`Google Drive thumbnail metadata failed: ${metadataResponse.status}`);
    const metadata = await metadataResponse.json() as { mimeType?: string; thumbnailLink?: string };
    const imageResponse = await fetch(
      metadata.thumbnailLink
        ? metadata.thumbnailLink.replace(/=s\d+$/, "=s1200")
        : `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(media.external_file_id)}?alt=media`,
      { headers: authorization, cache: "no-store" },
    );
    if (!imageResponse.ok || !imageResponse.body) throw new Error(`Google Drive thumbnail failed: ${imageResponse.status}`);

    return new Response(imageResponse.body, {
      headers: {
        "Content-Type": imageResponse.headers.get("content-type") ?? metadata.mimeType ?? "image/jpeg",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Failed to load Google Drive thumbnail", error);
    return NextResponse.json({ error: "Drive 사진을 불러오지 못했습니다." }, { status: 502 });
  }
}
