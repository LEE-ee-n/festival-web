import type { Metadata } from "next";
import Link from "next/link";

import FestivalRecordForm from "@/components/festival-records/FestivalRecordForm";
import { typography } from "@/lib/typography";

export const metadata: Metadata = { title: "페스티벌 기록 수정", robots: { index: false, follow: false } };

export default async function EditFestivalRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recordId = Number(id);
  return <main className="min-h-screen bg-surface px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto max-w-3xl"><Link href={`/mypage/festival-records/${recordId}`} className={`${typography.metaStrong} text-ink-tertiary hover:underline`}>← 기록으로 돌아가기</Link><h1 className={`${typography.pageTitle} mt-5 text-ink`}>페스티벌 기록 수정</h1><div className="mt-8"><FestivalRecordForm recordId={recordId} /></div></div></main>;
}
