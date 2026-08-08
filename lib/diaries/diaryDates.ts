export function getDefaultAttendedDate(
  startDate: string,
  endDate: string,
  today: string,
): string {
  if (today < startDate) return startDate;
  if (today > endDate) return endDate;
  return today;
}

export function getFestivalDateOptions(startDate: string, endDate: string): string[] {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];

  const dates: string[] = [];
  for (const current = new Date(start); current <= end; current.setUTCDate(current.getUTCDate() + 1)) {
    dates.push(current.toISOString().slice(0, 10));
  }
  return dates;
}
