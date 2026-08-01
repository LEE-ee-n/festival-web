import { HandMetal } from "lucide-react";

import ArtistScheduleRow from "@/components/festival/ArtistScheduleRow";
import type { FestivalArtist } from "@/lib/types";
import { typography } from "@/lib/typography";

type StageScheduleProps = {
  stage: string;
  artists: FestivalArtist[];
  layout?: "panel" | "page";
};

export default function StageSchedule({
  stage,
  artists,
  layout = "panel",
}: StageScheduleProps) {
  const shouldShowStageHeading = stage !== "무대 미정";

  return (
    <div>
      {shouldShowStageHeading && (
        <h4 className={`${typography.panelSectionTitle} flex items-center gap-2 overflow-hidden rounded-xl border border-line bg-blue-100 px-3 py-3 text-ink-secondary`}>
          <HandMetal size={14} />
          <span>{stage}</span>
        </h4>
      )}

      <div className="divide-y divide-slate-300">
        {artists.map((item) => (
            <ArtistScheduleRow
                key={item.artist_id}
                item={item}
                layout={layout}
            />
            ))}
      </div>
    </div>
  );
}
