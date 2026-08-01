import assert from "node:assert/strict";
import test from "node:test";

import {
  getCalendarGestureAxis,
  getCalendarSwipeDirection,
  shouldCaptureCalendarGesture,
} from "../lib/calendarSwipe.ts";

test("10px보다 짧은 움직임은 방향을 확정하지 않는다", () => {
  assert.equal(getCalendarGestureAxis(9, 3), null);
});

test("가로 이동이 세로 이동의 110% 이상이면 가로로 잠근다", () => {
  assert.equal(getCalendarGestureAxis(44, 40), "horizontal");
});

test("가로와 세로가 비슷하면 방향 확정을 보류한다", () => {
  assert.equal(getCalendarGestureAxis(40, 40), null);
});

test("세로 이동이 110% 이상 우세하면 페이지 스크롤로 남긴다", () => {
  assert.equal(getCalendarGestureAxis(40, 44), "vertical");
});

test("왼쪽 45px 스와이프는 다음 달로 이동한다", () => {
  assert.equal(
    getCalendarSwipeDirection(-45, "horizontal"),
    "next",
  );
});

test("오른쪽 45px 스와이프는 이전 달로 이동한다", () => {
  assert.equal(
    getCalendarSwipeDirection(45, "horizontal"),
    "previous",
  );
});

test("가로 방향이어도 45px 미만이면 월을 이동하지 않는다", () => {
  assert.equal(getCalendarSwipeDirection(44, "horizontal"), null);
});

test("포인터 캡처는 가로 방향이 확정된 경우에만 사용한다", () => {
  assert.equal(shouldCaptureCalendarGesture("horizontal"), true);
  assert.equal(shouldCaptureCalendarGesture("vertical"), false);
  assert.equal(shouldCaptureCalendarGesture(null), false);
});
