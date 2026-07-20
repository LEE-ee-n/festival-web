import { useCallback, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import {
  searchArtists,
  type ArtistSearchResult,
} from "@/lib/artists/searchArtists";
import { addFestivalArtist } from "@/lib/festivals/addFestivalArtist";
import { deleteFestivalArtist } from "@/lib/festivals/deleteFestivalArtist";
import { updateFestivalArtist } from "@/lib/festivals/updateFestivalArtist";
import { supabase } from "@/lib/supabase/client";
import type { FestivalArtist } from "@/lib/types";

type SetErrorMessage = Dispatch<SetStateAction<string | null>>;
type ArtistField =
  | "performance_date"
  | "performance_time"
  | "performance_end_time"
  | "stage_name"
  | "status";

type ArtistIdentityField = "name" | "normalized_name" | "aliases";

function getArtist(row: FestivalArtist) {
  return Array.isArray(row.artists) ? row.artists[0] : row.artists;
}

export function useFestivalArtists(
  festivalId: string,
  setErrorMessage: SetErrorMessage,
) {
  const [rows, setRows] = useState<FestivalArtist[]>([]);
  const [artistSearch, setArtistSearch] = useState("");
  const [artistResults, setArtistResults] = useState<
    ArtistSearchResult[]
  >([]);
  const [selectedArtist, setSelectedArtist] =
    useState<ArtistSearchResult | null>(null);
  const [isSearchingArtists, setIsSearchingArtists] =
    useState(false);
  const [newPerformanceDate, setNewPerformanceDate] = useState("");
  const [newPerformanceTime, setNewPerformanceTime] = useState("");
  const [newPerformanceEndTime, setNewPerformanceEndTime] =
    useState("");
  const [newStageName, setNewStageName] = useState("");
  const [isAddingArtist, setIsAddingArtist] = useState(false);
  const [savingArtistId, setSavingArtistId] = useState<
    number | null
  >(null);

  const initializeArtists = useCallback(
    (lineup: FestivalArtist[]) =>
      setRows(
        lineup.map((row) => {
          const artist = getArtist(row);
          return {
            ...row,
            alias_text: (artist?.artist_aliases ?? [])
              .map((alias) => alias.alias_name)
              .join(", "),
            group_date: row.performance_date,
            group_stage: row.stage_name,
          };
        }),
      ),
    [],
  );

  async function handleArtistSearch() {
    const keyword = artistSearch.trim();

    if (!keyword) {
      setErrorMessage("검색할 아티스트명을 입력하세요.");
      return;
    }

    try {
      setIsSearchingArtists(true);
      setErrorMessage(null);
      setArtistResults([]);
      setSelectedArtist(null);
      setArtistResults(await searchArtists(keyword));
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

  async function handleAddArtist() {
    if (!selectedArtist) {
      setErrorMessage("추가할 아티스트를 선택하세요.");
      return;
    }

    if (
      !window.confirm(
        `${selectedArtist.name}을(를) 라인업에 추가하시겠습니까?`,
      )
    ) {
      return;
    }

    if (
      newPerformanceTime &&
      newPerformanceEndTime &&
      newPerformanceEndTime <= newPerformanceTime
    ) {
      setErrorMessage("종료시간은 시작시간보다 늦어야 합니다.");
      return;
    }

    try {
      setIsAddingArtist(true);
      setErrorMessage(null);
      const { data: linkedArtist, error: linkedArtistError } =
        await supabase
          .from("artists")
          .select(`
            id,
            name,
            normalized_name,
            artist_aliases (
              alias_name
            )
          `)
          .eq("id", selectedArtist.id)
          .single();

      if (linkedArtistError) throw linkedArtistError;

      const createdLineup = await addFestivalArtist(festivalId, {
        artistId: selectedArtist.id,
        performanceDate: newPerformanceDate,
        performanceTime: newPerformanceTime,
        performanceEndTime: newPerformanceEndTime,
        stageName: newStageName,
        status: "confirmed",
      });

      setRows((currentRows) => [
        ...currentRows,
        {
          id: createdLineup.id,
          artist_id: selectedArtist.id,
          performance_date: newPerformanceDate || null,
          performance_time: newPerformanceTime || null,
          performance_end_time: newPerformanceEndTime || null,
          stage_name: newStageName.trim() || null,
          status: "confirmed",
          alias_text: (linkedArtist.artist_aliases ?? [])
            .map((alias) => alias.alias_name)
            .join(", "),
          group_date: newPerformanceDate || null,
          group_stage: newStageName.trim() || null,
          artists: {
            id: linkedArtist.id,
            name: linkedArtist.name,
            normalized_name: linkedArtist.normalized_name,
            artist_aliases: linkedArtist.artist_aliases ?? [],
          },
        },
      ]);

      setArtistSearch("");
      setArtistResults([]);
      setSelectedArtist(null);
      setNewPerformanceDate("");
      setNewPerformanceTime("");
      setNewPerformanceEndTime("");
      setNewStageName("");
      window.alert("라인업에 정상적으로 추가되었습니다.");
    } catch (error) {
      const supabaseError = error as {
        code?: string;
        message?: string;
      };
      setErrorMessage(
        supabaseError.code === "23505"
          ? "이미 이 페스티벌 라인업에 등록된 아티스트입니다."
          : supabaseError.message || "아티스트 추가에 실패했습니다.",
      );
    } finally {
      setIsAddingArtist(false);
    }
  }

  function updateRow(
    lineupId: number,
    field: ArtistField,
    value: string,
  ) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === lineupId
          ? { ...row, [field]: value || null }
          : row,
      ),
    );
  }

  function updateArtistIdentity(
    lineupId: number,
    field: ArtistIdentityField,
    value: string,
  ) {
    setRows((currentRows) => {
      const sourceRow = currentRows.find((row) => row.id === lineupId);
      const sourceArtist = sourceRow ? getArtist(sourceRow) : null;

      return currentRows.map((row) => {
        const artist = getArtist(row);
        if (!sourceArtist || artist?.id !== sourceArtist.id) return row;

        if (!artist) return row;

        const updatedArtist = field === "aliases"
          ? artist
          : { ...artist, [field]: value };

        return {
          ...row,
          artists: updatedArtist,
          ...(field === "aliases" ? { alias_text: value } : {}),
        };
      });
    });
  }

  async function saveRow(row: FestivalArtist) {
    setErrorMessage(null);

    if (
      row.performance_time &&
      row.performance_end_time &&
      row.performance_end_time <= row.performance_time
    ) {
      setErrorMessage("종료시간은 시작시간보다 늦어야 합니다.");
      return;
    }

    const artist = getArtist(row);

    if (!artist?.name.trim()) {
      setErrorMessage("표시 이름을 입력하세요.");
      return;
    }

    if (!/^[a-z0-9]+$/.test(artist.normalized_name.trim())) {
      setErrorMessage(
        "normalized_name은 영문 소문자와 숫자로 입력해 주세요.",
      );
      return;
    }

    if (
      !window.confirm(
        `${artist?.name ?? "아티스트"}의 라인업 정보를 저장하시겠습니까?`,
      )
    ) {
      return;
    }

    try {
      setSavingArtistId(row.id);
      setErrorMessage(null);
      const aliases = [
        ...new Set(
          (row.alias_text ?? "")
            .split(",")
            .map((alias) => alias.trim())
            .filter(Boolean),
        ),
      ];
      const { error: artistError } = await supabase.rpc(
        "update_artist_admin",
        {
          p_artist_id: artist.id,
          p_name: artist.name.trim(),
          p_normalized_name: artist.normalized_name.trim(),
          p_aliases: aliases,
        },
      );

      if (artistError) throw artistError;
      await updateFestivalArtist(festivalId, row);
      setRows((currentRows) =>
        currentRows.map((item) =>
          item.id === row.id
            ? {
                ...item,
                group_date: item.performance_date,
                group_stage: item.stage_name,
              }
            : item,
        ),
      );
      window.alert("아티스트 정보와 공연 일정이 저장되었습니다.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "라인업 수정에 실패했습니다.",
      );
    } finally {
      setSavingArtistId(null);
    }
  }

  async function deleteRow(row: FestivalArtist) {
    const artist = Array.isArray(row.artists)
      ? row.artists[0]
      : row.artists;

    if (
      !window.confirm(
        `${artist?.name ?? "아티스트"}를 라인업에서 삭제하시겠습니까?`,
      )
    ) {
      return;
    }

    try {
      setSavingArtistId(row.id);
      setErrorMessage(null);
      await deleteFestivalArtist(festivalId, row.id);
      setRows((currentRows) =>
        currentRows.filter(
          (item) => item.id !== row.id,
        ),
      );
      window.alert("라인업에서 삭제되었습니다.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "라인업 삭제에 실패했습니다.",
      );
    } finally {
      setSavingArtistId(null);
    }
  }

  const lineupByDateAndStage = useMemo(() => {
    const groups = rows.reduce<
      Record<string, Record<string, FestivalArtist[]>>
    >((dateGroups, row) => {
      const date = row.group_date || "날짜 미정";
      const stage = row.group_stage?.trim() || "무대 미정";

      dateGroups[date] ??= {};
      dateGroups[date][stage] ??= [];
      dateGroups[date][stage].push(row);
      return dateGroups;
    }, {});

    Object.values(groups).forEach((stageGroups) => {
      Object.values(stageGroups).forEach((artists) => {
        artists.sort((a, b) => {
          if (!a.performance_time && !b.performance_time) return 0;
          if (!a.performance_time) return 1;
          if (!b.performance_time) return -1;
          return a.performance_time.localeCompare(b.performance_time);
        });
      });
    });

    return groups;
  }, [rows]);

  return {
    initializeArtists,
    addSectionProps: {
      artistSearch,
      setArtistSearch,
      artistResults,
      selectedArtist,
      setSelectedArtist,
      handleArtistSearch,
      isSearchingArtists,
      newPerformanceDate,
      setNewPerformanceDate,
      newPerformanceTime,
      setNewPerformanceTime,
      newPerformanceEndTime,
      setNewPerformanceEndTime,
      newStageName,
      setNewStageName,
      handleAddArtist,
      isAddingArtist,
    },
    tableProps: {
      rows,
      lineupByDateAndStage,
      updateRow,
      updateArtistIdentity,
      saveRow,
      deleteRow,
      savingArtistId,
    },
  };
}
