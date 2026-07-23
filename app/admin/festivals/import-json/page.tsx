"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { parseFestivalDraftJson } from "@/lib/festivals/festivalDraft";
import {
  createFestivalUpdatePreview,
  type ExistingFestivalArtist,
  type ExistingFestivalTicket,
  type FestivalUpdateItem,
} from "@/lib/festivals/festivalUpdatePreview";
import { supabase } from "@/lib/supabase/client";
import {
  parseFestivalJsonUpdateResult,
  type FestivalJsonUpdateResult,
} from "@/lib/supabase/rpcResults";
import type { FestivalDraftJson } from "@/lib/types";
import { validateLineupWork, type LineupRound, type LineupWorkType } from "@/lib/audit/lineupWork";
import { buildJsonAuditSummary } from "@/lib/audit/auditSummary";
import JsonLineupAuditFields from "./JsonLineupAuditFields";
import StagedFestivalUpdate from "./StagedFestivalUpdate";

type FestivalRecord = FestivalDraftJson["festival"] & {
  id: number;
  verification_status: string | null;
};

type UpdateLog = {
  id: number;
  action_type: string;
  source_type: string | null;
  source_file_name: string | null;
  audit_changes: Array<{ id: number }>;
  created_at: string;
};

const STATUS_META = {
  same: {
    label: "동일",
    icon: "✅",
    className: "bg-emerald-50 text-emerald-700",
  },
  add: {
    label: "추가",
    icon: "➕",
    className: "bg-blue-50 text-blue-700",
  },
  conflict: {
    label: "확인 필요",
    icon: "📝",
    className: "bg-amber-50 text-amber-800",
  },
} as const;

const SECTION_LABEL = {
  basic: "기본정보",
  lineup: "라인업",
  ticket: "티켓",
} as const;

function firstRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function LegacyFestivalJsonUpdateContent() {
  const searchParams = useSearchParams();
  const expectedFestivalId = Number(searchParams.get("festivalId")) || null;
  const updateDraftId = Number(searchParams.get("updateDraftId")) || null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [draft, setDraft] = useState<FestivalDraftJson | null>(null);
  const [festival, setFestival] = useState<FestivalRecord | null>(null);
  const [items, setItems] = useState<FestivalUpdateItem[]>([]);
  const [logs, setLogs] = useState<UpdateLog[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<FestivalJsonUpdateResult | null>(null);
  const [workType, setWorkType] = useState<LineupWorkType>("announcement");
  const [lineupRound, setLineupRound] = useState<LineupRound>("unspecified");
  const [announcementDate, setAnnouncementDate] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [reason, setReason] = useState("");

  async function loadPreview(file: File) {
    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);
    setDraft(null);
    setFestival(null);
    setItems([]);
    setLogs([]);
    setSelectedIds(new Set());

    try {
      if (!file.name.toLowerCase().endsWith(".json")) {
        throw new Error("JSON 파일을 선택해 주세요.");
      }
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("JSON 파일은 2MB 이하여야 합니다.");
      }

      const incomingDraft = parseFestivalDraftJson(await file.text());
      const identity = incomingDraft.festival;
      setSourceUrl(incomingDraft.candidate?.source_url ?? incomingDraft.festival.source_url ?? "");

      const { data: festivalData, error: festivalError } = await supabase
        .from("festivals")
        .select(`
          id, name, normalized_name, search_aliases, start_date, end_date,
          location, address, region, category, description, price_info,
          program_info, source_url, official_url, thumbnail_url, price_type,
          status, verification_status
        `)
        .eq("normalized_name", identity.normalized_name)
        .eq("start_date", identity.start_date)
        .eq("end_date", identity.end_date)
        .eq("verification_status", "approved")
        .maybeSingle();

      if (festivalError) throw festivalError;
      if (!festivalData) {
        throw new Error(
          "normalized_name과 시작일·종료일이 모두 일치하는 승인 축제가 없습니다. 신규 축제라면 신규 페스티벌 등록을 이용하세요.",
        );
      }
      if (expectedFestivalId && festivalData.id !== expectedFestivalId) {
        throw new Error(
          "현재 관리 중인 축제와 JSON의 축제 정보가 일치하지 않습니다. normalized_name과 날짜를 확인하세요.",
        );
      }

      const normalizedNames = [...new Set(
        incomingDraft.artists
          .map((artist) => artist.normalized_name)
          .filter(Boolean),
      )];

      const [lineupResult, ticketResult, artistResult, logResult] = await Promise.all([
        supabase
          .from("festival_artists")
          .select(`
            id, artist_id, performance_date, performance_time,
            performance_end_time, stage_name, status,
            artists (
              id, name, normalized_name,
              artist_aliases (alias_name)
            )
          `)
          .eq("festival_id", festivalData.id),
        supabase
          .from("festival_ticket_rounds")
          .select(`
            id, round_type, round_name, open_at, price_info,
            ticket_url, ticket_platform
          `)
          .eq("festival_id", festivalData.id),
        normalizedNames.length > 0
          ? supabase
              .from("artists")
              .select("id, normalized_name")
              .in("normalized_name", normalizedNames)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from("audit_events")
          .select("id, action_type, source_type, source_file_name, created_at, audit_changes (id)")
          .eq("festival_id", festivalData.id)
          .eq("action_type", "festival.json_update")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (lineupResult.error) throw lineupResult.error;
      if (ticketResult.error) throw ticketResult.error;
      if (artistResult.error) throw artistResult.error;
      if (logResult.error) throw logResult.error;

      const artistIds = new Map(
        (artistResult.data ?? []).map((artist) => [
          String(artist.normalized_name),
          Number(artist.id),
        ]),
      );

      const resolvedDraft: FestivalDraftJson = {
        ...incomingDraft,
        artists: incomingDraft.artists.map((artist) => {
          const matchedId = artistIds.get(artist.normalized_name);
          return {
            ...artist,
            matched_artist_id: matchedId ?? null,
            match_status: matchedId ? "matched" : "new",
          };
        }),
      };

      const currentArtists: ExistingFestivalArtist[] = (lineupResult.data ?? [])
        .map((row) => {
          const relation = firstRelation(row.artists);
          if (!relation) return null;
          return {
            id: Number(row.id),
            artist_id: Number(row.artist_id),
            performance_date: row.performance_date,
            performance_time: row.performance_time,
            performance_end_time: row.performance_end_time,
            stage_name: row.stage_name,
            status: row.status,
            artist: {
              id: Number(relation.id),
              name: relation.name,
              normalized_name: relation.normalized_name,
              aliases: (relation.artist_aliases ?? []).map((alias) => alias.alias_name),
            },
          };
        })
        .filter((value): value is ExistingFestivalArtist => value !== null);

      const currentTickets = (ticketResult.data ?? []) as ExistingFestivalTicket[];
      const currentFestival = festivalData as FestivalRecord;
      const previewItems = createFestivalUpdatePreview(
        currentFestival,
        currentArtists,
        currentTickets,
        resolvedDraft,
      );

      setDraft(resolvedDraft);
      setFestival(currentFestival);
      setItems(previewItems);
      setLogs((logResult.data ?? []) as UpdateLog[]);
      setSelectedIds(new Set(
        previewItems
          .filter((item) => item.status === "add")
          .map((item) => item.id),
      ));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "JSON 비교에 실패했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!updateDraftId || !expectedFestivalId) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("festival_update_drafts")
        .select("id, festival_id, draft_json, announcement_round, version_number")
        .eq("id", updateDraftId)
        .eq("festival_id", expectedFestivalId)
        .single();
      if (cancelled) return;
      if (error) {
        setErrorMessage(`Discord 업데이트 초안을 불러오지 못했습니다: ${error.message}`);
        return;
      }
      const roundMap: Record<string, LineupRound> = {
        round_1: "first", round_2: "second", round_3: "third", final: "final",
      };
      setLineupRound(roundMap[data.announcement_round] ?? "unspecified");
      const file = new File(
        [JSON.stringify(data.draft_json)],
        `discord-update-${data.id}-v${data.version_number}.json`,
        { type: "application/json" },
      );
      await loadPreview(file);
    })();
    return () => { cancelled = true; };
    // URL의 초안 ID가 바뀔 때만 다시 불러온다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateDraftId, expectedFestivalId]);

  function toggleItem(item: FestivalUpdateItem) {
    if (item.status === "same") return;
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  }

  async function applySelectedChanges() {
    if (!festival || !draft) return;
    const selectedItems = items.filter((item) => selectedIds.has(item.id));
    if (selectedItems.length === 0) {
      setErrorMessage("반영할 추가 또는 변경 항목을 선택해 주세요.");
      return;
    }

    const basicChanges: Record<string, string> = {};
    const artists: NonNullable<FestivalUpdateItem["artistPayload"]>[] = [];
    const tickets: NonNullable<FestivalUpdateItem["ticketPayload"]>[] = [];

    selectedItems.forEach((item) => {
      if (item.basicField && item.basicValue !== undefined) {
        basicChanges[item.basicField] = item.basicValue;
      }
      if (item.artistPayload) artists.push(item.artistPayload);
      if (item.ticketPayload) tickets.push(item.ticketPayload);
    });

    if (artists.length > 0) {
      const validationError = validateLineupWork({ workType, lineupRound, announcementDate, sourceUrl, reason });
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }
    }

    try {
      setIsApplying(true);
      setErrorMessage(null);
      setResult(null);

      const auditSummary = buildJsonAuditSummary(items, selectedIds);
      const { data, error } = await supabase.rpc("apply_festival_json_update_with_summary", {
        p_festival_id: festival.id,
        p_basic_changes: basicChanges,
        p_artists: artists,
        p_tickets: tickets,
        p_source_type: draft.candidate?.source_type ?? "festival_json",
        p_source_url: sourceUrl.trim() || undefined,
        p_source_file_name: fileName,
        p_work_type: artists.length > 0 ? workType : undefined,
        p_lineup_round: artists.length > 0 ? lineupRound : undefined,
        p_announcement_date: artists.length > 0 ? announcementDate || undefined : undefined,
        p_reason: artists.length > 0 ? reason.trim() || undefined : undefined,
        p_audit_summary: auditSummary,
      });

      if (error) throw error;
      const updateResult = parseFestivalJsonUpdateResult(data);
      if (updateDraftId) {
        const { error: draftError } = await supabase
          .from("festival_update_drafts")
          .update({ status: "applied", applied_at: new Date().toISOString() })
          .eq("id", updateDraftId)
          .eq("festival_id", festival.id);
        if (draftError) throw draftError;
      }
      setResult(updateResult);
      setLogs((current) => [{
        id: updateResult.audit_event_id,
        action_type: "festival.json_update",
        source_type: draft.candidate?.source_type ?? "festival_json",
        source_file_name: fileName,
        audit_changes: Array.from({ length: updateResult.change_count }, (_, index) => ({ id: -index - 1 })),
        created_at: new Date().toISOString(),
      }, ...current.filter((log) => log.id !== updateResult.audit_event_id)].slice(0, 10));
      setSelectedIds(new Set());
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "업데이트 반영에 실패했습니다.",
      );
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href={expectedFestivalId
            ? `/admin/festivals/${expectedFestivalId}/lineup`
            : "/admin/festivals"}
          className="inline-flex rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          {expectedFestivalId ? "현재 축제 관리로 돌아가기" : "페스티벌 관리로 돌아가기"}
        </Link>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h1 className="text-lg font-bold text-slate-950">정식 축제 JSON 업데이트</h1>
          <p className="mt-1 text-sm text-slate-600">
            현재 축제와 기본정보·라인업·티켓의 차이를 비교하고 안전한 추가사항만 기본 선택합니다.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              id="festival-update-json"
              type="file"
              accept="application/json,.json"
              disabled={isLoading || isApplying}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setFileName(file.name);
                void loadPreview(file);
              }}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white p-3 text-sm"
            />
          </div>

          {isLoading && (
            <p className="mt-3 text-sm text-slate-500">현재 축제와 비교 중...</p>
          )}

          {draft && festival && (
            <div className="mt-3 rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-700">
              <div>
                <strong>{festival.name}</strong>
                <span className="ml-2 text-slate-500">
                  {festival.start_date} ~ {festival.end_date}
                  {` · 출연진 ${draft.artists.length}명`}
                  {` · 티켓 ${draft.tickets?.length ?? 0}건`}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-slate-500">
                normalized_name: {festival.normalized_name}
              </p>
              <p className="mt-1 text-xs text-slate-400">{fileName}</p>
            </div>
          )}

          {items.some((item) => item.section === "lineup" && selectedIds.has(item.id)) && (
            <JsonLineupAuditFields
              workType={workType} setWorkType={setWorkType}
              lineupRound={lineupRound} setLineupRound={setLineupRound}
              announcementDate={announcementDate} setAnnouncementDate={setAnnouncementDate}
              sourceUrl={sourceUrl} setSourceUrl={setSourceUrl}
              reason={reason} setReason={setReason}
            />
          )}

          {festival && (
            <div className="mt-4 rounded-2xl border border-slate-300 p-4">
              <p className="font-bold text-slate-900">매칭된 정식 축제: {festival.name}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {(["basic", "lineup", "ticket"] as const).map((section) => {
                  const sectionItems = items.filter((item) => item.section === section);
                  return (
                    <div key={section} className="rounded-xl border border-slate-200 p-3">
                      <p className="font-bold text-slate-800">{SECTION_LABEL[section]}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(["same", "add", "conflict"] as const).map((status) => {
                          const count = sectionItems.filter((item) => item.status === status).length;
                          if (count === 0) return null;
                          const meta = STATUS_META[status];
                          return (
                            <span
                              key={status}
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${meta.className}`}
                            >
                              {meta.icon} {meta.label} {count}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {(["basic", "lineup", "ticket"] as const).map((section) => {
                const additions = items.filter(
                  (item) => item.section === section && item.status === "add",
                );
                if (additions.length === 0) return null;
                return (
                  <section key={section} className="mt-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                    <h3 className="font-bold text-slate-900">
                      {SECTION_LABEL[section]} 추가 검토 · {additions.length}건
                    </h3>
                    <div className="mt-3 space-y-2">
                      {additions.map((item) => {
                        const selected = selectedIds.has(item.id);
                        return (
                          <label key={item.id} className="flex cursor-pointer gap-3 rounded-lg border border-blue-100 bg-white p-3">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleItem(item)}
                              className="mt-1 h-4 w-4"
                            />
                            <span className="min-w-0">
                              <span className="block font-bold text-slate-800">➕ {item.label}</span>
                              <span className="mt-1 block whitespace-pre-wrap break-words text-sm text-slate-600">
                                {item.incoming || "추가 정보 없음"}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                );
              })}

              {items.some((item) => item.status !== "add") && (
                <details className="mt-4 rounded-xl border border-slate-200 p-3">
                  <summary className="cursor-pointer text-sm font-bold text-slate-700">
                    동일·변경 확인 항목 보기
                  </summary>
                  <div className="mt-3 space-y-3">
                    {items
                      .filter((item) => item.status !== "add")
                      .map((item) => {
                        const meta = STATUS_META[item.status];
                        const useIncoming = selectedIds.has(item.id);
                        return (
                          <div key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                            <p className="font-bold text-slate-800">
                              {meta.icon} {SECTION_LABEL[item.section]} · {item.label}
                            </p>
                            <p className="mt-1 text-slate-600">
                              현재 DB 값: {item.current || "-"}
                            </p>
                            <p className="mt-1 text-slate-600">
                              가져온 JSON 값: {item.incoming || "-"}
                            </p>
                            {item.status === "conflict" && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (useIncoming) toggleItem(item);
                                  }}
                                  className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                                    !useIncoming
                                      ? "border-slate-900 bg-slate-900 text-white"
                                      : "border-slate-300 bg-white text-slate-700"
                                  }`}
                                >
                                  현재 값 유지
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!useIncoming) toggleItem(item);
                                  }}
                                  className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                                    useIncoming
                                      ? "border-slate-900 bg-slate-900 text-white"
                                      : "border-slate-300 bg-white text-slate-700"
                                  }`}
                                >
                                  JSON 값으로 변경
                                </button>
                                <span className="self-center text-xs font-semibold text-slate-600">
                                  선택 결과: {useIncoming ? "JSON 값으로 변경" : "현재 값 유지"}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </details>
              )}

              <details className="mt-4 rounded-xl border border-slate-200 p-3">
                <summary className="cursor-pointer text-sm font-bold text-slate-700">
                  최근 업데이트 기록 {logs.length}건
                </summary>
                {logs.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">아직 JSON 업데이트 기록이 없습니다.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {logs.map((log) => (
                      <div key={log.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                        <p className="font-semibold text-slate-800">
                          {new Date(log.created_at).toLocaleString("ko-KR")} · 변경 {log.audit_changes.length}건
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {log.source_file_name || log.source_type || "출처 미입력"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </details>
            </div>
          )}

          {festival && (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                저장 선택 {selectedIds.size}건
              </p>
              <button
                type="button"
                disabled={isApplying || selectedIds.size === 0}
                onClick={() => void applySelectedChanges()}
                className="w-full rounded-xl bg-slate-950 px-5 py-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isApplying
                  ? "저장 중..."
                  : `선택한 변경사항 저장 (${selectedIds.size}건)`}
              </button>
            </div>
          )}

          {errorMessage && (
            <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
              {errorMessage}
            </p>
          )}
          {result && (
            <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
              업데이트가 완료되었습니다. 감사 작업 #{result.audit_event_id}에 실제 변경 {result.change_count}건을 기록했습니다.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function FestivalJsonUpdateContent() {
  const searchParams = useSearchParams();
  const festivalId = Number(searchParams.get("festivalId")) || null;
  const updateDraftId = Number(searchParams.get("updateDraftId")) || null;
  if (festivalId && updateDraftId) {
    return <StagedFestivalUpdate festivalId={festivalId} updateDraftId={updateDraftId} />;
  }
  return <LegacyFestivalJsonUpdateContent />;
}

export default function FestivalJsonUpdatePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white p-8">불러오는 중...</main>}>
      <FestivalJsonUpdateContent />
    </Suspense>
  );
}
