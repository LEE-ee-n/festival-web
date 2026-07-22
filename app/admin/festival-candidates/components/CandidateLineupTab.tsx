"use client";

import { useEffect, useState } from "react";

import {
  searchArtists,
  type ArtistSearchResult,
} from "@/lib/artists/searchArtists";
import type { ExistingArtistMatch } from "@/lib/artists/applyNormalizedArtistMatches";
import { normalizeArtistName } from "@/lib/artists/normalizeArtistName";
import {
  canEditArtistReviewField,
  type ArtistReviewEditableField,
} from "@/lib/festivals/festivalDraft";
import type { FestivalDraftJson } from "@/lib/types";

type Artist = FestivalDraftJson["artists"][number];
type MatchStatus = "pending" | "new" | "excluded";

type Props = {
  artists: Artist[];
  mode?: "review" | "timetable";
  designVariant?: "default" | "existing-update";
  onAdd: () => void;
  onMatchAll: () => void;
  isMatching: boolean;
  onChange: (
    index: number,
    field: keyof Artist,
    value: string | string[] | number | null,
  ) => void;
  onReviewFieldChange: (
    index: number,
    field: ArtistReviewEditableField,
    value: string | string[],
  ) => void;
  onSelectExisting: (index: number, artist: ExistingArtistMatch) => void;
  onSetMatchStatus: (index: number, status: MatchStatus) => void;
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900";
const reviewInputClass =
  "h-7 w-full border-0 border-b border-gray-300 bg-transparent px-1 py-0 text-center text-sm leading-7 text-gray-900 outline-none focus:border-gray-600 focus:ring-0";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block text-[11px] font-bold text-gray-500 lg:hidden">
      {children}
    </span>
  );
}

function ReadonlyValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 lg:px-1">
      <FieldLabel>{label}</FieldLabel>
      <p className="min-h-7 break-words text-center text-sm leading-7 text-gray-700">
        {value || "-"}
      </p>
    </div>
  );
}

type ArtistSearchPanelProps = {
  artist: Artist;
  index: number;
  onSelectExisting: Props["onSelectExisting"];
  onSetMatchStatus: Props["onSetMatchStatus"];
  onClose: () => void;
};

function ArtistSearchPanel({
  artist,
  index,
  onSelectExisting,
  onSetMatchStatus,
  onClose,
}: ArtistSearchPanelProps) {
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

  useEffect(() => {
    if (artist.match_status !== "pending") return;
    const autoKeyword = (artist.display_name || artist.input_name).trim();
    if (!autoKeyword) return;
    const timer = window.setTimeout(() => {
      void runSearch(autoKeyword);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [artist.display_name, artist.input_name, artist.match_status]);

  function selectExisting(result: ArtistSearchResult) {
    onSelectExisting(index, {
      id: result.id,
      name: result.name,
      normalized_name: result.normalized_name,
      aliases: result.aliases ?? [],
    });
    setResults([]);
    onClose();
  }

  return (
    <div className="rounded-xl border border-gray-300 bg-gray-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-gray-700">기존 아티스트 검색·재선택</p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-gray-500 underline"
        >
          닫기
        </button>
      </div>

      {artist.match_status === "pending"
        && hasSearched
        && results.length === 0
        && !isSearching
        && !searchError && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
          <p>검색 결과와 같은 기존 아티스트가 없습니다.</p>
        </div>
      )}

      <div className="mt-3 flex flex-nowrap gap-2">
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void runSearch(keyword);
            }
          }}
          placeholder="이름으로 기존 아티스트 검색"
          className={`${inputClass} min-w-0`}
        />
        <button
          type="button"
          disabled={isSearching}
          onClick={() => void runSearch(keyword)}
          className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-600 disabled:opacity-50"
        >
          {isSearching ? "검색 중" : "검색"}
        </button>
        {artist.match_status === "pending" && (
          <button
            type="button"
            disabled={!hasSearched || isSearching || Boolean(searchError)}
            onClick={() => {
              onSetMatchStatus(index, "new");
              onClose();
            }}
            className="shrink-0 whitespace-nowrap rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
          >
            신규 아티스트 등록
          </button>
        )}
      </div>

      {searchError && (
        <p className="mt-2 text-xs font-semibold text-red-600">{searchError}</p>
      )}

      {results.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => selectExisting(result)}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm hover:border-gray-500"
            >
              <span>
                <span className="block font-semibold text-gray-900">{result.name}</span>
                <span className="block text-xs text-gray-500">{result.normalized_name}</span>
              </span>
              <span className="text-xs font-semibold text-gray-600">
                유사도 {Math.round(Math.min(1, Math.max(0, result.similarity_score)) * 100)}%
              </span>
            </button>
          ))}
        </div>
      )}

    </div>
  );
}

type ArtistReviewRowProps = {
  artist: Artist;
  index: number;
  onReviewFieldChange: Props["onReviewFieldChange"];
  onSelectExisting: Props["onSelectExisting"];
  onSetMatchStatus: Props["onSetMatchStatus"];
};

function ArtistReviewRow({
  artist,
  index,
  onReviewFieldChange,
  onSelectExisting,
  onSetMatchStatus,
}: ArtistReviewRowProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(
    artist.match_status === "pending",
  );
  const displayEditable = canEditArtistReviewField(artist, "display_name");
  const normalizedEditable = canEditArtistReviewField(artist, "normalized_name");
  const aliasesEditable = canEditArtistReviewField(artist, "aliases");

  return (
    <>
      <tr
        data-approval-artist-index={index}
        className="mb-3 block rounded-xl border border-gray-300 bg-white p-4 shadow-sm lg:mb-0 lg:table-row lg:rounded-none lg:border-0 lg:p-0 lg:shadow-none"
      >
        <td className="block min-w-0 border-gray-200 pb-3 text-center lg:table-cell lg:border-0 lg:border-b lg:p-3 lg:align-middle">
          <ReadonlyValue label="포스터 표기" value={artist.input_name} />
        </td>

        <td className="block min-w-0 border-gray-200 pb-3 text-center lg:table-cell lg:border-0 lg:border-b lg:p-3 lg:align-middle">
          <FieldLabel>표시 이름</FieldLabel>
          {displayEditable ? (
            <input
              data-approval-artist-name-index={index}
              value={artist.display_name}
              onChange={(event) =>
                onReviewFieldChange(index, "display_name", event.target.value)}
              className={reviewInputClass}
            />
          ) : (
            <ReadonlyValue label="" value={artist.display_name} />
          )}
        </td>

        <td className="block min-w-0 border-gray-200 pb-3 text-center lg:table-cell lg:border-0 lg:border-b lg:p-3 lg:align-middle">
          <FieldLabel>normalized_name</FieldLabel>
          {normalizedEditable ? (
            <input
              value={artist.normalized_name}
              onChange={(event) =>
                onReviewFieldChange(index, "normalized_name", event.target.value)}
              onBlur={(event) =>
                onReviewFieldChange(
                  index,
                  "normalized_name",
                  normalizeArtistName(event.currentTarget.value),
                )}
              placeholder="예: hyukoh"
              className={reviewInputClass}
            />
          ) : (
            <ReadonlyValue label="" value={artist.normalized_name} />
          )}
        </td>

        <td className="block min-w-0 border-gray-200 pb-3 text-center lg:table-cell lg:border-0 lg:border-b lg:p-3 lg:align-middle">
          <FieldLabel>별칭</FieldLabel>
          {aliasesEditable ? (
            <input
              value={artist.aliases.join(", ")}
              onChange={(event) =>
                onReviewFieldChange(
                  index,
                  "aliases",
                  event.target.value
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean),
                )}
              className={reviewInputClass}
            />
          ) : (
            <ReadonlyValue label="" value={artist.aliases.join(", ")} />
          )}
        </td>

        <td className="block border-gray-200 text-center lg:table-cell lg:w-[116px] lg:border-0 lg:border-b lg:px-2 lg:py-3 lg:align-middle">
          <FieldLabel>작업</FieldLabel>
          <div className="flex flex-nowrap justify-center gap-1">
          <button
            type="button"
            onClick={() => setIsSearchOpen((current) => !current)}
            className="w-14 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-1 py-2 text-xs font-semibold text-gray-600"
          >
            {artist.match_status === "matched" ? "재선택" : "검색"}
          </button>
          <button
            type="button"
            onClick={() => onSetMatchStatus(index, "excluded")}
            className="w-11 whitespace-nowrap rounded-lg border border-red-200 bg-white px-1 py-2 text-xs font-semibold text-red-600"
          >
            삭제
          </button>
          </div>
        </td>
      </tr>

      {artist.match_status === "pending" && !artist.normalized_name.trim() && (
        <tr className="mb-3 block lg:mb-0 lg:table-row">
          <td colSpan={5} className="block border-gray-200 lg:table-cell lg:border-0 lg:border-b lg:p-3">
            <p className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800">
              normalized_name을 입력하고 중복 확인을 완료해야 다음 단계로 갈 수 있습니다.
            </p>
          </td>
        </tr>
      )}

      {isSearchOpen && (
        <tr className="mb-3 block lg:mb-0 lg:table-row">
          <td className="hidden border-b border-gray-200 lg:table-cell" />
          <td colSpan={3} className="block border-gray-200 lg:table-cell lg:border-0 lg:border-b lg:p-3">
            <ArtistSearchPanel
              artist={artist}
              index={index}
              onSelectExisting={onSelectExisting}
              onSetMatchStatus={onSetMatchStatus}
              onClose={() => setIsSearchOpen(false)}
            />
          </td>
          <td className="hidden border-b border-gray-200 lg:table-cell" />
        </tr>
      )}
    </>
  );
}

type IndexedArtist = {
  artist: Artist;
  index: number;
};

type ArtistReviewGroupProps = {
  title: string;
  artists: IndexedArtist[];
  emphasis: "amber" | "purple" | "gray" | "green" | "red";
  onReviewFieldChange: Props["onReviewFieldChange"];
  onSelectExisting: Props["onSelectExisting"];
  onSetMatchStatus: Props["onSetMatchStatus"];
};

function ArtistReviewGroup({
  title,
  artists,
  emphasis,
  onReviewFieldChange,
  onSelectExisting,
  onSetMatchStatus,
}: ArtistReviewGroupProps) {
  const headingClass = emphasis === "amber"
    ? "border-amber-300 bg-amber-100 text-amber-900"
    : emphasis === "red"
      ? "border-red-100 bg-red-50 text-red-700"
    : emphasis === "purple"
      ? "border-purple-200 bg-purple-50 text-purple-900"
      : emphasis === "green"
        ? "border-lime-200 bg-lime-50 text-lime-800"
      : "border-gray-300 bg-white text-gray-700";

  return (
    <tbody className="mb-5 block lg:table-row-group">
      <tr className="hidden lg:table-row" aria-hidden="true">
        <td colSpan={5} className="h-4 border-0 bg-white p-0" />
      </tr>
      <tr className="block lg:table-row">
        <th
          colSpan={5}
          className={`block rounded-t-xl border-0 px-4 py-3 text-center text-sm font-bold lg:table-cell lg:rounded-none ${headingClass}`}
        >
          {title} <span className="ml-1 text-xs font-semibold text-gray-500">{artists.length}명</span>
        </th>
      </tr>
      <tr className="hidden bg-white text-sm font-bold text-gray-600 lg:table-row">
        <th className="border-0 border-b border-gray-300 p-2">포스터 표기</th>
        <th className="border-0 border-b border-gray-300 p-2">표시 이름</th>
        <th className="border-0 border-b border-gray-300 p-2">normalized_name</th>
        <th className="border-0 border-b border-gray-300 p-2">별칭</th>
        <th className="w-[116px] border-0 border-b border-gray-300 px-2 py-2">작업</th>
      </tr>
      {artists.length === 0 ? (
        <tr className="block lg:table-row">
          <td colSpan={5} className="block border-0 border-b border-gray-200 bg-white px-4 py-3 text-center text-sm text-gray-400 lg:table-cell">
            없음
          </td>
        </tr>
      ) : artists.map(({ artist, index }) => (
        <ArtistReviewRow
          key={`${index}-${artist.input_name}-${artist.match_status}`}
          artist={artist}
          index={index}
          onReviewFieldChange={onReviewFieldChange}
          onSelectExisting={onSelectExisting}
          onSetMatchStatus={onSetMatchStatus}
        />
      ))}
    </tbody>
  );
}

function ExcludedArtistList({
  artists,
  onSetMatchStatus,
}: {
  artists: IndexedArtist[];
  onSetMatchStatus: Props["onSetMatchStatus"];
}) {
  if (artists.length === 0) return null;

  return (
    <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm font-bold text-gray-600">제외된 항목 {artists.length}명</p>
      <div className="mt-3 space-y-2">
        {artists.map(({ artist, index }) => (
          <div key={`${index}-${artist.input_name}`} className="flex items-center justify-between gap-3 border-t border-gray-200 pt-2 first:border-0 first:pt-0">
            <span className="text-sm text-gray-400 line-through">
              {artist.input_name || artist.display_name || "이름 없는 항목"}
            </span>
            <button
              type="button"
              onClick={() => onSetMatchStatus(index, "pending")}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700"
            >
              다시 검토
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimetableArtistCard({
  artist,
  index,
  onChange,
}: {
  artist: Artist;
  index: number;
  onChange: Props["onChange"];
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
        <div>
          <p className="font-bold text-slate-900">{artist.display_name}</p>
          <p className="text-xs text-slate-500">{artist.normalized_name}</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">확정 아티스트</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">
          공연 날짜
          <input type="date" value={artist.performance_date ?? ""} onChange={(event) => onChange(index, "performance_date", event.target.value)} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          무대
          <input value={artist.stage_name ?? ""} onChange={(event) => onChange(index, "stage_name", event.target.value)} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          시작 시간
          <input type="time" value={artist.performance_time?.slice(0, 5) ?? ""} onChange={(event) => onChange(index, "performance_time", event.target.value)} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          종료 시간
          <input type="time" value={artist.performance_end_time?.slice(0, 5) ?? ""} onChange={(event) => onChange(index, "performance_end_time", event.target.value)} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          상태
          <select value={artist.status ?? "confirmed"} onChange={(event) => onChange(index, "status", event.target.value)} className={`mt-1 ${inputClass}`}>
            <option value="confirmed">확정</option>
            <option value="scheduled">예정</option>
            <option value="cancelled">취소</option>
          </select>
        </label>
      </div>
    </article>
  );
}

export default function CandidateLineupTab({
  artists,
  mode = "review",
  onAdd,
  onMatchAll,
  isMatching,
  onChange,
  onReviewFieldChange,
  onSelectExisting,
  onSetMatchStatus,
}: Props) {
  const visibleArtists = mode === "timetable"
    ? artists.filter((artist) => artist.match_status !== "excluded")
    : artists;
  const newArtistCount = artists.filter((artist) => artist.match_status === "new").length;
  const addedLineupCount = artists.filter(
    (artist) => artist.match_status !== "excluded" && artist.comparison_status === "add",
  ).length;
  const indexedArtists = artists.map((artist, index) => ({ artist, index }));
  const reviewNeededArtists = indexedArtists.filter(({ artist }) =>
    artist.match_status === "pending"
    || artist.comparison_status === "remove_candidate"
  );
  const addedNewArtists = indexedArtists.filter(({ artist }) =>
    artist.match_status === "new"
    && artist.comparison_status !== "remove_candidate"
  );
  const addedExistingArtists = indexedArtists.filter(({ artist }) =>
    artist.match_status === "matched"
    && artist.comparison_status !== "existing"
    && artist.comparison_status !== "remove_candidate"
  );
  const existingArtists = indexedArtists.filter(({ artist }) =>
    artist.match_status === "matched"
    && artist.comparison_status === "existing"
  );
  const excludedArtists = indexedArtists.filter(({ artist }) =>
    artist.match_status === "excluded"
  );

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {mode === "review" ? "아티스트 판별·등록" : "타임테이블 검토"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "review"
              ? "모든 추출 항목을 기존 연결·신규 등록·제외 중 하나로 처리합니다."
              : "확정된 아티스트의 날짜·시간·무대만 검토합니다."}
          </p>
        </div>
        {mode === "review" && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isMatching || artists.length === 0}
              onClick={onMatchAll}
              className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 disabled:opacity-40"
            >
              {isMatching ? "중복 확인 중..." : "normalized_name 전체 중복 확인"}
            </button>
            <button
              type="button"
              onClick={onAdd}
              className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700"
            >
              아티스트 추가
            </button>
          </div>
        )}
      </div>

      {mode === "review" && (
        <p className="mt-3 text-sm font-semibold text-gray-600">
          요약 · 신규 아티스트 {newArtistCount}명 · 추가 라인업 {addedLineupCount}명
        </p>
      )}

      {visibleArtists.length === 0 ? (
        <p className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          {mode === "review"
            ? "추출된 아티스트가 없습니다."
            : "확정된 아티스트가 없어 입력할 타임테이블이 없습니다."}
        </p>
      ) : mode === "review" ? (
        <div className="mt-6">
          <table className="block w-full border-separate border-spacing-0 lg:table lg:table-fixed lg:border-collapse">
            <colgroup className="hidden lg:table-column-group">
              <col span={4} />
              <col className="w-[116px]" />
            </colgroup>
            {reviewNeededArtists.length > 0 && (
              <ArtistReviewGroup
                title="확인 필요"
                artists={reviewNeededArtists}
                emphasis="red"
                onReviewFieldChange={onReviewFieldChange}
                onSelectExisting={onSelectExisting}
                onSetMatchStatus={onSetMatchStatus}
              />
            )}
            <ArtistReviewGroup
              title="추가 라인업 / 신규 아티스트"
              artists={addedNewArtists}
              emphasis="purple"
              onReviewFieldChange={onReviewFieldChange}
              onSelectExisting={onSelectExisting}
              onSetMatchStatus={onSetMatchStatus}
            />
            <ArtistReviewGroup
              title="추가 라인업 / 기존 아티스트"
              artists={addedExistingArtists}
              emphasis="amber"
              onReviewFieldChange={onReviewFieldChange}
              onSelectExisting={onSelectExisting}
              onSetMatchStatus={onSetMatchStatus}
            />
            <ArtistReviewGroup
              title="기존 라인업 / 기존 아티스트"
              artists={existingArtists}
              emphasis="green"
              onReviewFieldChange={onReviewFieldChange}
              onSelectExisting={onSelectExisting}
              onSetMatchStatus={onSetMatchStatus}
            />
          </table>
          <ExcludedArtistList
            artists={excludedArtists}
            onSetMatchStatus={onSetMatchStatus}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {visibleArtists.map((artist) => {
            const index = artists.indexOf(artist);
            return (
              <TimetableArtistCard
                key={`${index}-${artist.normalized_name}`}
                artist={artist}
                index={index}
                onChange={onChange}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
