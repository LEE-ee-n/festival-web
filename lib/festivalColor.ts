import type { FestivalCalendarColor } from "@/lib/types";

export const FESTIVAL_COLOR_OPTIONS = [
  { value: "pink", className: "bg-festival-bar-pink", hex: "#FFD8E1", label: "분홍" },
  { value: "blue", className: "bg-festival-bar-blue", hex: "#C0E6F4", label: "하늘" },
  { value: "green", className: "bg-festival-bar-green", hex: "#DEF4C5", label: "연두" },
  { value: "purple", className: "bg-festival-bar-purple", hex: "#DCC2EE", label: "보라" },
  { value: "orange", className: "bg-festival-bar-orange", hex: "#FFE7A3", label: "노랑" },
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
