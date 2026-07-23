import { readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { ScheduledDiscoveryItem } from "./types.ts";

type CandidateRegistryFile = {
  version: 1;
  next_number: number;
  items: Record<string, string>;
};

type ExcludedTicketUrl = {
  candidate_id: string;
  source_url: string;
  excluded_at: string;
};

type ExclusionFile = {
  version: 1;
  items: ExcludedTicketUrl[];
};

const EMPTY_REGISTRY: CandidateRegistryFile = {
  version: 1,
  next_number: 1,
  items: {},
};

async function readRegistry(path: string): Promise<CandidateRegistryFile> {
  try {
    const parsed = JSON.parse(await readFile(path, "utf8")) as CandidateRegistryFile;
    if (
      parsed.version !== 1
      || !Number.isInteger(parsed.next_number)
      || parsed.next_number < 1
      || !parsed.items
      || typeof parsed.items !== "object"
      || Array.isArray(parsed.items)
    ) throw new Error("후보 번호 파일 형식이 올바르지 않습니다.");
    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error("후보 번호 파일 JSON이 손상됐습니다.");
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return structuredClone(EMPTY_REGISTRY);
    }
    throw error;
  }
}

async function atomicWrite(path: string, value: object): Promise<void> {
  const temporaryPath = `${path}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(value, null, 2), "utf8");
  await rename(temporaryPath, path);
}

function formatCandidateId(number: number): string {
  return `T-${String(number).padStart(3, "0")}`;
}

export async function assignTicketCandidateIds(
  items: ScheduledDiscoveryItem[],
  reportDirectory: string,
): Promise<ScheduledDiscoveryItem[]> {
  const path = resolve(reportDirectory, "ticket-candidate-registry.json");
  const registry = await readRegistry(path);
  let changed = false;
  const assigned = items.map((item) => {
    if (item.status === "duplicate") return item;
    let candidateId = registry.items[item.source_url];
    if (!candidateId) {
      candidateId = formatCandidateId(registry.next_number);
      registry.next_number += 1;
      registry.items[item.source_url] = candidateId;
      changed = true;
    }
    return { ...item, candidate_id: candidateId };
  });
  if (changed) await atomicWrite(path, registry);
  return assigned;
}

export async function loadExcludedTicketUrls(reportDirectory: string): Promise<Set<string>> {
  const path = resolve(reportDirectory, "excluded-ticket-urls.json");
  try {
    const parsed = JSON.parse(await readFile(path, "utf8")) as ExclusionFile;
    if (parsed.version !== 1 || !Array.isArray(parsed.items)) {
      throw new Error("티켓 제외 목록 형식이 올바르지 않습니다.");
    }
    const urls = parsed.items.map((item) => {
      if (
        typeof item.candidate_id !== "string"
        || typeof item.source_url !== "string"
        || typeof item.excluded_at !== "string"
      ) throw new Error("티켓 제외 항목 형식이 올바르지 않습니다.");
      return item.source_url;
    });
    return new Set(urls);
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error("티켓 제외 목록 JSON이 손상됐습니다.");
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return new Set();
    throw error;
  }
}
