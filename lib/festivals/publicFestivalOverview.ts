export type PublicFestivalState =
  | "scheduled"
  | "ongoing"
  | "ended";

export type FestivalDateRange = {
  start_date: string;
  end_date: string;
};

export type PublicFestivalStateCounts = Record<
  "all" | PublicFestivalState,
  number
>;

export function getPublicFestivalState(
  festival: FestivalDateRange,
  todayKey: string,
): PublicFestivalState {
  if (festival.start_date > todayKey) {
    return "scheduled";
  }

  if (festival.end_date < todayKey) {
    return "ended";
  }

  return "ongoing";
}

export function countPublicFestivalStates(
  festivals: FestivalDateRange[],
  todayKey: string,
): PublicFestivalStateCounts {
  const counts: PublicFestivalStateCounts = {
    all: festivals.length,
    scheduled: 0,
    ongoing: 0,
    ended: 0,
  };

  festivals.forEach((festival) => {
    counts[getPublicFestivalState(festival, todayKey)] += 1;
  });

  return counts;
}

export function sortPublicFestivals<
  FestivalType extends FestivalDateRange & { name: string },
>(
  festivals: FestivalType[],
  todayKey: string,
): FestivalType[] {
  const stateOrder: Record<PublicFestivalState, number> = {
    ongoing: 0,
    scheduled: 1,
    ended: 2,
  };

  return [...festivals].sort((left, right) => {
    const leftState = getPublicFestivalState(left, todayKey);
    const rightState = getPublicFestivalState(right, todayKey);
    const stateComparison =
      stateOrder[leftState] - stateOrder[rightState];

    if (stateComparison !== 0) {
      return stateComparison;
    }

    const dateComparison =
      leftState === "ended"
        ? right.start_date.localeCompare(left.start_date)
        : left.start_date.localeCompare(right.start_date);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return left.name.localeCompare(right.name, "ko");
  });
}
