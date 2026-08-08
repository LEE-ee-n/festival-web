import FestivalDiaryCard from "@/components/mypage/FestivalDiaryCard";
import type { FestivalDiaryListItem } from "@/lib/diaries/festivalDiaries";

type FestivalDiaryListProps = {
  items: FestivalDiaryListItem[];
};

export default function FestivalDiaryList({ items }: FestivalDiaryListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong px-5 py-10 text-center text-sm text-ink-tertiary">
        아직 작성한 페스티벌 기록이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((diary) => (
        <FestivalDiaryCard key={diary.id} diary={diary} />
      ))}
    </div>
  );
}
