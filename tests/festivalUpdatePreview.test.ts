import assert from "node:assert/strict";
import test from "node:test";

import {
  createFestivalUpdatePreview,
  type ExistingFestivalArtist,
  type ExistingFestivalTicket,
} from "../lib/festivals/festivalUpdatePreview.ts";
import type { FestivalDraftJson } from "../lib/types.ts";

function draft(): FestivalDraftJson {
  return {
    festival: {
      name: "테스트 페스티벌",
      normalized_name: "testfestival",
      start_date: "2026-09-05",
      end_date: "2026-09-06",
    },
    artists: [],
    tickets: [],
  };
}

test("빈 기본정보에는 JSON 값을 추가 대상으로 표시한다", () => {
  const incoming = draft();
  incoming.festival.location = "테스트 공연장";

  const items = createFestivalUpdatePreview(draft().festival, [], [], incoming);
  const location = items.find((item) => item.basicField === "location");

  assert.equal(location?.status, "add");
});

test("기존 기본정보와 다른 JSON 값은 자동 추가가 아니라 충돌로 표시한다", () => {
  const current = draft().festival;
  current.location = "기존 공연장";
  const incoming = draft();
  incoming.festival.location = "새 공연장";

  const items = createFestivalUpdatePreview(current, [], [], incoming);
  const location = items.find((item) => item.basicField === "location");

  assert.equal(location?.status, "conflict");
  assert.equal(location?.current, "기존 공연장");
});

test("같은 아티스트라도 공연 날짜가 다르면 신규 라인업으로 표시한다", () => {
  const currentArtists: ExistingFestivalArtist[] = [{
    id: 1,
    artist_id: 10,
    performance_date: "2026-09-05",
    performance_time: "18:00:00",
    performance_end_time: null,
    stage_name: null,
    status: "confirmed",
    artist: { id: 10, name: "테스트 밴드", normalized_name: "testband", aliases: [] },
  }];
  const incoming = draft();
  incoming.artists.push({
    input_name: "테스트 밴드",
    display_name: "테스트 밴드",
    normalized_name: "testband",
    matched_artist_id: 10,
    match_status: "matched",
    aliases: [],
    performance_date: "2026-09-06",
  });

  const items = createFestivalUpdatePreview(draft().festival, currentArtists, [], incoming);
  const lineup = items.find((item) => item.section === "lineup");

  assert.equal(lineup?.status, "add");
});

test("같은 티켓의 가격이 다르면 검토할 충돌로 표시한다", () => {
  const currentTickets: ExistingFestivalTicket[] = [{
    id: 2,
    round_type: "regular",
    round_name: "일반 예매",
    open_at: "2026-07-01T11:00:00+00:00",
    price_info: "100,000원",
    ticket_url: "https://example.com/ticket",
    ticket_platform: "티켓링크",
  }];
  const incoming = draft();
  incoming.tickets = [{
    round_type: "regular",
    round_name: "일반 예매",
    open_at: "2026-07-01T11:00:00+00:00",
    price_info: "120,000원",
    ticket_url: "https://example.com/ticket",
    ticket_platform: "티켓링크",
  }];

  const items = createFestivalUpdatePreview(draft().festival, [], currentTickets, incoming);
  const ticket = items.find((item) => item.section === "ticket");

  assert.equal(ticket?.status, "conflict");
  assert.equal(ticket?.ticketPayload?.existing_ticket_id, 2);
});
