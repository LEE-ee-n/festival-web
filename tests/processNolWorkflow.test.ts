import assert from "node:assert/strict";
import { test } from "node:test";

import {
  collectionDateFromFilename,
  formatCompactLocalDate,
} from "../crawler/workflowPaths.ts";

test("수집·정리 파일에 사용할 YYMMDD 날짜 생성", () => {
  assert.equal(formatCompactLocalDate(new Date(2026, 6, 18)), "260718");
  assert.equal(
    collectionDateFromFilename("260717-NOL-crwal (2).json", new Date(2026, 6, 18)),
    "260717",
  );
  assert.equal(
    collectionDateFromFilename("nol-tickets-2026-07-16.json", new Date(2026, 6, 18)),
    "260716",
  );
  assert.equal(
    collectionDateFromFilename("260718-TICKETLINK-crwal.json", new Date(2026, 6, 19)),
    "260718",
  );
});
