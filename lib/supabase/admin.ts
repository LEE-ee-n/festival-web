import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database";

export class SupabaseAdminConfigurationError extends Error {
  readonly missingVariables: readonly string[];

  constructor(missingVariables: readonly string[]) {
    super("Supabase 서버 전용 환경변수가 설정되지 않았습니다.");
    this.name = "SupabaseAdminConfigurationError";
    this.missingVariables = missingVariables;
  }
}

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missingVariables: string[] = [];

  if (!supabaseUrl) {
    missingVariables.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseSecretKey) {
    missingVariables.push(
      "SUPABASE_SECRET_KEY 또는 SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new SupabaseAdminConfigurationError(missingVariables);
  }

  return createClient<Database>(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
