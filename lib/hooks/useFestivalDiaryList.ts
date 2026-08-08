"use client";

import { useCallback, useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  getFestivalDiaryList,
  type FestivalDiaryListItem,
} from "@/lib/diaries/festivalDiaries";
import { supabase } from "@/lib/supabase/client";

export function useFestivalDiaryList() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [items, setItems] = useState<FestivalDiaryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await getCurrentUser();
      setIsAuthenticated(Boolean(user));
      setItems(user ? await getFestivalDiaryList(user.id) : []);
    } catch (error) {
      console.error("Failed to load festival diary list", error);
      setErrorMessage("페스티벌 기록 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  return { isAuthenticated, items, isLoading, errorMessage, reload };
}
