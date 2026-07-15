"use client";

import { useEffect, useState } from "react";

import { formatFestivalPeriod } from "@/lib/calendar";
import {
  categoryBadgeClasses,
  categoryLabels,
} from "@/lib/categories";
import { supabase } from "@/lib/supabase/client";
import type { Festival } from "@/lib/types";
import FestivalTimetable from "@/components/festival/FestivalTimetable";
import FestivalDetailSummary from "@/components/festival/FestivalDetailSummary";
import FestivalTicketSection from "@/components/festival/FestivalTicketSection";
import FestivalOfficialLink from "@/components/festival/FestivalOfficialLink";

type FestivalTicketRound = {
  id: number;
  round_type: string | null;
  round_name: string;
  open_at: string | null;
  price_info: string | null;
  ticket_url: string | null;
  ticket_platform: string | null;
};

type FestivalArtist = {
  artist_id: number;
  performance_date: string | null;
  performance_time: string | null;
  performance_end_time: string | null;
  stage_name: string | null;
  status: string;
  artists:
    | {
        id: number;
        name: string;
      }
    | {
        id: number;
        name: string;
      }[]
    | null;
};

type FestivalDetailDrawerProps = {
  festivalId: number | null;
  isOpen: boolean;
  onClose: () => void;
};

function formatTicketOpenAt(openAt: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(openAt));
}

export default function FestivalDetailDrawer({
  festivalId,
  isOpen,
  onClose,
}: FestivalDetailDrawerProps) {
  const [festival, setFestival] = useState<Festival | null>(null);
  const [festivalArtists, setFestivalArtists] = useState<
    FestivalArtist[]
  >([]);
  const [ticketRounds, setTicketRounds] = useState<
    FestivalTicketRound[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    async function fetchFestivalDetail() {
      if (!festivalId || !isOpen) {
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        setFestival(null);
        setFestivalArtists([]);
        setTicketRounds([]);

        const [
          festivalResult,
          ticketRoundsResult,
          festivalArtistsResult,
        ] = await Promise.all([
          supabase
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
            .eq("id", festivalId)
            .eq("verification_status", "approved")
            .neq("status", "cancelled")
            .maybeSingle(),

          supabase
            .from("festival_ticket_rounds")
            .select(`
              id,
              round_type,
              round_name,
              open_at,
              price_info,
              ticket_url,
              ticket_platform
            `)
            .eq("festival_id", festivalId)
            .order("open_at", {
              ascending: true,
              nullsFirst: false,
            }),

          supabase
            .from("festival_artists")
            .select(`
              artist_id,
              performance_date,
              performance_time,
              performance_end_time,
              stage_name,
              status,
              artists (
                id,
                name
              )
            `)
            .eq("festival_id", festivalId)
            .neq("status", "cancelled")
            .order("performance_date", {
              ascending: true,
              nullsFirst: false,
            })
            .order("performance_time", {
              ascending: true,
              nullsFirst: false,
            }),
        ]);

        if (festivalResult.error) {
          throw festivalResult.error;
        }

        if (ticketRoundsResult.error) {
          throw ticketRoundsResult.error;
        }

        if (festivalArtistsResult.error) {
          throw festivalArtistsResult.error;
        }

        if (!festivalResult.data) {
          throw new Error("축제를 찾을 수 없습니다.");
        }

        setFestival(festivalResult.data as Festival);
        setTicketRounds(
          (ticketRoundsResult.data || []) as FestivalTicketRound[],
        );
        setFestivalArtists(
          (festivalArtistsResult.data || []) as FestivalArtist[],
        );
      } catch (error) {
        console.error(error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "축제 정보를 불러오지 못했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void fetchFestivalDetail();
  }, [festivalId, isOpen]);

  if (!isOpen || festivalId === null) {
    return null;
  }

  const latestOpenAt =
    ticketRounds
      .filter((round) => round.open_at)
      .map((round) => round.open_at as string)
      .sort(
        (a, b) =>
          new Date(b).getTime() - new Date(a).getTime(),
      )[0] ?? null;

  const latestTicketRounds = latestOpenAt
    ? ticketRounds.filter(
        (round) => round.open_at === latestOpenAt,
      )
    : [];

  const artistsByDateAndStage = festivalArtists.reduce<
    Record<string, Record<string, FestivalArtist[]>>
  >((dateGroups, item) => {
    const date = item.performance_date || "날짜 미정";
    const stage = item.stage_name?.trim() || "무대 미정";

    if (!dateGroups[date]) {
      dateGroups[date] = {};
    }

    if (!dateGroups[date][stage]) {
      dateGroups[date][stage] = [];
    }

    dateGroups[date][stage].push(item);

    return dateGroups;
  }, {});

  Object.values(artistsByDateAndStage).forEach((stageGroups) => {
    Object.values(stageGroups).forEach((artists) => {
      artists.sort((a, b) => {
        if (!a.performance_time && !b.performance_time) {
          return 0;
        }

        if (!a.performance_time) {
          return 1;
        }

        if (!b.performance_time) {
          return -1;
        }

        return a.performance_time.localeCompare(b.performance_time);
      });
    });
  });

    return (
      <div className="bg-white">
        {isLoading ? (
          <div className="p-6 sm:p-8">
            <div className="animate-pulse rounded-3xl bg-white p-8 shadow-sm">
              <div className="h-8 w-2/3 rounded bg-slate-200" />
              <div className="mt-6 h-5 w-1/2 rounded bg-slate-100" />
              <div className="mt-10 h-32 rounded bg-slate-100" />
            </div>
          </div>
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
              categoryLabel={categoryLabels[festival.category]}
              categoryClassName={
                categoryBadgeClasses[festival.category]
              }
              periodText={formatFestivalPeriod(
                festival.start_date,
                festival.end_date,
              )}
            />

            <FestivalTimetable
              artistsByDateAndStage={artistsByDateAndStage}
              artistCount={festivalArtists.length}
            />

            {festival.program_info && (
              <section>
                <h2 className="text-sm font-bold text-slate-700">
                  프로그램
                </h2>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                  {festival.program_info}
                </p>
              </section>
            )}

            <FestivalTicketSection
              ticketRounds={latestTicketRounds}
              latestOpenAt={latestOpenAt}
              openAtText={
                latestOpenAt
                  ? formatTicketOpenAt(latestOpenAt)
                  : null
              }
            />

            <FestivalOfficialLink
              officialUrl={festival.official_url}
            />
          </article>
        )}
      </div>
    );
}