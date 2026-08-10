"use client";

import { CalendarCheck2, CalendarPlus2 } from "lucide-react";

type ScheduleToggleButtonProps = {
  isSelected: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isDisabled?: boolean;
  artistName: string;
  onClick: () => void;
};

export default function ScheduleToggleButton({
  isSelected,
  isLoading,
  isSaving,
  isDisabled = false,
  artistName,
  onClick,
}: ScheduleToggleButtonProps) {
  const Icon = isSelected ? CalendarCheck2 : CalendarPlus2;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading || isSaving || isDisabled}
      aria-pressed={isSelected}
      aria-label={`${artistName} 공연 ${isSelected ? "내 일정에서 삭제" : "내 일정에 추가"}`}
      title={isDisabled ? "베타 이용권이 필요한 기능입니다." : `${artistName} 공연 ${isSelected ? "내 일정에서 삭제" : "내 일정에 추가"}`}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center transition-colors disabled:opacity-40 ${
        isSelected
          ? "text-blue-600"
          : "text-ink-muted hover:text-ink"
      }`}
    >
      <Icon className={`h-[18px] w-[18px] ${isSaving ? "animate-pulse" : ""}`} aria-hidden="true" />
    </button>
  );
}
