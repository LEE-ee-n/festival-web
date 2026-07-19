"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  isValidArtistNormalizedName,
  normalizeArtistName,
} from "@/lib/artists/normalizeArtistName";
import { supabase } from "@/lib/supabase/client";

type SimilarArtist = {
  id: number;
  name: string;
  normalized_name: string;
  similarity_score: number;
};

type ManagedArtist = {
  id: number;
  name: string;
  normalized_name: string;
  aliases: string[];
};

type ArtistAliasRow = {
  artist_id: number;
  alias_name: string;
};

type ArtistSortKey = "id" | "name" | "normalized_name";
type SortDirection = "asc" | "desc";

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

export default function AdminArtistsPage() {
  const [artistName, setArtistName] = useState("");
  const [officialEnglishName, setOfficialEnglishName] = useState("");
  const [candidates, setCandidates] = useState<SimilarArtist[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [artists, setArtists] = useState<ManagedArtist[]>([]);
  const [isLoadingArtists, setIsLoadingArtists] = useState(true);
  const [listFilter, setListFilter] = useState("");
  const [sortKey, setSortKey] = useState<ArtistSortKey>("id");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");

  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editUniqueName, setEditUniqueName] = useState("");
  const [editAliases, setEditAliases] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const editorRef = useRef<HTMLElement>(null);

  const searchName = officialEnglishName.trim() || artistName.trim();

  const loadArtists = useCallback(async () => {
    try {
      setIsLoadingArtists(true);
      setErrorMessage(null);

      const [artistsResult, aliasesResult] = await Promise.all([
        supabase
          .from("artists")
          .select("id, name, normalized_name")
          .order("id", { ascending: true }),
        supabase
          .from("artist_aliases")
          .select("artist_id, alias_name")
          .order("alias_name", { ascending: true }),
      ]);

      if (artistsResult.error) throw artistsResult.error;
      if (aliasesResult.error) throw aliasesResult.error;

      const aliasesByArtist = new Map<number, string[]>();

      ((aliasesResult.data ?? []) as ArtistAliasRow[]).forEach((alias) => {
        const current = aliasesByArtist.get(alias.artist_id) ?? [];
        current.push(alias.alias_name);
        aliasesByArtist.set(alias.artist_id, current);
      });

      setArtists(
        (artistsResult.data ?? []).map((artist) => ({
          id: artist.id,
          name: artist.name,
          normalized_name: artist.normalized_name,
          aliases: aliasesByArtist.get(artist.id) ?? [],
        })),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "아티스트 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoadingArtists(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadArtists();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadArtists]);

  const filteredArtists = useMemo(() => {
    const query = listFilter.trim().toLowerCase();

    const filtered = query
      ? artists.filter(
          (artist) =>
            artist.name.toLowerCase().includes(query)
            || artist.normalized_name.toLowerCase().includes(query)
            || artist.aliases.some((alias) =>
              alias.toLowerCase().includes(query),
            )
            || String(artist.id).includes(query),
        )
      : [...artists];

    return filtered.sort((left, right) => {
      const comparison = sortKey === "id"
        ? left.id - right.id
        : left[sortKey].localeCompare(right[sortKey], "ko");

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [artists, listFilter, sortDirection, sortKey]);

  function handleSort(nextSortKey: ArtistSortKey) {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => current === "asc" ? "desc" : "asc");
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection("asc");
  }

  function sortLabel(label: string, key: ArtistSortKey) {
    if (sortKey !== key) return label;
    return `${label} ${sortDirection === "asc" ? "▲" : "▼"}`;
  }

  function selectArtist(artist: ManagedArtist | SimilarArtist) {
    const fullArtist = artists.find((item) => item.id === artist.id);

    setSelectedArtistId(artist.id);
    setEditName(fullArtist?.name ?? artist.name);
    setEditUniqueName(fullArtist?.normalized_name ?? artist.normalized_name);
    setEditAliases((fullArtist?.aliases ?? []).join(", "));
    setErrorMessage(null);
    setSuccessMessage(null);

    window.setTimeout(() => {
      editorRef.current?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    }, 0);
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!artistName.trim()) {
      setErrorMessage("화면 표시 이름을 입력하세요.");
      return;
    }

    try {
      setIsSearching(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setSelectedArtistId(null);

      const normalizedQuery = normalizeSearchText(searchName);
      const localMatches: SimilarArtist[] = artists
        .filter((artist) =>
          normalizeSearchText(artist.name).includes(normalizedQuery)
          || normalizeSearchText(artist.normalized_name).includes(
            normalizedQuery,
          )
          || artist.aliases.some((alias) =>
            normalizeSearchText(alias).includes(normalizedQuery),
          ),
        )
        .map((artist) => ({
          id: artist.id,
          name: artist.name,
          normalized_name: artist.normalized_name,
          similarity_score: 1,
        }));

      if (localMatches.length > 0) {
        setCandidates(localMatches);
        setHasSearched(true);
        return;
      }

      const { data, error } = await supabase.rpc("search_similar_artists", {
        input_name: searchName,
      });

      if (error) throw error;

      setCandidates((data ?? []) as SimilarArtist[]);
      setHasSearched(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "아티스트 검색에 실패했습니다.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  function resetSearch() {
    setArtistName("");
    setOfficialEnglishName("");
    setCandidates([]);
    setHasSearched(false);
    setSelectedArtistId(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleCreateArtist() {
    const name = artistName.trim();
    const uniqueName = normalizeArtistName(searchName);

    if (!name) {
      setErrorMessage("화면 표시 이름을 입력하세요.");
      return;
    }

    if (!isValidArtistNormalizedName(uniqueName)) {
      setErrorMessage("한글 아티스트는 공식 영문명을 입력해야 합니다.");
      return;
    }

    try {
      setIsCreating(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const { data, error } = await supabase
        .from("artists")
        .insert({ name, normalized_name: uniqueName })
        .select("id, name, normalized_name")
        .single();

      if (error) throw error;

      await loadArtists();
      setCandidates([]);
      setHasSearched(false);
      selectArtist({ ...data, aliases: [] });
      setSuccessMessage(`${data.name}을(를) 신규 등록했습니다.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "신규 등록에 실패했습니다.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSaveArtist() {
    if (selectedArtistId === null) return;

    const name = editName.trim();
    const uniqueName = normalizeArtistName(editUniqueName);
    const aliases = [...new Set(
      editAliases
        .split(",")
        .map((alias) => alias.trim())
        .filter(Boolean),
    )];

    if (!name) {
      setErrorMessage("화면 표시 이름을 입력하세요.");
      return;
    }

    if (!isValidArtistNormalizedName(uniqueName)) {
      setErrorMessage("normalized_name은 영문 소문자와 숫자로 입력해 주세요.");
      return;
    }

    const duplicateArtist = artists.find(
      (artist) =>
        artist.id !== selectedArtistId
        && artist.normalized_name === uniqueName,
    );

    if (duplicateArtist) {
      setErrorMessage(
        `${duplicateArtist.name}(ID: ${duplicateArtist.id})이 같은 normalized_name을 사용 중입니다.`,
      );
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const { error } = await supabase.rpc("update_artist_admin", {
        p_artist_id: selectedArtistId,
        p_name: name,
        p_normalized_name: uniqueName,
        p_aliases: aliases,
      });

      if (error) throw error;

      await loadArtists();
      setEditName(name);
      setEditUniqueName(uniqueName);
      setEditAliases(aliases.join(", "));
      setSuccessMessage(`${name}의 정보를 수정했습니다.`);
    } catch (error) {
      const message =
        typeof error === "object"
        && error !== null
        && "message" in error
          ? String(error.message)
          : "아티스트 수정에 실패했습니다.";

      setErrorMessage(
        message.includes("update_artist_admin")
          || message.toLowerCase().includes("schema cache")
          ? "Supabase에 017_update_artist_admin.sql을 먼저 실행해 주세요."
          : message,
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin"
          className="inline-flex rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-200 hover:text-slate-900"
        >
          관리자 페이지로 돌아가기
        </Link>

        <header className="mt-5">
          <p className="text-sm font-semibold text-slate-600">관리자</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            아티스트 관리
          </h1>
          <p className="mt-3 text-slate-500">
            신규 아티스트를 등록하기 전에 기존 DB의 유사 아티스트를 검색합니다.
          </p>
        </header>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSearch}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                화면 표시 이름
                <input
                  value={artistName}
                  onChange={(event) => setArtistName(event.target.value)}
                  placeholder="예: 강산에"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-slate-900"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                공식 영문명
                <input
                  value={officialEnglishName}
                  onChange={(event) => setOfficialEnglishName(event.target.value)}
                  placeholder="예: CAR, THE GARDEN"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-slate-900"
                />
                <span className="mt-2 block text-xs font-normal text-slate-400">
                  영문 아티스트는 비워두어도 됩니다.
                </span>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSearching}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSearching ? "검색 중..." : "검색"}
              </button>
              <button
                type="button"
                onClick={resetSearch}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600"
              >
                초기화
              </button>
            </div>
          </form>
        </section>

        {errorMessage && (
          <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="mt-4 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700">
            {successMessage}
          </p>
        )}

        {hasSearched && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">후보</h2>
              <span className="text-sm text-slate-500">{candidates.length}명</span>
            </div>

            {candidates.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-6">
                <p className="font-semibold text-slate-800">
                  유사한 기존 아티스트가 없습니다.
                </p>
                <button
                  type="button"
                  onClick={() => void handleCreateArtist()}
                  disabled={isCreating}
                  className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isCreating ? "등록 중..." : "신규 아티스트 등록"}
                </button>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {candidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => selectArtist(candidate)}
                    className={[
                      "rounded-2xl border p-5 text-left transition",
                      selectedArtistId === candidate.id
                        ? "border-slate-900 bg-white shadow-sm"
                        : "border-slate-200 hover:border-slate-400",
                    ].join(" ")}
                  >
                    <p className="font-bold text-slate-900">{candidate.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      ID {candidate.id} · 유사도 {Math.round(candidate.similarity_score * 100)}%
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {selectedArtistId !== null && (
          <section
            ref={editorRef}
            className="mt-6 scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-md sm:p-8"
          >
            <h2 className="text-xl font-bold text-slate-900">선택한 아티스트 수정</h2>
            {errorMessage && (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-700">
                {successMessage}
              </p>
            )}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                ID
                <input
                  value={selectedArtistId}
                  readOnly
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal text-slate-500"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                화면 표시 이름
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                normalized_name
                <input
                  value={editUniqueName}
                  onChange={(event) =>
                    setEditUniqueName(normalizeArtistName(event.target.value))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono font-normal"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                별칭
                <input
                  value={editAliases}
                  onChange={(event) => setEditAliases(event.target.value)}
                  placeholder="쉼표로 구분"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"
                />
                <span className="mt-2 block text-xs font-normal text-slate-500">
                  별칭이 여러 개면 쉼표(,)로 구분합니다. 예: 카더가든, 차정원
                </span>
              </label>
            </div>
            <button
              type="button"
              onClick={() => void handleSaveArtist()}
              disabled={isSaving}
              className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSaving ? "저장 중..." : "수정 저장"}
            </button>
          </section>
        )}

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">전체 아티스트</h2>
              <p className="mt-1 text-sm text-slate-500">총 {artists.length}명</p>
            </div>
            <input
              type="search"
              value={listFilter}
              onChange={(event) => setListFilter(event.target.value)}
              placeholder="목록 검색"
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
            />
          </div>

          {isLoadingArtists ? (
            <p className="mt-6 text-sm text-slate-500">목록을 불러오는 중입니다.</p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[820px] table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-[9%]" />
                  <col className="w-[22%]" />
                  <col className="w-[22%]" />
                  <col className="w-[35%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead className="border-b border-slate-300 text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => handleSort("id")}
                        className="whitespace-nowrap font-semibold hover:text-slate-900"
                      >
                        {sortLabel("ID", "id")}
                      </button>
                    </th>
                    <th className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => handleSort("name")}
                        className="font-semibold hover:text-slate-900"
                      >
                        {sortLabel("화면 표시 이름", "name")}
                      </button>
                    </th>
                    <th className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => handleSort("normalized_name")}
                        className="font-semibold hover:text-slate-900"
                      >
                        {sortLabel("normalized_name", "normalized_name")}
                      </button>
                    </th>
                    <th className="px-3 py-3">별칭 (쉼표 구분)</th>
                    <th className="px-3 py-3 text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {filteredArtists.map((artist) => (
                    <tr key={artist.id}>
                      <td className="px-3 py-4 text-slate-500">{artist.id}</td>
                      <td className="px-3 py-4 font-semibold text-slate-900">
                        {artist.name}
                      </td>
                      <td className="break-all px-3 py-4 font-mono text-slate-600">
                        {artist.normalized_name}
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {artist.aliases.join(", ") || "-"}
                      </td>
                      <td className="px-3 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => selectArtist(artist)}
                          className="min-w-16 whitespace-nowrap rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                        >
                          수정
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
