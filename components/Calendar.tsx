"use client";

import { useEffect, useMemo, useState } from "react";

import FestivalList from "@/components/FestivalList";
import FestivalDetailDrawer from "@/components/FestivalDetailDrawer";
import {
  formatKoreanDate,
  getCalendarDays,
  getFestivalsForDate,
  toDateKey,
} from "@/lib/calendar";
import { categoryDotClasses } from "@/lib/categories";
import { supabase } from "@/lib/supabase/client";
import type { Festival } from "@/lib/types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const INITIAL_YEAR = 2026;
const INITIAL_MONTH_INDEX = 6;

export default function Calendar() {
  const [currentYear, setCurrentYear] = useState(INITIAL_YEAR);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(
    INITIAL_MONTH_INDEX,
  );

  const [selectedDateKey, setSelectedDateKey] =
    useState("2026-07-01");

  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [selectedFestival, setSelectedFestival] =
    useState<Festival | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    async function fetchFestivals() {
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
            address,
            region,
            category,
            description,
            official_url,
            thumbnail_url,
            price_info,
            price_type,
            program_info,
            source_url,
            slug,
            status,
            confidence_score,
            verification_status,
            created_at,
            updated_at,
            thumbnail_url
          `)
          .eq("verification_status", "approved")
          .neq("status", "cancelled")
          .order("start_date", { ascending: true });

        if (error) {
          throw error;
        }

        setFestivals((data ?? []) as Festival[]);
      } catch (error) {
        console.error(error);

        setErrorMessage(
          "축제 데이터를 불러오지 못했습니다. Supabase 설정을 확인하세요.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void fetchFestivals();
  }, []);

  const calendarDays = useMemo(
    () => getCalendarDays(currentYear, currentMonthIndex),
    [currentYear, currentMonthIndex],
  );

  const festivalsByDate = useMemo(() => {
    const result = new Map<string, Festival[]>();

    calendarDays.forEach((day) => {
      result.set(
        day.dateKey,
        getFestivalsForDate(festivals, day.dateKey),
      );
    });

    return result;
  }, [calendarDays, festivals]);

  const selectedFestivals = useMemo(
    () => getFestivalsForDate(festivals, selectedDateKey),
    [festivals, selectedDateKey],
  );

  function moveMonth(amount: number) {
    const nextMonth = new Date(
      currentYear,
      currentMonthIndex + amount,
      1,
    );

    setCurrentYear(nextMonth.getFullYear());
    setCurrentMonthIndex(nextMonth.getMonth());
    setSelectedDateKey(toDateKey(nextMonth));
  }

  function moveToToday() {
    const today = new Date();

    setCurrentYear(today.getFullYear());
    setCurrentMonthIndex(today.getMonth());
    setSelectedDateKey(toDateKey(today));
  }

  return (
  <section className="mx-auto w-full max-w-[1500px]">
    <div
      className={[
        "grid items-start gap-6",
        selectedFestival
          ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
          : "lg:grid-cols-1",
      ].join(" ")}
    >
      <div className="min-w-0">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {currentYear}년 {currentMonthIndex + 1}월
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              이전
            </button>

            <button
              type="button"
              onClick={moveToToday}
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              오늘
            </button>

            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              다음
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="p-2 sm:p-5">
          <div className="grid grid-cols-7 border-b border-l border-slate-200">
            {WEEKDAYS.map((weekday, index) => (
              <div
                key={weekday}
                className={[
                  "flex h-10 items-center justify-center border-r border-t border-slate-200 bg-slate-50 text-center text-[11px] font-semibold sm:h-12 sm:text-sm",
                  index === 0
                    ? "text-red-500"
                    : index === 6
                      ? "text-blue-500"
                      : "text-slate-500",
                ].join(" ")}
              >
                {weekday}
              </div>
            ))}

            {calendarDays.map((day, index) => {
              const dayFestivals =
                festivalsByDate.get(day.dateKey) ?? [];

              const isSelected =
                selectedDateKey === day.dateKey;

              const hasFestivals = dayFestivals.length > 0;

              const isRowStart = index % 7 === 0;
              const isRowEnd = index % 7 === 6;

              return (
                <button
                  type="button"
                  key={day.dateKey}
                  onClick={() =>
                    setSelectedDateKey(day.dateKey)
                  }
                  className={[
                    "relative min-h-20 border-r border-t border-slate-200 text-center transition sm:min-h-28",
                    day.isCurrentMonth
                      ? "text-slate-800"
                      : "bg-slate-50 text-slate-300",
                    hasFestivals && day.isCurrentMonth
                      ? "bg-blue-50/40 hover:bg-blue-50"
                      : "hover:bg-slate-50",
                    isSelected
                      ? "z-10 ring-2 ring-inset ring-blue-600"
                      : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "absolute left-1/2 top-2 inline-flex h-6 min-w-6 -translate-x-1/2 items-center justify-center rounded-full px-1 text-xs font-semibold sm:h-7 sm:min-w-7 sm:text-sm",                      day.isToday
                        ? "bg-slate-900 text-white"
                        : "",
                      index % 7 === 0 && !day.isToday
                        ? "text-red-500"
                        : "",
                      index % 7 === 6 && !day.isToday
                        ? "text-blue-500"
                        : "",
                    ].join(" ")}
                  >
                    {day.dayNumber}
                  </span>

                  {isLoading ? (
                    <div className="mx-auto mt-4 h-2 w-5 animate-pulse rounded-full bg-slate-200" />
                  ) : (
                    hasFestivals && (
                      <div className="mt-11 space-y-1.5 text-left">
                        {dayFestivals.slice(0, 2).map((festival) => {
                          const startsToday =
                            festival.start_date === day.dateKey;

                          const endsToday =
                            festival.end_date === day.dateKey;

                          const showName =
                            startsToday || isRowStart;

                          const roundLeft =
                            startsToday || isRowStart;

                          const roundRight =
                            endsToday || isRowEnd;

                          return (
                            <div
                              key={`${day.dateKey}-${festival.id}`}
                              className="relative"
                            >
                              <div className="h-4 px-1">
                                {showName && (
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setSelectedFestival(festival);
                                    }}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        setSelectedFestival(festival);
                                      }
                                    }}
                                    className="block w-full cursor-pointer truncate text-left text-[10px] font-semibold leading-4 text-slate-700 hover:text-blue-600"
                                  >
                                    {festival.name.replace(/^\d{4}\s*/, "")}
                                  </span>
                                )}
                              </div>

                              <div
                                className={[
                                  "-mx-px h-1.5",
                                  categoryDotClasses[
                                    festival.category
                                  ],
                                  roundLeft
                                    ? "rounded-l-full"
                                    : "",
                                  roundRight
                                    ? "rounded-r-full"
                                    : "",
                                ].join(" ")}
                              />
                            </div>
                          );
                        })}

                        {dayFestivals.length > 2 && (
                          <span className="block px-1 text-[10px] font-medium text-slate-500">
                            +{dayFestivals.length - 2}개
                          </span>
                        )}
                      </div>
                    )
                  )}
                </button>
              );
            })}


          </div>
        </div>
      </div>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-blue-600">
              선택한 날짜
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">
              {formatKoreanDate(selectedDateKey)}
            </h2>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
            {selectedFestivals.length}개 축제
          </span>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : (
          <FestivalList festivals={selectedFestivals} />
        )}
      </section>
    </div>

      <FestivalDetailDrawer
        festivalId={selectedFestival?.id ?? null}
        isOpen={selectedFestival !== null}
        onClose={() => setSelectedFestival(null)}
      />
    </div>
  </section>
  );
}