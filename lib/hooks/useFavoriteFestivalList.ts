"use client";

import { useCallback, useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  getFavoriteFestivalList,
  type FavoriteFestivalListItem,
} from "@/lib/favorites/festivalFavorites";
import { supabase } from "@/lib/supabase/client";

type FavoriteFestivalListState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  items: FavoriteFestivalListItem[];
  errorMessage: string | null;
  reload: () => Promise<void>;
};

export function useFavoriteFestivalList(): FavoriteFestivalListState {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<FavoriteFestivalListItem[]>([]);
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

      setItems(await getFavoriteFestivalList(user.id));
    } catch (error) {
      console.error("Failed to load favorite festival list", error);
      setErrorMessage("관심 축제 목록을 불러오지 못했습니다.");
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
