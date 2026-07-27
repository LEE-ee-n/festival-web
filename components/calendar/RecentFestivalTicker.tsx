"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";

type RecentFestival = {
  id: number;
  name: string;
  created_at: string;
};

const RECENT_DAYS = 7;
const ROTATION_MS = 3000;

export default function RecentFestivalTicker() {
  const [festivals, setFestivals] = useState<RecentFestival[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(
    null,
  );
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function fetchRecentFestivals() {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - RECENT_DAYS);

      const { data, error } = await supabase
        .from("festivals")
        .select("id, name, created_at")
        .eq("verification_status", "approved")
        .neq("status", "cancelled")
        .gte("created_at", cutoff.toISOString())
        .order("created_at", { ascending: false });

      if (error || isCancelled) return;

      setFestivals((data ?? []) as RecentFestival[]);
    }

    void fetchRecentFestivals();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (festivals.length <= 1) return;

    const timer = window.setTimeout(() => {
      setPreviousIndex(currentIndex);
      setCurrentIndex((currentIndex + 1) % festivals.length);
    }, ROTATION_MS);

    return () => window.clearTimeout(timer);
  }, [currentIndex, festivals.length]);

  if (isDismissed || festivals.length === 0) return null;

  const currentFestival = festivals[currentIndex];
  const previousFestival =
    previousIndex === null ? null : festivals[previousIndex];

  return (
    <aside
      aria-label="최근 등록 축제"
      className="border-b border-slate-200 bg-white"
    >
      <div className="flex h-10 items-center px-4 sm:px-6">
        <span className="mr-2 shrink-0 rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white">
          NEW
        </span>

        <div className="relative h-full min-w-0 flex-1 overflow-hidden">
          {previousFestival && (
            <Link
              key={`previous-${previousFestival.id}`}
              href={`/festival/${previousFestival.id}`}
              className="recent-festival-ticker-out absolute inset-0 flex min-w-0 items-center text-sm font-medium text-slate-700"
            >
              <span className="truncate">
                {previousFestival.name}이 새로 등록되었습니다.
              </span>
            </Link>
          )}

          <Link
            key={`current-${currentFestival.id}`}
            href={`/festival/${currentFestival.id}`}
            className={[
              "absolute inset-0 flex min-w-0 items-center text-sm font-medium text-slate-700 hover:text-slate-950",
              previousFestival ? "recent-festival-ticker-in" : "",
            ].join(" ")}
          >
            <span className="truncate">
              {currentFestival.name}이 새로 등록되었습니다.
            </span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          aria-label="최근 등록 알림 닫기"
          title="닫기"
          className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={17} />
        </button>
      </div>
    </aside>
  );
}
