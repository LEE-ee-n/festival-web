"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { getGoogleDriveApiHeaders, parseGoogleDriveApiError } from "@/lib/google-drive/clientAuth";
import { openGoogleDrivePicker } from "@/lib/google-drive/googlePicker";
import type { GoogleDrivePickedFile } from "@/lib/google-drive/types";

export default function GoogleDrivePickerButton({ onPicked, disabled = false }: { onPicked(files: GoogleDrivePickedFile[]): void; disabled?: boolean }) {
  const [isOpening, setIsOpening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function open() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;
    const appId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID;
    if (!apiKey || !appId) { setErrorMessage("Google Drive 선택기 설정이 필요합니다."); return; }
    setIsOpening(true); setErrorMessage(null);
    try {
      const response = await fetch("/api/google-drive/token", { method: "POST", headers: await getGoogleDriveApiHeaders() });
      if (!response.ok) throw new Error(await parseGoogleDriveApiError(response));
      const { accessToken } = await response.json() as { accessToken: string };
      await openGoogleDrivePicker({ accessToken, apiKey, appId, onPicked });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Drive 파일을 선택하지 못했습니다.");
    } finally { setIsOpening(false); }
  }

  return <div>
    <button type="button" disabled={disabled || isOpening} onClick={() => void open()} className="inline-flex items-center gap-2 rounded-xl border border-line-strong px-3 py-2 text-sm font-semibold text-ink-secondary disabled:opacity-50">
      <ImagePlus className="h-4 w-4" />{isOpening ? "불러오는 중" : "Drive에서 추가"}
    </button>
    {errorMessage && <p role="alert" className="mt-2 text-sm text-red-600">{errorMessage}</p>}
  </div>;
}
