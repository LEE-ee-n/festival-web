"use client";

import Link from "next/link";
import { Images } from "lucide-react";
import GoogleDriveImage from "@/components/google-drive/GoogleDriveImage";
import GoogleDriveMediaPreview from "@/components/google-drive/GoogleDriveMediaPreview";
import { getFeaturedFestivalMedia } from "@/lib/diaries/festivalMedia";
import type { FestivalRecordMedia } from "@/lib/diaries/festivalRecordTypes";

export default function FestivalFeaturedMedia({ recordId, media }: { recordId: number; media: FestivalRecordMedia[] }) {
  const featured = getFeaturedFestivalMedia(media);
  if (media.length === 0) return null;
  return <section className="mb-10 border-b border-line pb-10">
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-lg font-bold text-ink">그날의 미디어</h2>
      <Link href={`/mypage/festival-records/${recordId}/media`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-secondary"><Images className="h-4 w-4" />전체 미디어 보기</Link>
    </div>
    {featured.images.length > 0 && <div className={`grid gap-2 ${featured.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {featured.images.map((item) => <Link key={item.id} href={`/mypage/festival-records/${recordId}/media?media=${item.id}`} className="overflow-hidden rounded-xl"><GoogleDriveImage mediaId={item.id} alt={item.externalFileName || "대표 사진"} size={900} eager className="aspect-[4/3]" /></Link>)}
    </div>}
    {featured.video && <div className="mt-3"><GoogleDriveMediaPreview media={featured.video} eager /></div>}
    {featured.images.length === 0 && !featured.video && <Link href={`/mypage/festival-records/${recordId}/media`} className="block rounded-xl border border-dashed border-line-strong p-5 text-center text-sm text-ink-tertiary">대표 사진과 영상을 선택해 보세요.</Link>}
  </section>;
}
