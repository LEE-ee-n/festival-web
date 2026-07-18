"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  formatKoreanDate,
  getAdjacentMonthForDate,
  getCalendarDays,
  getFestivalsForDate,
  toDateKey,
} from "@/lib/calendar";
import { supabase } from "@/lib/supabase/client";
import type { Festival } from "@/lib/types";
import { assignFestivalLanes } from "@/lib/calendarFestivalLanes";
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

function getCalendarMonth(
  searchParams: URLSearchParams,
  today: Date,
) {
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));

  const hasValidYear =
    Number.isInteger(year) && year >= 1900 && year <= 2100;
  const hasValidMonth =
    Number.isInteger(month) && month >= 1 && month <= 12;

  return {
    year: hasValidYear ? year : today.getFullYear(),
    monthIndex: hasValidMonth ? month - 1 : today.getMonth(),
  };
}

export default function Calendar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = useMemo(() => new Date(), []);
  const { year: currentYear, monthIndex: currentMonthIndex } =
    useMemo(
      () => getCalendarMonth(searchParams, today),
      [searchParams, today],
    );

  const [selectedDateKey, setSelectedDateKey] = useState(() => {
    const initialMonth = getCalendarMonth(searchParams, today);
    const isCurrentMonth =
      initialMonth.year === today.getFullYear() &&
      initialMonth.monthIndex === today.getMonth();

    return isCurrentMonth
      ? toDateKey(today)
      : toDateKey(
          new Date(initialMonth.year, initialMonth.monthIndex, 1),
        );
  });

  const [isDatePanelOpen, setIsDatePanelOpen] = useState(false);
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [selectedFestival, setSelectedFestival] =
    useState<Festival | null>(null);
  const [hasListContext, setHasListContext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null,
  );

  const selectedDate = new Date(`${selectedDateKey}T00:00:00`);
  const isSelectedDateInCurrentMonth =
    selectedDate.getFullYear() === currentYear &&
    selectedDate.getMonth() === currentMonthIndex;
  const activeSelectedDateKey = isSelectedDateInCurrentMonth
    ? selectedDateKey
    : toDateKey(new Date(currentYear, currentMonthIndex, 1));
  const activeSelectedFestival = isSelectedDateInCurrentMonth
    ? selectedFestival
    : null;
  const isActiveDatePanelOpen =
    isSelectedDateInCurrentMonth && isDatePanelOpen;

  function navigateToMonth(year: number, monthIndex: number) {
    const nextSearchParams = new URLSearchParams(
      searchParams.toString(),
    );

    nextSearchParams.set("year", String(year));
    nextSearchParams.set("month", String(monthIndex + 1));

    setSelectedDateKey(toDateKey(new Date(year, monthIndex, 1)));
    setSelectedFestival(null);
    setIsDatePanelOpen(false);
    router.push(`${pathname}?${nextSearchParams.toString()}`, {
      scroll: false,
    });
  }

  function selectDate(dateKey: string) {
    const adjacentMonth = getAdjacentMonthForDate(
      dateKey,
      currentYear,
      currentMonthIndex,
    );

    setSelectedDateKey(dateKey);
    setSelectedFestival(null);
    setHasListContext(true);
    setIsDatePanelOpen(true);

    if (!adjacentMonth) {
      return;
    }

    const nextSearchParams = new URLSearchParams(
      searchParams.toString(),
    );
    nextSearchParams.set("year", String(adjacentMonth.year));
    nextSearchParams.set(
      "month",
      String(adjacentMonth.monthIndex + 1),
    );

    router.push(`${pathname}?${nextSearchParams.toString()}`, {
      scroll: false,
    });
  }

  useEffect(() => {
    let isCancelled = false;

    async function fetchFestivals() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const monthStart = toDateKey(
          new Date(currentYear, currentMonthIndex, 1),
        );
        const monthEnd = toDateKey(
          new Date(currentYear, currentMonthIndex + 1, 0),
        );

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
            updated_at
          `)
          .eq("verification_status", "approved")
          .neq("status", "cancelled")
          .lte("start_date", monthEnd)
          .gte("end_date", monthStart)
          .order("start_date", { ascending: true });

        if (error) {
          throw error;
        }

        if (!isCancelled) {
          setFestivals((data ?? []) as Festival[]);
        }
      } catch (error) {
        console.error(error);

        if (!isCancelled) {
          setErrorMessage(
            "축제 데이터를 불러오지 못했습니다. Supabase 설정을 확인하세요.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchFestivals();

    return () => {
      isCancelled = true;
    };
  }, [currentMonthIndex, currentYear]);

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

  const festivalLanes = useMemo(
    () => assignFestivalLanes(festivals),
    [festivals],
  );

  const selectedFestivals = useMemo(
    () => getFestivalsForDate(festivals, activeSelectedDateKey),
    [activeSelectedDateKey, festivals],
  );

  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);

  function moveMonth(amount: number) {
    const nextMonth = new Date(
      currentYear,
      currentMonthIndex + amount,
      1,
    );

    navigateToMonth(nextMonth.getFullYear(), nextMonth.getMonth());
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
    setSelectedDateKey(toDateKey(today));
    setSelectedFestival(null);
    setIsDatePanelOpen(false);

    const nextSearchParams = new URLSearchParams(
      searchParams.toString(),
    );
    nextSearchParams.delete("year");
    nextSearchParams.delete("month");

    const query = nextSearchParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
  <section className="mx-auto w-full max-w-[1500px]">
    <div
      className={[
        "grid items-start gap-6",
        isActiveDatePanelOpen
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
              festivalLanes={festivalLanes}
              selectedDateKey={activeSelectedDateKey}
              isLoading={isLoading}
              getFestivalColorClass={getFestivalColorClass}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onSelectDate={selectDate}
              onSelectFestival={(festival) => {
                setSelectedFestival(festival);
                setHasListContext(false);
                setIsDatePanelOpen(true);
              }}
            />            
          </div>
        </div>
      </div>
        <FestivalSidePanel
          isOpen={isActiveDatePanelOpen}
          hasListContext={hasListContext}
          dateText={formatKoreanDate(activeSelectedDateKey)}
          festivals={selectedFestivals}
          selectedFestival={activeSelectedFestival}
          isLoading={isLoading}
          onSelectFestival={(festival) => {
            setSelectedFestival(festival);
            setHasListContext(true);
          }}          
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
