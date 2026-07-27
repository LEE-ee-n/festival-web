import assert from "node:assert/strict";
import test from "node:test";

import {
  escapeIlikePattern,
  normalizePublicSearchText,
  sortAndLimitArtists,
} from "../lib/publicSearchLogic.ts";

test("공개 검색은 띄어쓰기와 기호를 제거하고 한글을 유지한다", () => {
  assert.equal(
    normalizePublicSearchText("조이 밸런스 & 브레"),
    "조이밸런스브레",
  );
  assert.equal(normalizePublicSearchText("Cass Cool!"), "casscool");
});

test("부분 검색 와일드카드를 일반 문자로 이스케이프한다", () => {
  assert.equal(escapeIlikePattern("100%_A\\B"), "100\\%\\_A\\\\B");
});

test("아티스트는 정확 일치와 시작 일치를 우선하고 중복을 제거한다", () => {
  const results = sortAndLimitArtists([
    {
      id: 2,
      name: "ALI JAPAN",
      normalized_name: "alijapan",
      aliases: ["알리 재팬"],
    },
    {
      id: 1,
      name: "알리",
      normalized_name: "alikorea",
      aliases: ["ALI"],
    },
    {
      id: 1,
      name: "알리",
      normalized_name: "alikorea",
      aliases: ["ALI"],
    },
  ], "ALI");

  assert.deepEqual(results.map((artist) => artist.id), [1, 2]);
});
