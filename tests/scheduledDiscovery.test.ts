import assert from "node:assert/strict";
import { test } from "node:test";

import { buildTicketDiscoveryReport } from "../crawler/compare/buildTicketDiscoveryReport.ts";

test("수동 북마클릿 결과를 DB 참조와 비교해 등록됨·확인 필요·누락 후보로 만든다", () => {
  const report = buildTicketDiscoveryReport({
    generatedAt: "2026-07-23T00:00:00.000Z",
    sites: [],
    references: [{
      kind: "festival",
      id: 1,
      title: "테스트 페스티벌",
      start_date: "2026-08-01",
      end_date: "2026-08-02",
    }, {
      kind: "ticket",
      id: 2,
      title: "기존 티켓",
      source_url: "https://ticket.example/duplicate",
    }],
    items: [{
      title: "다른 제목",
      source_url: "https://ticket.example/duplicate",
      source_type: "test",
      discovered_at: "2026-07-23T00:00:00.000Z",
    }, {
      title: "2026 테스트 페스티벌 얼리버드 티켓",
      source_url: "https://ticket.example/possible",
      source_type: "test",
      discovered_at: "2026-07-23T00:00:00.000Z",
      start_date: "2026-08-01",
      end_date: "2026-08-02",
    }, {
      title: "신규 페스티벌",
      source_url: "https://ticket.example/new",
      source_type: "test",
      discovered_at: "2026-07-23T00:00:00.000Z",
    }],
  });
  assert.deepEqual(
    report.items.map((item) => item.status).sort(),
    ["duplicate", "new", "possible"],
  );
});
