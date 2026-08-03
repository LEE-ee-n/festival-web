export const RECENT_FESTIVAL_TICKER_DISMISS_STORAGE_KEY =
  "festibom:recent-festival-ticker-dismissed-until";

export const RECENT_FESTIVAL_TICKER_DISMISS_MS =
  24 * 60 * 60 * 1000;

export function getRecentFestivalTickerDismissedUntil(
  nowMs: number,
): number {
  return nowMs + RECENT_FESTIVAL_TICKER_DISMISS_MS;
}

export function shouldHideRecentFestivalTicker(
  storedValue: string | null,
  nowMs: number,
): boolean {
  if (!storedValue) return false;

  const dismissedUntil = Number(storedValue);

  return Number.isFinite(dismissedUntil) && dismissedUntil > nowMs;
}
