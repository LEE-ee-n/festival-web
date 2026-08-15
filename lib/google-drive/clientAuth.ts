import { supabase } from "@/lib/supabase/client";

export async function getGoogleDriveApiHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("로그인이 필요합니다.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function parseGoogleDriveApiError(response: Response) {
  const body = await response.json().catch(() => ({})) as { error?: string };
  return body.error ?? "Google Drive 요청을 처리하지 못했습니다.";
}
