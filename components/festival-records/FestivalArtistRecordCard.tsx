"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  saveFestivalArtistRecord,
  type FestivalExperienceStatus,
  type FestivalRecordPerformance,
} from "@/lib/diaries/festivalDiaries";
import { typography } from "@/lib/typography";

const STATUS_OPTIONS: Array<{ value: FestivalExperienceStatus; label: string }> = [
  { value: "watched", label: "봤어요" },
  { value: "briefly", label: "잠깐 봤어요" },
  { value: "missed", label: "못 봐서 아쉬워요" },
];

function statusLabel(status: FestivalExperienceStatus | null) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "미작성";
}

type FestivalArtistRecordCardProps = {
  item: FestivalRecordPerformance;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
};

export default function FestivalArtistRecordCard({ item, index, isOpen, onToggle }: FestivalArtistRecordCardProps) {
  const [experienceStatus, setExperienceStatus] = useState<FestivalExperienceStatus | null>(item.experienceStatus);
  const [memo, setMemo] = useState(item.memo ?? "");
  const [songNames, setSongNames] = useState(item.songs.map((song) => song.songName).join(", "));
  const [rating, setRating] = useState<number | null>(item.rating);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(Boolean(item.experienceStatus));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function save() {
    if (!experienceStatus || isSaving) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await saveFestivalArtistRecord({
        recordPerformanceId: item.recordPerformanceId,
        experienceStatus,
        rating,
        memo,
        songNames: songNames.split(",").map((song) => song.trim()).filter(Boolean),
      });
      setIsSaved(true);
    } catch (error) {
      console.error("Failed to save festival artist record", error);
      setErrorMessage("아티스트 기록 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface">
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm font-bold text-ink-secondary">{index}</span>
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-base text-ink">{item.artistName}</strong>
          <span className="mt-1 block text-xs text-ink-tertiary">
            {item.performanceTime?.slice(0, 5) || "시간 미정"}{item.performanceEndTime ? ` ~ ${item.performanceEndTime.slice(0, 5)}` : ""} · {item.stageName || "무대 미정"}
          </span>
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${isSaved ? "bg-green-50 text-green-700" : "bg-surface-muted text-ink-muted"}`}>{isSaved ? statusLabel(experienceStatus) : "미작성"}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="space-y-6 border-t border-line px-4 py-5 sm:px-5">
          <fieldset>
            <legend className={`${typography.metaStrong} text-ink-secondary`}>상태</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button key={option.value} type="button" onClick={() => { setExperienceStatus(option.value); setIsSaved(false); }} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${experienceStatus === option.value ? "border-ink bg-surface-dark text-white" : "border-line-strong text-ink-secondary"}`}>
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className={`${typography.metaStrong} block text-ink-secondary`}>
            기록
            <textarea value={memo} onChange={(event) => { setMemo(event.target.value); setIsSaved(false); }} rows={4} maxLength={2000} placeholder="좋았던 순간이나 놓쳐서 아쉬웠던 기억을 남겨보세요." className="mt-2 w-full resize-y rounded-xl border border-line-strong px-4 py-3 text-sm outline-none focus:border-ink-muted" />
          </label>

          <label className={`${typography.metaStrong} block text-ink-secondary`}>
            기억에 남은 곡
            <input value={songNames} onChange={(event) => { setSongNames(event.target.value); setIsSaved(false); }} placeholder="여러 곡은 쉼표로 구분" className="mt-2 w-full rounded-xl border border-line-strong px-4 py-3 text-sm outline-none focus:border-ink-muted" />
          </label>

          <fieldset>
            <legend className={`${typography.metaStrong} text-ink-secondary`}>평점</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" onClick={() => { setRating(rating === value ? null : value); setIsSaved(false); }} aria-label={`${value}점`} className={`text-2xl ${rating && value <= rating ? "text-amber-500" : "text-line-strong"}`}>★</button>
              ))}
            </div>
          </fieldset>

          {errorMessage && <p role="alert" className="text-sm text-red-600">{errorMessage}</p>}
          <button type="button" disabled={!experienceStatus || isSaving} onClick={() => void save()} className={`${typography.button} rounded-xl bg-surface-dark px-4 py-2.5 text-white disabled:opacity-50`}>
            {isSaving ? "저장 중" : isSaved ? "저장됨" : "이 아티스트 기록 저장"}
          </button>
        </div>
      )}
    </article>
  );
}
