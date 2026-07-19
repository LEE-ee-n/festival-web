import type { FestivalDraftJson } from "../types.ts";

export type DraftMergeStatus = "same" | "expression" | "add" | "change";
export type DraftMergeSection = "basic" | "lineup" | "ticket";

export type DraftMergeDiff = {
  section: DraftMergeSection;
  key: string;
  label: string;
  status: DraftMergeStatus;
  current: string;
  incoming: string;
};

export type FestivalDraftMergeResult = {
  mergedDraft: FestivalDraftJson;
  diffs: DraftMergeDiff[];
};

const BASIC_FIELDS: Array<{
  key: keyof FestivalDraftJson["festival"];
  label: string;
}> = [
  { key: "name", label: "축제명" },
  { key: "normalized_name", label: "normalized_name" },
  { key: "search_aliases", label: "검색 별칭" },
  { key: "start_date", label: "시작일" },
  { key: "end_date", label: "종료일" },
  { key: "location", label: "행사장명" },
  { key: "address", label: "상세 주소" },
  { key: "region", label: "지역" },
  { key: "category", label: "축제 분류" },
  { key: "description", label: "설명" },
  { key: "price_info", label: "가격 정보" },
  { key: "program_info", label: "프로그램 정보" },
  { key: "source_url", label: "출처 URL" },
  { key: "official_url", label: "공식 URL" },
  { key: "thumbnail_url", label: "썸네일 URL" },
  { key: "price_type", label: "가격 유형" },
  { key: "status", label: "상태" },
];

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function compact(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "");
}

function canonicalUrl(value: string) {
  if (!value) return "";

  try {
    const url = new URL(value);
    [...url.searchParams.keys()].forEach((key) => {
      if (key.toLowerCase().startsWith("utm_") || key === "fbclid") {
        url.searchParams.delete(key);
      }
    });
    url.hash = "";
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.replace(/\/+$/, "");
  }
}

function bigrams(value: string) {
  if (value.length < 2) return [value];
  return Array.from({ length: value.length - 1 }, (_, index) =>
    value.slice(index, index + 2),
  );
}

export function calculateTextSimilarity(left: string, right: string) {
  const leftText = compact(left);
  const rightText = compact(right);

  if (leftText === rightText) return 1;
  if (!leftText || !rightText) return 0;

  const leftBigrams = bigrams(leftText);
  const rightCounts = new Map<string, number>();
  bigrams(rightText).forEach((part) => {
    rightCounts.set(part, (rightCounts.get(part) ?? 0) + 1);
  });

  let overlap = 0;
  leftBigrams.forEach((part) => {
    const count = rightCounts.get(part) ?? 0;
    if (count > 0) {
      overlap += 1;
      rightCounts.set(part, count - 1);
    }
  });

  return (2 * overlap) / (leftBigrams.length + bigrams(rightText).length);
}

function compareValues(
  key: string,
  currentValue: string,
  incomingValue: string,
): DraftMergeStatus {
  if (!incomingValue) return "same";
  if (!currentValue) return "add";

  if (key.endsWith("_url")) {
    return canonicalUrl(currentValue) === canonicalUrl(incomingValue)
      ? "same"
      : "change";
  }

  const currentCompact = compact(currentValue);
  const incomingCompact = compact(incomingValue);

  if (currentCompact === incomingCompact) return "same";

  if (key === "description" || key === "program_info") {
    const shorterLength = Math.min(currentCompact.length, incomingCompact.length);
    const longerLength = Math.max(currentCompact.length, incomingCompact.length);
    const containment = currentCompact.includes(incomingCompact)
      || incomingCompact.includes(currentCompact);

    if (
      (containment && shorterLength / longerLength >= 0.7)
      || calculateTextSimilarity(currentValue, incomingValue) >= 0.9
    ) {
      return "expression";
    }
  }

  return "change";
}

function mergeAliases(current: string[], incoming: string[]) {
  return [...new Set([...current, ...incoming].map((alias) => alias.trim()))]
    .filter(Boolean);
}

export function getFestivalDraftTicketKey(
  ticket: NonNullable<FestivalDraftJson["tickets"]>[number],
) {
  return canonicalUrl(text(ticket.ticket_url))
    || [ticket.ticket_platform, ticket.round_name, ticket.open_at]
      .map((value) => compact(text(value)))
      .join("|");
}

export function mergeFestivalDrafts(
  currentDraft: FestivalDraftJson,
  incomingDraft: FestivalDraftJson,
): FestivalDraftMergeResult {
  const mergedDraft = structuredClone(currentDraft);
  const diffs: DraftMergeDiff[] = [];

  BASIC_FIELDS.forEach(({ key, label }) => {
    const currentValue = text(currentDraft.festival[key]);
    const incomingValue = text(incomingDraft.festival[key]);
    const status = compareValues(key, currentValue, incomingValue);

    if (status === "add") {
      (mergedDraft.festival as Record<string, unknown>)[key] = incomingValue;
    }

    diffs.push({
      section: "basic",
      key,
      label,
      status,
      current: currentValue,
      incoming: incomingValue,
    });
  });

  const currentArtists = new Map(
    mergedDraft.artists.map((artist) => [artist.normalized_name, artist]),
  );

  incomingDraft.artists.forEach((incomingArtist) => {
    const artistKey = incomingArtist.normalized_name;
    const currentArtist = currentArtists.get(artistKey);
    const label = incomingArtist.display_name || incomingArtist.input_name;

    if (!currentArtist) {
      mergedDraft.artists.push(structuredClone(incomingArtist));
      currentArtists.set(artistKey, incomingArtist);
      diffs.push({
        section: "lineup",
        key: artistKey,
        label,
        status: "add",
        current: "",
        incoming: label,
      });
      return;
    }

    let status: DraftMergeStatus = "same";
    const scalarKeys = [
      "performance_date",
      "performance_time",
      "performance_end_time",
      "stage_name",
      "status",
    ] as const;

    scalarKeys.forEach((key) => {
      const currentValue = text(currentArtist[key]);
      const incomingValue = text(incomingArtist[key]);
      const fieldStatus = compareValues(key, currentValue, incomingValue);

      if (fieldStatus === "add") {
        currentArtist[key] = incomingValue;
        if (status === "same") status = "add";
      } else if (fieldStatus === "change") {
        status = "change";
      }
    });

    const mergedAliases = mergeAliases(
      currentArtist.aliases,
      incomingArtist.aliases,
    );
    if (mergedAliases.length > currentArtist.aliases.length) {
      currentArtist.aliases = mergedAliases;
      if (status === "same") status = "add";
    }

    diffs.push({
      section: "lineup",
      key: artistKey,
      label,
      status,
      current: currentArtist.display_name || currentArtist.input_name,
      incoming: label,
    });
  });

  const tickets = mergedDraft.tickets ?? [];
  mergedDraft.tickets = tickets;
  const currentTickets = new Map(
    tickets.map((ticket) => [getFestivalDraftTicketKey(ticket), ticket]),
  );

  (incomingDraft.tickets ?? []).forEach((incomingTicket, index) => {
    const key = getFestivalDraftTicketKey(incomingTicket) || `incoming-${index}`;
    const currentTicket = currentTickets.get(key);
    const label = incomingTicket.round_name || incomingTicket.ticket_platform || `티켓 ${index + 1}`;

    if (!currentTicket) {
      tickets.push(structuredClone(incomingTicket));
      currentTickets.set(key, incomingTicket);
      diffs.push({
        section: "ticket",
        key,
        label,
        status: "add",
        current: "",
        incoming: label,
      });
      return;
    }

    let status: DraftMergeStatus = "same";
    const keys = [
      "round_type",
      "round_name",
      "open_at",
      "close_at",
      "price_info",
      "ticket_url",
      "ticket_platform",
      "status",
    ] as const;

    keys.forEach((field) => {
      const currentValue = text(currentTicket[field]);
      const incomingValue = text(incomingTicket[field]);
      const fieldStatus = compareValues(field, currentValue, incomingValue);
      if (fieldStatus === "add") {
        currentTicket[field] = incomingValue;
        if (status === "same") status = "add";
      } else if (fieldStatus === "change") {
        status = "change";
      }
    });

    diffs.push({
      section: "ticket",
      key,
      label,
      status,
      current: text(currentTicket.round_name),
      incoming: text(incomingTicket.round_name),
    });
  });

  return { mergedDraft, diffs };
}
