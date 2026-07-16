"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import BasicInfoTab from "./components/BasicInfoTab";
import TicketTab from "./components/TicketTab";
import ArtistAddSection from "./components/ArtistAddSection";
import ArtistLineupTable from "./components/ArtistLineupTable";
import { uploadFestivalThumbnail } from "@/lib/festivals/uploadFestivalThumbnail";
import { deleteFestivalThumbnail } from "@/lib/festivals/deleteFestivalThumbnail";
import { updateFestivalBasicInfo } from "@/lib/festivals/updateFestivalBasicInfo";
import {
  searchArtists,
  type ArtistSearchResult,
} from "@/lib/artists/searchArtists";
import { addFestivalArtist } from "@/lib/festivals/addFestivalArtist";
import { updateFestivalArtist } from "@/lib/festivals/updateFestivalArtist";
import { deleteFestivalArtist } from "@/lib/festivals/deleteFestivalArtist";
import { addFestivalTicket } from "@/lib/festivals/addFestivalTicket";
import { updateFestivalTicket } from "@/lib/festivals/updateFestivalTicket";
import { deleteFestivalTicket } from "@/lib/festivals/deleteFestivalTicket";
import { getFestivalLineupData } from "@/lib/festivals/getFestivalLineupData";


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

        const {
          festival,
          lineup,
          ticketRounds,
        } = await getFestivalLineupData(
          festivalId,
        );

        setFestivalName(festival.name);
        setStartDate(festival.start_date ?? "");
        setEndDate(festival.end_date ?? "");
        setLocation(festival.location ?? "");
        setAddress(festival.address ?? "");
        setRegion(festival.region ?? "");
        setCategory(festival.category ?? "");
        setDescription(festival.description ?? "");
        setThumbnailUrl(festival.thumbnail_url ?? "");
        setOfficialUrl(festival.official_url ?? "");
        setPriceType(festival.price_type ?? "");
        setPriceInfo(festival.price_info ?? "");
        setProgramInfo(festival.program_info ?? "");
        setFestivalStatus(festival.status ?? "");

        setRows(lineup as FestivalArtist[]);
        setTicketRounds(
          ticketRounds as FestivalTicketRound[],
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

    const results = await searchArtists(keyword);

    setArtistResults(results);
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

      await addFestivalArtist(festivalId, {
        artistId: selectedArtist.id,
        performanceDate: newPerformanceDate,
        performanceTime: newPerformanceTime,
        performanceEndTime: newPerformanceEndTime,
        stageName: newStageName,
        status: newStatus,
      });

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
      setNewPerformanceEndTime("");
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

    const data = await addFestivalTicket(festivalId, {
      roundType: newRoundType,
      roundName: newRoundName,
      openAt: newOpenAt,
      priceInfo: newPriceInfo,
      ticketPlatform: newTicketPlatform,
      ticketUrl: newTicketUrl,
    });

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

    try {
      setIsUploadingThumbnail(true);
      setErrorMessage(null);

      const publicUrl = await uploadFestivalThumbnail(
        festivalId,
        thumbnailFile,
      );

      setThumbnailUrl(publicUrl);
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

      await deleteFestivalThumbnail(
        festivalId,
        thumbnailUrl,
      );

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

      await updateFestivalBasicInfo(festivalId, {
        name: festivalName,
        startDate,
        endDate,
        location,
        address,
        region,
        category,
        description,
        thumbnailUrl,
        officialUrl,
        priceType,
        priceInfo,
        programInfo,
        status: festivalStatus,
      });

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
    
      await updateFestivalArtist(
        festivalId,
        row,
      );

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

      await updateFestivalTicket(
        festivalId,
        round,
      );

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

      await deleteFestivalTicket(
        festivalId,
        round.id,
      );

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

      await deleteFestivalArtist(
        festivalId,
        row.artist_id,
      );

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
          <BasicInfoTab
            festivalName={festivalName}
            setFestivalName={setFestivalName}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            location={location}
            setLocation={setLocation}
            address={address}
            setAddress={setAddress}
            region={region}
            setRegion={setRegion}
            category={category}
            setCategory={setCategory}
            description={description}
            setDescription={setDescription}
            thumbnailUrl={thumbnailUrl}
            setThumbnailUrl={setThumbnailUrl}
            thumbnailFile={thumbnailFile}
            setThumbnailFile={setThumbnailFile}
            thumbnailPreview={thumbnailPreview}
            setThumbnailPreview={setThumbnailPreview}
            uploadThumbnail={uploadThumbnail}
            deleteThumbnail={deleteThumbnail}
            isUploadingThumbnail={isUploadingThumbnail}
            officialUrl={officialUrl}
            setOfficialUrl={setOfficialUrl}
            priceType={priceType}
            setPriceType={setPriceType}
            festivalStatus={festivalStatus}
            setFestivalStatus={setFestivalStatus}
            priceInfo={priceInfo}
            setPriceInfo={setPriceInfo}
            programInfo={programInfo}
            setProgramInfo={setProgramInfo}
            saveBasicInfo={saveBasicInfo}
            isSavingBasic={isSavingBasic}
          />
        )}

        {activeTab === "lineup" && (
          <>
            <ArtistAddSection
              artistSearch={artistSearch}
              setArtistSearch={setArtistSearch}
              artistResults={artistResults}
              selectedArtist={selectedArtist}
              setSelectedArtist={setSelectedArtist}
              handleArtistSearch={handleArtistSearch}
              isSearchingArtists={isSearchingArtists}
              newPerformanceDate={newPerformanceDate}
              setNewPerformanceDate={setNewPerformanceDate}
              newPerformanceTime={newPerformanceTime}
              setNewPerformanceTime={setNewPerformanceTime}
              newPerformanceEndTime={newPerformanceEndTime}
              setNewPerformanceEndTime={setNewPerformanceEndTime}
              newStageName={newStageName}
              setNewStageName={setNewStageName}
              handleAddArtist={handleAddArtist}
              isAddingArtist={isAddingArtist}
            />

            <ArtistLineupTable
              isLoading={isLoading}
              rows={rows}
              lineupByDateAndStage={lineupByDateAndStage}
              updateRow={updateRow}
              saveRow={saveRow}
              deleteRow={deleteRow}
              savingArtistId={savingArtistId}
            />
          </>
        )}

        {activeTab === "ticket" && (
          <TicketTab
            newRoundType={newRoundType}
            setNewRoundType={setNewRoundType}
            newRoundName={newRoundName}
            setNewRoundName={setNewRoundName}
            newOpenAt={newOpenAt}
            setNewOpenAt={setNewOpenAt}
            newTicketPlatform={newTicketPlatform}
            setNewTicketPlatform={setNewTicketPlatform}
            newPriceInfo={newPriceInfo}
            setNewPriceInfo={setNewPriceInfo}
            newTicketUrl={newTicketUrl}
            setNewTicketUrl={setNewTicketUrl}
            handleAddTicket={handleAddTicket}
            isAddingTicket={isAddingTicket}
            ticketRounds={ticketRounds}
            updateTicketRound={updateTicketRound}
            saveTicketRound={saveTicketRound}
            deleteTicketRound={deleteTicketRound}
            savingTicketId={savingTicketId}
          />
        )}

      </div>
    </main>
  );
}
