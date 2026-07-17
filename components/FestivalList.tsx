import FestivalCard from "@/components/FestivalCard";
import type { Festival } from "@/lib/types";
import Image from "next/image";

interface FestivalListProps {
  dateText: string;
  festivals: Festival[];
  isLoading: boolean;
  onSelect?: (festival: Festival) => void;
}

export default function FestivalList({
  dateText,
  festivals,
  isLoading,
  onSelect,
}: FestivalListProps) {
  return (
    <section className="@container">
      <div className="flex items-center gap-3 pt-3">
        <h2 className="text-sm font-bold text-slate-700">
          {dateText}
        </h2>

        <span className="text-xs text-slate-700">
          {festivals.length}개 축제
        </span>
      </div>

      <div className="pt-3">
        {isLoading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        ) : festivals.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center">
            <Image
              src="/images/empty/calendar_empty.webp"
              alt="등록된 축제가 없습니다"
              width={120}
              height={120}
              className="mx-auto"
            />

            <p className="pt-3 font-medium text-slate-700">
              등록된 축제가 없습니다.
            </p>

            <p className="pt-3 text-sm text-slate-400">
              다른 날짜를 선택해 주세요.
            </p>
          </div>
        ) : (
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
        )}
      </div>
    </section>
  );
}
