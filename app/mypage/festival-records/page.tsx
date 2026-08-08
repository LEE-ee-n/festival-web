import type { Metadata } from "next";
import Link from "next/link";

import FestivalRecordsPageContent from "@/components/festival-records/FestivalRecordsPageContent";
import { typography } from "@/lib/typography";

export const metadata: Metadata = { title: "페스티봄 일기", robots: { index: false, follow: false } };

export default function FestivalRecordsPage() {
  return (
    <main className="min-h-screen bg-surface px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/mypage" className={`${typography.metaStrong} text-ink-tertiary hover:underline`}>← 마이페이지</Link>
        <div className="mt-5 flex items-center gap-3">
          <h1 className={`${typography.pageTitle} text-ink`}>페스티봄 일기</h1>
          <Link href="/mypage/festival-records/new" className={`${typography.button} rounded-xl border border-line-strong bg-surface px-3 py-2 text-ink-secondary`}>
            기록 추가
          </Link>
        </div>
        <div className="mt-8"><FestivalRecordsPageContent /></div>
      </div>
    </main>
  );
}
