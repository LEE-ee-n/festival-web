"use client";

import { Upload } from "lucide-react";
import { openGoogleDriveUploadPicker } from "@/lib/google-drive/googlePicker";
import type { GoogleDrivePickedFile } from "@/lib/google-drive/types";
import { useGoogleDrivePickerAction } from "./useGoogleDrivePickerAction";

export default function GoogleDriveUploadButton({ onUploaded, disabled = false }: {
  onUploaded(files: GoogleDrivePickedFile[]): void;
  disabled?: boolean;
}) {
  const { open, isOpening, errorMessage } = useGoogleDrivePickerAction(
    openGoogleDriveUploadPicker,
    "Drive에 파일을 올리지 못했습니다.",
  );

  return <div>
    <button
      type="button"
      disabled={disabled || isOpening}
      onClick={() => void open(onUploaded)}
      className="inline-flex items-center gap-2 rounded-xl border border-line-strong px-3 py-2 text-sm font-semibold text-ink-secondary disabled:opacity-50"
    >
      <Upload className="h-4 w-4" />{isOpening ? "올리는 중" : "Drive에 올리기"}
    </button>
    {errorMessage && <p role="alert" className="mt-2 text-sm text-red-600">{errorMessage}</p>}
  </div>;
}
