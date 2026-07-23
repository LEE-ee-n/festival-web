"use client";

import { supabase } from "@/lib/supabase/client";
import {
  parseFestivalLineupImportResult,
  type FestivalLineupImportResult,
} from "@/lib/supabase/rpcResults";
import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useRef,
  useState,
} from "react";
import Papa from "papaparse";

type CsvArtistRow = {
  input_name: string;
  display_name: string;
  normalized_name: string;
  aliases: string;
};

type FestivalSummary = {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
};

type MatchStatus =
  | "pending"
  | "matched"
  | "review"
  | "new"
  | "error";

type SimilarArtist = {
  id: number;
  name: string;
  normalized_name: string;
  similarity_score: number;
  aliases: string[];
};

type PreviewArtistRow = CsvArtistRow & {
  matchStatus: MatchStatus;
  matchedArtist: SimilarArtist | null;
  candidates: SimilarArtist[];
};

const REQUIRED_COLUMNS: Array<keyof CsvArtistRow> = [
  "input_name",
  "display_name",
  "normalized_name",
  "aliases",
];

function formatFestivalPeriod(
  startDate: string | null,
  endDate: string | null,
) {
  if (!startDate && !endDate) {
    return "기간 미등록";
  }

  if (startDate && !endDate) {
    return startDate;
  }

  if (!startDate && endDate) {
    return endDate;
  }

  if (startDate === endDate) {
    return startDate;
  }

  return `${startDate} ~ ${endDate}`;
}

export default function FestivalImportPage() {
  const [festivalSearch, setFestivalSearch] = useState("");
  const [festivalResults, setFestivalResults] = useState<
    FestivalSummary[]
  >([]);
  const [selectedFestival, setSelectedFestival] =
    useState<FestivalSummary | null>(null);

  const [isSearchingFestivals, setIsSearchingFestivals] =
    useState(false);

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<PreviewArtistRow[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);

  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] =
    useState<FestivalLineupImportResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFestivalSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const keyword = festivalSearch.trim();

    if (!keyword) {
      setErrorMessage("검색할 페스티벌명을 입력하세요.");
      return;
    }

    try {
      setIsSearchingFestivals(true);
      setErrorMessage(null);
      setFestivalResults([]);
      setSelectedFestival(null);

      const { data, error } = await supabase
        .from("festivals")
        .select(`
          id,
          name,
          start_date,
          end_date
        `)
        .or(
          `name.ilike.%${keyword}%,search_aliases.ilike.%${keyword}%`
        )
        .order("start_date", {
          ascending: false,
          nullsFirst: false,
        })
        .limit(20);

      if (error) {
        throw error;
      }

      setFestivalResults(data ?? []);
    } catch (error) {
      console.error("페스티벌 검색 오류:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "페스티벌 검색에 실패했습니다.",
      );
    } finally {
      setIsSearchingFestivals(false);
    }
  }

  function handleSelectFestival(
    festival: FestivalSummary,
  ) {
    setSelectedFestival(festival);
    setErrorMessage(null);
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    setRows([]);
    setErrorMessage(null);

    Papa.parse<CsvArtistRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),

      complete: (result) => {
        const fields = result.meta.fields ?? [];

        const missingColumns = REQUIRED_COLUMNS.filter(
          (column) => !fields.includes(column),
        );

        if (missingColumns.length > 0) {
          setErrorMessage(
            `필수 컬럼이 없습니다: ${missingColumns.join(", ")}`,
          );
          return;
        }

        if (result.errors.length > 0) {
          setErrorMessage(
            result.errors
              .map((error) => error.message)
              .join(", "),
          );
          return;
        }

        const cleanedRows: PreviewArtistRow[] =
          result.data
            .map(
              (row): PreviewArtistRow => ({
                input_name:
                  row.input_name?.trim() ?? "",
                display_name:
                  row.display_name?.trim() ?? "",
                normalized_name:
                  row.normalized_name?.trim() ?? "",
                aliases: row.aliases?.trim() ?? "",
                matchStatus: "pending",
                matchedArtist: null,
                candidates: [],
              }),
            )
            .filter(
              (row) => row.input_name.length > 0,
            );

        setRows(cleanedRows);
      },

      error: (error) => {
        setErrorMessage(error.message);
      },
    });
  }

  async function handleMatchArtists() {
    if (!selectedFestival) {
      setErrorMessage("연결할 페스티벌을 선택하세요.");
      return;
    }

    if (rows.length === 0) {
      setErrorMessage("CSV 파일을 먼저 선택하세요.");
      return;
    }

    try {
      setIsMatching(true);
      setErrorMessage(null);

      const matchedRows = await Promise.all(
        rows.map(
          async (
            row,
          ): Promise<PreviewArtistRow> => {
            try {
              const { data, error } =
                await supabase.rpc(
                  "search_similar_artists",
                  {
                    input_name: row.input_name,
                  },
                );

              if (error) {
                throw error;
              }

              const rawCandidates = data ?? [];

              const artistIds = rawCandidates.map(
                (candidate) => candidate.id,
              );

              let candidates: SimilarArtist[] =
                rawCandidates.map((candidate) => ({
                  ...candidate,
                  aliases: [],
                }));

              if (artistIds.length > 0) {
                const { data: aliasData, error: aliasError } =
                  await supabase
                    .from("artist_aliases")
                    .select("artist_id, alias_name")
                    .in("artist_id", artistIds);

                if (aliasError) {
                  throw aliasError;
                }

                candidates = candidates.map((candidate) => ({
                  ...candidate,
                  aliases:
                    aliasData
                      ?.filter(
                        (alias) =>
                          alias.artist_id === candidate.id,
                      )
                      .map((alias) => alias.alias_name) ?? [],
                }));
              }

              if (candidates.length === 0) {
                return {
                  ...row,
                  matchStatus: "new",
                  matchedArtist: null,
                  candidates: [],
                };
              }

              const exactCandidate =
                candidates.find(
                  (candidate) =>
                    candidate.normalized_name ===
                      row.normalized_name ||
                    candidate.similarity_score >=
                      0.99,
                );

              if (exactCandidate) {
                return {
                  ...row,
                  matchStatus: "matched",
                  matchedArtist: exactCandidate,
                  candidates,
                };
              }

              return {
                ...row,
                matchStatus: "review",
                matchedArtist: candidates[0],
                candidates,
              };
            } catch (error) {
              console.error(
                `${row.input_name} 매칭 오류:`,
                error,
              );

              return {
                ...row,
                matchStatus: "error",
                matchedArtist: null,
                candidates: [],
              };
            }
          },
        ),
      );

      setRows(matchedRows);
    } finally {
      setIsMatching(false);
    }
  }

  async function handleImportLineup() {
    if (!selectedFestival) {
      setErrorMessage("연결할 페스티벌을 선택하세요.");
      return;
    }

    if (rows.length === 0) {
      setErrorMessage("등록할 아티스트가 없습니다.");
      return;
    }

    const hasUnmatchedRows = rows.some(
      (row) =>
        row.matchStatus === "pending" ||
        row.matchStatus === "error",
    );

    if (hasUnmatchedRows) {
      setErrorMessage(
        "DB 매칭이 완료되지 않았거나 오류가 있는 아티스트가 있습니다.",
      );
      return;
    }

    const confirmed = window.confirm(
      `${selectedFestival.name}에 ${rows.length}명의 라인업을 등록하시겠습니까?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsImporting(true);
      setErrorMessage(null);
      setImportResult(null);

      const artistsPayload = rows.map((row) => ({
        input_name: row.input_name,
        display_name: row.display_name,
        normalized_name: row.normalized_name,
        matched_artist_id:
          row.matchedArtist?.id ?? null,
        aliases: row.aliases
          .split(",")
          .map((alias) => alias.trim())
          .filter(Boolean),
      }));

      const { data, error } = await supabase.rpc(
        "import_festival_lineup",
        {
          p_festival_id: selectedFestival.id,
          p_artists: artistsPayload,
        },
      );

      if (error) {
        throw error;
      }

      setImportResult(parseFestivalLineupImportResult(data));
    } catch (error) {
      console.error("라인업 등록 오류:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "라인업 등록에 실패했습니다.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  function handleAliasChange(
    rowIndex: number,
    value: string,
  ) {
    setRows((currentRows) =>
      currentRows.map((row, index) =>
        index === rowIndex
          ? { ...row, aliases: value }
          : row,
      ),
    );
  }

  function handleMatchSelection(
    rowIndex: number,
    selectedValue: string,
  ) {
    setRows((currentRows) =>
      currentRows.map((row, index) => {
        if (index !== rowIndex) {
          return row;
        }

        if (selectedValue === "new") {
          return {
            ...row,
            matchedArtist: null,
            matchStatus: "new",
          };
        }

        const selectedId = Number(selectedValue);

        const selectedCandidate =
          row.candidates.find(
            (candidate) =>
              candidate.id === selectedId,
          );

        if (!selectedCandidate) {
          return row;
        }

        return {
          ...row,
          matchedArtist: selectedCandidate,
          matchStatus: "matched",
        };
      }),
    );
  }

  function resetPage() {
    setFestivalSearch("");
    setFestivalResults([]);
    setSelectedFestival(null);
    setFileName("");
    setRows([]);
    setErrorMessage(null);
    setImportResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← 홈페이지로 돌아가기
        </Link>

        <header className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            관리자
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            페스티벌 라인업 CSV 가져오기
          </h1>

          <p className="mt-3 text-slate-500">
            페스티벌을 선택하고 CSV 라인업을
            불러옵니다.
          </p>
        </header>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleFestivalSearch}>
            <label
              htmlFor="festivalSearch"
              className="block text-sm font-semibold text-slate-700"
            >
              연결할 페스티벌 검색
            </label>

            <div className="mt-3 flex max-w-2xl gap-3">
              <input
                id="festivalSearch"
                type="text"
                value={festivalSearch}
                onChange={(event) => {
                  setFestivalSearch(
                    event.target.value,
                  );
                  setSelectedFestival(null);
                }}
                placeholder="예: 렛츠락"
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />

              <button
                type="submit"
                disabled={isSearchingFestivals}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSearchingFestivals
                  ? "검색 중..."
                  : "검색"}
              </button>
            </div>
          </form>

          {festivalResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {festivalResults.map((festival) => {
                const isSelected =
                  selectedFestival?.id === festival.id;

                return (
                  <button
                    key={festival.id}
                    type="button"
                    onClick={() =>
                      handleSelectFestival(festival)
                    }
                    className={[
                      "w-full rounded-xl border p-4 text-left transition",
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-400",
                    ].join(" ")}
                  >
                    <p className="font-semibold text-slate-900">
                      {festival.name}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {formatFestivalPeriod(
                        festival.start_date,
                        festival.end_date,
                      )}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {selectedFestival && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-semibold text-green-800">
                선택한 페스티벌
              </p>

              <p className="mt-1 font-bold text-green-900">
                {selectedFestival.name}
              </p>

              <p className="mt-1 text-sm text-green-700">
                {formatFestivalPeriod(
                  selectedFestival.start_date,
                  selectedFestival.end_date,
                )}
              </p>
            </div>
          )}

          <div className="mt-7">
            <label
              htmlFor="csvFile"
              className="block text-sm font-semibold text-slate-700"
            >
              CSV 파일 선택
            </label>

            <input
              ref={fileInputRef}
              id="csvFile"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="mt-3 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            />
          </div>

          {fileName && (
            <p className="mt-3 text-sm text-slate-600">
              선택한 파일:{" "}
              <strong className="text-slate-900">
                {fileName}
              </strong>
            </p>
          )}

          {errorMessage && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          {!selectedFestival && rows.length > 0 && (
            <p className="mt-4 text-sm font-medium text-amber-600">
              연결할 페스티벌을 검색해서 선택하세요.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleMatchArtists}
              disabled={
                rows.length === 0 ||
                isMatching ||
                !selectedFestival
              }
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isMatching
                ? "DB 확인 중..."
                : "기존 아티스트 매칭"}
            </button>

            <button
              type="button"
              onClick={handleImportLineup}
              disabled={
                rows.length === 0 ||
                isMatching ||
                isImporting ||
                !selectedFestival ||
                rows.some(
                  (row) =>
                    row.matchStatus === "pending" ||
                    row.matchStatus === "error",
                )
              }
              className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isImporting
                ? "등록 중..."
                : "페스티벌 라인업 최종 등록"}
            </button>

            <button
              type="button"
              onClick={resetPage}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              초기화
            </button>
          </div>
        </section>

        {rows.length > 0 && (
          <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-bold text-slate-900">
                CSV 미리보기
              </h2>

              <span className="text-sm text-slate-500">
                {rows.length}개 아티스트
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      순서
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      입력 이름
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      대표 이름
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      정규화 이름
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      별칭
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      DB 매칭 결과
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      상태
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, index) => (
                    <tr
                      key={`${row.input_name}-${index}`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {index + 1}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                        {row.input_name}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {row.display_name}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600">
                        {row.normalized_name}
                      </td>

                      <td className="min-w-72 px-4 py-3">
                        {row.matchedArtist?.aliases.length ? (
                          <p className="mb-2 text-xs text-slate-500">
                            기존 DB 별칭:{" "}
                            {row.matchedArtist.aliases.join(", ")}
                          </p>
                        ) : (
                          <p className="mb-2 text-xs text-slate-400">
                            기존 DB 별칭 없음
                          </p>
                        )}

                        <input
                          type="text"
                          value={row.aliases}
                          onChange={(event) =>
                            handleAliasChange(index, event.target.value)
                          }
                          placeholder="추가할 별칭 , 로 구분"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                        />
                      </td>

                      <td className="min-w-64 px-4 py-3">
                        {row.candidates.length > 0 ? (
                          <select
                            value={
                              row.matchedArtist
                                ? String(
                                    row.matchedArtist.id,
                                  )
                                : "new"
                            }
                            onChange={(event) =>
                              handleMatchSelection(
                                index,
                                event.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                          >
                            {row.candidates.map(
                              (candidate) => (
                                <option
                                  key={candidate.id}
                                  value={candidate.id}
                                >
                                  {candidate.name} (ID:{" "}
                                  {candidate.id},{" "}
                                  {Math.round(
                                    candidate.similarity_score *
                                      100,
                                  )}
                                  %)
                                </option>
                              ),
                            )}

                            <option value="new">
                              신규 아티스트로 생성
                            </option>
                          </select>
                        ) : row.matchStatus === "new" ? (
                          <span className="font-semibold text-blue-700">
                            신규 아티스트로 생성
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            -
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {row.matchStatus ===
                          "pending" && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            확인 전
                          </span>
                        )}

                        {row.matchStatus ===
                          "matched" && (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            기존 사용
                          </span>
                        )}

                        {row.matchStatus ===
                          "review" && (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                            확인 필요
                          </span>
                        )}

                        {row.matchStatus === "new" && (
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            신규 생성
                          </span>
                        )}

                        {row.matchStatus ===
                          "error" && (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            오류
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {importResult && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-5">
            <p className="font-bold text-green-900">
              라인업 등록이 완료되었습니다.
            </p>

            <div className="mt-3 grid gap-2 text-sm text-green-800 sm:grid-cols-2">
              <p>
                신규 아티스트:{" "}
                <strong>
                  {importResult.new_artist_count}명
                </strong>
              </p>

              <p>
                기존 아티스트:{" "}
                <strong>
                  {importResult.existing_artist_count}명
                </strong>
              </p>

              <p>
                페스티벌 연결:{" "}
                <strong>
                  {importResult.linked_count}명
                </strong>
              </p>

              <p>
                기존 연결 중복 제외:{" "}
                <strong>
                  {importResult.already_linked_count}명
                </strong>
              </p>

              <p>
                추가된 별칭:{" "}
                <strong>
                  {importResult.alias_count}개
                </strong>
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {selectedFestival && (
                <Link
                  href={`/festival/${selectedFestival.id}`}
                  className="rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
                >
                  페스티벌 상세 페이지 보기
                </Link>
              )}

              <button
                type="button"
                onClick={resetPage}
                className="rounded-xl border border-green-300 bg-white px-5 py-3 text-sm font-semibold text-green-800 hover:bg-green-100"
              >
                새 CSV 등록
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
