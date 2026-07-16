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
  festivalId: string,
  round: FestivalTicketUpdate,
) {
  const { error } = await supabase
    .from("festival_ticket_rounds")
    .update({
      round_type: round.round_type,
      round_name: round.round_name,
      open_at: round.open_at,
      price_info: round.price_info,
      ticket_url: round.ticket_url,
      ticket_platform: round.ticket_platform,
    })
    .eq("id", round.id)
    .eq("festival_id", festivalId);

  if (error) {
    throw error;
  }
}