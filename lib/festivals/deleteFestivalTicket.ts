import { supabase } from "@/lib/supabase/client";

export async function deleteFestivalTicket(
  festivalId: string,
  ticketId: number,
  metadata?: { sourceUrl?: string; note?: string },
) {
  const { error } = await supabase.rpc("change_festival_ticket_with_audit", {
    p_festival_id: Number(festivalId),
    p_operation: "delete",
    p_ticket_id: ticketId,
    p_ticket: {},
    p_source_url: metadata?.sourceUrl?.trim() || null,
    p_note: metadata?.note?.trim() || null,
  });

  if (error) {
    throw error;
  }
}
