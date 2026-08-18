import FavoriteFestivalCard from "@/components/mypage/FavoriteFestivalCard";
import type { FavoriteFestivalListItem } from "@/lib/favorites/festivalFavorites";

type FavoriteFestivalListProps = {
  items: FavoriteFestivalListItem[];
};

export default function FavoriteFestivalList({
  items,
}: FavoriteFestivalListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong px-5 py-10 text-center text-sm text-ink-tertiary">
        아직 관심 축제가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((festival) => (
        <FavoriteFestivalCard key={festival.id} festival={festival} />
      ))}
    </div>
  );
}
