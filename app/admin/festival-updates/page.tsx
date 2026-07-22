"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";

type UpdateDraft = {
  id: number;
  festival_id: number;
  source_url: string;
  announcement_round: string;
  status: "pending" | "applied";
  created_at: string;
  applied_at: string | null;
  festivals: { name: string; start_date: string; end_date: string } | Array<{ name: string; start_date: string; end_date: string }> | null;
};

function festivalOf(value: UpdateDraft["festivals"]) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default function FestivalUpdatesPage() {
  const [status, setStatus] = useState<"pending" | "applied">("pending");
  const [drafts, setDrafts] = useState<UpdateDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setIsLoading(true); setErrorMessage(null);
        const { data, error } = await supabase.from("festival_update_drafts").select(`
          id, festival_id, source_url, announcement_round, status, created_at, applied_at,
          festivals (name, start_date, end_date)
        `).eq("status", status).order("created_at", { ascending: false });
        if (error) throw error;
        if (!cancelled) setDrafts((data ?? []) as UpdateDraft[]);
      } catch (error) {
        if (!cancelled) setErrorMessage(error instanceof Error ? error.message : "수정 작업을 불러오지 못했습니다.");
      } finally { if (!cancelled) setIsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [status]);

  return <main className="min-h-screen bg-white px-4 py-10"><div className="mx-auto max-w-6xl">
    <Link href="/admin" className="text-sm font-semibold text-slate-600 underline">관리자 페이지로 돌아가기</Link>
    <div className="mt-6"><p className="text-sm font-semibold text-slate-500">관리자</p><h1 className="mt-1 text-3xl font-bold text-slate-950">기존 페스티벌 수정</h1><p className="mt-2 text-sm text-slate-500">등록된 페스티벌에 들어온 새 자료를 단계별로 검토해 추가·수정합니다.</p></div>
    <div className="mt-6 flex gap-2"><button type="button" onClick={() => setStatus("pending")} className={`rounded-full px-4 py-2 text-sm font-bold ${status === "pending" ? "bg-slate-950 text-white" : "border"}`}>검토 대기</button><button type="button" onClick={() => setStatus("applied")} className={`rounded-full px-4 py-2 text-sm font-bold ${status === "applied" ? "bg-slate-950 text-white" : "border"}`}>반영 완료</button></div>
    {errorMessage && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{errorMessage}</p>}
    <section className="mt-6 space-y-3">{isLoading ? <p className="text-sm text-slate-500">불러오는 중...</p> : drafts.length === 0 ? <p className="rounded-xl border border-slate-200 p-5 text-sm text-slate-500">{status === "pending" ? "검토할 기존 페스티벌 수정 작업이 없습니다." : "반영 완료된 작업이 없습니다."}</p> : drafts.map((draft) => { const festival = festivalOf(draft.festivals); return <article key={draft.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-slate-950">{festival?.name ?? `페스티벌 #${draft.festival_id}`}</h2><p className="mt-1 text-sm text-slate-500">{festival ? `${festival.start_date} ~ ${festival.end_date}` : ""} · {new Date(draft.created_at).toLocaleString("ko-KR")}</p><a href={draft.source_url} target="_blank" rel="noreferrer" className="mt-2 block break-all text-xs text-blue-600 underline">원본 출처 열기</a></div>{draft.status === "pending" ? <Link href={`/admin/festivals/import-json?festivalId=${draft.festival_id}&updateDraftId=${draft.id}`} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">검토 계속</Link> : <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">반영 완료</span>}</div></article>; })}</section>
  </div></main>;
}
