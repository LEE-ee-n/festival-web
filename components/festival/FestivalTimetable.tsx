import StageSchedule from "@/components/festival/StageSchedule";

import {
  CalendarDays,
  Music,
} from "lucide-react";

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

type ArtistsByDateAndStage = Record<
  string,
  Record<string, FestivalArtist[]>
>;

type FestivalTimetableProps = {
  artistsByDateAndStage: ArtistsByDateAndStage;
  artistCount: number;
};

export default function FestivalTimetable({
  artistsByDateAndStage,
  artistCount,
}: FestivalTimetableProps) {
  if (artistCount === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="pt-6 flex items-center justify-center gap-2 text-sm font-bold text-slate-700">
        <Music size={16} />
        <span>출연진</span>
      </h2>

      <div className="mt-3 space-y-3">
        {Object.entries(artistsByDateAndStage).map(
          ([date, stageGroups]) => (
            <div key={date}>
              <h3 className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-3 text-sm font-bold text-white">
                <CalendarDays size={16} />

                <span>
                  {date === "날짜 미정"
                    ? date
                    : new Intl.DateTimeFormat("ko-KR", {
                        timeZone: "Asia/Seoul",
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      }).format(
                        new Date(`${date}T00:00:00+09:00`),
                      )}
                </span>
              </h3>

              <div className="mt-3 space-y-3">
                {Object.entries(stageGroups).map(
                  ([stage, artists]) => (
                    <StageSchedule
                      key={stage}
                      stage={stage}
                      artists={artists}
                    />
                  ),
                )}
              </div>
            </div>
          ),
        )}
      </div>

      <div className="pt-6 border-b border-slate-200" />

    </section>
  );
}