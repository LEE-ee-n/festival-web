"use client";

import ScheduleToggleButton from "@/components/schedule/ScheduleToggleButton";
import {
  AUTH_RETURN_PATH_KEY,
  normalizeAuthReturnPath,
} from "@/lib/auth/authReturnPath";

type ScheduleItemButtonProps = {
  festivalArtistId: number;
  artistName: string;
  loginReturnPath: string;
  isAuthenticated: boolean;
  isSelected: boolean;
  isLoading: boolean;
  isSaving: boolean;
  onToggle: (festivalArtistId: number) => Promise<void>;
};

export default function ScheduleItemButton({
  festivalArtistId,
  artistName,
  loginReturnPath,
  isAuthenticated,
  isSelected,
  isLoading,
  isSaving,
  onToggle,
}: ScheduleItemButtonProps) {
  function requestLogin() {
    const returnPath = normalizeAuthReturnPath(loginReturnPath);

    if (returnPath) {
      window.sessionStorage.setItem(AUTH_RETURN_PATH_KEY, returnPath);
    }

    window.location.href = "/login";
  }

  return (
    <ScheduleToggleButton
      artistName={artistName}
      isSelected={isSelected}
      isLoading={isLoading}
      isSaving={isSaving}
      onClick={() => {
        if (!isAuthenticated) {
          requestLogin();
          return;
        }

        void onToggle(festivalArtistId);
      }}
    />
  );
}
