import { supabase } from "@/lib/supabase/client";

export async function deleteFestival(festivalId: number) {
  const { error } = await supabase.rpc(
    "delete_festival_with_audit",
    { p_festival_id: festivalId },
  );

  if (error) {
    throw error;
  }
}
