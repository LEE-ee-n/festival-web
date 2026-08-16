import { NextResponse } from "next/server";
import {
  authenticateGoogleDriveRequest,
  getDriveConnection,
  GoogleDriveConfigurationError,
  refreshGoogleDriveAccessToken,
} from "@/lib/google-drive/server";
import { GOOGLE_DRIVE_PROVIDER } from "@/lib/google-drive/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function getThumbnailErrorResponse(error: unknown) {
  if (error instanceof GoogleDriveConfigurationError) {
    return {
      code: "drive_configuration_missing",
      error: "현재 실행 환경에 Google Drive 서버 설정이 없습니다.",
    };
  }

  const message = error instanceof Error ? error.message : "";
  if (/authenticate data|encrypted value|ENCRYPTION_KEY/i.test(message)) {
    return {
      code: "drive_encryption_key_mismatch",
      error: "현재 실행 환경의 Drive 암호화 키가 연결할 때 사용한 키와 다릅니다.",
    };
  }
  if (/token refresh failed/i.test(message)) {
    return {
      code: "drive_token_refresh_failed",
      error: "Google Drive 연결이 만료되었습니다. 마이페이지에서 Drive를 다시 연결해 주세요.",
    };
  }
  if (/thumbnail metadata failed|thumbnail failed/i.test(message)) {
    return {
      code: "drive_file_fetch_failed",
      error: "Drive에서 사진을 가져오지 못했습니다. 파일이 이동 또는 삭제되었는지 확인해 주세요.",
    };
  }
  return { code: "drive_image_failed", error: "Drive 이미지를 불러오지 못했습니다." };
}

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
    if (!media?.external_file_id || media.file_type !== "image") return NextResponse.json({ error: "이미지를 찾을 수 없습니다." }, { status: 404 });
    const { data: diary, error: diaryError } = await admin.from("user_festival_diaries")
      .select("id").eq("id", media.user_festival_diary_id).eq("user_id", user.id).maybeSingle();
    if (diaryError) throw diaryError;
    if (!diary) return NextResponse.json({ error: "이 미디어를 볼 권한이 없습니다." }, { status: 403 });
    const connection = await getDriveConnection(user.id);
    if (!connection) return NextResponse.json({ error: "Google Drive를 다시 연결해 주세요." }, { status: 404 });
    const token = await refreshGoogleDriveAccessToken(connection.encrypted_refresh_token);
    const authorization = { Authorization: `Bearer ${token.accessToken}` };
    const metadataResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(media.external_file_id)}?fields=mimeType,thumbnailLink`, { headers: authorization, cache: "no-store" });
    if (!metadataResponse.ok) throw new Error(`Google Drive thumbnail metadata failed: ${metadataResponse.status}`);
    const metadata = await metadataResponse.json() as { mimeType?: string; thumbnailLink?: string };
    const requestedSize = Math.min(1200, Math.max(240, Number(new URL(request.url).searchParams.get("size")) || 720));
    const originalUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(media.external_file_id)}?alt=media`;
    let response: Response | null = null;

    if (metadata.thumbnailLink) {
      const thumbnailUrl = metadata.thumbnailLink.replace(/=s\d+(?:-[a-z]+)?$/, `=s${requestedSize}`);
      response = await fetch(thumbnailUrl, { cache: "no-store" });
      if (!response.ok || !response.body) {
        response = await fetch(thumbnailUrl, { headers: authorization, cache: "no-store" });
      }
    }

    if (!response?.ok || !response.body) {
      response = await fetch(originalUrl, { headers: authorization, cache: "no-store" });
    }
    if (!response.ok || !response.body) throw new Error(`Google Drive thumbnail failed: ${response.status}`);
    return new Response(response.body, { headers: {
      "Content-Type": response.headers.get("content-type") ?? metadata.mimeType ?? "image/jpeg",
      "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    console.error("Failed to load Google Drive thumbnail", error);
    return NextResponse.json(getThumbnailErrorResponse(error), { status: 502 });
  }
}
