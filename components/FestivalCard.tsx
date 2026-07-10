import Link from "next/link";

import { formatFestivalPeriod } from "@/lib/calendar";
import {
  categoryBadgeClasses,
  categoryLabels,
} from "@/lib/categories";
import type { Festival } from "@/lib/types";

interface FestivalCardProps {
  festival: Festival;
}

export default function FestivalCard({
  festival,
}: FestivalCardProps) {
  return (
    <Link
      href={`/festival/${festival.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-semibold text-slate-900">
            {festival.name}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {festival.location || "장소 확인 중"}
          </p>
        </div>

        <span
          className={[
            "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium",
            categoryBadgeClasses[festival.category],
          ].join(" ")}
        >
          {categoryLabels[festival.category]}
        </span>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {formatFestivalPeriod(
          festival.start_date,
          festival.end_date,
        )}
      </p>
    </Link>
  );
}