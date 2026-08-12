"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { typography } from "@/lib/typography";
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  ANALYTICS_CONSENT_CHANGED_EVENT,
  OPEN_ANALYTICS_CONSENT_EVENT,
  getAnalyticsConsentSnapshot,
  getServerAnalyticsConsentSnapshot,
  shouldLoadAnalytics,
  subscribeAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/analytics/consent";

import AnalyticsScripts from "./AnalyticsScripts";

export default function AnalyticsConsentManager() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionConsent, setSessionConsent] =
    useState<AnalyticsConsent | null>(null);
  const consentSnapshot = useSyncExternalStore(
    subscribeAnalyticsConsent,
    getAnalyticsConsentSnapshot,
    getServerAnalyticsConsentSnapshot,
  );
  const storedConsent: AnalyticsConsent | null =
    consentSnapshot === "essential" || consentSnapshot === "analytics"
      ? consentSnapshot
      : null;
  const consent = sessionConsent ?? storedConsent;

  useEffect(() => {
    function openConsentSettings() {
      setIsOpen(true);
    }

    window.addEventListener(
      OPEN_ANALYTICS_CONSENT_EVENT,
      openConsentSettings,
    );

    return () => {
      window.removeEventListener(
        OPEN_ANALYTICS_CONSENT_EVENT,
        openConsentSettings,
      );
    };
  }, []);

  function saveConsent(nextConsent: AnalyticsConsent) {
    try {
      window.localStorage.setItem(
        ANALYTICS_CONSENT_STORAGE_KEY,
        nextConsent,
      );
    } catch {
      // 저장할 수 없는 브라우저에서도 현재 탭의 선택은 적용한다.
    }

    const mustReload = consent === "analytics" && nextConsent === "essential";
    setSessionConsent(nextConsent);
    window.dispatchEvent(new Event(ANALYTICS_CONSENT_CHANGED_EVENT));
    setIsOpen(false);

    if (mustReload) window.location.reload();
  }

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      {shouldLoadAnalytics(consent, pathname) ? <AnalyticsScripts /> : null}

      {consentSnapshot !== "pending" &&
      (isOpen || (consentSnapshot === "unset" && sessionConsent === null)) ? (
        <section
          role="dialog"
          aria-label="분석 정보 수집 설정"
          aria-live="polite"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl border border-line-strong bg-white px-5 py-4 shadow-lg sm:bottom-5 sm:px-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={`${typography.metaStrong} text-ink`}>
                분석 정보 수집 설정
              </p>
              <p className={`${typography.caption} mt-1 leading-5 text-ink-tertiary`}>
                필수 기능은 항상 사용하며, 허용한 경우에만 GA4와 Clarity로
                공개 페이지 이용 현황을 분석합니다.
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => saveConsent("essential")}
                className={`${typography.button} min-h-10 flex-1 border border-line-strong bg-white px-4 text-ink-secondary sm:flex-none`}
              >
                필수만 사용
              </button>
              <button
                type="button"
                onClick={() => saveConsent("analytics")}
                className={`${typography.button} min-h-10 flex-1 border border-ink bg-white px-4 text-ink sm:flex-none`}
              >
                분석 허용
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
