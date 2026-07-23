import assert from "node:assert/strict";
import test from "node:test";

import { parseJsonAuditSummary } from "../lib/audit/auditSummary.ts";
import {
  parseCandidateSourceAssets,
  parseFestivalDraftValue,
} from "../lib/festivals/festivalCandidateRecord.ts";

test("DB JSON 감사 요약은 숫자 필드를 검증한 뒤 반환한다", () => {
  const count = { maintained: 1, added: 2, changed: 3, deleted: 4, skipped: 5 };
  assert.deepEqual(
    parseJsonAuditSummary({
      total: count,
      sections: { basic: count, lineup: count, ticket: count },
    }),
    {
      total: count,
      sections: { basic: count, lineup: count, ticket: count },
    },
  );
  assert.equal(parseJsonAuditSummary({ total: count }), null);
});

test("후보 첨부 자료 JSON을 구체 타입으로 변환한다", () => {
  assert.deepEqual(
    parseCandidateSourceAssets([
      {
        type: "image/webp",
        name: "poster.webp",
        storage_path: "candidate/1/poster.webp",
      },
    ]),
    [
      {
        type: "image/webp",
        name: "poster.webp",
        url: undefined,
        storage_path: "candidate/1/poster.webp",
      },
    ],
  );
  assert.throws(() => parseCandidateSourceAssets("invalid"), /형식/);
});

test("후보 초안 JSON은 기존 초안 검증기를 통과해야 한다", () => {
  const draft = parseFestivalDraftValue({
    festival: {
      name: "테스트 페스티벌",
      normalized_name: "test",
      start_date: "2026-07-25",
      end_date: "2026-07-26",
    },
    artists: [],
  });
  assert.equal(draft?.festival.normalized_name, "test");
  assert.equal(parseFestivalDraftValue(null), null);
});
