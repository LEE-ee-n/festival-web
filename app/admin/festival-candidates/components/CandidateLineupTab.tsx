"use client";

import { useState } from "react";

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
};

function ArtistMatchControl({
  artist,
  index,
  onChange,
}: MatchControlProps) {
  const [keyword, setKeyword] = useState(
    artist.display_name || artist.input_name,
  );
  const [results, setResults] = useState<ArtistSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function handleSearch() {
    if (!keyword.trim()) {
      setSearchError("검색할 아티스트 이름을 입력하세요.");
      return;
    }
    try {
      setIsSearching(true);
      setSearchError(null);
      setResults(await searchArtists(keyword.trim()));
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : "아티스트 검색에 실패했습니다.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  function selectExisting(result: ArtistSearchResult) {
    onChange(index, "matched_artist_id", result.id);
    onChange(index, "match_status", "matched");
    onChange(index, "display_name", result.name);
    onChange(index, "normalized_name", result.normalized_name);
    setKeyword(result.name);
    setResults([]);
  }

  function selectNew() {
    onChange(index, "matched_artist_id", null);
    onChange(index, "match_status", "new");
    setResults([]);
  }

  return (
    <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
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
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:border-blue-400"
            >
              <span className="font-semibold text-slate-900">{result.name}</span>
              <span className="text-xs text-slate-500">
                {result.normalized_name}
              </span>
            </button>
          ))}
        </div>
      )}

      {artist.match_status !== "matched" && (
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
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
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
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            아티스트 추가
          </button>
        </div>
      </div>

      {artists.length === 0 ? (
        <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          추출된 아티스트가 없습니다. 빈 상태로도 축제를 승인할 수 있습니다.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {artists.map((artist, index) => (
            <div
              key={`${index}-${artist.input_name}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <ArtistMatchControl
                artist={artist}
                index={index}
                onChange={onChange}
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
                        normalizeArtistName(event.target.value),
                      )
                    }
                    onBlur={onMatchAll}
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
