"use client";

import { useCallback, useEffect, useState } from "react";

import { useServiceAccess } from "@/components/access/ServiceAccessProvider";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  addFavoriteFestival,
  getIsFavoriteFestival,
  removeFavoriteFestival,
} from "@/lib/favorites/festivalFavorites";
import { supabase } from "@/lib/supabase/client";

export function useFavoriteFestival(festivalId: number) {
  const access = useServiceAccess();
  const [userId, setUserId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await getCurrentUser();
      setUserId(user?.id ?? null);
      setIsFavorite(user ? await getIsFavoriteFestival(user.id, festivalId) : false);
    } catch (error) {
      console.error("Failed to load favorite festival", error);
      setErrorMessage("관심 축제 상태를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [festivalId]);

  useEffect(() => {
    queueMicrotask(() => void load());
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      queueMicrotask(() => void load());
    });
    return () => subscription.unsubscribe();
  }, [load]);

  const toggle = useCallback(async () => {
    if (!userId || isSaving || !access.hasPersonalServiceAccess) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      if (isFavorite) {
        await removeFavoriteFestival(userId, festivalId);
        setIsFavorite(false);
      } else {
        await addFavoriteFestival(userId, festivalId);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Failed to update favorite festival", error);
      setErrorMessage("관심 축제 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }, [access.hasPersonalServiceAccess, festivalId, isFavorite, isSaving, userId]);

  return {
    isAuthenticated: Boolean(userId),
    isFavorite,
    isLoading,
    isSaving,
    errorMessage,
    toggle,
  };
}
