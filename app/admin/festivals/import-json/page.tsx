"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";

import { parseFestivalDraftJson } from "@/lib/festivals/festivalDraft";
import {
  createFestivalUpdatePreview,
  type ExistingFestivalArtist,
  type ExistingFestivalTicket,
  type FestivalUpdateItem,
} from "@/lib/festivals/festivalUpdatePreview";
import { supabase } from "@/lib/supabase/client";
import type { FestivalDraftJson } from "@/lib/types";

type FestivalRecord = FestivalDraftJson["festival"] & {
  id: number;
  verification_status: string | null;
};

type UpdateResult = {
  festival_id: number;
  log_id: number;
  ticket_count: number;
};

type UpdateLog = {
  id: number;
  source_type: string | null;
  source_file_name: string | null;
  changes: Array<{ section?: string; label?: string }>;
  created_at: string;
};

const STATUS_META = {
  same: {
    label: "동일",
    className: "bg-emerald-50 text-emerald-700",
  },
  add: {
    label: "추가",
    className: "bg-blue-50 text-blue-700",
  },
  conflict: {
    label: "검토 필요",
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

function FestivalJsonUpdateContent() {
  const searchParams = useSearchParams();
  const expectedFestivalId = Number(searchParams.get("festivalId")) || null;
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
  const [result, setResult] = useState<UpdateResult | null>(null);

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
          "normalized_name과 시작일·종료일이 모두 일치하는 승인 축제가 없습니다. 신규 축제라면 신규 등록 작업함을 이용하세요.",
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
          .from("festival_update_logs")
          .select("id, source_type, source_file_name, changes, created_at")
          .eq("festival_id", festivalData.id)
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
          const relation = firstRelation(row.artists as unknown as {
            id: number;
            name: string;
            normalized_name: string;
            artist_aliases: Array<{ alias_name: string }>;
          });
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

    try {
      setIsApplying(true);
      setErrorMessage(null);
      setResult(null);

      const { data, error } = await supabase.rpc("apply_festival_json_update", {
        p_festival_id: festival.id,
        p_basic_changes: basicChanges,
        p_artists: artists,
        p_tickets: tickets,
        p_change_log: selectedItems.map((item) => ({
          section: item.section,
          label: item.label,
          status: item.status,
          before: item.current,
          after: item.incoming,
        })),
        p_source_type: draft.candidate?.source_type ?? "festival_json",
        p_source_url: draft.candidate?.source_url ?? draft.festival.source_url ?? null,
        p_source_file_name: fileName,
      });

      if (error) throw error;
      const updateResult = data as UpdateResult;
      setResult(updateResult);
      setLogs((current) => [
        {
          id: updateResult.log_id,
          source_type: draft.candidate?.source_type ?? "festival_json",
          source_file_name: fileName,
          changes: selectedItems.map((item) => ({
            section: item.section,
            label: item.label,
          })),
          created_at: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 10));
      setSelectedIds(new Set());
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "업데이트 반영에 실패했습니다.",
      );
    } finally {
      setIsApplying(false);
    }
  }

  function resetPage() {
    setFileName("");
    setDraft(null);
    setFestival(null);
    setItems([]);
    setLogs([]);
    setSelectedIds(new Set());
    setErrorMessage(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

        <header className="mt-6">
          <h1 className="text-3xl font-bold text-slate-950">정식 축제 JSON 업데이트</h1>
          <p className="mt-2 text-sm text-slate-600">
            기존 값은 유지하고 새 항목만 기본 선택합니다. 다른 값은 확인 후 직접 선택합니다.
          </p>
        </header>

        <section className="mt-6 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <label className="text-sm font-bold text-slate-800" htmlFor="festival-update-json">
            업데이트 JSON 파일
          </label>
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
            className="mt-3 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
          <button
            type="button"
            onClick={resetPage}
            className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
          >
            초기화
          </button>
        </section>

        {isLoading && <p className="mt-5 text-sm font-semibold text-slate-600">DB와 비교 중...</p>}

        {festival && (
          <section className="mt-6 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">{festival.name}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {festival.normalized_name} · {festival.start_date} ~ {festival.end_date}
            </p>

            <div className="mt-5 space-y-3">
              {items.map((item) => {
                const meta = STATUS_META[item.status];
                const isSelected = selectedIds.has(item.id);
                return (
                  <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-slate-900">
                        {SECTION_LABEL[item.section]} · {item.label}
                      </p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <p className="rounded-lg bg-slate-50 p-3 text-slate-700">
                        <strong>현재:</strong> {item.current || "-"}
                      </p>
                      <p className="rounded-lg bg-slate-50 p-3 text-slate-700">
                        <strong>JSON:</strong> {item.incoming || "-"}
                      </p>
                    </div>
                    {item.status !== "same" && (
                      <button
                        type="button"
                        onClick={() => toggleItem(item)}
                        className={[
                          "mt-3 rounded-lg px-4 py-2 text-sm font-bold",
                          isSelected
                            ? "bg-slate-900 text-white"
                            : "border border-slate-300 bg-white text-slate-700",
                        ].join(" ")}
                      >
                        {isSelected ? "반영 선택됨" : "기존 값 유지"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-200 pt-5">
              <button
                type="button"
                disabled={isApplying || selectedIds.size === 0}
                onClick={() => void applySelectedChanges()}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                {isApplying ? "업데이트 중..." : `선택한 ${selectedIds.size}개 항목 반영`}
              </button>
            </div>

            <details className="mt-6 border-t border-slate-200 pt-5">
              <summary className="cursor-pointer text-sm font-bold text-slate-800">
                최근 업데이트 기록 {logs.length}건
              </summary>
              {logs.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">아직 JSON 업데이트 기록이 없습니다.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                      <p className="font-semibold text-slate-800">
                        {new Date(log.created_at).toLocaleString("ko-KR")} · 변경 {log.changes.length}건
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {log.source_file_name || log.source_type || "출처 미입력"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </details>
          </section>
        )}

        {errorMessage && (
          <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {errorMessage}
          </p>
        )}
        {result && (
          <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            업데이트가 완료되었습니다. 변경 로그 #{result.log_id}에 기록했습니다.
          </p>
        )}
      </div>
    </main>
  );
}

export default function FestivalJsonUpdatePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white p-8">불러오는 중...</main>}>
      <FestivalJsonUpdateContent />
    </Suspense>
  );
}
