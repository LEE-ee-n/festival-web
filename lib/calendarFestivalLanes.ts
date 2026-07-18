import type { Festival } from "@/lib/types";

export const MAX_VISIBLE_FESTIVAL_LANES = 3;

export function assignFestivalLanes(festivals: Festival[]) {
  const laneEndDates: string[] = [];
  const lanes = new Map<number, number>();
  const orderedFestivals = [...festivals].sort((a, b) => {
    const startComparison = a.start_date.localeCompare(b.start_date);
    if (startComparison !== 0) return startComparison;
    return a.id - b.id;
  });

  orderedFestivals.forEach((festival) => {
    const reusableLane = laneEndDates.findIndex(
      (endDate) => endDate < festival.start_date,
    );
    const lane = reusableLane === -1 ? laneEndDates.length : reusableLane;

    laneEndDates[lane] = festival.end_date;
    lanes.set(festival.id, lane);
  });

  return lanes;
}
