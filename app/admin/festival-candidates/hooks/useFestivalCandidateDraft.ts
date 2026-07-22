"use client";

import { useCallback, useState } from "react";

import { normalizeArtistName } from "@/lib/artists/normalizeArtistName";
import {
  applyExistingArtistSelection,
  type ExistingArtistMatch,
} from "@/lib/artists/applyNormalizedArtistMatches";
import {
  canEditArtistReviewField,
  type ArtistReviewEditableField,
} from "@/lib/festivals/festivalDraft";
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

  function updateWorkflow(
    field: keyof NonNullable<FestivalDraftJson["workflow"]>,
    value: NonNullable<FestivalDraftJson["workflow"]>[typeof field],
  ) {
    setDraft((current) =>
      current
        ? {
            ...current,
            workflow: { ...current.workflow, [field]: value },
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
    setDraft((current) => {
      if (!current) return current;

      return {
        ...current,
        artists: current.artists.map((artist, artistIndex) => {
          if (artistIndex !== index) return artist;

          const updatedArtist = {
            ...artist,
            [field]: value,
          } as FestivalDraftArtist;

          if (
            (field === "input_name" || field === "display_name")
            && !artist.normalized_name.trim()
            && typeof value === "string"
          ) {
            updatedArtist.normalized_name = normalizeArtistName(value);
          }

          return updatedArtist;
        }),
      };
    });
  }

  function updateArtistReviewField(
    index: number,
    field: ArtistReviewEditableField,
    value: string | string[],
  ) {
    setDraft((current) => {
      if (!current) return current;
      const artist = current.artists[index];
      if (!artist || !canEditArtistReviewField(artist, field)) return current;

      const updatedArtist: FestivalDraftArtist = {
        ...artist,
        [field]: value,
      };
      if (
        field === "display_name"
        && !artist.normalized_name.trim()
        && typeof value === "string"
      ) {
        updatedArtist.normalized_name = normalizeArtistName(value);
      }
      if (field === "normalized_name") {
        updatedArtist.matched_artist_id = null;
        updatedArtist.match_status = "pending";
      }

      return {
        ...current,
        artists: current.artists.map((item, artistIndex) =>
          artistIndex === index ? updatedArtist : item),
      };
    });
  }

  function selectExistingArtist(
    index: number,
    existingArtist: ExistingArtistMatch,
  ) {
    setDraft((current) => {
      if (!current || !current.artists[index]) return current;
      return {
        ...current,
        artists: current.artists.map((artist, artistIndex) =>
          artistIndex === index
            ? applyExistingArtistSelection(artist, existingArtist)
            : artist),
      };
    });
  }

  function setArtistMatchStatus(
    index: number,
    matchStatus: "pending" | "new" | "excluded",
  ) {
    setDraft((current) => {
      if (!current || !current.artists[index]) return current;
      return {
        ...current,
        artists: current.artists.map((artist, artistIndex) =>
          artistIndex === index
            ? {
                ...artist,
                matched_artist_id: null,
                match_status: matchStatus,
              }
            : artist),
      };
    });
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
    updateWorkflow,
    addArtist,
    updateArtist,
    updateArtistReviewField,
    selectExistingArtist,
    setArtistMatchStatus,
    deleteArtist,
    addTicket,
    updateTicket,
    deleteTicket,
  };
}
