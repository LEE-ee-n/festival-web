import assert from "node:assert/strict";
import test from "node:test";

import {
  isValidArtistNormalizedName,
  normalizeArtistName,
} from "../lib/artists/normalizeArtistName.ts";

test("아티스트 이름을 영문 소문자와 숫자로 정규화한다", () => {
  assert.equal(normalizeArtistName("10CM Official"), "10cmofficial");
});

test("앤드 기호는 and로 변환한다", () => {
  assert.equal(normalizeArtistName("Simon & Garfunkel"), "simonandgarfunkel");
});

test("공백과 특수문자 및 한글은 제거한다", () => {
  assert.equal(normalizeArtistName("검정치마 (The Black Skirts)"), "theblackskirts");
});

test("아티스트 이름에서는 festival과 20XX를 임의로 제거하지 않는다", () => {
  assert.equal(normalizeArtistName("Festival 2026"), "festival2026");
});

test("DB 저장 규칙과 같은 형식만 유효하다", () => {
  assert.equal(isValidArtistNormalizedName("theblackskirts"), true);
  assert.equal(isValidArtistNormalizedName("10cm"), true);
  assert.equal(isValidArtistNormalizedName("The Black Skirts"), false);
  assert.equal(isValidArtistNormalizedName("검정치마"), false);
  assert.equal(isValidArtistNormalizedName(""), false);
});
