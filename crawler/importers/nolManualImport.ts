import { deduplicateCandidates } from "../core/candidateFilter.ts";
import type { CrawledCandidate } from "../types.ts";

interface ManualLink {
  title?: unknown;
  source_url?: unknown;
}

const NOL_PRODUCT_PATH = /^\/ticket\/(?:places\/[^/]+\/)?products\/[^/]+$/;
const LEADING_CATEGORY = /^(콘서트|클래식\/오페라|무용\/전통예술|연극)\s+/;
const PERFORMANCE_DATE = /\s(?:19|20)\d{2}\.\d{2}\.\d{2}/;
const PERFORMANCE_DATE_RANGE = /((?:19|20)\d{2})\.(\d{2})\.(\d{2})(?:\s*~\s*((?:19|20)\d{2})\.(\d{2})\.(\d{2}))?/;

function toIsoDate(year?: string, month?: string, day?: string) {
  return year && month && day ? `${year}-${month}-${day}` : undefined;
}

export function extractNolProductTitle(value: string): {
  category: string | null;
  title: string;
  start_date?: string;
  end_date?: string;
} {
  const compact = value.replace(/\s+/g, " ").trim();
  const category = compact.match(LEADING_CATEGORY)?.[1] ?? null;
  const withoutCategory = compact.replace(LEADING_CATEGORY, "");
  const dateIndex = withoutCategory.search(PERFORMANCE_DATE);
  const title = (dateIndex >= 0 ? withoutCategory.slice(0, dateIndex) : withoutCategory).trim();
  const dateMatch = withoutCategory.match(PERFORMANCE_DATE_RANGE);
  const startDate = toIsoDate(dateMatch?.[1], dateMatch?.[2], dateMatch?.[3]);
  const endDate = toIsoDate(dateMatch?.[4], dateMatch?.[5], dateMatch?.[6]) ?? startDate;
  return { category, title, start_date: startDate, end_date: endDate };
}

export function importNolManualCandidates(
  input: unknown,
  discoveredAt: string,
  options?: { allowMissingConcertCategory?: boolean },
): CrawledCandidate[] {
  if (!Array.isArray(input)) throw new Error("놀티켓 입력 JSON은 배열이어야 합니다.");
  const candidates: CrawledCandidate[] = [];

  for (const raw of input as ManualLink[]) {
    if (typeof raw?.title !== "string" || typeof raw?.source_url !== "string") continue;
    let url: URL;
    try {
      url = new URL(raw.source_url);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" || url.hostname !== "nol.yanolja.com") continue;
    if (!NOL_PRODUCT_PATH.test(url.pathname)) continue;

    const parsed = extractNolProductTitle(raw.title);
    if (
      (!options?.allowMissingConcertCategory && parsed.category !== "콘서트")
      || (parsed.category && parsed.category !== "콘서트")
      || !parsed.title
    ) continue;
    candidates.push({
      title: parsed.title,
      source_url: url.toString(),
      source_type: "nol_ticket_manual",
      discovered_at: discoveredAt,
      raw_title: raw.title,
      start_date: parsed.start_date,
      end_date: parsed.end_date,
    });
  }

  return deduplicateCandidates(candidates);
}
