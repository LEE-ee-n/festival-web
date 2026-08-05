"use client";

import { useEffect, useMemo, useState } from "react";

import CandidateLineupTab from "@/app/admin/festival-candidates/components/CandidateLineupTab";
import CandidateSourcePreview from "@/app/admin/festival-candidates/components/CandidateSourcePreview";
import AdminBackLink from "@/components/admin/AdminBackLink";
import AdminNotice from "@/components/admin/AdminNotice";
import TimetableVisibilityToggle from "@/components/admin/TimetableVisibilityToggle";
import JsonLineupAuditFields from "./JsonLineupAuditFields";
import FestivalUpdateComparisonTable from "./FestivalUpdateComparisonTable";
import { matchFestivalDraftArtists } from "@/lib/artists/matchFestivalDraftArtists";
import {
  applyExistingArtistSelection,
  type ExistingArtistMatch,
} from "@/lib/artists/applyNormalizedArtistMatches";
import { normalizeArtistName } from "@/lib/artists/normalizeArtistName";
import {
  canEditArtistReviewField,
  type ArtistReviewEditableField,
  FESTIVAL_REGISTRATION_STEPS,
  FESTIVAL_REGISTRATION_STEP_LABELS,
  getActiveDraftArtists,
  getRegistrationStep,
  moveRegistrationStep,
  parseFestivalDraftJson,
} from "@/lib/festivals/festivalDraft";
import {
  createFestivalUpdatePreview,
  setFestivalUpdateItemSelections,
  type ExistingFestivalArtist,
  type ExistingFestivalTicket,
  type FestivalUpdateItem,
} from "@/lib/festivals/festivalUpdatePreview";
import { buildJsonAuditSummary } from "@/lib/audit/auditSummary";
import { validateLineupWork, type LineupRound, type LineupWorkType } from "@/lib/audit/lineupWork";
import { removeCandidateSourceAssets } from "@/lib/festivals/candidateSourceAssets";
import { supabase } from "@/lib/supabase/client";
import type { CandidateSourceAsset, FestivalDraftJson, FestivalRegistrationStep } from "@/lib/types";

type Props = { festivalId: number; updateDraftId: number };
type FestivalRecord = FestivalDraftJson["festival"] & { id: number; updated_at: string | null };
type SavedSelection = {
  selected_ids?: string[];
  work_type?: LineupWorkType;
  lineup_round?: LineupRound;
  announcement_date?: string;
  reason?: string;
  timetable_visibility?: "published" | "unpublished";
};

const SECTION_LABEL = { basic: "기본정보", lineup: "아티스트·타임테이블", ticket: "티켓" } as const;

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default function StagedFestivalUpdate({ festivalId, updateDraftId }: Props) {
  const [draft, setDraft] = useState<FestivalDraftJson | null>(null);
  const [festival, setFestival] = useState<FestivalRecord | null>(null);
  const [currentArtists, setCurrentArtists] = useState<ExistingFestivalArtist[]>([]);
  const [currentTickets, setCurrentTickets] = useState<ExistingFestivalTicket[]>([]);
  const [sourceAssets, setSourceAssets] = useState<CandidateSourceAsset[]>([]);
  const [draftSourceUrl, setDraftSourceUrl] = useState("");
  const [draftSourceType, setDraftSourceType] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [workType, setWorkType] = useState<LineupWorkType>("announcement");
  const [lineupRound, setLineupRound] = useState<LineupRound>("unspecified");
  const [announcementDate, setAnnouncementDate] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setIsLoading(true);
        const { data: updateDraft, error: draftError } = await supabase
          .from("festival_update_drafts")
          .select("id, festival_id, source_url, draft_json, workflow_json, selection_json, status")
          .eq("id", updateDraftId)
          .eq("festival_id", festivalId)
          .single();
        if (draftError) throw draftError;
        if (updateDraft.status !== "pending") throw new Error("이미 반영된 수정 작업입니다.");

        const incoming = parseFestivalDraftJson(JSON.stringify(updateDraft.draft_json));
        const savedWorkflow = updateDraft.workflow_json as FestivalDraftJson["workflow"] | null;
        const savedSelection = (updateDraft.selection_json ?? {}) as SavedSelection;
        incoming.workflow = savedWorkflow ?? incoming.workflow ?? { step: "artist_review", confirmed_steps: [] };

        const normalizedNames = [...new Set(incoming.artists.map((artist) => artist.normalized_name).filter(Boolean))];
        const [festivalResult, lineupResult, ticketResult, artistResult] = await Promise.all([
          supabase.from("festivals").select(`
            id, name, normalized_name, search_aliases, start_date, end_date, location, address,
            region, category, description, price_info, program_info, source_url, official_url, instagram_url,
            thumbnail_url, price_type, status, updated_at
          `).eq("id", festivalId).eq("verification_status", "approved").single(),
          supabase.from("festival_artists").select(`
            id, artist_id, performance_date, performance_time, performance_end_time, stage_name, status,
            artists (id, name, normalized_name, artist_aliases (alias_name))
          `).eq("festival_id", festivalId),
          supabase.from("festival_ticket_rounds").select(`
            id, round_type, round_name, open_at, price_info, ticket_url, ticket_platform
          `).eq("festival_id", festivalId),
          normalizedNames.length
            ? supabase.from("artists").select("id, name, normalized_name, artist_aliases (alias_name)").in("normalized_name", normalizedNames)
            : Promise.resolve({ data: [], error: null }),
        ]);
        if (festivalResult.error) throw festivalResult.error;
        if (lineupResult.error) throw lineupResult.error;
        if (ticketResult.error) throw ticketResult.error;
        if (artistResult.error) throw artistResult.error;

        const exactArtists = new Map(
          (artistResult.data ?? []).map((artist) => [
            artist.normalized_name,
            {
              id: Number(artist.id),
              name: artist.name,
              normalized_name: artist.normalized_name,
              aliases: (artist.artist_aliases ?? []).map((alias) => alias.alias_name),
            } satisfies ExistingArtistMatch,
          ]),
        );
        incoming.artists = incoming.artists.map((artist) => {
          const exact = exactArtists.get(artist.normalized_name);
          if (exact) return applyExistingArtistSelection(artist, exact);
          return { ...artist, matched_artist_id: null, match_status: artist.match_status === "new" || artist.match_status === "excluded" ? artist.match_status : "pending" };
        });

        const lineup = (lineupResult.data ?? []).map((row) => {
          const relation = firstRelation(row.artists);
          if (!relation) return null;
          return {
            id: Number(row.id), artist_id: Number(row.artist_id), performance_date: row.performance_date,
            performance_time: row.performance_time, performance_end_time: row.performance_end_time,
            stage_name: row.stage_name, status: row.status,
            artist: { id: Number(relation.id), name: relation.name, normalized_name: relation.normalized_name, aliases: (relation.artist_aliases ?? []).map((item) => item.alias_name) },
          };
        }).filter((value): value is ExistingFestivalArtist => value !== null);

        if (cancelled) return;
        const loadedFestival: FestivalRecord = {
          id: festivalResult.data.id,
          name: festivalResult.data.name,
          normalized_name: festivalResult.data.normalized_name,
          search_aliases: festivalResult.data.search_aliases ?? undefined,
          start_date: festivalResult.data.start_date,
          end_date: festivalResult.data.end_date,
          location: festivalResult.data.location ?? undefined,
          address: festivalResult.data.address ?? undefined,
          region: festivalResult.data.region ?? undefined,
          category: festivalResult.data.category ?? undefined,
          description: festivalResult.data.description ?? undefined,
          price_info: festivalResult.data.price_info ?? undefined,
          program_info: festivalResult.data.program_info ?? undefined,
          source_url: festivalResult.data.source_url ?? undefined,
          official_url: festivalResult.data.official_url ?? undefined,
          instagram_url: festivalResult.data.instagram_url ?? undefined,
          thumbnail_url: festivalResult.data.thumbnail_url ?? undefined,
          price_type: festivalResult.data.price_type ?? undefined,
          status: festivalResult.data.status ?? undefined,
          updated_at: festivalResult.data.updated_at,
        };
        const loadedTickets: ExistingFestivalTicket[] = ticketResult.data ?? [];
        const preview = createFestivalUpdatePreview(loadedFestival, lineup, loadedTickets, incoming);
        const candidateAssets = incoming.candidate?.source_assets ?? [];
        const hydratedAssets = await Promise.all(
          candidateAssets.map(async (asset) => {
            if (asset.url || !asset.storage_path) return asset;
            const { data: signed } = await supabase.storage
              .from("festival-candidate-posters")
              .createSignedUrl(asset.storage_path, 3600);
            return { ...asset, url: signed?.signedUrl };
          }),
        );
        if (cancelled) return;
        setDraft(incoming);
        setFestival(loadedFestival);
        setCurrentArtists(lineup);
        setCurrentTickets(loadedTickets);
        setSourceUrl(updateDraft.source_url || incoming.candidate?.source_url || "");
        const initialIds = savedSelection.selected_ids ?? preview.filter((item) => item.status === "add").map((item) => item.id);
        setSourceAssets(hydratedAssets);
        setDraftSourceUrl(updateDraft.source_url || incoming.candidate?.source_url || "");
        setDraftSourceType(incoming.candidate?.source_type || "미지정");
        setSelectedIds(new Set(initialIds));
        setWorkType(savedSelection.work_type ?? "announcement");
        setLineupRound(savedSelection.lineup_round ?? "unspecified");
        setAnnouncementDate(savedSelection.announcement_date ?? "");
        setReason(savedSelection.reason ?? "");
      } catch (error) {
        if (!cancelled) setErrorMessage(error instanceof Error ? error.message : "수정 작업을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [festivalId, updateDraftId]);

  const items = useMemo(() => draft && festival
    ? createFestivalUpdatePreview(festival, currentArtists, currentTickets, draft)
    : [], [currentArtists, currentTickets, draft, festival]);

  const step = draft ? getRegistrationStep(draft) : "artist_review";
  const activeArtists = draft ? getActiveDraftArtists(draft) : [];
  const informationItems = items.filter(
    (item) => item.section !== "lineup" && item.status !== "same",
  );
  const informationSameCount = items.filter(
    (item) => item.section !== "lineup" && item.status === "same",
  ).length;
  const lineupItems = items.filter(
    (item) => item.section === "lineup" && item.status !== "same",
  );
  const lineupSameCount = items.filter(
    (item) => item.section === "lineup" && item.status === "same",
  ).length;

  function changeArtist(index: number, field: keyof FestivalDraftJson["artists"][number], value: string | string[] | number | null) {
    setDraft((current) => {
      if (!current) return current;
      const artists = [...current.artists];
      const next = { ...artists[index], [field]: value };
      if (field === "normalized_name") {
        next.match_status = "pending";
        next.matched_artist_id = null;
      }
      if (["normalized_name", "matched_artist_id", "match_status", "status"].includes(field)) {
        const matchedId = Number(next.matched_artist_id);
        next.comparison_status = next.status === "cancelled"
          ? "remove_candidate"
          : Number.isInteger(matchedId) && currentArtists.some((item) => item.artist_id === matchedId)
            ? "existing"
            : "add";
      }
      artists[index] = next;
      return { ...current, artists };
    });
  }

  function changeArtistReviewField(
    index: number,
    field: ArtistReviewEditableField,
    value: string | string[],
  ) {
    setDraft((current) => {
      if (!current) return current;
      const artist = current.artists[index];
      if (!artist || !canEditArtistReviewField(artist, field)) return current;

      const next = { ...artist, [field]: value };
      if (
        field === "display_name"
        && !artist.normalized_name.trim()
        && typeof value === "string"
      ) {
        next.normalized_name = normalizeArtistName(value);
      }
      if (field === "normalized_name") {
        next.match_status = "pending";
        next.matched_artist_id = null;
      }
      const artists = [...current.artists];
      artists[index] = next;
      return { ...current, artists };
    });
  }

  function selectExistingArtist(index: number, existingArtist: ExistingArtistMatch) {
    setDraft((current) => {
      if (!current || !current.artists[index]) return current;
      const selected = applyExistingArtistSelection(
        current.artists[index],
        existingArtist,
      );
      selected.comparison_status = currentArtists.some(
        (item) => item.artist_id === existingArtist.id,
      ) ? "existing" : "add";
      const artists = [...current.artists];
      artists[index] = selected;
      return { ...current, artists };
    });
  }

  function setArtistMatchStatus(
    index: number,
    matchStatus: "pending" | "new" | "excluded",
  ) {
    setDraft((current) => {
      if (!current || !current.artists[index]) return current;
      const artists = [...current.artists];
      artists[index] = {
        ...artists[index],
        matched_artist_id: null,
        match_status: matchStatus,
        comparison_status: matchStatus === "excluded"
          ? artists[index].comparison_status
          : "add",
      };
      return { ...current, artists };
    });
  }

  async function matchAll() {
    if (!draft) return;
    try {
      setIsMatching(true);
      setErrorMessage(null);
      const matched = await matchFestivalDraftArtists(draft);
      setDraft({
        ...matched,
        artists: matched.artists.map((artist) => {
          const matchedId = Number(artist.matched_artist_id);
          return {
            ...artist,
            comparison_status: artist.status === "cancelled"
              ? "remove_candidate" as const
              : Number.isInteger(matchedId) && currentArtists.some((item) => item.artist_id === matchedId)
                ? "existing" as const
                : "add" as const,
          };
        }),
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "아티스트 중복 확인에 실패했습니다.");
    } finally { setIsMatching(false); }
  }

  function addArtist() {
    setDraft((current) => current ? { ...current, artists: [...current.artists, {
      input_name: "", display_name: "", normalized_name: "", aliases: [], matched_artist_id: null, match_status: "pending",
    }] } : current);
  }

  function toggleItem(item: FestivalUpdateItem, selected?: boolean) {
    if (item.status === "same") return;
    setSelectedIds((current) => {
      const next = new Set(current);
      const shouldSelect = selected ?? !next.has(item.id);
      if (shouldSelect) next.add(item.id); else next.delete(item.id);
      return next;
    });
  }

  function setAllItems(itemsToChange: FestivalUpdateItem[], selected: boolean) {
    setSelectedIds((current) =>
      setFestivalUpdateItemSelections(current, itemsToChange, selected),
    );
  }

  async function saveState(nextDraft = draft, ids = selectedIds) {
    if (!nextDraft) return false;
    const selection: SavedSelection = {
      selected_ids: [...ids], work_type: workType, lineup_round: lineupRound,
      announcement_date: announcementDate, reason,
      timetable_visibility: nextDraft.workflow?.timetable_visibility ?? "published",
    };
    const { error } = await supabase.from("festival_update_drafts").update({
      draft_json: nextDraft,
      workflow_json: nextDraft.workflow ?? { step: "artist_review", confirmed_steps: [] },
      selection_json: selection,
    }).eq("id", updateDraftId).eq("festival_id", festivalId).eq("status", "pending");
    if (error) throw error;
    return true;
  }

  async function move(direction: "next" | "previous") {
    if (!draft) return;
    try {
      setIsSaving(true); setErrorMessage(null); setNotice(null);
      const hasSelectedLineupChanges = items.some(
        (item) => item.section === "lineup" && selectedIds.has(item.id),
      );
      if (
        direction === "next" &&
        step === "timetable" &&
        selectedIds.size === 0
      ) {
        throw new Error(
          "반영할 변경사항을 선택해 주세요. 타임테이블 표에서 개별 선택하거나 표시된 변경 전체 반영을 누를 수 있습니다.",
        );
      }
      if (direction === "next" && step === "timetable" && hasSelectedLineupChanges) {
        const validationError = validateLineupWork({
          workType,
          lineupRound,
          announcementDate,
          sourceUrl,
          reason,
        });
        if (validationError) throw new Error(validationError);
      }
      const currentIndex = FESTIVAL_REGISTRATION_STEPS.indexOf(step);
      const targetIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
      const targetStep = FESTIVAL_REGISTRATION_STEPS[targetIndex] as FestivalRegistrationStep | undefined;
      if (!targetStep) return;
      const moved = moveRegistrationStep(draft, targetStep);
      const nextIds = new Set(selectedIds);
      if (step === "artist_review" && festival) {
        const nextItems = createFestivalUpdatePreview(festival, currentArtists, currentTickets, moved);
        nextItems.filter((item) => item.status === "add").forEach((item) => nextIds.add(item.id));
      }
      await saveState(moved, nextIds);
      setSelectedIds(nextIds);
      setDraft(moved);
      setNotice("현재 단계까지 임시저장했습니다.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "단계를 이동하지 못했습니다.");
    } finally { setIsSaving(false); }
  }

  async function saveOnly() {
    try {
      setIsSaving(true); setErrorMessage(null);
      await saveState();
      setNotice("작업 내용을 임시저장했습니다.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "임시저장하지 못했습니다.");
    } finally { setIsSaving(false); }
  }

  async function deleteDraft() {
    if (!window.confirm("이 임시저장과 작업 내용을 전부 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("festival_update_drafts").delete().eq("id", updateDraftId).eq("status", "pending");
    if (error) { setErrorMessage(error.message); return; }
    window.location.href = `/admin/festivals/${festivalId}/lineup`;
  }

  async function finalize() {
    if (!draft || !festival) return;
    const selectedItems = items.filter((item) => selectedIds.has(item.id));
    if (!selectedItems.length) { setErrorMessage("반영할 변경사항이 없습니다."); return; }
    const basicChanges: Record<string, string> = {};
    const artists: NonNullable<FestivalUpdateItem["artistPayload"]>[] = [];
    const tickets: NonNullable<FestivalUpdateItem["ticketPayload"]>[] = [];
    selectedItems.forEach((item) => {
      if (item.basicField && item.basicValue?.trim()) basicChanges[item.basicField] = item.basicValue;
      if (item.artistPayload) {
        const payload = { ...item.artistPayload };
        if (payload.matched_artist_id) payload.aliases = [];
        if (draft.workflow?.timetable_visibility === "unpublished") {
          delete payload.performance_date; delete payload.performance_time; delete payload.performance_end_time; delete payload.stage_name;
        }
        artists.push(payload);
      }
      if (item.ticketPayload) tickets.push(item.ticketPayload);
    });
    if (artists.length) {
      const validationError = validateLineupWork({ workType, lineupRound, announcementDate, sourceUrl, reason });
      if (validationError) { setErrorMessage(validationError); return; }
    }
    try {
      setIsSaving(true); setErrorMessage(null);
      await saveState(draft);
      const { data, error } = await supabase.rpc("finalize_festival_update_draft", {
        p_update_draft_id: updateDraftId, p_basic_changes: basicChanges, p_artists: artists, p_tickets: tickets,
        p_work_type: artists.length ? workType : undefined, p_lineup_round: artists.length ? lineupRound : undefined,
        p_announcement_date: artists.length ? announcementDate || undefined : undefined, p_reason: artists.length ? reason.trim() || undefined : undefined,
        p_audit_summary: buildJsonAuditSummary(items, selectedIds),
      });
      if (error) throw new Error(error.message);
      const result = data as { audit_event_id: number; change_count: number };
      try {
        await removeCandidateSourceAssets(sourceAssets);
      } catch (cleanupError) {
        console.error("임시 수집 이미지 정리에 실패했습니다.", cleanupError);
      }
      setNotice(`수정을 완료했습니다. 감사 작업 #${result.audit_event_id} · 변경 ${result.change_count}건`);
      setDraft(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "최종 반영에 실패했습니다.");
    } finally { setIsSaving(false); }
  }

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
