import assert from "node:assert/strict";
import test from "node:test";

import { getCandidateSourceStoragePaths } from "../lib/festivals/candidateSourceAssetPaths.ts";

test("임시 수집 이미지 경로를 중복 없이 추출한다", () => {
  assert.deepEqual(
    getCandidateSourceStoragePaths([
      { name: "one.webp", type: "image/webp", storage_path: "candidate/one.webp" },
      { name: "one-copy.webp", type: "image/webp", storage_path: "candidate/one.webp" },
      { name: "external.webp", type: "image/webp", url: "https://example.com/external.webp" },
    ]),
    ["candidate/one.webp"],
  );
});
