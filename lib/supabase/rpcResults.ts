import type { FestivalTicketRound } from "@/lib/types";
import type { Json } from "@/lib/supabase/database";

type JsonObject = { [key: string]: Json | undefined };

export type ApproveFestivalCandidateResult = {
  festival_id: number;
  audit_event_id: number;
  import_result: Json;
};

export type ArtistUpdateResult = {
  updated_count: number;
  alias_count: number;
};

export type ArtistMutationResult = {
  id: number;
  name: string;
  normalized_name: string;
  aliases: string[];
};

export type FestivalLineupImportResult = {
  festival_id: number;
  new_artist_count: number;
  existing_artist_count: number;
  linked_count: number;
  already_linked_count: number;
  alias_count: number;
};

export type FestivalXlsxImportResult = {
  festival_id: number;
  created_festival: boolean;
  created_artists: number;
  added_aliases: number;
  added_lineup: number;
  updated_lineup: number;
  unchanged_lineup: number;
};

export type FestivalJsonUpdateResult = {
  festival_id: number;
  audit_event_id: number;
  change_count: number;
  ticket_count: number;
};

function isJsonObject(value: Json): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNumber(record: JsonObject, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`RPC 응답의 ${key} 값이 올바르지 않습니다.`);
  }
  return value;
}

function readString(record: JsonObject, key: string): string {
  const value = record[key];
  if (typeof value !== "string") {
    throw new Error(`RPC 응답의 ${key} 값이 올바르지 않습니다.`);
  }
  return value;
}

function readNullableString(record: JsonObject, key: string): string | null {
  const value = record[key];
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new Error(`RPC 응답의 ${key} 값이 올바르지 않습니다.`);
  }
  return value;
}

function readBoolean(record: JsonObject, key: string): boolean {
  const value = record[key];
  if (typeof value !== "boolean") {
    throw new Error(`RPC 응답의 ${key} 값이 올바르지 않습니다.`);
  }
  return value;
}

function readStringArray(record: JsonObject, key: string): string[] {
  const value = record[key];
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`RPC 응답의 ${key} 값이 올바르지 않습니다.`);
  }
  return value;
}

function requireJsonObject(value: Json, label: string): JsonObject {
  if (!isJsonObject(value)) {
    throw new Error(`${label} RPC 응답 형식이 올바르지 않습니다.`);
  }
  return value;
}

export function parseApproveFestivalCandidateResult(
  value: Json,
): ApproveFestivalCandidateResult {
  if (!isJsonObject(value)) {
    throw new Error("축제 승인 RPC 응답 형식이 올바르지 않습니다.");
  }

  const importResult = value.import_result;
  if (importResult === undefined) {
    throw new Error("축제 승인 RPC 응답에 import_result가 없습니다.");
  }

  return {
    festival_id: readNumber(value, "festival_id"),
    audit_event_id: readNumber(value, "audit_event_id"),
    import_result: importResult,
  };
}

export function parseFestivalTicketResult(value: Json): FestivalTicketRound {
  if (!isJsonObject(value)) {
    throw new Error("티켓 변경 RPC 응답 형식이 올바르지 않습니다.");
  }

  const ticket = value.ticket;
  if (ticket === undefined || !isJsonObject(ticket)) {
    throw new Error("티켓 변경 RPC 응답 형식이 올바르지 않습니다.");
  }

  return {
    id: readNumber(ticket, "id"),
    round_type: readNullableString(ticket, "round_type"),
    round_name: readString(ticket, "round_name"),
    open_at: readNullableString(ticket, "open_at"),
    price_info: readNullableString(ticket, "price_info"),
    ticket_url: readNullableString(ticket, "ticket_url"),
    ticket_platform: readNullableString(ticket, "ticket_platform"),
  };
}

export function parseArtistUpdateResult(value: Json): ArtistUpdateResult {
  const result = requireJsonObject(value, "아티스트 수정");
  return {
    updated_count: readNumber(result, "updated_count"),
    alias_count: readNumber(result, "alias_count"),
  };
}

export function parseArtistMutationResult(value: Json): ArtistMutationResult {
  const result = requireJsonObject(value, "아티스트 저장");
  return {
    id: readNumber(result, "id"),
    name: readString(result, "name"),
    normalized_name: readString(result, "normalized_name"),
    aliases: readStringArray(result, "aliases"),
  };
}

export function parseFestivalLineupImportResult(
  value: Json,
): FestivalLineupImportResult {
  const result = requireJsonObject(value, "라인업 등록");
  return {
    festival_id: readNumber(result, "festival_id"),
    new_artist_count: readNumber(result, "new_artist_count"),
    existing_artist_count: readNumber(result, "existing_artist_count"),
    linked_count: readNumber(result, "linked_count"),
    already_linked_count: readNumber(result, "already_linked_count"),
    alias_count: readNumber(result, "alias_count"),
  };
}

export function parseFestivalXlsxImportResult(
  value: Json,
): FestivalXlsxImportResult {
  const result = requireJsonObject(value, "축제 엑셀 등록");
  return {
    festival_id: readNumber(result, "festival_id"),
    created_festival: readBoolean(result, "created_festival"),
    created_artists: readNumber(result, "created_artists"),
    added_aliases: readNumber(result, "added_aliases"),
    added_lineup: readNumber(result, "added_lineup"),
    updated_lineup: readNumber(result, "updated_lineup"),
    unchanged_lineup: readNumber(result, "unchanged_lineup"),
  };
}

export function parseFestivalJsonUpdateResult(
  value: Json,
): FestivalJsonUpdateResult {
  const result = requireJsonObject(value, "축제 JSON 수정");
  return {
    festival_id: readNumber(result, "festival_id"),
    audit_event_id: readNumber(result, "audit_event_id"),
    change_count: readNumber(result, "change_count"),
    ticket_count: readNumber(result, "ticket_count"),
  };
}
