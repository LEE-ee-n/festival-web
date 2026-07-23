import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const COMMAND = /^!티켓제외\s+(.+)$/i;
const CANDIDATE_ID = /^T-\d{3,}$/i;

function normalizeCandidateId(value) {
  return value.trim().toUpperCase();
}

export function parseTicketExclusionCommand(content) {
  const match = String(content ?? "").trim().match(COMMAND);
  if (!match) return null;
  const ids = [...new Set(
    match[1]
      .split(",")
      .map(normalizeCandidateId)
      .filter((value) => CANDIDATE_ID.test(value)),
  )];
  const invalid = match[1]
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value && !CANDIDATE_ID.test(normalizeCandidateId(value)));
  return { ids, invalid };
}

async function readJson(path, missingValue, label) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return structuredClone(missingValue);
    if (error instanceof SyntaxError) throw new Error(`${label} JSON이 손상됐습니다.`);
    throw error;
  }
}

async function atomicWrite(path, value) {
  const temporaryPath = `${path}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(value, null, 2), "utf8");
  await rename(temporaryPath, path);
}

export async function excludeTicketCandidates(input) {
  const parsedCommand = parseTicketExclusionCommand(input.content);
  if (!parsedCommand) return null;
  if (parsedCommand.ids.length === 0) {
    return {
      added: [],
      alreadyExcluded: [],
      notFound: [],
      invalid: parsedCommand.invalid,
    };
  }

  const reportDirectory = resolve(input.crawlerRoot, "reports");
  const registryPath = resolve(reportDirectory, "ticket-candidate-registry.json");
  const exclusionPath = resolve(reportDirectory, "excluded-ticket-urls.json");
  const registry = await readJson(registryPath, null, "후보 번호 파일");
  if (
    !registry
    || registry.version !== 1
    || !registry.items
    || typeof registry.items !== "object"
    || Array.isArray(registry.items)
  ) throw new Error("후보 번호 파일 형식이 올바르지 않습니다.");

  const exclusion = await readJson(
    exclusionPath,
    { version: 1, items: [] },
    "티켓 제외 목록",
  );
  if (exclusion.version !== 1 || !Array.isArray(exclusion.items)) {
    throw new Error("티켓 제외 목록 형식이 올바르지 않습니다.");
  }

  const urlById = new Map(
    Object.entries(registry.items).map(([url, id]) => [String(id).toUpperCase(), url]),
  );
  const excludedUrls = new Set(exclusion.items.map((item) => item.source_url));
  const added = [];
  const alreadyExcluded = [];
  const notFound = [];

  for (const id of parsedCommand.ids) {
    const url = urlById.get(id);
    if (!url) {
      notFound.push(id);
    } else if (excludedUrls.has(url)) {
      alreadyExcluded.push(id);
    } else {
      exclusion.items.push({
        candidate_id: id,
        source_url: url,
        excluded_at: input.now().toISOString(),
      });
      excludedUrls.add(url);
      added.push(id);
    }
  }

  if (added.length > 0) {
    await mkdir(reportDirectory, { recursive: true });
    await atomicWrite(exclusionPath, exclusion);
  }
  return { added, alreadyExcluded, notFound, invalid: parsedCommand.invalid };
}

export function formatTicketExclusionResult(result) {
  const lines = [];
  if (result.added.length > 0) lines.push(`✅ 제외 완료: ${result.added.join(", ")}`);
  if (result.alreadyExcluded.length > 0) {
    lines.push(`이미 제외됨: ${result.alreadyExcluded.join(", ")}`);
  }
  if (result.notFound.length > 0) lines.push(`번호를 찾지 못함: ${result.notFound.join(", ")}`);
  if (result.invalid.length > 0) lines.push(`형식 오류: ${result.invalid.join(", ")}`);
  if (lines.length === 0) lines.push("처리할 티켓 번호가 없습니다.");
  return lines.join("\n");
}
