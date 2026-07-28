"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import AdminBackLink from "@/components/admin/AdminBackLink";
import { supabase } from "@/lib/supabase/client";
import { deleteFestival } from "@/lib/festivals/deleteFestival";
import { findFestivalThumbnailMatches } from "@/lib/festivals/festivalThumbnailSync";
import { getSupabaseErrorMessage } from "@/lib/supabase/errorMessage";

type Festival = {
  id: number;
  name: string;
  normalized_name: string;
  start_date: string;
  end_date: string;
  location: string | null;
  status: string | null;
  thumbnail_url: string | null;
};

export default function AdminFestivalsPage() {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [thumbnailSyncMessage, setThumbnailSyncMessage] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const [deletingId, setDeletingId] = useState<number | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);

  async function loadFestivals() {
    await Promise.resolve();

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("festivals")
        .select(`
          id,
          name,
          normalized_name,
          start_date,
          end_date,
          location,
          status,
          thumbnail_url
        `)
        .order("start_date", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      const loadedFestivals = data ?? [];
      setFestivals(loadedFestivals);

      try {
        const { data: storageFiles, error: storageError } = await supabase.storage
          .from("festival-thumbnails")
          .list("", {
            limit: 1000,
            sortBy: { column: "name", order: "asc" },
          });

        if (storageError) throw storageError;

        const matches = findFestivalThumbnailMatches(
          loadedFestivals,
          (storageFiles ?? []).map((file) => file.name),
        );
        let connectedCount = 0;
        let failedCount = 0;
        const thumbnailUrls = new Map<number, string>();

        for (const match of matches.matched) {
          const { data: publicUrlData } = supabase.storage
            .from("festival-thumbnails")
            .getPublicUrl(match.fileName);
          const publicUrl = publicUrlData.publicUrl;
          const { error: updateError } = await supabase.rpc(
            "change_festival_thumbnail_with_audit",
            {
              p_festival_id: match.festival.id,
              p_new_url: publicUrl,
              p_note: "대표 이미지 파일명 규칙으로 자동 연결",
            },
          );

          if (updateError) {
            failedCount += 1;
            continue;
          }

          connectedCount += 1;
          thumbnailUrls.set(match.festival.id, publicUrl);
        }

        if (thumbnailUrls.size > 0) {
          setFestivals((current) =>
            current.map((festival) => ({
              ...festival,
              thumbnail_url:
                thumbnailUrls.get(festival.id) ?? festival.thumbnail_url,
            })),
          );
        }

        const messages = [
          connectedCount > 0 ? `대표 이미지 ${connectedCount}개 자동 연결` : "",
          matches.duplicateFileNames.length > 0
            ? `중복 매칭 ${matches.duplicateFileNames.length}개 제외`
            : "",
          failedCount > 0 ? `연결 실패 ${failedCount}개` : "",
        ].filter(Boolean);
        setThumbnailSyncMessage(messages.length > 0 ? messages.join(" · ") : null);
      } catch (syncError) {
        setThumbnailSyncMessage(
          `대표 이미지 자동 연결 실패: ${getSupabaseErrorMessage(
            syncError,
            "Storage 파일을 확인하지 못했습니다.",
          )}`,
        );
      }
    } catch (error) {
      setErrorMessage(getSupabaseErrorMessage(
        error,
        "페스티벌 목록을 불러오지 못했습니다.",
      ));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    queueMicrotask(() => {
      void loadFestivals();
    });
  }, []);

  async function handleDeleteFestival(festival: Festival) {
    const confirmed = window.confirm(
      `${festival.name}을 삭제하시겠습니까?\n\n라인업과 티켓 일정도 함께 삭제됩니다.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(festival.id);
      setErrorMessage(null);

      await deleteFestival(festival.id);

      setFestivals((currentFestivals) =>
        currentFestivals.filter(
          (item) => item.id !== festival.id,
        ),
      );
    } catch (error) {
      setErrorMessage(getSupabaseErrorMessage(
        error,
        "페스티벌 삭제에 실패했습니다.",
      ));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <AdminBackLink />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              관리자
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              페스티벌 관리
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/festival-updates"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              기존 페스티벌 수정
            </Link>
            <Link
              href="/admin/festival-candidates"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              신규 페스티벌 등록
            </Link>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        {thumbnailSyncMessage && (
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-700">
            {thumbnailSyncMessage}
          </div>
        )}

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <p className="p-8 text-sm text-slate-500">
              불러오는 중...
            </p>
          ) : festivals.length === 0 ? (
            <p className="p-8 text-sm text-slate-500">
              등록된 페스티벌이 없습니다.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-white">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold text-slate-700">
                      페스티벌명
                    </th>

                    <th className="px-5 py-4 text-left font-semibold text-slate-700">
                      기간
                    </th>

                    <th className="px-5 py-4 text-left font-semibold text-slate-700">
                      장소
                    </th>

                    <th className="px-5 py-4 text-left font-semibold text-slate-700">
                      상태
                    </th>

                    <th className="px-5 py-4 text-right font-semibold text-slate-700">
                      관리
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {festivals.map((festival) => (
                    <tr key={festival.id}>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {festival.name}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {festival.start_date ===
                        festival.end_date
                          ? festival.start_date
                          : `${festival.start_date} ~ ${festival.end_date}`}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {festival.location || "-"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {festival.status || "-"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/festivals/${festival.id}/lineup`}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                          >
                            관리
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteFestival(festival)
                            }
                            disabled={
                              deletingId === festival.id
                            }
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {deletingId === festival.id
                              ? "삭제 중..."
                              : "삭제"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
