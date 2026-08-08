"use client";

import { useCallback, useEffect, useState } from "react";

import {
  addFavoriteArtist,
  getIsFavoriteArtist,
  removeFavoriteArtist,
} from "@/lib/favorites/artistFavorites";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { supabase } from "@/lib/supabase/client";

export type FavoriteArtistState = {
  isAuthenticated: boolean;
  isFavorite: boolean;
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  toggle: () => Promise<void>;
};

export function useFavoriteArtist(artistId: number): FavoriteArtistState {
  const [userId, setUserId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await getCurrentUser();

      const nextUserId = user?.id ?? null;
      setUserId(nextUserId);

      if (!nextUserId) {
        setIsFavorite(false);
        return;
      }

      setIsFavorite(await getIsFavoriteArtist(nextUserId, artistId));
    } catch (error) {
      console.error("Failed to load favorite artist", error);
      setErrorMessage("관심 상태를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [artistId]);

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (!isCancelled) void loadState();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      queueMicrotask(() => {
        if (!isCancelled) void loadState();
      });
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
  }, [loadState]);

  const toggle = useCallback(async () => {
    if (!userId || isSaving) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (isFavorite) {
        await removeFavoriteArtist(userId, artistId);
        setIsFavorite(false);
      } else {
        await addFavoriteArtist(userId, artistId);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Failed to update favorite artist", error);
      setErrorMessage("좋아하는 아티스트 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }, [artistId, isFavorite, isSaving, userId]);

  return {
    isAuthenticated: Boolean(userId),
    isFavorite,
    isLoading,
    isSaving,
    errorMessage,
    toggle,
  };
}
