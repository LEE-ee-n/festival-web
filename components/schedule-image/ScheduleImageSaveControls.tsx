import { Download } from "lucide-react";

import { typography } from "@/lib/typography";

type ScheduleImageSaveControlsProps = {
  isSaving: boolean;
  message: string | null;
  onSave: () => void;
};

export default function ScheduleImageSaveControls({
  isSaving,
  message,
  onSave,
}: ScheduleImageSaveControlsProps) {
  return (
    <>
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className={`${typography.button} flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 py-3.5 text-ink-secondary hover:bg-surface-subtle disabled:opacity-50`}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        {isSaving ? "이미지 만드는 중" : "현재 이미지 저장"}
      </button>
      {message && (
        <p className={`${typography.meta} mt-3 text-center text-ink-tertiary`}>
          {message}
        </p>
      )}
    </>
  );
}
