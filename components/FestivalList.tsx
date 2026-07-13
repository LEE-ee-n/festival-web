import FestivalCard from "@/components/FestivalCard";
import type { Festival } from "@/lib/types";

interface FestivalListProps {
  festivals: Festival[];
  onSelect?: (festival: Festival) => void;
}
export default function FestivalList({
  festivals,
  onSelect,
}: FestivalListProps) {
  if (festivals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
        <p className="font-medium text-slate-700">
          등록된 축제가 없습니다.
        </p>

        <p className="mt-1 text-sm text-slate-400">
          다른 날짜를 선택해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {festivals.map((festival) => (
        <FestivalCard
          key={festival.id}
          festival={festival}
          onSelect={(selectedFestival) =>
            onSelect?.(selectedFestival)
          }
        />
      ))}
    </div>
  );
}