"use client";

import type { FestivalRecordPerformance } from "@/lib/diaries/festivalRecordTypes";

function formatPerformanceLabel(performance: FestivalRecordPerformance) {
  const details = [
    performance.performanceDate?.slice(5).replace("-", "."),
    performance.performanceTime?.slice(0, 5),
    performance.stageName,
  ].filter(Boolean);

  return details.length > 0
    ? `${performance.artistName} · ${details.join(" · ")}`
    : performance.artistName;
}

export default function FestivalMediaArtistSelector({
  performances,
  value,
  disabled,
  onChange,
}: {
  performances: FestivalRecordPerformance[];
  value: number | null;
  disabled?: boolean;
  onChange: (value: number | null) => void;
}) {
  return <label className="block">
    <span className="sr-only">연결할 아티스트</span>
    <select
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      className="w-full rounded-lg border border-line bg-white px-2 py-2 text-xs text-ink outline-none focus:border-ink-muted disabled:opacity-60"
    >
      <option value="">연결 안 함</option>
      {performances.map((performance) => <option key={performance.recordPerformanceId} value={performance.recordPerformanceId}>
        {formatPerformanceLabel(performance)}
      </option>)}
    </select>
  </label>;
}
