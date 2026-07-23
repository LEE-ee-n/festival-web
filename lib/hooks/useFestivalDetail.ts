"use client";

import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase/client";
import type {
  Festival,
  FestivalArtist,
  FestivalTicketRound,
} from "@/lib/types";

export type ArtistsByDateAndStage = Record<
  string,
  Record<string, FestivalArtist[]>
>;

type FestivalDetailState = {
  festival: Festival | null;
  festivalArtists: FestivalArtist[];
  ticketRounds: FestivalTicketRound[];
  isFestivalLoading: boolean;
  isArtistsLoading: boolean;
  isTicketsLoading: boolean;
  errorMessage: string | null;
};

const initialState: FestivalDetailState = {
  festival: null,
  festivalArtists: [],
  ticketRounds: [],
  isFestivalLoading: true,
  isArtistsLoading: true,
  isTicketsLoading: true,
  errorMessage: null,
};

export function useFestivalDetail(
  festivalId: number | string | null,
  enabled = true,
) {
  const databaseFestivalId = typeof festivalId === "number"
    ? festivalId
    : Number(festivalId);
  const [state, setState] = useState<FestivalDetailState>(initialState);

  useEffect(() => {
    if (!Number.isSafeInteger(databaseFestivalId) || databaseFestivalId <= 0 || !enabled) return;

    let isCancelled = false;

    queueMicrotask(() => {
      if (!isCancelled) {
        setState({
          ...initialState,
          isFestivalLoading: true,
          isArtistsLoading: true,
          isTicketsLoading: true,
        });
      }
    });

    async function fetchFestival() {
      try {
        const { data, error } = await supabase
          .from("festivals")
          .select(`
            id, name, start_date, end_date, location, address, region,
            category, description, official_url, thumbnail_url, price_info,
            price_type, program_info, source_url, slug, status,
            confidence_score, verification_status, created_at, updated_at
          `)
          .eq("id", databaseFestivalId)
          .eq("verification_status", "approved")
          .neq("status", "cancelled")
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error("축제를 찾을 수 없습니다.");

        const { data: timetableData } = await supabase
          .from("festivals")
          .select("timetable_status")
          .eq("id", databaseFestivalId)
          .maybeSingle();

        if (!isCancelled) {
          setState((current) => ({
            ...current,
            festival: {
              ...data,
              timetable_status:
                timetableData?.timetable_status === "unpublished"
                  ? "unpublished"
                  : "published",
            } as Festival,
          }));
        }
      } catch (error) {
        console.error(error);
        if (!isCancelled) {
          setState((current) => ({
            ...current,
            errorMessage:
              error instanceof Error
                ? error.message
                : "축제 정보를 불러오지 못했습니다.",
          }));
        }
      } finally {
        if (!isCancelled) {
          setState((current) => ({
            ...current,
            isFestivalLoading: false,
          }));
        }
      }
    }

    async function fetchFestivalArtists() {
      try {
        const { data, error } = await supabase
          .from("festival_artists")
          .select(`
            artist_id, performance_date, performance_time,
            performance_end_time, stage_name, status, artists (id, name)
          `)
          .eq("festival_id", databaseFestivalId)
          .neq("status", "cancelled")
          .order("performance_date", {
            ascending: true,
            nullsFirst: false,
          })
          .order("performance_time", {
            ascending: true,
            nullsFirst: false,
          });

        if (error) throw error;

        if (!isCancelled) {
          setState((current) => ({
            ...current,
            festivalArtists: (data || []) as FestivalArtist[],
          }));
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!isCancelled) {
          setState((current) => ({
            ...current,
            isArtistsLoading: false,
          }));
        }
      }
    }

    async function fetchTicketRounds() {
      try {
        const { data, error } = await supabase
          .from("festival_ticket_rounds")
          .select(`
            id, round_type, round_name, open_at, price_info,
            ticket_url, ticket_platform
          `)
          .eq("festival_id", databaseFestivalId)
          .order("open_at", {
            ascending: true,
            nullsFirst: false,
          });

        if (error) throw error;

        if (!isCancelled) {
          setState((current) => ({
            ...current,
            ticketRounds: (data || []) as FestivalTicketRound[],
          }));
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!isCancelled) {
          setState((current) => ({
            ...current,
            isTicketsLoading: false,
          }));
        }
      }
    }

    void fetchFestival();
    void fetchFestivalArtists();
    void fetchTicketRounds();

    return () => {
      isCancelled = true;
    };
  }, [databaseFestivalId, enabled]);

  const artistsByDateAndStage = useMemo(() => {
    const groups = state.festivalArtists.reduce<ArtistsByDateAndStage>(
      (dateGroups, artist) => {
        const date = artist.performance_date || "날짜 미정";
        const stage = artist.stage_name?.trim() || "무대 미정";

        dateGroups[date] ??= {};
        dateGroups[date][stage] ??= [];
        dateGroups[date][stage].push(artist);
        return dateGroups;
      },
      {},
    );

    Object.values(groups).forEach((stageGroups) => {
      Object.values(stageGroups).forEach((artists) => {
        artists.sort((a, b) => {
          if (!a.performance_time && !b.performance_time) return 0;
          if (!a.performance_time) return 1;
          if (!b.performance_time) return -1;
          return a.performance_time.localeCompare(b.performance_time);
        });
      });
    });

    return groups;
  }, [state.festivalArtists]);

  return {
    ...state,
    artistsByDateAndStage,
    isLoading:
      state.isFestivalLoading ||
      state.isArtistsLoading ||
      state.isTicketsLoading,
  };
}
