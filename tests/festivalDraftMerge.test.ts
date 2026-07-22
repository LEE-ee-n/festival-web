import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateTextSimilarity,
  mergeFestivalDrafts,
} from "../lib/festivals/festivalDraftMerge.ts";
import type { FestivalDraftJson } from "../lib/types.ts";

function createDraft(): FestivalDraftJson {
  return {
    festival: {
      name: "사운드 플래닛 페스티벌 2026",
      normalized_name: "soundplanetfestival2026",
      start_date: "2026-09-05",
      end_date: "2026-09-06",
      location: "난지 한강 공원",
      description: "다양한 아티스트가 참여하는 음악 페스티벌입니다.",
    },
    artists: [],
    tickets: [],
  };
}

test("공백과 문장부호만 다른 기본정보는 동일하게 분류한다", () => {
  const current = createDraft();
  const incoming = createDraft();
  incoming.festival.location = "난지한강공원!";

  const result = mergeFestivalDrafts(current, incoming);
  const location = result.diffs.find((diff) => diff.key === "location");

  assert.equal(location?.status, "same");
});

test("기존 설명을 포함한 상세 문장은 표현 차이로 분류한다", () => {
  const current = createDraft();
  const incoming = createDraft();
  incoming.festival.description =
    "다양한 아티스트가 참여하는 음악 페스티벌입니다. 올해도 개최됩니다.";

  const result = mergeFestivalDrafts(current, incoming);
  const description = result.diffs.find((diff) => diff.key === "description");

  assert.equal(description?.status, "expression");
  assert.equal(
    result.mergedDraft.festival.description,
    current.festival.description,
  );
});

test("문자 조각이 많이 겹치면 높은 유사도를 반환한다", () => {
  assert.ok(
    calculateTextSimilarity(
      "다양한 아티스트가 참여하는 음악 페스티벌",
      "다양한 아티스트가 참여하는 음악 페스티벌입니다",
    ) > 0.9,
  );
});

test("비어 있는 기본정보와 신규 라인업·티켓은 자동 병합한다", () => {
  const current = createDraft();
  current.festival.address = "";
  const incoming = createDraft();
  incoming.festival.address = "서울 마포구";
  incoming.artists.push({
    input_name: "잔나비",
    display_name: "잔나비",
    normalized_name: "jannabi",
    aliases: [],
  });
  incoming.tickets?.push({
    round_type: "regular",
    round_name: "일반 예매",
    ticket_url: "https://example.com/ticket",
    ticket_platform: "티켓링크",
  });

  const result = mergeFestivalDrafts(current, incoming);

  assert.equal(result.mergedDraft.festival.address, "서울 마포구");
  assert.equal(result.mergedDraft.artists.length, 1);
  assert.equal(result.mergedDraft.tickets?.length, 1);
  assert.equal(
    result.diffs.find((diff) => diff.key === "address")?.status,
    "add",
  );
});

test("기존 라인업은 삭제하지 않고 신규 아티스트만 추가한다", () => {
  const current = createDraft();
  current.artists.push({
    input_name: "잔나비",
    display_name: "잔나비",
    normalized_name: "jannabi",
    aliases: [],
  });
  const incoming = createDraft();
  incoming.artists.push({
    input_name: "실리카겔",
    display_name: "실리카겔",
    normalized_name: "silicagel",
    aliases: [],
  });

  const result = mergeFestivalDrafts(current, incoming);

  assert.deepEqual(
    result.mergedDraft.artists.map((artist) => artist.normalized_name),
    ["jannabi", "silicagel"],
  );
});
