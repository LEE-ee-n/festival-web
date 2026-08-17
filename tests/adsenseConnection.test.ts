import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const publisherId = "ca-pub-1898105658764182";

test("AdSense 사이트 확인 메타와 공용 스크립트를 유지한다", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");

  assert.match(layout, /google-adsense-account/);
  assert.match(layout, new RegExp(publisherId));
  assert.match(layout, /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/);
});

test("ads.txt에 Google 판매자 정보를 공개한다", () => {
  const adsTxt = readFileSync("public/ads.txt", "utf8").trim();

  assert.equal(
    adsTxt,
    "google.com, pub-1898105658764182, DIRECT, f08c47fec0942fa0",
  );
});
