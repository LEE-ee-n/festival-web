import type { FestivalArtist } from "@/lib/types";

export type LineupWorkType = "announcement" | "correction";
export type LineupRound = "unspecified" | "first" | "second" | "third" | "final";

export type LineupWorkInput = {
  workType: LineupWorkType;
  lineupRound: LineupRound;
  announcementDate: string;
  sourceUrl: string;
  reason: string;
};

export type LineupOperation = Record<string, unknown> & {
  operation: "insert" | "update" | "delete";
};

const lineupFields = [
  "performance_date",
  "performance_time",
  "performance_end_time",
  "stage_name",
  "status",
] as const;

function artistOf(row: FestivalArtist) {
  return Array.isArray(row.artists) ? row.artists[0] : row.artists;
}

function lineupValues(row: FestivalArtist) {
  return {
    performance_date: row.performance_date || null,
    performance_time: row.performance_time || null,
    performance_end_time: row.performance_end_time || null,
    stage_name: row.stage_name?.trim() || null,
    status: row.status || "confirmed",
  };
}

export function validateLineupWork(input: LineupWorkInput): string | null {
  if (input.workType === "announcement" && !input.announcementDate) {
    return "라인업 발표일을 입력해 주세요.";
  }
  if (input.workType === "announcement" && !input.sourceUrl.trim()) {
    return "라인업 발표 출처를 입력해 주세요.";
  }
  if (input.workType === "correction" && !input.sourceUrl.trim() && !input.reason.trim()) {
    return "정정은 출처 또는 정정 사유가 필요합니다.";
  }
  return null;
}

export function buildLineupOperations(
  originalRows: FestivalArtist[],
  currentRows: FestivalArtist[],
): LineupOperation[] {
  const currentById = new Map(currentRows.filter((row) => row.id > 0).map((row) => [row.id, row]));
  const originalById = new Map(originalRows.map((row) => [row.id, row]));
  const operations: LineupOperation[] = [];

  for (const original of originalRows) {
    const current = currentById.get(original.id);
    if (!current) {
      operations.push({ operation: "delete", lineup_id: original.id });
      continue;
    }

    if (lineupFields.some((field) => (original[field] || null) !== (current[field] || null))) {
      operations.push({ operation: "update", lineup_id: current.id, ...lineupValues(current) });
    }
  }

  for (const row of currentRows) {
    if (row.id > 0 || originalById.has(row.id)) continue;
    const artist = artistOf(row);
    const operation: LineupOperation = { operation: "insert", ...lineupValues(row) };

    if (row.artist_id > 0) {
      operation.artist_id = row.artist_id;
    } else {
      operation.new_artist = {
        name: artist?.name.trim(),
        normalized_name: artist?.normalized_name.trim(),
        aliases: (row.alias_text ?? "").split(",").map((value) => value.trim()).filter(Boolean),
      };
    }
    operations.push(operation);
  }

  return operations;
}
