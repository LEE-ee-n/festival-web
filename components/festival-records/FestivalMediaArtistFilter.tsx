"use client";

import { useMemo } from "react";
import type { FestivalRecordPerformance } from "@/lib/diaries/festivalRecordTypes";

export const ALL_ARTISTS_FILTER = "all";
export const UNASSIGNED_ARTIST_FILTER = "unassigned";

export default function FestivalMediaArtistFilter({
  performances,
  value,
  onChange,
}: {
  performances: FestivalRecordPerformance[];
  value: string;
  onChange: (value: string) => void;
}) {
  const artistNames = useMemo(
    () => Array.from(new Set(performances.map((performance) => performance.artistName)))
      .sort((left, right) => left.localeCompare(right, "ko")),
    [performances],
  );

  return <label className="flex min-w-0 items-center gap-2">
    <span className="shrink-0 text-sm font-semibold text-ink">아티스트</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-w-0 rounded-full border border-line-strong bg-white px-4 py-2 text-sm text-ink outline-none focus:border-ink-muted"
    >
      <option value={ALL_ARTISTS_FILTER}>전체 아티스트</option>
      {artistNames.map((artistName) => <option key={artistName} value={`artist:${artistName}`}>
        {artistName}
      </option>)}
      <option value={UNASSIGNED_ARTIST_FILTER}>연결 안 된 미디어</option>
    </select>
  </label>;
}
