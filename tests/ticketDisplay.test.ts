import assert from "node:assert/strict";
import test from "node:test";

import {
  getLatestTicketRoundGroup,
  getOpenTicketLinks,
} from "../lib/festivals/ticketDisplay.ts";

const oldOpenAt = "2026-07-10T03:00:00.000Z";
const latestOpenAt = "2026-07-27T03:00:00.000Z";

const ticketRounds = [
  {
    id: 1,
    round_name: "얼리버드",
    open_at: oldOpenAt,
    price_info: "100,000원",
    ticket_platform: "인터파크",
    ticket_url: "https://tickets.example.com/early",
  },
  {
    id: 2,
    round_name: "레귤러 티켓",
    open_at: latestOpenAt,
    price_info: "120,000원",
    ticket_platform: "인터파크",
    ticket_url: "https://tickets.example.com/interpark",
  },
  {
    id: 3,
    round_name: "레귤러 티켓",
    open_at: latestOpenAt,
    price_info: "120,000원",
    ticket_platform: "YES24",
    ticket_url: "https://tickets.example.com/yes24",
  },
  {
    id: 4,
    round_name: "레귤러 티켓",
    open_at: latestOpenAt,
    price_info: "120,000원",
    ticket_platform: "판매처 미정",
    ticket_url: null,
  },
];

test("가장 늦은 오픈 시간의 티켓만 한 회차로 묶는다", () => {
  const group = getLatestTicketRoundGroup(ticketRounds);

  assert.equal(group.latestOpenAt, latestOpenAt);
  assert.deepEqual(
    group.latestTicketRounds.map((round) => round.id),
    [2, 3, 4],
  );
});

test("티켓 이름과 가격 정보는 회차의 첫 항목 하나를 사용한다", () => {
  const group = getLatestTicketRoundGroup(ticketRounds);

  assert.equal(group.ticketInfo?.round_name, "레귤러 티켓");
  assert.equal(group.ticketInfo?.price_info, "120,000원");
});

test("오픈 전에는 판매 버튼을 표시하지 않는다", () => {
  const group = getLatestTicketRoundGroup(ticketRounds);
  const links = getOpenTicketLinks(
    group.latestTicketRounds,
    group.latestOpenAt,
    new Date("2026-07-27T02:59:59.000Z").getTime(),
  );

  assert.deepEqual(links, []);
});

test("오픈 시간이 되면 URL이 있는 판매처를 모두 표시한다", () => {
  const group = getLatestTicketRoundGroup(ticketRounds);
  const links = getOpenTicketLinks(
    group.latestTicketRounds,
    group.latestOpenAt,
    new Date(latestOpenAt).getTime(),
  );

  assert.deepEqual(
    links.map((round) => round.ticket_platform),
    ["인터파크", "YES24"],
  );
});

test("URL이 없는 판매처는 오픈 후에도 버튼에서 제외한다", () => {
  const group = getLatestTicketRoundGroup(ticketRounds);
  const links = getOpenTicketLinks(
    group.latestTicketRounds,
    group.latestOpenAt,
    new Date("2026-07-28T00:00:00.000Z").getTime(),
  );

  assert.equal(links.some((round) => round.ticket_url === null), false);
});
