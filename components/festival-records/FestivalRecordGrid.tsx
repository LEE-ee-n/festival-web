import FestivalRecordCard from "@/components/festival-records/FestivalRecordCard";
import type { FestivalDiaryListItem } from "@/lib/diaries/festivalDiaries";

export default function FestivalRecordGrid({ items }: { items: FestivalDiaryListItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((record) => <FestivalRecordCard key={record.id} record={record} />)}
    </div>
  );
}
