import type { Metadata } from "next";
import Link from "next/link";

import NotificationSettings from "@/components/mypage/NotificationSettings";
import { typography } from "@/lib/typography";

export const metadata: Metadata = {
  title: "알림 설정",
  robots: { index: false, follow: false },
};

export default function NotificationSettingsPage() {
  return (
    <main className="min-h-screen bg-surface px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/mypage" className={`${typography.metaStrong} text-ink-tertiary hover:text-ink`}>← 마이페이지</Link>
        <h1 className={`${typography.pageTitle} mt-5 text-ink`}>알림 설정</h1>
        <p className={`${typography.meta} mt-2 text-ink-tertiary`}>관심 있는 페스티벌 소식만 선택해 받을 수 있습니다.</p>
        <section className="mt-7 rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          <NotificationSettings />
        </section>
      </div>
    </main>
  );
}
