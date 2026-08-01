"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  formatKoreanDate,
  getAdjacentMonthForDate,
  getCalendarMonthFromSearchParams,
  getCalendarDays,
  getFestivalsForDate,
  getShiftedCalendarMonth,
  toDateKey,
} from "@/lib/calendar";
import { typography } from "@/lib/typography";
import { supabase } from "@/lib/supabase/client";
import type { Festival } from "@/lib/types";
import { assignFestivalLanes } from "@/lib/calendarFestivalLanes";
import type { PublicArtistSearchResult } from "@/lib/publicSearch";
import FestivalSidePanel from "@/components/calendar/FestivalSidePanel";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import CalendarWeekdays from "@/components/calendar/CalendarWeekdays";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import RecentFestivalTicker from "@/components/calendar/RecentFestivalTicker";
import { useCalendarSwipe } from "@/components/calendar/useCalendarSwipe";
import { getFestivalColorClass } from "@/lib/festivalColor";

export default function Calendar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = useMemo(() => new Date(), []);
  const initialMonth = useMemo(
    () => getCalendarMonthFromSearchParams(searchParams, today),
    [searchParams, today],
  );
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const {
    year: currentYear,
    monthIndex: currentMonthIndex,
  } = visibleMonth;
  const monthCursorRef = useRef({
    year: currentYear,
    monthIndex: currentMonthIndex,
  });

  const [selectedDateKey, setSelectedDateKey] = useState(() => {
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

  useEffect(() => {
    const synchronizeMonthFromHistory = () => {
      const historyMonth = getCalendarMonthFromSearchParams(
        new URLSearchParams(window.location.search),
        today,
      );

      monthCursorRef.current = historyMonth;
      setVisibleMonth(historyMonth);
      setSelectedDateKey(
        toDateKey(
          new Date(historyMonth.year, historyMonth.monthIndex, 1),
        ),
      );
      setSelectedFestival(null);
      setIsDatePanelOpen(false);
    };

    window.addEventListener("popstate", synchronizeMonthFromHistory);

    return () => {
      window.removeEventListener(
        "popstate",
        synchronizeMonthFromHistory,
      );
    };
  }, [today]);

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

  const navigateToMonth = useCallback(
    (year: number, monthIndex: number) => {
      const nextSearchParams = new URLSearchParams(
        searchParams.toString(),
      );

      nextSearchParams.set("year", String(year));
      nextSearchParams.set("month", String(monthIndex + 1));
      monthCursorRef.current = { year, monthIndex };
      setVisibleMonth({ year, monthIndex });

      setSelectedDateKey(toDateKey(new Date(year, monthIndex, 1)));
      setSelectedFestival(null);
      setIsDatePanelOpen(false);
      router.push(`${pathname}?${nextSearchParams.toString()}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

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
    monthCursorRef.current = adjacentMonth;
    setVisibleMonth(adjacentMonth);

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
            calendar_color,
            start_date,
            end_date,
            location,
            address,
            region,
            category,
            description,
            official_url,
            instagram_url,
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

  const calendarWheelTargetRef = useRef<HTMLDivElement>(null);
  const wheelDeltaY = useRef(0);
  const wheelLastEventAt = useRef(0);
  const wheelLockedUntil = useRef(0);

  const moveMonth = useCallback(
    (amount: number) => {
      const nextMonth = getShiftedCalendarMonth(
        monthCursorRef.current.year,
        monthCursorRef.current.monthIndex,
        amount,
      );

      navigateToMonth(nextMonth.year, nextMonth.monthIndex);
    },
    [navigateToMonth],
  );

  const handleCalendarSwipe = useCallback(
    (direction: "previous" | "next") => {
      moveMonth(direction === "next" ? 1 : -1);
    },
    [moveMonth],
  );
  const calendarSwipeHandlers = useCalendarSwipe(
    handleCalendarSwipe,
  );

  const handleCalendarWheel = useCallback(
    (event: WheelEvent) => {
      if (
        event.ctrlKey ||
        window.matchMedia("(pointer: coarse)").matches ||
        Math.abs(event.deltaY) <= Math.abs(event.deltaX)
      ) {
        return;
      }

      event.preventDefault();

      const now = Date.now();

      if (now < wheelLockedUntil.current) {
        return;
      }

      if (now - wheelLastEventAt.current > 180) {
        wheelDeltaY.current = 0;
      }

      wheelLastEventAt.current = now;
      wheelDeltaY.current += event.deltaY;

      if (Math.abs(wheelDeltaY.current) < 80) {
        return;
      }

      const direction = wheelDeltaY.current > 0 ? 1 : -1;
      wheelDeltaY.current = 0;
      wheelLockedUntil.current = now + 450;
      moveMonth(direction);
    },
    [moveMonth],
  );

  useEffect(() => {
    const wheelTarget = calendarWheelTargetRef.current;

    if (!wheelTarget) return;

    wheelTarget.addEventListener("wheel", handleCalendarWheel, {
      passive: false,
    });

    return () => {
      wheelTarget.removeEventListener("wheel", handleCalendarWheel);
    };
  }, [handleCalendarWheel]);

  function moveToToday() {
    const todayMonth = {
      year: today.getFullYear(),
      monthIndex: today.getMonth(),
    };

    monthCursorRef.current = todayMonth;
    setVisibleMonth(todayMonth);
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

  function selectSearchedFestival(festival: Festival) {
    const [year, month] = festival.start_date
      .split("-")
      .map(Number);
    const nextSearchParams = new URLSearchParams(
      searchParams.toString(),
    );

    nextSearchParams.set("year", String(year));
    nextSearchParams.set("month", String(month));
    monthCursorRef.current = { year, monthIndex: month - 1 };
    setVisibleMonth({ year, monthIndex: month - 1 });
    setSelectedDateKey(festival.start_date);
    setSelectedFestival(festival);
    setHasListContext(false);
    setIsDatePanelOpen(true);
    router.push(`${pathname}?${nextSearchParams.toString()}`, {
      scroll: false,
    });
  }

  function selectSearchedArtist(
    artist: PublicArtistSearchResult,
  ) {
    router.push(`/artist/${artist.id}`);
  }

  return (
  <section className="mx-auto w-full max-w-[1500px]">
    <RecentFestivalTicker />

    <div
      className={[
        "grid items-start gap-6",
        isActiveDatePanelOpen
          ? "lg:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.6fr)]"
          : "lg:grid-cols-1",
      ].join(" ")}
      >
      <div className="min-w-0">
        <div
          ref={calendarWheelTargetRef}
          className="overflow-hidden shadow-sm"
        >
          <CalendarHeader
            currentYear={currentYear}
            currentMonthIndex={currentMonthIndex}
            onPreviousMonth={() => moveMonth(-1)}
            onNextMonth={() => moveMonth(1)}
            onMoveToToday={moveToToday}
            onSelectSearchFestival={selectSearchedFestival}
            onSelectSearchArtist={selectSearchedArtist}
          />

          {errorMessage && (
            <div className={`${typography.body} border-b border-red-200 bg-red-50 px-4 py-3 text-red-700`}>
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
              swipeHandlers={calendarSwipeHandlers}
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
