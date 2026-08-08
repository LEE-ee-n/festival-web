"use client";

import { useCallback, useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  getUserScheduleList,
  type UserScheduleListItem,
} from "@/lib/schedule/userScheduleItems";
import { supabase } from "@/lib/supabase/client";

type UserScheduleListState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  items: UserScheduleListItem[];
  errorMessage: string | null;
  reload: () => Promise<void>;
};

export function useUserScheduleList(): UserScheduleListState {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<UserScheduleListItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await getCurrentUser();
      setIsAuthenticated(Boolean(user));

      if (!user) {
        setItems([]);
        return;
      }

      setItems(await getUserScheduleList(user.id));
    } catch (error) {
      console.error("Failed to load user schedule list", error);
      setErrorMessage("선택한 공연 일정을 불러오지 못했습니다.");
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

  return { isAuthenticated, isLoading, items, errorMessage, reload };
}
