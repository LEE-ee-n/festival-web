import {
  FESTIVAL_COLOR_OPTIONS,
  getAutomaticFestivalColor,
} from "@/lib/festivalColor";
import type { FestivalCalendarColor } from "@/lib/types";

interface FestivalColorSelectorProps {
  festivalId: number;
  selectedColor: FestivalCalendarColor | null;
  disabled: boolean;
  onSelect: (color: FestivalCalendarColor | null) => void;
}

export default function FestivalColorSelector({
  festivalId,
  selectedColor,
  disabled,
  onSelect,
}: FestivalColorSelectorProps) {
  const automaticColor = getAutomaticFestivalColor(festivalId);
  const automaticOption = FESTIVAL_COLOR_OPTIONS.find(
    (option) => option.value === automaticColor,
  );

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => onSelect(null)}
        disabled={disabled}
        aria-label={`자동 색상${automaticOption ? `: ${automaticOption.label}` : ""}`}
        title={`자동${automaticOption ? ` (${automaticOption.label})` : ""}`}
        className={[
          "h-6 rounded border bg-surface px-1.5 text-[10px] font-semibold text-festival-night disabled:cursor-not-allowed disabled:opacity-40",
          selectedColor === null
            ? "border-festival-night"
            : "border-line-strong",
        ].join(" ")}
      >
        자동
      </button>

      {FESTIVAL_COLOR_OPTIONS.map((option) => {
        const isSelected = selectedColor === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            disabled={disabled}
            aria-label={`${option.label} 색상 선택`}
            title={option.label}
            className={[
              "h-5 w-5 rounded border disabled:cursor-not-allowed disabled:opacity-40",
              option.className,
              isSelected
                ? "border-festival-night ring-1 ring-festival-night"
                : "border-line-strong",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}
