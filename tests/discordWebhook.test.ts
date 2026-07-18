import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildDiscoveryWebhookContent,
  sendDiscoveryWebhook,
} from "../crawler/notifications/discordWebhook.ts";

const notification = {
  date: "260718",
  site: "NOL",
  total: 20,
  success: 17,
  failed: 3,
  outputFile: "260718-NOL-discovery.json",
};

test("Discord 알림에 날짜·사이트·처리 개수를 표시한다", () => {
  const content = buildDiscoveryWebhookContent(notification);
  assert.match(content, /260718-NOL/);
  assert.match(content, /총 20개/);
  assert.match(content, /성공 17개/);
  assert.match(content, /제외·실패 3개/);
});

test("Discord 웹훅은 멘션을 막고 전송 확인을 기다린다", async () => {
  let requestedUrl = "";
  let requestBody = "";
  await sendDiscoveryWebhook({
    webhookUrl: "https://discord.com/api/webhooks/123/token",
    notification,
    fetchImpl: (async (input, init) => {
      requestedUrl = String(input);
      requestBody = String(init?.body);
      return new Response("{}", { status: 200 });
    }) as typeof fetch,
  });

  assert.match(requestedUrl, /wait=true/);
  assert.deepEqual(JSON.parse(requestBody).allowed_mentions, { parse: [] });
});

test("Discord가 아닌 웹훅 주소를 거부한다", async () => {
  await assert.rejects(
    sendDiscoveryWebhook({
      webhookUrl: "https://evil.example/api/webhooks/123/token",
      notification,
      fetchImpl: fetch,
    }),
    /Discord 웹훅 URL/,
  );
});
