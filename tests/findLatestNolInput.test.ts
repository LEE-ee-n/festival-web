import assert from "node:assert/strict";
import { test } from "node:test";

import {
  isNolTicketInputFilename,
  selectLatestNolTicketFile,
} from "../crawler/importers/findLatestNolInput.ts";

test("북마클릿 다운로드 파일명과 브라우저 중복 파일명을 허용", () => {
  assert.equal(isNolTicketInputFilename("nol-tickets.json"), true);
  assert.equal(isNolTicketInputFilename("nol-tickets-2026-07-18.json"), true);
  assert.equal(isNolTicketInputFilename("nol-tickets-2026-07-18 (1).json"), true);
  assert.equal(isNolTicketInputFilename("260718-NOL-crwal.json"), true);
  assert.equal(isNolTicketInputFilename("260718-NOL-crwal (1).json"), true);
  assert.equal(isNolTicketInputFilename("nol-discovery.json"), false);
});

test("수정 시각이 가장 최근인 놀티켓 파일을 선택", () => {
  assert.equal(
    selectLatestNolTicketFile([
      { path: "old.json", modifiedAtMs: 10 },
      { path: "latest.json", modifiedAtMs: 30 },
      { path: "middle.json", modifiedAtMs: 20 },
    ]),
    "latest.json",
  );
});
