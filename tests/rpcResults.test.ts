import assert from "node:assert/strict";
import test from "node:test";

import {
  parseArtistUpdateResult,
  parseArtistMutationResult,
  parseApproveFestivalCandidateResult,
  parseFestivalJsonUpdateResult,
  parseFestivalLineupImportResult,
  parseFestivalTicketResult,
  parseFestivalXlsxImportResult,
} from "../lib/supabase/rpcResults.ts";

test("축제 승인 RPC 결과를 검증해 반환한다", () => {
  assert.deepEqual(
    parseApproveFestivalCandidateResult({
      festival_id: 46,
      audit_event_id: 350,
      import_result: { added_lineup: 18 },
    }),
    {
      festival_id: 46,
      audit_event_id: 350,
      import_result: { added_lineup: 18 },
    },
  );
});

test("티켓 변경 RPC 결과에서 티켓을 검증해 반환한다", () => {
  assert.deepEqual(
    parseFestivalTicketResult({
      event_id: 351,
      ticket: {
        id: 10,
        round_type: "regular",
        round_name: "일반 예매",
        open_at: "2026-07-23T05:00:00+00:00",
        price_info: null,
        ticket_url: null,
        ticket_platform: "예스24",
      },
    }),
    {
      id: 10,
      round_type: "regular",
      round_name: "일반 예매",
      open_at: "2026-07-23T05:00:00+00:00",
      price_info: null,
      ticket_url: null,
      ticket_platform: "예스24",
    },
  );
});

test("필수 필드가 없는 RPC 결과는 거부한다", () => {
  assert.throws(
    () => parseApproveFestivalCandidateResult({ audit_event_id: 1 }),
    /import_result/,
  );
  assert.throws(
    () => parseFestivalTicketResult({ event_id: 1, ticket: null }),
    /응답 형식/,
  );
});

test("등록·수정 RPC의 숫자와 불리언 결과를 검증한다", () => {
  assert.deepEqual(parseArtistUpdateResult({
    updated_count: 2,
    alias_count: 3,
  }), { updated_count: 2, alias_count: 3 });

  assert.equal(parseFestivalLineupImportResult({
    festival_id: 46,
    new_artist_count: 1,
    existing_artist_count: 2,
    linked_count: 3,
    already_linked_count: 4,
    alias_count: 5,
  }).linked_count, 3);

  assert.equal(parseFestivalXlsxImportResult({
    festival_id: 46,
    created_festival: true,
    created_artists: 2,
    added_aliases: 3,
    added_lineup: 4,
    updated_lineup: 5,
    unchanged_lineup: 6,
  }).created_festival, true);

  assert.equal(parseFestivalJsonUpdateResult({
    festival_id: 46,
    audit_event_id: 350,
    change_count: 18,
    ticket_count: 1,
  }).change_count, 18);

  assert.throws(
    () => parseArtistUpdateResult({ updated_count: "2", alias_count: 3 }),
    /updated_count/,
  );
});

test("아티스트 생성 RPC 결과를 검증한다", () => {
  assert.deepEqual(
    parseArtistMutationResult({
      id: 101,
      name: "테스트",
      normalized_name: "test",
      aliases: ["TEST"],
    }),
    {
      id: 101,
      name: "테스트",
      normalized_name: "test",
      aliases: ["TEST"],
    },
  );
  assert.throws(
    () => parseArtistMutationResult({
      id: 101,
      name: "테스트",
      normalized_name: "test",
      aliases: [1],
    }),
    /aliases/,
  );
});
