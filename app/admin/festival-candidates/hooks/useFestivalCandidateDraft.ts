"use client";

import { useCallback, useState } from "react";

import type { FestivalDraftJson } from "@/lib/types";

type FestivalDraftArtist = FestivalDraftJson["artists"][number];
type FestivalDraftTicket = NonNullable<FestivalDraftJson["tickets"]>[number];

export function useFestivalCandidateDraft() {
  const [draft, setDraft] = useState<FestivalDraftJson | null>(null);

  const initializeDraft = useCallback((value: FestivalDraftJson) => {
    setDraft(structuredClone(value));
  }, []);

  const clearDraft = useCallback(() => setDraft(null), []);

  function updateFestival(
    field: keyof FestivalDraftJson["festival"],
    value: string,
  ) {
    setDraft((current) =>
      current
        ? {
            ...current,
            festival: { ...current.festival, [field]: value },
          }
        : current,
    );
  }

  function addArtist() {
    setDraft((current) =>
      current
        ? {
            ...current,
            artists: [
              ...current.artists,
              {
                input_name: "",
                display_name: "",
                normalized_name: "",
                matched_artist_id: null,
                match_status: "pending",
                aliases: [],
                performance_date: "",
                performance_time: "",
                performance_end_time: "",
                stage_name: "",
                status: "confirmed",
              },
            ],
          }
        : current,
    );
  }

  function updateArtist(
    index: number,
    field: keyof FestivalDraftArtist,
    value: string | string[] | number | null,
  ) {
    setDraft((current) =>
      current
        ? {
            ...current,
            artists: current.artists.map((artist, artistIndex) =>
              artistIndex === index
                ? ({ ...artist, [field]: value } as FestivalDraftArtist)
                : artist,
            ),
          }
        : current,
    );
  }

  function deleteArtist(index: number) {
    setDraft((current) =>
      current
        ? {
            ...current,
            artists: current.artists.filter(
              (_, artistIndex) => artistIndex !== index,
            ),
          }
        : current,
    );
  }

  function addTicket() {
    setDraft((current) =>
      current
        ? {
            ...current,
            tickets: [
              ...(current.tickets ?? []),
              {
                round_type: "regular",
                round_name: "",
                open_at: "",
                close_at: "",
                price_info: "",
                ticket_url: "",
                ticket_platform: "",
                status: "scheduled",
              },
            ],
          }
        : current,
    );
  }

  function updateTicket(
    index: number,
    field: keyof FestivalDraftTicket,
    value: string,
  ) {
    setDraft((current) =>
      current
        ? {
            ...current,
            tickets: (current.tickets ?? []).map((ticket, ticketIndex) =>
              ticketIndex === index ? { ...ticket, [field]: value } : ticket,
            ),
          }
        : current,
    );
  }

  function deleteTicket(index: number) {
    setDraft((current) =>
      current
        ? {
            ...current,
            tickets: (current.tickets ?? []).filter(
              (_, ticketIndex) => ticketIndex !== index,
            ),
          }
        : current,
    );
  }

  return {
    draft,
    initializeDraft,
    clearDraft,
    updateFestival,
    addArtist,
    updateArtist,
    deleteArtist,
    addTicket,
    updateTicket,
    deleteTicket,
  };
}
