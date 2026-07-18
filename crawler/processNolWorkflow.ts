import { copyFile, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { basename, dirname, resolve } from "node:path";

import { findLatestNolTicketInput } from "./importers/findLatestNolInput.ts";
import { importNolManualCandidates } from "./importers/nolManualImport.ts";
import { notifyDiscoveryFromFile } from "./notifications/discordWebhook.ts";
import type { CrawlerReport } from "./types.ts";
import { collectionDateFromFilename } from "./workflowPaths.ts";

function argumentValue(name: string): string | undefined {
  return process.argv.slice(2).find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

const rootArgument = argumentValue("--root");
if (!rootArgument) throw new Error("--root=festival-crwaler 폴더 경로가 필요합니다.");

const root = resolve(rootArgument);
const crawlDirectory = resolve(root, "crawl");
const discoveryDirectory = resolve(root, "discovery");
await mkdir(crawlDirectory, { recursive: true });
await mkdir(discoveryDirectory, { recursive: true });

const inputPath = await findLatestNolTicketInput([crawlDirectory]);
const date = collectionDateFromFilename(basename(inputPath), new Date());
const archivedInputPath = resolve(crawlDirectory, `${date}-NOL-crwal.json`);
const outputPath = resolve(discoveryDirectory, `${date}-NOL-discovery.json`);
const generatedAt = new Date().toISOString();
const raw = JSON.parse(await readFile(inputPath, "utf8")) as unknown;
const report: CrawlerReport = {
  generated_at: generatedAt,
  source_type: "crawler_discovery",
  items: importNolManualCandidates(raw, generatedAt),
  errors: [],
};
const totalCount = Array.isArray(raw) ? raw.length : 0;

if (resolve(inputPath) !== archivedInputPath) {
  await copyFile(inputPath, archivedInputPath);
}
await writeFile(outputPath, JSON.stringify(report, null, 2), "utf8");
const countPath = resolve(root, "last-nol-count.txt");
await writeFile(countPath, String(report.items.length), "utf8");
if (resolve(inputPath) !== archivedInputPath && dirname(resolve(inputPath)) !== crawlDirectory) {
  await unlink(inputPath);
}

process.stdout.write(`원본 저장: ${archivedInputPath}\n`);
process.stdout.write(`정리 결과: ${outputPath}\n`);
process.stdout.write(`${report.items.length}개 놀티켓 후보를 정리했습니다.\n`);

await notifyDiscoveryFromFile({
  webhookFile: argumentValue("--webhook-file") ?? resolve(root, "discord-webhook-url.txt"),
  notification: {
    date,
    site: "NOL",
    total: totalCount,
    success: report.items.length,
    failed: Math.max(0, totalCount - report.items.length),
    outputFile: basename(outputPath),
  },
});

if (process.argv.includes("--open")) {
  spawn("notepad.exe", [outputPath], { detached: true, stdio: "ignore" }).unref();
}
