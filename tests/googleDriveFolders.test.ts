import assert from "node:assert/strict";
import test from "node:test";

import { escapeDriveQueryValue, getOrCreateFestivalDriveFolder, normalizeDriveFolderName } from "../lib/google-drive/folders.ts";

test("Drive query values escape quotes and backslashes", () => {
  assert.equal(escapeDriveQueryValue("Rock's \\ Fest"), "Rock\\'s \\\\ Fest");
});

test("festival folder names remove line breaks and use a fallback", () => {
  assert.equal(normalizeDriveFolderName("  2026\nFest  ", "fallback"), "2026 Fest");
  assert.equal(normalizeDriveFolderName("   ", "Festival 10"), "Festival 10");
});

test("festival uploads reuse the Festibom root and create the festival folder", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const responses = [
    new Response(JSON.stringify({ files: [{ id: "root-id", name: "Festibom" }] }), { status: 200 }),
    new Response(JSON.stringify({ files: [] }), { status: 200 }),
    new Response(JSON.stringify({ id: "festival-id", name: "2026 Fest" }), { status: 200 }),
  ];
  const fetcher = (async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return responses.shift()!;
  }) as typeof fetch;

  const folder = await getOrCreateFestivalDriveFolder("token", "2026 Fest", 10, fetcher);
  assert.equal(folder.id, "festival-id");
  assert.equal(calls.length, 3);
  assert.equal(calls[2].init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[2].init?.body)), {
    name: "2026 Fest",
    mimeType: "application/vnd.google-apps.folder",
    parents: ["root-id"],
  });
});
