import type { Metadata } from "next";
import Link from "next/link";
import FestivalMediaAlbum from "@/components/festival-records/FestivalMediaAlbum";

export const metadata: Metadata = { title: "페스티봄 일기 앨범", robots: { index: false, follow: false } };

export default async function FestivalMediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <main className="min-h-screen bg-surface px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto max-w-5xl"><Link href={`/mypage/festival-records/${id}`} className="text-sm font-semibold text-ink-tertiary hover:underline">← 일기로 돌아가기</Link><div className="mt-6"><FestivalMediaAlbum recordId={Number(id)} /></div></div></main>;
}
