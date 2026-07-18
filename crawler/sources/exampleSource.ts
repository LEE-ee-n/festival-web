import type { CrawlerSourceAdapter } from "./types.ts";

export class ExampleTicketSource implements CrawlerSourceAdapter {
  readonly sourceType = "example_ticket";
  readonly listingUrl = "https://example.com/festivals";
  readonly allowedOrigins = ["https://example.com"];

  async discover(context: Parameters<CrawlerSourceAdapter["discover"]>[0]) {
    const html = await context.fetchText(this.listingUrl);
    const matches = html.matchAll(
      /<a\b[^>]*class=["'][^"']*ticket-link[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    );

    return Array.from(matches, (match) => ({
      source_url: match[1],
      title: match[2]
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim(),
    })).slice(0, context.maxItems);
  }
}
