"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { typography } from "@/lib/typography";
import { OPEN_ANALYTICS_CONSENT_EVENT } from "@/lib/analytics/consent";

const CONTACT_EMAIL = "festibom.official@gmail.com";

export default function PublicFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return (
    <footer data-web-shell className="mt-10 border-t border-line bg-surface text-ink-tertiary">
      <div className="mx-auto min-h-[140px] w-full max-w-[1500px] px-4 py-5 sm:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
          <nav
            aria-label="푸터 메뉴"
            className={`${typography.meta} grid grid-cols-2 items-center justify-items-center gap-x-4 gap-y-3 sm:flex sm:flex-wrap`}
          >
            <Link href="/notices" className="hover:text-ink">
              공지사항
            </Link>
            <Link href="/terms" className="hover:text-ink">
              이용약관
            </Link>
            <Link href="/privacy" className="hover:text-ink">
              개인정보처리방침
            </Link>
            <Link href="/report" className="hover:text-ink">
              정보 수정 제보
            </Link>
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new Event(OPEN_ANALYTICS_CONSENT_EVENT),
                )
              }
              className="hover:text-ink"
            >
              분석 설정
            </button>
          </nav>

          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className={`${typography.caption} hover:text-ink hover:underline sm:text-sm`}
          >
            {CONTACT_EMAIL}
          </a>
        </div>

        <div className={`${typography.caption} mx-auto mt-4 max-w-4xl text-center leading-5 sm:text-[13px]`}>
          <p>
            Festibom은 공식 홈페이지, 공식 SNS 및 예매처의 공개 정보를
            바탕으로 페스티벌 일정, 라인업, 타임테이블과 티켓 정보를
            정리하여 제공합니다.
          </p>
          <p className="mt-1">
            행사 정보는 주최사 사정에 따라 변경될 수 있으므로 방문 및 예매
            전 공식 채널에서 최종 정보를 확인해 주세요.
          </p>
        </div>

        <div className={`${typography.caption} mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-ink-muted`}>
          <span>© 2026 Festibom. All rights reserved.</span>
          <span aria-hidden="true">·</span>
          <span>festibom.com</span>
          <span aria-hidden="true">·</span>
          <span>Beta</span>
        </div>
      </div>
    </footer>
  );
}
