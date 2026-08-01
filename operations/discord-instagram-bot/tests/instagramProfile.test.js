import assert from "node:assert/strict";
import test from "node:test";

import {
  findInstagramProfileUrl,
  normalizeInstagramProfileUrl,
} from "../src/instagramProfile.js";

test("실제 게시물 작성자 링크를 공식 프로필 URL로 정규화한다", () => {
  assert.equal(
    normalizeInstagramProfileUrl(
      "/pajucf/?e=7f017825-daf2-4fe5-8c00-26917eaec063&g=5",
    ),
    "https://www.instagram.com/pajucf/",
  );
});

test("작성자 프로필 이미지가 일치하는 계정 링크를 우선한다", () => {
  assert.equal(findInstagramProfileUrl([
    {
      href: "/commenter/",
      text: "commenter",
      visible: true,
      top: 400,
      hasMatchingProfileImage: false,
    },
    {
      href: "/pajucf/?e=82ae9440-d126-4f7b-8de6-7ab37f5d97a4&g=5",
      text: "pajucf",
      visible: true,
      top: 80,
      hasMatchingProfileImage: true,
    },
  ]), "https://www.instagram.com/pajucf/");
});

test("게시물·탐색·외부 링크와 표시명이 다른 계정을 거부한다", () => {
  [
    "https://www.instagram.com/p/ABC123/",
    "https://www.instagram.com/reel/ABC123/",
    "https://www.instagram.com/explore/",
    "https://example.com/pajucf/",
  ].forEach((value) => assert.equal(normalizeInstagramProfileUrl(value), ""));

  assert.equal(findInstagramProfileUrl([
    { href: "/pajucf/", text: "different", visible: true, top: 1 },
  ]), "");
});
