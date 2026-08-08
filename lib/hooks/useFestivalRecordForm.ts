"use client";

import { useCallback, useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getDefaultAttendedDate } from "@/lib/diaries/diaryDates";
import {
  deleteFestivalDiary,
  getFestivalLineupOptions,
  getFestivalRecordDetail,
  getFestivalRecordOptions,
  saveFestivalRecord,
  type FestivalLineupOption,
  type FestivalRecordOption,
} from "@/lib/diaries/festivalDiaries";

function todayInKorea() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
}

export function useFestivalRecordForm(recordId: number | null, initialFestivalId: number | null) {
  const [userId, setUserId] = useState<string | null>(null);
  const [options, setOptions] = useState<FestivalRecordOption[]>([]);
  const [lineup, setLineup] = useState<FestivalLineupOption[]>([]);
  const [festivalId, setFestivalId] = useState<number | null>(null);
  const [attendedDates, setAttendedDates] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [selectedPerformanceIds, setSelectedPerformanceIds] = useState<Set<number>>(new Set());
  const [recordedPerformanceIds, setRecordedPerformanceIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const user = await getCurrentUser();
        if (!user || cancelled) return;
        setUserId(user.id);
        const available = await getFestivalRecordOptions(user.id);

        if (recordId) {
          const record = await getFestivalRecordDetail(user.id, recordId);
          if (!record) throw new Error("기록을 찾을 수 없습니다.");
          const currentOption: FestivalRecordOption = {
            id: record.festivalId,
            name: record.festivalName,
            startDate: record.festivalStartDate,
            endDate: record.festivalEndDate,
            location: record.festivalLocation,
            thumbnailUrl: record.festivalThumbnailUrl,
          };
          const rows = await getFestivalLineupOptions(record.festivalId);
          if (cancelled) return;
          setOptions([currentOption, ...available.filter((item) => item.id !== currentOption.id)]);
          setFestivalId(record.festivalId);
          setAttendedDates(new Set(record.attendedDates));
          setSummary(record.summary);
          setCoverImageUrl(record.coverImageUrl);
          setLineup(rows);
          setSelectedPerformanceIds(new Set(record.performances.map((item) => item.id)));
          setRecordedPerformanceIds(new Set(record.performances
            .filter((item) => item.experienceStatus || item.memo || item.rating || item.songs.length > 0 || item.media.length > 0)
            .map((item) => item.id)));
        } else {
          const initial = available.find((item) => item.id === initialFestivalId) ?? available[0] ?? null;
          if (cancelled) return;
          setOptions(available);
          if (initial) {
            setFestivalId(initial.id);
            setAttendedDates(new Set([getDefaultAttendedDate(initial.startDate, initial.endDate, todayInKorea())]));
            setLineup(await getFestivalLineupOptions(initial.id));
          }
        }
      } catch (error) {
        console.error("Failed to load festival record form", error);
        if (!cancelled) setErrorMessage(error instanceof Error ? error.message : "기록 작성 정보를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [initialFestivalId, recordId]);

  const selectFestival = useCallback(async (nextFestivalId: number) => {
    const option = options.find((item) => item.id === nextFestivalId);
    if (!option) return;
    setFestivalId(nextFestivalId);
    setAttendedDates(new Set([getDefaultAttendedDate(option.startDate, option.endDate, todayInKorea())]));
    setSelectedPerformanceIds(new Set());
    setRecordedPerformanceIds(new Set());
    setLineup([]);
    setErrorMessage(null);
    try {
      setLineup(await getFestivalLineupOptions(nextFestivalId));
    } catch (error) {
      console.error("Failed to load festival lineup options", error);
      setErrorMessage("페스티벌 라인업을 불러오지 못했습니다.");
    }
  }, [options]);

  const togglePerformance = useCallback((id: number) => {
    const isRemoving = selectedPerformanceIds.has(id);
    if (isRemoving && recordedPerformanceIds.has(id) && !window.confirm("이 아티스트에 작성한 기록이 있습니다. 선택을 해제하고 다음을 누르면 해당 기록이 삭제됩니다.")) return;

    const next = new Set(selectedPerformanceIds);
    if (isRemoving) next.delete(id); else next.add(id);
    setSelectedPerformanceIds(next);
  }, [recordedPerformanceIds, selectedPerformanceIds]);

  const toggleAttendedDate = useCallback((date: string) => {
    setAttendedDates((current) => {
      const next = new Set(current);
      if (next.has(date)) next.delete(date); else next.add(date);
      return next;
    });
  }, []);

  const save = useCallback(async () => {
    if (!festivalId || attendedDates.size === 0 || !summary.trim() || isSaving) return null;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      return await saveFestivalRecord({
        recordId,
        festivalId,
        attendedDates: [...attendedDates].sort(),
        summary,
        coverImageUrl,
        festivalArtistIds: [...selectedPerformanceIds],
      });
    } catch (error) {
      console.error("Failed to save festival record", error);
      setErrorMessage("페스티벌 기록 저장에 실패했습니다.");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [attendedDates, coverImageUrl, festivalId, isSaving, recordId, selectedPerformanceIds, summary]);

  const remove = useCallback(async () => {
    if (!userId || !recordId || isSaving) return false;
    setIsSaving(true);
    try {
      await deleteFestivalDiary(userId, recordId);
      return true;
    } catch (error) {
      console.error("Failed to delete festival record", error);
      setErrorMessage("페스티벌 기록 삭제에 실패했습니다.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, recordId, userId]);

  const selectedFestival = options.find((item) => item.id === festivalId) ?? null;
  return {
    isAuthenticated: Boolean(userId), isLoading, isSaving, errorMessage,
    options, lineup, festivalId, selectedFestival, attendedDates, summary,
    selectedPerformanceIds, recordedPerformanceIds, setSummary, selectFestival, toggleAttendedDate,
    togglePerformance, save, remove,
  };
}
