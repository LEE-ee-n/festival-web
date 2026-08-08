import assert from "node:assert/strict";
import test from "node:test";

import {
  filterArtistDirectoryItems,
  getArtistNameGroup,
  paginateArtistDirectoryItems,
  parseArtistDirectoryPage,
  sortArtistDirectoryItems,
  type ArtistDirectoryItem,
} from "../lib/artists/artistDirectory.ts";

const artists: ArtistDirectoryItem[] = [
  { id: 1, name: "QWER", normalizedName: "qwer", imageUrl: null, aliases: [] },
  { id: 2, name: "잔나비", normalizedName: "jannabi", imageUrl: null, aliases: ["Jannabi"] },
  { id: 3, name: "10CM", normalizedName: "10cm", imageUrl: null, aliases: [] },
  { id: 4, name: "김수영", normalizedName: "kimsuyoung", imageUrl: null, aliases: [] },
];

test("아티스트를 숫자, 한글, 영문 순서로 정렬한다", () => {
  assert.deepEqual(
    sortArtistDirectoryItems(artists).map((artist) => artist.name),
    ["10CM", "김수영", "잔나비", "QWER"],
  );
});

test("한글 초성과 영문 첫 글자를 분류한다", () => {
  assert.equal(getArtistNameGroup("김수영").key, "ㄱ");
  assert.equal(getArtistNameGroup("잔나비").key, "ㅈ");
  assert.equal(getArtistNameGroup("QWER").key, "Q");
});

test("표시 이름, normalized_name, 별칭으로 검색한다", () => {
  assert.deepEqual(
    filterArtistDirectoryItems(artists, "jannabi", "all")
      .map((artist) => artist.id),
    [2],
  );
  assert.deepEqual(
    filterArtistDirectoryItems(artists, "", "ㄱ")
      .map((artist) => artist.id),
    [4],
  );
});

test("좋아하는 아티스트만 필터링한다", () => {
  assert.deepEqual(
    filterArtistDirectoryItems(
      artists,
      "",
      "all",
      new Set([1, 3]),
    ).map((artist) => artist.id),
    [1, 3],
  );
});

test("아티스트 목록을 페이지당 50명으로 나눈다", () => {
  const manyArtists = Array.from({ length: 105 }, (_, index) => ({
    id: index + 1,
    name: `아티스트 ${index + 1}`,
    normalizedName: `artist${index + 1}`,
    imageUrl: null,
    aliases: [],
  }));
  const secondPage = paginateArtistDirectoryItems(manyArtists, 2);

  assert.equal(secondPage.items.length, 50);
  assert.equal(secondPage.items[0].id, 51);
  assert.equal(secondPage.totalPages, 3);
});

test("아티스트 목록 페이지 쿼리를 안전하게 해석한다", () => {
  assert.equal(parseArtistDirectoryPage("2"), 2);
  assert.equal(parseArtistDirectoryPage(["3", "4"]), 3);
  assert.equal(parseArtistDirectoryPage("0"), 1);
  assert.equal(parseArtistDirectoryPage("잘못된 값"), 1);
});
