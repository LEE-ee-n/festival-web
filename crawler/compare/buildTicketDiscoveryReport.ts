import {
  classifyTicketDiscovery,
  type TicketDiscoveryReference,
} from "../../lib/festivals/ticketDiscovery.ts";
import type {
  CrawledCandidate,
  ScheduledDiscoveryItem,
  ScheduledDiscoveryReport,
  ScheduledSiteResult,
} from "../types.ts";

export function buildTicketDiscoveryReport(input: {
  generatedAt: string;
  items: CrawledCandidate[];
  sites: ScheduledSiteResult[];
  references: TicketDiscoveryReference[];
}): ScheduledDiscoveryReport {
  const byUrl = new Map<string, CrawledCandidate>();
  for (const item of input.items) if (!byUrl.has(item.source_url)) byUrl.set(item.source_url, item);

  const items: ScheduledDiscoveryItem[] = [...byUrl.values()]
    .map((item) => {
      const match = classifyTicketDiscovery(item, input.references);
      return {
        ...item,
        status: match.status,
        reason: match.reason,
        ...(match.reference ? { reference_title: match.reference.title } : {}),
      };
    })
    .sort((left, right) =>
      left.status.localeCompare(right.status, "en")
      || left.title.localeCompare(right.title, "ko"),
    );

  return {
    generated_at: input.generatedAt,
    source_type: "scheduled_ticket_discovery",
    sites: input.sites,
    items,
  };
}
