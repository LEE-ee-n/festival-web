import assert from "node:assert/strict";
import test from "node:test";

import {
  formatAuditValue,
  getFestivalAuditDiff,
} from "../lib/audit/festivalAuditDiff.ts";

test("축제 기본정보에서 실제로 달라진 필드만 반환한다", () => {
  const changes = getFestivalAuditDiff(
    { name: "기존", start_date: "2026-09-01", updated_at: "old" },
    { name: "변경", start_date: "2026-09-01", updated_at: "new" },
  );

  assert.deepEqual(changes, [{
    field: "name",
      label: "이름",
    before: "기존",
    after: "변경",
  }]);
});

test("등록과 삭제 스냅샷도 변경 항목으로 표시한다", () => {
  assert.equal(getFestivalAuditDiff(null, { name: "신규" })[0].after, "신규");
  assert.equal(getFestivalAuditDiff({ name: "삭제" }, null)[0].before, "삭제");
  assert.equal(formatAuditValue(null), "없음");
});
