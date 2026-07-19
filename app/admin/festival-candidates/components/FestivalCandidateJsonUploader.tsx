"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { parseFestivalDraftJson } from "@/lib/festivals/festivalDraft";
import {
  getFestivalDraftTicketKey,
  mergeFestivalDrafts,
  type DraftMergeDiff,
  type DraftMergeSection,
  type DraftMergeStatus,
  type FestivalDraftMergeResult,
} from "@/lib/festivals/festivalDraftMerge";
import { supabase } from "@/lib/supabase/client";
import type { FestivalDraftJson } from "@/lib/types";

const MAX_JSON_SIZE = 1024 * 1024;

type Props = {
  onCreated: () => void;
};

type PendingCandidate = {
  id: number;
  title: string;
  source_url: string | null;
  festival_name: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  category: string | null;
  draft_json: FestivalDraftJson | null;
  review_notes: string | null;
};

type MergePreview = {
  candidate: PendingCandidate;
  result: FestivalDraftMergeResult;
};

type RegisteredFestival = {
  id: number;
  name: string;
  normalized_name: string;
  start_date: string;
  end_date: string;
};

type DiffChoice = "current" | "incoming";

const STATUS_META: Record<
  DraftMergeStatus,
  { label: string; icon: string; className: string }
> = {
  same: {
    label: "동일",
    icon: "✅",
    className: "bg-emerald-50 text-emerald-700",
  },
  expression: {
    label: "표현 차이",
    icon: "≈",
    className: "bg-amber-50 text-amber-700",
  },
  add: {
    label: "추가",
    icon: "➕",
    className: "bg-slate-100 text-slate-700",
  },
  change: {
    label: "변경 확인",
    icon: "✏️",
    className: "bg-red-50 text-red-700",
  },
};

const SECTION_META: Record<DraftMergeSection, string> = {
  basic: "기본정보",
  lineup: "라인업",
  ticket: "티켓",
};

function createCandidateDraft(candidate: PendingCandidate): FestivalDraftJson {
  return {
    festival: {
      name: candidate.festival_name ?? "",
      normalized_name: "",
      start_date: candidate.start_date ?? "",
      end_date: candidate.end_date ?? "",
      location: candidate.location ?? undefined,
      category: candidate.category ?? undefined,
      source_url: candidate.source_url ?? undefined,
    },
    artists: [],
    tickets: [],
  };
}

function hasExactFestivalIdentity(
  current: FestivalDraftJson,
  incoming: FestivalDraftJson,
) {
  return Boolean(
    current.festival.normalized_name
    && incoming.festival.normalized_name
    && current.festival.normalized_name === incoming.festival.normalized_name
    && current.festival.start_date === incoming.festival.start_date
    && current.festival.end_date === incoming.festival.end_date
  );
}

function hasSameFestivalDates(
  current: FestivalDraftJson,
  incoming: FestivalDraftJson,
) {
  return Boolean(
    current.festival.start_date
    && current.festival.end_date
    && current.festival.start_date === incoming.festival.start_date
    && current.festival.end_date === incoming.festival.end_date
  );
}

function diffChoiceKey(diff: DraftMergeDiff) {
  return `${diff.section}:${diff.key}`;
}

function unresolvedReviewNotes(
  diffs: DraftMergeDiff[],
  choices: Record<string, DiffChoice>,
) {
  const unresolved = diffs.filter(
    (diff) =>
      (diff.status === "change" || diff.status === "expression")
      && choices[diffChoiceKey(diff)] !== "incoming",
  );

  if (unresolved.length === 0) return "";

  return [
    "JSON 병합 후 확인 필요",
    ...unresolved.map(
      (diff) =>
        `- ${SECTION_META[diff.section]} / ${diff.label}: 현재 [${diff.current || "-"}] · 신규 [${diff.incoming || "-"}]`,
    ),
  ].join("\n");
}

export default function FestivalCandidateJsonUploader({ onCreated }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [draft, setDraft] = useState<FestivalDraftJson | null>(null);
  const [mergePreview, setMergePreview] = useState<MergePreview | null>(null);
  const [sameDateCandidates, setSameDateCandidates] = useState<PendingCandidate[]>([]);
  const [sameDateFestivals, setSameDateFestivals] = useState<RegisteredFestival[]>([]);
  const [registeredMatch, setRegisteredMatch] = useState<RegisteredFestival | null>(null);
  const [createAsNew, setCreateAsNew] = useState(false);
  const [diffChoices, setDiffChoices] = useState<Record<string, DiffChoice>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeDiffs = useMemo(
    () => mergePreview?.result.diffs.filter(
      (diff) => diff.section !== "basic" || Boolean(diff.incoming),
    ) ?? [],
    [mergePreview],
  );

  async function findMatchingCandidates(incoming: FestivalDraftJson) {
    const [candidateResult, festivalResult] = await Promise.all([
      supabase
        .from("festival_candidates")
        .select(`
          id, title, source_url, festival_name, start_date, end_date,
          location, category, draft_json, review_notes
        `)
        .eq("status", "pending"),
      supabase
        .from("festivals")
        .select("id, name, normalized_name, start_date, end_date")
        .eq("start_date", incoming.festival.start_date)
        .eq("end_date", incoming.festival.end_date),
    ]);

    if (candidateResult.error) throw candidateResult.error;
    if (festivalResult.error) throw festivalResult.error;

    const candidates = (candidateResult.data ?? []) as PendingCandidate[];
    const registeredFestivals = (festivalResult.data ?? []) as RegisteredFestival[];
    const registeredMatches = registeredFestivals.filter(
      (festival) =>
        festival.normalized_name === incoming.festival.normalized_name,
    );

    if (registeredMatches.length > 1) {
      throw new Error(
        "같은 normalized_name과 날짜를 가진 정식 축제가 여러 개입니다.",
      );
    }

    const exactMatches = candidates.filter((candidate) => {
      const current = candidate.draft_json ?? createCandidateDraft(candidate);
      return hasExactFestivalIdentity(current, incoming);
    });

    if (exactMatches.length > 1) {
      throw new Error(
        "같은 normalized_name과 날짜를 가진 검토 대기 작업이 여러 개입니다.",
      );
    }

    const registeredExactMatch = registeredMatches[0] ?? null;
    const exactMatch = registeredExactMatch ? null : exactMatches[0] ?? null;
    const dateCandidates = exactMatch
      ? []
      : candidates.filter((candidate) => {
        const current = candidate.draft_json ?? createCandidateDraft(candidate);
        return hasSameFestivalDates(current, incoming);
      });

    const dateFestivals = registeredExactMatch || exactMatch
      ? []
      : registeredFestivals;

    return {
      exactMatch,
      dateCandidates,
      registeredExactMatch,
      dateFestivals,
    };
  }

  async function handleFileChange(file: File | undefined) {
    setMessage(null);
    setErrorMessage(null);
    setDraft(null);
    setMergePreview(null);
    setSameDateCandidates([]);
    setSameDateFestivals([]);
    setRegisteredMatch(null);
    setCreateAsNew(false);
    setDiffChoices({});
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
      setIsChecking(true);
      const incoming = parseFestivalDraftJson(await file.text());
      const {
        exactMatch,
        dateCandidates,
        registeredExactMatch,
        dateFestivals,
      } = await findMatchingCandidates(incoming);

      setDraft(incoming);
      setSameDateCandidates(dateCandidates);
      setSameDateFestivals(dateFestivals);
      if (registeredExactMatch) {
        setRegisteredMatch(registeredExactMatch);
        setMessage("이미 정식 등록된 축제와 정확히 일치합니다. 신규 작업을 만들지 않습니다.");
      } else if (exactMatch) {
        const current = exactMatch.draft_json ?? createCandidateDraft(exactMatch);
        setMergePreview({
          candidate: exactMatch,
          result: mergeFestivalDrafts(current, incoming),
        });
        setMessage(`${exactMatch.title} 검토 대기 작업과 정확히 매칭했습니다.`);
      } else if (dateCandidates.length > 0 || dateFestivals.length > 0) {
        setMessage(
          "normalized_name이 정확히 일치하지 않습니다. 같은 날짜의 검토 작업과 정식 축제를 확인하세요.",
        );
      } else {
        setCreateAsNew(true);
        setMessage("일치하는 검토 대기 작업이나 같은 날짜 후보가 없어 신규 작업으로 저장합니다.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "JSON 파일을 읽거나 비교하지 못했습니다.",
      );
    } finally {
      setIsChecking(false);
    }
  }

  function updateNormalizedName(value: string) {
    if (!draft) return;

    const nextDraft = structuredClone(draft);
    nextDraft.festival.normalized_name = value
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    setDraft(nextDraft);

    if (mergePreview) {
      const current = mergePreview.candidate.draft_json
        ?? createCandidateDraft(mergePreview.candidate);
      setMergePreview({
        candidate: mergePreview.candidate,
        result: mergeFestivalDrafts(current, nextDraft),
      });
    }
  }

  function selectMergeCandidate(candidate: PendingCandidate) {
    if (!draft) return;

    const current = candidate.draft_json ?? createCandidateDraft(candidate);
    setMergePreview({
      candidate,
      result: mergeFestivalDrafts(current, draft),
    });
    setCreateAsNew(false);
    setRegisteredMatch(null);
    setDiffChoices({});
    setMessage(`${candidate.title} 작업에 병합하도록 선택했습니다.`);
  }

  function selectNewCandidate() {
    setMergePreview(null);
    setRegisteredMatch(null);
    setCreateAsNew(true);
    setDiffChoices({});
    setMessage("기존 작업과 병합하지 않고 별도 신규 작업으로 저장합니다.");
  }

  function selectRegisteredFestival(festival: RegisteredFestival) {
    setMergePreview(null);
    setRegisteredMatch(festival);
    setCreateAsNew(false);
    setMessage(`${festival.name} 정식 축제와 동일한 자료로 확인했습니다. 신규 작업을 만들지 않습니다.`);
  }

  async function handleSave() {
    if (!draft) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);
      setMessage(null);

      if (mergePreview) {
        const merged = structuredClone(mergePreview.result.mergedDraft);

        mergePreview.result.diffs.forEach((diff) => {
          if (diffChoices[diffChoiceKey(diff)] !== "incoming") return;

          if (diff.section === "basic") {
            (merged.festival as Record<string, unknown>)[diff.key] = diff.incoming;
            return;
          }

          if (diff.section === "lineup") {
            const incomingArtist = draft.artists.find(
              (artist) => artist.normalized_name === diff.key,
            );
            const mergedArtist = merged.artists.find(
              (artist) => artist.normalized_name === diff.key,
            );
            if (!incomingArtist || !mergedArtist) return;

            Object.entries(incomingArtist).forEach(([key, value]) => {
              if (key === "aliases") {
                mergedArtist.aliases = [...new Set([
                  ...mergedArtist.aliases,
                  ...incomingArtist.aliases,
                ])];
              } else if (value !== undefined && value !== null && value !== "") {
                (mergedArtist as unknown as Record<string, unknown>)[key] = value;
              }
            });
            return;
          }

          const incomingTicket = (draft.tickets ?? []).find(
            (ticket) => getFestivalDraftTicketKey(ticket) === diff.key,
          );
          const mergedTicket = (merged.tickets ?? []).find(
            (ticket) => getFestivalDraftTicketKey(ticket) === diff.key,
          );
          if (!incomingTicket || !mergedTicket) return;

          Object.entries(incomingTicket).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              (mergedTicket as unknown as Record<string, unknown>)[key] = value;
            }
          });
        });

        const newNotes = unresolvedReviewNotes(
          mergePreview.result.diffs,
          diffChoices,
        );
        const previousNotes = mergePreview.candidate.review_notes?.trim() ?? "";
        const reviewNotes = [previousNotes, newNotes].filter(Boolean).join("\n\n");

        const { error } = await supabase
          .from("festival_candidates")
          .update({
            draft_json: merged,
            festival_name: merged.festival.name,
            start_date: merged.festival.start_date,
            end_date: merged.festival.end_date,
            location: merged.festival.location?.trim() || null,
            category: merged.festival.category?.trim() || null,
            review_notes: reviewNotes || null,
          })
          .eq("id", mergePreview.candidate.id);

        if (error) throw error;

        setMessage("안전한 추가사항을 기존 검토 대기 작업에 반영했습니다.");
      } else {
        const metadata = draft.candidate;
        const { error } = await supabase.from("festival_candidates").insert({
          title: metadata?.title?.trim() || draft.festival.name,
          source_url:
            metadata?.source_url?.trim()
            || draft.festival.source_url?.trim()
            || null,
          source_type: metadata?.source_type?.trim() || "image_json",
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
        setMessage("축제 JSON을 신규 검토 대기 작업으로 저장했습니다.");
      }

      setFileName("");
      setDraft(null);
      setMergePreview(null);
      setSameDateCandidates([]);
      setSameDateFestivals([]);
      setRegisteredMatch(null);
      setCreateAsNew(false);
      setDiffChoices({});
      if (fileInputRef.current) fileInputRef.current.value = "";
      onCreated();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "검토 대기 작업 저장에 실패했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function sectionDiffs(section: DraftMergeSection) {
    return activeDiffs.filter((diff) => diff.section === section);
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-slate-950">축제 JSON 가져오기</h2>
      <p className="mt-1 text-sm text-slate-600">
        검토 대기 작업과 자동 매칭하고 기본정보·라인업·티켓의 차이를 비교합니다.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={(event) => void handleFileChange(event.target.files?.[0])}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white p-3 text-sm"
        />
        <button
          type="button"
          disabled={
            !draft
            || !draft.festival.normalized_name
            || isSaving
            || isChecking
            || Boolean(registeredMatch)
            || (!mergePreview && !createAsNew)
          }
          onClick={() => void handleSave()}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving
            ? "반영 중..."
            : mergePreview
              ? "안전한 변경 모두 반영"
              : "신규 검토 대기로 저장"}
        </button>
      </div>

      {isChecking && (
        <p className="mt-3 text-sm text-slate-500">검토 대기 작업과 비교 중...</p>
      )}

      {draft && (
        <div className="mt-3 rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-700">
          <div>
            <strong>{draft.festival.name}</strong>
            <span className="ml-2 text-slate-500">
              {draft.festival.start_date} ~ {draft.festival.end_date}
              {` · 출연진 ${draft.artists.length}명`}
              {` · 티켓 ${draft.tickets?.length ?? 0}건`}
            </span>
          </div>
          <label className="mt-3 block font-semibold text-slate-800">
            normalized_name 확인 (정확한 매칭 기준)
            <input
              value={draft.festival.normalized_name}
              onChange={(event) => updateNormalizedName(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-mono font-normal text-slate-900"
              placeholder="예: soundplanet"
            />
          </label>
          <p className="mt-1 text-xs text-slate-400">{fileName}</p>
        </div>
      )}

      {registeredMatch && (
        <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-4">
          <p className="font-bold text-red-900">이미 정식 등록된 축제입니다.</p>
          <p className="mt-1 text-sm text-red-800">
            {registeredMatch.name} · {registeredMatch.start_date} ~ {registeredMatch.end_date}
            {` · normalized_name: ${registeredMatch.normalized_name}`}
          </p>
          <Link
            href={`/admin/festivals/${registeredMatch.id}/lineup`}
            className="mt-3 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white"
          >
            기존 축제 관리로 이동
          </Link>
        </div>
      )}

      {draft
        && (sameDateCandidates.length > 0 || sameDateFestivals.length > 0)
        && !mergePreview
        && !registeredMatch
        && (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <p className="font-bold text-slate-900">같은 날짜의 기존 후보</p>
          <p className="mt-1 text-sm text-slate-600">
            같은 축제가 맞으면 병합을 선택하세요. 날짜만 같다는 이유로 자동 병합하지 않습니다.
          </p>
          <div className="mt-3 space-y-2">
            {sameDateFestivals.map((festival) => (
              <div
                key={`festival-${festival.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-white p-3"
              >
                <div>
                  <p className="font-bold text-slate-900">{festival.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    정식 등록됨 · normalized_name: {festival.normalized_name}
                    {` · ${festival.start_date} ~ ${festival.end_date}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => selectRegisteredFestival(festival)}
                  className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white"
                >
                  이 정식 축제와 동일
                </button>
              </div>
            ))}
            {sameDateCandidates.map((candidate) => {
              const candidateDraft = candidate.draft_json
                ?? createCandidateDraft(candidate);
              return (
                <div
                  key={candidate.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white p-3"
                >
                  <div>
                    <p className="font-bold text-slate-900">{candidate.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      normalized_name: {candidateDraft.festival.normalized_name || "미입력"}
                      {` · ${candidateDraft.festival.start_date} ~ ${candidateDraft.festival.end_date}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectMergeCandidate(candidate)}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                  >
                    이 작업에 병합
                  </button>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={selectNewCandidate}
            className="mt-3 rounded-lg border border-slate-400 bg-white px-4 py-2 text-sm font-bold text-slate-800"
          >
            별도 신규 작업으로 생성
          </button>
        </div>
      )}

      {mergePreview && (
        <div className="mt-4 rounded-2xl border border-slate-300 p-4">
          <p className="font-bold text-slate-900">
            매칭된 작업: {mergePreview.candidate.title}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(Object.keys(SECTION_META) as DraftMergeSection[]).map((section) => {
              const diffs = sectionDiffs(section);
              return (
                <div key={section} className="rounded-xl border border-slate-200 p-3">
                  <p className="font-bold text-slate-800">{SECTION_META[section]}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(Object.keys(STATUS_META) as DraftMergeStatus[]).map((status) => {
                      const count = diffs.filter((diff) => diff.status === status).length;
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

          {activeDiffs.some((diff) => diff.status !== "add") && (
            <details className="mt-4 rounded-xl border border-slate-200 p-3">
              <summary className="cursor-pointer text-sm font-bold text-slate-700">
                동일·변경 확인 항목 보기
              </summary>
              <div className="mt-3 space-y-3">
                {activeDiffs
                  .filter((diff) => diff.status !== "add")
                  .map((diff) => {
                    const meta = STATUS_META[diff.status];
                    const choice = diffChoices[diffChoiceKey(diff)] ?? "current";
                    const needsChoice = diff.status === "change"
                      || diff.status === "expression";
                    return (
                      <div key={`${diff.section}-${diff.key}`} className="rounded-lg bg-slate-50 p-3 text-sm">
                        <p className="font-bold text-slate-800">
                          {meta.icon} {SECTION_META[diff.section]} · {diff.label}
                        </p>
                        <p className="mt-1 text-slate-600">
                          현재 DB 값: {diff.current || "-"}
                        </p>
                        <p className="mt-1 text-slate-600">
                          가져온 JSON 값: {diff.incoming || "-"}
                        </p>
                        {needsChoice && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setDiffChoices((current) => ({
                                ...current,
                                [diffChoiceKey(diff)]: "current",
                              }))}
                              className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                                choice === "current"
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-slate-300 bg-white text-slate-700"
                              }`}
                            >
                              현재 값 유지
                            </button>
                            <button
                              type="button"
                              onClick={() => setDiffChoices((current) => ({
                                ...current,
                                [diffChoiceKey(diff)]: "incoming",
                              }))}
                              className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                                choice === "incoming"
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-slate-300 bg-white text-slate-700"
                              }`}
                            >
                              JSON 값으로 변경
                            </button>
                            <span className="self-center text-xs font-semibold text-slate-600">
                              선택 결과: {choice === "incoming"
                                ? "JSON 값으로 변경"
                                : "현재 값 유지"}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </details>
          )}
        </div>
      )}

      {errorMessage && (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      )}
      {message && <p className="mt-3 text-sm font-semibold text-slate-800">{message}</p>}
    </section>
  );
}
