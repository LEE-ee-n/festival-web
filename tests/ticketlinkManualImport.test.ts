import assert from "node:assert/strict";
import { test } from "node:test";

import {
  importTicketlinkManualCandidates,
  isTicketlinkFestivalTitle,
} from "../crawler/importers/ticketlinkManualImport.ts";

test("한글·영문 페스티벌 표기 변형을 찾는다", () => {
  assert.equal(isTicketlinkFestivalTitle("도고 뮤직 포레스티벌"), true);
  assert.equal(isTicketlinkFestivalTitle("PEAK FESTIVAL 2026"), true);
  assert.equal(isTicketlinkFestivalTitle("SUMMER FEST"), true);
  assert.equal(isTicketlinkFestivalTitle("KIMCHIKURA Fes'26"), true);
  assert.equal(isTicketlinkFestivalTitle("일반 단독 콘서트"), false);
});

test("티켓링크 상품만 discovery 후보로 변환한다", () => {
  const items = importTicketlinkManualCandidates([{
    title: "테스트 페스티벌",
    source_url: "https://www.ticketlink.co.kr/product/12345?foo=bar",
    raw_title: "테스트 페스티벌 2026.08.01 ~ 2026.08.02",
    start_date: "2026-08-01",
    end_date: "2026-08-02",
  }, {
    title: "외부 상품",
    source_url: "https://evil.example/product/12345",
  }], "2026-07-18T00:00:00.000Z");

  assert.equal(items.length, 1);
  assert.equal(items[0].source_type, "ticketlink_manual");
  assert.equal(items[0].source_url, "https://www.ticketlink.co.kr/product/12345");
  assert.equal(items[0].start_date, "2026-08-01");
});

test("종료된 페스티벌은 discovery 후보에서 제외한다", () => {
  const items = importTicketlinkManualCandidates([{
    title: "종료된 페스티벌",
    source_url: "https://www.ticketlink.co.kr/product/100",
    start_date: "2026-06-01",
    end_date: "2026-06-02",
  }, {
    title: "진행 예정 FESTIVAL",
    source_url: "https://www.ticketlink.co.kr/product/200",
    start_date: "2026-08-01",
    end_date: "2026-08-02",
  }], "2026-07-18T00:00:00.000Z");

  assert.deepEqual(items.map((item) => item.title), ["진행 예정 FESTIVAL"]);
});

test("버튼 제목 대신 raw_title의 페스티벌명을 복구한다", () => {
  const items = importTicketlinkManualCandidates([{
    title: "티켓링크 도고 예매",
    source_url: "https://www.ticketlink.co.kr/product/777",
    raw_title: "2026 도고 뮤직 포레스티벌 2026.08.15 ~ 2026.08.15 청년패스",
    start_date: "2026-08-15",
    end_date: "2026-08-15",
  }], "2026-07-18T00:00:00.000Z");

  assert.equal(items[0].title, "2026 도고 뮤직 포레스티벌");
});
