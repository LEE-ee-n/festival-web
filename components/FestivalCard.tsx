import { formatFestivalPeriod } from "@/lib/calendar";
import {
  categoryBadgeClasses,
  categoryLabels,
} from "@/lib/categories";
import type { Festival } from "@/lib/types";

import {CalendarDays,   MapPin, } from "lucide-react";

interface FestivalCardProps {
  festival: Festival;
  onSelect: (festival: Festival) => void;
}

const FESTIVAL_BAR_COLORS = [
  "bg-indigo-500",
  "bg-orange-400",
  "bg-emerald-500",
  "bg-rose-400",
  "bg-purple-500",
  "bg-sky-500",
];

function getFestivalColorClass(festivalId: number) {
  return FESTIVAL_BAR_COLORS[
    festivalId % FESTIVAL_BAR_COLORS.length
  ];
}

export default function FestivalCard({
  festival,
  onSelect,
}: FestivalCardProps) {
  return (
    <button
  type="button"
  onClick={() => onSelect(festival)}
  className="@container flex min-h-[164px] w-full gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <span
  className={[
    "w-2.5 shrink-0 rounded-full",
    getFestivalColorClass(festival.id),
  ].join(" ")}
/>
      {festival.thumbnail_url && (
<div className="hidden aspect-[4/5] w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 @[500px]:flex">
<img
      src={festival.thumbnail_url}
      alt={`${festival.name} 썸네일`}
      className="h-full w-full object-contain"
    />
  </div>
)}

      <div className="min-w-0 flex-1">
  <div className="flex flex-col items-start gap-3">
    <div className="flex w-full items-start gap-3">
      <h3 className="mt-3 min-w-0 flex-1 text-lg font-bold text-slate-700">
        {festival.name.replace(/^\d{4}\s*/, "")}
      </h3>

      <span
        className={[
          "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium",
          categoryBadgeClasses[festival.category],
        ].join(" ")}
      >
        {categoryLabels[festival.category]}
      </span>
    </div>

    <div className="mt-3 flex flex-col items-start gap-3">
      <p className="flex items-center gap-1.5 text-sm text-slate-700">
        <MapPin className="h-4 w-4 shrink-0" />

        <span>
          {festival.location || "장소 확인 중"}
        </span>
      </p>

      <p className="flex items-center gap-1.5 text-sm text-slate-700">
        <CalendarDays className="h-4 w-4 shrink-0" />

        <span>
          {formatFestivalPeriod(
            festival.start_date,
            festival.end_date,
          )}
        </span>
      </p>
    </div>
  </div>
</div>
    </button>
  );
}