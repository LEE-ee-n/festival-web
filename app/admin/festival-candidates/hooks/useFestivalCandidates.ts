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
          review_notes, reviewed_by, work_type, announcement_round,
          version_number, parent_candidate_id, created_by, comparison_json
        `)
        .neq("work_type", "update")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const hydratedCandidates = await Promise.all(
        ((data ?? []) as FestivalCandidate[]).map(async (candidate) => ({
          ...candidate,
          source_assets: await Promise.all(
            (candidate.source_assets ?? []).map(async (asset) => {
              if (asset.url || !asset.storage_path) return asset;
              const { data: signed } = await supabase.storage
                .from("festival-candidate-posters")
                .createSignedUrl(asset.storage_path, 3600);
              return { ...asset, url: signed?.signedUrl };
            }),
          ),
        })),
      );
      setCandidates(hydratedCandidates);
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
      const candidate = candidates.find((item) => item.id === candidateId);
      if (!candidate || candidate.status !== "pending") {
        throw new Error("승인 완료된 신규 페스티벌은 수정할 수 없습니다.");
      }

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
        })
        .eq("id", candidateId)
        .eq("status", "pending")
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error("승인 상태가 변경되어 임시저장할 수 없습니다.");
      }

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
          review_notes, reviewed_by, work_type, announcement_round,
          version_number, parent_candidate_id, created_by, comparison_json
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
        "approve_new_festival_candidate",
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
      const storagePaths = (candidates.find((candidate) => candidate.id === candidateId)?.source_assets ?? [])
        .map((asset) => asset.storage_path)
        .filter((path): path is string => Boolean(path));

      const { error } = await supabase
        .from("festival_candidates")
        .delete()
        .eq("id", candidateId);

      if (error) throw error;

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("festival-candidate-posters")
          .remove(storagePaths);
        if (storageError) {
          console.error("삭제된 임시 작업의 포스터 정리에 실패했습니다.", storageError);
        }
      }

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
