import type { Database as GeneratedDatabase } from "@/lib/supabase/database.types";

type PublicSchema = GeneratedDatabase["public"];
type GeneratedFunctions = PublicSchema["Functions"];

type NullableRpcFunctions = {
  apply_lineup_work_with_audit: Omit<
    GeneratedFunctions["apply_lineup_work_with_audit"],
    "Args"
  > & {
    Args: Omit<
      GeneratedFunctions["apply_lineup_work_with_audit"]["Args"],
      "p_announcement_date" | "p_reason" | "p_source_url"
    > & {
      p_announcement_date: string | null;
      p_reason: string | null;
      p_source_url: string | null;
    };
  };
  change_festival_thumbnail_with_audit: Omit<
    GeneratedFunctions["change_festival_thumbnail_with_audit"],
    "Args"
  > & {
    Args: Omit<
      GeneratedFunctions["change_festival_thumbnail_with_audit"]["Args"],
      "p_new_url"
    > & {
      p_new_url: string | null;
    };
  };
};

export type Database = Omit<GeneratedDatabase, "public"> & {
  public: Omit<PublicSchema, "Functions"> & {
    Functions: Omit<GeneratedFunctions, keyof NullableRpcFunctions> &
      NullableRpcFunctions;
  };
};

export type {
  CompositeTypes,
  Enums,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";
