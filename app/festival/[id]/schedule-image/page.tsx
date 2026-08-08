import Link from "next/link";
import { notFound } from "next/navigation";

import ScheduleImageMaker from "@/components/schedule-image/ScheduleImageMaker";
import { getPublicFestivalDetail } from "@/lib/festivals/getPublicFestivalDetail";
import { typography } from "@/lib/typography";

type FestivalScheduleImagePageProps = {
  params: Promise<{ id: string }>;
};

export default async function FestivalScheduleImagePage({
  params,
}: FestivalScheduleImagePageProps) {
  const { id } = await params;
  const detail = await getPublicFestivalDetail(id);

  if (!detail) notFound();

  return (
    <main className="min-h-screen bg-surface px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/festival/${detail.festival.id}`}
          className={`${typography.metaStrong} text-ink-tertiary hover:text-ink`}
        >
          ← 페스티벌 상세로 돌아가기
        </Link>

        <header className="mb-8 mt-5">
          <p className={`${typography.metaStrong} text-festival-purple`}>내 공연 일정</p>
          <h1 className={`${typography.pageTitle} mt-2 text-ink`}>일정 이미지 만들기</h1>
          <p className={`${typography.body} mt-3 text-ink-tertiary`}>
            선택한 공연은 크게 강조하고 전체 타임테이블은 함께 표시합니다.
          </p>
        </header>

        <ScheduleImageMaker
          festival={detail.festival}
          festivalArtists={detail.festivalArtists}
        />
      </div>
    </main>
  );
}
