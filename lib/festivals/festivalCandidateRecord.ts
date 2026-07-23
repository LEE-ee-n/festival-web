import { parseFestivalDraftJson } from "./festivalDraft.ts";
import type { Json, Tables } from "../supabase/database.ts";
import type {
  CandidateSourceAsset,
  FestivalCandidate,
  FestivalCandidateComparison,
  FestivalCandidateStatus,
  FestivalCandidateWorkType,
  FestivalDraftJson,
} from "../types.ts";

type JsonObject = { [key: string]: Json | undefined };

function isJsonObject(value: Json): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(record: JsonObject, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function parseCandidateStatus(value: string): FestivalCandidateStatus {
  if (value === "pending" || value === "approved" || value === "rejected") {
    return value;
  }
  throw new Error(`알 수 없는 축제 후보 상태입니다: ${value}`);
}

function parseCandidateWorkType(value: string): FestivalCandidateWorkType {
  if (value === "new" || value === "update" || value === "needs_review") {
    return value;
  }
  throw new Error(`알 수 없는 축제 후보 작업 유형입니다: ${value}`);
}

export function parseFestivalDraftValue(
  value: Json | null,
): FestivalDraftJson | null {
  return value === null ? null : parseFestivalDraftJson(JSON.stringify(value));
}

export function parseCandidateSourceAssets(
  value: Json,
): CandidateSourceAsset[] {
  if (!Array.isArray(value)) {
    throw new Error("축제 후보의 첨부 자료 형식이 올바르지 않습니다.");
  }

  return value.map((asset) => {
    if (!isJsonObject(asset)) {
      throw new Error("축제 후보의 첨부 자료 항목 형식이 올바르지 않습니다.");
    }
    return {
      type: optionalString(asset, "type"),
      name: optionalString(asset, "name"),
      url: optionalString(asset, "url"),
      storage_path: optionalString(asset, "storage_path"),
    };
  });
}

function parseCandidateComparison(value: Json): FestivalCandidateComparison {
  if (!isJsonObject(value)) return {};

  const possibleIds = value.possible_festival_ids;
  const counts = value.counts;
  const workType = optionalString(value, "work_type");
  const existingFestivalId = value.existing_festival_id;

  let parsedCounts: FestivalCandidateComparison["counts"];
  if (
    counts !== undefined
    && isJsonObject(counts)
    && typeof counts.existing === "number"
    && typeof counts.add === "number"
    && typeof counts.remove_candidate === "number"
  ) {
    parsedCounts = {
      existing: counts.existing,
      add: counts.add,
      remove_candidate: counts.remove_candidate,
    };
  }

  return {
    work_type: workType ? parseCandidateWorkType(workType) : undefined,
    existing_festival_id:
      typeof existingFestivalId === "number" || existingFestivalId === null
        ? existingFestivalId
        : undefined,
    possible_festival_ids:
      Array.isArray(possibleIds)
        && possibleIds.every((item) => typeof item === "number")
        ? possibleIds
        : undefined,
    counts: parsedCounts,
  };
}

export function parseFestivalCandidateRecord(
  row: Tables<"festival_candidates">,
): FestivalCandidate {
  return {
    ...row,
    status: parseCandidateStatus(row.status),
    work_type: parseCandidateWorkType(row.work_type),
    draft_json: parseFestivalDraftValue(row.draft_json),
    source_assets: parseCandidateSourceAssets(row.source_assets),
    comparison_json: parseCandidateComparison(row.comparison_json),
  };
}
