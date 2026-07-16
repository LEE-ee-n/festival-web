"use client";

import { ChangeEvent, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type FestivalJson = {
  festival: {
    name: string;
    normalized_name?: string;
    search_aliases?: string;
    start_date: string;
    end_date: string;
    location?: string;
    address?: string;
    region?: string;
    category?: string;
    description?: string;
    price_info?: string;
    program_info?: string;
    source_url?: string;
    official_url?: string;
    thumbnail_url?: string;
    price_type?: string;
    status?: string;
  };

  artists: Array<{
    input_name: string;
    display_name: string;
    normalized_name: string;
    aliases: string[];
    performance_date?: string;
    performance_time?: string;
    performance_end_time?: string;
    stage_name?: string;
    status?: string;
  }>;

  tickets?: Array<{
    round_type?: string;
    round_name?: string;
    open_at?: string;
    close_at?: string;
    price_info?: string;
    ticket_url?: string;
    ticket_platform?: string;
    status?: string;
  }>;
};

type SimilarArtist = {
  id: number;
  name: string;
  normalized_name: string;
  similarity_score: number;
};

type MatchedArtist = FestivalJson["artists"][number] & {
  matchedArtist: SimilarArtist | null;
  matchStatus: "pending" | "matched" | "review" | "new" | "error";
};

type ImportResult = {
  festival_id: number;
  new_artist_count: number;
  existing_artist_count: number;
  linked_count: number;
  already_linked_count: number;
  alias_count: number;
};


export default function FestivalJsonImportPage() {
  const [fileName, setFileName] = useState("");
  const [jsonData, setJsonData] =
    useState<FestivalJson | null>(null);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [matchedArtists, setMatchedArtists] = useState<
    MatchedArtist[]
    >([]);

  const [isMatching, setIsMatching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [importResult, setImportResult] =
    useState<ImportResult | null>(null);

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setFileName(file.name);
      setErrorMessage(null);
      setJsonData(null);

      const text = await file.text();
      const parsed = JSON.parse(text) as FestivalJson;

      if (!parsed.festival) {
        throw new Error("festival 정보가 없습니다.");
      }

      if (!parsed.festival.name) {
        throw new Error("festival.name이 없습니다.");
      }

      if (!parsed.festival.start_date) {
        throw new Error("festival.start_date가 없습니다.");
      }

      if (!parsed.festival.end_date) {
        throw new Error("festival.end_date가 없습니다.");
      }

      if (
        parsed.artists !== undefined &&
        !Array.isArray(parsed.artists)
      ) {
        throw new Error("artists는 배열이어야 합니다.");
      }

      if (
        parsed.tickets !== undefined &&
        !Array.isArray(parsed.tickets)
      ) {
        throw new Error("tickets는 배열이어야 합니다.");
      }

      setJsonData(parsed);
      setMatchedArtists(
        (parsed.artists ?? []).map((artist) => ({
            ...artist,
            matchedArtist: null,
            matchStatus: "pending"
        })),
        );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "JSON 파일을 읽지 못했습니다.",
      );
    }
  }

  async function handleMatchArtists() {
    if (matchedArtists.length === 0) {
        setErrorMessage("매칭할 아티스트가 없습니다.");
        return;
    }

    try {
        setIsMatching(true);
        setErrorMessage(null);

        const results = await Promise.all(
        matchedArtists.map(async (artist): Promise<MatchedArtist> => {
            try {
            const { data, error } = await supabase.rpc(
                "search_similar_artists",
                {
                input_name: artist.input_name,
                },
            );

            if (error) {
                throw error;
            }

            const candidates = (data ?? []) as SimilarArtist[];

            if (candidates.length === 0) {
                return {
                ...artist,
                matchedArtist: null,
                matchStatus: "new",
                };
            }

            const exactMatch = candidates.find(
                (candidate) =>
                candidate.normalized_name ===
                    artist.normalized_name ||
                candidate.similarity_score >= 0.99,
            );

            if (exactMatch) {
                return {
                ...artist,
                matchedArtist: exactMatch,
                matchStatus: "matched",
                };
            }

            return {
                ...artist,
                matchedArtist: candidates[0],
                matchStatus: "review",
            };
            } catch {
            return {
                ...artist,
                matchedArtist: null,
                matchStatus: "error",
            };
            }
        }),
        );

        setMatchedArtists(results);
    } finally {
        setIsMatching(false);
    }
    }

    async function handleImportFestival() {
        if (!jsonData) {
            setErrorMessage("JSON 파일을 먼저 선택하세요.");
            return;
        }

        if (
            matchedArtists.some(
            (artist) =>
                artist.matchStatus === "pending" ||
                artist.matchStatus === "error"
            )
        ) {
            setErrorMessage(
            "아티스트 매칭이 완료되지 않았거나 오류가 있습니다.",
            );
            return;
        }

        try {
            setIsImporting(true);
            setErrorMessage(null);
            setImportResult(null);

            const festival = jsonData.festival;

            const { data: existingFestivals, error: searchError } =
            await supabase
                .from("festivals")
                .select("id")
                .eq("name", festival.name)
                .eq("start_date", festival.start_date)
                .eq("end_date", festival.end_date)
                .limit(1);

            if (searchError) {
            throw searchError;
            }

            let festivalId: number | null = null;

            if (existingFestivals?.length) {
              festivalId = existingFestivals[0].id;

              const { error: updateError } = await supabase
                .from("festivals")
                .update({
                  name: festival.name,
                  normalized_name: festival.normalized_name || null,
                  search_aliases: festival.search_aliases || null,
                  start_date: festival.start_date,
                  end_date: festival.end_date,
                  location: festival.location || null,
                  address: festival.address || null,
                  region: festival.region || null,
                  category: festival.category || null,
                  description: festival.description || null,
                  price_info: festival.price_info || null,
                  program_info: festival.program_info || null,
                  source_url: festival.source_url || null,
                  official_url: festival.official_url || null,
                  thumbnail_url: festival.thumbnail_url || null,
                  price_type: festival.price_type || null,
                  status: festival.status || "scheduled",
                  verification_status: "approved",
                })
                .eq("id", festivalId);

              if (updateError) {
                throw updateError;
              }
            } else {
            const { data: createdFestival, error: insertError } =
                await supabase
                .from("festivals")

                .insert({
                    name: festival.name,
                    normalized_name: festival.normalized_name || null,
                    search_aliases:
                    festival.search_aliases || null,
                    start_date: festival.start_date,
                    end_date: festival.end_date,
                    location: festival.location || null,
                    address: festival.address || null,
                    region: festival.region || null,
                    category: festival.category || null,
                    description: festival.description || null,
                    price_info: festival.price_info || null,
                    program_info: festival.program_info || null,
                    source_url: festival.source_url || null,
                    official_url: festival.official_url || null,
                    thumbnail_url:
                    festival.thumbnail_url || null,
                    price_type: festival.price_type || null,
                    status: festival.status || "scheduled",
                    verification_status: "approved",
                })
                .select("id")
                .single();

            if (insertError) {
                throw insertError;
            }
            
            
            festivalId = createdFestival.id;
            }

            if (festivalId === null) {
              throw new Error("페스티벌 ID를 확인하지 못했습니다.");
            }

            if (jsonData.tickets) {
              const { error: deleteTicketsError } = await supabase
                .from("festival_ticket_rounds")
                .delete()
                .eq("festival_id", festivalId);

              if (deleteTicketsError) {
                throw deleteTicketsError;
              }

              if (jsonData.tickets.length > 0) {
                const ticketsPayload = jsonData.tickets.map((ticket) => ({
                  festival_id: festivalId,
                  round_type: ticket.round_type || null,
                  round_name: ticket.round_name || "일반 예매",
                  open_at: ticket.open_at || null,
                  price_info: ticket.price_info || null,
                  ticket_url: ticket.ticket_url || null,
                  ticket_platform: ticket.ticket_platform || null,
                }));

                const { error: ticketsError } = await supabase
                  .from("festival_ticket_rounds")
                  .insert(ticketsPayload);

                if (ticketsError) {
                  throw ticketsError;
                }
              }
            }

            const artistsPayload = matchedArtists.map(
              (artist) => ({
                input_name: artist.input_name,
                display_name: artist.display_name,
                normalized_name: artist.normalized_name,
                matched_artist_id:
                  artist.matchedArtist?.id ?? null,
                aliases: artist.aliases,
                performance_date: artist.performance_date || null,
                performance_time: artist.performance_time || null,
                performance_end_time:
                  artist.performance_end_time || null,
                stage_name: artist.stage_name || null,
                status: artist.status || "scheduled",
              }),
            );

            const { data, error } = await supabase.rpc(
            "import_festival_lineup",
            {
                p_festival_id: festivalId,
                p_artists: artistsPayload,
            },
            );

            if (error) {
            throw error;
            }

            setImportResult(data as ImportResult);
        } catch (error) {
            console.error("통합 JSON 등록 오류:", error);

            setErrorMessage(
                error &&
                    typeof error === "object" &&
                    "message" in error
                    ? String(error.message)
                    : JSON.stringify(error),
            );
        } finally {
            setIsImporting(false);
        }
        }
  
  
    function resetPage() {
      setFileName("");
      setJsonData(null);
      setErrorMessage(null);

      setMatchedArtists([]);
      setIsMatching(false);
      setIsImporting(false);
      setImportResult(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-slate-950">
          페스티벌 통합 JSON 가져오기
        </h1>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <label
            htmlFor="jsonFile"
            className="block text-sm font-semibold text-slate-700"
          >
            JSON 파일 선택
          </label>

          <input
            ref={fileInputRef}
            id="jsonFile"
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="mt-3 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />

          {fileName && (
            <p className="mt-3 text-sm text-slate-600">
              선택한 파일:{" "}
              <strong>{fileName}</strong>
            </p>
          )}

          {errorMessage && (
            <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={resetPage}
            className="mt-5 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold"
          >
            초기화
          </button>
        </section>

        {jsonData && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              JSON 미리보기
            </h2>

            <div className="mt-4 space-y-2 text-sm">
              <p>
                페스티벌명:{" "}
                <strong>
                  {jsonData.festival.name}
                </strong>
              </p>

              <p>
                기간:{" "}
                {jsonData.festival.start_date} ~{" "}
                {jsonData.festival.end_date}
              </p>

              <p>
                장소:{" "}
                {jsonData.festival.location || "-"}
              </p>

              <p>
                검색 별칭:{" "}
                {jsonData.festival.search_aliases || "-"}
              </p>

              <p>
                아티스트 수:{" "}
                <strong>
                  {jsonData.artists.length}명
                </strong>
              </p>

              <button
                type="button"
                onClick={handleMatchArtists}
                disabled={isMatching || matchedArtists.length === 0}
                className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                {isMatching ? "DB 확인 중..." : "기존 아티스트 매칭"}
              </button>

                {matchedArtists.length > 0 && (
                    <div className="mt-5 space-y-3">
                        {matchedArtists.map((artist, index) => (
                        <div
                            key={`${artist.input_name}-${index}`}
                            className="rounded-xl border border-slate-200 p-4"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="font-semibold text-slate-900">
                                {artist.display_name}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                {artist.normalized_name}
                                </p>
                            </div>

                            <span className="text-sm font-semibold">
                                {artist.matchStatus === "pending" && "확인 전"}
                                {artist.matchStatus === "matched" &&
                                  `기존 사용: ${artist.matchedArtist?.name}`}
                                {artist.matchStatus === "review" &&
                                  `확인 필요: ${artist.matchedArtist?.name}`}
                                {artist.matchStatus === "new" && "신규 생성"}
                                {artist.matchStatus === "error" && "매칭 오류"}
                            </span>
                            </div>
                        </div>
                        ))}
                    </div>
                    )}

                <button
                    type="button"
                    onClick={handleImportFestival}
                    disabled={
                        isImporting ||
                        matchedArtists.length === 0 ||
                        matchedArtists.some(
                        (artist) =>
                            artist.matchStatus === "pending" ||
                            artist.matchStatus === "error"
                        )
                    }
                    className="mt-5 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                    {isImporting
                        ? "통합 등록 중..."
                        : "페스티벌 및 라인업 최종 등록"}
                </button>
                {importResult && (
                    <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                        등록 완료 — 신규 아티스트{" "}
                        {importResult.new_artist_count}명 / 기존 아티스트{" "}
                        {importResult.existing_artist_count}명 / 라인업 연결{" "}
                        {importResult.linked_count}명 / 중복 제외{" "}
                        {importResult.already_linked_count}명 / 별칭{" "}
                        {importResult.alias_count}개
                    </div>
                    )}


            </div>
          </section>
        )}
      </div>
    </main>
  );
}