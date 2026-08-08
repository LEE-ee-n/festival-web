import Link from "next/link";
import { ImageDown } from "lucide-react";

import { typography } from "@/lib/typography";

type ScheduleImageLinkProps = {
  festivalId: number;
  layout: "panel" | "page";
};

export default function ScheduleImageLink({
  festivalId,
  layout,
}: ScheduleImageLinkProps) {
  return (
    <div className={layout === "panel" ? "mx-6 mt-6" : "mt-6"}>
      <Link
        href={`/festival/${festivalId}/schedule-image`}
        className={`${typography.button} flex w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-white px-4 py-3 text-ink-secondary hover:bg-surface-subtle`}
      >
        <ImageDown className="h-4 w-4" aria-hidden="true" />
        내 일정 이미지 만들기
      </Link>
    </div>
  );
}
