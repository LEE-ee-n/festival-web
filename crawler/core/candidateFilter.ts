import type { CrawledCandidate, RawCrawlerCandidate } from "../types.ts";
import { normalizeCandidateTitle } from "./normalizeCandidateTitle.ts";

function resolveAllowedUrl(
  value: string,
  baseUrl: string,
  allowedOrigins: ReadonlySet<string>,
): string | null {
  try {
    const url = new URL(value, baseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (!allowedOrigins.has(url.origin)) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function prepareCandidates(input: {
  items: RawCrawlerCandidate[];
  sourceType: string;
  baseUrl: string;
  allowedOrigins: readonly string[];
  discoveredAt: string;
  maxItems: number;
}): CrawledCandidate[] {
  const allowedOrigins = new Set(input.allowedOrigins.map((value) => new URL(value).origin));
  const prepared: CrawledCandidate[] = [];

  for (const item of input.items) {
    if (prepared.length >= input.maxItems) break;
    const title = item.title?.trim();
    if (!title) continue;
    const sourceUrl = resolveAllowedUrl(item.source_url, input.baseUrl, allowedOrigins);
    if (!sourceUrl) continue;
    prepared.push({
      title,
      source_url: sourceUrl,
      source_type: input.sourceType,
      discovered_at: input.discoveredAt,
    });
  }

  return prepared;
}

export function deduplicateCandidates(items: CrawledCandidate[]): CrawledCandidate[] {
  const sorted = [...items].sort((a, b) => {
    const titleOrder = normalizeCandidateTitle(a.title).localeCompare(
      normalizeCandidateTitle(b.title),
      "en",
    );
    if (titleOrder !== 0) return titleOrder;
    return a.source_url.localeCompare(b.source_url, "en");
  });
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  return sorted.filter((item) => {
    const normalizedTitle = normalizeCandidateTitle(item.title);
    if (!normalizedTitle || seenUrls.has(item.source_url) || seenTitles.has(normalizedTitle)) {
      return false;
    }
    seenUrls.add(item.source_url);
    seenTitles.add(normalizedTitle);
    return true;
  });
}
