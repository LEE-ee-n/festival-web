import { supabase } from "@/lib/supabase/client";

export type AdminServiceUser = {
  signupNumber: number;
  userId: string;
  email: string | null;
  displayName: string;
  isAdmin: boolean;
  joinedAt: string;
  betaAccessNumber: number | null;
  hasBetaAccess: boolean;
  accessStatus: string | null;
  grantedAt: string | null;
  revokedAt: string | null;
  betaLimit: number;
};

export async function getPersonalServiceAccess(): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_personal_service_access");

  if (error) throw error;
  return Boolean(data);
}

export async function getAdminServiceUsers(): Promise<AdminServiceUser[]> {
  const { data, error } = await supabase.rpc("admin_list_service_users");

  if (error) throw error;

  return (data ?? []).map((user) => ({
    signupNumber: user.signup_number,
    userId: user.user_id,
    email: user.email,
    displayName: user.display_name,
    isAdmin: user.is_admin,
    joinedAt: user.joined_at,
    betaAccessNumber: user.beta_access_number,
    hasBetaAccess: user.has_beta_access,
    accessStatus: user.access_status,
    grantedAt: user.granted_at,
    revokedAt: user.revoked_at,
    betaLimit: user.beta_limit,
  }));
}

export async function setAdminBetaAccess(
  userId: string,
  enabled: boolean,
): Promise<void> {
  const { error } = await supabase.rpc("admin_set_beta_access", {
    p_user_id: userId,
    p_enabled: enabled,
  });

  if (error) throw error;
}
