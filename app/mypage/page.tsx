import type { Metadata } from "next";

import MyPageContent from "@/components/mypage/MyPageContent";
import { typography } from "@/lib/typography";

export const metadata: Metadata = {
  title: "마이페이지",
  description: "좋아하는 아티스트와 개인 페스티벌 일정을 확인합니다.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MyPage() {
  return (
    <main className="min-h-screen bg-surface px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className={`${typography.pageTitle} text-ink`}>마이페이지</h1>
        <p className={`${typography.meta} mt-2 text-ink-tertiary`}>
          좋아하는 아티스트와 선택한 공연 일정을 모아볼 수 있습니다.
        </p>

        <div className="mt-7">
          <MyPageContent />
        </div>
      </div>
    </main>
  );
}
