"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useServiceAccess } from "@/components/access/ServiceAccessProvider";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  addScheduleItem,
  getSelectedScheduleItemIds,
  removeScheduleItem,
} from "@/lib/schedule/userScheduleItems";
import { supabase } from "@/lib/supabase/client";

export type ScheduleSelectionState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPersonalServiceAccess: boolean;
  errorMessage: string | null;
  isSelected: (festivalArtistId: number) => boolean;
  isSaving: (festivalArtistId: number) => boolean;
  toggle: (festivalArtistId: number) => Promise<void>;
};

export function useScheduleSelection(
  festivalArtistIds: number[],
): ScheduleSelectionState {
  const access = useServiceAccess();
  const idsKey = [...new Set(festivalArtistIds)].sort((a, b) => a - b).join(",");
  const normalizedIds = useMemo(
    () => (idsKey ? idsKey.split(",").map(Number) : []),
    [idsKey],
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await getCurrentUser();
      const nextUserId = user?.id ?? null;
      setUserId(nextUserId);

      if (!nextUserId) {
        setSelectedIds(new Set());
        return;
      }

      const ids = await getSelectedScheduleItemIds(nextUserId, normalizedIds);
      setSelectedIds(new Set(ids));
    } catch (error) {
      console.error("Failed to load selected schedule items", error);
      setErrorMessage("선택한 공연 일정을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [normalizedIds]);

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (!isCancelled) void reload();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      queueMicrotask(() => {
        if (!isCancelled) void reload();
      });
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
  }, [reload]);

  const toggle = useCallback(
    async (festivalArtistId: number) => {
      if (!userId || !access.hasPersonalServiceAccess || savingIds.has(festivalArtistId)) return;

      setSavingIds((current) => new Set(current).add(festivalArtistId));
      setErrorMessage(null);

      try {
        if (selectedIds.has(festivalArtistId)) {
          await removeScheduleItem(userId, festivalArtistId);
          setSelectedIds((current) => {
            const next = new Set(current);
            next.delete(festivalArtistId);
            return next;
          });
        } else {
          await addScheduleItem(userId, festivalArtistId);
          setSelectedIds((current) => new Set(current).add(festivalArtistId));
        }
      } catch (error) {
        console.error("Failed to update selected schedule item", error);
        setErrorMessage("공연 일정 저장에 실패했습니다.");
      } finally {
        setSavingIds((current) => {
          const next = new Set(current);
          next.delete(festivalArtistId);
          return next;
        });
      }
    },
    [access.hasPersonalServiceAccess, savingIds, selectedIds, userId],
  );

  return {
    isAuthenticated: Boolean(userId),
    isLoading,
    hasPersonalServiceAccess: access.hasPersonalServiceAccess,
    errorMessage,
    isSelected: (festivalArtistId) => selectedIds.has(festivalArtistId),
    isSaving: (festivalArtistId) => savingIds.has(festivalArtistId),
    toggle,
  };
}
