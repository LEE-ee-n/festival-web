import assert from "node:assert/strict";
import { test } from "node:test";

import {
  classifyTicketDiscovery,
  createTicketDiscoveryDraft,
  parseTicketDiscoveryReport,
} from "../lib/festivals/ticketDiscovery.ts";

const item = {
  title: "2026 테스트 페스티벌 - 블라인드",
  source_url: "https://nol.yanolja.com/ticket/places/1/products/2",
  source_type: "nol_ticket_manual",
  start_date: "2026-10-03",
  end_date: "2026-10-04",
};

test("같은 출처 URL은 확실한 중복으로 분류한다", () => {
  const result = classifyTicketDiscovery(item, [{
    kind: "candidate",
    id: 1,
    title: "다른 제목",
    source_url: item.source_url,
  }]);
  assert.equal(result.status, "duplicate");
});

test("티켓 판매 문구를 뺀 제목과 날짜가 같으면 중복 가능성으로 분류한다", () => {
  const result = classifyTicketDiscovery(item, [{
    kind: "festival",
    id: 2,
    title: "테스트 페스티벌",
    start_date: "2026-10-03",
    end_date: "2026-10-04",
  }]);
  assert.equal(result.status, "possible");
});

test("기존 축제의 영문 검색 별칭과도 비교한다", () => {
  const result = classifyTicketDiscovery({
    ...item,
    title: "MADLY MEDLEY 2026",
  }, [{
    kind: "festival",
    id: 3,
    title: "맬로디 매들리",
    search_aliases: "매들리 매들리, MADLY MEDLEY 2026",
    start_date: "2026-10-03",
    end_date: "2026-10-04",
  }]);
  assert.equal(result.status, "possible");
});

test("기존 축제의 normalized_name과도 비교한다", () => {
  const result = classifyTicketDiscovery({
    ...item,
    title: "MADLY MEDLEY 2026",
  }, [{
    kind: "festival",
    id: 4,
    title: "2026 매들리 매들리",
    normalized_name: "madlymedley",
    start_date: "2026-10-03",
    end_date: "2026-10-04",
  }]);
  assert.equal(result.status, "possible");
});

test("긴 영문 티켓 제목 안에 normalized_name이 포함되면 비교한다", () => {
  const result = classifyTicketDiscovery({
    ...item,
    title: "ONE UNIVERSE FESTIVAL 2026 - Special Ticket",
  }, [{
    kind: "festival",
    id: 5,
    title: "2026 ONE UNIVERSE 페스티벌",
    normalized_name: "oneuniverse",
    start_date: "2026-10-03",
    end_date: "2026-10-04",
  }]);
  assert.equal(result.status, "possible");
});

test("normalized_name 없이도 검토용 초안을 만든다", () => {
  const draft = createTicketDiscoveryDraft(item);
  assert.equal(draft.festival.normalized_name, "");
  assert.equal(draft.festival.start_date, "2026-10-03");
  assert.deepEqual(draft.artists, []);
});

test("discovery 보고서의 items 배열을 읽는다", () => {
  const parsed = parseTicketDiscoveryReport(JSON.stringify({ items: [item] }));
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].source_url, item.source_url);
});
