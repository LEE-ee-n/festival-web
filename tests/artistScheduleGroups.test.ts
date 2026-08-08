import assert from "node:assert/strict";
import test from "node:test";

import { compareStageNames } from "../lib/festivals/artistScheduleGroups.ts";

test("숫자 부 무대는 1부부터 자연 정렬한다", () => {
  const stages = ["2부", "1부", "SPECIAL STAGE"];

  assert.deepEqual(stages.sort(compareStageNames), [
    "1부",
    "2부",
    "SPECIAL STAGE",
  ]);
});

test("숫자 부 형식이 아닌 무대끼리는 기존 순서를 유지한다", () => {
  const stages = ["TEAM PINK", "TEAM YELLOW", "SPECIAL STAGE"];

  assert.deepEqual(stages.sort(compareStageNames), [
    "TEAM PINK",
    "TEAM YELLOW",
    "SPECIAL STAGE",
  ]);
});
