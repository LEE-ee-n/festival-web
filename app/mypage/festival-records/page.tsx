import type { Metadata } from "next";
import Link from "next/link";

import FestivalRecordsPageContent from "@/components/festival-records/FestivalRecordsPageContent";
import { typography } from "@/lib/typography";

export const metadata: Metadata = { title: "나의 페스티벌 기록", robots: { index: false, follow: false } };

export default function FestivalRecordsPage() {
  return (
    <main className="min-h-screen bg-surface px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/mypage" className={`${typography.metaStrong} text-ink-tertiary hover:underline`}>← 마이페이지</Link>
        <h1 className={`${typography.pageTitle} mt-5 text-ink`}>나의 페스티벌 기록</h1>
        <div className="mt-8"><FestivalRecordsPageContent /></div>
      </div>
    </main>
  );
}
