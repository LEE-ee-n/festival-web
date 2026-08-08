import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session) return null;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError?.name === "AuthSessionMissingError") return null;
  if (userError) throw userError;

  return user;
}
