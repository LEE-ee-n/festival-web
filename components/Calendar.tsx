"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  formatKoreanDate,
  getCalendarDays,
  getFestivalsForDate,
  toDateKey,
} from "@/lib/calendar";
import { supabase } from "@/lib/supabase/client";
import type { Festival } from "@/lib/types";
import FestivalSidePanel from "@/components/calendar/FestivalSidePanel";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import CalendarWeekdays from "@/components/calendar/CalendarWeekdays";
import CalendarGrid from "@/components/calendar/CalendarGrid";

const FESTIVAL_BAR_COLORS = [
  "bg-festival-orange",
  "bg-festival-coral",
  "bg-festival-purple",
  "bg-festival-indigo",
  "bg-festival-night",
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

  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);

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

  function handlePointerDown(
  event: React.PointerEvent<HTMLDivElement>,
) {
  pointerStartX.current = event.clientX;
  pointerStartY.current = event.clientY;
}

function handlePointerUp(
  event: React.PointerEvent<HTMLDivElement>,
) {
  if (
    pointerStartX.current === null ||
    pointerStartY.current === null
  ) {
    return;
  }

  const deltaX = event.clientX - pointerStartX.current;
  const deltaY = event.clientY - pointerStartY.current;

  pointerStartX.current = null;
  pointerStartY.current = null;

  const isHorizontalSwipe =
    Math.abs(deltaX) > Math.abs(deltaY);

  const passedThreshold = Math.abs(deltaX) >= 50;

  if (!isHorizontalSwipe || !passedThreshold) {
    return;
  }

  if (deltaX < 0) {
    moveMonth(1);
  } else {
    moveMonth(-1);
  }
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
          ? "lg:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.6fr)]"
          : "lg:grid-cols-1",
      ].join(" ")}
      >
      <div className="min-w-0">
        <div className="overflow-hidden shadow-sm">
          <CalendarHeader
            currentYear={currentYear}
            currentMonthIndex={currentMonthIndex}
            onPreviousMonth={() => moveMonth(-1)}
            onNextMonth={() => moveMonth(1)}
            onMoveToToday={moveToToday}
          />

          {errorMessage && (
            <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div>
            <CalendarWeekdays />
            <CalendarGrid
              calendarDays={calendarDays}
              festivalsByDate={festivalsByDate}
              selectedDateKey={selectedDateKey}
              isLoading={isLoading}
              getFestivalColorClass={getFestivalColorClass}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onSelectDate={(dateKey) => {
                setSelectedDateKey(dateKey);
                setSelectedFestival(null);
                setIsDatePanelOpen(true);
              }}
              onSelectFestival={(festival) => {
                setSelectedFestival(festival);
                setIsDatePanelOpen(true);
              }}
            />            
          </div>
        </div>
      </div>
        <FestivalSidePanel
          isOpen={isDatePanelOpen}
          dateText={formatKoreanDate(selectedDateKey)}
          festivals={selectedFestivals}
          selectedFestival={selectedFestival}
          isLoading={isLoading}
          onSelectFestival={setSelectedFestival}
          onBackToList={() => setSelectedFestival(null)}
          onClose={() => {
            setSelectedFestival(null);
            setIsDatePanelOpen(false);
          }}
        />
      
    </div>

  </section>
  );
}