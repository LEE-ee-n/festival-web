import {
  getAutomaticFestivalColor,
  isFestivalCalendarColor,
} from "../festivalColor.ts";
import type { FestivalCalendarColor } from "../types.ts";

export type FigmaCardNewsFestivalSource = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  location: string | null;
  region: string | null;
  thumbnailUrl: string | null;
  calendarColor: string | null;
  ticketPlatforms: string[];
  artistNames: string[];
};

export type FigmaCardNewsFestival = {
  id: number;
  name: string;
  dateText: string;
  locationText: string;
  ticketPlatformText: string;
  lineupText: string;
  thumbnailUrl: string | null;
  colorHex: string;
};

export type FigmaCardNewsDraft = {
  periodLabel: string;
  coverEyebrow: string;
  coverTitle: string;
  festivalCards: FigmaCardNewsFestival[];
  festivalLists: FigmaCardNewsFestival[][];
  totalFestivalCount: number;
};

const CARD_NEWS_COLORS: Record<FestivalCalendarColor, string> = {
  pink: "#FFC8D4",
  blue: "#C0E6F4",
  green: "#DEF4C5",
  purple: "#DCC2EE",
  orange: "#FFCFB5",
};

function formatMonthPeriod(year: number, month: number): string {
  return `${year}년 ${month}월`;
}

function formatDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);

  return `${year}년 ${month}월 ${day}일`;
}

function formatFestivalPeriod(startDate: string, endDate: string): string {
  if (startDate === endDate) {
    return formatDate(startDate);
  }

  const [, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);

  return startMonth === endMonth
    ? `${startMonth}월 ${startDay}일~${endDay}일`
    : `${startMonth}월 ${startDay}일~${endYear}년 ${endMonth}월 ${endDay}일`;
}

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function formatLineup(artistNames: string[]): string {
  const names = uniqueNonEmpty(artistNames);

  if (names.length === 0) {
    return "출연진 확인 중";
  }

  const visibleNames = names.slice(0, 4);
  const suffix = names.length > visibleNames.length
    ? ` 외 ${names.length - visibleNames.length}팀`
    : "";

  return `${visibleNames.join(", ")}${suffix}`;
}

function getColorHex(festival: FigmaCardNewsFestivalSource): string {
  const color = isFestivalCalendarColor(festival.calendarColor)
    ? festival.calendarColor
    : getAutomaticFestivalColor(festival.id);

  return CARD_NEWS_COLORS[color];
}

export function toFigmaCardNewsFestival(
  festival: FigmaCardNewsFestivalSource,
): FigmaCardNewsFestival {
  const ticketPlatforms = uniqueNonEmpty(festival.ticketPlatforms);

  return {
    id: festival.id,
    name: festival.name,
    dateText: formatFestivalPeriod(festival.startDate, festival.endDate),
    locationText: festival.location ?? festival.region ?? "장소 확인 중",
    ticketPlatformText:
      ticketPlatforms.length > 0
        ? ticketPlatforms.join(" · ")
        : "예매처 확인 중",
    lineupText: formatLineup(festival.artistNames),
    thumbnailUrl: festival.thumbnailUrl,
    colorHex: getColorHex(festival),
  };
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
}

export function createFigmaCardNewsDraft(
  year: number,
  month: number,
  festivals: FigmaCardNewsFestivalSource[],
): FigmaCardNewsDraft {
  const cardNewsFestivals = festivals
    .map(toFigmaCardNewsFestival)
    .sort((left, right) => left.dateText.localeCompare(right.dateText, "ko"));
  const festivalCards = cardNewsFestivals.filter(
    (festival) => festival.thumbnailUrl,
  );
  const festivalLists = chunk(
    cardNewsFestivals.filter((festival) => !festival.thumbnailUrl),
    3,
  );
  const periodLabel = formatMonthPeriod(year, month);

  return {
    periodLabel,
    coverEyebrow: `☀️ ${month}월 FESTIVAL`,
    coverTitle: `${periodLabel} 페스티벌\n어디 갈까?`,
    festivalCards,
    festivalLists,
    totalFestivalCount: cardNewsFestivals.length,
  };
}
