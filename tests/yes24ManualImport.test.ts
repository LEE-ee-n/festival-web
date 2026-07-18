import assert from "node:assert/strict";
import { test } from "node:test";

import { importYes24ManualCandidates } from "../crawler/importers/yes24ManualImport.ts";

test("YES24 페스티벌 상품만 discovery 후보로 변환한다", () => {
  const items = importYes24ManualCandidates([{
    title: "테스트 페스티벌",
    source_url: "https://ticket.yes24.com/Perf/54504",
    raw_title: "테스트 페스티벌 2026.08.01 ~ 2026.08.02",
    start_date: "2026-08-01",
    end_date: "2026-08-02",
  }, {
    title: "외부 페스티벌",
    source_url: "https://evil.example/Perf/54504",
  }, {
    title: "일반 단독 콘서트",
    source_url: "https://ticket.yes24.com/Perf/99999",
  }], "2026-07-18T00:00:00.000Z");

  assert.equal(items.length, 1);
  assert.equal(items[0].source_type, "yes24_manual");
  assert.equal(items[0].source_url, "https://ticket.yes24.com/Perf/54504");
});

test("종료된 YES24 페스티벌은 후보에서 제외한다", () => {
  const items = importYes24ManualCandidates([{
    title: "종료된 페스티벌",
    source_url: "https://ticket.yes24.com/Perf/100",
    start_date: "2026-06-01",
    end_date: "2026-06-02",
  }, {
    title: "진행 예정 FESTIVAL",
    source_url: "https://ticket.yes24.com/Perf/200",
    start_date: "2026-08-01",
    end_date: "2026-08-02",
  }], "2026-07-18T00:00:00.000Z");

  assert.deepEqual(items.map((item) => item.title), ["진행 예정 FESTIVAL"]);
});
