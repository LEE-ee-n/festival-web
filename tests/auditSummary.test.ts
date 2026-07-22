import assert from "node:assert/strict";
import test from "node:test";
import { buildJsonAuditSummary, summarizeAuditOperations } from "../lib/audit/auditSummary.ts";

test("JSON 비교 결과를 유지·추가·변경·미반영으로 요약한다", () => {
  const summary = buildJsonAuditSummary([
    { id: "1", section: "basic", status: "same" },
    { id: "2", section: "lineup", status: "add" },
    { id: "3", section: "ticket", status: "conflict" },
    { id: "4", section: "ticket", status: "add" },
  ], new Set(["2", "3"]));

  assert.deepEqual(summary.total, {
    maintained: 1, added: 1, changed: 1, deleted: 0, skipped: 1,
  });
  assert.equal(summary.sections.lineup.added, 1);
  assert.equal(summary.sections.ticket.changed, 1);
});

test("일반 감사 변경을 추가·변경·삭제로 요약한다", () => {
  assert.deepEqual(summarizeAuditOperations([
    { operation: "insert" }, { operation: "update" }, { operation: "delete" },
  ]), { maintained: 0, added: 1, changed: 1, deleted: 1, skipped: 0 });
});
