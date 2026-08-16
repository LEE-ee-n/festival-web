import { NextResponse } from "next/server";

import { getOrCreateFestivalDriveFolder } from "@/lib/google-drive/folders";
import { authenticateGoogleDriveRequest, getDriveConnection, refreshGoogleDriveAccessToken } from "@/lib/google-drive/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await authenticateGoogleDriveRequest(request);
  if (!user) return NextResponse.json({ error: "로그인이 필요하거나 이용 권한이 없습니다." }, { status: 401 });

  try {
    const body = await request.json() as { recordId?: number; recordPerformanceId?: number };
    const requestedRecordId = Number(body.recordId);
    const recordPerformanceId = Number(body.recordPerformanceId);
    const hasRecordId = Number.isInteger(requestedRecordId) && requestedRecordId > 0;
    const hasPerformanceId = Number.isInteger(recordPerformanceId) && recordPerformanceId > 0;
    if (!hasRecordId && !hasPerformanceId) {
      return NextResponse.json({ error: "올바른 페스티벌 일기가 필요합니다." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    let recordId = hasRecordId ? requestedRecordId : 0;
    if (!recordId && hasPerformanceId) {
      const { data: performance, error: performanceError } = await admin.from("user_festival_performances")
        .select("user_festival_diary_id").eq("id", recordPerformanceId).maybeSingle();
      if (performanceError) throw performanceError;
      if (!performance) return NextResponse.json({ error: "아티스트 기록을 찾을 수 없습니다." }, { status: 404 });
      recordId = performance.user_festival_diary_id;
    }

    const { data: diary, error: diaryError } = await admin.from("user_festival_diaries")
      .select("festival_id").eq("id", recordId).eq("user_id", user.id).maybeSingle();
    if (diaryError) throw diaryError;
    if (!diary) return NextResponse.json({ error: "이 기록의 폴더를 만들 권한이 없습니다." }, { status: 403 });

    const { data: festival, error: festivalError } = await admin.from("festivals")
      .select("id, name").eq("id", diary.festival_id).maybeSingle();
    if (festivalError) throw festivalError;
    if (!festival) return NextResponse.json({ error: "페스티벌을 찾을 수 없습니다." }, { status: 404 });

    const connection = await getDriveConnection(user.id);
    if (!connection) return NextResponse.json({ error: "Google Drive를 먼저 연결해 주세요." }, { status: 404 });
    const token = await refreshGoogleDriveAccessToken(connection.encrypted_refresh_token);
    const folder = await getOrCreateFestivalDriveFolder(token.accessToken, festival.name, festival.id);
    return NextResponse.json({ folderId: folder.id, folderName: folder.name }, {
      headers: { "Cache-Control": "no-store, private" },
    });
  } catch (error) {
    console.error("Failed to prepare Google Drive festival folder", error);
    return NextResponse.json({ error: "페스티벌용 Drive 폴더를 준비하지 못했습니다." }, { status: 502 });
  }
}
