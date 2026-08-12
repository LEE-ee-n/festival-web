import type { Tables } from "@/lib/supabase/database";
import { supabase } from "@/lib/supabase/client";

export type NotificationPreferences = Pick<
  Tables<"user_notification_preferences">,
  | "favorite_artist_appearance"
  | "followed_festival_update"
  | "ticket_day_before"
  | "ticket_ten_minutes_before"
>;

export const defaultNotificationPreferences: NotificationPreferences = {
  favorite_artist_appearance: true,
  followed_festival_update: true,
  ticket_day_before: true,
  ticket_ten_minutes_before: true,
};

export async function getNotificationPreferences(userId: string) {
  const { data, error } = await supabase
    .from("user_notification_preferences")
    .select("favorite_artist_appearance, followed_festival_update, ticket_day_before, ticket_ten_minutes_before")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? defaultNotificationPreferences;
}
export async function saveNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences,
) {
  const { error } = await supabase
    .from("user_notification_preferences")
    .upsert({ user_id: userId, ...preferences }, { onConflict: "user_id" });

  if (error) throw error;
}
