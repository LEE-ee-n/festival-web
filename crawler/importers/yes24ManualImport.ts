import { deduplicateCandidates } from "../core/candidateFilter.ts";
import type { CrawledCandidate } from "../types.ts";

interface ManualLink {
  title?: unknown;
  source_url?: unknown;
  raw_title?: unknown;
  start_date?: unknown;
  end_date?: unknown;
}

const YES24_PRODUCT_PATH = /^\/Perf\/(\d+)\/?$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const FESTIVAL_TITLE = /(페스티벌|포레스티벌|페스타|festival|\bfes(?:t(?:a)?)?\b)/i;
const PERFORMANCE_DATE = /\s(?:19|20)\d{2}[.\-/]\s*\d{1,2}[.\-/]\s*\d{1,2}/;

function isFestivalTitle(value: string) {
  return FESTIVAL_TITLE.test(value.normalize("NFKC"));
}

function koreaDateFromIso(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time)
    ? new Date(time + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : null;
}

export function importYes24ManualCandidates(input: unknown, discoveredAt: string): CrawledCandidate[] {
  if (!Array.isArray(input)) throw new Error("YES24 입력 JSON은 배열이어야 합니다.");
  const candidates: CrawledCandidate[] = [];
  const collectedDate = koreaDateFromIso(discoveredAt);

  for (const raw of input as ManualLink[]) {
    if (typeof raw?.title !== "string" || typeof raw?.source_url !== "string") continue;
    let url: URL;
    try { url = new URL(raw.source_url); } catch { continue; }
    const pathMatch = url.pathname.match(YES24_PRODUCT_PATH);
    if (url.protocol !== "https:" || url.hostname !== "ticket.yes24.com" || !pathMatch) continue;

    const title = raw.title.replace(/\s+/g, " ").trim();
    const rawTitle = typeof raw.raw_title === "string" ? raw.raw_title.replace(/\s+/g, " ").trim() : "";
    const rawDateIndex = rawTitle.search(PERFORMANCE_DATE);
    const titleFromRaw = (rawDateIndex >= 0 ? rawTitle.slice(0, rawDateIndex) : rawTitle).trim();
    const festivalTitle = isFestivalTitle(title) ? title : isFestivalTitle(titleFromRaw) ? titleFromRaw : "";
    if (!festivalTitle) continue;

    const startDate = typeof raw.start_date === "string" && ISO_DATE.test(raw.start_date) ? raw.start_date : undefined;
    const endDate = typeof raw.end_date === "string" && ISO_DATE.test(raw.end_date) ? raw.end_date : startDate;
    if (collectedDate && endDate && endDate < collectedDate) continue;

    candidates.push({
      title: festivalTitle,
      source_url: `https://ticket.yes24.com/Perf/${pathMatch[1]}`,
      source_type: "yes24_manual",
      discovered_at: discoveredAt,
      raw_title: rawTitle || festivalTitle,
      start_date: startDate,
      end_date: endDate,
    });
  }
  return deduplicateCandidates(candidates);
}
