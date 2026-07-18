import type { CalendarDay, Festival } from "@/lib/types";

function padNumber(value: number): string {
  return String(value).padStart(2, "0");
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${padNumber(
    date.getMonth() + 1,
  )}-${padNumber(date.getDate())}`;
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function getAdjacentMonthForDate(
  dateKey: string,
  currentYear: number,
  currentMonthIndex: number,
) {
  const date = parseDateKey(dateKey);
  const year = date.getFullYear();
  const monthIndex = date.getMonth();

  if (year === currentYear && monthIndex === currentMonthIndex) {
    return null;
  }

  return { year, monthIndex };
}

export function getCalendarDays(
  year: number,
  monthIndex: number,
): CalendarDay[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const startDayOffset = firstDayOfMonth.getDay();

  const calendarStartDate = new Date(
    year,
    monthIndex,
    1 - startDayOffset,
  );

  const todayKey = toDateKey(new Date());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      calendarStartDate.getFullYear(),
      calendarStartDate.getMonth(),
      calendarStartDate.getDate() + index,
    );

    const dateKey = toDateKey(date);

    return {
      date,
      dateKey,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === monthIndex,
      isToday: dateKey === todayKey,
    };
  });
}

export function getFestivalsForDate(
  festivals: Festival[],
  dateKey: string,
): Festival[] {
  return festivals
    .filter(
      (festival) =>
        festival.start_date <= dateKey &&
        festival.end_date >= dateKey,
    )
    .sort((a, b) => {
      const dateComparison = a.start_date.localeCompare(b.start_date);

      if (dateComparison !== 0) {
        return dateComparison;
      }

      return a.name.localeCompare(b.name, "ko");
    });
}

export function formatKoreanDate(dateKey: string): string {
  const date = parseDateKey(dateKey);

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

export function formatFestivalPeriod(
  startDate: string,
  endDate: string,
): string {
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (startDate === endDate) {
    return formatter.format(parseDateKey(startDate));
  }

  return `${formatter.format(
    parseDateKey(startDate),
  )} ~ ${formatter.format(parseDateKey(endDate))}`;
}
