"use client";

import Link from "next/link";

import CandidateBasicInfoTab from "@/app/admin/festival-candidates/components/CandidateBasicInfoTab";
import CandidateLineupTab from "@/app/admin/festival-candidates/components/CandidateLineupTab";
import CandidateTicketTab from "@/app/admin/festival-candidates/components/CandidateTicketTab";
import CandidateSourcePreview from "@/app/admin/festival-candidates/components/CandidateSourcePreview";
import FestivalCandidateJsonUploader from "@/app/admin/festival-candidates/components/FestivalCandidateJsonUploader";
import FestivalDuplicateReview from "@/app/admin/festival-candidates/components/FestivalDuplicateReview";
import TicketDiscoveryUploader from "@/app/admin/festival-candidates/components/TicketDiscoveryUploader";
import { useFestivalCandidateController } from "@/app/admin/festival-candidates/hooks/useFestivalCandidateController";
import AdminBackLink from "@/components/admin/AdminBackLink";
import AdminNotice from "@/components/admin/AdminNotice";
import TimetableVisibilityToggle from "@/components/admin/TimetableVisibilityToggle";
import {
  FESTIVAL_REGISTRATION_STEPS,
  FESTIVAL_REGISTRATION_STEP_LABELS,
  getActiveDraftArtists,
} from "@/lib/festivals/festivalDraft";

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

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function FestivalCandidatesPage() {
  const {
    statusFilter,
    setStatusFilter,
    selectedId,
    reviewNotes,
    setReviewNotes,
    notice,
    editorError,
    setEditorError,
    isMatchingArtists,
    selectedCandidate,
    currentStep,
    currentStepIndex,
    duplicateReview,
    isSeparateFestivalConfirmed,
    candidates,
    isLoading,
    isMutating,
    errorMessage,
    draft,
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
  } = useFestivalCandidateController();

  return (
    <main className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <AdminBackLink />

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink-secondary">관리자</p>
            <h1 className="mt-2 text-3xl font-bold text-ink">
              신규 페스티벌 등록
            </h1>
            <p className="mt-2 text-sm text-ink-tertiary">
              직접 작성하거나 수집한 자료를 단계별로 검토해 새 페스티벌을 등록합니다.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={isMutating}
              onClick={() => void handleCreateManualCandidate()}
              className="rounded-xl bg-surface-dark px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              직접 신규 작성
            </button>
          </div>
        </div>

        <FestivalCandidateJsonUploader onCreated={handleCreated} />

        <TicketDiscoveryUploader onCreated={handleCreated} />

        <div className="mt-6 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setStatusFilter(option.value);
                resetSelection();
              }}
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold",
                statusFilter === option.value
                  ? "bg-surface-dark text-white"
                  : "border border-line-strong bg-surface text-ink-secondary",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>

        <AdminNotice message={editorError || errorMessage} className="mt-5" />
        {notice && (
          <p className="mt-5 text-sm font-semibold text-ink">{notice}</p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(280px,0.7fr)_minmax(0,1.5fr)]">
          <section>
            {isLoading ? (
              <p className="text-sm text-ink-tertiary">불러오는 중...</p>
            ) : candidates.length === 0 ? (
              <p className="text-sm text-ink-tertiary">
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
                      "w-full rounded-2xl border bg-surface p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                      selectedId === candidate.id
                        ? "border-slate-900 ring-2 ring-slate-200"
                        : "border-line",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-bold text-ink">
                        {candidate.title}
                      </h2>
                      <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink-secondary">
                        {STATUS_LABELS[candidate.status]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-ink-secondary">
                      {candidate.festival_name || "축제명 추출 전"}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
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
                        <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink-secondary">
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

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-7">
            {!selectedCandidate ? (
              <p className="text-sm text-ink-tertiary">
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
                    <h2 className="text-xl font-bold text-ink">
                      {selectedCandidate.title}
                    </h2>
                    <span className="text-xs text-ink-muted">
                      수집 {formatDateTime(selectedCandidate.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-tertiary">
                    출처: {selectedCandidate.source_type || "미지정"}
                    {selectedCandidate.score !== null
                      ? ` · 점수 ${selectedCandidate.score}`
                      : ""}
                  </p>
                </div>

                <CandidateSourcePreview
                  sourceUrl={selectedCandidate.source_url}
                  sourceType={selectedCandidate.source_type}
                  rawText={selectedCandidate.raw_text}
                  sourceAssets={selectedCandidate.source_assets}
                />

                <AdminNotice message={duplicateReview.errorMessage} />
                <FestivalDuplicateReview
                  review={duplicateReview.review}
                  isLoading={duplicateReview.isLoading}
                  isConfirmed={isSeparateFestivalConfirmed}
                  isMutating={isMutating}
                  onUseExisting={(festivalId) => void handleUseExistingFestival(festivalId)}
                  onConfirmCreateNew={confirmSeparateFestival}
                />

                <div>
                  <ol className="grid gap-2 sm:grid-cols-5">
                    {FESTIVAL_REGISTRATION_STEPS.map((step, index) => (
                      <li
                        key={step}
                        className={[
                          "rounded-xl border px-3 py-3 text-xs font-bold",
                          step === currentStep
                            ? "border-slate-900 bg-surface-dark text-white"
                            : index < currentStepIndex
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-line bg-surface-subtle text-ink-muted",
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
                          <h3 className="text-lg font-bold text-ink">아티스트 최종 확정</h3>
                          <p className="mt-1 text-sm text-ink-tertiary">수정 기능 없이 전체 명단만 빠르게 확인합니다.</p>
                        </div>
                        <strong className="text-sm text-ink-secondary">총 {getActiveDraftArtists(draft).length}명</strong>
                      </div>
                      <div className="mt-5 grid gap-2 sm:grid-cols-2">
                        {getActiveDraftArtists(draft).map((artist) => (
                          <div key={`${artist.normalized_name}-${artist.matched_artist_id ?? "new"}`} className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
                            <div>
                              <p className="font-bold text-ink">{artist.display_name}</p>
                              <p className="text-xs text-ink-tertiary">{artist.normalized_name}</p>
                            </div>
                            <span className={artist.match_status === "new" ? "rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700" : "rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-ink-secondary"}>
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
                      <div className="mt-6 rounded-xl border border-line bg-surface-subtle p-4">
                        <TimetableVisibilityToggle
                          value={draft.workflow?.timetable_visibility}
                          onChange={(value) => updateWorkflow("timetable_visibility", value)}
                        />
                      </div>
                      {draft.workflow?.timetable_visibility === "unpublished" ? (
                        <AdminNotice
                          tone="warning"
                          message="OCR 타임테이블은 저장하지 않고 미공개 상태만 반영합니다."
                          className="mt-5"
                        />
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
                    className="text-sm font-bold text-ink-secondary"
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
                    className="mt-2 min-h-24 w-full rounded-xl border border-line-strong p-3 text-sm outline-none focus:border-slate-900"
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-5">
                  {currentStepIndex > 0 && (
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => void handleMoveStep(FESTIVAL_REGISTRATION_STEPS[currentStepIndex - 1])}
                      className="rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-sm font-semibold text-ink-secondary disabled:opacity-50"
                    >
                      이전 단계
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => void handleSave()}
                    className="rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-sm font-semibold text-ink-secondary disabled:opacity-50"
                  >
                    임시저장
                  </button>
                  {currentStepIndex < FESTIVAL_REGISTRATION_STEPS.length - 1 ? (
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => void handleMoveStep(FESTIVAL_REGISTRATION_STEPS[currentStepIndex + 1])}
                      className="rounded-xl bg-surface-dark px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
