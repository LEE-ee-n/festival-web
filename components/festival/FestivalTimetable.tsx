import StageSchedule from "@/components/festival/StageSchedule";

import {
  CalendarDays,
  Music,
} from "lucide-react";
import type { FestivalArtist } from "@/lib/types";
import { typography } from "@/lib/typography";

type ArtistsByDateAndStage = Record<
  string,
  Record<string, FestivalArtist[]>
>;

type FestivalTimetableProps = {
  artistsByDateAndStage: ArtistsByDateAndStage;
  artistCount: number;
  layout?: "panel" | "page";
};

export default function FestivalTimetable({
  artistsByDateAndStage,
  artistCount,
  layout = "panel",
}: FestivalTimetableProps) {
  if (artistCount === 0) {
    return null;
  }

  return (
    <section>
      <h2 className={`${typography.panelSectionTitle} flex items-center justify-center gap-2 pt-6 text-ink-secondary`}>
        <Music size={16} />
        <span>출연진</span>
      </h2>

      <div className="mt-3 space-y-3">
        {Object.entries(artistsByDateAndStage).map(
          ([date, stageGroups]) => (
            <div key={date}>
              <h3 className={`${typography.panelSectionTitle} inline-flex items-center gap-2 rounded-xl bg-surface-dark px-3 py-3 text-white`}>
                <CalendarDays size={16} />

                <span>
                  {date === "날짜 미정"
                    ? "타임테이블 미공개"
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
                      layout={layout}
                    />
                  ),
                )}
              </div>
            </div>
          ),
        )}
      </div>

      <div className="pt-6 border-b border-line" />

    </section>
  );
}
