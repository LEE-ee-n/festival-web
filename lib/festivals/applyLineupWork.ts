import type { LineupOperation, LineupWorkInput } from "@/lib/audit/lineupWork";
import { supabase } from "@/lib/supabase/client";

export async function applyLineupWork(
  festivalId: number,
  input: LineupWorkInput,
  operations: LineupOperation[],
) {
  const { data, error } = await supabase.rpc("apply_lineup_work_with_audit", {
    p_festival_id: festivalId,
    p_work_type: input.workType,
    p_lineup_round: input.lineupRound,
    p_announcement_date: input.announcementDate || null,
    p_source_url: input.sourceUrl.trim() || null,
    p_reason: input.reason.trim() || null,
    p_operations: operations,
  });

  if (error) throw error;
  return data as number;
}
