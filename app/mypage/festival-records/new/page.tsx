import type { Metadata } from "next";
import Link from "next/link";

import FestivalRecordForm from "@/components/festival-records/FestivalRecordForm";
import { typography } from "@/lib/typography";

export const metadata: Metadata = { title: "새로운 페스티봄 일기", robots: { index: false, follow: false } };

export default async function NewFestivalRecordPage({ searchParams }: { searchParams: Promise<{ festivalId?: string }> }) {
  const params = await searchParams;
  const festivalId = Number(params.festivalId);
  return <main className="min-h-screen bg-surface px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto max-w-3xl"><Link href="/mypage/festival-records" className={`${typography.metaStrong} text-ink-tertiary hover:underline`}>← 페스티봄 일기</Link><h1 className={`${typography.pageTitle} mt-5 text-ink`}>새로운 페스티봄 일기</h1><div className="mt-8"><FestivalRecordForm initialFestivalId={Number.isSafeInteger(festivalId) ? festivalId : null} /></div></div></main>;
}
