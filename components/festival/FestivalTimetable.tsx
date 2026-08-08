"use client";

import StageSchedule from "@/components/festival/StageSchedule";
import ScheduleImageLink from "@/components/schedule/ScheduleImageLink";

import {
  CalendarDays,
  Music,
} from "lucide-react";
import type { FestivalArtist } from "@/lib/types";
import type { FestivalStatus } from "@/lib/types";
import { canSelectScheduleItem } from "@/lib/schedule/scheduleEligibility";
import { useScheduleSelection } from "@/lib/hooks/useScheduleSelection";
import { compareStageNames } from "@/lib/festivals/artistScheduleGroups";
import { typography } from "@/lib/typography";

type ArtistsByDateAndStage = Record<
  string,
  Record<string, FestivalArtist[]>
>;

type FestivalTimetableProps = {
  artistsByDateAndStage: ArtistsByDateAndStage;
  artistCount: number;
  festivalId: number;
  festivalStatus: FestivalStatus | null;
  favoriteArtistIds: ReadonlySet<number>;
  layout?: "panel" | "page";
};

export default function FestivalTimetable({
  artistsByDateAndStage,
  artistCount,
  festivalId,
  festivalStatus,
  favoriteArtistIds,
  layout = "panel",
}: FestivalTimetableProps) {
  const festivalArtistIds = Object.values(artistsByDateAndStage)
    .flatMap((stageGroups) => Object.values(stageGroups).flat())
    .filter((item) => canSelectScheduleItem(festivalStatus, item))
    .map((item) => item.id);
  const scheduleSelection = useScheduleSelection(festivalArtistIds);

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
              <h3 className={`${typography.panelSectionTitle} flex w-full items-center gap-3 py-1 text-ink`}>
                <span className="inline-flex shrink-0 items-center gap-2">
                  <CalendarDays size={16} aria-hidden="true" />
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
                </span>
                <span className="min-w-0 flex-1 border-t border-line-strong" aria-hidden="true" />
              </h3>

              <div className="space-y-3">
                {Object.entries(stageGroups).sort(([left], [right]) =>
                  compareStageNames(left, right),
                ).map(
                  ([stage, artists]) => (
                    <StageSchedule
                      key={stage}
                      stage={stage}
                      artists={artists}
                      festivalStatus={festivalStatus}
                      loginReturnPath={`/festival/${festivalId}`}
                      scheduleSelection={scheduleSelection}
                      favoriteArtistIds={favoriteArtistIds}
                      layout={layout}
                    />
                  ),
                )}
              </div>
            </div>
          ),
        )}
      </div>

      {scheduleSelection.errorMessage && (
        <p className="mt-3 text-xs font-medium text-red-600" role="alert">
          {scheduleSelection.errorMessage}
        </p>
      )}

      <ScheduleImageLink festivalId={festivalId} layout={layout} />

      <div className="border-b border-line pt-6" />
    </section>
  );
}
