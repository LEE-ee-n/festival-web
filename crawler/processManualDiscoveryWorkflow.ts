import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

import { buildTicketDiscoveryReport } from "./compare/buildTicketDiscoveryReport.ts";
import { loadTicketDiscoveryReferences } from "./compare/loadTicketDiscoveryReferences.ts";
import { findLatestNolTicketInput } from "./importers/findLatestNolInput.ts";
import { findLatestTicketlinkInput } from "./importers/findLatestTicketlinkInput.ts";
import { findLatestYes24Input } from "./importers/findLatestYes24Input.ts";
import { importNolManualCandidates } from "./importers/nolManualImport.ts";
import { importTicketlinkManualCandidates } from "./importers/ticketlinkManualImport.ts";
import { importYes24ManualCandidates } from "./importers/yes24ManualImport.ts";
import {
  buildScheduledDiscoveryMessages,
  readDiscordWebhookUrl,
  sendDiscordMessages,
} from "./notifications/discordWebhook.ts";
import {
  assignTicketCandidateIds,
  loadExcludedTicketUrls,
} from "./ticketCandidateRegistry.ts";
import type { CrawledCandidate, ScheduledSiteResult } from "./types.ts";
import { collectionDateFromFilename, formatCompactLocalDate } from "./workflowPaths.ts";

const FESTIVAL_TITLE = /(페스티벌|포레스티벌|페스타|festival|\bfes(?:t(?:a)?)?\b|waterbomb|워터밤)/i;

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} environment variable is required.`);
  return value;
}

function errorMessage(error: object | string | number | boolean | null): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as { message?: string; code?: string; details?: string; hint?: string };
    return [
      record.message,
      record.code ? `code=${record.code}` : "",
      record.details,
      record.hint,
    ].filter(Boolean).join(" | ") || JSON.stringify(error);
  }
  return String(error);
}

function readableError(error: object | string | number | boolean | null): string {
  return errorMessage(error).replace(/[\r\n]+/g, " ");
}

const generatedAt = new Date().toISOString();
const rootArgument = process.env.FESTIVAL_CRAWLER_ROOT?.trim();
if (!rootArgument) throw new Error("FESTIVAL_CRAWLER_ROOT environment variable is required.");
const root = resolve(rootArgument);
const crawlDirectory = resolve(root, "crawl");
const discoveryDirectory = resolve(root, "discovery");
const reportDirectory = resolve(root, "reports");
await Promise.all([
  mkdir(crawlDirectory, { recursive: true }),
  mkdir(discoveryDirectory, { recursive: true }),
  mkdir(reportDirectory, { recursive: true }),
]);

type ManualSite = {
  site: "NOL" | "TICKETLINK" | "YES24";
  find(): Promise<string>;
  importItems(value: string): CrawledCandidate[];
};

const sites: ManualSite[] = [
  {
    site: "NOL",
    find: () => findLatestNolTicketInput([crawlDirectory]),
    importItems: (value) =>
      importNolManualCandidates(JSON.parse(value), generatedAt, {
        allowMissingConcertCategory: true,
      })
        .filter((item) => FESTIVAL_TITLE.test(item.title.normalize("NFKC")))
        .map((item) => ({ ...item, source_type: "nol_ticket_manual" })),
  },
  {
    site: "TICKETLINK",
    find: () => findLatestTicketlinkInput([crawlDirectory]),
    importItems: (value) => importTicketlinkManualCandidates(JSON.parse(value), generatedAt),
  },
  {
    site: "YES24",
    find: () => findLatestYes24Input([crawlDirectory]),
    importItems: (value) => importYes24ManualCandidates(JSON.parse(value), generatedAt),
  },
];

const today = formatCompactLocalDate(new Date());
const collected: CrawledCandidate[] = [];
const siteResults: ScheduledSiteResult[] = [];

for (const site of sites) {
  const inputPath = await site.find();
  const inputDate = collectionDateFromFilename(basename(inputPath), new Date(0));
  if (inputDate !== today) {
    throw new Error(`${site.site} latest JSON is not from today: ${basename(inputPath)}`);
  }
  const archivedPath = resolve(crawlDirectory, `${today}-${site.site}-crwal.json`);
  if (resolve(inputPath) !== archivedPath) await copyFile(inputPath, archivedPath);
  const rawText = await readFile(archivedPath, "utf8");
  const rawValue = JSON.parse(rawText);
  if (!Array.isArray(rawValue)) throw new Error(`${site.site} input JSON must be an array.`);
  const items = site.importItems(rawText);
  const discoveryPath = resolve(discoveryDirectory, `${today}-${site.site}-discovery.json`);
  await writeFile(discoveryPath, JSON.stringify({
    generated_at: generatedAt,
    source_type: "crawler_discovery",
    items,
    errors: [],
  }, null, 2), "utf8");
  collected.push(...items);
  siteResults.push({
    site: site.site,
    listing_url: archivedPath,
    collected: rawValue.length,
    accepted: items.length,
  });
}

let references;
try {
  references = await loadTicketDiscoveryReferences({
    url: requiredEnvironment("SUPABASE_URL"),
    anonKey: requiredEnvironment("SUPABASE_ANON_KEY"),
    email: requiredEnvironment("SUPABASE_BOT_EMAIL"),
    password: requiredEnvironment("SUPABASE_BOT_PASSWORD"),
  });
} catch (error) {
  const message = error === null
    || typeof error === "object"
    || typeof error === "string"
    || typeof error === "number"
    || typeof error === "boolean"
    ? readableError(error)
    : "Unrecognized database error";
  throw new Error(`Database comparison stopped: ${message}`);
}

const excludedUrls = await loadExcludedTicketUrls(reportDirectory);
const baseReport = buildTicketDiscoveryReport({
  generatedAt,
  items: collected.filter((item) => !excludedUrls.has(item.source_url)),
  sites: siteResults,
  references,
});
const report = {
  ...baseReport,
  items: await assignTicketCandidateIds(baseReport.items, reportDirectory),
};
const reportPath = resolve(reportDirectory, `${today}-ticket-discovery.json`);
await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");

const reportableItems = report.items.filter((item) => item.status !== "duplicate");
const webhookUrl = await readDiscordWebhookUrl(
  process.env.DISCORD_WEBHOOK_FILE?.trim() || resolve(root, "discord-webhook-url.txt"),
);
await sendDiscordMessages({
  webhookUrl,
  messages: buildScheduledDiscoveryMessages({
    generatedAt,
    sites: report.sites,
    items: reportableItems,
  }),
});

process.stdout.write(`Report: ${reportPath}\n`);
process.stdout.write(`Compared ${report.items.length}; reported ${reportableItems.length}.\n`);
