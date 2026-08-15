import { NextResponse } from "next/server";
import { authenticateGoogleDriveRequest, decryptRefreshToken, getDriveConnection } from "@/lib/google-drive/server";
import { GOOGLE_DRIVE_PROVIDER } from "@/lib/google-drive/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  const user = await authenticateGoogleDriveRequest(request);
  if (!user) return NextResponse.json({ error: "로그인이 필요하거나 이용 권한이 없습니다." }, { status: 401 });
  try {
    const connection = await getDriveConnection(user.id);
    if (connection) {
      const token = decryptRefreshToken(connection.encrypted_refresh_token);
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST", cache: "no-store" }).catch(() => undefined);
    }
    const { error } = await createSupabaseAdminClient().from("user_external_connections")
      .delete().eq("user_id", user.id).eq("provider", GOOGLE_DRIVE_PROVIDER);
    if (error) throw error;
    return NextResponse.json({ disconnected: true });
  } catch (error) {
    console.error("Failed to disconnect Google Drive", error);
    return NextResponse.json({ error: "Google Drive 연결을 해제하지 못했습니다." }, { status: 500 });
  }
}
