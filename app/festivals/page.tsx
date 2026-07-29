import type { Metadata } from "next";

import FestivalOverview from "@/components/festivals/FestivalOverview";
import { typography } from "@/lib/typography";

export const metadata: Metadata = {
  title: "전체 페스티벌",
  description:
    "예정·진행 중·종료된 페스티벌 일정과 대표 이미지를 한눈에 확인하세요.",
  alternates: {
    canonical: "/festivals",
  },
};

export default function FestivalsPage() {
  return (
    <main className="bg-white px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-[1200px]">
        <h1 className={`${typography.pageTitle} text-slate-950`}>
          전체 페스티벌
        </h1>
        <p className={`${typography.meta} mt-2 text-slate-500`}>
          예정된 행사부터 지난 페스티벌 기록까지 확인할 수 있습니다.
        </p>

        <div className="mt-7">
          <FestivalOverview />
        </div>
      </div>
    </main>
  );
}
