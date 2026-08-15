import { NextResponse } from "next/server";
import { authenticateGoogleDriveRequest, getDriveConnection, refreshGoogleDriveAccessToken } from "@/lib/google-drive/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await authenticateGoogleDriveRequest(request);
  if (!user) return NextResponse.json({ error: "로그인이 필요하거나 이용 권한이 없습니다." }, { status: 401 });
  try {
    const connection = await getDriveConnection(user.id);
    if (!connection) return NextResponse.json({ error: "Google Drive를 먼저 연결해 주세요." }, { status: 404 });
    const token = await refreshGoogleDriveAccessToken(connection.encrypted_refresh_token);
    const now = new Date().toISOString();
    await createSupabaseAdminClient().from("user_external_connections").update({ last_used_at: now, updated_at: now }).eq("id", connection.id);
    return NextResponse.json(token, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Failed to create Google Drive access token", error);
    return NextResponse.json({ error: "Google Drive 접근 권한을 갱신하지 못했습니다. 다시 연결해 주세요." }, { status: 502 });
  }
}
