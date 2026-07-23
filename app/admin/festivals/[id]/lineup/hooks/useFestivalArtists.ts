import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import {
  buildLineupOperations,
  validateLineupWork,
  type LineupRound,
  type LineupWorkType,
} from "@/lib/audit/lineupWork";
import { applyLineupWork } from "@/lib/festivals/applyLineupWork";
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

export function useFestivalArtists(festivalId: number, setErrorMessage: SetErrorMessage) {
  const [rows, setRows] = useState<FestivalArtist[]>([]);
  const [originalRows, setOriginalRows] = useState<FestivalArtist[]>([]);
  const [savingArtistId, setSavingArtistId] = useState<number | null>(null);

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

  async function saveRow(row: FestivalArtist) {
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

  useEffect(() => {
    if (operations.length > 0 && operations.every((operation) => operation.operation === "delete")) {
      setWorkType("correction");
    }
  }, [operations]);

  async function saveLineupWork() {
    const input = { workType, lineupRound, announcementDate, sourceUrl, reason };
    const validationError = validateLineupWork(input);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    if (operations.length === 0) {
      setErrorMessage("저장할 라인업 변경이 없습니다.");
      return;
    }
    if (!window.confirm(`${operations.length}건의 라인업 변경을 하나의 ${workType === "announcement" ? "발표" : "정정"} 기록으로 저장하시겠습니까?`)) return;

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
    workPanelProps: {
      workType, setWorkType, lineupRound, setLineupRound,
      announcementDate, setAnnouncementDate, sourceUrl, setSourceUrl,
      reason, setReason, pendingCount: operations.length,
      saveLineupWork, isSavingWork,
    },
    tableProps: { rows, lineupByDateAndStage, updateRow, saveRow, deleteRow, savingArtistId },
  };
}
