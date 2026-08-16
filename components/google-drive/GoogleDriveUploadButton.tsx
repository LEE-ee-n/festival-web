"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { getGoogleDriveApiHeaders, parseGoogleDriveApiError } from "@/lib/google-drive/clientAuth";
import { openGoogleDriveUploadPicker } from "@/lib/google-drive/googlePicker";
import type { GoogleDrivePickedFile } from "@/lib/google-drive/types";
import { useGoogleDrivePickerAction } from "./useGoogleDrivePickerAction";

export default function GoogleDriveUploadButton({ recordId, recordPerformanceId, onUploaded, disabled = false }: {
  recordId: number;
  recordPerformanceId?: number;
  onUploaded(files: GoogleDrivePickedFile[]): void;
  disabled?: boolean;
}) {
  const { open, isOpening, errorMessage } = useGoogleDrivePickerAction(
    openGoogleDriveUploadPicker,
    "Drive에 파일을 올리지 못했습니다.",
  );
  const [isPreparing, setIsPreparing] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);

  async function upload() {
    setIsPreparing(true);
    setFolderError(null);
    try {
      const response = await fetch("/api/google-drive/upload-folder", {
        method: "POST",
        headers: await getGoogleDriveApiHeaders(),
        body: JSON.stringify({ recordId, recordPerformanceId }),
      });
      if (!response.ok) throw new Error(await parseGoogleDriveApiError(response));
      const { folderId } = await response.json() as { folderId: string };
      await open(onUploaded, { parentId: folderId });
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : "페스티벌용 Drive 폴더를 준비하지 못했습니다.");
    } finally {
      setIsPreparing(false);
    }
  }

  return <div>
    <button type="button" disabled={disabled || isOpening || isPreparing} onClick={() => void upload()}
      className="inline-flex items-center gap-2 rounded-xl border border-line-strong px-3 py-2 text-sm font-semibold text-ink-secondary disabled:opacity-50">
      <Upload className="h-4 w-4" />{isOpening || isPreparing ? "올리는 중" : "Drive에 올리기"}
    </button>
    {errorMessage && <p role="alert" className="mt-2 text-sm text-red-600">{errorMessage}</p>}
    {folderError && <p role="alert" className="mt-2 text-sm text-red-600">{folderError}</p>}
  </div>;
}
