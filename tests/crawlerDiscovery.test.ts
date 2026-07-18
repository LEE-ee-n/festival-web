import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { deduplicateCandidates, prepareCandidates } from "../crawler/core/candidateFilter.ts";
import { runCrawlerDiscovery } from "../crawler/core/runDiscovery.ts";
import { ExampleTicketSource } from "../crawler/sources/exampleSource.ts";
import type { CrawlerSourceAdapter, FetchLike } from "../crawler/sources/types.ts";
import type { CrawledCandidate } from "../crawler/types.ts";

const fixedTime = "2026-07-18T00:00:00.000Z";
const samplePath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "crawler", "sample-html", "example-listing.html");
const sampleFetch: FetchLike = async (url) => ({
  ok: url === "https://example.com/festivals",
  status: url === "https://example.com/festivals" ? 200 : 404,
  text: () => readFile(samplePath, "utf8"),
});

test("상대 URL 변환, 빈 제목·잘못된 URL·다른 도메인 제외", () => {
  const items = prepareCandidates({
    items: [
      { title: "정상 축제", source_url: "/festival/1" },
      { title: "", source_url: "/festival/2" },
      { title: "외부 링크", source_url: "https://evil.example/festival/3" },
      { title: "잘못된 링크", source_url: "http://" },
    ],
    sourceType: "test",
    baseUrl: "https://tickets.example/list",
    allowedOrigins: ["https://tickets.example"],
    discoveredAt: fixedTime,
    maxItems: 10,
  });
  assert.deepEqual(items.map((item) => item.source_url), ["https://tickets.example/festival/1"]);
});

test("동일 URL과 정규화 제목 중복 제거 및 안정 정렬", () => {
  const base: CrawledCandidate[] = [
    { title: "Bravo Festival", source_url: "https://a.example/2", source_type: "a", discovered_at: fixedTime },
    { title: "alpha festival", source_url: "https://a.example/1", source_type: "a", discovered_at: fixedTime },
    { title: "ALPHA-FESTIVAL", source_url: "https://a.example/3", source_type: "a", discovered_at: fixedTime },
    { title: "다른 제목", source_url: "https://a.example/2", source_type: "a", discovered_at: fixedTime },
  ];
  const first = deduplicateCandidates(base);
  const second = deduplicateCandidates([...base].reverse());
  assert.deepEqual(first, second);
  assert.deepEqual(first.map((item) => item.title), ["alpha festival", "Bravo Festival"]);
});

test("최대 수집 개수를 공통 계층에서 강제", () => {
  const items = prepareCandidates({
    items: Array.from({ length: 5 }, (_, index) => ({ title: `축제 ${index}`, source_url: `/festival/${index}` })),
    sourceType: "test",
    baseUrl: "https://tickets.example/list",
    allowedOrigins: ["https://tickets.example"],
    discoveredAt: fixedTime,
    maxItems: 2,
  });
  assert.equal(items.length, 2);
});

test("샘플 HTML 수집 결과가 정상 JSON 형태", async () => {
  const { report } = await runCrawlerDiscovery({
    adapters: [new ExampleTicketSource()],
    fetchImpl: sampleFetch,
    options: { requestIntervalMs: 0, now: () => new Date(fixedTime) },
    dryRun: true,
  });
  assert.equal(report.items.length, 2);
  assert.equal(report.errors.length, 0);
  assert.equal(report.items[0].discovered_at, fixedTime);
  assert.ok(report.items.every((item) => item.source_url.startsWith("https://example.com/")));
});

test("한 사이트 실패 후 다음 사이트 수집 계속", async () => {
  const broken: CrawlerSourceAdapter = {
    sourceType: "broken",
    listingUrl: "https://broken.example/list",
    allowedOrigins: ["https://broken.example"],
    discover: async ({ fetchText }) => { await fetchText("https://broken.example/list"); return []; },
  };
  const fetchImpl: FetchLike = async (url) => {
    if (url.startsWith("https://broken.example")) throw new Error("수집 실패");
    return sampleFetch(url);
  };
  const { report } = await runCrawlerDiscovery({
    adapters: [broken, new ExampleTicketSource()],
    fetchImpl,
    options: { requestIntervalMs: 0, now: () => new Date(fixedTime) },
    dryRun: true,
  });
  assert.equal(report.errors.length, 1);
  assert.equal(report.errors[0].source_type, "broken");
  assert.equal(report.items.length, 2);
});

test("허용하지 않은 도메인은 요청 전 차단", async () => {
  let requestCount = 0;
  const adapter: CrawlerSourceAdapter = {
    sourceType: "domain_guard",
    listingUrl: "https://safe.example/list",
    allowedOrigins: ["https://safe.example"],
    discover: async ({ fetchText }) => { await fetchText("https://evil.example/list"); return []; },
  };
  const { report } = await runCrawlerDiscovery({
    adapters: [adapter],
    fetchImpl: async () => { requestCount += 1; return { ok: true, status: 200, text: async () => "" }; },
    dryRun: true,
  });
  assert.equal(requestCount, 0);
  assert.match(report.errors[0].message, /허용되지 않은 도메인/);
});

test("고정 입력과 시각이면 전체 결과가 동일", async () => {
  const input = {
    adapters: [new ExampleTicketSource()],
    fetchImpl: sampleFetch,
    options: { requestIntervalMs: 0, now: () => new Date(fixedTime) },
    dryRun: true as const,
  };
  const first = await runCrawlerDiscovery(input);
  const second = await runCrawlerDiscovery(input);
  assert.deepEqual(first.report, second.report);
});

test("crawler-output 밖의 파일 저장을 거부", async () => {
  await assert.rejects(
    runCrawlerDiscovery({
      adapters: [new ExampleTicketSource()],
      fetchImpl: sampleFetch,
      options: { requestIntervalMs: 0 },
      outputPath: "outside-crawler-output.json",
    }),
    /crawler-output 폴더 안/,
  );
});
