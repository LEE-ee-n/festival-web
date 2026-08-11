import assert from "node:assert/strict";
import test from "node:test";

import {
  filterAndSortManagedArtists,
  type ManagedArtistRow,
} from "../lib/artists/managedArtistList.ts";

const artists: ManagedArtistRow[] = [
  {
    id: 2,
    name: "두번째",
    normalized_name: "second",
    aliases: ["별칭"],
    image_url: null,
    instagram_url: null,
    featured_playlist_url: null,
  },
  {
    id: 1,
    name: "첫번째",
    normalized_name: "first",
    aliases: [],
    image_url: null,
    instagram_url: null,
    featured_playlist_url: null,
  },
];

test("관리 아티스트는 이름·식별값·별칭·ID로 필터링한다", () => {
  assert.deepEqual(filterAndSortManagedArtists(artists, "별칭", "id", "asc").map(({ id }) => id), [2]);
  assert.deepEqual(filterAndSortManagedArtists(artists, "first", "id", "asc").map(({ id }) => id), [1]);
});

test("관리 아티스트 정렬은 원본 배열을 변경하지 않는다", () => {
  assert.deepEqual(filterAndSortManagedArtists(artists, "", "id", "asc").map(({ id }) => id), [1, 2]);
  assert.deepEqual(artists.map(({ id }) => id), [2, 1]);
});
