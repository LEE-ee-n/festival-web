"use client";

import { useEffect, useState } from "react";

import {
  searchArtists,
  type ArtistSearchResult,
} from "@/lib/artists/searchArtists";
import { normalizeArtistName } from "@/lib/artists/normalizeArtistName";
import type { FestivalDraftJson } from "@/lib/types";

type Artist = FestivalDraftJson["artists"][number];

type Props = {
  artists: Artist[];
  onAdd: () => void;
  onMatchAll: () => void;
  isMatching: boolean;
  onChange: (
    index: number,
    field: keyof Artist,
    value: string | string[] | number | null,
  ) => void;
  onDelete: (index: number) => void;
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

type MatchControlProps = {
  artist: Artist;
  index: number;
  onChange: Props["onChange"];
  onMatchAll: Props["onMatchAll"];
};

function ArtistMatchControl({
  artist,
  index,
  onChange,
  onMatchAll,
}: MatchControlProps) {
  const [keyword, setKeyword] = useState(
    artist.display_name || artist.input_name,
  );
  const [results, setResults] = useState<ArtistSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function runSearch(searchKeyword: string) {
    if (!searchKeyword.trim()) {
      setSearchError("검색할 아티스트 이름을 입력하세요.");
      return;
    }
    try {
      setIsSearching(true);
      setSearchError(null);
      setResults(await searchArtists(searchKeyword.trim()));
      setHasSearched(true);
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : "아티스트 검색에 실패했습니다.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSearch() {
    await runSearch(keyword);
  }

  useEffect(() => {
    if (artist.match_status === "matched") return;

    const autoKeyword = (artist.display_name || artist.input_name).trim();
    if (!autoKeyword) return;

    const timer = window.setTimeout(() => {
      void runSearch(autoKeyword);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [artist.display_name, artist.input_name, artist.match_status]);

  function selectExisting(result: ArtistSearchResult) {
    onChange(index, "matched_artist_id", result.id);
    onChange(index, "match_status", "matched");
    onChange(index, "display_name", result.name);
    onChange(index, "normalized_name", result.normalized_name);
    setKeyword(result.name);
    setResults([]);
    setHasSearched(true);
  }

  function selectNew() {
    onChange(index, "matched_artist_id", null);
    onChange(index, "match_status", "new");
    setResults([]);
    setHasSearched(true);
  }

  const matchReason = artist.match_status === "matched"
    ? `DB의 ${artist.normalized_name}과 정확히 일치해 기존 아티스트로 연결됐습니다.`
    : artist.match_status === "new"
      ? `DB에 ${artist.normalized_name}과 정확히 일치하는 값이 없어 신규 등록 대상으로 판별됐습니다.`
      : artist.normalized_name.trim()
        ? "normalized_name을 입력하거나 수정한 뒤 아직 중복 확인을 실행하지 않았습니다."
        : "normalized_name이 비어 있어 자동으로 판별할 수 없습니다.";

  return (
    <div className="mb-4 rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-800">
          normalized_name 중복 확인
        </p>
        <span
          className={[
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            artist.match_status === "matched"
              ? "bg-emerald-100 text-emerald-700"
              : artist.match_status === "new"
                ? "bg-purple-100 text-purple-700"
                : "bg-amber-100 text-amber-700",
          ].join(" ")}
        >
          {artist.match_status === "matched"
            ? "✅ 기존 아티스트 확인"
            : artist.match_status === "new"
              ? "🆕 신규 아티스트"
              : "⚠️ 확인 필요"}
        </span>
      </div>

      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-700">{matchReason}</p>
        {artist.match_status === "pending" && artist.normalized_name.trim() && (
          <button
            type="button"
            onClick={onMatchAll}
            className="mt-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800"
          >
            입력한 값으로 중복 확인
          </button>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleSearch();
            }
          }}
          placeholder="이름으로 기존 아티스트 직접 검색 (보조)"
          className={inputClass}
        />
        <button
          type="button"
          disabled={isSearching}
          onClick={() => void handleSearch()}
          className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSearching ? "검색 중" : "검색"}
        </button>
      </div>

      {searchError && (
        <p className="mt-2 text-xs font-semibold text-red-600">{searchError}</p>
      )}

      {results.length > 0 && (
        <div className="mt-3 space-y-2">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => selectExisting(result)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:border-slate-500"
            >
              <span className="font-semibold text-slate-900">{result.name}</span>
              <span className="text-right text-xs text-slate-500">
                <span className="block font-semibold text-slate-700">
                  유사도 {Math.round(
                    Math.min(1, Math.max(0, result.similarity_score)) * 100,
                  )}%
                </span>
                <span>{result.normalized_name}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {hasSearched && !isSearching && results.length === 0 && !searchError && (
        <p className="mt-3 text-xs font-semibold text-slate-500">
          유사한 기존 아티스트를 찾지 못했습니다.
        </p>
      )}

      {artist.match_status === "pending" && (
        <button
          type="button"
          onClick={selectNew}
          className="mt-3 text-xs font-semibold text-purple-700 underline"
        >
          같은 기존 아티스트가 없음 → 신규 아티스트로 등록
        </button>
      )}
    </div>
  );
}

export default function CandidateLineupTab({
  artists,
  onAdd,
  onMatchAll,
  isMatching,
  onChange,
  onDelete,
}: Props) {
  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">라인업 관리</h3>
          <p className="mt-1 text-sm text-slate-500">
            추출된 출연진 이름과 공연 일정을 확인합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isMatching || artists.length === 0}
            onClick={onMatchAll}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {isMatching ? "중복 확인 중..." : "normalized_name 전체 중복 확인"}
          </button>
          <button
            type="button"
            onClick={onAdd}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            아티스트 추가
          </button>
        </div>
      </div>

      {artists.length === 0 ? (
        <p className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          추출된 아티스트가 없습니다. 빈 상태로도 축제를 승인할 수 있습니다.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {artists.map((artist, index) => (
            <div
              key={index}
              data-approval-artist-index={index}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <ArtistMatchControl
                artist={artist}
                index={index}
                onChange={onChange}
                onMatchAll={onMatchAll}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">
                  포스터 표기 이름
                  <input
                    value={artist.input_name}
                    onChange={(event) =>
                      onChange(index, "input_name", event.target.value)
                    }
                    className={`mt-1 ${inputClass}`}
                  />
                  {!artist.normalized_name.trim() && (
                    <span className="mt-1.5 block rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-bold text-amber-800">
                      ⚠️ normalized_name이 비어 있습니다. 입력하고 중복 확인을 완료해야 승인할 수 있습니다.
                    </span>
                  )}
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  표시 이름
                  <input
                    value={artist.display_name}
                    onChange={(event) =>
                      onChange(index, "display_name", event.target.value)
                    }
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  중복 판별값 (normalized_name)
                  <input
                    value={artist.normalized_name}
                    onChange={(event) =>
                      onChange(
                        index,
                        "normalized_name",
                        event.target.value,
                      )
                    }
                    onBlur={(event) =>
                      onChange(
                        index,
                        "normalized_name",
                        normalizeArtistName(event.currentTarget.value),
                      )
                    }
                    placeholder="예: hyukoh, 10cm"
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  별칭 (쉼표로 구분)
                  <input
                    value={
                      Array.isArray(artist.aliases)
                        ? artist.aliases.join(", ")
                        : String(artist.aliases ?? "")
                    }
                    onChange={(event) =>
                      onChange(
                        index,
                        "aliases",
                        event.target.value
                          .split(",")
                          .map((value) => value.trim())
                          .filter(Boolean),
                      )
                    }
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  공연 날짜
                  <input
                    type="date"
                    value={artist.performance_date ?? ""}
                    onChange={(event) =>
                      onChange(index, "performance_date", event.target.value)
                    }
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  무대
                  <input
                    value={artist.stage_name ?? ""}
                    onChange={(event) =>
                      onChange(index, "stage_name", event.target.value)
                    }
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  시작 시간
                  <input
                    type="time"
                    value={artist.performance_time?.slice(0, 5) ?? ""}
                    onChange={(event) =>
                      onChange(index, "performance_time", event.target.value)
                    }
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  종료 시간
                  <input
                    type="time"
                    value={artist.performance_end_time?.slice(0, 5) ?? ""}
                    onChange={(event) =>
                      onChange(
                        index,
                        "performance_end_time",
                        event.target.value,
                      )
                    }
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  상태
                  <select
                    value={artist.status ?? "confirmed"}
                    onChange={(event) =>
                      onChange(index, "status", event.target.value)
                    }
                    className={`mt-1 ${inputClass}`}
                  >
                    <option value="confirmed">확정</option>
                    <option value="scheduled">예정</option>
                    <option value="cancelled">취소</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onDelete(index)}
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
