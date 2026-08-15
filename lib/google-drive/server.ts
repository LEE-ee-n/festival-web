import "server-only";

import type { User } from "@supabase/supabase-js";
import { parseBearerAccessToken } from "@/lib/auth/accountDeletion";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptDriveSecret, encryptDriveSecret } from "./tokenCipher";
import { GOOGLE_DRIVE_PROVIDER } from "./types";

export class GoogleDriveConfigurationError extends Error {
  constructor(readonly missingVariables: readonly string[]) {
    super("Google Drive server configuration is incomplete.");
    this.name = "GoogleDriveConfigurationError";
  }
}

export function getGoogleDriveServerConfig() {
  const values = {
    clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    encryptionKey: process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY,
  };
  const names = {
    clientId: "GOOGLE_DRIVE_CLIENT_ID",
    clientSecret: "GOOGLE_DRIVE_CLIENT_SECRET",
    encryptionKey: "GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY",
  } as const;
  const missingVariables = (Object.keys(values) as Array<keyof typeof values>)
    .filter((key) => !values[key]).map((key) => names[key]);
  if (!values.clientId || !values.clientSecret || !values.encryptionKey) {
    throw new GoogleDriveConfigurationError(missingVariables);
  }
  return values as { clientId: string; clientSecret: string; encryptionKey: string };
}

export async function authenticateGoogleDriveRequest(request: Request): Promise<User | null> {
  const token = parseBearerAccessToken(request.headers.get("authorization"));
  if (!token) return null;
  const admin = createSupabaseAdminClient();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;

  const now = new Date().toISOString();
  const [{ data: profile }, { data: entitlement }] = await Promise.all([
    admin.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    admin.from("service_access_entitlements").select("id")
      .eq("user_id", user.id).eq("entitlement_key", "personal_features")
      .eq("status", "active").lte("starts_at", now)
      .or(`ends_at.is.null,ends_at.gt.${now}`).limit(1).maybeSingle(),
  ]);
  return profile?.role === "admin" || entitlement ? user : null;
}

export async function getDriveConnection(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("user_external_connections")
    .select("id, encrypted_refresh_token, granted_scopes, connected_at, last_used_at")
    .eq("user_id", userId).eq("provider", GOOGLE_DRIVE_PROVIDER).maybeSingle();
  if (error) throw error;
  return data;
}

export function encryptRefreshToken(refreshToken: string): string {
  return encryptDriveSecret(refreshToken, getGoogleDriveServerConfig().encryptionKey);
}

export function decryptRefreshToken(encryptedToken: string): string {
  return decryptDriveSecret(encryptedToken, getGoogleDriveServerConfig().encryptionKey);
}

export async function refreshGoogleDriveAccessToken(encryptedRefreshToken: string) {
  const config = getGoogleDriveServerConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret,
      refresh_token: decryptRefreshToken(encryptedRefreshToken), grant_type: "refresh_token" }),
    cache: "no-store",
  });
  const result = await response.json() as { access_token?: string; expires_in?: number; error?: string };
  if (!response.ok || !result.access_token) throw new Error(`Google Drive token refresh failed: ${result.error ?? response.status}`);
  return { accessToken: result.access_token, expiresIn: result.expires_in ?? 3600 };
}
