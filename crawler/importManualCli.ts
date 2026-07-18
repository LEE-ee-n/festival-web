import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { importNolManualCandidates } from "./importers/nolManualImport.ts";
import { findLatestNolTicketInput } from "./importers/findLatestNolInput.ts";
import type { CrawlerReport } from "./types.ts";

const inputArgument = process.argv.slice(2).find((value) => value.startsWith("--input="));
const usesLatestFile = process.argv.slice(2).includes("--latest");
const inputPath = usesLatestFile
  ? await findLatestNolTicketInput()
  : inputArgument?.slice("--input=".length);
if (!inputPath) {
  throw new Error("사용법: npm run crawler:import:nol -- --latest 또는 --input=파일경로");
}

const generatedAt = new Date().toISOString();
const raw = JSON.parse(await readFile(resolve(inputPath), "utf8")) as unknown;
const report: CrawlerReport = {
  generated_at: generatedAt,
  source_type: "crawler_discovery",
  items: importNolManualCandidates(raw, generatedAt),
  errors: [],
};
const outputDirectory = resolve(process.cwd(), "crawler-output");
const outputPath = resolve(outputDirectory, "nol-discovery.json");
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, JSON.stringify(report, null, 2), "utf8");
process.stdout.write(`사용한 원본: ${resolve(inputPath)}\n`);
process.stdout.write(`${report.items.length}개 놀티켓 후보 저장 완료: ${outputPath}\n`);
