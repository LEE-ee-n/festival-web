import assert from "node:assert/strict";
import test from "node:test";

import { buildLineupOperations, validateLineupWork } from "../lib/audit/lineupWork.ts";
import type { FestivalArtist } from "../lib/types.ts";

function row(id: number, artistId: number, stage: string): FestivalArtist {
  return {
    id, artist_id: artistId, performance_date: "2026-09-01",
    performance_time: null, performance_end_time: null, stage_name: stage,
    status: "confirmed", artists: { id: artistId, name: `artist-${artistId}`,
      normalized_name: `artist${artistId}`, artist_aliases: [] },
  };
}

test("발표는 발표일과 출처가 모두 필요하다", () => {
  assert.ok(validateLineupWork({ workType: "announcement", lineupRound: "first", announcementDate: "", sourceUrl: "", reason: "" }));
  assert.equal(validateLineupWork({ workType: "announcement", lineupRound: "first", announcementDate: "2026-08-01", sourceUrl: "https://example.com", reason: "" }), null);
});

test("정정은 출처 또는 사유 중 하나가 필요하다", () => {
  assert.ok(validateLineupWork({ workType: "correction", lineupRound: "unspecified", announcementDate: "", sourceUrl: "", reason: "" }));
  assert.equal(validateLineupWork({ workType: "correction", lineupRound: "unspecified", announcementDate: "", sourceUrl: "", reason: "오타 정정" }), null);
});

test("여러 추가·수정·삭제를 하나의 작업 배열로 만든다", () => {
  const original = [row(1, 1, "A"), row(2, 2, "B")];
  const updated = { ...row(1, 1, "변경"), stage_name: "변경" };
  const inserted = row(-1, 3, "C");
  const operations = buildLineupOperations(original, [updated, inserted]);
  assert.deepEqual(operations.map((item) => item.operation).sort(), ["delete", "insert", "update"]);
});
