import type { Metadata } from "next";
import Link from "next/link";

import FestivalRecordDetailView from "@/components/festival-records/FestivalRecordDetailView";
import { typography } from "@/lib/typography";

export const metadata: Metadata = { title: "페스티봄 일기", robots: { index: false, follow: false } };

export default async function FestivalRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <main className="min-h-screen bg-surface px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto max-w-4xl"><div className="flex items-center gap-3"><Link href="/mypage/festival-records" className={`${typography.metaStrong} text-ink-tertiary hover:underline`}>← 페스티봄 일기</Link><Link href={`/mypage/festival-records/${id}/edit`} className={`${typography.button} rounded-xl border border-line-strong px-3 py-2 text-ink-secondary`}>일기 고쳐쓰기</Link></div><div className="mt-5"><FestivalRecordDetailView recordId={Number(id)} /></div></div></main>;
}
