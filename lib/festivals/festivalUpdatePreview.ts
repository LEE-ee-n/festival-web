import type { FestivalDraftJson } from "../types.ts";

export type FestivalUpdateStatus = "same" | "add" | "conflict";
export type FestivalUpdateSection = "basic" | "lineup" | "ticket";

export type FestivalUpdateItem = {
  id: string;
  section: FestivalUpdateSection;
  label: string;
  status: FestivalUpdateStatus;
  current: string;
  incoming: string;
  basicField?: string;
  basicValue?: string;
  artistPayload?: FestivalDraftJson["artists"][number];
  ticketPayload?: NonNullable<FestivalDraftJson["tickets"]>[number] & {
    existing_ticket_id?: number;
  };
};

export type ExistingFestivalArtist = {
  id: number;
  artist_id: number;
  performance_date: string | null;
  performance_time: string | null;
  performance_end_time: string | null;
  stage_name: string | null;
  status: string | null;
  artist: {
    id: number;
    name: string;
    normalized_name: string;
    aliases: string[];
  };
};

export type ExistingFestivalTicket = {
  id: number;
  round_type: string | null;
  round_name: string;
  open_at: string | null;
  price_info: string | null;
  ticket_url: string | null;
  ticket_platform: string | null;
};

const BASIC_FIELDS: Array<{
  key: keyof FestivalDraftJson["festival"];
  label: string;
}> = [
  { key: "name", label: "축제명" },
  { key: "search_aliases", label: "검색 별칭" },
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
  { key: "status", label: "축제 상태" },
];

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function comparable(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
}

function sameValue(left: string, right: string) {
  return comparable(left) === comparable(right);
}

function artistKey(normalizedName: string, performanceDate?: string | null) {
  return `${normalizedName}|${performanceDate || ""}`;
}

function ticketKey(ticket: {
  round_name?: string | null;
  open_at?: string | null;
  ticket_url?: string | null;
  ticket_platform?: string | null;
}) {
  const url = text(ticket.ticket_url).replace(/\/+$/, "").toLowerCase();
  if (url) return `url:${url}`;
  return [ticket.ticket_platform, ticket.round_name, ticket.open_at]
    .map((value) => comparable(text(value)))
    .join("|");
}

function getObjectStatus(
  current: Record<string, unknown>,
  incoming: Record<string, unknown>,
  fields: string[],
) {
  let hasAddition = false;
  let hasConflict = false;

  fields.forEach((field) => {
    const currentValue = text(current[field]);
    const incomingValue = text(incoming[field]);
    if (!incomingValue || sameValue(currentValue, incomingValue)) return;
    if (!currentValue) hasAddition = true;
    else hasConflict = true;
  });

  if (hasConflict) return "conflict" as const;
  if (hasAddition) return "add" as const;
  return "same" as const;
}

export function createFestivalUpdatePreview(
  currentFestival: FestivalDraftJson["festival"],
  currentArtists: ExistingFestivalArtist[],
  currentTickets: ExistingFestivalTicket[],
  incoming: FestivalDraftJson,
) {
  const items: FestivalUpdateItem[] = [];

  BASIC_FIELDS.forEach(({ key, label }) => {
    const currentValue = text(currentFestival[key]);
    const incomingValue = text(incoming.festival[key]);
    if (!incomingValue) return;

    const status: FestivalUpdateStatus = sameValue(currentValue, incomingValue)
      ? "same"
      : currentValue
        ? "conflict"
        : "add";

    items.push({
      id: `basic:${key}`,
      section: "basic",
      label,
      status,
      current: currentValue,
      incoming: incomingValue,
      basicField: String(key),
      basicValue: incomingValue,
    });
  });

  const existingArtists = new Map(
    currentArtists.map((artist) => [
      artistKey(artist.artist.normalized_name, artist.performance_date),
      artist,
    ]),
  );

  incoming.artists
    .filter((artist) => artist.match_status !== "excluded")
    .forEach((artist, index) => {
    const key = artistKey(artist.normalized_name, artist.performance_date);
    const existing = existingArtists.get(key) ?? (
      artist.performance_date
        ? undefined
        : currentArtists.find((item) => item.artist.normalized_name === artist.normalized_name)
    );
    const label = artist.display_name || artist.input_name || artist.normalized_name;

    if (!existing) {
      items.push({
        id: `lineup:${key}:${index}`,
        section: "lineup",
        label,
        status: "add",
        current: "없음",
        incoming: [
          label,
          artist.performance_date,
          artist.performance_time && artist.performance_end_time
            ? `${artist.performance_time}~${artist.performance_end_time}`
            : artist.performance_time,
          artist.stage_name,
        ].filter(Boolean).join(" · "),
        artistPayload: artist,
      });
      return;
    }

    const currentRecord = {
      performance_date: existing.performance_date,
      performance_time: existing.performance_time,
      performance_end_time: existing.performance_end_time,
      stage_name: existing.stage_name,
      status: existing.status,
    };
    const incomingRecord = artist as unknown as Record<string, unknown>;
    const status = getObjectStatus(currentRecord, incomingRecord, [
      "performance_time",
      "performance_end_time",
      "stage_name",
      "status",
    ]);
    // normalized_name fixes the artist identity. Festival updates must not
    // mutate a matched artist's global aliases from OCR-generated JSON.
    const aliases = [...existing.artist.aliases];

    const payload: FestivalDraftJson["artists"][number] = {
      ...artist,
      input_name: artist.input_name || existing.artist.name,
      display_name: artist.display_name || existing.artist.name,
      normalized_name: existing.artist.normalized_name,
      matched_artist_id: existing.artist_id,
      match_status: "matched",
      aliases,
      performance_date: artist.performance_date || existing.performance_date || undefined,
      performance_time: artist.performance_time || existing.performance_time || undefined,
      performance_end_time:
        artist.performance_end_time || existing.performance_end_time || undefined,
      stage_name: artist.stage_name || existing.stage_name || undefined,
      status: artist.status || existing.status || "confirmed",
    };

    items.push({
      id: `lineup:${key}:${index}`,
      section: "lineup",
      label,
      status,
      current: [existing.performance_date, existing.performance_time, existing.stage_name]
        .filter(Boolean).join(" · ") || existing.artist.name,
      incoming: [artist.performance_date, artist.performance_time, artist.stage_name]
        .filter(Boolean).join(" · ") || label,
      artistPayload: payload,
    });
    });

  const existingTickets = new Map(
    currentTickets.map((ticket) => [ticketKey(ticket), ticket]),
  );

  (incoming.tickets ?? []).forEach((ticket, index) => {
    const key = ticketKey(ticket);
    const existing = existingTickets.get(key);
    const label = ticket.round_name || ticket.ticket_platform || `티켓 ${index + 1}`;

    if (!existing) {
      items.push({
        id: `ticket:${key}:${index}`,
        section: "ticket",
        label,
        status: "add",
        current: "없음",
        incoming: [
          ticket.round_name,
          ticket.open_at,
          ticket.price_info,
          ticket.ticket_platform,
          ticket.ticket_url,
        ]
          .filter(Boolean).join(" · "),
        ticketPayload: ticket,
      });
      return;
    }

    const status = getObjectStatus(
      existing as unknown as Record<string, unknown>,
      ticket as unknown as Record<string, unknown>,
      ["round_type", "round_name", "open_at", "price_info", "ticket_url", "ticket_platform"],
    );
    const payload = {
      existing_ticket_id: existing.id,
      round_type: ticket.round_type || existing.round_type || undefined,
      round_name: ticket.round_name || existing.round_name,
      open_at: ticket.open_at || existing.open_at || undefined,
      price_info: ticket.price_info || existing.price_info || undefined,
      ticket_url: ticket.ticket_url || existing.ticket_url || undefined,
      ticket_platform: ticket.ticket_platform || existing.ticket_platform || undefined,
    };

    items.push({
      id: `ticket:${key}:${index}`,
      section: "ticket",
      label,
      status,
      current: [existing.round_name, existing.open_at, existing.price_info]
        .filter(Boolean).join(" · "),
      incoming: [ticket.round_name, ticket.open_at, ticket.price_info]
        .filter(Boolean).join(" · "),
      ticketPayload: payload,
    });
  });

  return items;
}
