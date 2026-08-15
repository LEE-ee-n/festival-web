import { NextResponse } from "next/server";
import { authenticateGoogleDriveRequest, getDriveConnection } from "@/lib/google-drive/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await authenticateGoogleDriveRequest(request);
  if (!user) return NextResponse.json({ error: "로그인이 필요하거나 이용 권한이 없습니다." }, { status: 401 });
  try {
    const connection = await getDriveConnection(user.id);
    return NextResponse.json({ connected: Boolean(connection), connectedAt: connection?.connected_at ?? null,
      lastUsedAt: connection?.last_used_at ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to read Google Drive status", error);
    return NextResponse.json({ error: "Google Drive 연결 상태를 확인하지 못했습니다." }, { status: 500 });
  }
}
