import type { User } from "@supabase/supabase-js";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { supabase } from "@/lib/supabase/client";

export type CurrentAdminAccess = {
  user: User | null;
  hasAdminRole: boolean;
  currentLevel: string | null;
  nextLevel: string | null;
  isAdmin: boolean;
};

export async function getCurrentAdminAccess(): Promise<CurrentAdminAccess> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      hasAdminRole: false,
      currentLevel: null,
      nextLevel: null,
      isAdmin: false,
    };
  }

  const [profileResult, assuranceResult, adminResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.rpc("is_admin"),
    ]);

  if (profileResult.error) throw profileResult.error;
  if (assuranceResult.error) throw assuranceResult.error;
  if (adminResult.error) throw adminResult.error;

  const hasAdminRole = profileResult.data?.role === "admin";
  const currentLevel = assuranceResult.data.currentLevel;
  const nextLevel = assuranceResult.data.nextLevel;

  return {
    user,
    hasAdminRole,
    currentLevel,
    nextLevel,
    isAdmin:
      hasAdminRole &&
      currentLevel === "aal2" &&
      Boolean(adminResult.data),
  };
}
