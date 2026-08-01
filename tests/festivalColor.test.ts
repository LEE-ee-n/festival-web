import assert from "node:assert/strict";
import test from "node:test";

import {
  FESTIVAL_COLOR_CLASSES,
  getFestivalColorClass,
  isFestivalCalendarColor,
} from "../lib/festivalColor.ts";

test("축제 막대는 지정한 파스텔 5색을 순서대로 사용한다", () => {
  assert.deepEqual(FESTIVAL_COLOR_CLASSES, [
    "bg-festival-bar-pink",
    "bg-festival-bar-blue",
    "bg-festival-bar-green",
    "bg-festival-bar-purple",
    "bg-festival-bar-orange",
  ]);
});

test("축제 ID가 같으면 캘린더와 카드에서 항상 같은 색을 선택한다", () => {
  assert.equal(getFestivalColorClass(0), FESTIVAL_COLOR_CLASSES[0]);
  assert.equal(getFestivalColorClass(4), FESTIVAL_COLOR_CLASSES[4]);
  assert.equal(getFestivalColorClass(5), FESTIVAL_COLOR_CLASSES[0]);
  assert.equal(getFestivalColorClass(11), FESTIVAL_COLOR_CLASSES[1]);
});

test("관리자가 지정한 색상은 ID 기반 자동 색상보다 우선한다", () => {
  assert.equal(getFestivalColorClass(0, "purple"), "bg-festival-bar-purple");
  assert.equal(getFestivalColorClass(11, "orange"), "bg-festival-bar-orange");
});

test("DB에 저장할 수 있는 캘린더 색상만 허용한다", () => {
  assert.equal(isFestivalCalendarColor("pink"), true);
  assert.equal(isFestivalCalendarColor("orange"), true);
  assert.equal(isFestivalCalendarColor("red"), false);
  assert.equal(isFestivalCalendarColor(null), false);
});
