"use client";

import Link from "next/link";
import { useState } from "react";

import CandidateBasicInfoTab from "@/app/admin/festival-candidates/components/CandidateBasicInfoTab";
import CandidateLineupTab from "@/app/admin/festival-candidates/components/CandidateLineupTab";
import CandidateTicketTab from "@/app/admin/festival-candidates/components/CandidateTicketTab";
import FestivalCandidateJsonUploader from "@/app/admin/festival-candidates/components/FestivalCandidateJsonUploader";
import TicketDiscoveryUploader from "@/app/admin/festival-candidates/components/TicketDiscoveryUploader";
import { useFestivalCandidateDraft } from "@/app/admin/festival-candidates/hooks/useFestivalCandidateDraft";
import { useFestivalCandidates } from "@/app/admin/festival-candidates/hooks/useFestivalCandidates";
import { matchFestivalDraftArtists } from "@/lib/artists/matchFestivalDraftArtists";
import {
  FESTIVAL_REGISTRATION_STEPS,
  FESTIVAL_REGISTRATION_STEP_LABELS,
  getActiveDraftArtists,
  getRegistrationStep,
  moveRegistrationStep,
  normalizeFestivalDraft,
  parseFestivalDraftJson,
  validateFestivalDraftForApproval,
} from "@/lib/festivals/festivalDraft";
import { promoteCandidatePoster } from "@/lib/festivals/uploadFestivalThumbnail";
import type {
  FestivalCandidate,
  FestivalDraftJson,
  FestivalRegistrationStep,
} from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "pending", label: "검토 대기" },
  { value: "approved", label: "승인" },
  { value: "all", label: "전체" },
] as const;

const STATUS_LABELS = {
  pending: "검토 대기",
  approved: "승인 완료",
  rejected: "거절",
};

function createInitialDraft(candidate: FestivalCandidate): FestivalDraftJson {
  return {
    workflow: { step: "artist_review", confirmed_steps: [] },
    festival: {
      name: candidate.festival_name ?? "",
      normalized_name: "",
      start_date: candidate.start_date ?? "",
      end_date: candidate.end_date ?? "",
      location: candidate.location ?? undefined,
      category: candidate.category ?? undefined,
      source_url: candidate.source_url ?? undefined,
    },
    artists: [],
    tickets: [],
  };
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function FestivalCandidatesPage() {
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]["value"]>("pending");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isMatchingArtists, setIsMatchingArtists] = useState(false);
  const {
    candidates,
    isLoading,
    isMutating,
    errorMessage,
    loadCandidates,
    createManualCandidate,
    saveDraft,
    approveAndImportCandidate,
    deleteCandidate,
  } = useFestivalCandidates(statusFilter);

  const {
    draft,
    initializeDraft,
    clearDraft,
    updateFestival,
    updateWorkflow,
    addArtist,
    updateArtist,
    updateArtistReviewField,
    selectExistingArtist,
    setArtistMatchStatus,
    addTicket,
    updateTicket,
    deleteTicket,
  } = useFestivalCandidateDraft();

  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedId) ?? null;
  const currentStep = draft ? getRegistrationStep(draft) : "artist_review";
  const currentStepIndex = FESTIVAL_REGISTRATION_STEPS.indexOf(currentStep);
  async function selectCandidate(candidate: FestivalCandidate) {
    setSelectedId(candidate.id);
    setReviewNotes(candidate.review_notes ?? candidate.reject_reason ?? "");
    setNotice(null);
    setEditorError(null);

    if (candidate.status === "approved") {
      clearDraft();
      return;
    }

    const initialDraft = normalizeFestivalDraft(
      candidate.draft_json ?? createInitialDraft(candidate),
    );
    initializeDraft(initialDraft);

    if (!initialDraft.artists.some((artist) => artist.normalized_name.trim())) {
      return;
    }

    try {
      setIsMatchingArtists(true);
      initializeDraft(await matchFestivalDraftArtists(initialDraft));
    } catch (error) {
      setEditorError(
        error instanceof Error
          ? error.message
          : "아티스트 자동 중복 확인에 실패했습니다.",
      );
    } finally {
      setIsMatchingArtists(false);
    }
  }

  function readDraft() {
    if (!draft) {
      setEditorError("검토할 초안이 없습니다.");
      return null;
    }

    try {
      const validatedDraft = parseFestivalDraftJson(JSON.stringify(draft));
      setEditorError(null);
      return validatedDraft;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "JSON 형식이 잘못되었습니다.";
      setEditorError(message);
      return null;
    }
  }

  async function handleMatchArtists() {
    if (!draft) return;
    try {
      setIsMatchingArtists(true);
      setEditorError(null);
      initializeDraft(await matchFestivalDraftArtists(draft));
      setNotice("normalized_name 기준 중복 확인을 완료했습니다.");
    } catch (error) {
      setEditorError(
        error instanceof Error
          ? error.message
          : "아티스트 중복 확인에 실패했습니다.",
      );
    } finally {
      setIsMatchingArtists(false);
    }
  }

  async function handleSave() {
    if (!selectedCandidate) return;
    const draft = readDraft();
    if (!draft) return;

    try {
      await saveDraft(selectedCandidate.id, draft, reviewNotes);
      setNotice("수정 내용을 저장했습니다. 검토 대기 상태가 유지됩니다.");
    } catch {
      // 훅의 오류 메시지를 화면에 표시한다.
    }
  }

  function moveToApprovalError(currentDraft: FestivalDraftJson) {
    let selector = "";

    if (!/^[a-z0-9]+$/.test(currentDraft.festival.normalized_name)) {
      selector = '[data-approval-field="festival-normalized-name"]';
    } else {
      const unnamedIndex = currentDraft.artists.findIndex(
        (artist) =>
          !artist.display_name?.trim()
          && !artist.input_name?.trim(),
      );
      const unresolvedIndex = currentDraft.artists.findIndex(
        (artist) =>
          artist.match_status !== "new"
          && !(
            artist.match_status === "matched"
            && Number.isInteger(artist.matched_artist_id)
          ),
      );
      const invalidNewIndex = currentDraft.artists.findIndex(
        (artist) =>
          artist.match_status === "new"
          && !/^[a-z0-9]+$/.test(artist.normalized_name),
      );
      const seenNormalizedNames = new Set<string>();
      const duplicateIndex = currentDraft.artists.findIndex((artist) => {
        const normalizedName = artist.normalized_name.trim();
        if (!normalizedName) return false;
        if (seenNormalizedNames.has(normalizedName)) return true;
        seenNormalizedNames.add(normalizedName);
        return false;
      });
      const artistIndex = unnamedIndex >= 0
        ? unnamedIndex
        : unresolvedIndex >= 0
          ? unresolvedIndex
          : invalidNewIndex >= 0
            ? invalidNewIndex
            : duplicateIndex;

      selector = unnamedIndex >= 0
        ? `[data-approval-artist-name-index="${unnamedIndex}"]`
        : `[data-approval-artist-index="${Math.max(0, artistIndex)}"]`;
    }

    window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(selector);
      target?.scrollIntoView({ block: "center", behavior: "auto" });
      const input = target?.matches("input, select, textarea")
        ? target
        : target?.querySelector<HTMLElement>("input, select, textarea, button");
      input?.focus({ preventScroll: true });
    }, 0);
  }

  async function handleMoveStep(nextStep: FestivalRegistrationStep) {
    if (!selectedCandidate || !draft) return;
    try {
      const moved = moveRegistrationStep(draft, nextStep);
      await saveDraft(selectedCandidate.id, moved, reviewNotes);
      initializeDraft(moved);
      setEditorError(null);
      setNotice(`${FESTIVAL_REGISTRATION_STEP_LABELS[nextStep]} 단계로 이동했습니다.`);
    } catch (error) {
      setEditorError(
        error instanceof Error ? error.message : "현재 단계를 먼저 확인해 주세요.",
      );
    }
  }

  async function handleApprove() {
    if (!selectedCandidate) return;
    const currentDraft = readDraft();
    if (!currentDraft) return;
    let draft: FestivalDraftJson;
    try {
      draft = validateFestivalDraftForApproval(currentDraft);
      setEditorError(null);
    } catch (error) {
      setEditorError(
        error instanceof Error
          ? error.message
          : "아티스트 매칭 정보를 확인해 주세요.",
      );
      moveToApprovalError(currentDraft);
      return;
    }
    if (
      !window.confirm(
        `${draft.festival.name}을(를) 승인하고 정식 축제로 등록하시겠습니까?`,
      )
    ) {
      return;
    }

    let promotedPoster: Awaited<ReturnType<typeof promoteCandidatePoster>> = null;
    try {
      const firstPoster = selectedCandidate.source_assets.find(
        (asset) => asset.type === "image/webp" && asset.storage_path,
      );
      if (firstPoster) {
        promotedPoster = await promoteCandidatePoster(
          selectedCandidate.id,
          firstPoster,
        );
        if (promotedPoster) {
          draft = {
            ...draft,
            festival: {
              ...draft.festival,
              thumbnail_url: promotedPoster.publicUrl,
            },
          };
        }
      }
      const result = await approveAndImportCandidate(
        selectedCandidate.id,
        draft,
        reviewNotes,
      );
      setSelectedId(null);
      clearDraft();
      setNotice(
        `승인과 정식 등록을 완료했습니다. 축제 ID: ${result.festival_id}`,
      );
      if (promotedPoster) {
        try {
          await promotedPoster.removeTemporary();
        } catch (cleanupError) {
          console.error("임시 포스터 정리에 실패했습니다.", cleanupError);
        }
      }
    } catch {
      await promotedPoster?.rollback();
      // 훅의 오류 메시지를 화면에 표시한다.
    }
  }

  async function handleDelete() {
    if (!selectedCandidate) return;
    if (selectedCandidate.festival_id !== null) {
      setEditorError(
        "이미 정식 등록된 축제입니다. 삭제는 축제 관리 페이지에서 진행해 주세요.",
      );
      return;
    }
    if (!window.confirm(
      `${selectedCandidate.title} 임시저장과 작업 내용을 전부 삭제하시겠습니까?`,
    )) {
      return;
    }

    try {
      await deleteCandidate(selectedCandidate.id);
      setSelectedId(null);
      clearDraft();
      setNotice("임시저장과 작업 내용을 삭제했습니다.");
    } catch {
      // 훅의 오류 메시지를 화면에 표시한다.
    }
  }

  async function handleCreateManualCandidate() {
    try {
      const candidate = await createManualCandidate();
      setStatusFilter("pending");
      await selectCandidate(candidate);
      setNotice("직접 작성 작업을 만들었습니다. 기본정보부터 입력하세요.");
    } catch {
      // 훅의 오류 메시지를 화면에 표시한다.
    }
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="inline-flex rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-200 hover:text-slate-900"
        >
          관리자 페이지로 돌아가기
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-600">관리자</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              신규 페스티벌 등록
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              직접 작성하거나 수집한 자료를 단계별로 검토해 새 페스티벌을 등록합니다.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={isMutating}
              onClick={() => void handleCreateManualCandidate()}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              직접 신규 작성
            </button>
          </div>
        </div>

        <FestivalCandidateJsonUploader
          onCreated={() => {
            setSelectedId(null);
            clearDraft();
            setNotice(null);
            if (statusFilter === "pending") {
              void loadCandidates();
            } else {
              setStatusFilter("pending");
            }
          }}
        />

        <TicketDiscoveryUploader
          onCreated={() => {
            setSelectedId(null);
            clearDraft();
            setNotice(null);
            if (statusFilter === "pending") {
              void loadCandidates();
            } else {
              setStatusFilter("pending");
            }
          }}
        />

        <div className="mt-6 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setStatusFilter(option.value);
                setSelectedId(null);
                clearDraft();
                setNotice(null);
              }}
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold",
                statusFilter === option.value
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 bg-white text-slate-600",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>

        {(errorMessage || editorError) && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {editorError || errorMessage}
          </div>
        )}
        {notice && (
          <p className="mt-5 text-sm font-semibold text-gray-950">{notice}</p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(280px,0.7fr)_minmax(0,1.5fr)]">
          <section>
            {isLoading ? (
              <p className="text-sm text-slate-500">불러오는 중...</p>
            ) : candidates.length === 0 ? (
              <p className="text-sm text-slate-500">
                해당 상태의 수집 후보가 없습니다.
              </p>
            ) : (
              <div className="max-h-[75vh] space-y-3 overflow-y-auto p-1 pr-2">
                {candidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => void selectCandidate(candidate)}
                    className={[
                      "w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                      selectedId === candidate.id
                        ? "border-slate-900 ring-2 ring-slate-200"
                        : "border-gray-200",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-bold text-slate-900">
                        {candidate.title}
                      </h2>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {STATUS_LABELS[candidate.status]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {candidate.festival_name || "축제명 추출 전"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {candidate.start_date || "날짜 미정"}
                      {candidate.end_date ? ` ~ ${candidate.end_date}` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {candidate.version_number > 1 && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                          버전 {candidate.version_number}
                        </span>
                      )}
                      {candidate.announcement_round !== "unspecified" && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {candidate.announcement_round === "final"
                            ? "최종"
                            : candidate.announcement_round.replace("round_", "") + "차"}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            {!selectedCandidate ? (
              <p className="text-sm text-slate-500">
                왼쪽 목록에서 검토할 후보를 선택하세요.
              </p>
            ) : selectedCandidate.status === "approved" ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                  승인 완료 · 읽기 전용
                </span>
                <h2 className="mt-4 text-xl font-bold text-emerald-950">
                  {selectedCandidate.festival_name || selectedCandidate.title}
                </h2>
                <p className="mt-2 text-sm text-emerald-800">
                  이 신규 등록 기록은 수정하거나 다시 임시저장할 수 없습니다.
                </p>
                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-emerald-700">기간</dt>
                    <dd className="font-semibold text-emerald-950">
                      {selectedCandidate.start_date || "-"} ~ {selectedCandidate.end_date || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-emerald-700">승인 시각</dt>
                    <dd className="font-semibold text-emerald-950">
                      {formatDateTime(selectedCandidate.reviewed_at)}
                    </dd>
                  </div>
                </dl>
                {selectedCandidate.festival_id !== null && (
                  <Link
                    href={`/festival/${selectedCandidate.festival_id}`}
                    className="mt-5 inline-flex rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white"
                  >
                    등록된 페스티벌 보기
                  </Link>
                )}
              </div>
            ) : !draft ? (
              <p className="text-sm text-red-600">
                검토할 임시저장 내용을 불러오지 못했습니다.
              </p>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-slate-950">
                      {selectedCandidate.title}
                    </h2>
                    <span className="text-xs text-slate-400">
                      수집 {formatDateTime(selectedCandidate.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    출처: {selectedCandidate.source_type || "미지정"}
                    {selectedCandidate.score !== null
                      ? ` · 점수 ${selectedCandidate.score}`
                      : ""}
                  </p>
                  {selectedCandidate.source_url
                    && selectedCandidate.source_type !== "manual" && (
                    <a
                      href={selectedCandidate.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block break-all text-sm font-medium text-blue-600 hover:underline"
                    >
                      원본 출처 열기
                    </a>
                  )}
                </div>

                {selectedCandidate.raw_text && (
                  <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <summary className="cursor-pointer text-sm font-bold text-slate-700">
                      수집 원문 보기
                    </summary>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {selectedCandidate.raw_text}
                    </p>
                  </details>
                )}

                {Array.isArray(selectedCandidate.source_assets) &&
                  selectedCandidate.source_assets.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-700">
                        첨부 자료
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedCandidate.source_assets.map((asset, index) =>
                          asset.url ? (
                            <a
                              key={`${asset.url}-${index}`}
                              href={asset.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-blue-600"
                            >
                              {asset.name || `자료 ${index + 1}`}
                            </a>
                          ) : null,
                        )}
                      </div>
                    </div>
                  )}

                <div>
                  <ol className="grid gap-2 sm:grid-cols-5">
                    {FESTIVAL_REGISTRATION_STEPS.map((step, index) => (
                      <li
                        key={step}
                        className={[
                          "rounded-xl border px-3 py-3 text-xs font-bold",
                          step === currentStep
                            ? "border-slate-900 bg-slate-900 text-white"
                            : index < currentStepIndex
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-400",
                        ].join(" ")}
                      >
                        <span className="block opacity-70">{index + 1}단계</span>
                        <span className="mt-1 block">{FESTIVAL_REGISTRATION_STEP_LABELS[step]}</span>
                      </li>
                    ))}
                  </ol>

                  {currentStep === "artist_review" && (
                    <CandidateLineupTab
                      artists={draft.artists}
                      mode="review"
                      onAdd={addArtist}
                      onMatchAll={() => void handleMatchArtists()}
                      isMatching={isMatchingArtists}
                      onChange={updateArtist}
                      onReviewFieldChange={(index, field, value) => {
                        updateArtistReviewField(index, field, value);
                        setEditorError(null);
                      }}
                      onSelectExisting={(index, artist) => {
                        selectExistingArtist(index, artist);
                        setEditorError(null);
                      }}
                      onSetMatchStatus={(index, status) => {
                        setArtistMatchStatus(index, status);
                        setEditorError(null);
                      }}
                    />
                  )}

                  {currentStep === "artist_confirmation" && (
                    <section className="mt-6">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">아티스트 최종 확정</h3>
                          <p className="mt-1 text-sm text-slate-500">수정 기능 없이 전체 명단만 빠르게 확인합니다.</p>
                        </div>
                        <strong className="text-sm text-slate-700">총 {getActiveDraftArtists(draft).length}명</strong>
                      </div>
                      <div className="mt-5 grid gap-2 sm:grid-cols-2">
                        {getActiveDraftArtists(draft).map((artist) => (
                          <div key={`${artist.normalized_name}-${artist.matched_artist_id ?? "new"}`} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                            <div>
                              <p className="font-bold text-slate-900">{artist.display_name}</p>
                              <p className="text-xs text-slate-500">{artist.normalized_name}</p>
                            </div>
                            <span className={artist.match_status === "new" ? "rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700" : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"}>
                              {artist.match_status === "new" ? "신규" : "기존"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {currentStep === "festival_info" && (
                    <div>
                      <CandidateBasicInfoTab
                        festival={draft.festival}
                        excludeFestivalId={selectedCandidate.festival_id}
                        onChange={(field, value) => {
                          updateFestival(field, value);
                          setEditorError(null);
                        }}
                      />
                      <CandidateTicketTab
                        tickets={draft.tickets ?? []}
                        onAdd={addTicket}
                        onChange={updateTicket}
                        onDelete={deleteTicket}
                      />
                    </div>
                  )}

                  {currentStep === "timetable" && (
                    <div>
                      <div className="mt-6 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <button
                          type="button"
                          onClick={() => updateWorkflow("timetable_visibility", "published")}
                          className={draft.workflow?.timetable_visibility !== "unpublished" ? "rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white" : "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700"}
                        >
                          타임테이블 검토
                        </button>
                        <button
                          type="button"
                          onClick={() => updateWorkflow("timetable_visibility", "unpublished")}
                          className={draft.workflow?.timetable_visibility === "unpublished" ? "rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white" : "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700"}
                        >
                          타임테이블 미공개
                        </button>
                      </div>
                      {draft.workflow?.timetable_visibility === "unpublished" ? (
                        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                          OCR 타임테이블은 저장하지 않고 미공개 상태만 반영합니다.
                        </p>
                      ) : (
                        <CandidateLineupTab
                          artists={draft.artists}
                          mode="timetable"
                          onAdd={addArtist}
                          onMatchAll={() => undefined}
                          isMatching={false}
                          onChange={updateArtist}
                          onReviewFieldChange={updateArtistReviewField}
                          onSelectExisting={selectExistingArtist}
                          onSetMatchStatus={setArtistMatchStatus}
                        />
                      )}
                    </div>
                  )}

                  {currentStep === "final_confirmation" && (
                    <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                      <h3 className="text-lg font-bold text-emerald-950">최종 등록 확인</h3>
                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div><dt className="text-emerald-700">페스티벌</dt><dd className="font-bold text-emerald-950">{draft.festival.name}</dd></div>
                        <div><dt className="text-emerald-700">확정 아티스트</dt><dd className="font-bold text-emerald-950">{getActiveDraftArtists(draft).length}명</dd></div>
                        <div><dt className="text-emerald-700">티켓 회차</dt><dd className="font-bold text-emerald-950">{draft.tickets?.length ?? 0}개</dd></div>
                        <div><dt className="text-emerald-700">타임테이블</dt><dd className="font-bold text-emerald-950">{draft.workflow?.timetable_visibility === "unpublished" ? "미공개" : "검토 완료"}</dd></div>
                      </dl>
                      <p className="mt-4 text-sm text-emerald-800">최종 등록 전까지는 운영 데이터에 반영되지 않습니다.</p>
                    </section>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="review-notes"
                    className="text-sm font-bold text-slate-700"
                  >
                    검토 메모
                  </label>
                  <textarea
                    id="review-notes"
                    value={reviewNotes}
                    onChange={(event) => {
                      setReviewNotes(event.target.value);
                    }}
                    placeholder="수정 내용 또는 확인할 메모"
                    className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-slate-900"
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-5">
                  {currentStepIndex > 0 && (
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => void handleMoveStep(FESTIVAL_REGISTRATION_STEPS[currentStepIndex - 1])}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
                    >
                      이전 단계
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => void handleSave()}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
                  >
                    임시저장
                  </button>
                  {currentStepIndex < FESTIVAL_REGISTRATION_STEPS.length - 1 ? (
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => void handleMoveStep(FESTIVAL_REGISTRATION_STEPS[currentStepIndex + 1])}
                      className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      현재 단계 확정 · 다음
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => void handleApprove()}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      페스티벌 등록 확정
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={
                      isMutating || selectedCandidate.festival_id !== null
                    }
                    onClick={() => void handleDelete()}
                    className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    임시저장 삭제
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
