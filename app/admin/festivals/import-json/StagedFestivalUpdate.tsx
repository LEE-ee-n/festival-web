"use client";

import CandidateLineupTab from "@/app/admin/festival-candidates/components/CandidateLineupTab";
import CandidateSourcePreview from "@/app/admin/festival-candidates/components/CandidateSourcePreview";
import AdminBackLink from "@/components/admin/AdminBackLink";
import AdminNotice from "@/components/admin/AdminNotice";
import TimetableVisibilityToggle from "@/components/admin/TimetableVisibilityToggle";
import {
  FESTIVAL_REGISTRATION_STEPS,
  FESTIVAL_REGISTRATION_STEP_LABELS,
} from "@/lib/festivals/festivalDraft";
import FestivalUpdateComparisonTable from "./FestivalUpdateComparisonTable";
import { useStagedFestivalUpdateController } from "./hooks/useStagedFestivalUpdateController";
import JsonLineupAuditFields from "./JsonLineupAuditFields";

type Props = { festivalId: number; updateDraftId: number };

const SECTION_LABEL = { basic: "기본정보", lineup: "아티스트·타임테이블", ticket: "티켓" } as const;

export default function StagedFestivalUpdate({ festivalId, updateDraftId }: Props) {
  const {
    draft,
    setDraft,
    festival,
    currentArtists,
    sourceAssets,
    draftSourceUrl,
    draftSourceType,
    selectedIds,
    workType,
    setWorkType,
    lineupRound,
    setLineupRound,
    announcementDate,
    setAnnouncementDate,
    sourceUrl,
    setSourceUrl,
    reason,
    setReason,
    isLoading,
    isSaving,
    isMatching,
    errorMessage,
    notice,
    items,
    step,
    activeArtists,
    informationItems,
    informationSameCount,
    lineupItems,
    lineupSameCount,
    changeArtist,
    changeArtistReviewField,
    selectExistingArtist,
    setArtistMatchStatus,
    matchAll,
    addArtist,
    toggleItem,
    setAllItems,
    saveOnly,
    deleteDraft,
    move,
    finalize,
  } = useStagedFestivalUpdateController({ festivalId, updateDraftId });

  if (isLoading) return <main className="min-h-screen bg-surface p-8">기존 페스티벌 수정 작업을 불러오는 중...</main>;
  if (!draft || !festival) return <main className="min-h-screen bg-surface p-8"><AdminBackLink /><p>{notice ?? errorMessage ?? "완료된 작업입니다."}</p></main>;

  return (
    <main className="min-h-screen bg-surface px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <AdminBackLink />
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm font-semibold text-ink-tertiary">기존 페스티벌 수정</p><h1 className="mt-1 text-2xl font-bold text-ink">{festival.name}</h1><p className="mt-1 text-sm text-ink-tertiary">기존 자료를 유지하고 선택한 추가·변경만 마지막에 한 번 반영합니다.</p></div>
          <div className="flex gap-2"><button type="button" onClick={() => void saveOnly()} disabled={isSaving} className="rounded-xl border border-line-strong px-4 py-2 text-sm font-bold">임시저장</button><button type="button" onClick={() => void deleteDraft()} disabled={isSaving} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600">임시저장 삭제</button></div>
        </div>

        <CandidateSourcePreview
          sourceUrl={draftSourceUrl}
          sourceType={draftSourceType}
          rawText={draft.candidate?.raw_text}
          sourceAssets={sourceAssets}
          className="mt-6"
        />

        <div className="mt-6 grid gap-2 sm:grid-cols-5">
          {FESTIVAL_REGISTRATION_STEPS.map((item, index) => <div key={item} className={`rounded-xl border p-3 text-xs font-bold ${step === item ? "border-line-strong bg-surface-strong text-ink" : "border-line-strong bg-surface text-ink-muted"}`}><span className="block">{index + 1}단계</span>{FESTIVAL_REGISTRATION_STEP_LABELS[item]}</div>)}
        </div>

        {step === "artist_review" && <CandidateLineupTab artists={draft.artists} designVariant="existing-update" onAdd={addArtist} onMatchAll={() => void matchAll()} isMatching={isMatching} onChange={changeArtist} onReviewFieldChange={changeArtistReviewField} onSelectExisting={selectExistingArtist} onSetMatchStatus={setArtistMatchStatus} />}

        {step === "artist_confirmation" && <section className="mt-6 rounded-2xl border border-line p-5"><h2 className="text-lg font-bold">아티스트 최종 확정</h2><p className="mt-1 text-sm text-ink-tertiary">기존 연결과 이번에 추가할 명단을 한눈에 확인합니다. 이 단계에서는 수정할 수 없습니다.</p><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {currentArtists.map((item) => <div key={`old-${item.id}`} className="rounded-xl border border-line bg-surface p-3"><p className="font-bold">{item.artist.name}</p><p className="text-xs text-ink-tertiary">{item.artist.normalized_name} · 기존</p></div>)}
          {activeArtists.filter((artist) => {
            const matchedId = Number(artist.matched_artist_id);
            return !Number.isInteger(matchedId)
              || !currentArtists.some((item) => item.artist_id === matchedId);
          }).map((artist, index) => <div key={`new-${index}`} className="rounded-xl border border-line bg-surface p-3"><p className="font-bold">{artist.display_name}</p><p className="text-xs text-ink-tertiary">{artist.normalized_name} · {artist.match_status === "new" ? "신규 아티스트" : "기존 아티스트 · 추가 라인업"}</p></div>)}
        </div></section>}

        {step === "festival_info" && (
          <section className="mt-6">
            <h2 className="text-lg font-bold">페스티벌 정보·티켓 검토</h2>
            <p className="mt-1 text-sm text-ink-tertiary">
              빈 값은 기존 값을 지우지 않습니다. 반영할 값만 선택하세요.
            </p>
            <FestivalUpdateComparisonTable
              items={informationItems}
              selectedIds={selectedIds}
              onToggle={toggleItem}
              onSetAll={setAllItems}
              sameCount={informationSameCount}
              variant="information"
            />
          </section>
        )}

        {step === "timetable" && <section className="mt-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">타임테이블 검토</h2><p className="mt-1 text-sm text-ink-tertiary">확정된 아티스트의 일정만 추가·수정할 수 있습니다.</p></div><TimetableVisibilityToggle value={draft.workflow?.timetable_visibility} onChange={(value) => setDraft({ ...draft, workflow: { ...draft.workflow, timetable_visibility: value } })} /></div>
          {draft.workflow?.timetable_visibility === "unpublished" ? (
            <AdminNotice
              tone="warning"
              message="타임테이블 미공개로 반영합니다. 아티스트 연결만 추가하고 일정은 저장하지 않습니다."
              className="mt-5"
            />
          ) : (
            <FestivalUpdateComparisonTable
              items={lineupItems}
              selectedIds={selectedIds}
              onToggle={toggleItem}
              onSetAll={setAllItems}
              sameCount={lineupSameCount}
              variant="lineup"
            />
          )}
          {items.some((item) => item.section === "lineup" && selectedIds.has(item.id)) && <JsonLineupAuditFields workType={workType} setWorkType={setWorkType} lineupRound={lineupRound} setLineupRound={setLineupRound} announcementDate={announcementDate} setAnnouncementDate={setAnnouncementDate} sourceUrl={sourceUrl} setSourceUrl={setSourceUrl} reason={reason} setReason={setReason} />}
        </section>}

        {step === "final_confirmation" && (
          <section className="mt-6 rounded-2xl border border-line-strong bg-surface p-5">
            <h2 className="text-lg font-bold text-ink">최종 반영 검토</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              선택한 변경 {selectedIds.size}건을 한 번에 반영합니다. 기존 자료는 삭제하지 않습니다.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {(["basic", "lineup", "ticket"] as const).map((section) => (
                <div key={section} className="rounded-xl border border-line bg-surface p-3">
                  <p className="text-xs text-ink-tertiary">{SECTION_LABEL[section]}</p>
                  <p className="text-xl font-bold text-ink">
                    {items.filter((item) => item.section === section && selectedIds.has(item.id)).length}건
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <AdminNotice message={errorMessage} className="mt-4" />
        <AdminNotice message={notice} tone="info" className="mt-4" />
        <div className="mt-6 flex justify-between border-t border-line pt-5"><button type="button" disabled={isSaving || step === "artist_review"} onClick={() => void move("previous")} className="rounded-xl border border-line-strong px-5 py-3 text-sm font-bold disabled:opacity-30">이전</button>{step !== "final_confirmation" ? <button type="button" disabled={isSaving} onClick={() => void move("next")} className="rounded-xl bg-surface-dark px-5 py-3 text-sm font-bold text-white disabled:opacity-40">이 단계 확정 후 다음</button> : <button type="button" onClick={() => void finalize()} disabled={isSaving || selectedIds.size === 0} className="rounded-xl bg-surface-dark px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{isSaving ? "반영 중..." : "페스티벌 수정 최종 확정"}</button>}</div>
      </div>
    </main>
  );
}
