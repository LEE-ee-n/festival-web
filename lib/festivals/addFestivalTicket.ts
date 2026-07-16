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
) {
  const { data, error } = await supabase
    .from("festival_ticket_rounds")
    .insert({
      festival_id: Number(festivalId),
      round_type: input.roundType,
      round_name: input.roundName.trim(),
      open_at: new Date(input.openAt).toISOString(),
      price_info: input.priceInfo.trim() || null,
      ticket_platform:
        input.ticketPlatform.trim() || null,
      ticket_url: input.ticketUrl.trim() || null,
    })
    .select(`
      id,
      round_type,
      round_name,
      open_at,
      price_info,
      ticket_url,
      ticket_platform
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
}