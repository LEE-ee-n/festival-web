import type { Metadata } from "next";
import Link from "next/link";

import FestivalRecordDetailView from "@/components/festival-records/FestivalRecordDetailView";
import { typography } from "@/lib/typography";

export const metadata: Metadata = { title: "개인 페스티벌 기록", robots: { index: false, follow: false } };

export default async function FestivalRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <main className="min-h-screen bg-surface-subtle px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto max-w-4xl"><Link href="/mypage/festival-records" className={`${typography.metaStrong} text-ink-tertiary hover:underline`}>← 기록 전체보기</Link><div className="mt-5"><FestivalRecordDetailView recordId={Number(id)} /></div></div></main>;
}
