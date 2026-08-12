import assert from "node:assert/strict";
import test from "node:test";

import {
  parseAnalyticsConsent,
  shouldLoadAnalytics,
} from "../lib/analytics/consent.ts";

test("only supported analytics consent values are restored", () => {
  assert.equal(parseAnalyticsConsent("essential"), "essential");
  assert.equal(parseAnalyticsConsent("analytics"), "analytics");
  assert.equal(parseAnalyticsConsent("all"), null);
  assert.equal(parseAnalyticsConsent(null), null);
});

test("analytics load only after explicit permission", () => {
  assert.equal(shouldLoadAnalytics(null, "/"), false);
  assert.equal(shouldLoadAnalytics("essential", "/festivals"), false);
  assert.equal(shouldLoadAnalytics("analytics", "/festivals"), true);
});

test("admin routes never load public analytics", () => {
  assert.equal(shouldLoadAnalytics("analytics", "/admin"), false);
  assert.equal(shouldLoadAnalytics("analytics", "/admin/festivals"), false);
});
