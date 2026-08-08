"use client";

import { useCallback, useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  deleteFestivalDiary,
  getFestivalDiary,
  saveFestivalDiary,
  type FestivalDiaryRecord,
} from "@/lib/diaries/festivalDiaries";
import { supabase } from "@/lib/supabase/client";

type DiaryInput = {
  attendedDate: string;
  title: string;
  content: string;
};

export function useFestivalDiary(festivalId: number) {
  const [userId, setUserId] = useState<string | null>(null);
  const [diary, setDiary] = useState<FestivalDiaryRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await getCurrentUser();
      const nextUserId = user?.id ?? null;
      setUserId(nextUserId);
      setDiary(nextUserId ? await getFestivalDiary(nextUserId, festivalId) : null);
    } catch (error) {
      console.error("Failed to load festival diary", error);
      setErrorMessage("페스티벌 기록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [festivalId]);

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

  const save = useCallback(async (input: DiaryInput) => {
    if (!userId || isSaving) return null;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const saved = await saveFestivalDiary(
        userId,
        festivalId,
        diary?.id ?? null,
        input,
      );
      setDiary(saved);
      return saved;
    } catch (error) {
      console.error("Failed to save festival diary", error);
      setErrorMessage("페스티벌 기록 저장에 실패했습니다.");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [diary, festivalId, isSaving, userId]);

  const remove = useCallback(async () => {
    if (!userId || !diary || isSaving) return false;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await deleteFestivalDiary(userId, diary.id);
      setDiary(null);
      return true;
    } catch (error) {
      console.error("Failed to delete festival diary", error);
      setErrorMessage("페스티벌 기록 삭제에 실패했습니다.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [diary, isSaving, userId]);

  return {
    isAuthenticated: Boolean(userId),
    diary,
    isLoading,
    isSaving,
    errorMessage,
    save,
    remove,
  };
}
