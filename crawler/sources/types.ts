import type { RawCrawlerCandidate } from "../types.ts";

export interface FetchResponseLike {
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

export type FetchLike = (
  input: string,
  init?: { signal?: AbortSignal },
) => Promise<FetchResponseLike>;

export interface CrawlerSourceContext {
  fetchText(url: string): Promise<string>;
  maxItems: number;
}

export interface CrawlerSourceAdapter {
  readonly sourceType: string;
  readonly listingUrl: string;
  readonly allowedOrigins: readonly string[];
  discover(context: CrawlerSourceContext): Promise<RawCrawlerCandidate[]>;
}
