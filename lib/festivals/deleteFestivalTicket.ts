import { supabase } from "@/lib/supabase/client";

export async function deleteFestivalTicket(
  festivalId: number,
  ticketId: number,
  metadata?: { sourceUrl?: string; note?: string },
) {
  const { error } = await supabase.rpc("change_festival_ticket_with_audit", {
    p_festival_id: festivalId,
    p_operation: "delete",
    p_ticket_id: ticketId,
    p_ticket: {},
    p_source_url: metadata?.sourceUrl?.trim() || undefined,
    p_note: metadata?.note?.trim() || undefined,
  });

  if (error) {
    throw error;
  }
}
