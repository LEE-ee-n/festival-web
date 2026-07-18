"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { supabase } from "@/lib/supabase/client";
import { normalizeArtistName } from "@/lib/artists/normalizeArtistName";

type SimilarArtist = {
  id: number;
  name: string;
  normalized_name: string;
  similarity_score: number;
};

export default function AdminArtistsPage() {
  const [artistName, setArtistName] = useState("");
  const [officialEnglishName, setOfficialEnglishName] =
    useState("");

  const [candidates, setCandidates] = useState<
    SimilarArtist[]
  >([]);

  const [selectedArtist, setSelectedArtist] =
    useState<SimilarArtist | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);

  const [confirmedArtistId, setConfirmedArtistId] = useState<
    number | null
  >(null);

  const [successMessage, setSuccessMessage] = useState<
        string | null
  >(null);

  const [isCreating, setIsCreating] = useState(false);

  const [isUsingExisting, setIsUsingExisting] = useState(false);
  const [aliasName, setAliasName] = useState("");
  const [isSettingDisplayName, setIsSettingDisplayName] =
    useState(false);

  const searchName =
    officialEnglishName.trim() || artistName.trim();

  
  

  const normalizedPreview = normalizeArtistName(searchName);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!artistName.trim()) {
      setErrorMessage("아티스트 이름을 입력하세요.");
      return;
    }

    if (!searchName) {
      setErrorMessage("검색할 이름을 입력하세요.");
      return;
    }

    try {
      setIsSearching(true);
      setHasSearched(false);
      setErrorMessage(null);
      setSuccessMessage(null);
      setConfirmedArtistId(null);
      setSelectedArtist(null);
      setAliasName("");

      const { data, error } = await supabase.rpc(
        "search_similar_artists",
        {
          input_name: searchName,
        },
      );

      if (error) {
        throw error;
      }

      setCandidates((data || []) as SimilarArtist[]);
      setHasSearched(true);
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "아티스트 검색에 실패했습니다.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  function resetForm() {
    setArtistName("");
    setOfficialEnglishName("");
    setCandidates([]);
    setSelectedArtist(null);
    setHasSearched(false);
    setErrorMessage(null);
  }

  

  async function handleUseExistingArtist() {
    if (!selectedArtist) {
      return;
    }

    const trimmedAliasName = aliasName.trim();

    if (!trimmedAliasName) {
      setErrorMessage("추가할 별칭을 입력하세요.");
      return;
    }

    try {
      setIsUsingExisting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const { data: existingAlias, error: searchError } =
        await supabase
          .from("artist_aliases")
          .select(`
            id,
            artist_id,
            alias_name
          `)
          .eq("alias_name", trimmedAliasName)
          .maybeSingle();

      if (searchError) {
        throw searchError;
      }

      if (existingAlias) {
        if (existingAlias.artist_id === selectedArtist.id) {
          throw new Error("이미 등록된 별칭입니다.");
        }

        throw new Error(
          "이 별칭은 다른 아티스트에 연결되어 있습니다.",
        );
      }

      const { error: insertError } = await supabase
        .from("artist_aliases")
        .insert({
          artist_id: selectedArtist.id,
          alias_name: trimmedAliasName,
          normalized_alias: selectedArtist.normalized_name,
        });

      if (insertError) {
        throw insertError;
      }

      setConfirmedArtistId(selectedArtist.id);
      setSuccessMessage(
        `${trimmedAliasName}을 ${selectedArtist.name}의 별칭으로 추가했습니다.`,
      );
      setAliasName("");
    } catch (error) {
      console.error("별칭 추가 오류:", error);

      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error
          ? String(error.message)
          : "별칭 추가에 실패했습니다.";

      setErrorMessage(message);
    } finally {
      setIsUsingExisting(false);
    }
  }

  async function handleSetDisplayName() {
    if (!selectedArtist) {
      return;
    }

    const trimmedAliasName = aliasName.trim();

    if (!trimmedAliasName) {
      setErrorMessage("대표 표시 이름을 입력하세요.");
      return;
    }

    try {
      setIsSettingDisplayName(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const { data, error } = await supabase.rpc(
        "set_artist_display_name",
        {
          p_artist_id: selectedArtist.id,
          p_display_name: trimmedAliasName,
        },
      );

      if (error) {
        throw error;
      }

      const updatedArtist = data?.[0];

      if (!updatedArtist) {
        throw new Error(
          "변경된 아티스트 정보를 불러오지 못했습니다.",
        );
      }

      setSelectedArtist((current) =>
        current
          ? {
              ...current,
              name: updatedArtist.name,
            }
          : null,
      );

      setCandidates((currentCandidates) =>
        currentCandidates.map((candidate) =>
          candidate.id === updatedArtist.id
            ? {
                ...candidate,
                name: updatedArtist.name,
              }
            : candidate,
        ),
      );

      setConfirmedArtistId(updatedArtist.id);

      setSuccessMessage(
        `${updatedArtist.name}을 대표 표시 이름으로 설정했습니다. 기존 이름은 별칭으로 보존했습니다.`,
      );

      setAliasName("");
    } catch (error) {
      console.error("대표 표시 이름 변경 오류:", error);

      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error
          ? String(error.message)
          : "대표 표시 이름 변경에 실패했습니다.";

      setErrorMessage(message);
    } finally {
      setIsSettingDisplayName(false);
    }
  }
  
  async function handleCreateArtist() {
    const trimmedName = artistName.trim();

    if (!trimmedName) {
      setErrorMessage("화면 표시 이름을 입력하세요.");
      return;
    }

    if (!normalizedPreview) {
      setErrorMessage(
        "한글 아티스트는 공식 영문명을 입력해야 합니다.",
      );
      return;
    }

    try {
      setIsCreating(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const { data, error } = await supabase
        .from("artists")
        .insert({
          name: trimmedName,
          normalized_name: normalizedPreview,
        })
        .select(`
          id,
          name,
          normalized_name
        `)
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error(
            "같은 정규화 이름을 가진 아티스트가 이미 존재합니다. 중복 후보를 다시 확인하세요.",
          );
        }

        throw error;
      }

      setConfirmedArtistId(data.id);
      setSuccessMessage(
        `${data.name}을 신규 아티스트로 생성했습니다.`,
      );

      setCandidates([]);
      setSelectedArtist(null);
      setHasSearched(false);
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "신규 아티스트 생성에 실패했습니다.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin"
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← 관리자 페이지로 돌아가기
        </Link>

        <header className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            관리자
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            아티스트 관리
          </h1>

          <p className="mt-3 text-slate-500">
            신규 아티스트를 등록하기 전에 기존 DB의 유사
            아티스트를 검색합니다.
          </p>
        </header>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSearch}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="artistName"
                  className="text-sm font-semibold text-slate-700"
                >
                  화면 표시 이름
                </label>

                <input
                  id="artistName"
                  type="text"
                  value={artistName}
                  onChange={(event) =>
                    setArtistName(event.target.value)
                  }
                  placeholder="예: 카더가든"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="officialEnglishName"
                  className="text-sm font-semibold text-slate-700"
                >
                  공식 영문명
                </label>

                <input
                  id="officialEnglishName"
                  type="text"
                  value={officialEnglishName}
                  onChange={(event) =>
                    setOfficialEnglishName(event.target.value)
                  }
                  placeholder="예: CAR, THE GARDEN"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                />

                <p className="mt-2 text-xs text-slate-400">
                  영문 아티스트는 비워두어도 됩니다.
                </p>
              </div>
            </div>

            {searchName && (
              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-400">
                  검색에 사용할 이름
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {searchName}
                </p>

                <p className="mt-3 text-xs font-medium text-slate-400">
                  예상 정규화값
                </p>

                <p className="mt-1 font-mono text-sm text-slate-700">
                  {normalizedPreview || "정규화값 없음"}
                </p>
              </div>
            )}

            {errorMessage && (
              <p className="mt-4 text-sm font-medium text-red-600">
                {errorMessage}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSearching}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSearching
                  ? "검색 중..."
                  : "중복 후보 검색"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                초기화
              </button>
            </div>
          </form>
        </section>

        {hasSearched && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">
                유사 후보
              </h2>

              <span className="text-sm text-slate-500">
                {candidates.length}개 발견
              </span>
            </div>

            {candidates.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-6 text-center">
                <p className="font-semibold text-slate-800">
                  유사한 기존 아티스트가 없습니다.
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  수동 확인 후 신규 아티스트로 생성할 수
                  있습니다.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {candidates.map((candidate) => {
                  const similarityPercent = Math.round(
                    candidate.similarity_score * 100,
                  );

                  const isSelected =
                    selectedArtist?.id === candidate.id;

                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => {
                        setSelectedArtist(candidate);
                        setConfirmedArtistId(null);
                        setSuccessMessage(null);
                      }}

                      className={[
                        "w-full rounded-2xl border p-5 text-left transition",
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-400 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold text-slate-900">
                            {candidate.name}
                          </p>

                          <p className="mt-1 font-mono text-sm text-slate-500">
                            {candidate.normalized_name}
                          </p>

                          <p className="mt-2 text-xs text-slate-400">
                            ID: {candidate.id}
                          </p>
                        </div>

                        <span
                          className={[
                            "rounded-full px-3 py-1 text-sm font-bold",
                            similarityPercent === 100
                              ? "bg-green-100 text-green-700"
                              : similarityPercent >= 70
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-slate-100 text-slate-600",
                          ].join(" ")}
                        >
                          유사도 {similarityPercent}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {hasSearched && candidates.length === 0 && (
          <section className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-6">
            <p className="font-semibold text-green-900">
              유사한 기존 아티스트가 없습니다.
            </p>

            <p className="mt-2 text-sm text-green-700">
              입력한 이름과 정규화값을 확인한 뒤 신규 생성하세요.
            </p>

            <button
              type="button"
              onClick={handleCreateArtist}
              disabled={isCreating}
              className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? "생성 중..." : "신규 아티스트 생성"}
            </button>
          </section>
        )}

        {selectedArtist && (
            <section className="mt-6 rounded-3xl border border-blue-200 bg-blue-50 p-6">
                <p className="text-sm font-semibold text-blue-600">
                선택한 기존 아티스트
                </p>

                <p className="mt-2 text-xl font-bold text-slate-950">
                {selectedArtist.name}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                아티스트 ID:{" "}
                <strong>{selectedArtist.id}</strong>
                </p>

                <div className="mt-5">
                  <label
                    htmlFor="aliasName"
                    className="text-sm font-semibold text-slate-700"
                  >
                    추가할 별칭
                  </label>

                  <input
                    id="aliasName"
                    type="text"
                    value={aliasName}
                    onChange={(event) => setAliasName(event.target.value)}
                    placeholder="예: 자우림"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSetDisplayName}
                    disabled={isSettingDisplayName || isUsingExisting}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSettingDisplayName
                      ? "대표 이름 변경 중..."
                      : "대표 표시 이름으로 사용"}
                  </button>

                  <button
                    type="button"
                    onClick={handleUseExistingArtist}
                    disabled={isUsingExisting || isSettingDisplayName}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUsingExisting
                      ? "별칭 추가 중..."
                      : "별칭 추가"}
                  </button>
                </div>

            </section>
            )}

        {successMessage && confirmedArtistId && (
            <section className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-5">
                <p className="font-semibold text-green-800">
                {successMessage}
                </p>

                <p className="mt-1 text-sm text-green-700">
                사용할 아티스트 ID: {confirmedArtistId}
                </p>
            </section>
        )}

      </div>
    </main>
  );
}
