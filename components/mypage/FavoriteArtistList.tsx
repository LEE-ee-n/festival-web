import FavoriteArtistCard from "@/components/mypage/FavoriteArtistCard";
import type { FavoriteArtistListItem } from "@/lib/favorites/artistFavorites";

type FavoriteArtistListProps = {
  items: FavoriteArtistListItem[];
};

export default function FavoriteArtistList({
  items,
}: FavoriteArtistListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong px-5 py-10 text-center text-sm text-ink-tertiary">
        아직 좋아하는 아티스트가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((artist) => (
        <FavoriteArtistCard key={artist.id} artist={artist} />
      ))}
    </div>
  );
}
