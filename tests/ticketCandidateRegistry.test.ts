import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test } from "node:test";

import {
  assignTicketCandidateIds,
  loadExcludedTicketUrls,
} from "../crawler/ticketCandidateRegistry.ts";

function candidate(sourceUrl: string) {
  return {
    title: "테스트 페스티벌",
    source_url: sourceUrl,
    source_type: "test",
    discovered_at: "2026-07-23T00:00:00.000Z",
    status: "new" as const,
    reason: "신규",
  };
}

async function testDirectory(prefix: string): Promise<string> {
  const root = resolve(process.cwd(), "crawler-output", "test-temp");
  await mkdir(root, { recursive: true });
  return mkdtemp(resolve(root, prefix));
}

test("같은 URL은 실행이 달라도 같은 T-NNN 번호를 유지한다", async () => {
  const directory = await testDirectory("ticket-registry-");
  const first = await assignTicketCandidateIds([
    candidate("https://ticket.example/one"),
  ], directory);
  const second = await assignTicketCandidateIds([
    candidate("https://ticket.example/one"),
    candidate("https://ticket.example/two"),
  ], directory);
  assert.equal(first[0].candidate_id, "T-001");
  assert.equal(second[0].candidate_id, "T-001");
  assert.equal(second[1].candidate_id, "T-002");
});

test("제외 파일에서 정확한 URL만 읽는다", async () => {
  const directory = await testDirectory("ticket-exclusion-");
  await writeFile(resolve(directory, "excluded-ticket-urls.json"), JSON.stringify({
    version: 1,
    items: [{
      candidate_id: "T-001",
      source_url: "https://ticket.example/one",
      excluded_at: "2026-07-23T00:00:00.000Z",
    }],
  }), "utf8");
  const urls = await loadExcludedTicketUrls(directory);
  assert.equal(urls.has("https://ticket.example/one"), true);
  assert.equal(urls.has("https://ticket.example/two"), false);
  assert.match(
    await readFile(resolve(directory, "excluded-ticket-urls.json"), "utf8"),
    /T-001/,
  );
});
