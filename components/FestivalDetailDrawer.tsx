"use client";

import { useEffect } from "react";
import { ListMusic } from "lucide-react";

import FestivalDetailSummary from "@/components/festival/FestivalDetailSummary";
import FestivalOfficialLink from "@/components/festival/FestivalOfficialLink";
import FestivalTicketSection from "@/components/festival/FestivalTicketSection";
import FestivalTimetable from "@/components/festival/FestivalTimetable";
import FestivalDetailSkeleton from "@/components/festival/loading/FestivalDetailSkeleton";
import FestivalTicketSkeleton from "@/components/festival/loading/FestivalTicketSkeleton";
import FestivalTimetableSkeleton from "@/components/festival/loading/FestivalTimetableSkeleton";
import { formatFestivalPeriod } from "@/lib/calendar";
import { getLatestTicketRoundGroup } from "@/lib/festivals/ticketDisplay";
import { useFestivalDetail } from "@/lib/hooks/useFestivalDetail";

type FestivalDetailDrawerProps = {
  festivalId: number | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function FestivalDetailDrawer({
  festivalId,
  isOpen,
  onClose,
}: FestivalDetailDrawerProps) {
  const {
    festival,
    festivalArtists,
    ticketRounds,
    artistsByDateAndStage,
    isFestivalLoading,
    isArtistsLoading,
    isTicketsLoading,
    errorMessage,
  } = useFestivalDetail(festivalId, isOpen);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || festivalId === null) return null;

  const periodText = festival
    ? formatFestivalPeriod(festival.start_date, festival.end_date)
    : "";
  const { latestOpenAt, latestTicketRounds } =
    getLatestTicketRoundGroup(ticketRounds);

  return (
    <div className="bg-white">
      {isFestivalLoading ? (
        <FestivalDetailSkeleton />
      ) : errorMessage || !festival ? (
        <div className="p-6 sm:p-8">
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-700">
              축제 정보를 표시할 수 없습니다.
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              {errorMessage}
            </p>
          </div>
        </div>
      ) : (
        <article className="bg-white">
          <FestivalDetailSummary
            festival={festival}
            periodText={periodText}
          />

          {isArtistsLoading ? (
            <FestivalTimetableSkeleton />
          ) : (
            <FestivalTimetable
              artistsByDateAndStage={artistsByDateAndStage}
              artistCount={festivalArtists.length}
            />
          )}

          {festival.program_info && (
            <section>
              <h2 className="flex items-center justify-center gap-2 pt-6 text-sm font-bold text-slate-700">
                <ListMusic size={16} />
                <span>프로그램</span>
              </h2>
              <p className="mt-3 whitespace-pre-line px-4 text-center text-sm leading-6 text-slate-700">
                {festival.program_info}
              </p>
              <div className="border-b border-slate-200 pt-6" />
            </section>
          )}

          {isTicketsLoading ? (
            <FestivalTicketSkeleton />
          ) : (
            <FestivalTicketSection
              ticketRounds={latestTicketRounds}
              latestOpenAt={latestOpenAt}
            />
          )}

          <FestivalOfficialLink officialUrl={festival.official_url} />
        </article>
      )}
    </div>
  );
}
