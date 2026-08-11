import type { User } from "@supabase/supabase-js";

import { recoverDeletedAuthUser } from "@/lib/auth/authUserError";
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
  const recoveredDeletedUser = await recoverDeletedAuthUser({
    error: userError,
    currentPath:
      typeof window === "undefined" ? "/" : window.location.pathname,
    clearLocalSession: async () => {
      await supabase.auth.signOut({ scope: "local" });
    },
    redirectHome: () => {
      if (typeof window !== "undefined") window.location.replace("/");
    },
  });
  if (recoveredDeletedUser) {
    return null;
  }
  if (userError) throw userError;

  return user;
}
