"use client";

import { Check, Funnel } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { typography } from "@/lib/typography";

export type FestivalFilterOption<T extends string = string> = {
  value: T;
  label: string;
};

type FestivalFilterMenuProps<T extends string = string> = {
  title: string;
  options: FestivalFilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  renderTriggerLabel?: (value: T) => string;
  isActive?: boolean;
  desktopAlign?: "left" | "right";
};

export default function FestivalFilterMenu<
  T extends string = string,
>({
  title,
  options,
  value,
  onChange,
  renderTriggerLabel,
  isActive = false,
  desktopAlign = "left",
}: FestivalFilterMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const triggerLabel = renderTriggerLabel
    ? renderTriggerLabel(value)
    : `${title}: ${value}`;

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={triggerLabel}
        onClick={() => setOpen((previous) => !previous)}
        className={[
          "relative flex h-11 w-11 items-center justify-center rounded-xl border text-ink-secondary transition hover:bg-surface-muted hover:ring-1 hover:ring-slate-300",
          isActive
            ? "border-festival-night bg-surface-muted text-festival-night"
            : "border-transparent",
        ].join(" ")}
      >
        <Funnel size={22} strokeWidth={2} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={title}
          className={[
            "fixed inset-x-4 bottom-4 z-50 max-h-[calc(100dvh-2rem)] overflow-hidden rounded-2xl border border-line-strong bg-surface p-2 shadow-lg sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-[calc(100%+8px)] sm:z-30 sm:w-max sm:min-w-44 sm:max-w-[calc(100vw-2rem)]",
            desktopAlign === "right" ? "sm:right-0" : "sm:left-0",
          ].join(" ")}
        >
          <p className={`${typography.metaStrong} px-3 pb-1 pt-1.5 text-ink-muted`}>
            {title}
          </p>

          <div className="max-h-72 space-y-0.5 overflow-y-auto">
            {options.map((item) => {
              const isSelected = item.value === value;

              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className={[
                    `${typography.label} flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-festival-night transition-colors`,
                    isSelected
                      ? "border-line-strong"
                      : "border-transparent",
                  ].join(" ")}
                >
                  <span className="break-keep">{item.label}</span>

                  {isSelected && (
                    <Check size={16} aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
