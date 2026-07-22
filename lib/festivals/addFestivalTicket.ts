import { supabase } from "@/lib/supabase/client";

type AddFestivalTicketInput = {
  roundType: string;
  roundName: string;
  openAt: string;
  priceInfo: string;
  ticketPlatform: string;
  ticketUrl: string;
};

export async function addFestivalTicket(
  festivalId: string,
  input: AddFestivalTicketInput,
  metadata?: { sourceUrl?: string; note?: string },
) {
  const { data, error } = await supabase.rpc("change_festival_ticket_with_audit", {
      p_festival_id: Number(festivalId),
      p_operation: "insert",
      p_ticket_id: null,
      p_ticket: {
      round_type: input.roundType,
      round_name: input.roundName.trim(),
      open_at: new Date(input.openAt).toISOString(),
      price_info: input.priceInfo.trim() || null,
      ticket_platform:
        input.ticketPlatform.trim() || null,
      ticket_url: input.ticketUrl.trim() || null,
      },
      p_source_url: metadata?.sourceUrl?.trim() || null,
      p_note: metadata?.note?.trim() || null,
    });

  if (error) {
    throw error;
  }

  return (data as { ticket: unknown }).ticket;
}
