import Link from "next/link";

type FestivalArtist = {
  artist_id: number;
  performance_time: string | null;
  performance_end_time: string | null;
  artists:
    | {
        id: number;
        name: string;
      }
    | {
        id: number;
        name: string;
      }[]
    | null;
};

type ArtistScheduleRowProps = {
  item: FestivalArtist;
};

export default function ArtistScheduleRow({
  item,
}: ArtistScheduleRowProps) {
  const artist = Array.isArray(item.artists)
    ? item.artists[0]
    : item.artists;

  return (
    <div className="flex items-center justify-between gap-3 px-6 py-3">
      <div className="min-w-0">
        {artist ? (
          <Link
            href={`/artist/${artist.id}`}
            className="text-sm font-semibold text-slate-700 hover:underline"
          >
            {artist.name}
          </Link>
        ) : (
          <p className="text-sm font-semibold text-slate-700">
            아티스트 정보 없음
          </p>
        )}
      </div>

      {(item.performance_time ||
        item.performance_end_time) && (
        <span className="shrink-0 font-mono text-sm font-medium text-indigo-600">
          {item.performance_time
            ? item.performance_time.slice(0, 5)
            : "시작 미정"}

          {item.performance_end_time &&
            ` ~ ${item.performance_end_time.slice(0, 5)}`}
        </span>
      )}
    </div>
  );
}