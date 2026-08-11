import assert from "node:assert/strict";
import test from "node:test";

import {
  hasConfirmedSeparateFestival,
  reviewFestivalDuplicates,
  type FestivalDuplicateReference,
} from "../lib/festivals/festivalDuplicateReview.ts";

const existing: FestivalDuplicateReference = {
  id: 7,
  name: "2026 경기인디",
  normalized_name: "gyongyindi",
  search_aliases: null,
  start_date: "2026-09-01",
  end_date: "2026-09-01",
};

test("같은 연도의 포함 이름은 별도 신규 확인 전까지 차단한다", () => {
  const review = reviewFestivalDuplicates({
    name: "2026 경기인디 뮤직스트리트",
    normalized_name: "gyongyindimusicstreet",
    start_date: "2026-10-01",
    end_date: "2026-10-01",
  }, [existing]);

  assert.equal(review.possible[0]?.id, 7);
  assert.equal(hasConfirmedSeparateFestival(review, undefined), false);
  assert.equal(hasConfirmedSeparateFestival(review, {
    fingerprint: review.fingerprint,
    decision: "create_new",
    reviewed_festival_ids: [7],
  }), true);
});

test("이름이나 날짜가 바뀌면 이전 신규 확인을 무효화한다", () => {
  const initial = reviewFestivalDuplicates({
    name: "2026 경기인디 뮤직스트리트",
    normalized_name: "gyongyindimusicstreet",
    start_date: "2026-10-01",
    end_date: "2026-10-01",
  }, [existing]);
  const changed = reviewFestivalDuplicates({
    name: "2026 경기인디 뮤직스트리트 변경",
    normalized_name: "gyongyindimusicstreet",
    start_date: "2026-10-01",
    end_date: "2026-10-01",
  }, [existing]);

  assert.equal(hasConfirmedSeparateFestival(changed, {
    fingerprint: initial.fingerprint,
    decision: "create_new",
    reviewed_festival_ids: [7],
  }), false);
});
