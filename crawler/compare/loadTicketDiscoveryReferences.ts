import { createClient } from "@supabase/supabase-js";

import type { TicketDiscoveryReference } from "../../lib/festivals/ticketDiscovery.ts";
import type { Database } from "../../lib/supabase/database.types.ts";

export async function loadTicketDiscoveryReferences(input: {
  url: string;
  anonKey: string;
  email: string;
  password: string;
}): Promise<TicketDiscoveryReference[]> {
  const supabase = createClient<Database>(input.url, input.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const authResult = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (authResult.error) throw authResult.error;

  try {
    const [festivals, candidates, tickets] = await Promise.all([
      supabase.from("festivals")
        .select("id, name, normalized_name, search_aliases, start_date, end_date, source_url"),
      supabase.from("festival_candidates")
        .select("id, title, festival_name, start_date, end_date, source_url"),
      supabase.from("festival_ticket_rounds").select("id, festival_id, ticket_url"),
    ]);
    if (festivals.error) throw festivals.error;
    if (candidates.error) throw candidates.error;
    if (tickets.error) throw tickets.error;

    return [
      ...festivals.data.map((row) => ({
        kind: "festival" as const,
        id: row.id,
        title: row.name,
        source_url: row.source_url,
        start_date: row.start_date,
        end_date: row.end_date,
        normalized_name: row.normalized_name,
        search_aliases: row.search_aliases,
      })),
      ...candidates.data.map((row) => ({
        kind: "candidate" as const,
        id: row.id,
        title: row.festival_name || row.title,
        source_url: row.source_url,
        start_date: row.start_date,
        end_date: row.end_date,
      })),
      ...tickets.data.map((row) => ({
        kind: "ticket" as const,
        id: row.id,
        title: `축제 ${row.festival_id}의 기존 티켓`,
        source_url: row.ticket_url,
      })),
    ];
  } finally {
    await supabase.auth.signOut();
  }
}
