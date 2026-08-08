import type { User } from "@supabase/supabase-js";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { supabase } from "@/lib/supabase/client";

export type CurrentAdminAccess = {
  user: User | null;
  isAdmin: boolean;
};

export async function getCurrentAdminAccess(): Promise<CurrentAdminAccess> {
  const user = await getCurrentUser();

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
