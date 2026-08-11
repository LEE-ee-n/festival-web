import assert from "node:assert/strict";
import test from "node:test";

import { firstRelation } from "../lib/supabase/relations.ts";

test("firstRelation은 단일 관계 객체를 그대로 반환한다", () => {
  const relation = { id: 1, name: "테스트" };

  assert.equal(firstRelation(relation), relation);
});

test("firstRelation은 관계 배열의 첫 항목을 반환한다", () => {
  const first = { id: 1 };

  assert.equal(firstRelation([first, { id: 2 }]), first);
});

test("firstRelation은 빈 배열과 null을 null로 정리한다", () => {
  assert.equal(firstRelation([]), null);
  assert.equal(firstRelation(null), null);
});
