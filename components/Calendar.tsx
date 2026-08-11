"use client";

import CalendarGrid from "@/components/calendar/CalendarGrid";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import CalendarWeekdays from "@/components/calendar/CalendarWeekdays";
import FestivalSidePanel from "@/components/calendar/FestivalSidePanel";
import RecentFestivalTicker from "@/components/calendar/RecentFestivalTicker";
import { useCalendarController } from "@/components/calendar/useCalendarController";
import { formatKoreanDate } from "@/lib/calendar";
import { getFestivalColorClass } from "@/lib/festivalColor";
import { typography } from "@/lib/typography";

export default function Calendar() {
  const {
    currentYear,
    currentMonthIndex,
    activeSelectedDateKey,
    activeSelectedFestival,
    isActiveDatePanelOpen,
    activeRegion,
    setSelectedFestival,
    setHasListContext,
    setIsDatePanelOpen,
    hasListContext,
    isLoading,
    errorMessage,
    calendarDays,
    regions,
    festivalsByDate,
    festivalLanes,
    selectedFestivals,
    calendarWheelTargetRef,
    moveMonth,
    calendarSwipeHandlers,
    moveToToday,
    selectSearchedFestival,
    selectSearchedArtist,
    changeRegion,
    selectDate,
  } = useCalendarController();

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
            regions={regions}
            activeRegion={activeRegion}
            onRegionChange={changeRegion}
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
