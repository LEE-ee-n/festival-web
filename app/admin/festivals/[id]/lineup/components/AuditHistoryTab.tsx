"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatAuditValue,
  getFestivalAuditDiff,
  type AuditSnapshot,
} from "@/lib/audit/festivalAuditDiff";
import {
  summarizeAuditOperations,
  type AuditCountSummary,
  type JsonAuditSummary,
} from "@/lib/audit/auditSummary";
import { supabase } from "@/lib/supabase/client";

type AuditChange = {
  id: number;
  entity_type: string;
  entity_label: string;
  operation: "insert" | "update" | "delete";
  before_data: AuditSnapshot | null;
  after_data: AuditSnapshot | null;
};

type AuditEvent = {
  id: number;
  festival_id: number | null;
  festival_name: string | null;
  target_type: string | null;
  target_id: string | null;
  target_label: string | null;
  actor_name: string;
  action_type: string;
  created_at: string;
  work_type: "announcement" | "correction" | null;
  lineup_round: string | null;
  announcement_date: string | null;
  source_url: string | null;
  reason: string | null;
  source_type: string | null;
  source_file_name: string | null;
  note: string | null;
  audit_summary: JsonAuditSummary | null;
  audit_changes: AuditChange[];
};

const actionLabels: Record<string, string> = {
  "festival.created": "축제 기본정보 등록",
  "festival.updated": "축제 기본정보 수정",
  "festival.deleted": "축제 삭제",
  "lineup.announcement": "라인업 발표",
  "lineup.correction": "라인업 정정",
  "festival.json_update": "축제 JSON 업데이트",
  "ticket.created": "티켓 추가",
  "ticket.updated": "티켓 수정",
  "ticket.deleted": "티켓 삭제",
  "thumbnail.uploaded": "썸네일 업로드",
  "thumbnail.replaced": "썸네일 교체",
  "thumbnail.deleted": "썸네일 삭제",
  "artist.created": "아티스트 생성",
  "artist.updated": "아티스트 정보 수정",
  "artist.deleted": "아티스트 삭제",
  "artist.alias_changed": "아티스트 별칭 변경",
  "baseline.existing_data": "기존 데이터 기준점",
};

const roundLabels: Record<string, string> = {
  unspecified: "차수 미지정",
  first: "1차",
  second: "2차",
  third: "3차",
  final: "최종",
};

const operationLabels = { insert: "추가", update: "변경", delete: "삭제" } as const;
const sectionLabels = { basic: "기본정보", lineup: "라인업", ticket: "티켓" } as const;

function SummaryBadges({ summary }: { summary: AuditCountSummary }) {
  const badges = [
    ["유지", summary.maintained, "bg-slate-100 text-slate-700"],
    ["추가", summary.added, "bg-blue-50 text-blue-700"],
    ["변경", summary.changed, "bg-amber-50 text-amber-800"],
    ["삭제", summary.deleted, "bg-red-50 text-red-700"],
    ["미반영", summary.skipped, "bg-slate-100 text-slate-500"],
  ] as const;
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.filter(([, count]) => count > 0).map(([label, count, className]) => (
        <span key={label} className={`rounded-full px-2.5 py-1 text-xs font-bold ${className}`}>
          {label} {count}
        </span>
      ))}
    </div>
  );
}

function groupArtistBaselines(events: AuditEvent[], enabled: boolean): AuditEvent[] {
  if (!enabled) return events;
  const artistBaselines = events.filter(
    (event) => event.action_type === "baseline.existing_data" && event.target_type === "artist",
  );
  if (artistBaselines.length < 2) return events;
  const first = artistBaselines[0];
  const grouped: AuditEvent = {
    ...first,
    id: -first.id,
    target_id: null,
    target_label: `기존 아티스트 ${artistBaselines.length}명`,
    audit_changes: artistBaselines.flatMap((event) => event.audit_changes),
  };
  const artistIds = new Set(artistBaselines.map((event) => event.id));
  return [grouped, ...events.filter((event) => !artistIds.has(event.id))]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

type AuditHistoryTabProps = { festivalId?: string; scope?: "festival" | "all" };

export default function AuditHistoryTab({ festivalId, scope = "festival" }: AuditHistoryTabProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      let query = supabase
        .from("audit_events")
        .select(`id, festival_id, festival_name, target_type, target_id, target_label, actor_name, action_type, created_at, work_type, lineup_round, announcement_date, source_url, reason, source_type, source_file_name, note, audit_summary, audit_changes (id, entity_type, entity_label, operation, before_data, after_data)`)
        .order("created_at", { ascending: false })
        .limit(500);
      if (scope === "festival" && festivalId) query = query.eq("festival_id", Number(festivalId));
      const { data, error } = await query;
      if (error) throw error;
      setEvents((data ?? []) as AuditEvent[]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "변경 기록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [festivalId, scope]);

  useEffect(() => { queueMicrotask(() => { void loadEvents(); }); }, [loadEvents]);
  const displayEvents = useMemo(() => groupArtistBaselines(events, scope === "all"), [events, scope]);

  if (isLoading) return <p className="py-10 text-sm text-slate-500">변경 기록을 불러오는 중입니다.</p>;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{scope === "all" ? "전체 변경 기록" : "변경 기록"}</h2>
          <p className="mt-1 text-sm text-slate-500">요약을 누르면 변경 전·후 전체 값을 확인할 수 있습니다.</p>
        </div>
        <button type="button" onClick={() => void loadEvents()} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">새로고침</button>
      </div>

      {errorMessage && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>}
      {!errorMessage && displayEvents.length === 0 && <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">아직 변경 기록이 없습니다.</div>}

      <div className="mt-5 space-y-3">
        {displayEvents.map((event) => {
          const summary = event.audit_summary?.total ?? summarizeAuditOperations(event.audit_changes);
          const target = event.target_label ?? event.festival_name ?? `${event.target_type ?? "기록"} #${event.target_id ?? "-"}`;
          return (
            <details key={event.id} className="group rounded-2xl border border-slate-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-950">{actionLabels[event.action_type] ?? event.action_type}</h3>
                    {event.action_type === "baseline.existing_data"
                      ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">기준 데이터 {event.audit_changes.length}</span>
                      : <SummaryBadges summary={summary} />}
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-600">{target} · {event.actor_name} · {new Date(event.created_at).toLocaleString("ko-KR")}</p>
                </div>
                <span className="text-xl text-slate-500 transition group-open:rotate-180">⌄</span>
              </summary>

              <div className="border-t border-slate-200 px-5 pb-5">
                {event.audit_summary?.sections && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {(Object.keys(sectionLabels) as Array<keyof typeof sectionLabels>).map((section) => (
                      <div key={section} className="rounded-xl bg-slate-50 p-3">
                        <p className="mb-2 text-sm font-bold text-slate-800">{sectionLabels[section]}</p>
                        <SummaryBadges summary={event.audit_summary!.sections[section] ?? { maintained: 0, added: 0, changed: 0, deleted: 0, skipped: 0 }} />
                      </div>
                    ))}
                  </div>
                )}

                {(event.work_type || event.source_file_name || event.source_type || event.source_url || event.reason || event.note) && (
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {event.work_type && <span>차수: <strong>{roundLabels[event.lineup_round ?? ""] ?? event.lineup_round}</strong></span>}
                    {event.work_type && <span>공식 발표일: <strong>{event.announcement_date ?? "없음"}</strong></span>}
                    {event.source_file_name && <span>JSON 파일: <strong>{event.source_file_name}</strong></span>}
                    {event.source_type && <span>출처 유형: <strong>{event.source_type}</strong></span>}
                    {event.reason && <span>정정 사유: <strong>{event.reason}</strong></span>}
                    {event.note && <span>메모: <strong>{event.note}</strong></span>}
                    {event.source_url && <a href={event.source_url} target="_blank" rel="noreferrer" className="font-semibold text-blue-600">출처 열기</a>}
                  </div>
                )}

                {event.audit_changes.map((change) => {
                  const fields = getFestivalAuditDiff(change.before_data, change.after_data);
                  return (
                    <div key={change.id} className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                      <div className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
                        {operationLabels[change.operation]} · {change.entity_label} · {fields.length}개 항목
                      </div>
                      <div className="divide-y divide-slate-200">
                        {fields.map((field) => (
                          <div key={field.field} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[150px_1fr_24px_1fr]">
                            <span className="font-semibold text-slate-700">{field.label}</span>
                            <span className="break-all text-slate-500">{formatAuditValue(field.before)}</span>
                            <span className="text-center text-slate-400">→</span>
                            <span className="break-all font-medium text-slate-900">{formatAuditValue(field.after)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
