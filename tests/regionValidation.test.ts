import assert from "node:assert/strict";
import test from "node:test";

import {
  getFestivalRegionPrefix,
  isValidFestivalRegion,
  normalizeFestivalRegion,
} from "../lib/festivals/regionValidation.ts";

test("광역지역 단독 또는 한 칸 띄운 세부지역을 허용한다", () => {
  ["서울", "충남 아산시", "경기 고양", "서울 마포구"].forEach(
    (region) => assert.equal(isValidFestivalRegion(region), true),
  );
});

test("빈값과 잘못된 접두어·공백 형식을 거부한다", () => {
  ["", " ", "충남아산시", "충남  아산시", "서울특별시", "창원", "해외"].forEach(
    (region) => assert.equal(isValidFestivalRegion(region), false),
  );
});

test("저장값의 앞뒤 공백은 정리하고 잘못된 값은 오류로 막는다", () => {
  assert.equal(normalizeFestivalRegion(" 충남 아산시 "), "충남 아산시");
  assert.throws(
    () => normalizeFestivalRegion("충남아산시"),
    /표준 광역지역 2글자/,
  );
});

test("세부지역이 있어도 첫 2글자 광역지역을 추출한다", () => {
  assert.equal(getFestivalRegionPrefix("충남 아산시"), "충남");
  assert.equal(getFestivalRegionPrefix("경남 창원시"), "경남");
  assert.equal(getFestivalRegionPrefix("서울"), "서울");
  assert.equal(getFestivalRegionPrefix("서울특별시"), null);
});
