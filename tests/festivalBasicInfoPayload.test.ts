import assert from "node:assert/strict";
import test from "node:test";

import { toFestivalBasicInfoPayload } from "../lib/festivals/festivalBasicInfoPayload.ts";
import type { FestivalBasicInfoInput } from "../lib/festivals/updateFestivalBasicInfo.ts";

function createInput(
  overrides: Partial<FestivalBasicInfoInput> = {},
): FestivalBasicInfoInput {
  return {
    name: "테스트 페스티벌",
    normalizedName: "test",
    searchAliases: "",
    startDate: "2026-08-01",
    endDate: "2026-08-02",
    location: "테스트 공연장",
    address: "서울특별시 테스트로 1",
    region: "서울",
    category: "music_festival",
    description: "",
    thumbnailUrl: "",
    officialUrl: "",
    instagramUrl: "",
    officialUrlUnavailable: false,
    instagramUrlUnavailable: false,
    priceType: "unknown",
    priceInfo: "",
    programInfo: "",
    status: "scheduled",
    verificationStatus: "approved",
    ...overrides,
  };
}

test("빈 공식 링크는 없음 확인 상태를 payload에 보존한다", () => {
  const payload = toFestivalBasicInfoPayload(createInput({
    officialUrlUnavailable: true,
    instagramUrlUnavailable: true,
  }), "test");

  assert.equal(payload.official_url, null);
  assert.equal(payload.instagram_url, null);
  assert.equal(payload.official_url_unavailable, true);
  assert.equal(payload.instagram_url_unavailable, true);
});

test("공식 링크가 입력되면 없음 확인 상태를 payload에서 해제한다", () => {
  const payload = toFestivalBasicInfoPayload(createInput({
    officialUrl: "https://example.com",
    officialUrlUnavailable: true,
    instagramUrl: "https://www.instagram.com/test/",
    instagramUrlUnavailable: true,
  }), "test");

  assert.equal(payload.official_url_unavailable, false);
  assert.equal(payload.instagram_url_unavailable, false);
});
