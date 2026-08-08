import { HandMetal } from "lucide-react";

import ArtistScheduleRow from "@/components/festival/ArtistScheduleRow";
import type { ScheduleSelectionState } from "@/lib/hooks/useScheduleSelection";
import type { FestivalArtist } from "@/lib/types";
import type { FestivalStatus } from "@/lib/types";
import { typography } from "@/lib/typography";

type StageScheduleProps = {
  stage: string;
  artists: FestivalArtist[];
  festivalStatus: FestivalStatus | null;
  loginReturnPath: string;
  scheduleSelection: ScheduleSelectionState;
  favoriteArtistIds: ReadonlySet<number>;
  layout?: "panel" | "page";
};

export default function StageSchedule({
  stage,
  artists,
  festivalStatus,
  loginReturnPath,
  scheduleSelection,
  favoriteArtistIds,
  layout = "panel",
}: StageScheduleProps) {
  const shouldShowStageHeading = stage !== "무대 미정";

  return (
    <div>
      {shouldShowStageHeading && (
        <h4 className={`${typography.panelSectionTitle} flex items-center gap-2 pb-1 pt-3 text-ink-secondary ${layout === "page" ? "sm:pl-[12px]" : "pl-[12px]"}`}>
          <HandMetal size={14} />
          <span>{stage}</span>
        </h4>
      )}

      <div className="divide-y divide-slate-300">
        {artists.map((item, index) => (
            <ArtistScheduleRow
                key={item.id}
                item={item}
                festivalStatus={festivalStatus}
                loginReturnPath={loginReturnPath}
                scheduleSelection={scheduleSelection}
                favoriteArtistIds={favoriteArtistIds}
                layout={layout}
                isFirstAfterStage={shouldShowStageHeading && index === 0}
            />
            ))}
      </div>
    </div>
  );
}
