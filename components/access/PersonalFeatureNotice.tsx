"use client";

import { useServiceAccess } from "@/components/access/ServiceAccessProvider";
import { typography } from "@/lib/typography";

export default function PersonalFeatureNotice() {
  const access = useServiceAccess();

  if (access.isLoading || !access.isAuthenticated || access.hasPersonalServiceAccess) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900">
      <p className={`${typography.metaStrong}`}>베타 이용권이 필요한 기능입니다.</p>
      <p className={`${typography.meta} mt-1`}>
        화면과 기존 기록은 볼 수 있지만 추가·수정·삭제 기능은 현재 베타 참여자만 이용할 수 있습니다.
      </p>
    </div>
  );
}
