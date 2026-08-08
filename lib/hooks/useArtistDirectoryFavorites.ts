"use client";

import { useCallback, useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  addFavoriteArtist,
  getFavoriteArtistList,
  removeFavoriteArtist,
} from "@/lib/favorites/artistFavorites";
import { supabase } from "@/lib/supabase/client";

export function useArtistDirectoryFavorites() {
  const [userId, setUserId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await getCurrentUser();
      setUserId(user?.id ?? null);

      if (!user) {
        setFavoriteIds(new Set());
        return;
      }

      const favorites = await getFavoriteArtistList(user.id);
      setFavoriteIds(new Set(favorites.map((artist) => artist.id)));
    } catch (error) {
      console.error("Failed to load artist directory favorites", error);
      setErrorMessage("좋아하는 아티스트 목록을 불러오지 못했습니다.");
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

  const toggle = useCallback(async (artistId: number) => {
    if (!userId || savingIds.has(artistId)) return;

    const wasFavorite = favoriteIds.has(artistId);
    setSavingIds((current) => new Set(current).add(artistId));
    setErrorMessage(null);

    try {
      if (wasFavorite) {
        await removeFavoriteArtist(userId, artistId);
      } else {
        await addFavoriteArtist(userId, artistId);
      }

      setFavoriteIds((current) => {
        const next = new Set(current);
        if (wasFavorite) next.delete(artistId);
        else next.add(artistId);
        return next;
      });
    } catch (error) {
      console.error("Failed to update artist directory favorite", error);
      setErrorMessage("좋아하는 아티스트 저장에 실패했습니다.");
    } finally {
      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(artistId);
        return next;
      });
    }
  }, [favoriteIds, savingIds, userId]);

  return {
    isAuthenticated: Boolean(userId),
    isLoading,
    favoriteIds,
    savingIds,
    errorMessage,
    toggle,
  };
}
