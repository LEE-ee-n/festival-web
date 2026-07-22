import assert from "node:assert/strict";
import test from "node:test";

import {
  findYearLikeSequence,
  normalizeNormalizedName,
} from "../lib/normalizedName.ts";

test("축제 normalized_name에서 연도와 festival을 제거한다", () => {
  assert.equal(
    normalizeNormalizedName("ONE UNIVERSE FESTIVAL 2026"),
    "oneuniverse",
  );
  assert.equal(normalizeNormalizedName("2025 Waterbomb Festival"), "waterbomb");
});

test("19로 시작하는 연도 형태를 찾는다", () => {
  assert.equal(findYearLikeSequence("festival1999"), "1999");
});

test("20으로 시작하는 연도 형태를 찾는다", () => {
  assert.equal(findYearLikeSequence("2026festival"), "2026");
  assert.equal(findYearLikeSequence("my2026festival"), "2026");
  assert.equal(findYearLikeSequence("festival2026"), "2026");
});

test("이름에 필요한 다른 숫자는 연도 경고를 표시하지 않는다", () => {
  assert.equal(findYearLikeSequence("5tardium10"), null);
});
