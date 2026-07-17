const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function dateKeyToUtcTime(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function getFestivalBarSegment(
  dateKey: string,
  festivalEndDateKey: string,
  dayIndex: number,
) {
  const remainingFestivalDays =
    Math.floor(
      (dateKeyToUtcTime(festivalEndDateKey) -
        dateKeyToUtcTime(dateKey)) /
        MILLISECONDS_PER_DAY,
    ) + 1;
  const remainingDaysInRow = 7 - (dayIndex % 7);

  return {
    spanDays: Math.min(remainingFestivalDays, remainingDaysInRow),
    endsInThisRow: remainingFestivalDays <= remainingDaysInRow,
  };
}
