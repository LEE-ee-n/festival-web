import Link from "next/link";

import type { ArtistSearchResult } from "@/lib/artists/searchArtists";
import { validateLineupSchedule } from "@/lib/festivals/lineupScheduleValidation";

type Props = {
  festivalStartDate: string;
  festivalEndDate: string;
  artistSearchQuery: string;
  updateArtistSearchQuery: (value: string) => void;
  artistSearchResults: ArtistSearchResult[];
  selectedArtist: ArtistSearchResult | null;
  isSearchingArtists: boolean;
  hasSearchedArtists: boolean;
  searchForArtists: () => void;
  chooseArtist: (artist: ArtistSearchResult) => void;
  newPerformanceDate: string;
  setNewPerformanceDate: (value: string) => void;
  newPerformanceTime: string;
  setNewPerformanceTime: (value: string) => void;
  newPerformanceEndTime: string;
  setNewPerformanceEndTime: (value: string) => void;
  newStageName: string;
  setNewStageName: (value: string) => void;
  newStatus: string;
  setNewStatus: (value: string) => void;
  addSelectedArtist: () => void;
};

const inputClass =
  "mt-1 w-full rounded-xl border border-line-strong bg-surface px-3 py-3 text-sm text-ink outline-none focus:border-gray-500";

export default function ArtistAddSection(props: Props) {
  const showNoResults =
    !props.isSearchingArtists &&
    props.hasSearchedArtists &&
    props.artistSearchQuery.trim() &&
    props.artistSearchResults.length === 0 &&
    !props.selectedArtist;
  const newScheduleError = validateLineupSchedule({
    performanceDate: props.newPerformanceDate || null,
    performanceTime: props.newPerformanceTime || null,
    performanceEndTime: props.newPerformanceEndTime || null,
    festivalStartDate: props.festivalStartDate || null,
    festivalEndDate: props.festivalEndDate || null,
  });

  return (
    <section className="mt-8 rounded-3xl border border-line bg-surface p-6 shadow-sm">
      <h2 className="text-lg font-bold text-ink">
        라인업 아티스트 추가
      </h2>
      <p className="mt-1 text-sm text-ink-tertiary">
        기존 아티스트를 검색한 뒤 공연 정보를 입력하세요. 추가한 내용은
        하단의 전체 저장을 눌러야 반영됩니다.
      </p>

      <form
        className="mt-5 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          props.searchForArtists();
        }}
      >
        <input
          value={props.artistSearchQuery}
          onChange={(event) =>
            props.updateArtistSearchQuery(event.target.value)
          }
          placeholder="아티스트 이름, normalized_name, 별칭 검색"
          className="min-w-0 flex-1 rounded-xl border border-line-strong bg-surface px-4 py-3 text-sm outline-none focus:border-gray-500"
        />
        <button
          type="submit"
          disabled={props.isSearchingArtists}
          className="shrink-0 rounded-xl bg-surface-dark px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {props.isSearchingArtists ? "검색 중..." : "검색"}
        </button>
      </form>

      {props.artistSearchResults.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-xl border border-line">
          {props.artistSearchResults.map((artist) => (
            <button
              key={artist.id}
              type="button"
              onClick={() => props.chooseArtist(artist)}
              className="flex w-full items-start justify-between gap-4 border-b border-line px-4 py-3 text-left last:border-b-0 hover:bg-surface-subtle"
            >
              <span>
                <span className="block text-sm font-bold text-ink">
                  {artist.name}
                </span>
                <span className="mt-0.5 block text-xs text-ink-tertiary">
                  {artist.normalized_name}
                </span>
                {(artist.aliases?.length ?? 0) > 0 && (
                  <span className="mt-1 block text-xs text-ink-tertiary">
                    별칭: {artist.aliases?.join(", ")}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-xs font-semibold text-ink-tertiary">
                선택
              </span>
            </button>
          ))}
        </div>
      )}

      {showNoResults && (
        <div className="mt-3 rounded-xl border border-line bg-surface-subtle px-4 py-3 text-sm text-ink-secondary">
          검색 결과가 없다면{" "}
          <Link
            href="/admin/artists"
            className="font-bold text-blue-700 hover:underline"
          >
            아티스트 관리
          </Link>
          에서 먼저 신규 등록해 주세요.
        </div>
      )}

      {props.selectedArtist && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-bold text-emerald-700">선택한 아티스트</p>
          <p className="mt-1 text-sm font-bold text-ink">
            {props.selectedArtist.name}
          </p>
          <p className="text-xs text-ink-secondary">
            {props.selectedArtist.normalized_name}
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs font-semibold text-ink-secondary">
          공연 날짜
          <input
            type="date"
            value={props.newPerformanceDate}
            onChange={(event) =>
              props.setNewPerformanceDate(event.target.value)
            }
            className={inputClass}
          />
          {newScheduleError && (
            <span className="mt-1 block text-xs font-semibold text-red-600">
              {newScheduleError}
            </span>
          )}
        </label>
        <label className="text-xs font-semibold text-ink-secondary">
          시작 시간
          <input
            type="time"
            value={props.newPerformanceTime}
            onChange={(event) =>
              props.setNewPerformanceTime(event.target.value)
            }
            className={inputClass}
          />
        </label>
        <label className="text-xs font-semibold text-ink-secondary">
          종료 시간
          <input
            type="time"
            value={props.newPerformanceEndTime}
            onChange={(event) =>
              props.setNewPerformanceEndTime(event.target.value)
            }
            className={inputClass}
          />
        </label>
        <label className="text-xs font-semibold text-ink-secondary">
          무대
          <input
            value={props.newStageName}
            onChange={(event) => props.setNewStageName(event.target.value)}
            placeholder="미정 가능"
            className={inputClass}
          />
        </label>
        <label className="text-xs font-semibold text-ink-secondary">
          상태
          <select
            value={props.newStatus}
            onChange={(event) => props.setNewStatus(event.target.value)}
            className={inputClass}
          >
            <option value="confirmed">확정</option>
            <option value="scheduled">예정</option>
            <option value="cancelled">취소</option>
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={props.addSelectedArtist}
        className="mt-5 w-full rounded-xl bg-surface-dark px-4 py-3.5 text-sm font-bold text-white"
      >
        작업 목록에 아티스트 추가
      </button>
    </section>
  );
}
