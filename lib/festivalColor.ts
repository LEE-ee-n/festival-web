export const FESTIVAL_COLOR_CLASSES = [
  "bg-festival-bar-pink",
  "bg-festival-bar-blue",
  "bg-festival-bar-green",
  "bg-festival-bar-purple",
  "bg-festival-bar-orange",
] as const;

export function getFestivalColorClass(festivalId: number) {
  const colorIndex = festivalId % FESTIVAL_COLOR_CLASSES.length;

  return FESTIVAL_COLOR_CLASSES[colorIndex];
}
