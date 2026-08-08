import { useCallback, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import {
  buildLineupOperations,
  hasLineupArtistDateDuplicate,
  validateLineupWork,
  type LineupRound,
  type LineupWorkType,
} from "@/lib/audit/lineupWork";
import { applyLineupWork } from "@/lib/festivals/applyLineupWork";
import { validateLineupSchedule } from "@/lib/festivals/lineupScheduleValidation";
import {
  searchArtists,
  type ArtistSearchResult,
} from "@/lib/artists/searchArtists";
import { supabase } from "@/lib/supabase/client";
import type { FestivalArtist } from "@/lib/types";

type SetErrorMessage = Dispatch<SetStateAction<string | null>>;
type ArtistField = "performance_date" | "performance_time" | "performance_end_time" | "stage_name" | "status";

function getArtist(row: FestivalArtist) {
  return Array.isArray(row.artists) ? row.artists[0] : row.artists;
}

function prepareRows(lineup: FestivalArtist[]) {
  return lineup.map((row) => {
    const artist = getArtist(row);
    return {
      ...row,
      alias_text: (artist?.artist_aliases ?? []).map((alias) => alias.alias_name).join(", "),
      group_date: row.performance_date,
      group_stage: row.stage_name,
    };
  });
}

export function useFestivalArtists(
  festivalId: number,
  setErrorMessage: SetErrorMessage,
  festivalStartDate: string,
  festivalEndDate: string,
) {
  const [rows, setRows] = useState<FestivalArtist[]>([]);
  const [originalRows, setOriginalRows] = useState<FestivalArtist[]>([]);
  const [savingArtistId, setSavingArtistId] = useState<number | null>(null);
  const nextTemporaryId = useRef(-1);

  const [artistSearchQuery, setArtistSearchQuery] = useState("");
  const [artistSearchResults, setArtistSearchResults] = useState<
    ArtistSearchResult[]
  >([]);
  const [selectedArtist, setSelectedArtist] =
    useState<ArtistSearchResult | null>(null);
  const [isSearchingArtists, setIsSearchingArtists] = useState(false);
  const [hasSearchedArtists, setHasSearchedArtists] = useState(false);
  const [newPerformanceDate, setNewPerformanceDate] = useState("");
  const [newPerformanceTime, setNewPerformanceTime] = useState("");
  const [newPerformanceEndTime, setNewPerformanceEndTime] = useState("");
  const [newStageName, setNewStageName] = useState("");
  const [newStatus, setNewStatus] = useState("confirmed");

  const [workType, setWorkType] = useState<LineupWorkType>("announcement");
  const [lineupRound, setLineupRound] = useState<LineupRound>("unspecified");
  const [announcementDate, setAnnouncementDate] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [reason, setReason] = useState("");
  const [isSavingWork, setIsSavingWork] = useState(false);

  const initializeArtists = useCallback((lineup: FestivalArtist[]) => {
    const prepared = prepareRows(lineup);
    setRows(prepared);
    setOriginalRows(prepared);
  }, []);

  function updateRow(lineupId: number, field: ArtistField, value: string) {
    setRows((current) => current.map((row) => row.id === lineupId ? { ...row, [field]: value || null } : row));
  }

  async function searchForArtists() {
    const keyword = artistSearchQuery.trim();
    if (!keyword) {
      setErrorMessage("검색할 아티스트 이름을 입력해 주세요.");
      return;
    }

    try {
      setIsSearchingArtists(true);
      setHasSearchedArtists(true);
      setErrorMessage(null);
      setSelectedArtist(null);
      setArtistSearchResults(await searchArtists(keyword));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "아티스트 검색에 실패했습니다.",
      );
    } finally {
      setIsSearchingArtists(false);
    }
  }

  function updateArtistSearchQuery(value: string) {
    setArtistSearchQuery(value);
    setArtistSearchResults([]);
    setSelectedArtist(null);
    setHasSearchedArtists(false);
  }

  function chooseArtist(artist: ArtistSearchResult) {
    setSelectedArtist(artist);
    setArtistSearchQuery(artist.name);
    setArtistSearchResults([]);
    setErrorMessage(null);
  }

  function addSelectedArtist() {
    if (!selectedArtist) {
      setErrorMessage("추가할 기존 아티스트를 검색해서 선택해 주세요.");
      return;
    }
    const scheduleError = validateLineupSchedule({
      performanceDate: newPerformanceDate || null,
      performanceTime: newPerformanceTime || null,
      performanceEndTime: newPerformanceEndTime || null,
      festivalStartDate: festivalStartDate || null,
      festivalEndDate: festivalEndDate || null,
    });
    if (scheduleError) {
      setErrorMessage(scheduleError);
      return;
    }
    if (!newPerformanceDate && (newPerformanceTime || newPerformanceEndTime)) {
      setErrorMessage("공연 날짜를 입력해 주세요.");
      return;
    }
    if (
      newPerformanceTime &&
      newPerformanceEndTime &&
      newPerformanceEndTime <= newPerformanceTime
    ) {
      setErrorMessage("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }
    if (
      hasLineupArtistDateDuplicate(
        rows,
        selectedArtist.id,
        newPerformanceDate,
      )
    ) {
      setErrorMessage(
        "같은 아티스트가 같은 공연 날짜에 이미 등록되어 있습니다.",
      );
      return;
    }

    const temporaryId = nextTemporaryId.current;
    nextTemporaryId.current -= 1;
    const aliases = selectedArtist.aliases ?? [];
    const newRow: FestivalArtist = {
      id: temporaryId,
      artist_id: selectedArtist.id,
      input_name: selectedArtist.name,
      performance_date: newPerformanceDate,
      performance_time: newPerformanceTime || null,
      performance_end_time: newPerformanceEndTime || null,
      stage_name: newStageName.trim() || null,
      status: newStatus,
      artists: {
        id: selectedArtist.id,
        name: selectedArtist.name,
        normalized_name: selectedArtist.normalized_name,
        artist_aliases: aliases.map((alias_name) => ({ alias_name })),
      },
      alias_text: aliases.join(", "),
      group_date: newPerformanceDate,
      group_stage: newStageName.trim() || null,
    };

    setRows((current) => [...current, newRow]);
    setSelectedArtist(null);
    setArtistSearchQuery("");
    setArtistSearchResults([]);
    setNewPerformanceTime("");
    setNewPerformanceEndTime("");
    setErrorMessage(null);
  }

  async function saveRow(row: FestivalArtist) {
    const scheduleError = validateLineupSchedule({
      performanceDate: row.performance_date,
      performanceTime: row.performance_time,
      performanceEndTime: row.performance_end_time,
      festivalStartDate: festivalStartDate || null,
      festivalEndDate: festivalEndDate || null,
    });
    if (scheduleError) {
      setErrorMessage(scheduleError);
      return;
    }
    if (row.performance_time && row.performance_end_time && row.performance_end_time <= row.performance_time) {
      setErrorMessage("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    const input = { workType, lineupRound, announcementDate, sourceUrl, reason };
    const original = originalRows.find((item) => item.id === row.id);
    const rowOperations = buildLineupOperations(original ? [original] : [], [row]);
    if (rowOperations.length === 0) {
      setErrorMessage("저장할 일정 변경이 없습니다.");
      return;
    }
    const validationError = validateLineupWork(input);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setSavingArtistId(row.id);
      setErrorMessage(null);
      await applyLineupWork(festivalId, input, rowOperations);

      const savedRow = {
        ...row,
        group_date: row.performance_date,
        group_stage: row.stage_name,
      };
      setRows((current) => current.map((item) => item.id === row.id ? savedRow : item));
      setOriginalRows((current) => {
        const exists = current.some((item) => item.id === row.id);
        return exists
          ? current.map((item) => item.id === row.id ? savedRow : item)
          : [...current, savedRow];
      });
      window.alert("일정 변경사항을 저장했습니다.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "아티스트 변경사항 저장에 실패했습니다.");
    } finally {
      setSavingArtistId(null);
    }
  }

  async function deleteRow(row: FestivalArtist) {
    const artist = getArtist(row);
    if (!window.confirm(`${artist?.name ?? "아티스트"}를 라인업 작업 목록에서 삭제하시겠습니까?`)) return;
    setRows((current) => current.filter((item) => item.id !== row.id));
  }

  async function reloadLineup() {
    const { data, error } = await supabase
      .from("festival_artists")
      .select(`id, artist_id, performance_date, performance_time, performance_end_time, stage_name, status,
        artists (id, name, normalized_name, artist_aliases (alias_name))`)
      .eq("festival_id", festivalId)
      .order("performance_date", { ascending: true, nullsFirst: false })
      .order("performance_time", { ascending: true, nullsFirst: false });
    if (error) throw error;
    initializeArtists(data ?? []);
  }

  const operations = useMemo(() => buildLineupOperations(originalRows, rows), [originalRows, rows]);
  const effectiveWorkType: LineupWorkType =
    operations.length > 0 && operations.every((operation) => operation.operation === "delete")
      ? "correction"
      : workType;

  async function saveLineupWork() {
    const input = { workType: effectiveWorkType, lineupRound, announcementDate, sourceUrl, reason };
    const validationError = validateLineupWork(input);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    if (operations.length === 0) {
      setErrorMessage("저장할 라인업 변경이 없습니다.");
      return;
    }
    if (!window.confirm(`${operations.length}건의 라인업 변경을 하나의 ${effectiveWorkType === "announcement" ? "발표" : "정정"} 기록으로 저장하시겠습니까?`)) return;

    try {
      setIsSavingWork(true);
      setErrorMessage(null);
      await applyLineupWork(festivalId, input, operations);
      await reloadLineup();
      setReason("");
      window.alert("라인업 변경과 감사 로그가 함께 저장됐습니다.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "라인업 작업 저장에 실패했습니다.");
    } finally {
      setIsSavingWork(false);
    }
  }

  const lineupByDateAndStage = useMemo(() => {
    const groups = rows.reduce<Record<string, Record<string, FestivalArtist[]>>>((dateGroups, row) => {
      const date = row.group_date || "날짜 미정";
      const stage = row.group_stage?.trim() || "무대 미정";
      dateGroups[date] ??= {};
      dateGroups[date][stage] ??= [];
      dateGroups[date][stage].push(row);
      return dateGroups;
    }, {});
    Object.values(groups).forEach((stageGroups) => Object.values(stageGroups).forEach((artists) => {
      artists.sort((a, b) => !a.performance_time ? 1 : !b.performance_time ? -1 : a.performance_time.localeCompare(b.performance_time));
    }));
    return groups;
  }, [rows]);

  return {
    initializeArtists,
    addSectionProps: {
      artistSearchQuery,
      updateArtistSearchQuery,
      artistSearchResults,
      selectedArtist,
      isSearchingArtists,
      hasSearchedArtists,
      searchForArtists,
      chooseArtist,
      newPerformanceDate,
      setNewPerformanceDate,
      newPerformanceTime,
      setNewPerformanceTime,
      newPerformanceEndTime,
      setNewPerformanceEndTime,
      newStageName,
      setNewStageName,
      newStatus,
      setNewStatus,
      addSelectedArtist,
    },
    workPanelProps: {
      workType: effectiveWorkType, setWorkType, lineupRound, setLineupRound,
      announcementDate, setAnnouncementDate, sourceUrl, setSourceUrl,
      reason, setReason, pendingCount: operations.length,
      saveLineupWork, isSavingWork,
    },
    tableProps: { rows, lineupByDateAndStage, updateRow, saveRow, deleteRow, savingArtistId },
  };
}
