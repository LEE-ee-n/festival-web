import { FESTIVAL_COLOR_OPTIONS } from "@/lib/festivalColor";
import type { FestivalCalendarColor } from "@/lib/types";
import { typography } from "@/lib/typography";

type ScheduleImageColorSelectorProps = {
  value: FestivalCalendarColor;
  onChange: (color: FestivalCalendarColor) => void;
};

export default function ScheduleImageColorSelector({
  value,
  onChange,
}: ScheduleImageColorSelectorProps) {
  return (
    <fieldset className="mt-5">
      <legend className={`${typography.metaStrong} mb-2 text-ink-secondary`}>
        강조색
      </legend>
      <div className="flex flex-wrap gap-3">
        {FESTIVAL_COLOR_OPTIONS.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-label={`${option.label} 강조색`}
              aria-pressed={isSelected}
              title={option.label}
              className={`h-9 w-9 rounded-full border transition-transform ${option.className} ${
                isSelected
                  ? "scale-110 border-ink ring-2 ring-ink ring-offset-2"
                  : "border-line-strong hover:scale-105"
              }`}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
