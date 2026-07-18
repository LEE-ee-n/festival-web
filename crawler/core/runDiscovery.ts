import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

import type { CrawlerSourceAdapter, FetchLike } from "../sources/types.ts";
import type { CrawlerOptions, CrawlerReport, CrawledCandidate } from "../types.ts";
import { deduplicateCandidates, prepareCandidates } from "./candidateFilter.ts";

const DEFAULT_OPTIONS = {
  requestIntervalMs: 500,
  maxItemsPerSource: 200,
  timeoutMs: 15_000,
};

function positiveNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

function createFetchText(input: {
  fetchImpl: FetchLike;
  allowedOrigins: ReadonlySet<string>;
  intervalMs: number;
  timeoutMs: number;
}): (url: string) => Promise<string> {
  let previousRequestAt = 0;

  return async (urlValue: string) => {
    const url = new URL(urlValue);
    if (!input.allowedOrigins.has(url.origin)) {
      throw new Error(`허용되지 않은 도메인입니다: ${url.origin}`);
    }

    const waitMs = Math.max(0, previousRequestAt + input.intervalMs - Date.now());
    if (waitMs > 0) await new Promise((resolveDelay) => setTimeout(resolveDelay, waitMs));
    previousRequestAt = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs);
    try {
      const response = await input.fetchImpl(url.toString(), { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  };
}

export async function runCrawlerDiscovery(input: {
  adapters: CrawlerSourceAdapter[];
  fetchImpl: FetchLike;
  options?: CrawlerOptions;
  outputPath?: string;
  dryRun?: boolean;
}): Promise<{ report: CrawlerReport; outputPath?: string }> {
  const now = input.options?.now ?? (() => new Date());
  const generatedAt = now().toISOString();
  const intervalMs = positiveNumber(
    input.options?.requestIntervalMs,
    DEFAULT_OPTIONS.requestIntervalMs,
  );
  const maxItems = positiveNumber(
    input.options?.maxItemsPerSource,
    DEFAULT_OPTIONS.maxItemsPerSource,
  );
  const timeoutMs = positiveNumber(input.options?.timeoutMs, DEFAULT_OPTIONS.timeoutMs);
  const collected: CrawledCandidate[] = [];
  const errors: CrawlerReport["errors"] = [];

  for (const adapter of input.adapters) {
    try {
      const allowedOrigins = new Set(
        adapter.allowedOrigins.map((value) => new URL(value).origin),
      );
      const fetchText = createFetchText({
        fetchImpl: input.fetchImpl,
        allowedOrigins,
        intervalMs,
        timeoutMs,
      });
      const rawItems = await adapter.discover({ fetchText, maxItems });
      collected.push(
        ...prepareCandidates({
          items: rawItems,
          sourceType: adapter.sourceType,
          baseUrl: adapter.listingUrl,
          allowedOrigins: adapter.allowedOrigins,
          discoveredAt: generatedAt,
          maxItems,
        }),
      );
    } catch (error) {
      errors.push({
        source_type: adapter.sourceType,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const report: CrawlerReport = {
    generated_at: generatedAt,
    source_type: "crawler_discovery",
    items: deduplicateCandidates(collected),
    errors,
  };

  if (input.dryRun) return { report };
  const outputRoot = resolve(process.cwd(), "crawler-output");
  const outputPath = resolve(input.outputPath ?? resolve(outputRoot, "discovery.json"));
  const relativePath = relative(outputRoot, outputPath);
  if (!relativePath || relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error("크롤러 결과는 crawler-output 폴더 안에만 저장할 수 있습니다.");
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2), "utf8");
  return { report, outputPath };
}
