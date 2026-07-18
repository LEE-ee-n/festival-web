import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { runCrawlerDiscovery } from "./core/runDiscovery.ts";
import { ExampleTicketSource } from "./sources/exampleSource.ts";
import type { FetchLike } from "./sources/types.ts";

const here = dirname(fileURLToPath(import.meta.url));
const samplePath = resolve(here, "sample-html", "example-listing.html");
const sampleFetch: FetchLike = async (url) => {
  if (url !== "https://example.com/festivals") {
    return { ok: false, status: 404, text: async () => "" };
  }
  return { ok: true, status: 200, text: () => readFile(samplePath, "utf8") };
};

function readOutputArgument(): string | undefined {
  const argument = process.argv.slice(2).find((value) => value.startsWith("--output="));
  return argument?.slice("--output=".length);
}

const { report, outputPath } = await runCrawlerDiscovery({
  adapters: [new ExampleTicketSource()],
  fetchImpl: sampleFetch,
  outputPath: readOutputArgument(),
});

process.stdout.write(
  `${report.items.length}개 후보 저장 완료: ${outputPath ?? "파일 저장 안 함"}\n`,
);
