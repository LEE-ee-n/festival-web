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
