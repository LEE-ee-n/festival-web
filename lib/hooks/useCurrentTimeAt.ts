"use client";

import { useEffect, useState } from "react";

const MAX_TIMEOUT_DELAY = 2_147_483_647;

export function useCurrentTimeAt(targetAt: string | null) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    if (!targetAt) {
      return;
    }

    const targetTime = new Date(targetAt).getTime();

    if (!Number.isFinite(targetTime) || currentTime >= targetTime) {
      return;
    }

    const refreshCurrentTime = () => {
      setCurrentTime(Date.now());
    };

    const remainingTime = Math.max(0, targetTime - Date.now());
    const timeoutId = window.setTimeout(
      refreshCurrentTime,
      Math.min(remainingTime, MAX_TIMEOUT_DELAY),
    );

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshCurrentTime();
      }
    };

    window.addEventListener("focus", refreshCurrentTime);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("focus", refreshCurrentTime);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [currentTime, targetAt]);

  return currentTime;
}
