"use client";

import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";
import type {
  FestivalCandidate,
  FestivalCandidateStatus,
  FestivalDraftJson,
} from "@/lib/types";

export type CandidateStatusFilter = FestivalCandidateStatus | "all";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (
    error
    && typeof error === "object"
    && "message" in error
    && typeof error.message === "string"
  ) {
    return error.message;
  }
  return fallback;
}

export function useFestivalCandidates(
  statusFilter: CandidateStatusFilter,
) {
  const [candidates, setCandidates] = useState<FestivalCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCandidates = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      let query = supabase
        .from("festival_candidates")
        .select(`
          id, title, source_url, source_type, raw_text,
          festival_name, start_date, end_date, location, category,
          score, status, reject_reason, reviewed_at, created_at,
          updated_at, festival_id, draft_json, source_assets,
          review_notes, reviewed_by
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setCandidates((data ?? []) as FestivalCandidate[]);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "수집 후보를 불러오지 못했습니다."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    queueMicrotask(() => void loadCandidates());
  }, [loadCandidates]);

  async function saveDraft(
    candidateId: number,
    draft: FestivalDraftJson,
    reviewNotes: string,
  ) {
    try {
      setIsMutating(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("festival_candidates")
        .update({
          draft_json: draft,
          festival_name: draft.festival.name,
          start_date: draft.festival.start_date,
          end_date: draft.festival.end_date,
          location: draft.festival.location || null,
          category: draft.festival.category || null,
          review_notes: reviewNotes.trim() || null,
          status: "pending",
          reject_reason: null,
          reviewed_at: null,
          reviewed_by: null,
        })
        .eq("id", candidateId)
        .select()
        .single();

      if (error) throw error;

      if (statusFilter === "all" || statusFilter === "pending") {
        setCandidates((current) =>
          current.map((candidate) =>
            candidate.id === candidateId
              ? (data as FestivalCandidate)
              : candidate,
          ),
        );
      } else {
        setCandidates((current) =>
          current.filter((candidate) => candidate.id !== candidateId),
        );
      }

      return data as FestivalCandidate;
    } catch (error) {
      const message = getErrorMessage(error, "초안 저장에 실패했습니다.");
      setErrorMessage(message);
      throw new Error(message);
    } finally {
      setIsMutating(false);
    }
  }

  async function createManualCandidate() {
    const draft: FestivalDraftJson = {
      candidate: {
        title: "직접 작성 - 새 페스티벌",
        source_type: "manual",
      },
      festival: {
        name: "",
        normalized_name: "",
        start_date: "",
        end_date: "",
        status: "scheduled",
      },
      artists: [],
      tickets: [],
    };

    try {
      setIsMutating(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("festival_candidates")
        .insert({
          title: "직접 작성 - 새 페스티벌",
          source_url: `manual://${crypto.randomUUID()}`,
          source_type: "manual",
          score: 0,
          status: "pending",
          draft_json: draft,
          source_assets: [],
        })
        .select(`
          id, title, source_url, source_type, raw_text,
          festival_name, start_date, end_date, location, category,
          score, status, reject_reason, reviewed_at, created_at,
          updated_at, festival_id, draft_json, source_assets,
          review_notes, reviewed_by
        `)
        .single();

      if (error) throw error;

      const candidate = data as FestivalCandidate;
      setCandidates((current) => [candidate, ...current]);
      return candidate;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "직접 작성 작업을 만들지 못했습니다.",
      );
      setErrorMessage(message);
      throw new Error(message);
    } finally {
      setIsMutating(false);
    }
  }

  async function approveAndImportCandidate(
    candidateId: number,
    draft: FestivalDraftJson,
    reviewNotes: string,
  ) {
    try {
      setIsMutating(true);
      setErrorMessage(null);

      const { data, error } = await supabase.rpc(
        "approve_festival_candidate",
        {
          p_candidate_id: candidateId,
          p_draft: draft,
          p_review_notes: reviewNotes.trim() || null,
        },
      );

      if (error) throw error;

      await loadCandidates();
      return data as { festival_id: number; import_result: unknown };
    } catch (error) {
      const message = getErrorMessage(
        error,
        "승인 및 정식 등록에 실패했습니다.",
      );
      setErrorMessage(message);
      throw new Error(message);
    } finally {
      setIsMutating(false);
    }
  }

  async function deleteCandidate(candidateId: number) {
    try {
      setIsMutating(true);
      setErrorMessage(null);

      const { error } = await supabase
        .from("festival_candidates")
        .delete()
        .eq("id", candidateId);

      if (error) throw error;

      setCandidates((current) =>
        current.filter((candidate) => candidate.id !== candidateId),
      );
    } catch (error) {
      const message = getErrorMessage(
        error,
        "수집 후보 삭제에 실패했습니다.",
      );
      setErrorMessage(message);
      throw new Error(message);
    } finally {
      setIsMutating(false);
    }
  }

  return {
    candidates,
    isLoading,
    isMutating,
    errorMessage,
    loadCandidates,
    createManualCandidate,
    saveDraft,
    approveAndImportCandidate,
    deleteCandidate,
  };
}
