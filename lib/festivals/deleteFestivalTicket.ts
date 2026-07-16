import { supabase } from "@/lib/supabase/client";

export async function deleteFestivalTicket(
  festivalId: string,
  ticketId: number,
) {
  const { error } = await supabase
    .from("festival_ticket_rounds")
    .delete()
    .eq("id", ticketId)
    .eq("festival_id", festivalId);

  if (error) {
    throw error;
  }
}