"use client";

import { useRef, useState } from "react";

import { parseFestivalDraftJson } from "@/lib/festivals/festivalDraft";
import { supabase } from "@/lib/supabase/client";
import type { FestivalDraftJson } from "@/lib/types";

const MAX_JSON_SIZE = 1024 * 1024;

type Props = {
  onCreated: () => void;
};

export default function FestivalCandidateJsonUploader({ onCreated }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [draft, setDraft] = useState<FestivalDraftJson | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleFileChange(file: File | undefined) {
    setMessage(null);
    setErrorMessage(null);
    setDraft(null);
    setFileName(file?.name ?? "");

    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
      setErrorMessage("JSON 파일만 선택할 수 있습니다.");
      return;
    }
    if (file.size > MAX_JSON_SIZE) {
      setErrorMessage("JSON 파일은 1MB 이하여야 합니다.");
      return;
    }

    try {
      setDraft(parseFestivalDraftJson(await file.text()));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "JSON 파일을 읽지 못했습니다.",
      );
    }
  }

  async function handleSave() {
    if (!draft) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);
      setMessage(null);

      const metadata = draft.candidate;
      const { error } = await supabase.from("festival_candidates").insert({
        title: metadata?.title?.trim() || draft.festival.name,
        source_url:
          metadata?.source_url?.trim()
          || draft.festival.source_url?.trim()
          || null,
        source_type: metadata?.source_type?.trim() || "hermes_json",
        raw_text: metadata?.raw_text?.trim() || null,
        festival_name: draft.festival.name,
        start_date: draft.festival.start_date,
        end_date: draft.festival.end_date,
        location: draft.festival.location?.trim() || null,
        category: draft.festival.category?.trim() || null,
        score: metadata?.score ?? 0,
        status: "pending",
        draft_json: draft,
        source_assets: metadata?.source_assets ?? [],
      });

      if (error) throw error;

      setFileName("");
      setDraft(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage("헤르메스 JSON을 검토 대기 후보로 저장했습니다.");
      onCreated();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "검토 후보 저장에 실패했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-slate-950">
        헤르메스 JSON 가져오기
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        헤르메스가 사진에서 만든 JSON을 검사한 뒤 검토 대기 목록에 저장합니다.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={(event) =>
            void handleFileChange(event.target.files?.[0])
          }
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white p-3 text-sm"
        />
        <button
          type="button"
          disabled={!draft || isSaving}
          onClick={() => void handleSave()}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? "저장 중..." : "검토 대기로 저장"}
        </button>
      </div>

      {draft && (
        <div className="mt-3 rounded-xl border border-blue-200 bg-white p-3 text-sm text-slate-700">
          <strong>{draft.festival.name}</strong>
          <span className="ml-2 text-slate-500">
            {draft.festival.start_date} ~ {draft.festival.end_date}
            {` · 출연진 ${draft.artists.length}명`}
            {` · 티켓 ${draft.tickets?.length ?? 0}건`}
          </span>
          <p className="mt-1 text-xs text-slate-400">{fileName}</p>
        </div>
      )}

      {(errorMessage || message) && (
        <p
          className={`mt-3 rounded-xl p-3 text-sm font-semibold ${
            errorMessage
              ? "bg-red-100 text-red-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {errorMessage || message}
        </p>
      )}
    </section>
  );
}
