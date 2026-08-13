import assert from "node:assert/strict";
import test from "node:test";

import {
  contentSecurityPolicyReportOnly,
  securityHeaders,
} from "../next.config.mjs";

function getHeader(name: string) {
  return securityHeaders.find((header) => header.key === name)?.value;
}

test("security headers include report-only CSP and HSTS", () => {
  assert.equal(
    getHeader("Content-Security-Policy-Report-Only"),
    contentSecurityPolicyReportOnly,
  );
  assert.equal(
    getHeader("Strict-Transport-Security"),
    "max-age=31536000; includeSubDomains",
  );
});

test("report-only CSP blocks high-risk defaults and declares used providers", () => {
  assert.match(contentSecurityPolicyReportOnly, /default-src 'self'/);
  assert.match(contentSecurityPolicyReportOnly, /object-src 'none'/);
  assert.match(contentSecurityPolicyReportOnly, /frame-ancestors 'none'/);
  assert.match(contentSecurityPolicyReportOnly, /https:\/\/\*\.supabase\.co/);
  assert.match(contentSecurityPolicyReportOnly, /www\.googletagmanager\.com/);
  assert.match(contentSecurityPolicyReportOnly, /www\.clarity\.ms/);
  assert.match(contentSecurityPolicyReportOnly, /\*\.ingest\.sentry\.io/);
  assert.match(contentSecurityPolicyReportOnly, /\*\.ingest\.us\.sentry\.io/);
});

test("security header names are not duplicated", () => {
  const names = securityHeaders.map((header) => header.key);
  assert.equal(new Set(names).size, names.length);
});

test("security headers isolate tabs without breaking OAuth popups", () => {
  assert.equal(
    getHeader("Cross-Origin-Opener-Policy"),
    "same-origin-allow-popups",
  );
  assert.equal(getHeader("X-Permitted-Cross-Domain-Policies"), "none");
});
