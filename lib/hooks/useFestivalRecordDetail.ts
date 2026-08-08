"use client";

import { useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getFestivalRecordDetail, type FestivalRecordDetail } from "@/lib/diaries/festivalDiaries";

export function useFestivalRecordDetail(recordId: number) {
  const [record, setRecord] = useState<FestivalRecordDetail | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const user = await getCurrentUser();
        if (cancelled) return;
        setIsAuthenticated(Boolean(user));
        if (user) setRecord(await getFestivalRecordDetail(user.id, recordId));
      } catch (error) {
        console.error("Failed to load festival record detail", error);
        if (!cancelled) setErrorMessage("페스티벌 기록을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [recordId]);

  return { record, isAuthenticated, isLoading, errorMessage };
}
