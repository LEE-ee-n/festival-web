import { readFile } from "node:fs/promises";

export type DiscoveryNotification = {
  date: string;
  site: string;
  total: number;
  success: number;
  failed: number;
  outputFile: string;
};

export function buildDiscoveryWebhookContent(input: DiscoveryNotification) {
  return [
    `📥 **${input.date}-${input.site} 티켓 정리 완료**`,
    `총 ${input.total}개`,
    `성공 ${input.success}개`,
    `제외·실패 ${input.failed}개`,
    `파일: ${input.outputFile}`,
  ].join("\n");
}

function validateDiscordWebhookUrl(value: string) {
  const url = new URL(value);
  const isDiscordHost = url.hostname === "discord.com" || url.hostname.endsWith(".discord.com");
  if (url.protocol !== "https:" || !isDiscordHost || !url.pathname.startsWith("/api/webhooks/")) {
    throw new Error("Discord 웹훅 URL 형식이 올바르지 않습니다.");
  }
  return url;
}

export async function readDiscordWebhookUrl(path: string) {
  const value = (await readFile(path, "utf8")).trim();
  if (!value) throw new Error("Discord 웹훅 URL 파일이 비어 있습니다.");
  return validateDiscordWebhookUrl(value).toString();
}

export async function sendDiscoveryWebhook(input: {
  webhookUrl: string;
  notification: DiscoveryNotification;
  fetchImpl?: typeof fetch;
}) {
  const webhookUrl = validateDiscordWebhookUrl(input.webhookUrl);
  webhookUrl.searchParams.set("wait", "true");
  const response = await (input.fetchImpl ?? fetch)(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      content: buildDiscoveryWebhookContent(input.notification),
      allowed_mentions: { parse: [] },
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Discord 웹훅 전송 실패: HTTP ${response.status}`);
}

export async function notifyDiscoveryFromFile(input: {
  webhookFile: string;
  notification: DiscoveryNotification;
}) {
  try {
    const webhookUrl = await readDiscordWebhookUrl(input.webhookFile);
    await sendDiscoveryWebhook({ webhookUrl, notification: input.notification });
    process.stdout.write("Discord 웹훅 알림 전송 완료\n");
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    process.stderr.write(`WARNING: Discord 웹훅 알림을 보내지 못했습니다. ${message}\n`);
  }
}
