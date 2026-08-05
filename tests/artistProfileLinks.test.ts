import assert from "node:assert/strict";
import test from "node:test";

import {
  getArtistYoutubeSearchUrl,
  normalizeFeaturedPlaylistUrl,
  normalizeInstagramUrl,
} from "../lib/artists/profileLinks.ts";

test("Instagram 공식 프로필 URL만 허용한다", () => {
  assert.equal(
    normalizeInstagramUrl(" https://www.instagram.com/bandjannabi/ "),
    "https://www.instagram.com/bandjannabi/",
  );
  assert.equal(normalizeInstagramUrl(""), null);
  assert.throws(() => normalizeInstagramUrl("https://example.com/jannabi"));
});

test("YouTube 재생목록 URL만 추천 플레이리스트로 허용한다", () => {
  assert.equal(
    normalizeFeaturedPlaylistUrl(
      "https://www.youtube.com/playlist?list=PLg3Fyw16dkwhSBMsiWbJkIVdQKouPkhNd",
    ),
    "https://www.youtube.com/playlist?list=PLg3Fyw16dkwhSBMsiWbJkIVdQKouPkhNd",
  );
  assert.throws(() =>
    normalizeFeaturedPlaylistUrl("https://www.youtube.com/watch?v=abc"),
  );
});

test("재생목록에 포함된 영상 주소를 재생목록 대표 주소로 바꾼다", () => {
  assert.equal(
    normalizeFeaturedPlaylistUrl(
      "https://www.youtube.com/watch?v=g3XMgp-rJn0&list=PL306mBEuEUrCnq_vH0KztZJ7N4XT31SGo",
    ),
    "https://www.youtube.com/playlist?list=PL306mBEuEUrCnq_vH0KztZJ7N4XT31SGo",
  );
  assert.equal(
    normalizeFeaturedPlaylistUrl(
      "https://youtu.be/g3XMgp-rJn0?list=PL306mBEuEUrCnq_vH0KztZJ7N4XT31SGo",
    ),
    "https://www.youtube.com/playlist?list=PL306mBEuEUrCnq_vH0KztZJ7N4XT31SGo",
  );
});

test("아티스트 이름으로 YouTube 검색 URL을 생성한다", () => {
  assert.equal(
    getArtistYoutubeSearchUrl("잔나비"),
    "https://www.youtube.com/results?search_query=%EC%9E%94%EB%82%98%EB%B9%84",
  );
});
