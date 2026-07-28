import assert from "node:assert/strict";
import test from "node:test";

import {
  createArtistDescription,
  createArtistTitle,
  createFestivalDescription,
  createFestivalEventJsonLd,
  createFestivalTitle,
  serializeJsonLd,
  type FestivalSeoData,
} from "../lib/seo.ts";

const festival: FestivalSeoData = {
  id: 76,
  name: "2026 테스트 페스티벌",
  start_date: "2026-09-05",
  end_date: "2026-09-06",
  location: "테스트 공연장",
  address: "서울특별시 테스트로 1",
  region: "서울",
  description: null,
  status: "scheduled",
};

test("축제와 아티스트 메타데이터 문구를 생성한다", () => {
  assert.equal(
    createFestivalTitle(festival.name),
    "2026 테스트 페스티벌 일정·라인업·티켓 | 페스티봄",
  );
  assert.match(
    createFestivalDescription(festival),
    /2026년 9월 5일부터 2026년 9월 6일까지/,
  );
  assert.equal(
    createArtistTitle("체리필터"),
    "체리필터 출연 페스티벌 | 페스티봄",
  );
  assert.equal(
    createArtistDescription("체리필터"),
    "체리필터의 출연 예정 및 지난 페스티벌 일정과 공연 정보를 확인하세요.",
  );
});

test("축제 Event 구조화 데이터는 공개 화면 정보를 사용한다", () => {
  const jsonLd = createFestivalEventJsonLd(festival);

  assert.equal(jsonLd["@type"], "Event");
  assert.equal(jsonLd.name, festival.name);
  assert.equal(
    jsonLd.url,
    "https://festibom.com/festival/76",
  );
  assert.equal(
    jsonLd.eventStatus,
    "https://schema.org/EventScheduled",
  );
  assert.match(serializeJsonLd(jsonLd), /"@type":"Event"/);
});
