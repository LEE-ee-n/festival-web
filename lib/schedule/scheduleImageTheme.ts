import { FESTIVAL_COLOR_OPTIONS } from "../festivalColor.ts";
import type { FestivalCalendarColor } from "../types.ts";

export const SCHEDULE_IMAGE_TYPOGRAPHY = {
  timeFontSize: 16,
  defaultArtistFontSize: 22,
  selectedArtistFontSize: 32,
  timeBaseline: 22,
  timeToArtistGap: 12,
  artistTextInset: 30,
  cardBottomPadding: 8,
} as const;

const ACCENT_DETAILS: Record<
  FestivalCalendarColor,
  { stroke: string; text: string; mutedText: string }
> = {
  pink: { stroke: "#E9869D", text: "#6F293A", mutedText: "#965365" },
  blue: { stroke: "#5BA9C6", text: "#184E63", mutedText: "#427487" },
  green: { stroke: "#87B85E", text: "#355A20", mutedText: "#5E7E45" },
  purple: { stroke: "#A575C4", text: "#57326F", mutedText: "#79558D" },
  orange: { stroke: "#D3A72F", text: "#5B4300", mutedText: "#7A641C" },
};

export function getScheduleImageTheme(color: FestivalCalendarColor) {
  const option = FESTIVAL_COLOR_OPTIONS.find((item) => item.value === color)
    ?? FESTIVAL_COLOR_OPTIONS[3];
  const accent = ACCENT_DETAILS[color];

  return {
    accentFill: option.hex,
    accentStroke: accent.stroke,
    accentText: accent.text,
    accentMutedText: accent.mutedText,
    background: "#FFFFFF",
    surface: "#F8FAFC",
    line: "#DCE1E8",
    strongLine: "#C8D0DA",
    text: "#172033",
    secondaryText: "#5D6676",
    mutedText: "#87909F",
  };
}

export type ScheduleImageTheme = ReturnType<typeof getScheduleImageTheme>;
