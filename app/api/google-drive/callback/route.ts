import { NextResponse } from "next/server";
import { parseDriveOAuthState } from "@/lib/google-drive/oauthState";
import { encryptRefreshToken, getGoogleDriveServerConfig } from "@/lib/google-drive/server";
import { GOOGLE_DRIVE_PROVIDER } from "@/lib/google-drive/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function redirectWithResult(request: Request, returnTo: string, result: string) {
  const destination = new URL(returnTo, request.url);
  destination.searchParams.set("drive", result);
  return NextResponse.redirect(destination);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  let returnTo = "/mypage";
  try {
    const config = getGoogleDriveServerConfig();
    const state = parseDriveOAuthState(url.searchParams.get("state") ?? "", config.encryptionKey);
    returnTo = state.returnTo;
    if (url.searchParams.get("error")) return redirectWithResult(request, returnTo, "cancelled");
    const code = url.searchParams.get("code");
    if (!code) return redirectWithResult(request, returnTo, "failed");

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: config.clientId, client_secret: config.clientSecret,
        redirect_uri: new URL("/api/google-drive/callback", request.url).toString(), grant_type: "authorization_code" }),
      cache: "no-store",
    });
    const token = await response.json() as { refresh_token?: string; scope?: string; error?: string };
    if (!response.ok || !token.refresh_token) throw new Error(`OAuth exchange failed: ${token.error ?? response.status}`);

    const now = new Date().toISOString();
    const { error } = await createSupabaseAdminClient().from("user_external_connections").upsert({
      user_id: state.userId, provider: GOOGLE_DRIVE_PROVIDER,
      encrypted_refresh_token: encryptRefreshToken(token.refresh_token),
      granted_scopes: token.scope?.split(" ").filter(Boolean) ?? [],
      connected_at: now, updated_at: now,
    }, { onConflict: "user_id,provider" });
    if (error) throw error;
    return redirectWithResult(request, returnTo, "connected");
  } catch (error) {
    console.error("Google Drive OAuth callback failed", error);
    return redirectWithResult(request, returnTo, "failed");
  }
}
