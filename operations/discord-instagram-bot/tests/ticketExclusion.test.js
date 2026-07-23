import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test } from "node:test";

import {
  excludeTicketCandidates,
  formatTicketExclusionResult,
  parseTicketExclusionCommand,
} from "../src/ticketExclusion.js";

async function testCrawlerRoot() {
  const root = resolve(process.cwd(), "work", "test-temp");
  await mkdir(root, { recursive: true });
  return mkdtemp(resolve(root, "ticket-exclusion-"));
}

test("쉼표로 구분한 티켓 번호를 대문자와 중복 제거 형태로 읽는다", () => {
  assert.deepEqual(
    parseTicketExclusionCommand("!티켓제외 t-001, T-002, T-001"),
    { ids: ["T-001", "T-002"], invalid: [] },
  );
});

test("여러 번호의 정확한 URL만 제외하고 미확인 번호를 구분한다", async () => {
  const crawlerRoot = await testCrawlerRoot();
  const reports = resolve(crawlerRoot, "reports");
  await mkdir(reports, { recursive: true });
  await writeFile(resolve(reports, "ticket-candidate-registry.json"), JSON.stringify({
    version: 1,
    next_number: 3,
    items: {
      "https://ticket.example/one": "T-001",
      "https://ticket.example/two": "T-002",
    },
  }), "utf8");

  const result = await excludeTicketCandidates({
    content: "!티켓제외 T-001, T-999",
    crawlerRoot,
    now: () => new Date("2026-07-23T00:00:00.000Z"),
  });
  assert.deepEqual(result.added, ["T-001"]);
  assert.deepEqual(result.notFound, ["T-999"]);
  assert.match(formatTicketExclusionResult(result), /제외 완료: T-001/);

  const saved = JSON.parse(await readFile(
    resolve(reports, "excluded-ticket-urls.json"),
    "utf8",
  ));
  assert.deepEqual(saved.items.map((item) => item.source_url), [
    "https://ticket.example/one",
  ]);

  const repeated = await excludeTicketCandidates({
    content: "!티켓제외 T-001",
    crawlerRoot,
    now: () => new Date("2026-07-23T01:00:00.000Z"),
  });
  assert.deepEqual(repeated.alreadyExcluded, ["T-001"]);
});

test("명령이 아니면 처리하지 않고 잘못된 형식은 분리한다", () => {
  assert.equal(parseTicketExclusionCommand("https://instagram.com/p/test"), null);
  assert.deepEqual(
    parseTicketExclusionCommand("!티켓제외 T-001, 잘못됨"),
    { ids: ["T-001"], invalid: ["잘못됨"] },
  );
});
