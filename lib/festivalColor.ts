import type { FestivalCalendarColor } from "@/lib/types";

export const FESTIVAL_COLOR_OPTIONS = [
  { value: "pink", className: "bg-festival-bar-pink", label: "분홍" },
  { value: "blue", className: "bg-festival-bar-blue", label: "하늘" },
  { value: "green", className: "bg-festival-bar-green", label: "연두" },
  { value: "purple", className: "bg-festival-bar-purple", label: "보라" },
  { value: "orange", className: "bg-festival-bar-orange", label: "살구" },
] as const;

export const FESTIVAL_COLOR_CLASSES = FESTIVAL_COLOR_OPTIONS.map(
  (option) => option.className,
);

export function isFestivalCalendarColor(
  value: string | null | undefined,
): value is FestivalCalendarColor {
  return FESTIVAL_COLOR_OPTIONS.some((option) => option.value === value);
}

export function getAutomaticFestivalColor(festivalId: number) {
  const colorIndex = festivalId % FESTIVAL_COLOR_OPTIONS.length;

  return FESTIVAL_COLOR_OPTIONS[colorIndex].value;
}

export function getFestivalColorClass(
  festivalId: number,
  calendarColor?: FestivalCalendarColor | null,
) {
  const selectedColor = calendarColor ?? getAutomaticFestivalColor(festivalId);
  const option = FESTIVAL_COLOR_OPTIONS.find(
    (colorOption) => colorOption.value === selectedColor,
  );

  return option?.className ?? FESTIVAL_COLOR_OPTIONS[0].className;
}
