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
  update_festival_calendar_color_with_audit: Omit<
    GeneratedFunctions["update_festival_calendar_color_with_audit"],
    "Args"
  > & {
    Args: Omit<
      GeneratedFunctions["update_festival_calendar_color_with_audit"]["Args"],
      "p_calendar_color"
    > & {
      p_calendar_color: string | null;
    };
  };
};

type AdminRpcFunctions = {
  admin_import_festival_lineup:
    GeneratedFunctions["import_festival_lineup"];
};

type RpcOverrides = NullableRpcFunctions & AdminRpcFunctions;

export type Database = Omit<GeneratedDatabase, "public"> & {
  public: Omit<PublicSchema, "Functions"> & {
    Functions: Omit<GeneratedFunctions, keyof RpcOverrides> & RpcOverrides;
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
