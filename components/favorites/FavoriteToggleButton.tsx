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
      className={`inline-flex h-[38px] w-[38px] items-center justify-start transition-colors disabled:opacity-50 sm:h-[42px] sm:w-[42px] ${
        isActive
          ? "text-red-500"
          : "text-ink-tertiary hover:text-ink-secondary"
      }`}
    >
      <Heart
        className="h-6 w-6"
        fill={isActive ? "currentColor" : "none"}
        aria-hidden="true"
      />
      <span className="sr-only">
        {isLoading
          ? "확인 중"
          : isSaving
            ? "저장 중"
            : isActive
              ? activeLabel
              : inactiveLabel}
      </span>
    </button>
  );
}
