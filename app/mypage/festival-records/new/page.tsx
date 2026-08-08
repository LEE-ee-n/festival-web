import type { Metadata } from "next";
import Link from "next/link";

import FestivalRecordForm from "@/components/festival-records/FestivalRecordForm";
import { typography } from "@/lib/typography";

export const metadata: Metadata = { title: "페스티벌 기록 추가", robots: { index: false, follow: false } };

export default async function NewFestivalRecordPage({ searchParams }: { searchParams: Promise<{ festivalId?: string }> }) {
  const params = await searchParams;
  const festivalId = Number(params.festivalId);
  return <main className="min-h-screen bg-surface-subtle px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto max-w-3xl"><Link href="/mypage/festival-records" className={`${typography.metaStrong} text-ink-tertiary hover:underline`}>← 기록 전체보기</Link><h1 className={`${typography.pageTitle} mt-5 text-ink`}>페스티벌 기록 추가</h1><div className="mt-8"><FestivalRecordForm initialFestivalId={Number.isSafeInteger(festivalId) ? festivalId : null} /></div></div></main>;
}
