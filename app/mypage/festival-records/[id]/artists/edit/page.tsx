import type { Metadata } from "next";
import Link from "next/link";

import FestivalArtistRecordEditor from "@/components/festival-records/FestivalArtistRecordEditor";
import { typography } from "@/lib/typography";

export const metadata: Metadata = { title: "아티스트 기록 작성", robots: { index: false, follow: false } };

export default async function EditFestivalArtistRecordsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recordId = Number(id);
  return <main className="min-h-screen bg-surface-subtle px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto max-w-3xl"><Link href={`/mypage/festival-records/${recordId}/edit`} className={`${typography.metaStrong} text-ink-tertiary hover:underline`}>← 페스티벌 기록 수정</Link><h1 className={`${typography.pageTitle} mt-5 text-ink`}>아티스트별 기록</h1><div className="mt-8"><FestivalArtistRecordEditor recordId={recordId} /></div></div></main>;
}
