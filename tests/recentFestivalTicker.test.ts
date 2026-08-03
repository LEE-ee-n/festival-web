import assert from "node:assert/strict";
import test from "node:test";

import {
  getRecentFestivalTickerDismissedUntil,
  RECENT_FESTIVAL_TICKER_DISMISS_MS,
  shouldHideRecentFestivalTicker,
} from "../lib/recentFestivalTicker.ts";

test("최근 등록 알림 닫기는 현재 시각부터 24시간 유지된다", () => {
  const nowMs = Date.UTC(2026, 7, 3, 0, 0, 0);

  assert.equal(
    getRecentFestivalTickerDismissedUntil(nowMs),
    nowMs + RECENT_FESTIVAL_TICKER_DISMISS_MS,
  );
});

test("저장된 만료 시각 전에는 최근 등록 알림을 숨긴다", () => {
  const nowMs = 1000;

  assert.equal(shouldHideRecentFestivalTicker("1001", nowMs), true);
  assert.equal(shouldHideRecentFestivalTicker("1000", nowMs), false);
  assert.equal(shouldHideRecentFestivalTicker("999", nowMs), false);
});

test("비어 있거나 잘못된 저장값은 최근 등록 알림을 숨기지 않는다", () => {
  assert.equal(shouldHideRecentFestivalTicker(null, 1000), false);
  assert.equal(shouldHideRecentFestivalTicker("", 1000), false);
  assert.equal(shouldHideRecentFestivalTicker("invalid", 1000), false);
});
