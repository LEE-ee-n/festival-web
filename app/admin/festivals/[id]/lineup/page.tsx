"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";

type FestivalArtist = {
  artist_id: number;
  performance_date: string | null;
  performance_time: string | null;
  performance_end_time: string | null;
  stage_name: string | null;
  status: string;
  artists:
    | {
        id: number;
        name: string;
      }
    | {
        id: number;
        name: string;
      }[]
    | null;
};

type ArtistSearchResult = {
  id: number;
  name: string;
  normalized_name: string;
  similarity_score: number;
};

type FestivalTicketRound = {
  id: number;
  round_type: string | null;
  round_name: string;
  open_at: string | null;
  price_info: string | null;
  ticket_url: string | null;
  ticket_platform: string | null;
};

export default function FestivalLineupAdminPage() {
  const params = useParams<{ id: string }>();
  const festivalId = params.id;

  const [artistSearch, setArtistSearch] = useState("");
  const [artistResults, setArtistResults] = useState<
    ArtistSearchResult[]
  >([]);
  const [selectedArtist, setSelectedArtist] =
    useState<ArtistSearchResult | null>(null);
  const [isSearchingArtists, setIsSearchingArtists] =
    useState(false);

  const [isSavingBasic, setIsSavingBasic] =
    useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] =
  useState(false);
  const [thumbnailFile, setThumbnailFile] =
    useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] =
    useState("");
    
  const [festivalName, setFestivalName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [priceType, setPriceType] = useState("");
  const [priceInfo, setPriceInfo] = useState("");
  const [programInfo, setProgramInfo] = useState("");
  const [festivalStatus, setFestivalStatus] = useState("");
  const [activeTab, setActiveTab] = useState<
    "basic" | "lineup" | "ticket"
  >("basic");

  const [rows, setRows] = useState<FestivalArtist[]>([]);
  const [ticketRounds, setTicketRounds] = useState<
    FestivalTicketRound[]
  >([]);

  const [newRoundType, setNewRoundType] =
  useState("regular");

  const [newRoundName, setNewRoundName] =
    useState("");

  const [newOpenAt, setNewOpenAt] =
    useState("");

  const [newPriceInfo, setNewPriceInfo] =
    useState("");

  const [newTicketPlatform, setNewTicketPlatform] =
    useState("");

  const [newTicketUrl, setNewTicketUrl] =
    useState("");

  const [isAddingTicket, setIsAddingTicket] =
    useState(false);

  const [savingTicketId, setSavingTicketId] = useState<
    number | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingArtistId, setSavingArtistId] = useState<
    number | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);

  const [newPerformanceDate, setNewPerformanceDate] =
  useState("");
  const [newPerformanceTime, setNewPerformanceTime] =
    useState("");
  const [newPerformanceEndTime, setNewPerformanceEndTime] =
    useState("");
  const [newStageName, setNewStageName] =
    useState("");
  const [newStatus, setNewStatus] =
    useState("confirmed");
  const [isAddingArtist, setIsAddingArtist] =
    useState(false);

  useEffect(() => {
    async function loadLineup() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [
          festivalResult,
          lineupResult,
          ticketRoundsResult,
        ] = await Promise.all([
            supabase
              .from("festivals")
              .select(`
                name,
                start_date,
                end_date,
                location,
                address,
                region,
                category,
                description,
                thumbnail_url,
                official_url,
                price_type,
                price_info,
                program_info,
                status
              `)
              .eq("id", festivalId)
              .single(),

            supabase
              .from("festival_artists")
              .select(`
                artist_id,
                performance_date,
                performance_time,
                performance_end_time,
                stage_name,
                status,
                artists (
                  id,
                  name
                )
              `)
              .eq("festival_id", festivalId)
              .order("performance_date", {
                ascending: true,
                nullsFirst: false,
              })
              .order("performance_time", {
                ascending: true,
                nullsFirst: false,
              }),

              supabase
                .from("festival_ticket_rounds")
                .select(`
                  id,
                  round_type,
                  round_name,
                  open_at,
                  price_info,
                  ticket_url,
                  ticket_platform
                `)
                .eq("festival_id", festivalId)
                .order("open_at", {
                  ascending: false,
                  nullsFirst: false,
                }),
          ]);

        if (festivalResult.error) {
          throw festivalResult.error;
        }

        if (lineupResult.error) {
          throw lineupResult.error;
        }

        if (ticketRoundsResult.error) {
          throw ticketRoundsResult.error;
        }

        setFestivalName(festivalResult.data.name);
        setStartDate(festivalResult.data.start_date ?? "");
        setEndDate(festivalResult.data.end_date ?? "");
        setLocation(festivalResult.data.location ?? "");
        setAddress(festivalResult.data.address ?? "");
        setRegion(festivalResult.data.region ?? "");
        setCategory(festivalResult.data.category ?? "");
        setDescription(festivalResult.data.description ?? "");
        setThumbnailUrl(festivalResult.data.thumbnail_url ?? "");
        setOfficialUrl(festivalResult.data.official_url ?? "");
        setPriceType(festivalResult.data.price_type ?? "");
        setPriceInfo(festivalResult.data.price_info ?? "");
        setProgramInfo(festivalResult.data.program_info ?? "");
        setFestivalStatus(festivalResult.data.status ?? "");
        setRows(
          (lineupResult.data ?? []) as FestivalArtist[],
        );
        setTicketRounds(
          (ticketRoundsResult.data ?? []) as FestivalTicketRound[],
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "라인업을 불러오지 못했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadLineup();
  }, [festivalId]);

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

      // 1. 아티스트 대표 이름 부분 검색
      const { data: nameMatches, error: nameError } =
        await supabase
          .from("artists")
          .select(`
            id,
            name,
            normalized_name
          `)
          .ilike("name", `%${keyword}%`)
          .limit(20);

      if (nameError) {
        throw nameError;
      }

      // 2. 별칭 부분 검색
      const { data: aliasMatches, error: aliasError } =
        await supabase
          .from("artist_aliases")
          .select(`
            artist_id,
            artists!inner (
              id,
              name,
              normalized_name
            )
          `)
          .ilike("alias_name", `%${keyword}%`)
          .limit(20);

      if (aliasError) {
        throw aliasError;
      }

      const directResults: ArtistSearchResult[] = [
        ...(nameMatches ?? []).map((artist) => ({
          id: artist.id,
          name: artist.name,
          normalized_name: artist.normalized_name,
          similarity_score: 1,
        })),

        ...(aliasMatches ?? []).flatMap((row) => {
          const artist = Array.isArray(row.artists)
            ? row.artists[0]
            : row.artists;

          return artist
            ? [
                {
                  id: artist.id,
                  name: artist.name,
                  normalized_name: artist.normalized_name,
                  similarity_score: 1,
                },
              ]
            : [];
        }),
      ];

      // 중복 제거
      const uniqueDirectResults = Array.from(
        new Map(
          directResults.map((artist) => [
            artist.id,
            artist,
          ]),
        ).values(),
      );

      if (uniqueDirectResults.length > 0) {
        setArtistResults(uniqueDirectResults);
        return;
      }

      // 3. 부분 검색 결과가 없으면 기존 유사도 검색
      const { data, error } = await supabase.rpc(
        "search_similar_artists",
        {
          input_name: keyword,
        },
      );

      if (error) {
        throw error;
      }

      setArtistResults(
        (data ?? []) as ArtistSearchResult[],
      );
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
    const confirmed = window.confirm(
      `${selectedArtist.name}을 라인업에 추가하시겠습니까?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsAddingArtist(true);
      setErrorMessage(null);

      if (
        newPerformanceTime &&
        newPerformanceEndTime &&
        newPerformanceEndTime <= newPerformanceTime
      ) {
        setErrorMessage(
          "종료시간은 시작시간보다 늦어야 합니다.",
        );
        return;
      }

      const { error } = await supabase
        .from("festival_artists")
        .insert({
          festival_id: Number(festivalId),
          artist_id: selectedArtist.id,
          performance_date: newPerformanceDate || null,
          performance_time: newPerformanceTime || null,
          performance_end_time:  newPerformanceEndTime || null,
          stage_name: newStageName.trim() || null,
          status: newStatus,
        });

      if (error) {
        throw error;
      }

      setRows((currentRows) => [
        ...currentRows,
        {
          artist_id: selectedArtist.id,
          performance_date: newPerformanceDate || null,
          performance_time: newPerformanceTime || null,
          performance_end_time: newPerformanceEndTime || null,
          stage_name: newStageName.trim() || null,
          status: newStatus,
          artists: {
            id: selectedArtist.id,
            name: selectedArtist.name,
          },
        },
      ]);

      setArtistSearch("");
      setArtistResults([]);
      setSelectedArtist(null);
      setNewPerformanceDate("");
      setNewPerformanceTime("");
      setNewStageName("");
      setNewStatus("confirmed");
      window.alert("라인업에 정상적으로 추가되었습니다.");
    } catch (error) {
      const supabaseError = error as {
        code?: string;
        message?: string;
      };

      setErrorMessage(
        supabaseError.code === "23505"
          ? "이미 이 페스티벌 라인업에 등록된 아티스트입니다."
          : supabaseError.message ||
              "아티스트 추가에 실패했습니다.",
      );
    } finally {
      setIsAddingArtist(false);
    }
  }

  async function handleAddTicket() {
  if (!newRoundName.trim()) {
    setErrorMessage("티켓 표시 이름을 입력하세요.");
    return;
  }

  if (!newOpenAt) {
    setErrorMessage("티켓 오픈 날짜와 시간을 입력하세요.");
    return;
  }

  const confirmed = window.confirm(
    `${newRoundName.trim()} 티켓 정보를 추가하시겠습니까?`,
  );

  if (!confirmed) {
    return;
  }

  try {
    setIsAddingTicket(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("festival_ticket_rounds")
      .insert({
        festival_id: Number(festivalId),
        round_type: newRoundType,
        round_name: newRoundName.trim(),
        open_at: new Date(newOpenAt).toISOString(),
        price_info: newPriceInfo.trim() || null,
        ticket_platform:
          newTicketPlatform.trim() || null,
        ticket_url: newTicketUrl.trim() || null,
      })
      .select(`
        id,
        round_type,
        round_name,
        open_at,
        price_info,
        ticket_url,
        ticket_platform
      `)
      .single();

    if (error) {
      throw error;
    }

    setTicketRounds((currentRounds) =>
      [data as FestivalTicketRound, ...currentRounds].sort(
        (a, b) =>
          new Date(b.open_at ?? 0).getTime() -
          new Date(a.open_at ?? 0).getTime(),
      ),
    );

    setNewRoundType("regular");
    setNewRoundName("");
    setNewOpenAt("");
    setNewPriceInfo("");
    setNewTicketPlatform("");
    setNewTicketUrl("");

    window.alert("티켓 정보가 정상적으로 추가되었습니다.");
    } catch (error) {
    console.error("티켓 추가 오류:", error);

    const supabaseError = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    setErrorMessage(
      [
        supabaseError.message,
        supabaseError.details,
        supabaseError.hint,
        supabaseError.code,
      ]
        .filter(Boolean)
        .join(" / ") || "티켓 추가에 실패했습니다.",
    );
  } finally {
    setIsAddingTicket(false);
  }
}

  

  function updateRow(
    artistId: number,
    field:
      | "performance_date"
      | "performance_time"
      | "performance_end_time"
      | "stage_name"
      | "status",
    value: string,
  ) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.artist_id === artistId
          ? {
              ...row,
              [field]: value || null,
            }
          : row,
      ),
    );
  }

  function updateTicketRound(
    ticketId: number,
    field:
      | "round_type"
      | "round_name"
      | "open_at"
      | "price_info"
      | "ticket_url"
      | "ticket_platform",
    value: string,
  ) {
    setTicketRounds((currentRounds) =>
      currentRounds.map((round) =>
        round.id === ticketId
          ? {
              ...round,
              [field]: value || null,
            }
          : round,
      ),
    );
  }

  async function uploadThumbnail() {
    if (!thumbnailFile) {
      setErrorMessage("업로드할 이미지를 선택하세요.");
      return;
    }

    if (!thumbnailFile.type.startsWith("image/")) {
      setErrorMessage("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    try {
      setIsUploadingThumbnail(true);
      setErrorMessage(null);

      const extension =
        thumbnailFile.name.split(".").pop() || "webp";

      const filePath =
        `${festivalId}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("festival-thumbnails")
        .upload(filePath, thumbnailFile, {
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("festival-thumbnails")
        .getPublicUrl(filePath);

      setThumbnailUrl(data.publicUrl);
      setThumbnailFile(null);

      window.alert(
        "썸네일이 업로드되었습니다. 기본정보 저장을 눌러 반영하세요.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "썸네일 업로드에 실패했습니다.",
      );
    } finally {
      setIsUploadingThumbnail(false);
    }
  }

  async function deleteThumbnail() {
    if (!thumbnailUrl) {
      return;
    }

    const confirmed = window.confirm(
      "등록된 썸네일을 삭제하시겠습니까?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage(null);

      const bucketPath = "/festival-thumbnails/";
      const pathIndex = thumbnailUrl.indexOf(bucketPath);

      if (pathIndex !== -1) {
        const filePath = decodeURIComponent(
          thumbnailUrl.slice(pathIndex + bucketPath.length),
        );

        const { error: deleteError } = await supabase.storage
          .from("festival-thumbnails")
          .remove([filePath]);

        if (deleteError) {
          throw deleteError;
        }
      }

      const { error: updateError } = await supabase
        .from("festivals")
        .update({
          thumbnail_url: null,
        })
        .eq("id", festivalId);

      if (updateError) {
        throw updateError;
      }

      setThumbnailUrl("");
      setThumbnailFile(null);
      setThumbnailPreview("");

      window.alert("썸네일이 삭제되었습니다.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "썸네일 삭제에 실패했습니다.",
      );
    }
  }

  async function saveBasicInfo() {
    if (!festivalName.trim()) {
      setErrorMessage("축제명을 입력하세요.");
      return;
    }

    const confirmed = window.confirm(
      "축제 기본정보를 저장하시겠습니까?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsSavingBasic(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("festivals")
        .update({
          name: festivalName.trim(),
          start_date: startDate || null,
          end_date: endDate || null,
          location: location.trim() || null,
          address: address.trim() || null,
          region: region.trim() || null,
          category: category.trim() || null,
          description: description.trim() || null,
          thumbnail_url: thumbnailUrl.trim() || null,
          official_url: officialUrl.trim() || null,
          price_type: priceType || null,
          price_info: priceInfo.trim() || null,
          program_info: programInfo.trim() || null,
          status: festivalStatus || null,
        })
        .eq("id", festivalId)
        .select("id");

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(
          "수정된 데이터가 없습니다. festivals 테이블의 UPDATE 권한을 확인하세요.",
        );
      }

      window.alert("축제 기본정보가 저장되었습니다.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "기본정보 저장에 실패했습니다.",
      );
    } finally {
      setIsSavingBasic(false);
    }
  }

  

  async function saveRow(row: FestivalArtist) {
    setErrorMessage(null);

    if (
      row.performance_time &&
      row.performance_end_time &&
      row.performance_end_time <= row.performance_time
    ) {
      setErrorMessage(
        "종료시간은 시작시간보다 늦어야 합니다.",
      );
      return;
    }

    const artist = Array.isArray(row.artists)
      ? row.artists[0]
      : row.artists;

    const confirmed = window.confirm(
      `${artist?.name ?? "아티스트"}의 라인업 정보를 저장하시겠습니까?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSavingArtistId(row.artist_id);
      setErrorMessage(null);
    
    if (
      row.performance_time &&
      row.performance_end_time &&
      row.performance_end_time <= row.performance_time
    ) {
      setErrorMessage(
        "종료시간은 시작시간보다 늦어야 합니다.",
      );
      return;
    }

      const { error } = await supabase
        .from("festival_artists")
        .update({
          performance_date: row.performance_date,
          performance_time: row.performance_time,
          performance_end_time: row.performance_end_time,
          stage_name: row.stage_name,
          status: row.status,
        })
        
        .eq("festival_id", festivalId)
        .eq("artist_id", row.artist_id);

      if (error) {
        throw error;
      }

      window.alert("라인업 정보가 저장되었습니다.");

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

  async function saveTicketRound(round: FestivalTicketRound) {
    const confirmed = window.confirm(
      `${round.round_name} 티켓 정보를 저장하시겠습니까?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSavingTicketId(round.id);
      setErrorMessage(null);

      const { error } = await supabase
        .from("festival_ticket_rounds")
        .update({
          round_type: round.round_type,
          round_name: round.round_name,
          open_at: round.open_at,
          price_info: round.price_info,
          ticket_url: round.ticket_url,
          ticket_platform: round.ticket_platform,
        })
        .eq("id", round.id)
        .eq("festival_id", festivalId);

      if (error) {
        throw error;
      }

      window.alert("티켓 정보가 정상적으로 저장되었습니다.");
    } catch (error) {
      const supabaseError = error as {
        message?: string;
        details?: string;
        hint?: string;
        code?: string;
      };

      setErrorMessage(
        [
          supabaseError.message,
          supabaseError.details,
          supabaseError.hint,
          supabaseError.code,
        ]
          .filter(Boolean)
          .join(" / ") || "티켓 저장에 실패했습니다.",
      );
    } finally {
      setSavingTicketId(null);
    }
  }

  async function deleteTicketRound(
    round: FestivalTicketRound,
  ) {
    const confirmed = window.confirm(
      `${round.round_name} 티켓 정보를 삭제하시겠습니까?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSavingTicketId(round.id);
      setErrorMessage(null);

      const { error } = await supabase
        .from("festival_ticket_rounds")
        .delete()
        .eq("id", round.id)
        .eq("festival_id", festivalId);

      if (error) {
        throw error;
      }

      setTicketRounds((currentRounds) =>
        currentRounds.filter(
          (item) => item.id !== round.id,
        ),
      );

      window.alert("티켓 정보가 정상적으로 삭제되었습니다.");
    } catch (error) {
      const supabaseError = error as {
        message?: string;
        details?: string;
        hint?: string;
        code?: string;
      };

      setErrorMessage(
        [
          supabaseError.message,
          supabaseError.details,
          supabaseError.hint,
          supabaseError.code,
        ]
          .filter(Boolean)
          .join(" / ") || "티켓 삭제에 실패했습니다.",
      );
    } finally {
      setSavingTicketId(null);
    }
  }

  async function deleteRow(row: FestivalArtist) {
    const artist = Array.isArray(row.artists)
      ? row.artists[0]
      : row.artists;

    const confirmed = window.confirm(
      `${artist?.name ?? "아티스트"}를 라인업에서 삭제하시겠습니까?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSavingArtistId(row.artist_id);
      setErrorMessage(null);

      const { error } = await supabase
        .from("festival_artists")
        .delete()
        .eq("festival_id", festivalId)
        .eq("artist_id", row.artist_id);

      if (error) {
        throw error;
      }

      setRows((currentRows) =>
        currentRows.filter(
          (item) => item.artist_id !== row.artist_id,
        ),
      );
      window.alert("라인업에서 정상적으로 삭제되었습니다.");

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

  const lineupByDateAndStage = rows.reduce<
    Record<string, Record<string, FestivalArtist[]>>
  >((dateGroups, row) => {
    const date = row.performance_date || "날짜 미정";
    const stage = row.stage_name?.trim() || "무대 미정";

    if (!dateGroups[date]) {
      dateGroups[date] = {};
    }

    if (!dateGroups[date][stage]) {
      dateGroups[date][stage] = [];
    }

    dateGroups[date][stage].push(row);

    return dateGroups;
  }, {});

  Object.values(lineupByDateAndStage).forEach(
    (stageGroups) => {
      Object.values(stageGroups).forEach((artists) => {
        artists.sort((a, b) => {
          if (!a.performance_time && !b.performance_time) {
            return 0;
          }

          if (!a.performance_time) {
            return 1;
          }

          if (!b.performance_time) {
            return -1;
          }

          return a.performance_time.localeCompare(
            b.performance_time,
          );
        });
      });
    },
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              관리자
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              페스티벌 관리
            </h1>

            <p className="mt-2 text-slate-500">
              {festivalName}
            </p>
          </div>

          <Link
            href={`/festival/${festivalId}`}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            상세 페이지로 돌아가기
          </Link>
        </div>

        <div className="mt-8 flex gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={[
              "border-b-2 px-5 py-3 text-sm font-semibold",
              activeTab === "basic"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500",
            ].join(" ")}
          >
            기본정보 관리
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("lineup")}
            className={[
              "border-b-2 px-5 py-3 text-sm font-semibold",
              activeTab === "lineup"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500",
            ].join(" ")}
          >
            라인업 관리
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ticket")}
            className={[
              "border-b-2 px-5 py-3 text-sm font-semibold",
              activeTab === "ticket"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500",
            ].join(" ")}
          >
            티켓 관리
          </button>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        {activeTab === "basic" && (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              기본정보 관리
            </h2>

            <div className="mt-5">
              <label className="text-sm font-semibold text-slate-700">
                축제명
              </label>



              <input
                type="text"
                value={festivalName}
                onChange={(event) =>
                  setFestivalName(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    시작일
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    행사장명
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    상세 주소
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    지역
                  </label>
                  <input
                    type="text"
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    축제 분류
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-5">
              <label className="text-sm font-semibold text-slate-700">
                축제 소개
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div className="mt-5">
              <label className="text-sm font-semibold text-slate-700">
                대표 썸네일 URL
              </label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(event) => setThumbnailUrl(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;

                  setThumbnailFile(file);

                  if (file) {
                    setThumbnailPreview(URL.createObjectURL(file));
                  } else {
                    setThumbnailPreview("");
                  }
                }}
                className="block text-sm text-slate-600"
              />

              <button
                type="button"
                onClick={uploadThumbnail}
                disabled={isUploadingThumbnail || !thumbnailFile}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isUploadingThumbnail
                  ? "업로드 중..."
                  : "썸네일 업로드"}
              </button>

              {thumbnailUrl && (
                <button
                  type="button"
                  onClick={deleteThumbnail}
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  썸네일 삭제
                </button>
              )}
            </div>
            
            {(thumbnailPreview || thumbnailUrl) && (
              <div className="mt-4 flex aspect-[4/5] w-full max-w-sm items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={thumbnailPreview || thumbnailUrl}
                  alt={`${festivalName} 대표 썸네일`}
                  className="h-full w-full object-contain"
                />
              </div>
            )}


            <div className="mt-5">
              <label className="text-sm font-semibold text-slate-700">
                공식 홈페이지
              </label>
              <input
                type="url"
                value={officialUrl}
                onChange={(event) => setOfficialUrl(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  무료·유료 구분
                </label>
                <select
                  value={priceType}
                  onChange={(event) => setPriceType(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="">선택</option>
                  <option value="free">무료</option>
                  <option value="paid">유료</option>
                  <option value="mixed">무료·유료 혼합</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  진행 상태
                </label>
                <select
                  value={festivalStatus}
                  onChange={(event) =>
                    setFestivalStatus(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="">선택</option>
                  <option value="scheduled">예정</option>
                  <option value="ongoing">진행 중</option>
                  <option value="ended">종료</option>
                  <option value="cancelled">취소</option>
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-semibold text-slate-700">
                기본 가격 안내
              </label>
              <textarea
                value={priceInfo}
                onChange={(event) => setPriceInfo(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div className="mt-5">
              <label className="text-sm font-semibold text-slate-700">
                프로그램 정보
              </label>
              <textarea
                value={programInfo}
                onChange={(event) => setProgramInfo(event.target.value)}
                rows={5}
                placeholder="굿즈, 체험, 포토존, 불꽃놀이, 부대행사 등"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>
              <button
                type="button"
                onClick={saveBasicInfo}
                disabled={isSavingBasic}
                className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSavingBasic ? "저장 중..." : "기본정보 저장"}
              </button>
            </div>
          </section>
        )}
        
        {activeTab === "lineup" && (
            <>
        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            라인업 아티스트 추가
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <input
              type="text"
              value={artistSearch}
              onChange={(event) => {
                setArtistSearch(event.target.value);
                setSelectedArtist(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleArtistSearch();
                }
              }}
              placeholder="아티스트명 검색"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />

            <button
              type="button"
              onClick={handleArtistSearch}
              disabled={isSearchingArtists}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSearchingArtists ? "검색 중..." : "검색"}
            </button>
          </div>

          {artistResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {artistResults.map((artist) => (
                <button
                  key={artist.id}
                  type="button"
                  onClick={() => setSelectedArtist(artist)}
                  className={[
                    "w-full rounded-xl border p-3 text-left",
                    selectedArtist?.id === artist.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200",
                  ].join(" ")}
                >
                  <p className="font-semibold text-slate-900">
                    {artist.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    ID {artist.id} · 유사도{" "}
                    {Math.round(artist.similarity_score * 100)}%
                  </p>
                </button>
              ))}
            </div>
          )}

          {selectedArtist && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                type="date"
                value={newPerformanceDate}
                onChange={(event) =>
                  setNewPerformanceDate(event.target.value)
                }
                className="rounded-xl border border-slate-300 px-3 py-3 text-sm"
              />

              <input
                type="time"
                value={newPerformanceTime}
                onChange={(event) =>
                  setNewPerformanceTime(event.target.value)
                }
                className="rounded-xl border border-slate-300 px-3 py-3 text-sm"
              />

              <input
                type="time"
                value={newPerformanceEndTime}
                onChange={(event) =>
                  setNewPerformanceEndTime(event.target.value)
                }
                className="rounded-xl border border-slate-300 px-3 py-3 text-sm"
              />

              <input
                type="text"
                value={newStageName}
                onChange={(event) =>
                  setNewStageName(event.target.value)
                }
                placeholder="스테이지"
                className="rounded-xl border border-slate-300 px-3 py-3 text-sm"
              />

              <button
                type="button"
                onClick={handleAddArtist}
                disabled={isAddingArtist}
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isAddingArtist ? "추가 중..." : "라인업 추가"}
              </button>
            </div>
          )}
        </section>

        <section className="mt-8 space-y-8">
          {isLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm text-slate-500">
                불러오는 중...
              </p>
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm text-slate-500">
                등록된 라인업이 없습니다.
              </p>
            </div>
          ) : (
            Object.entries(lineupByDateAndStage)
              .sort(([dateA], [dateB]) => {
                if (dateA === "날짜 미정") return 1;
                if (dateB === "날짜 미정") return -1;

                return dateA.localeCompare(dateB);
              })
              .map(([date, stageGroups]) => (
                <div key={date}>
                  <h2 className="mb-4 text-xl font-bold text-slate-950">
                    {date === "날짜 미정"
                      ? date
                      : new Intl.DateTimeFormat("ko-KR", {
                          timeZone: "Asia/Seoul",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                        }).format(
                          new Date(`${date}T00:00:00+09:00`),
                        )}
                  </h2>

                  <div className="space-y-5">
                    {Object.entries(stageGroups)
                      .sort(([stageA], [stageB]) =>
                        stageA.localeCompare(stageB, "ko-KR"),
                      )
                      .map(([stage, stageArtists]) => (
                        <section
                          key={`${date}-${stage}`}
                          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                        >
                          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                            <h3 className="font-bold text-slate-900">
                              {stage}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {stageArtists.length}명
                            </p>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                              <thead className="bg-white">
                                <tr>
                                  <th className="px-4 py-4 text-left">
                                    아티스트
                                  </th>

                                  <th className="px-4 py-4 text-left">
                                    날짜
                                  </th>

                                  <th className="px-4 py-4 text-left">
                                    시작시간
                                  </th>

                                  <th className="px-4 py-4 text-left">
                                    종료시간
                                  </th>

                                  <th className="px-4 py-4 text-left">
                                    스테이지
                                  </th>

                                  <th className="px-4 py-4 text-right">
                                    관리
                                  </th>
                                </tr>
                              </thead>

                              <tbody className="divide-y divide-slate-100">
                                {stageArtists.map((row) => {
                                  const artist = Array.isArray(
                                    row.artists,
                                  )
                                    ? row.artists[0]
                                    : row.artists;

                                  return (
                                    <tr key={row.artist_id}>
                                      <td className="px-4 py-4 font-semibold text-slate-900">
                                        {artist?.name ??
                                          "아티스트 정보 없음"}
                                      </td>

                                      <td className="px-4 py-4">
                                        <input
                                          type="date"
                                          value={
                                            row.performance_date ?? ""
                                          }
                                          onChange={(event) =>
                                            updateRow(
                                              row.artist_id,
                                              "performance_date",
                                              event.target.value,
                                            )
                                          }
                                          className="rounded-lg border border-slate-300 px-3 py-2"
                                        />
                                      </td>

                                      <td className="px-4 py-4">
                                        <input
                                          type="time"
                                          value={
                                            row.performance_time?.slice(
                                              0,
                                              5,
                                            ) ?? ""
                                          }
                                          onChange={(event) =>
                                            updateRow(
                                              row.artist_id,
                                              "performance_time",
                                              event.target.value,
                                            )
                                          }
                                          className="rounded-lg border border-slate-300 px-3 py-2"
                                        />
                                      </td>

                                      <td className="px-4 py-4">
                                        <input
                                          type="time"
                                          value={
                                            row.performance_end_time?.slice(0, 5) ?? ""
                                          }
                                          onChange={(event) =>
                                            updateRow(
                                              row.artist_id,
                                              "performance_end_time",
                                              event.target.value,
                                            )
                                          }
                                          className="rounded-lg border border-slate-300 px-3 py-2"
                                        />
                                      </td>

                                      <td className="px-4 py-4">
                                        <input
                                          type="text"
                                          value={row.stage_name ?? ""}
                                          onChange={(event) =>
                                            updateRow(
                                              row.artist_id,
                                              "stage_name",
                                              event.target.value,
                                            )
                                          }
                                          className="w-48 rounded-lg border border-slate-300 px-3 py-2"
                                        />
                                      </td>

                                      <td className="px-4 py-4">
                                        <div className="flex justify-end gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              saveRow(row)
                                            }
                                            disabled={
                                              savingArtistId ===
                                              row.artist_id
                                            }
                                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                                          >
                                            저장
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              deleteRow(row)
                                            }
                                            disabled={
                                              savingArtistId ===
                                              row.artist_id
                                            }
                                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                                          >
                                            삭제
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      ))}
                  </div>
                </div>
              ))
          )}
        </section>
          </>
        )}

        {activeTab === "ticket" && (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              티켓 관리
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              티켓 회차와 예매처 링크를 등록하고 수정합니다.
            </p>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="font-bold text-slate-900">
                티켓 추가
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <select
                  value={newRoundType}
                  onChange={(event) =>
                    setNewRoundType(event.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="blind">블라인드</option>
                  <option value="early_bird">얼리버드</option>
                  <option value="first">1차</option>
                  <option value="second">2차</option>
                  <option value="regular">레귤러</option>
                  <option value="other">기타</option>
                </select>

                <input
                  type="text"
                  value={newRoundName}
                  onChange={(event) =>
                    setNewRoundName(event.target.value)
                  }
                  placeholder="표시 이름 예: 레귤러 티켓"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />

                <input
                  type="datetime-local"
                  value={newOpenAt}
                  onChange={(event) =>
                    setNewOpenAt(event.target.value)
                  }
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />

                <input
                  type="text"
                  value={newTicketPlatform}
                  onChange={(event) =>
                    setNewTicketPlatform(event.target.value)
                  }
                  placeholder="예매처 예: NOL 티켓"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />

                <textarea
                  value={newPriceInfo}
                  onChange={(event) =>
                    setNewPriceInfo(event.target.value)
                  }
                  placeholder="가격 정보"
                  rows={3}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm sm:col-span-2"
                />

                <input
                  type="url"
                  value={newTicketUrl}
                  onChange={(event) =>
                    setNewTicketUrl(event.target.value)
                  }
                  placeholder="예매 링크"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm sm:col-span-2"
                />
              </div>

              <button
                type="button"
                onClick={handleAddTicket}
                disabled={isAddingTicket}
                className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isAddingTicket ? "추가 중..." : "티켓 추가"}
              </button>
            </div>

            {ticketRounds.length === 0 ? (
              <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                등록된 티켓 정보가 없습니다.
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                {ticketRounds.map((round) => (
                  <div
                    key={round.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <select
                        value={round.round_type ?? "other"}
                        onChange={(event) =>
                          updateTicketRound(
                            round.id,
                            "round_type",
                            event.target.value,
                          )
                        }
                        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                      >
                        <option value="blind">블라인드</option>
                        <option value="early_bird">얼리버드</option>
                        <option value="first">1차</option>
                        <option value="second">2차</option>
                        <option value="regular">레귤러</option>
                        <option value="other">기타</option>
                      </select>

                      <input
                        type="text"
                        value={round.round_name}
                        onChange={(event) =>
                          updateTicketRound(
                            round.id,
                            "round_name",
                            event.target.value,
                          )
                        }
                        placeholder="표시 이름"
                        className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                      />

                      <input
                        type="datetime-local"
                        value={
                          round.open_at
                            ? new Date(round.open_at)
                                .toLocaleString("sv-SE", {
                                  timeZone: "Asia/Seoul",
                                })
                                .slice(0, 16)
                                .replace(" ", "T")
                            : ""
                        }
                        onChange={(event) =>
                          updateTicketRound(
                            round.id,
                            "open_at",
                            event.target.value
                              ? new Date(event.target.value).toISOString()
                              : "",
                          )
                        }
                        className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                      />

                      <input
                        type="text"
                        value={round.ticket_platform ?? ""}
                        onChange={(event) =>
                          updateTicketRound(
                            round.id,
                            "ticket_platform",
                            event.target.value,
                          )
                        }
                        placeholder="예매처"
                        className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                      />

                      <textarea
                        value={round.price_info ?? ""}
                        onChange={(event) =>
                          updateTicketRound(
                            round.id,
                            "price_info",
                            event.target.value,
                          )
                        }
                        placeholder="가격 정보"
                        rows={3}
                        className="rounded-xl border border-slate-300 px-4 py-3 text-sm sm:col-span-2"
                      />

                      <input
                        type="url"
                        value={round.ticket_url ?? ""}
                        onChange={(event) =>
                          updateTicketRound(
                            round.id,
                            "ticket_url",
                            event.target.value,
                          )
                        }
                        placeholder="예매 링크"
                        className="rounded-xl border border-slate-300 px-4 py-3 text-sm sm:col-span-2"
                      />
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => saveTicketRound(round)}
                        disabled={savingTicketId === round.id}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {savingTicketId === round.id
                          ? "처리 중..."
                          : "저장"}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteTicketRound(round)}
                        disabled={savingTicketId === round.id}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </main>
  );
}