import { supabase } from "@/lib/supabase/client";
import { parseFestivalTicketResult } from "@/lib/supabase/rpcResults";

type AddFestivalTicketInput = {
  roundType: string;
  roundName: string;
  openAt: string;
  priceInfo: string;
  ticketPlatform: string;
  ticketUrl: string;
};

export async function addFestivalTicket(
  festivalId: number,
  input: AddFestivalTicketInput,
  metadata?: { sourceUrl?: string; note?: string },
) {
  const { data, error } = await supabase.rpc("change_festival_ticket_with_audit", {
      p_festival_id: festivalId,
      p_operation: "insert",
      p_ticket: {
      round_type: input.roundType,
      round_name: input.roundName.trim(),
      open_at: new Date(input.openAt).toISOString(),
      price_info: input.priceInfo.trim() || null,
      ticket_platform:
        input.ticketPlatform.trim() || null,
      ticket_url: input.ticketUrl.trim() || null,
      },
      p_source_url: metadata?.sourceUrl?.trim() || undefined,
      p_note: metadata?.note?.trim() || undefined,
    });

  if (error) {
    throw error;
  }

  return parseFestivalTicketResult(data);
}
