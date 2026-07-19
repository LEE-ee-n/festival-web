"use client";

import { useMemo, useState } from "react";

import CandidateLineupTab from "@/app/admin/festival-candidates/components/CandidateLineupTab";
import { useFestivalCandidateDraft } from "@/app/admin/festival-candidates/hooks/useFestivalCandidateDraft";
import { matchFestivalDraftArtists } from "@/lib/artists/matchFestivalDraftArtists";
import { parseFestivalDraftJson } from "@/lib/festivals/festivalDraft";
import { supabase } from "@/lib/supabase/client";
import type { FestivalArtist, FestivalDraftJson } from "@/lib/types";

const MAX_JSON_SIZE = 1024 * 1024;

type Props = {
  festivalId: string;
  festivalName: string;
  normalizedName: string;
  startDate: string;
  endDate: string;
  existingRows: FestivalArtist[];
};

function lineupKey(artistId: number, date: string | null | undefined) {
  return `${artistId}:${date || ""}`;
}

export default function LineupJsonImportSection({
  festivalId,
  festivalName,
  normalizedName,
  startDate,
  endDate,
  existingRows,
}: Props) {
  const draftEditor = useFestivalCandidateDraft();
  const { draft, initializeDraft } = draftEditor;
  const [fileName, setFileName] = useState("");
  const [isMatching, setIsMatching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const matchedDuplicateCount = useMemo(() => {
    if (!draft) return 0;
    const existingKeys = new Set(
      existingRows.map((row) => lineupKey(row.artist_id, row.performance_date)),
    );
    return draft.artists.filter(
      (artist) => typeof artist.matched_artist_id === "number"
        && existingKeys.has(
          lineupKey(artist.matched_artist_id, artist.performance_date),
        ),
    ).length;
  }, [draft, existingRows]);

  async function handleFile(file?: File) {
    if (!file) return;
    setErrorMessage(null);

    if (file.size > MAX_JSON_SIZE) {
      setErrorMessage("JSON 파일은 1MB 이하만 업로드할 수 있습니다.");
      return;
    }

    try {
      setIsMatching(true);
      const parsed = parseFestivalDraftJson(await file.text());

      if (
        parsed.festival.normalized_name !== normalizedName
        || parsed.festival.start_date !== startDate
        || parsed.festival.end_date !== endDate
      ) {
        throw new Error(
          `현재 축제(${festivalName}, ${startDate}~${endDate})와 JSON의 축제 정보가 일치하지 않습니다.`,
        );
      }

      if (parsed.artists.length === 0) {
        throw new Error("JSON에 추가할 아티스트가 없습니다.");
      }

      initializeDraft(await matchFestivalDraftArtists(parsed));
      setFileName(file.name);
    } catch (error) {
      setFileName("");
      draftEditor.clearDraft();
      setErrorMessage(
        error instanceof Error ? error.message : "JSON을 읽지 못했습니다.",
      );
    } finally {
      setIsMatching(false);
    }
  }

  async function matchAll() {
    if (!draft) return;
    try {
      setIsMatching(true);
      setErrorMessage(null);
      initializeDraft(await matchFestivalDraftArtists(draft));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "아티스트 확인에 실패했습니다.",
      );
    } finally {
      setIsMatching(false);
    }
  }

  async function resolveArtistId(
    artist: FestivalDraftJson["artists"][number],
  ) {
    if (artist.match_status === "matched" && artist.matched_artist_id) {
      return artist.matched_artist_id;
    }

    if (artist.match_status !== "new") {
      throw new Error(`${artist.display_name || artist.input_name}의 매칭을 확인하세요.`);
    }

    const { data: existing, error: findError } = await supabase
      .from("artists")
      .select("id, name, normalized_name")
      .eq("normalized_name", artist.normalized_name)
      .maybeSingle();
    if (findError) throw findError;
    if (existing) return existing.id;

    const { data: created, error: createError } = await supabase
      .from("artists")
      .insert({
        name: (artist.display_name || artist.input_name).trim(),
        normalized_name: artist.normalized_name.trim(),
      })
      .select("id, name, normalized_name")
      .single();
    if (createError) throw createError;

    if (artist.aliases.length > 0) {
      const { error: aliasError } = await supabase.rpc("update_artist_admin", {
        p_artist_id: created.id,
        p_name: created.name,
        p_normalized_name: created.normalized_name,
        p_aliases: artist.aliases,
      });
      if (aliasError) throw aliasError;
    }

    return created.id;
  }

  async function importLineup() {
    if (!draft) return;

    const unresolved = draft.artists.find(
      (artist) => artist.match_status !== "matched" && artist.match_status !== "new",
    );
    if (unresolved) {
      setErrorMessage(`${unresolved.display_name || unresolved.input_name}의 매칭을 확인하세요.`);
      return;
    }

    if (!window.confirm(
      `${draft.artists.length}명의 라인업을 확인하고 중복을 제외해 추가하시겠습니까?`,
    )) return;

    try {
      setIsImporting(true);
      setErrorMessage(null);

      const resolved = [] as Array<{
        artistId: number;
        artist: FestivalDraftJson["artists"][number];
      }>;
      for (const artist of draft.artists) {
        resolved.push({ artistId: await resolveArtistId(artist), artist });
      }

      const { data: currentRows, error: currentError } = await supabase
        .from("festival_artists")
        .select("artist_id, performance_date")
        .eq("festival_id", Number(festivalId));
      if (currentError) throw currentError;

      const existingKeys = new Set(
        (currentRows ?? []).map((row) =>
          lineupKey(row.artist_id, row.performance_date),
        ),
      );
      const rows = resolved
        .filter(({ artistId, artist }) =>
          !existingKeys.has(lineupKey(artistId, artist.performance_date)),
        )
        .map(({ artistId, artist }) => ({
          festival_id: Number(festivalId),
          artist_id: artistId,
          performance_date: artist.performance_date || null,
          performance_time: artist.performance_time || null,
          performance_end_time: artist.performance_end_time || null,
          stage_name: artist.stage_name?.trim() || null,
          status: artist.status || "confirmed",
        }));

      if (rows.length > 0) {
        const { error: insertError } = await supabase
          .from("festival_artists")
          .insert(rows);
        if (insertError) throw insertError;
      }

      window.alert(
        `라인업 ${rows.length}명 추가, ${resolved.length - rows.length}명 중복 제외했습니다.`,
      );
      window.location.reload();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "라인업 일괄 추가에 실패했습니다.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="mt-8 rounded-3xl border border-blue-200 bg-blue-50/40 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">라인업 JSON 일괄 추가</h2>
      <p className="mt-1 text-sm text-slate-600">
        현재 축제와 이름·기간이 같은 JSON만 허용합니다. 기존 축제 정보와 티켓은 변경하지 않습니다.
      </p>

      <input
        type="file"
        accept="application/json,.json"
        onChange={(event) => void handleFile(event.target.files?.[0])}
        className="mt-4 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
      />

      {fileName && draft && (
        <div className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-700">
          <strong>{fileName}</strong> · 출연진 {draft.artists.length}명
          {matchedDuplicateCount > 0 && ` · 확인된 중복 ${matchedDuplicateCount}명`}
        </div>
      )}
      {errorMessage && (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      )}

      {draft && (
        <>
          <CandidateLineupTab
            artists={draft.artists}
            onAdd={draftEditor.addArtist}
            onMatchAll={() => void matchAll()}
            isMatching={isMatching}
            onChange={draftEditor.updateArtist}
            onDelete={draftEditor.deleteArtist}
          />
          <button
            type="button"
            disabled={isImporting || isMatching}
            onClick={() => void importLineup()}
            className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {isImporting ? "추가 중..." : "확인한 라인업 일괄 추가"}
          </button>
        </>
      )}
    </section>
  );
}
