"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import AdminBackLink from "@/components/admin/AdminBackLink";
import AdminNotice from "@/components/admin/AdminNotice";
import FestivalColorSelector from "@/components/admin/FestivalColorSelector";
import { supabase } from "@/lib/supabase/client";
import { deleteFestival } from "@/lib/festivals/deleteFestival";
import { updateFestivalCalendarColor } from "@/lib/festivals/updateFestivalCalendarColor";
import { isFestivalCalendarColor } from "@/lib/festivalColor";
import { getSupabaseErrorMessage } from "@/lib/supabase/errorMessage";
import type { FestivalCalendarColor } from "@/lib/types";

type Festival = {
  id: number;
  name: string;
  normalized_name: string;
  start_date: string;
  end_date: string;
  location: string | null;
  status: string | null;
  thumbnail_url: string | null;
  calendar_color: FestivalCalendarColor | null;
};

export default function AdminFestivalsPage() {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [deletingId, setDeletingId] = useState<number | null>(
    null,
  );
  const [savingColorId, setSavingColorId] = useState<number | null>(
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
          thumbnail_url,
          calendar_color
        `)
        .order("start_date", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      const loadedFestivals: Festival[] = (data ?? []).map(
        (festival) => ({
          ...festival,
          calendar_color: isFestivalCalendarColor(festival.calendar_color)
            ? festival.calendar_color
            : null,
        }),
      );
      setFestivals(loadedFestivals);
    } catch (error) {
      setErrorMessage(getSupabaseErrorMessage(
        error,
        "페스티벌 목록을 불러오지 못했습니다.",
      ));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCalendarColorChange(
    festival: Festival,
    calendarColor: FestivalCalendarColor | null,
  ) {
    if (festival.calendar_color === calendarColor) {
      return;
    }

    const previousColor = festival.calendar_color;

    setSavingColorId(festival.id);
    setErrorMessage(null);
    setFestivals((currentFestivals) =>
      currentFestivals.map((item) =>
        item.id === festival.id
          ? { ...item, calendar_color: calendarColor }
          : item,
      ),
    );

    try {
      const savedColor = await updateFestivalCalendarColor(
        festival.id,
        calendarColor,
      );

      setFestivals((currentFestivals) =>
        currentFestivals.map((item) =>
          item.id === festival.id
            ? { ...item, calendar_color: savedColor }
            : item,
        ),
      );
    } catch (error) {
      setFestivals((currentFestivals) =>
        currentFestivals.map((item) =>
          item.id === festival.id
            ? { ...item, calendar_color: previousColor }
            : item,
        ),
      );
      setErrorMessage(getSupabaseErrorMessage(
        error,
        "캘린더 색상 저장에 실패했습니다.",
      ));
    } finally {
      setSavingColorId(null);
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
    <main className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <AdminBackLink />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink-secondary">
              관리자
            </p>

            <h1 className="mt-2 text-3xl font-bold text-ink">
              페스티벌 관리
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/festival-updates"
              className="rounded-xl border border-line-strong bg-surface px-5 py-3 text-sm font-semibold text-ink"
            >
              기존 페스티벌 수정
            </Link>
            <Link
              href="/admin/festival-candidates"
              className="rounded-xl bg-surface-dark px-5 py-3 text-sm font-semibold text-white"
            >
              신규 페스티벌 등록
            </Link>
          </div>
        </div>

        <AdminNotice message={errorMessage} className="mt-6" />

        <section className="mt-8 overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
          {isLoading ? (
            <p className="p-8 text-sm text-ink-tertiary">
              불러오는 중...
            </p>
          ) : festivals.length === 0 ? (
            <p className="p-8 text-sm text-ink-tertiary">
              등록된 페스티벌이 없습니다.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-surface">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold text-ink-secondary">
                      페스티벌명
                    </th>

                    <th className="px-5 py-4 text-left font-semibold text-ink-secondary">
                      기간
                    </th>

                    <th className="px-5 py-4 text-left font-semibold text-ink-secondary">
                      장소
                    </th>

                    <th className="px-5 py-4 text-left font-semibold text-ink-secondary">
                      상태
                    </th>

                    <th className="px-3 py-4 text-right font-semibold text-ink-secondary">
                      색상
                    </th>

                    <th className="px-5 py-4 text-right font-semibold text-ink-secondary">
                      관리
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {festivals.map((festival) => (
                    <tr key={festival.id}>
                      <td className="px-5 py-4 font-semibold text-ink">
                        {festival.name}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-ink-secondary">
                        {festival.start_date ===
                        festival.end_date
                          ? festival.start_date
                          : `${festival.start_date} ~ ${festival.end_date}`}
                      </td>

                      <td className="px-5 py-4 text-ink-secondary">
                        {festival.location || "-"}
                      </td>

                      <td className="px-5 py-4 text-ink-secondary">
                        {festival.status || "-"}
                      </td>

                      <td className="whitespace-nowrap px-3 py-4">
                        <FestivalColorSelector
                          festivalId={festival.id}
                          selectedColor={festival.calendar_color}
                          disabled={savingColorId !== null}
                          onSelect={(calendarColor) =>
                            void handleCalendarColorChange(
                              festival,
                              calendarColor,
                            )
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/festivals/${festival.id}/lineup`}
                            className="rounded-lg border border-line-strong px-3 py-2 text-xs font-semibold text-ink-secondary"
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
