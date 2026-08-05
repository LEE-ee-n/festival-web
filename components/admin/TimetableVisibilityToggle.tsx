type TimetableVisibility = "published" | "unpublished";

type Props = {
  value: TimetableVisibility | undefined;
  onChange: (value: TimetableVisibility) => void;
  className?: string;
  disabled?: boolean;
};

const options: Array<{ value: TimetableVisibility; label: string }> = [
  { value: "published", label: "타임테이블 공개" },
  { value: "unpublished", label: "타임테이블 미공개" },
];

export default function TimetableVisibilityToggle({
  value,
  onChange,
  className = "",
  disabled = false,
}: Props) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`.trim()}>
      {options.map((option) => {
        const active =
          option.value === "unpublished"
            ? value === "unpublished"
            : value !== "unpublished";
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={
              active
                ? "rounded-lg bg-surface-dark px-4 py-2 text-sm font-bold text-white"
                : "rounded-lg border border-line-strong bg-surface px-4 py-2 text-sm font-bold text-ink-secondary"
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
