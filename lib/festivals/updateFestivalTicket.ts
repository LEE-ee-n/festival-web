import { supabase } from "@/lib/supabase/client";

export type FestivalTicketUpdate = {
  id: number;
  round_type: string | null;
  round_name: string;
  open_at: string | null;
  price_info: string | null;
  ticket_url: string | null;
  ticket_platform: string | null;
};

export async function updateFestivalTicket(
  festivalId: number,
  round: FestivalTicketUpdate,
  metadata?: { sourceUrl?: string; note?: string },
) {
  const { error } = await supabase.rpc("change_festival_ticket_with_audit", {
      p_festival_id: festivalId,
      p_operation: "update",
      p_ticket_id: round.id,
      p_ticket: {
      round_type: round.round_type,
      round_name: round.round_name,
      open_at: round.open_at,
      price_info: round.price_info,
      ticket_url: round.ticket_url,
      ticket_platform: round.ticket_platform,
      },
      p_source_url: metadata?.sourceUrl?.trim() || undefined,
      p_note: metadata?.note?.trim() || undefined,
    });

  if (error) {
    throw error;
  }
}
