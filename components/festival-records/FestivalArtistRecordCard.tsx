"use client";

import { useState } from "react";
import { ChevronDown, Heart } from "lucide-react";

import {
  saveFestivalArtistRecord,
  type FestivalExperienceStatus,
  type FestivalRecordPerformance,
} from "@/lib/diaries/festivalDiaries";
import { typography } from "@/lib/typography";
import FestivalDriveMediaField from "@/components/google-drive/FestivalDriveMediaField";

const STATUS_OPTIONS: Array<{ value: FestivalExperienceStatus; label: string }> = [
  { value: "watched", label: "봤어요" },
  { value: "briefly", label: "잠깐 봤어요" },
  { value: "missed", label: "못 봐서 아쉬워요" },
];

const MEMO_MAX_LENGTH = 2000;
const SONG_NAME_MAX_LENGTH = 200;

function statusLabel(status: FestivalExperienceStatus | null) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "미작성";
}

type FestivalArtistRecordCardProps = {
  recordId: number;
  item: FestivalRecordPerformance;
  isFavorite: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onSaved: () => void;
};

export default function FestivalArtistRecordCard({ recordId, item, isFavorite, isOpen, onToggle, onSaved }: FestivalArtistRecordCardProps) {
  const [experienceStatus, setExperienceStatus] = useState<FestivalExperienceStatus | null>(item.experienceStatus);
  const [memo, setMemo] = useState(item.memo ?? "");
  const [songNames, setSongNames] = useState(item.songs.map((song) => song.songName).join(", "));
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(Boolean(item.experienceStatus));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const performanceDetails = [
    item.performanceTime
      ? `${item.performanceTime.slice(0, 5)}${item.performanceEndTime ? ` ~ ${item.performanceEndTime.slice(0, 5)}` : ""}`
      : null,
    item.stageName || null,
  ].filter(Boolean);

  async function save() {
    if (!experienceStatus || isSaving) return;

    const parsedSongNames = songNames
      .split(",")
      .map((song) => song.trim())
      .filter(Boolean);

    if (memo.length > MEMO_MAX_LENGTH) {
      setErrorMessage(`기록은 ${MEMO_MAX_LENGTH.toLocaleString()}자까지 입력할 수 있습니다.`);
      return;
    }

    if (parsedSongNames.some((song) => song.length > SONG_NAME_MAX_LENGTH)) {
      setErrorMessage(`기억에 남는 곡은 곡명 하나당 ${SONG_NAME_MAX_LENGTH}자까지 입력할 수 있습니다. 곡이 여러 개라면 쉼표로 구분해주세요.`);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await saveFestivalArtistRecord({
        recordPerformanceId: item.recordPerformanceId,
        experienceStatus,
        rating: null,
        memo,
        songNames: parsedSongNames,
      });
      setIsSaved(true);
      onSaved();
    } catch (error) {
      console.error("Failed to save festival artist record", error);
      setErrorMessage("아티스트 기록 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface">
      <button type="button" onClick={onToggle} className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 px-4 py-4 text-left sm:px-5">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <strong className="truncate text-base text-ink">{item.artistName}</strong>
          {isFavorite && <Heart className="h-4 w-4 shrink-0 fill-red-500 text-red-500" aria-label="좋아하는 아티스트" />}
          {performanceDetails.length > 0 && (
            <span className="text-xs text-ink-tertiary">{performanceDetails.join(" · ")}</span>
          )}
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${isSaved ? "bg-green-50 text-green-700" : "bg-surface-muted text-ink-muted"}`}>{isSaved ? statusLabel(experienceStatus) : "미작성"}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="space-y-6 border-t border-line px-4 py-5 sm:px-5">
          <div className="flex flex-wrap items-center gap-4">
            <div role="group" aria-label="상태" className="flex min-w-0 items-center gap-3">
              <span className={`${typography.metaStrong} shrink-0 text-ink-secondary`}>상태</span>
              <div className="flex flex-nowrap gap-2 overflow-x-auto">
                {STATUS_OPTIONS.map((option) => (
                  <button key={option.value} type="button" onClick={() => { setExperienceStatus(option.value); setIsSaved(false); }} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${experienceStatus === option.value ? "border-ink-secondary bg-ink-secondary text-white" : "border-line-strong text-ink-secondary"}`}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <label className={`${typography.metaStrong} block text-ink-secondary`}>
            기록
            <textarea value={memo} onChange={(event) => { setMemo(event.target.value); setIsSaved(false); }} rows={4} maxLength={MEMO_MAX_LENGTH} placeholder="좋았던 순간이나 놓쳐서 아쉬웠던 기억을 남겨보세요." className="mt-2 w-full resize-y rounded-xl border border-line-strong px-4 py-3 text-sm outline-none focus:border-ink-muted" />
          </label>

          <FestivalDriveMediaField recordId={recordId} recordPerformanceId={item.recordPerformanceId} initialMedia={item.media} />

          <label className={`${typography.metaStrong} block text-ink-secondary`}>
            기억에 남은 곡
            <input value={songNames} onChange={(event) => { setSongNames(event.target.value); setIsSaved(false); }} placeholder="여러 곡은 쉼표로 구분" className="mt-2 w-full rounded-xl border border-line-strong px-4 py-3 text-sm outline-none focus:border-ink-muted" />
          </label>

          {errorMessage && <p role="alert" className="text-sm text-red-600">{errorMessage}</p>}
          <button type="button" disabled={!experienceStatus || isSaving} onClick={() => void save()} className={`${typography.button} ml-auto block rounded-xl bg-ink-secondary px-4 py-2.5 text-white disabled:opacity-50`}>
            {isSaving ? "저장 중" : isSaved ? "저장됨" : "저장"}
          </button>
        </div>
      )}
    </article>
  );
}
