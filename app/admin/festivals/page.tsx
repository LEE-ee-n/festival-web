"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";

type Festival = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  location: string | null;
  status: string | null;
};

export default function AdminFestivalsPage() {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          start_date,
          end_date,
          location,
          status
        `)
        .order("start_date", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setFestivals((data ?? []) as Festival[]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "페스티벌 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
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

      const { error } = await supabase
        .from("festivals")
        .delete()
        .eq("id", festival.id);

      if (error) {
        throw error;
      }

      setFestivals((currentFestivals) =>
        currentFestivals.filter(
          (item) => item.id !== festival.id,
        ),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "페스티벌 삭제에 실패했습니다.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin"
          className="mb-6 inline-block text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← 관리자 페이지로 돌아가기
        </Link>

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
              href="/admin/festival-candidates"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              신규 등록 작업함으로 이동
            </Link>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errorMessage}
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
