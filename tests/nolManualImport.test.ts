import assert from "node:assert/strict";
import { test } from "node:test";

import {
  extractNolProductTitle,
  importNolManualCandidates,
} from "../crawler/importers/nolManualImport.ts";

const now = "2026-07-18T00:00:00.000Z";

test("놀티켓 결합 문장에서 카테고리와 큰 제목만 분리", () => {
  assert.deepEqual(
    extractNolProductTitle(
      "콘서트 2026 렛츠락 페스티벌 - 블라인드 2026.10.03~2026.10.04 서울 ・ 난지 한강공원",
    ),
    {
      category: "콘서트",
      title: "2026 렛츠락 페스티벌 - 블라인드",
      start_date: "2026-10-03",
      end_date: "2026-10-04",
    },
  );
});

test("놀티켓 수동 입력에서 콘서트 상품만 후보로 변환", () => {
  const items = importNolManualCandidates(
    [
      {
        title: "콘서트 MADLY MEDLEY 2026 2026.09.05~2026.09.06 서울 ・ 문화비축기지",
        source_url: "https://nol.yanolja.com/ticket/places/1/products/2",
      },
      {
        title: "연극 어린이 페스티벌 2026.08.08 서울 ・ 공연장",
        source_url: "https://nol.yanolja.com/ticket/places/3/products/4",
      },
      {
        title: "콘서트 외부 상품 2026.08.08",
        source_url: "https://evil.example/ticket/places/3/products/4",
      },
    ],
    now,
  );
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "MADLY MEDLEY 2026");
  assert.equal(items[0].source_type, "nol_ticket_manual");
  assert.equal(items[0].start_date, "2026-09-05");
  assert.equal(items[0].end_date, "2026-09-06");
});
