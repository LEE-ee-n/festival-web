import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

export type CurrentAdminAccess = {
  user: User | null;
  isAdmin: boolean;
};

export async function getCurrentAdminAccess(): Promise<CurrentAdminAccess> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { user: null, isAdmin: false };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return { user: null, isAdmin: false };
  }

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_admin");

  if (adminError) {
    throw adminError;
  }

  return { user, isAdmin: Boolean(isAdmin) };
}
