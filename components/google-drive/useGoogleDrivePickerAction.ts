"use client";

import { useState } from "react";
import { getGoogleDriveApiHeaders, parseGoogleDriveApiError } from "@/lib/google-drive/clientAuth";
import type { GoogleDrivePickedFile } from "@/lib/google-drive/types";

type PickerOpener = (input: {
  accessToken: string;
  apiKey: string;
  appId: string;
  onPicked(files: GoogleDrivePickedFile[]): void;
  parentId?: string;
}) => Promise<void>;

export function useGoogleDrivePickerAction(opener: PickerOpener, fallbackErrorMessage: string) {
  const [isOpening, setIsOpening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function open(
    onPicked: (files: GoogleDrivePickedFile[]) => void,
    options: { parentId?: string } = {},
  ) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;
    const appId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID;
    if (!apiKey || !appId) {
      setErrorMessage("Google Drive 설정이 필요합니다.");
      return;
    }

    setIsOpening(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/google-drive/token", {
        method: "POST",
        headers: await getGoogleDriveApiHeaders(),
      });
      if (!response.ok) throw new Error(await parseGoogleDriveApiError(response));

      const { accessToken } = await response.json() as { accessToken: string };
      await opener({ accessToken, apiKey, appId, onPicked, ...options });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : fallbackErrorMessage);
    } finally {
      setIsOpening(false);
    }
  }

  return { open, isOpening, errorMessage };
}
