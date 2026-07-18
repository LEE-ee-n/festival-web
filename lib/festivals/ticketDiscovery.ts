import type { FestivalDraftJson } from "@/lib/types";

export type TicketDiscoveryItem = {
  title: string;
  source_url: string;
  source_type: string;
  discovered_at?: string;
  raw_title?: string;
  start_date?: string;
  end_date?: string;
};

export type TicketDiscoveryReference = {
  kind: "festival" | "candidate" | "ticket";
  id: number;
  title: string;
  source_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  normalized_name?: string | null;
  search_aliases?: string | null;
};

export type TicketDiscoveryMatch = {
  status: "duplicate" | "possible" | "new";
  reason: string;
  reference?: TicketDiscoveryReference;
};

const COMMON_TICKET_WORDS = /(블라인드|얼리버드|정식\s*티켓|일반\s*티켓|티켓|단독\s*판매|예매)/g;

export function normalizeDiscoveryTitle(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(COMMON_TICKET_WORDS, "")
    .replace(/(?:19|20)\d{2}/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function referenceNames(reference: TicketDiscoveryReference) {
  return [
    reference.title,
    reference.normalized_name ?? "",
    ...(reference.search_aliases ?? "")
      .split(/[,\n]/)
      .map((alias) => alias.trim())
      .filter(Boolean),
  ].filter(Boolean);
}

function hasSameDates(
  item: TicketDiscoveryItem,
  reference: TicketDiscoveryReference,
) {
  return Boolean(
    item.start_date
      && item.end_date
      && reference.start_date === item.start_date
      && reference.end_date === item.end_date,
  );
}

export function classifyTicketDiscovery(
  item: TicketDiscoveryItem,
  references: TicketDiscoveryReference[],
): TicketDiscoveryMatch {
  const sameUrl = references.find(
    (reference) => reference.source_url === item.source_url,
  );
  if (sameUrl) {
    return { status: "duplicate", reason: "같은 출처 URL이 이미 있습니다.", reference: sameUrl };
  }

  const itemTitle = normalizeDiscoveryTitle(item.title);
  const possible = references.find((reference) => {
    if (!hasSameDates(item, reference)) return false;
    return referenceNames(reference).some((name) => {
      const referenceTitle = normalizeDiscoveryTitle(name);
      return Boolean(
        itemTitle
          && referenceTitle
          && (itemTitle === referenceTitle
            || itemTitle.includes(referenceTitle)
            || referenceTitle.includes(itemTitle)),
      );
    });
  });

  if (possible) {
    return {
      status: "possible",
      reason: "정리한 제목과 행사 날짜가 비슷합니다. 직접 확인해 주세요.",
      reference: possible,
    };
  }

  return { status: "new", reason: "같은 URL이나 제목·날짜 조합을 찾지 못했습니다." };
}

export function parseTicketDiscoveryReport(value: string): TicketDiscoveryItem[] {
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("크롤링 JSON 최상위 값은 객체여야 합니다.");
  }
  const items = (parsed as { items?: unknown }).items;
  if (!Array.isArray(items)) throw new Error("크롤링 JSON의 items 배열이 없습니다.");

  return items.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`${index + 1}번째 항목 형식이 올바르지 않습니다.`);
    }
    const source = item as Record<string, unknown>;
    if (typeof source.title !== "string" || !source.title.trim()) {
      throw new Error(`${index + 1}번째 항목의 title이 없습니다.`);
    }
    if (typeof source.source_url !== "string" || !source.source_url.startsWith("https://")) {
      throw new Error(`${index + 1}번째 항목의 source_url이 올바르지 않습니다.`);
    }
    return {
      title: source.title.trim(),
      source_url: source.source_url,
      source_type: typeof source.source_type === "string" ? source.source_type : "ticket_discovery",
      discovered_at: typeof source.discovered_at === "string" ? source.discovered_at : undefined,
      raw_title: typeof source.raw_title === "string" ? source.raw_title : undefined,
      start_date: typeof source.start_date === "string" ? source.start_date : undefined,
      end_date: typeof source.end_date === "string" ? source.end_date : undefined,
    };
  });
}

export function createTicketDiscoveryDraft(item: TicketDiscoveryItem): FestivalDraftJson {
  return {
    candidate: {
      title: item.title,
      source_type: item.source_type,
      source_url: item.source_url,
      raw_text: item.raw_title,
      score: 0,
    },
    festival: {
      name: item.title,
      normalized_name: "",
      start_date: item.start_date ?? "",
      end_date: item.end_date ?? item.start_date ?? "",
      source_url: item.source_url,
    },
    artists: [],
    tickets: [],
  };
}
