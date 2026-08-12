import { supabase } from "@/lib/supabase/client";

const PUSH_TOKEN_STORAGE_KEY = "festibom:expo-push-token";

export async function registerCurrentPushDevice(
  token: string,
  platform: "android" | "ios",
  appVersion: string,
) {
  const { error } = await supabase.rpc("register_push_device", {
    p_expo_push_token: token,
    p_platform: platform,
    p_app_version: appVersion,
  });

  if (error) throw error;
  window.localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
}
export async function deactivateCurrentPushDevice() {
  const token = window.localStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  if (!token) return;

  const { error } = await supabase.rpc("deactivate_push_device", {
    p_expo_push_token: token,
  });

  if (error) throw error;
  window.localStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
}
