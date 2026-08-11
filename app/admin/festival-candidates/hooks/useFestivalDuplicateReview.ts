"use client";

import { useEffect, useState } from "react";

import {
  reviewFestivalDuplicates,
  type FestivalDuplicateReference,
  type FestivalDuplicateReview,
} from "@/lib/festivals/festivalDuplicateReview";
import { supabase } from "@/lib/supabase/client";
import type { FestivalDraftJson } from "@/lib/types";

export function useFestivalDuplicateReview(
  festival: FestivalDraftJson["festival"] | null,
) {
  const [review, setReview] = useState<FestivalDuplicateReview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const year = festival?.start_date.match(/^((?:19|20)\d{2})-/)?.[1];
    if (!festival || !year || (!festival.name.trim() && !festival.normalized_name.trim())) {
      queueMicrotask(() => {
        if (!cancelled) {
          setReview(null);
          setErrorMessage(null);
        }
      });
      return () => { cancelled = true; };
    }

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          setIsLoading(true);
          setErrorMessage(null);
          const nextReview = await loadFestivalDuplicateReview(festival);
          if (!cancelled) {
            setReview(nextReview);
          }
        } catch (error) {
          if (!cancelled) {
            setErrorMessage(error instanceof Error ? error.message : "유사 축제 확인에 실패했습니다.");
          }
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      })();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [festival]);

  async function refresh() {
    if (!festival) return null;
    const nextReview = await loadFestivalDuplicateReview(festival);
    setReview(nextReview);
    return nextReview;
  }

  return { review, isLoading, errorMessage, refresh };
}

async function loadFestivalDuplicateReview(
  festival: FestivalDraftJson["festival"],
): Promise<FestivalDuplicateReview | null> {
  const year = festival.start_date.match(/^((?:19|20)\d{2})-/)?.[1];
  if (!year || (!festival.name.trim() && !festival.normalized_name.trim())) return null;
  const { data, error } = await supabase
    .from("festivals")
    .select("id, name, normalized_name, search_aliases, start_date, end_date")
    .eq("verification_status", "approved")
    .gte("start_date", `${year}-01-01`)
    .lte("start_date", `${year}-12-31`);
  if (error) throw error;
  return reviewFestivalDuplicates(festival, (data ?? []) as FestivalDuplicateReference[]);
}
