"use client";

import { Heart } from "lucide-react";

type FavoriteToggleButtonProps = {
  isActive: boolean;
  isLoading: boolean;
  isSaving: boolean;
  activeLabel: string;
  inactiveLabel: string;
  ariaLabel: string;
  onClick: () => void;
};

export default function FavoriteToggleButton({
  isActive,
  isLoading,
  isSaving,
  activeLabel,
  inactiveLabel,
  ariaLabel,
  onClick,
}: FavoriteToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading || isSaving}
      aria-pressed={isActive}
      aria-label={ariaLabel}
      className={`inline-flex h-[38px] items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors disabled:opacity-50 sm:h-[42px] ${
        isActive
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-line-strong bg-surface text-ink-secondary hover:text-ink"
      }`}
    >
      <Heart
        className="h-4 w-4"
        fill={isActive ? "currentColor" : "none"}
        aria-hidden="true"
      />
      {isLoading
        ? "확인 중"
        : isSaving
          ? "저장 중"
          : isActive
            ? activeLabel
            : inactiveLabel}
    </button>
  );
}
