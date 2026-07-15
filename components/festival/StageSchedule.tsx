import { HandMetal } from "lucide-react";

import ArtistScheduleRow from "@/components/festival/ArtistScheduleRow";

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

type StageScheduleProps = {
  stage: string;
  artists: FestivalArtist[];
};

export default function StageSchedule({
  stage,
  artists,
}: StageScheduleProps) {
  return (
    <div>
      <h4 className="flex items-center gap-2 overflow-hidden rounded-xl border border-slate-200 bg-blue-100 px-3 py-3 text-sm font-bold text-slate-700">
        <HandMetal size={14} />
        <span>{stage}</span>
      </h4>

      <div className="divide-y divide-slate-300">
        {artists.map((item) => (
            <ArtistScheduleRow
                key={item.artist_id}
                item={item}
            />
            ))}
      </div>
    </div>
  );
}