import Image from "next/image";
import { RotateCw, Trash2 } from "lucide-react";

import type { ScheduleImageSticker } from "@/lib/schedule/scheduleImageSticker";
import { typography } from "@/lib/typography";

type ScheduleImageStickerControlsProps = {
  stickerCount: number;
  selectedSticker: ScheduleImageSticker | null;
  onAdd: () => void;
  onDelete: () => void;
};

export default function ScheduleImageStickerControls({
  stickerCount,
  selectedSticker,
  onAdd,
  onDelete,
}: ScheduleImageStickerControlsProps) {
  return (
    <section className="mt-5">
      <div className="flex items-center justify-between">
        <h3 className={`${typography.metaStrong} text-ink-secondary`}>스티커</h3>
        {stickerCount > 0 && (
          <span className={`${typography.meta} text-ink-tertiary`}>
            {stickerCount}개
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="mt-2 flex items-center gap-3 rounded-xl border border-line-strong px-3 py-2.5 text-left hover:bg-surface-subtle"
      >
        <span className="relative h-12 w-12 overflow-hidden rounded-lg bg-surface-muted">
          <Image
            src="/stickers/rock-cat.png"
            alt=""
            fill
            sizes="48px"
            className="object-contain"
          />
        </span>
        <span>
          <span className={`${typography.label} block text-ink`}>롹옹이 추가</span>
          <span className={`${typography.meta} mt-0.5 block text-ink-tertiary`}>
            여러 개 추가할 수 있습니다.
          </span>
        </span>
      </button>

      {selectedSticker && (
        <div className="mt-3 rounded-xl bg-surface-muted p-3">
          <p className={`${typography.metaStrong} text-ink-secondary`}>
            선택한 스티커 · {selectedSticker.label}
          </p>
          <p className={`${typography.meta} mt-1 flex items-center gap-1.5 text-ink-tertiary`}>
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
            본체 이동 · 오른쪽 아래 크기 · 위쪽 회전
          </p>
          <button
            type="button"
            onClick={onDelete}
            className={`${typography.metaStrong} mt-3 inline-flex items-center gap-1.5 text-red-600 hover:text-red-700`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            스티커 삭제
          </button>
        </div>
      )}
    </section>
  );
}
