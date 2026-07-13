"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatFestivalPeriod } from "@/lib/calendar";
import {
  categoryBadgeClasses,
  categoryLabels,
} from "@/lib/categories";
import { supabase } from "@/lib/supabase/client";
import type { Festival } from "@/lib/types";

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
      <aside className="h-fit max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 shadow-sm lg:sticky lg:top-4">
        <div className="sticky top-0 z-10 flex min-h-[80px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-5 backdrop-blur">
          <p className="text-sm font-semibold text-blue-600">
            축제 상세정보
          </p>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            닫기
          </button>
        </div>

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
              <h2 className="text-xl font-bold text-slate-900">
                축제 정보를 표시할 수 없습니다.
              </h2>

              <p className="mt-3 text-sm text-slate-500">
                {errorMessage}
              </p>
            </div>
          </div>
        ) : (
          <article className="bg-white">
            <div>
              <header className="px-6 pt-4 pb-3">
                <span
                  className={[
                    "inline-flex rounded-full border px-3 py-1 text-sm font-medium",
                    categoryBadgeClasses[festival.category],
                  ].join(" ")}
                >
                  {categoryLabels[festival.category]}
                </span>

                <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-slate-950">
                  {festival.name}
                </h1>
              </header>

              <div className="space-y-8 p-6 sm:p-8">
                <dl className="space-y-3">
                  <div className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-3 text-base">
                    <dt className="text-slate-400">
                      기간
                    </dt>
                    <dd className="font-semibold text-slate-800">
                      {formatFestivalPeriod(
                        festival.start_date,
                        festival.end_date,
                      )}
                    </dd>
                  </div>

                  <div className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-3 text-base">
                    <dt className="text-slate-400">
                      장소
                    </dt>
                    <dd className="font-semibold text-slate-800">
                      {festival.location || "장소 확인 중"}
                    </dd>
                  </div>

                  <div className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-3 text-base">
                    <dt className="text-slate-400">
                      주소
                    </dt>
                    <dd className="break-words font-semibold text-slate-800">
                      {festival.address || "주소 확인 중"}
                    </dd>
                  </div>

                  <div className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-3 text-base">
                    <dt className="text-slate-400">
                      지역
                    </dt>
                    <dd className="font-semibold text-slate-800">
                      {festival.region || "지역 확인 중"}
                    </dd>
                  </div>

                  {festival.price_type && (
                    <div className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-3 text-base">
                      <dt className="text-slate-400">
                        요금
                      </dt>
                      <dd className="font-semibold text-slate-800">
                        {festival.price_type === "free" && "무료"}
                        {festival.price_type === "paid" && "유료"}
                        {festival.price_type === "partial_free" &&
                          "부분 무료"}
                        {festival.price_type === "unknown" &&
                          "확인 필요"}
                      </dd>
                    </div>
                  )}

                  {festival.price_info && (
                    <div className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-3 text-base">
                      <dt className="text-slate-400">
                        가격
                      </dt>
                      <dd className="break-words font-semibold text-slate-800">
                        {festival.price_info}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="pt-2">
                  <div className="border-b border-slate-200" />
                </div>
 
                {festivalArtists.length > 0 && (
                  <section>
                    <h2 className="flex items-center justify-center gap-2 text-lg font-bold text-slate-900">
                      <span className="text-lg text-slate-400">
                        ♪
                      </span>

                      <span>출연진</span>
                    </h2>

                    <div className="mt-4 space-y-5">
                      {Object.entries(artistsByDateAndStage).map(
                        ([date, stageGroups]) => (
                          <div key={date}>
                            <h3 className="mt-1 inline-flex rounded-full bg-slate-800 px-3 py-1.5 text-sm font-bold text-white">
                              {date === "날짜 미정"
                                ? date
                                : new Intl.DateTimeFormat("ko-KR", {
                                    timeZone: "Asia/Seoul",
                                    month: "long",
                                    day: "numeric",
                                    weekday: "short",
                                  }).format(
                                    new Date(
                                      `${date}T00:00:00+09:00`,
                                    ),
                                  )}
                            </h3>

                            <div className="mt-4 space-y-5">
                              {Object.entries(stageGroups).map(
                                ([stage, artists]) => (
                                  <div key={stage}>
                                    <h4 className="flex overflow-hidden rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
                                      <span className="w-3.5 shrink-0 bg-indigo-500" />

                                      <span className="flex-1 px-3 py-3">
                                        {stage}
                                      </span>
                                    </h4>

                                    <div className="mt-1 divide-y divide-slate-300">
                                          {artists.map((item) => {
                                        const artist = Array.isArray(
                                          item.artists,
                                        )
                                          ? item.artists[0]
                                          : item.artists;

                                        return (
                                          <div
                                              key={item.artist_id}
                                              className="flex items-center justify-between gap-3 px-5 py-3"
                                            >
                                            <div>
                                              {artist ? (
                                                <Link
                                                  href={`/artist/${artist.id}`}
                                                  className="font-semibold text-slate-900 hover:text-blue-600 hover:underline"
                                                >
                                                  {artist.name}
                                                </Link>
                                              ) : (
                                                <p className="font-semibold text-slate-900">
                                                  아티스트 정보 없음
                                                </p>
                                              )}
                                            </div>

                                            {(item.performance_time ||
                                              item.performance_end_time) && (
                                              <span className="shrink-0 font-mono text-base font-medium text-indigo-600">
                                                {item.performance_time
                                                  ? item.performance_time.slice(
                                                      0,
                                                      5,
                                                    )
                                                  : "시작 미정"}

                                                {item.performance_end_time &&
                                                  ` ~ ${item.performance_end_time.slice(0, 5)}`}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </section>
                )}

                {festival.program_info && (
                  <section>
                    <h2 className="text-lg font-bold text-slate-900">
                      프로그램
                    </h2>
                    <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
                      {festival.program_info}
                    </p>
                  </section>
                )}

                {latestTicketRounds.length > 0 && (
  <section>
    <div className="pt-2">
      <div className="border-b border-slate-200" />
    </div>

    <h2 className="mt-4 flex items-center justify-center gap-2 text-lg font-bold text-slate-900">
      <span className="text-sm text-slate-400">
        ♫
      </span>

      <span>티켓 안내</span>
    </h2>

    <div className="mt-4">
      <h3 className="flex overflow-hidden rounded-xl bg-emerald-50 text-sm font-bold text-slate-700">
      <span className="w-3.5 shrink-0 bg-teal-500" />

      <span className="flex-1 px-3 py-3">
        {latestTicketRounds[0].round_name}
      </span>
    </h3>

      <div className="mt-2 px-3">
                      {latestOpenAt &&
                        new Date(latestOpenAt).getTime() >
                          Date.now() && (
                          <p className="mt-3 font-semibold text-slate-800">
                            {formatTicketOpenAt(latestOpenAt)}
                          </p>
                        )}

                      {latestTicketRounds[0].price_info && (
                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                          {latestTicketRounds[0].price_info}
                        </p>
                      )}

                      {latestOpenAt &&
                      new Date(latestOpenAt).getTime() <=
                        Date.now() ? (
                        <div
                          className={[
                            "mt-4 grid gap-2",
                            latestTicketRounds.filter((round) => round.ticket_url)
                              .length === 1
                              ? "grid-cols-1"
                              : latestTicketRounds.filter((round) => round.ticket_url)
                                    .length === 2
                                ? "grid-cols-2"
                                : "grid-cols-3",
                          ].join(" ")}
                        >
                          {latestTicketRounds
                            .filter((round) => round.ticket_url)
                            .map((round) => (
                              <a
                                key={round.id}
                                href={round.ticket_url || "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="flex w-full items-center justify-center rounded-xl bg-slate-800 px-3 py-3 text-center text-sm font-semibold text-white hover:bg-slate-700"
                              >
                                {round.ticket_platform || "예매하기"}
                              </a>
                            ))}
                        </div>
                      ) : null}
                    </div>
                    </div>
                  </section>
                )}

                {festival.official_url && (
                  <section>
                    <a
                      href={festival.official_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"

                    >
                      공식 홈페이지
                    </a>
                  </section>
                )}
              </div>
            </div>
          </article>
        )}
      </aside>
  );
}
