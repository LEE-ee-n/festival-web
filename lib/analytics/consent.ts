export const ANALYTICS_CONSENT_STORAGE_KEY =
  "festibom.analytics-consent.v1";
export const OPEN_ANALYTICS_CONSENT_EVENT =
  "festibom:open-analytics-consent";
export const ANALYTICS_CONSENT_CHANGED_EVENT =
  "festibom:analytics-consent-changed";

export type AnalyticsConsent = "essential" | "analytics";
export type AnalyticsConsentSnapshot =
  | AnalyticsConsent
  | "pending"
  | "unset";

export function parseAnalyticsConsent(
  value: string | null,
): AnalyticsConsent | null {
  if (value === "essential" || value === "analytics") return value;
  return null;
}

export function shouldLoadAnalytics(
  consent: AnalyticsConsent | null,
  pathname: string,
) {
  return consent === "analytics" && !pathname.startsWith("/admin");
}

export function getAnalyticsConsentSnapshot(): AnalyticsConsentSnapshot {
  if (typeof window === "undefined") return "pending";

  try {
    return (
      parseAnalyticsConsent(
        window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY),
      ) ?? "unset"
    );
  } catch {
    return "unset";
  }
}

export function getServerAnalyticsConsentSnapshot(): AnalyticsConsentSnapshot {
  return "pending";
}

export function subscribeAnalyticsConsent(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, onChange);
  };
}
