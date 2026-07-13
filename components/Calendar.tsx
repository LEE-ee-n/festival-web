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
const FESTIVAL_BAR_COLORS = [
  "bg-indigo-500",
  "bg-orange-500",
  "bg-emerald-500",
  "bg-rose-400",
  "bg-purple-500",
  "bg-sky-500",
];

function getFestivalColorClass(festivalId: number) {
  return FESTIVAL_BAR_COLORS[
    festivalId % FESTIVAL_BAR_COLORS.length
  ];
}

const INITIAL_YEAR = 2026;
const INITIAL_MONTH_INDEX = 6;

export default function Calendar() {
  const [currentYear, setCurrentYear] = useState(INITIAL_YEAR);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(
    INITIAL_MONTH_INDEX,
  );

  const [selectedDateKey, setSelectedDateKey] =
    useState("2026-07-01");
  const [isDatePanelOpen, setIsDatePanelOpen] =
    useState(false);

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
        isDatePanelOpen
          ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]"
          : "lg:grid-cols-1",
      ].join(" ")}
    >
      <div className="min-w-0">
      <div className="overflow-hidden rounded-3xl shadow-sm">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-5 sm:px-6">
          <div className="flex items-center gap-2 justify-self-start">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              aria-label="이전 달"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl leading-none text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={() => moveMonth(1)}
              aria-label="다음 달"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl leading-none text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              ›
            </button>
          </div>

          <h1 className="justify-self-center text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {currentYear}년 {currentMonthIndex + 1}월
          </h1>

          <button
            type="button"
            onClick={moveToToday}
            className="justify-self-end rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            오늘
          </button>
        </div>

        {errorMessage && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div>
  <div className="pt-4">
    <div className="grid grid-cols-7 overflow-hidden rounded-2xl bg-sky-200">
      {WEEKDAYS.map((weekday, index) => (
        <div
          key={weekday}
          className={[
            "flex h-11 items-center justify-center text-center text-sm font-semibold",
            index === 0
              ? "text-red-600"
              : index === 6
                ? "text-blue-600"
                : "text-black",
          ].join(" ")}
        >
          {weekday}
        </div>
      ))}
    </div>
  </div>

        <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-7 [&>*]:border-b [&>*]:border-r [&>*:nth-child(7n)]:border-r-0 [&>*:nth-last-child(-n+7)]:border-b-0">
            {calendarDays.map((day, dayIndex) => {
              const dayFestivals =
                festivalsByDate.get(day.dateKey) ?? [];

              const isSelected =
                selectedDateKey === day.dateKey;

              const hasFestivals = dayFestivals.length > 0;

              const isRowStart = dayIndex % 7 === 0;
              const isRowEnd = dayIndex % 7 === 6;

              return (
                <button
                  type="button"
                  key={day.dateKey}
                  onClick={() => {
                    setSelectedDateKey(day.dateKey);
                    setSelectedFestival(null);
                    setIsDatePanelOpen(true);
                  }}
                  className={[
                    "relative min-h-20 border-slate-200 text-center transition sm:min-h-40",
                    day.isCurrentMonth
                      ? "text-slate-800"
                      : "bg-gray-100 text-gray-400",
                    hasFestivals && day.isCurrentMonth
                      ? "hover:bg-blue-50"
                      : "hover:bg-slate-50",
                    isSelected
                      ? "z-10 ring-2 ring-inset ring-blue-500"
                      : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "absolute left-1/2 top-2 inline-flex h-6 min-w-6 -translate-x-1/2 items-center justify-center rounded-full px-1 text-xs font-semibold sm:h-7 sm:min-w-7 sm:text-sm",                      day.isToday
                        ? "bg-slate-900 text-white"
                        : "",
                      dayIndex % 7 === 0 && !day.isToday
                        ? "text-red-600"
                        : "",
                      dayIndex % 7 === 6 && !day.isToday
                        ? "text-blue-600"
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

                          const isRowStart = dayIndex % 7 === 0;

                          const showName =
                            startsToday || isRowStart;

                          const roundLeft =
                            startsToday;

                          const roundRight =
                            endsToday;

                          const currentDate = new Date(
                            `${day.dateKey}T00:00:00`,
                          );

                          const festivalEndDate = new Date(
                            `${festival.end_date}T00:00:00`,
                          );

                          const remainingFestivalDays =
                            Math.floor(
                              (festivalEndDate.getTime() -
                                currentDate.getTime()) /
                                (1000 * 60 * 60 * 24),
                            ) + 1;

                          const remainingDaysInRow =
                            7 - (dayIndex % 7);

                          const spanDays = Math.min(
                            remainingFestivalDays,
                            remainingDaysInRow,
                          );

                          return (
                            <div
                              key={`${day.dateKey}-${festival.id}`}
                              className="relative"
                            >
                            
                            {showName && (
                              <div className="relative z-20 h-6">
                                <div
                                  role="button"
                                  tabIndex={0}
                                  title={festival.name.replace(/^\d{4}\s*/, "")}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedFestival(festival);
                                  }}
                                  onKeyDown={(event) => {
                                    if (
                                      event.key === "Enter" ||
                                      event.key === " "
                                    ) {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      setSelectedFestival(festival);
                                    }
                                  }}
                                  style={{
                                    width: `calc(${spanDays * 100}% + ${
                                      spanDays - 1
                                    }px)`,
                                  }}
                                  className={[
                                    "absolute left-0 top-0 flex h-6 cursor-pointer items-center gap-1.5 overflow-hidden px-2 text-left hover:opacity-90",
                                    getFestivalColorClass(festival.id),
                                    roundLeft ? "rounded-l-full" : "",
                                    roundRight ? "rounded-r-full" : "",
                                  ].join(" ")}
                                >
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" />

                                  <span className="whitespace-nowrap text-[11px] font-semibold text-white">
                                    {festival.name.replace(/^\d{4}\s*/, "")}
                                  </span>
                                </div>
                              </div>
                            )}

                              
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
      </div>
    </div>

       {isDatePanelOpen &&
          (selectedFestival ? (
            <div className="hidden lg:block">
              <FestivalDetailDrawer
                festivalId={selectedFestival.id}
                isOpen={true}
                onClose={() => setSelectedFestival(null)}
              />
            </div>
          ) : (
            <aside className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
              <div className="min-h-[80px] border-b border-slate-200 px-5 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-blue-600">
                    선택한 날짜
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFestival(null);
                      setIsDatePanelOpen(false);
                    }}
                    className="rounded-full px-3 py-1 text-sm font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    닫기
                  </button>
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-950">
                    {formatKoreanDate(selectedDateKey)}
                  </h2>

                  <span className="text-sm text-slate-500">
                    {selectedFestivals.length}개 축제
                  </span>
                </div>
              </div>

              <div className="p-5">
                {isLoading ? (
                  <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
                ) : (
                  <FestivalList
                    festivals={selectedFestivals}
                    onSelect={(festival) =>
                      setSelectedFestival(festival)
                    }
                  />
                )}
              </div>
            </aside>
          ))}   
    </div>
  </section>
  );
}