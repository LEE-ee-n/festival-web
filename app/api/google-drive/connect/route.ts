import { NextResponse } from "next/server";
import { createDriveOAuthState, normalizeDriveReturnPath } from "@/lib/google-drive/oauthState";
import { authenticateGoogleDriveRequest, getGoogleDriveServerConfig } from "@/lib/google-drive/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await authenticateGoogleDriveRequest(request);
    if (!user) return NextResponse.json({ error: "로그인이 필요하거나 이용 권한이 없습니다." }, { status: 401 });
    const body = await request.json().catch(() => ({})) as { returnTo?: unknown };
    const config = getGoogleDriveServerConfig();
    const redirectUri = new URL("/api/google-drive/callback", request.url).toString();
    const params = new URLSearchParams({
      client_id: config.clientId, redirect_uri: redirectUri, response_type: "code",
      scope: "https://www.googleapis.com/auth/drive.file", access_type: "offline",
      prompt: "consent", include_granted_scopes: "true",
      state: createDriveOAuthState(user.id, normalizeDriveReturnPath(body.returnTo), config.encryptionKey),
    });
    return NextResponse.json({ authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}` }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to start Google Drive OAuth", error);
    return NextResponse.json({ error: "Google Drive 연결을 시작하지 못했습니다." }, { status: 500 });
  }
}
