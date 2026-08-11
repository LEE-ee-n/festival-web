import assert from "node:assert/strict";
import test from "node:test";

import {
  festivalDraftDiffChoiceKey,
  hasExactFestivalIdentity,
  hasSameFestivalDates,
  unresolvedFestivalDraftReviewNotes,
} from "../lib/festivals/festivalCandidateImport.ts";
import type { DraftMergeDiff } from "../lib/festivals/festivalDraftMerge.ts";
import type { FestivalDraftJson } from "../lib/types.ts";

function draft(normalizedName: string, startDate: string, endDate: string): FestivalDraftJson {
  return {
    festival: {
      name: "테스트 축제",
      normalized_name: normalizedName,
      start_date: startDate,
      end_date: endDate,
    },
    artists: [],
    tickets: [],
  };
}

test("축제 식별값은 normalized_name과 시작일·종료일이 모두 같아야 일치한다", () => {
  const current = draft("test", "2026-08-01", "2026-08-02");

  assert.equal(hasExactFestivalIdentity(current, draft("test", "2026-08-01", "2026-08-02")), true);
  assert.equal(hasExactFestivalIdentity(current, draft("other", "2026-08-01", "2026-08-02")), false);
  assert.equal(hasSameFestivalDates(current, draft("other", "2026-08-01", "2026-08-02")), true);
});

test("현재 값을 유지한 변경 항목은 검토 메모에 남긴다", () => {
  const diff: DraftMergeDiff = {
    section: "ticket",
    key: "ticket:1",
    label: "티켓 가격",
    status: "change",
    current: "10,000원",
    incoming: "20,000원",
  };

  assert.match(unresolvedFestivalDraftReviewNotes([diff], {}), /티켓 가격/);
  assert.equal(
    unresolvedFestivalDraftReviewNotes([diff], { [festivalDraftDiffChoiceKey(diff)]: "incoming" }),
    "",
  );
});
