import Link from "next/link";

import type { FestivalDiaryListItem } from "@/lib/diaries/festivalDiaries";
import { typography } from "@/lib/typography";

type FestivalRecordCardProps = {
  record: FestivalDiaryListItem;
  compact?: boolean;
};

export default function FestivalRecordCard({ record, compact = false }: FestivalRecordCardProps) {
  const imageUrl = record.coverImageUrl || record.festivalThumbnailUrl;
  const year = record.festivalStartDate.slice(0, 4);

  return (
    <Link
      href={`/mypage/festival-records/${record.id}`}
      className={compact ? "block w-40 shrink-0 snap-start sm:w-48" : "block"}
    >
      <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-surface-muted">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={`${record.festivalName} 대표사진`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-ink-muted">
            대표사진 없음
          </div>
        )}
      </div>
      <p className={`${typography.metaStrong} mt-3 text-ink-tertiary`}>{year}</p>
      <h3 className={`${typography.cardTitle} mt-1 line-clamp-2 text-ink`}>{record.festivalName}</h3>
    </Link>
  );
}
