export interface RawCrawlerCandidate {
  title: string;
  source_url: string;
}

export interface CrawledCandidate extends RawCrawlerCandidate {
  source_type: string;
  discovered_at: string;
  raw_title?: string;
  start_date?: string;
  end_date?: string;
}

export interface CrawlerSourceError {
  source_type: string;
  message: string;
}

export interface CrawlerReport {
  generated_at: string;
  source_type: "crawler_discovery";
  items: CrawledCandidate[];
  errors: CrawlerSourceError[];
}

export interface CrawlerOptions {
  requestIntervalMs?: number;
  maxItemsPerSource?: number;
  timeoutMs?: number;
  now?: () => Date;
}

export type TicketDiscoveryStatus = "duplicate" | "possible" | "new";

export interface ScheduledDiscoveryItem extends CrawledCandidate {
  candidate_id?: string;
  status: TicketDiscoveryStatus;
  reason: string;
  reference_title?: string;
}

export interface ScheduledSiteResult {
  site: string;
  listing_url: string;
  collected: number;
  accepted: number;
  error?: string;
}

export interface ScheduledDiscoveryReport {
  generated_at: string;
  source_type: "scheduled_ticket_discovery";
  sites: ScheduledSiteResult[];
  items: ScheduledDiscoveryItem[];
}
