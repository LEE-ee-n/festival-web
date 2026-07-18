"use client";

import { ChangeEvent, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase/client";
import {
  isValidNormalizedName,
  normalizeNormalizedName,
} from "@/lib/normalizedName";

type FestivalRow = {
  name: string;
  normalized_name: string;
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
  official_url?: string;
  source_url?: string;
  thumbnail_url?: string;
  price_type?: string;
  status?: string;
};

type ArtistRow = {
  input_name: string;
  display_name: string;
  normalized_name: string;
  aliases?: string;
  performance_date?: string;
  performance_time?: string;
  performance_end_time?: string;
  stage_name?: string;
  status?: string;
};

type ExistingFestival = {
  id: number;
  name: string;
  normalized_name: string;
  start_date: string;
  end_date: string;
};

type LineupChangeFlags = {
  isNew: boolean;
  aliases: boolean;
  performance_date: boolean;
  performance_time: boolean;
  performance_end_time: boolean;
  stage_name: boolean;
  status: boolean;
};

type ImportResult = {
  festival_id: number;
  created_festival: boolean;
  created_artists: number;
  added_aliases: number;
  added_lineup: number;
  updated_lineup: number;
  unchanged_lineup: number;
};

type ExistingLineupRow = {
  artist_id: number;
  performance_date: string | null;
  performance_time: string | null;
  performance_end_time: string | null;
  stage_name: string | null;
  status: string | null;
  artists:
    | {
        id: number;
        name: string;
        normalized_name: string;
      }
    | {
        id: number;
        name: string;
        normalized_name: string;
      }[];
};

function formatExcelDate(value: unknown) {
  if (!value) return "";

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (!parsed) return "";

    const month = String(parsed.m).padStart(2, "0");
    const day = String(parsed.d).padStart(2, "0");

    return `${parsed.y}-${month}-${day}`;
  }

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
    }

  return String(value).trim();
}

function formatExcelTime(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "number") {
    const totalMinutes = Math.round(value * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  const text = String(value).trim();

  if (!text) return "";

  const timeMatch = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (timeMatch) {
    return `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
  }

  return text;
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeDate(value: unknown) {
  return normalizeText(value).slice(0, 10);
}

function normalizeTime(value: unknown) {
  const text = normalizeText(value);

  if (!text) return "";

  return text.slice(0, 5);
}


export default function AdminImportPage() {
    const [fileName, setFileName] = useState("");
    const [festival, setFestival] = useState<FestivalRow | null>(null);
    const [artists, setArtists] = useState<ArtistRow[]>([]);
    const [errorMessage, setErrorMessage] = useState("");
  
    const [existingFestival, setExistingFestival] =
        useState<ExistingFestival | null>(null);
    
    const [lineupChanges, setLineupChanges] = useState<
        Record<string, LineupChangeFlags>
    >({});

    const [isSaving, setIsSaving] = useState(false);

    const [importResult, setImportResult] =
      useState<ImportResult | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

    setErrorMessage("");
    setFestival(null);
    setArtists([]);
    setExistingFestival(null);
    setLineupChanges({});
    setImportResult(null);

    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();

      const workbook = XLSX.read(arrayBuffer, {
        type: "array",
        cellDates: false,
        });

      const festivalSheet = workbook.Sheets["festival"];
      const artistsSheet = workbook.Sheets["artists"];

      if (!festivalSheet) {
        throw new Error("festival 시트를 찾을 수 없습니다.");
      }

      if (!artistsSheet) {
        throw new Error("artists 시트를 찾을 수 없습니다.");
      }

      const festivalRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        festivalSheet,
        {
          defval: "",
          raw: true,
        }
      );

      const artistRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        artistsSheet,
        {
          defval: "",
          raw: true,
        }
      );

      if (festivalRows.length !== 1) {
        throw new Error("festival 시트에는 데이터가 정확히 1행이어야 합니다.");
      }

      const festivalData = festivalRows[0];

      const parsedFestival: FestivalRow = {
        name: String(festivalData.name ?? "").trim(),
        normalized_name: normalizeNormalizedName(
          String(festivalData.normalized_name ?? ""),
        ),
        search_aliases: String(
          festivalData.search_aliases ?? ""
        ).trim(),
        start_date: formatExcelDate(festivalData.start_date),
        end_date: formatExcelDate(festivalData.end_date),
        location: String(festivalData.location ?? "").trim(),
        address: String(festivalData.address ?? "").trim(),
        region: String(festivalData.region ?? "").trim(),
        category: String(festivalData.category ?? "").trim(),
        description: String(festivalData.description ?? "").trim(),
        price_info: String(festivalData.price_info ?? "").trim(),
        program_info: String(festivalData.program_info ?? "").trim(),
        official_url: String(festivalData.official_url ?? "").trim(),
        source_url: String(festivalData.source_url ?? "").trim(),
        thumbnail_url: String(
          festivalData.thumbnail_url ?? ""
        ).trim(),
        price_type: String(festivalData.price_type ?? "").trim(),
        status: String(festivalData.status ?? "").trim(),
      };

      if (!parsedFestival.name) {
        throw new Error("페스티벌명이 없습니다.");
      }

      if (!isValidNormalizedName(parsedFestival.normalized_name)) {
        throw new Error(
          "normalized_name은 영문 소문자와 숫자로 입력해 주세요.",
        );
      }

      if (!parsedFestival.start_date) {
        throw new Error("start_date가 없습니다.");
      }

      if (!parsedFestival.end_date) {
        throw new Error("end_date가 없습니다.");
      }

      if (parsedFestival.end_date < parsedFestival.start_date) {
        throw new Error("종료일은 시작일보다 빠를 수 없습니다.");
      }

      const { data: duplicateFestival, error: duplicateError } =
        await supabase
            .from("festivals")
            .select("id, name, normalized_name, start_date, end_date")
            .eq("normalized_name", parsedFestival.normalized_name)
            .eq("start_date", parsedFestival.start_date)
            .eq("end_date", parsedFestival.end_date)
            .maybeSingle();

        if (duplicateError) {
        throw new Error(
            `페스티벌 중복 검사 실패: ${duplicateError.message}`
        );
        }

        setExistingFestival(duplicateFestival);

      const parsedArtists: ArtistRow[] = artistRows
        .map((row) => ({
          input_name: String(row.input_name ?? "").trim(),
          display_name: String(row.display_name ?? "").trim(),
          normalized_name: String(row.normalized_name ?? "").trim(),
          aliases: String(row.aliases ?? "").trim(),
          performance_date: formatExcelDate(row.performance_date),
          performance_time: formatExcelTime(
            row.performance_time
            ),

            performance_end_time: formatExcelTime(
                row.performance_end_time
                ),

            stage_name: String(row.stage_name ?? "").trim(),
          status: String(row.status ?? "").trim(),
        }))
        .filter(
          (row) =>
            row.input_name ||
            row.display_name ||
            row.normalized_name
        );

      if (parsedArtists.length === 0) {
        throw new Error("artists 시트에 아티스트가 없습니다.");
      }

      const changes: Record<string, LineupChangeFlags> = {};

if (duplicateFestival) {
  const { data: existingLineupData, error: lineupError } =
    await supabase
      .from("festival_artists")
      .select(`
        artist_id,
        performance_date,
        performance_time,
        performance_end_time,
        stage_name,
        status,
        artists!inner (
          id,
          name,
          normalized_name
        )
      `)
      .eq("festival_id", duplicateFestival.id);

  if (lineupError) {
    throw new Error(
      `기존 라인업 조회 실패: ${lineupError.message}`
    );
  }

  const existingLineup =
    (existingLineupData ?? []) as unknown as ExistingLineupRow[];

  const artistIds = existingLineup.map((row) => row.artist_id);

    const { data: existingAliasData, error: aliasError } =
    await supabase
        .from("artist_aliases")
        .select("artist_id, alias_name")
        .in("artist_id", artistIds);

    if (aliasError) {
    throw new Error(
        `기존 별칭 조회 실패: ${aliasError.message}`
    );
    }

    const aliasMap = new Map<number, string[]>();

    (existingAliasData ?? []).forEach((row) => {
    const current = aliasMap.get(row.artist_id) ?? [];
    current.push(row.alias_name.trim());
    aliasMap.set(row.artist_id, current);
    });

  const existingMap = new Map<
    string,
    ExistingLineupRow
  >();

  existingLineup.forEach((row) => {
    const artist = Array.isArray(row.artists)
      ? row.artists[0]
      : row.artists;

    if (artist?.normalized_name) {
      existingMap.set(artist.normalized_name, row);
    }
  });

  parsedArtists.forEach((artist) => {
    const existing = existingMap.get(
      artist.normalized_name
    );

    if (!existing) {
        changes[artist.normalized_name] = {
            isNew: true,
            aliases: false,
            performance_date: false,
            performance_time: false,
            performance_end_time : false,
            stage_name: false,
            status: false,
        };

        return;
        }

    changes[artist.normalized_name] = {
      isNew: false,

    aliases: (() => {
        const excelAliases = artist.aliases
            ? artist.aliases
                .split("|")
                .map((alias) => alias.trim())
                .filter(Boolean)
            : [];

        const dbAliases =
            aliasMap.get(existing.artist_id) ?? [];

        return excelAliases.some(
            (alias) => !dbAliases.includes(alias)
        );
        })(),

      performance_date:
        normalizeDate(existing.performance_date) !==
        normalizeDate(artist.performance_date),

      performance_time:
        normalizeTime(existing.performance_time) !==
        normalizeTime(artist.performance_time),

      performance_end_time:
        normalizeTime(existing.performance_end_time) !==
        normalizeTime(artist.performance_end_time),
      stage_name:
        normalizeText(existing.stage_name) !==
        normalizeText(artist.stage_name),

      status:
        normalizeText(existing.status) !==
        normalizeText(artist.status),
    };
  });
} else {
  parsedArtists.forEach((artist) => {
    changes[artist.normalized_name] = {
      isNew: true,
      aliases: false,
      performance_date: false,
      performance_time: false,
      performance_end_time: false,
      stage_name: false,
      status: false,
    };
  });
}

setLineupChanges(changes);

      setFileName(file.name);
      setFestival(parsedFestival);
      setArtists(parsedArtists);
    } catch (error) {
      setFileName("");

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "파일을 읽는 중 오류가 발생했습니다."
      );
    }
  }

  async function handleApplyImport() {
  if (!festival || artists.length === 0) {
    setErrorMessage("등록할 데이터가 없습니다.");
    return;
  }

  setIsSaving(true);
  setErrorMessage("");
  setImportResult(null);

  try {
    const { data, error } = await supabase.rpc(
      "import_festival_from_xlsx",
      {
        p_festival: festival,
        p_artists: artists,
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    const result = data as ImportResult;

setImportResult(result);

const resetChanges: Record<string, LineupChangeFlags> = {};

artists.forEach((artist) => {
  resetChanges[artist.normalized_name] = {
    isNew: false,
    aliases: false,
    performance_date: false,
    performance_time: false,
    performance_end_time: false,
    stage_name: false,
    status: false,
  };
});

setLineupChanges(resetChanges);

setExistingFestival({
  id: result.festival_id,
  name: festival.name,
  normalized_name: festival.normalized_name,
  start_date: festival.start_date,
  end_date: festival.end_date,
});

  } catch (error) {
    setErrorMessage(
      error instanceof Error
        ? error.message
        : "데이터 반영 중 오류가 발생했습니다."
    );
  } finally {
    setIsSaving(false);
  }
}

  function handleReset() {
    setFileName("");
    setFestival(null);
    setArtists([]);
    setExistingFestival(null);
    setLineupChanges({});
    setImportResult(null);
    setIsSaving(false);
    setErrorMessage("");

    if (fileInputRef.current) {
        fileInputRef.current.value = "";
        }
    }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-2 text-2xl font-bold">
        통합 페스티벌 XLSX 등록
      </h1>

      <p className="mb-6 text-sm text-gray-600">
        festival 시트와 artists 시트를 한 번에 읽습니다.
      </p>

      <div className="mb-6 rounded-lg border bg-white p-5">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
        />

        {fileName && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm">
              선택 파일: {fileName}
            </span>

            <button
              type="button"
              onClick={handleReset}
              className="rounded border px-3 py-1 text-sm"
            >
              초기화
            </button>
          </div>
        )}

        {errorMessage && (
          <p className="mt-3 text-sm text-red-600">
            {errorMessage}
          </p>
        )}
      </div>


        {festival && existingFestival && (
            <div className="mb-6 rounded-lg border border-orange-300 bg-orange-50 p-5">
                <h2 className="mb-2 font-bold text-orange-800">
                동일한 페스티벌이 이미 등록되어 있습니다.
                </h2>

                <div className="text-sm text-orange-900">
                <p>기존 ID: {existingFestival.id}</p>
                <p>기존 이름: {existingFestival.name}</p>
                <p>
                    normalized_name: {existingFestival.normalized_name}
                </p>
                <p>시작일: {existingFestival.start_date}</p>
                </div>

                <p className="mt-3 text-sm font-medium">
                신규 등록하지 않고 기존 페스티벌에 라인업을 추가해야 합니다.
                </p>
            </div>
            )}

            {festival && !existingFestival && (
            <div className="mb-6 rounded-lg border border-green-300 bg-green-50 p-4">
                <p className="font-medium text-green-800">
                동일한 normalized_name이 없습니다. 신규 등록 가능합니다.
                </p>
            </div>
            )}

      {festival && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">
            페스티벌 미리보기
          </h2>

          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <th className="w-48 bg-gray-50 p-3 text-left">
                    페스티벌명
                  </th>
                  <td className="p-3">{festival.name}</td>
                </tr>

                <tr className="border-b">
                  <th className="bg-gray-50 p-3 text-left">
                    normalized_name
                  </th>
                  <td className="p-3">
                    {festival.normalized_name}
                  </td>
                </tr>

                <tr className="border-b">
                  <th className="bg-gray-50 p-3 text-left">
                    검색 별칭
                  </th>
                  <td className="p-3">
                    {festival.search_aliases || "-"}
                  </td>
                </tr>

                <tr className="border-b">
                  <th className="bg-gray-50 p-3 text-left">
                    기간
                  </th>
                  <td className="p-3">
                    {festival.start_date} ~ {festival.end_date}
                  </td>
                </tr>

                <tr>
                  <th className="bg-gray-50 p-3 text-left">
                    장소
                  </th>
                  <td className="p-3">
                    {festival.location || "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {artists.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">
            아티스트 미리보기
            <span className="ml-2 text-sm font-normal text-gray-500">
              총 {artists.length}명
            </span>
          </h2>

          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border-b p-3 text-left">입력명</th>
                  <th className="border-b p-3 text-left">공식명</th>
                  <th className="border-b p-3 text-left">
                    normalized_name
                  </th>
                  <th className="border-b p-3 text-left">별칭</th>
                  <th className="border-b p-3 text-left">공연일</th>
                  <th className="border-b p-3 text-left">시작시간</th>
                  <th className="border-b p-3 text-left">종료시간</th>
                  <th className="border-b p-3 text-left">스테이지</th>
                  <th className="border-b p-3 text-left">상태</th>
                  <th className="border-b p-3 text-left">결과</th>
                </tr>
              </thead>

              <tbody>
                {artists.map((artist, index) => {
                    const changes =
                    lineupChanges[artist.normalized_name];

                    const hasChanges =
                    changes &&
                    (
                        changes.aliases ||
                        changes.performance_date ||
                        changes.performance_time ||
                        changes.performance_end_time ||
                        changes.stage_name ||
                        changes.status
                    );

                    return (
                    <tr key={`${artist.normalized_name}-${index}`}>
                        <td className="border-b p-3">
                        {artist.input_name}
                        </td>

                        <td className="border-b p-3">
                        {artist.display_name}
                        </td>

                        <td className="border-b p-3">
                        {artist.normalized_name}
                        </td>

                        <td className="border-b p-3">
                        {artist.aliases || "-"}
                        {changes?.aliases && (
                            <span className="ml-2">✅</span>
                        )}
                        </td>

                        <td className="border-b p-3">
                        {artist.performance_date || "-"}
                        {changes?.performance_date && (
                            <span className="ml-2">✅</span>
                        )}
                        </td>

                        <td className="border-b p-3">
                        {artist.performance_time || "-"}
                        {changes?.performance_time && (
                            <span className="ml-2">✅</span>
                        )}
                        </td>

                        <td className="border-b p-3">
                        {artist.performance_end_time || "-"}
                        {changes?.performance_end_time && (
                            <span className="ml-2">✅</span>
                        )}
                        </td>

                        <td className="border-b p-3">
                        {artist.stage_name || "-"}
                        {changes?.stage_name && (
                            <span className="ml-2">✅</span>
                        )}
                        </td>

                        <td className="border-b p-3">
                        {artist.status || "-"}
                        {changes?.status && (
                            <span className="ml-2">✅</span>
                        )}
                        </td>

                        <td className="border-b p-3">
                        {changes?.isNew ? (
                            <span className="font-medium text-blue-600">
                            신규 추가
                            </span>
                        ) : hasChanges ? (
                            <span className="font-medium text-orange-600">
                            업데이트
                            </span>
                        ) : (
                            <span className="text-gray-500">
                            변경 없음
                            </span>
                        )}
                        </td>
                    </tr>
                    );
                })}
                </tbody>
            </table>
          </div>
        </section>
      )}
      {festival && artists.length > 0 && !importResult && (
        <div className="mt-8 rounded-lg border bg-white p-5">
            <button
            type="button"
            onClick={handleApplyImport}
            disabled={isSaving}
            className="rounded bg-blue-600 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
            {isSaving 
                ? "반영 중..."
                : existingFestival
                    ? "추가·변경사항 반영"
                    : "신규 페스티벌 등록"}
            </button>
        </div>
        )}

        {importResult && (
            <div className="mt-8 rounded-lg border border-green-300 bg-green-50 p-5">
                <h2 className="mb-3 text-lg font-bold text-green-800">
                반영 완료
                </h2>

                <div className="space-y-1 text-sm">
                <p>페스티벌 ID: {importResult.festival_id}</p>
                <p>
                    페스티벌 신규 생성:{" "}
                    {importResult.created_festival ? "예" : "아니오"}
                </p>
                <p>신규 아티스트: {importResult.created_artists}명</p>
                <p>별칭 추가: {importResult.added_aliases}개</p>
                <p>라인업 추가: {importResult.added_lineup}명</p>
                <p>라인업 업데이트: {importResult.updated_lineup}명</p>
                <p>변경 없음: {importResult.unchanged_lineup}명</p>
                </div>
            </div>
            )}

    </main>
  );
}
