import assert from "node:assert/strict";
import test from "node:test";

import {
  createFestivalUpdatePreview,
  getFestivalUpdateDisplayStatus,
  setFestivalUpdateItemSelections,
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

test("수집 JSON의 Instagram 계정만 운영 기본정보 변경 후보로 표시한다", () => {
  const incoming = draft();
  incoming.festival.source_url = "https://www.instagram.com/p/source/";
  incoming.festival.official_url = "https://example.com/generated";
  incoming.festival.instagram_url = "https://www.instagram.com/festival/";
  incoming.festival.thumbnail_url = "https://example.com/lineup.webp";

  const items = createFestivalUpdatePreview(draft().festival, [], [], incoming);

  assert.equal(
    items.some((item) =>
      ["source_url", "official_url", "thumbnail_url"].includes(
        item.basicField ?? "",
      )),
    false,
  );
  const instagram = items.find((item) => item.basicField === "instagram_url");
  assert.equal(instagram?.status, "add");
  assert.equal(instagram?.incoming, "https://www.instagram.com/festival/");
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

test("일정 없는 기존 출연진 공지는 normalized_name으로 기존 연결을 유지한다", () => {
  const festival = draft().festival;
  const preview = createFestivalUpdatePreview(
    festival,
    [{
      id: 1,
      artist_id: 10,
      performance_date: "2026-07-25",
      performance_time: "18:00:00",
      performance_end_time: null,
      stage_name: "메인",
      status: "confirmed",
      artist: { id: 10, name: "Existing", normalized_name: "existing", aliases: [] },
    }],
    [],
    {
      festival,
      artists: [{
        input_name: "Existing",
        display_name: "Existing",
        normalized_name: "existing",
        aliases: [],
        matched_artist_id: 10,
        match_status: "matched",
      }],
    },
  );

  assert.equal(preview.find((item) => item.section === "lineup")?.status, "same");
});

test("제외한 빈 아티스트는 최종 변경 미리보기에 포함하지 않는다", () => {
  const incoming = draft();
  incoming.artists.push({
    input_name: "",
    display_name: "",
    normalized_name: "",
    aliases: [],
    matched_artist_id: null,
    match_status: "excluded",
  });

  const items = createFestivalUpdatePreview(incoming.festival, [], [], incoming);

  assert.equal(items.some((item) => item.section === "lineup"), false);
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

test("라인업 추가·변경·취소를 화면 상태로 구분한다", () => {
  const added: ReturnType<typeof createFestivalUpdatePreview>[number] = {
    id: "lineup:add",
    section: "lineup",
    label: "신규",
    status: "add",
    current: "없음",
    incoming: "신규",
  };
  const changed = { ...added, id: "lineup:change", status: "conflict" as const };
  const removed = {
    ...changed,
    id: "lineup:remove",
    artistPayload: {
      input_name: "취소",
      display_name: "취소",
      normalized_name: "cancelled",
      aliases: [],
      status: "cancelled",
    },
  };

  assert.equal(getFestivalUpdateDisplayStatus(added), "add");
  assert.equal(getFestivalUpdateDisplayStatus(changed), "change");
  assert.equal(getFestivalUpdateDisplayStatus(removed), "remove");
});

test("라인업 새 일정에는 최종 반영될 날짜·시간·무대를 표시한다", () => {
  const festival = draft().festival;
  const preview = createFestivalUpdatePreview(
    festival,
    [{
      id: 1,
      artist_id: 10,
      performance_date: "2026-09-05",
      performance_time: null,
      performance_end_time: null,
      stage_name: "메인",
      status: "confirmed",
      artist: {
        id: 10,
        name: "Existing",
        normalized_name: "existing",
        aliases: [],
      },
    }],
    [],
    {
      festival,
      artists: [{
        input_name: "Existing",
        display_name: "Existing",
        normalized_name: "existing",
        aliases: [],
        matched_artist_id: 10,
        match_status: "matched",
        performance_date: "2026-09-05",
        performance_time: "18:00",
        performance_end_time: "19:00",
      }],
    },
  );

  const lineup = preview.find((item) => item.section === "lineup");
  assert.equal(
    lineup?.incoming,
    "2026-09-05 · 18:00~19:00 · 메인",
  );
});

test("타임테이블 전체 선택은 다른 단계의 선택을 유지한다", () => {
  const informationItem: ReturnType<
    typeof createFestivalUpdatePreview
  >[number] = {
    id: "basic:name",
    section: "basic",
    label: "축제명",
    status: "conflict",
    current: "기존",
    incoming: "신규",
  };
  const lineupItem = {
    ...informationItem,
    id: "lineup:1",
    section: "lineup" as const,
    label: "아티스트",
  };

  const selected = setFestivalUpdateItemSelections(
    new Set([informationItem.id]),
    [lineupItem],
    true,
  );
  assert.deepEqual([...selected].sort(), ["basic:name", "lineup:1"]);

  const maintained = setFestivalUpdateItemSelections(
    selected,
    [lineupItem],
    false,
  );
  assert.deepEqual([...maintained], ["basic:name"]);
});
