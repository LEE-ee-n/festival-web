import type { FestivalDraftJson } from "@/lib/types";
import {
  isValidArtistNormalizedName,
  normalizeArtistName,
} from "../artists/normalizeArtistName.ts";

function normalizeAliases(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((alias) => alias.trim())
      .filter(Boolean);
  }
  return [];
}

export function normalizeFestivalDraft(
  draft: FestivalDraftJson,
): FestivalDraftJson {
  return {
    ...draft,
    artists: draft.artists.map((artist) => ({
      ...artist,
      normalized_name: normalizeArtistName(artist.normalized_name),
      matched_artist_id: Number.isInteger(artist.matched_artist_id)
        ? artist.matched_artist_id
        : null,
      match_status: artist.match_status
        ?? (Number.isInteger(artist.matched_artist_id)
          ? "matched"
          : "pending"),
      aliases: normalizeAliases(artist.aliases as unknown),
    })),
    tickets: Array.isArray(draft.tickets) ? draft.tickets : [],
  };
}

export function validateFestivalDraftForApproval(
  draft: FestivalDraftJson,
) {
  const normalizedDraft = normalizeFestivalDraft(draft);
  const unresolvedArtist = normalizedDraft.artists.find(
    (artist) =>
      artist.match_status !== "new"
      && !(
        artist.match_status === "matched"
        && Number.isInteger(artist.matched_artist_id)
      ),
  );

  if (unresolvedArtist) {
    throw new Error(
      `${unresolvedArtist.display_name || unresolvedArtist.input_name || "아티스트"}의 기존 ID 연결 또는 신규 등록 여부를 확인해 주세요.`,
    );
  }

  const invalidNewArtist = normalizedDraft.artists.find(
    (artist) =>
      artist.match_status === "new"
      && !isValidArtistNormalizedName(artist.normalized_name),
  );

  if (invalidNewArtist) {
    throw new Error(
      `${invalidNewArtist.display_name || invalidNewArtist.input_name || "신규 아티스트"}의 normalized_name은 영문 소문자와 숫자로 입력해 주세요.`,
    );
  }

  const normalizedNames = normalizedDraft.artists
    .map((artist) => artist.normalized_name.trim())
    .filter(Boolean);
  const duplicateNormalizedName = normalizedNames.find(
    (name, index) => normalizedNames.indexOf(name) !== index,
  );

  if (duplicateNormalizedName) {
    throw new Error(
      `라인업에 중복된 normalized_name이 있습니다: ${duplicateNormalizedName}`,
    );
  }

  return normalizedDraft;
}

export function parseFestivalDraftJson(value: string): FestivalDraftJson {
  const parsed: unknown = JSON.parse(value);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSON 최상위 값은 객체여야 합니다.");
  }

  const draft = parsed as Partial<FestivalDraftJson>;
  const candidate = draft.candidate;
  const festival = draft.festival;

  if (
    candidate !== undefined
    && (!candidate || typeof candidate !== "object" || Array.isArray(candidate))
  ) {
    throw new Error("candidate는 객체여야 합니다.");
  }

  if (
    candidate?.score !== undefined
    && (!Number.isInteger(candidate.score)
      || candidate.score < 0
      || candidate.score > 100)
  ) {
    throw new Error("candidate.score는 0부터 100 사이 정수여야 합니다.");
  }

  if (
    candidate?.source_assets !== undefined
    && !Array.isArray(candidate.source_assets)
  ) {
    throw new Error("candidate.source_assets는 배열이어야 합니다.");
  }

  if (!festival || typeof festival !== "object") {
    throw new Error("festival 정보가 없습니다.");
  }

  if (!festival.name?.trim()) {
    throw new Error("festival.name이 필요합니다.");
  }

  if (!festival.start_date || !festival.end_date) {
    throw new Error("축제 시작일과 종료일이 필요합니다.");
  }

  if (festival.end_date < festival.start_date) {
    throw new Error("종료일은 시작일보다 빠를 수 없습니다.");
  }

  if (!Array.isArray(draft.artists)) {
    throw new Error("artists는 배열이어야 합니다.");
  }

  if (draft.tickets !== undefined && !Array.isArray(draft.tickets)) {
    throw new Error("tickets는 배열이어야 합니다.");
  }

  return normalizeFestivalDraft(draft as FestivalDraftJson);
}

export function getFestivalDraftFileName(draft: FestivalDraftJson) {
  const safeName = draft.festival.name
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 60);

  return `${safeName || "festival-draft"}.json`;
}

export function formatFestivalDraftJson(draft: FestivalDraftJson) {
  const festival = draft.festival;
  const orderedDraft: FestivalDraftJson = {
    ...(draft.candidate ? { candidate: draft.candidate } : {}),
    festival: {
      name: festival.name,
      normalized_name: festival.normalized_name,
      search_aliases: festival.search_aliases,
      start_date: festival.start_date,
      end_date: festival.end_date,
      location: festival.location,
      address: festival.address,
      region: festival.region,
      category: festival.category,
      description: festival.description,
      price_info: festival.price_info,
      program_info: festival.program_info,
      source_url: festival.source_url,
      official_url: festival.official_url,
      thumbnail_url: festival.thumbnail_url,
      price_type: festival.price_type,
      status: festival.status,
    },
    artists: draft.artists,
    tickets: draft.tickets,
  };

  return JSON.stringify(orderedDraft, null, 2);
}
