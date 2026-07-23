"use client";

import { ChangeEvent, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase/client";
import {
  parseArtistUpdateResult,
  type ArtistUpdateResult,
} from "@/lib/supabase/rpcResults";

type ArtistUpdateRow = {
  id: number;
  name: string;
  normalized_name: string;
  aliases: string;
};

type ChangeFlags = {
  name: boolean;
  normalized_name: boolean;
  aliases: boolean;
};

export default function ArtistUpdateImportPage() {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ArtistUpdateRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);

  const [changeFlags, setChangeFlags] = useState<
    Record<number, ChangeFlags>
    >({});

  const [isUpdating, setIsUpdating] = useState(false);
    const [updateResult, setUpdateResult] =
    useState<ArtistUpdateResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    

    if (!file) {
      return;
    }

    try {
      setFileName(file.name);
      setRows([]);
      setErrorMessage(null);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, {
        type: "array",
      });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const data = XLSX.utils.sheet_to_json<
        Record<string, unknown>
      >(worksheet, {
        defval: "",
      });

      const cleanedRows: ArtistUpdateRow[] = data
        .map((row) => ({
          id: Number(row.id),
          name: String(row.name ?? "").trim(),
          normalized_name: String(
            row.normalized_name ?? "",
          ).trim(),
          aliases: String(row.aliases ?? "").trim(),
        }))
        .filter(
          (row) =>
            Number.isInteger(row.id) &&
            row.id > 0 &&
            row.name.length > 0,
        );

      if (cleanedRows.length === 0) {
        throw new Error(
          "업데이트할 아티스트 데이터가 없습니다.",
        );
      }

      const artistIds = cleanedRows.map((row) => row.id);

        const [
        { data: currentArtists, error: artistsError },
        { data: currentAliases, error: aliasesError },
        ] = await Promise.all([
        supabase
            .from("artists")
            .select("id, name, normalized_name")
            .in("id", artistIds),

        supabase
            .from("artist_aliases")
            .select("artist_id, alias_name")
            .in("artist_id", artistIds),
        ]);

        if (artistsError) {
        throw artistsError;
        }

        if (aliasesError) {
        throw aliasesError;
        }

        const flags: Record<number, ChangeFlags> = {};

        cleanedRows.forEach((row) => {
        const currentArtist = currentArtists?.find(
            (artist) => artist.id === row.id,
        );

        const excelAliases = row.aliases
            .split("|")
            .map((alias) => alias.trim())
            .filter((alias) => alias && alias !== "-")
            .sort();

        const dbAliases =
            currentAliases
            ?.filter((alias) => alias.artist_id === row.id)
            .map((alias) => alias.alias_name.trim())
            .filter(Boolean)
            .sort() ?? [];

        flags[row.id] = {
            name: currentArtist?.name !== row.name,
            normalized_name:
            currentArtist?.normalized_name !==
            row.normalized_name,
            aliases:
            JSON.stringify(excelAliases) !==
            JSON.stringify(dbAliases),
        };
        });

        setChangeFlags(flags);
        setRows(cleanedRows);

    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "엑셀 파일을 읽지 못했습니다.",
      );
    }
  }

  async function handleApplyUpdates() {
    if (rows.length === 0) {
        setErrorMessage("업데이트할 데이터가 없습니다.");
        return;
    }

    try {
        setIsUpdating(true);
        setErrorMessage(null);
        setUpdateResult(null);

        const artistIds = rows.map((row) => row.id);

        const [
        { data: currentArtists, error: artistsError },
        { data: currentAliases, error: aliasesError },
        ] = await Promise.all([
        supabase
            .from("artists")
            .select("id, name, normalized_name")
            .in("id", artistIds),

        supabase
            .from("artist_aliases")
            .select("artist_id, alias_name")
            .in("artist_id", artistIds),
        ]);

        if (artistsError) {
        throw artistsError;
        }

        if (aliasesError) {
        throw aliasesError;
        }

        const changedRows = rows.filter((row) => {
        const currentArtist = currentArtists?.find(
            (artist) => artist.id === row.id,
        );

        if (!currentArtist) {
            return true;
        }

        const excelAliases = row.aliases
            .split("|")
            .map((alias) => alias.trim())
            .filter(Boolean)
            .sort();

        const dbAliases =
            currentAliases
            ?.filter(
                (alias) => alias.artist_id === row.id,
            )
            .map((alias) => alias.alias_name.trim())
            .filter(Boolean)
            .sort() ?? [];

        return (
            currentArtist.name !== row.name ||
            currentArtist.normalized_name !==
            row.normalized_name ||
            JSON.stringify(excelAliases) !==
            JSON.stringify(dbAliases)
        );
        });

        if (changedRows.length === 0) {
        setErrorMessage("변경된 아티스트가 없습니다.");
        return;
        }

        const confirmed = window.confirm(
        `${changedRows.length}명의 아티스트 정보를 수정하시겠습니까?`,
        );

        if (!confirmed) {
        return;
        }

        const payload = changedRows.map((row) => ({
        id: row.id,
        name: row.name,
        normalized_name: row.normalized_name,
        aliases: row.aliases
            .split("|")
            .map((alias) => alias.trim())
            .filter((alias) => alias && alias !== "-"),
        }));

        const { data, error } = await supabase.rpc(
        "update_artists_from_excel",
        {
            p_artists: payload,
        },
        );

        if (error) {
        throw error;
        }

        setUpdateResult(parseArtistUpdateResult(data));
    } catch (error) {
        const supabaseError = error as {
        message?: string;
        };

        setErrorMessage(
        supabaseError.message ||
            "아티스트 일괄 수정에 실패했습니다.",
        );
    } finally {
        setIsUpdating(false);
    }
    }

  function resetPage() {
    setFileName("");
    setRows([]);
    setErrorMessage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold text-blue-600">
          관리자
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          아티스트 일괄 수정
        </h1>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <label
            htmlFor="artistUpdateFile"
            className="block text-sm font-semibold text-slate-700"
          >
            엑셀 파일 선택
          </label>

          <input
            ref={fileInputRef}
            id="artistUpdateFile"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="mt-3 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />

          {fileName && (
            <p className="mt-3 text-sm text-slate-600">
              선택한 파일:{" "}
              <strong>{fileName}</strong>
            </p>
          )}

          {errorMessage && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          )}
        
        <div className="mt-5 flex flex-wrap gap-3">
        <button
            type="button"
            onClick={handleApplyUpdates}
            disabled={isUpdating || rows.length === 0}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
            {isUpdating
            ? "변경사항 반영 중..."
            : "변경된 아티스트만 반영"}
        </button>

        <button
            type="button"
            onClick={resetPage}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
        >
            초기화
        </button>
        </div>
        </section>

        {rows.length > 0 && (
          <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-bold text-slate-900">
                엑셀 미리보기
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {rows.length}명
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left">
                      대표 이름
                    </th>
                    <th className="px-4 py-3 text-left">
                      정규화 이름
                    </th>
                    <th className="px-4 py-3 text-left">
                      별칭
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3">
                        {row.id}
                      </td>

                      <td className="px-4 py-3 font-semibold">
                        {row.name}
                        {changeFlags[row.id]?.name && (
                            <span className="ml-2">✅</span>
                        )}
                        </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {row.normalized_name}
                        {changeFlags[row.id]?.normalized_name && (
                            <span className="ml-2">✅</span>
                        )}
                        </td>

                      <td className="px-4 py-3 text-slate-600">
                        {row.aliases || "-"}
                        {changeFlags[row.id]?.aliases && (
                            <span className="ml-2">✅</span>
                        )}
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {updateResult && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
                수정 완료 — 아티스트{" "}
                {updateResult.updated_count}명 / 별칭{" "}
                {updateResult.alias_count}개
            </div>
        )}
      </div>
    </main>
  );
}
