"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Heart, ListMusic } from "lucide-react";

import FestivalDetailSummary from "@/components/festival/FestivalDetailSummary";
import FestivalExternalLinkGroup from "@/components/festival/FestivalExternalLinkGroup";
import FestivalTicketSection from "@/components/festival/FestivalTicketSection";
import FestivalTimetable from "@/components/festival/FestivalTimetable";
import FestivalDetailSkeleton from "@/components/festival/loading/FestivalDetailSkeleton";
import FestivalTicketSkeleton from "@/components/festival/loading/FestivalTicketSkeleton";
import FestivalTimetableSkeleton from "@/components/festival/loading/FestivalTimetableSkeleton";
import { formatFestivalPeriod } from "@/lib/calendar";
import { getLatestTicketRoundGroup } from "@/lib/festivals/ticketDisplay";
import { useFestivalDetail } from "@/lib/hooks/useFestivalDetail";
import { useFavoriteArtistList } from "@/lib/hooks/useFavoriteArtistList";
import { typography } from "@/lib/typography";

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
  const favoriteArtists = useFavoriteArtistList();
  const favoriteArtistIds = new Set(favoriteArtists.items.map((artist) => artist.id));

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
    <div className="bg-surface">
      {isFestivalLoading ? (
        <FestivalDetailSkeleton />
      ) : errorMessage || !festival ? (
        <div className="p-6 sm:p-8">
          <div className="rounded-3xl border border-red-200 bg-surface p-8 text-center shadow-sm">
            <h2 className={`${typography.articleSectionTitle} text-ink-secondary`}>
              축제 정보를 표시할 수 없습니다.
            </h2>
            <p className={`${typography.body} mt-3 text-ink-tertiary`}>
              {errorMessage}
            </p>
          </div>
        </div>
      ) : (
        <article className="bg-surface">
          <FestivalDetailSummary
            festival={festival}
            periodText={periodText}
          />

          {isArtistsLoading ? (
            <FestivalTimetableSkeleton />
          ) : festival.timetable_status === "unpublished" ? (
            <section className="border-b border-line px-6 py-6">
              <h2 className={`${typography.sectionTitle} text-ink`}>
                출연진
              </h2>
              <p className={`${typography.label} mt-2 text-ink-tertiary`}>
                타임테이블 미공개
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {Array.from(new Map(festivalArtists.map((item) => {
                  const artist = Array.isArray(item.artists) ? item.artists[0] : item.artists;
                  return [item.artist_id, artist];
                })).values()).map((artist) => artist ? (
                  <Link
                    key={artist.id}
                    href={`/artist/${artist.id}`}
                    className={`${typography.label} rounded-full border border-line bg-surface px-3 py-2 text-ink`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {artist.name}
                      {favoriteArtistIds.has(artist.id) && <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" aria-label="좋아하는 아티스트" />}
                    </span>
                  </Link>
                ) : null)}
              </div>
            </section>
          ) : (
            <FestivalTimetable
              artistsByDateAndStage={artistsByDateAndStage}
              artistCount={festivalArtists.length}
              festivalId={festival.id}
              festivalStatus={festival.status}
              favoriteArtistIds={favoriteArtistIds}
            />
          )}

          {festival.program_info && (
            <section>
              <h2 className={`${typography.label} flex items-center justify-center gap-2 pt-6 text-ink-secondary`}>
                <ListMusic size={16} />
                <span>프로그램</span>
              </h2>
              <p className={`${typography.bodyRelaxed} whitespace-pre-line px-6 pt-3 text-ink-secondary`}>
                {festival.program_info}
              </p>
              <div className="border-b border-line pt-6" />
            </section>
          )}

          {isTicketsLoading ? (
            <FestivalTicketSkeleton />
          ) : latestTicketRounds.length > 0 ? (
            <FestivalTicketSection
              ticketRounds={latestTicketRounds}
              latestOpenAt={latestOpenAt}
              officialUrl={festival.official_url}
              instagramUrl={festival.instagram_url}
            />
          ) : (
            <FestivalExternalLinkGroup
              officialUrl={festival.official_url}
              instagramUrl={festival.instagram_url}
            />
          )}
        </article>
      )}
    </div>
  );
}
