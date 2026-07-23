import { readFile } from "node:fs/promises";

import type { ScheduledDiscoveryItem, ScheduledSiteResult } from "../types.ts";

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
  maxAttempts?: number;
  retryDelayMs?: number;
}) {
  const webhookUrl = validateDiscordWebhookUrl(input.webhookUrl);
  webhookUrl.searchParams.set("wait", "true");
  const maxAttempts = Math.max(1, input.maxAttempts ?? 3);
  const retryDelayMs = Math.max(0, input.retryDelayMs ?? 750);
  const requestBody = JSON.stringify({
    content: buildDiscoveryWebhookContent(input.notification),
    allowed_mentions: { parse: [] },
  });

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response: Response;

    try {
      response = await (input.fetchImpl ?? fetch)(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: requestBody,
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      await new Promise((resolveDelay) => {
        setTimeout(resolveDelay, retryDelayMs * attempt);
      });
      continue;
    }

    if (response.ok) {
      return;
    }

    const responseText = (await response.text()).trim().slice(0, 500);
    const detail = responseText ? ` - ${responseText}` : "";
    const canRetry = response.status === 429 || response.status >= 500;

    if (!canRetry || attempt === maxAttempts) {
      throw new Error(
        `Discord 웹훅 전송 실패: HTTP ${response.status}${detail}`,
      );
    }

    await new Promise((resolveDelay) => {
      setTimeout(resolveDelay, retryDelayMs * attempt);
    });
  }
}

export async function notifyDiscoveryFromFile(input: {
  webhookFile: string;
  notification: DiscoveryNotification;
  required?: boolean;
  fetchImpl?: typeof fetch;
}) {
  try {
    const webhookUrl = await readDiscordWebhookUrl(input.webhookFile);
    await sendDiscoveryWebhook({
      webhookUrl,
      notification: input.notification,
      fetchImpl: input.fetchImpl,
    });
    process.stdout.write("Discord 웹훅 알림 전송 완료\n");
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    process.stderr.write(`WARNING: Discord 웹훅 알림을 보내지 못했습니다. ${message}\n`);

    if (input.required) {
      throw new Error(`Discord 웹훅 알림 실패: ${message}`);
    }
  }
}

function itemLine(item: ScheduledDiscoveryItem): string {
  const label = item.status === "new" ? "누락 후보" : "확인 필요";
  const icon = item.status === "new" ? "🆕" : "✅";
  const candidateId = item.candidate_id ? `${item.candidate_id} ` : "";
  const dates = item.start_date
    ? `${item.start_date}${item.end_date && item.end_date !== item.start_date ? `~${item.end_date}` : ""}`
    : "일정 없음";
  return `${icon} **[${label}] ${candidateId}${item.title}** (${dates})\n${item.source_url}\n${item.reason}`;
}

export function buildScheduledDiscoveryMessages(input: {
  generatedAt: string;
  sites: ScheduledSiteResult[];
  items: ScheduledDiscoveryItem[];
  maxLength?: number;
}): string[] {
  const maxLength = Math.min(1900, Math.max(500, input.maxLength ?? 1900));
  const siteSummary = input.sites.map((site) =>
    site.error
      ? `${site.site}: 실패 (${site.error})`
      : `${site.site}: ${site.accepted}개`,
  ).join(" · ");
  const header = [
    `🎫 **티켓 누락 축제 자동 확인**`,
    new Date(input.generatedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
    siteSummary,
    `검토 대상: ${input.items.length}개`,
  ].join("\n");
  if (input.items.length === 0) return [header];

  const messages: string[] = [];
  let current = header;
  for (const item of input.items) {
    const block = itemLine(item);
    if (`${current}\n\n${block}`.length > maxLength) {
      messages.push(current);
      current = block;
    } else {
      current = `${current}\n\n${block}`;
    }
  }
  messages.push(current);
  return messages;
}

export async function sendDiscordMessages(input: {
  webhookUrl: string;
  messages: string[];
  fetchImpl?: typeof fetch;
}): Promise<void> {
  const webhookUrl = validateDiscordWebhookUrl(input.webhookUrl);
  webhookUrl.searchParams.set("wait", "true");
  for (const content of input.messages) {
    const response = await (input.fetchImpl ?? fetch)(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Discord 명단 전송 실패: HTTP ${response.status}`);
  }
}
