import type { FestivalCategory } from "@/lib/types";

export const categoryLabels: Record<FestivalCategory, string> = {
  music_festival: "음악 페스티벌",
  local_festival: "지역축제",
  food_festival: "음식축제",
  culture_festival: "문화축제",
  other: "기타",
};

export const categoryBadgeClasses: Record<FestivalCategory, string> = {
  music_festival: "bg-red-50 text-red-700 border-red-200",
  local_festival: "bg-blue-50 text-blue-700 border-blue-200",
  food_festival: "bg-orange-50 text-orange-700 border-orange-200",
  culture_festival: "bg-purple-50 text-purple-700 border-purple-200",
  other: "bg-slate-100 text-slate-700 border-slate-200",
};

export const categoryDotClasses: Record<FestivalCategory, string> = {
  music_festival: "bg-red-500",
  local_festival: "bg-blue-500",
  food_festival: "bg-orange-500",
  culture_festival: "bg-purple-500",
  other: "bg-slate-500",
};