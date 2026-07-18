"use client";

import { useRef, useState } from "react";

import {
  classifyTicketDiscovery,
  createTicketDiscoveryDraft,
  parseTicketDiscoveryReport,
  type TicketDiscoveryItem,
  type TicketDiscoveryMatch,
  type TicketDiscoveryReference,
} from "@/lib/festivals/ticketDiscovery";
import { supabase } from "@/lib/supabase/client";

const MAX_JSON_SIZE = 2 * 1024 * 1024;

type ReviewedItem = {
  item: TicketDiscoveryItem;
  match: TicketDiscoveryMatch;
};

type Props = {
  onCreated: () => void;
};

const STATUS_STYLE = {
  duplicate: "bg-gray-200 text-gray-700",
  possible: "bg-amber-100 text-amber-800",
  new: "bg-emerald-100 text-emerald-800",
};

const STATUS_LABEL = {
  duplicate: "기존 등록",
  possible: "중복 가능성",
  new: "신규 후보",
};

export default function TicketDiscoveryUploader({ onCreated }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [reviewedItems, setReviewedItems] = useState<ReviewedItem[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadReferences(): Promise<TicketDiscoveryReference[]> {
    const [festivalsResult, candidatesResult, ticketsResult] = await Promise.all([
      supabase
        .from("festivals")
        .select("id, name, normalized_name, search_aliases, start_date, end_date, source_url"),
      supabase
        .from("festival_candidates")
        .select("id, title, festival_name, start_date, end_date, source_url"),
      supabase
        .from("festival_ticket_rounds")
        .select("id, festival_id, ticket_url"),
    ]);

    if (festivalsResult.error) throw festivalsResult.error;
    if (candidatesResult.error) throw candidatesResult.error;
    if (ticketsResult.error) throw ticketsResult.error;

    return [
      ...(festivalsResult.data ?? []).map((festival) => ({
        kind: "festival" as const,
        id: festival.id,
        title: festival.name,
        source_url: festival.source_url,
        start_date: festival.start_date,
        end_date: festival.end_date,
        normalized_name: festival.normalized_name,
        search_aliases: festival.search_aliases,
      })),
      ...(candidatesResult.data ?? []).map((candidate) => ({
        kind: "candidate" as const,
        id: candidate.id,
        title: candidate.festival_name || candidate.title,
        source_url: candidate.source_url,
        start_date: candidate.start_date,
        end_date: candidate.end_date,
      })),
      ...(ticketsResult.data ?? []).map((ticket) => ({
        kind: "ticket" as const,
        id: ticket.id,
        title: `축제 ${ticket.festival_id}의 기존 티켓`,
        source_url: ticket.ticket_url,
      })),
    ];
  }

  async function handleFile(file?: File) {
    setReviewedItems([]);
    setSelectedUrls(new Set());
    setMessage(null);
    setErrorMessage(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
      setErrorMessage("JSON 파일을 선택해 주세요.");
      return;
    }
    if (file.size > MAX_JSON_SIZE) {
      setErrorMessage("JSON 파일은 2MB 이하여야 합니다.");
      return;
    }

    try {
      setIsLoading(true);
      const items = parseTicketDiscoveryReport(await file.text());
      const references = await loadReferences();
      const reviewed = items.map((item) => ({
        item,
        match: classifyTicketDiscovery(item, references),
      }));
      setReviewedItems(reviewed);
      setSelectedUrls(new Set(
        reviewed
          .filter(({ match }) => match.status === "new")
          .map(({ item }) => item.source_url),
      ));
      setMessage(`${reviewed.length}개 항목의 중복 확인을 완료했습니다.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "JSON 검토에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleItem(sourceUrl: string) {
    setSelectedUrls((current) => {
      const next = new Set(current);
      if (next.has(sourceUrl)) next.delete(sourceUrl);
      else next.add(sourceUrl);
      return next;
    });
  }

  async function handleSave() {
    const selected = reviewedItems.filter(({ item, match }) =>
      match.status !== "duplicate" && selectedUrls.has(item.source_url),
    );
    if (selected.length === 0) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);
      const rows = selected.map(({ item }) => {
        const draft = createTicketDiscoveryDraft(item);
        return {
          title: item.title,
          source_url: item.source_url,
          source_type: item.source_type,
          raw_text: item.raw_title ?? null,
          festival_name: item.title,
          start_date: item.start_date ?? null,
          end_date: item.end_date ?? item.start_date ?? null,
          score: 0,
          status: "pending",
          draft_json: draft,
          source_assets: [],
        };
      });
      const { error } = await supabase.from("festival_candidates").insert(rows);
      if (error) throw error;

      setReviewedItems([]);
      setSelectedUrls(new Set());
      if (inputRef.current) inputRef.current.value = "";
      setMessage(`${rows.length}개 항목을 검토 대기 후보로 저장했습니다.`);
      onCreated();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "후보 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-gray-950">티켓페이지 크롤링 검토</h2>
      <p className="mt-1 text-sm text-gray-600">
        discovery JSON을 불러와 기존 축제·검토 후보·티켓 URL과 비교합니다.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          onChange={(event) => void handleFile(event.target.files?.[0])}
          className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white p-3 text-sm"
        />
        <button
          type="button"
          disabled={isLoading || isSaving || selectedUrls.size === 0}
          onClick={() => void handleSave()}
          className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? "저장 중..." : `선택 후보 저장 (${selectedUrls.size})`}
        </button>
      </div>

      {reviewedItems.length > 0 && (
        <div className="mt-4 max-h-[32rem] space-y-2 overflow-y-auto pr-1">
          {reviewedItems.map(({ item, match }) => (
            <label
              key={item.source_url}
              className="flex cursor-pointer gap-3 rounded-xl border border-gray-200 p-4"
            >
              <input
                type="checkbox"
                disabled={match.status === "duplicate"}
                checked={selectedUrls.has(item.source_url)}
                onChange={() => toggleItem(item.source_url)}
                className="mt-1 size-4"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm text-gray-950">{item.title}</strong>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLE[match.status]}`}>
                    {STATUS_LABEL[match.status]}
                  </span>
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  {item.start_date || "날짜 미확인"}
                  {item.end_date ? ` ~ ${item.end_date}` : ""}
                </span>
                <span className="mt-1 block text-xs text-gray-600">{match.reason}</span>
                {match.reference && (
                  <span className="mt-1 block text-xs font-semibold text-amber-700">
                    비교 대상: {match.reference.title}
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      )}

      {isLoading && <p className="mt-3 text-sm text-gray-600">기존 데이터와 비교 중...</p>}
      {message && <p className="mt-3 text-sm font-semibold text-gray-950">{message}</p>}
      {errorMessage && <p className="mt-3 text-sm font-semibold text-red-700">{errorMessage}</p>}
    </section>
  );
}
