"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { matchFestivalDraftArtists } from "@/lib/artists/matchFestivalDraftArtists";
import { removeCandidateSourceAssets } from "@/lib/festivals/candidateSourceAssets";
import { createInitialFestivalCandidateDraft } from "@/lib/festivals/festivalCandidateRecord";
import {
  FESTIVAL_REGISTRATION_STEPS,
  FESTIVAL_REGISTRATION_STEP_LABELS,
  getRegistrationStep,
  moveRegistrationStep,
  normalizeFestivalDraft,
  parseFestivalDraftJsonForEditing,
  validateFestivalDraftForApproval,
} from "@/lib/festivals/festivalDraft";
import { hasConfirmedSeparateFestival } from "@/lib/festivals/festivalDuplicateReview";
import { normalizeFestivalRegion } from "@/lib/festivals/regionValidation.ts";
import { isValidNormalizedName } from "@/lib/normalizedName";
import type { FestivalCandidate, FestivalDraftJson, FestivalRegistrationStep } from "@/lib/types";
import { useFestivalCandidateDraft } from "./useFestivalCandidateDraft";
import { type CandidateStatusFilter, useFestivalCandidates } from "./useFestivalCandidates";
import { useFestivalDuplicateReview } from "./useFestivalDuplicateReview";

function focusApprovalError(currentDraft: FestivalDraftJson) {
  let selector = "";
  try {
    normalizeFestivalRegion(currentDraft.festival.region ?? "");
  } catch {
    selector = '[data-approval-field="festival-region"]';
  }

  if (!selector && !/^[a-z0-9]+$/.test(currentDraft.festival.normalized_name)) {
    selector = '[data-approval-field="festival-normalized-name"]';
  }
  if (!selector) {
    const unnamedIndex = currentDraft.artists.findIndex(
      (artist) => !artist.display_name?.trim() && !artist.input_name?.trim(),
    );
    const unresolvedIndex = currentDraft.artists.findIndex(
      (artist) => artist.match_status !== "new"
        && !(artist.match_status === "matched" && Number.isInteger(artist.matched_artist_id)),
    );
    const invalidNewIndex = currentDraft.artists.findIndex(
      (artist) => artist.match_status === "new" && !/^[a-z0-9]+$/.test(artist.normalized_name),
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

export function useFestivalCandidateController() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<CandidateStatusFilter>("pending");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isMatchingArtists, setIsMatchingArtists] = useState(false);
  const candidatesController = useFestivalCandidates(statusFilter);
  const draftController = useFestivalCandidateDraft();
  const selectedCandidate = candidatesController.candidates.find(
    (candidate) => candidate.id === selectedId,
  ) ?? null;
  const currentStep = draftController.draft
    ? getRegistrationStep(draftController.draft)
    : "artist_review";
  const currentStepIndex = FESTIVAL_REGISTRATION_STEPS.indexOf(currentStep);
  const duplicateReview = useFestivalDuplicateReview(draftController.draft?.festival ?? null);
  const isSeparateFestivalConfirmed = duplicateReview.review
    ? hasConfirmedSeparateFestival(
        duplicateReview.review,
        draftController.draft?.workflow?.duplicate_review,
      )
    : false;

  async function selectCandidate(candidate: FestivalCandidate) {
    setSelectedId(candidate.id);
    setReviewNotes(candidate.review_notes ?? candidate.reject_reason ?? "");
    setNotice(null);
    setEditorError(null);
    if (candidate.status === "approved") {
      draftController.clearDraft();
      return;
    }

    const initialDraft = normalizeFestivalDraft(
      candidate.draft_json ?? createInitialFestivalCandidateDraft(candidate),
    );
    draftController.initializeDraft(initialDraft);
    if (!initialDraft.artists.some((artist) => artist.normalized_name.trim())) return;

    try {
      setIsMatchingArtists(true);
      draftController.initializeDraft(await matchFestivalDraftArtists(initialDraft));
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "아티스트 자동 중복 확인에 실패했습니다.");
    } finally {
      setIsMatchingArtists(false);
    }
  }

  function readDraft() {
    const draft = draftController.draft;
    if (!draft) {
      setEditorError("검토할 초안이 없습니다.");
      return null;
    }
    const normalizedName = draft.festival.normalized_name.trim();
    if (normalizedName && !isValidNormalizedName(normalizedName)) {
      setEditorError("축제 normalized_name은 영문 소문자와 숫자로 입력해 주세요.");
      window.setTimeout(() => {
        const input = document.querySelector<HTMLInputElement>(
          '[data-approval-field="festival-normalized-name"]',
        );
        input?.scrollIntoView({ block: "center", behavior: "auto" });
        input?.focus({ preventScroll: true });
      }, 0);
      return null;
    }
    try {
      const validatedDraft = parseFestivalDraftJsonForEditing(JSON.stringify(draft));
      setEditorError(null);
      return validatedDraft;
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "JSON 형식이 잘못되었습니다.");
      return null;
    }
  }

  async function handleMatchArtists() {
    if (!draftController.draft) return;
    try {
      setIsMatchingArtists(true);
      setEditorError(null);
      draftController.initializeDraft(await matchFestivalDraftArtists(draftController.draft));
      setNotice("normalized_name 기준 중복 확인을 완료했습니다.");
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "아티스트 중복 확인에 실패했습니다.");
    } finally {
      setIsMatchingArtists(false);
    }
  }

  async function handleSave() {
    if (!selectedCandidate) return;
    const draft = readDraft();
    if (!draft) return;
    try {
      await candidatesController.saveDraft(selectedCandidate.id, draft, reviewNotes);
      setNotice("수정 내용을 저장했습니다. 검토 대기 상태가 유지됩니다.");
    } catch {
      // 데이터 훅의 오류 메시지를 화면에 표시한다.
    }
  }

  async function handleMoveStep(nextStep: FestivalRegistrationStep) {
    const draft = draftController.draft;
    if (!selectedCandidate || !draft) return;
    try {
      const draftForMove = currentStep === "festival_info"
        ? { ...draft, festival: { ...draft.festival, region: normalizeFestivalRegion(draft.festival.region ?? "") } }
        : draft;
      const moved = moveRegistrationStep(draftForMove, nextStep);
      await candidatesController.saveDraft(selectedCandidate.id, moved, reviewNotes);
      draftController.initializeDraft(moved);
      setEditorError(null);
      setNotice(`${FESTIVAL_REGISTRATION_STEP_LABELS[nextStep]} 단계로 이동했습니다.`);
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "현재 단계를 먼저 확인해 주세요.");
      focusApprovalError(draft);
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
      setEditorError(error instanceof Error ? error.message : "아티스트 매칭 정보를 확인해 주세요.");
      focusApprovalError(currentDraft);
      return;
    }
    try {
      const latestDuplicateReview = await duplicateReview.refresh();
      if (latestDuplicateReview?.exact) {
        setEditorError(`이미 등록된 동일 축제가 있습니다: ${latestDuplicateReview.exact.name}`);
        return;
      }
      if (latestDuplicateReview && latestDuplicateReview.possible.length > 0
        && !hasConfirmedSeparateFestival(latestDuplicateReview, draft.workflow?.duplicate_review)) {
        setEditorError("유사 축제 후보를 확인한 뒤 별도 신규 축제인지 결정해 주세요.");
        return;
      }
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "최종 유사 축제 확인에 실패했습니다.");
      return;
    }
    if (!window.confirm(`${draft.festival.name}을(를) 승인하고 정식 축제로 등록하시겠습니까?`)) return;

    try {
      const result = await candidatesController.approveAndImportCandidate(
        selectedCandidate.id,
        draft,
        reviewNotes,
      );
      setSelectedId(null);
      draftController.clearDraft();
      setNotice(`승인과 정식 등록을 완료했습니다. 축제 ID: ${result.festival_id}`);
      try {
        await removeCandidateSourceAssets(selectedCandidate.source_assets);
      } catch (cleanupError) {
        console.error("임시 수집 이미지 정리에 실패했습니다.", cleanupError);
      }
    } catch {
      // 데이터 훅의 오류 메시지를 화면에 표시한다.
    }
  }

  async function handleDelete() {
    if (!selectedCandidate) return;
    if (selectedCandidate.festival_id !== null) {
      setEditorError("이미 정식 등록된 축제입니다. 삭제는 축제 관리 페이지에서 진행해 주세요.");
      return;
    }
    if (!window.confirm(`${selectedCandidate.title} 임시저장과 작업 내용을 전부 삭제하시겠습니까?`)) return;
    try {
      await candidatesController.deleteCandidate(selectedCandidate.id);
      setSelectedId(null);
      draftController.clearDraft();
      setNotice("임시저장과 작업 내용을 삭제했습니다.");
    } catch {
      // 데이터 훅의 오류 메시지를 화면에 표시한다.
    }
  }

  async function handleUseExistingFestival(festivalId: number) {
    if (!selectedCandidate) return;
    const currentDraft = readDraft();
    if (!currentDraft) return;
    if (!window.confirm("이 후보를 기존 축제 수정 작업으로 전환하시겠습니까?")) return;
    try {
      const updateDraftId = await candidatesController.convertCandidateToUpdate(
        selectedCandidate.id,
        festivalId,
        currentDraft,
      );
      setSelectedId(null);
      draftController.clearDraft();
      router.push(`/admin/festivals/import-json?festivalId=${festivalId}&updateDraftId=${updateDraftId}`);
    } catch {
      // 데이터 훅의 오류 메시지를 화면에 표시한다.
    }
  }

  async function handleCreateManualCandidate() {
    try {
      const candidate = await candidatesController.createManualCandidate();
      setStatusFilter("pending");
      await selectCandidate(candidate);
      setNotice("직접 작성 작업을 만들었습니다. 기본정보부터 입력하세요.");
    } catch {
      // 데이터 훅의 오류 메시지를 화면에 표시한다.
    }
  }

  function resetSelection() {
    setSelectedId(null);
    draftController.clearDraft();
    setNotice(null);
  }

  function handleCreated() {
    resetSelection();
    if (statusFilter === "pending") void candidatesController.loadCandidates();
    else setStatusFilter("pending");
  }

  function confirmSeparateFestival() {
    if (!duplicateReview.review) return;
    draftController.updateWorkflow("duplicate_review", {
      fingerprint: duplicateReview.review.fingerprint,
      decision: "create_new",
      reviewed_festival_ids: duplicateReview.review.possible.map(({ id }) => id),
    });
    setEditorError(null);
    setNotice("유사 후보와 다른 별도 신규 축제로 확인했습니다. 이름이나 날짜를 바꾸면 다시 확인해야 합니다.");
  }

  return {
    statusFilter,
    setStatusFilter,
    selectedId,
    reviewNotes,
    setReviewNotes,
    notice,
    setNotice,
    editorError,
    setEditorError,
    isMatchingArtists,
    selectedCandidate,
    currentStep,
    currentStepIndex,
    duplicateReview,
    isSeparateFestivalConfirmed,
    ...candidatesController,
    ...draftController,
    selectCandidate,
    handleMatchArtists,
    handleSave,
    handleMoveStep,
    handleApprove,
    handleDelete,
    handleUseExistingFestival,
    handleCreateManualCandidate,
    handleCreated,
    resetSelection,
    confirmSeparateFestival,
  };
}
