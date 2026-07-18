import assert from "node:assert/strict";
import test from "node:test";

import { applyNormalizedArtistMatches } from "../lib/artists/applyNormalizedArtistMatches.ts";
import type { FestivalDraftJson } from "../lib/types.ts";

function createDraft(normalizedName: string): FestivalDraftJson {
  return {
    festival: {
      name: "테스트 축제",
      normalized_name: "testfestival",
      start_date: "2026-08-01",
      end_date: "2026-08-02",
    },
    artists: [
      {
        input_name: "TEST ARTIST",
        display_name: "TEST ARTIST",
        normalized_name: normalizedName,
        aliases: [],
      },
    ],
    tickets: [],
  };
}

test("normalized_name이 같으면 기존 아티스트로 자동 연결한다", () => {
  const draft = applyNormalizedArtistMatches(createDraft("testartist"), [
    { id: 77, name: "Test Artist", normalized_name: "testartist" },
  ]);

  assert.equal(draft.artists[0].match_status, "matched");
  assert.equal(draft.artists[0].matched_artist_id, 77);
  assert.equal(draft.artists[0].display_name, "Test Artist");
});

test("같은 normalized_name이 없으면 신규 아티스트로 분류한다", () => {
  const draft = applyNormalizedArtistMatches(createDraft("newartist"), []);

  assert.equal(draft.artists[0].match_status, "new");
  assert.equal(draft.artists[0].matched_artist_id, null);
});
