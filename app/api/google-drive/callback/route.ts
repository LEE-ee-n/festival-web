import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { parseDriveOAuthState } from "@/lib/google-drive/oauthState";
import {
  encryptRefreshToken,
  getGoogleDriveServerConfig,
  hasGoogleDriveServiceAccess,
} from "@/lib/google-drive/server";
import { GOOGLE_DRIVE_PROVIDER } from "@/lib/google-drive/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type CallbackStage =
  | "configuration"
  | "state_validation"
  | "authorization_response"
  | "token_exchange"
  | "token_validation"
  | "token_encryption"
  | "connection_save";

type GoogleTokenResponse = {
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

function describeTokenExchangeFailure(response: Response, token: GoogleTokenResponse) {
  const code = token.error ?? "unknown_error";
  const description = token.error_description?.replace(/[\r\n]+/g, " ").slice(0, 200);
  return `Google token exchange failed (${response.status}, ${code})${description ? `: ${description}` : ""}`;
}

function redirectWithResult(request: Request, returnTo: string, result: string) {
  const destination = new URL(returnTo, request.url);
  destination.searchParams.set("drive", result);
  return NextResponse.redirect(destination);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  let returnTo = "/mypage";
  let stage: CallbackStage = "configuration";
  try {
    const config = getGoogleDriveServerConfig();
    stage = "state_validation";
    const state = parseDriveOAuthState(url.searchParams.get("state") ?? "", config.encryptionKey);
    returnTo = state.returnTo;
    if (!await hasGoogleDriveServiceAccess(state.userId)) {
      return redirectWithResult(request, returnTo, "forbidden");
    }
    stage = "authorization_response";
    if (url.searchParams.get("error")) return redirectWithResult(request, returnTo, "cancelled");
    const code = url.searchParams.get("code");
    if (!code) return redirectWithResult(request, returnTo, "failed");

    stage = "token_exchange";
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: config.clientId, client_secret: config.clientSecret,
        redirect_uri: new URL("/api/google-drive/callback", request.url).toString(), grant_type: "authorization_code" }),
      cache: "no-store",
    });
    const token = await response.json() as GoogleTokenResponse;
    stage = "token_validation";
    if (!response.ok) throw new Error(describeTokenExchangeFailure(response, token));
    if (!token.refresh_token) {
      throw new Error("Google token exchange succeeded without a refresh token.");
    }

    const now = new Date().toISOString();
    stage = "token_encryption";
    const encryptedRefreshToken = encryptRefreshToken(token.refresh_token);
    stage = "connection_save";
    const { error } = await createSupabaseAdminClient().from("user_external_connections").upsert({
      user_id: state.userId, provider: GOOGLE_DRIVE_PROVIDER,
      encrypted_refresh_token: encryptedRefreshToken,
      granted_scopes: token.scope?.split(" ").filter(Boolean) ?? [],
      connected_at: now, updated_at: now,
    }, { onConflict: "user_id,provider" });
    if (error) throw error;
    return redirectWithResult(request, returnTo, "connected");
  } catch (error) {
    const reportedError = error instanceof Error ? error : new Error("Unknown Google Drive OAuth callback error.");
    console.error("Google Drive OAuth callback failed", { stage, error: reportedError });
    Sentry.withScope((scope) => {
      scope.setTag("integration", "google_drive");
      scope.setTag("oauth_stage", stage);
      Sentry.captureException(reportedError);
    });
    await Sentry.flush(2_000);
    return redirectWithResult(request, returnTo, "failed");
  }
}
