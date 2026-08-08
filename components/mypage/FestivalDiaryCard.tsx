import Link from "next/link";
import { MapPin } from "lucide-react";

import type { FestivalDiaryListItem } from "@/lib/diaries/festivalDiaries";
import { typography } from "@/lib/typography";

type FestivalDiaryCardProps = {
  diary: FestivalDiaryListItem;
};

function formatAttendedDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00+09:00`));
}

export default function FestivalDiaryCard({ diary }: FestivalDiaryCardProps) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-5">
      <p className={`${typography.metaStrong} text-festival-purple`}>
        {formatAttendedDate(diary.attendedDate)}
      </p>
      <h3 className={`${typography.cardTitle} mt-2 text-ink`}>
        {diary.title}
      </h3>
      <Link
        href={`/festival/${diary.festivalId}`}
        className={`${typography.metaStrong} mt-1 inline-block text-ink-secondary hover:underline`}
      >
        {diary.festivalName}
      </Link>
      {diary.festivalLocation && (
        <p className={`${typography.meta} mt-2 inline-flex items-center gap-1.5 text-ink-tertiary`}>
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {diary.festivalLocation}
        </p>
      )}

      <p className={`${typography.bodyCompact} mt-4 whitespace-pre-wrap break-words leading-6 text-ink-secondary`}>
        {diary.content}
      </p>

      <Link
        href={`/festival/${diary.festivalId}#my-festival-diary`}
        className={`${typography.button} mt-4 inline-flex rounded-xl border border-line-strong px-3 py-2 text-ink-secondary`}
      >
        기록 보기·수정
      </Link>
    </article>
  );
}
