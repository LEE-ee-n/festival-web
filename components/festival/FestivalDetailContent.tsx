"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getCurrentAdminAccess } from "@/lib/auth/getCurrentAdminAccess";
import { formatFestivalPeriod } from "@/lib/calendar";
import {
  categoryBadgeClasses,
  categoryLabels,
} from "@/lib/categories";
import FestivalTimetable from "@/components/festival/FestivalTimetable";
import { groupArtistsByDateAndStage } from "@/lib/festivals/artistScheduleGroups";
import {
  getLatestTicketRoundGroup,
  getOpenTicketLinks,
} from "@/lib/festivals/ticketDisplay";
import { useCurrentTimeAt } from "@/lib/hooks/useCurrentTimeAt";
import { typography } from "@/lib/typography";
import type {
  Festival,
  FestivalArtist,
  FestivalTicketRound,
} from "@/lib/types";

type FestivalDetailContentProps = {
  festival: Festival;
  festivalArtists: FestivalArtist[];
  ticketRounds: FestivalTicketRound[];
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

export default function FestivalDetailContent({
  festival,
  festivalArtists,
  ticketRounds,
}: FestivalDetailContentProps) {
  const [isAdmin, setIsAdmin] = useState(false);

  const {
    latestOpenAt,
    latestTicketRounds,
    ticketInfo: latestTicketInfo,
  } = getLatestTicketRoundGroup(ticketRounds);

  const currentTime = useCurrentTimeAt(latestOpenAt);
  const ticketLinks = getOpenTicketLinks(
    latestTicketRounds,
    latestOpenAt,
    currentTime,
  );

  useEffect(() => {
    async function checkAdminSession() {
      const { isAdmin: hasAdminAccess } =
        await getCurrentAdminAccess();

      setIsAdmin(hasAdminAccess);
    }

    void checkAdminSession();
  }, []);

  const uniqueArtists = Array.from(
    new Map(
      festivalArtists.map((item) => {
        const artist = Array.isArray(item.artists)
          ? item.artists[0]
          : item.artists;
        return [item.artist_id, artist];
      }),
    ).values(),
  );

  const artistsByDateAndStage =
    groupArtistsByDateAndStage(festivalArtists);

  return (
    <main className="min-h-screen bg-surface px-4 py-8 sm:py-12">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/"
          className={`${typography.metaStrong} text-ink-tertiary hover:text-ink`}
        >
          ← 달력으로 돌아가기
        </Link>

        <div className="mt-5 overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
          <header className="border-b border-line p-6 sm:p-9">
            <span
              className={[
                `${typography.metaStrong} inline-flex rounded-full border px-3 py-1`,
                categoryBadgeClasses[festival.category],
              ].join(" ")}
            >
              {categoryLabels[festival.category]}
            </span>

            <h1 className={`${typography.pageTitle} mt-5 text-ink`}>
              {festival.name}
            </h1>
            {isAdmin && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/admin/festivals/${festival.id}/lineup`}
                  className={`${typography.button} rounded-lg bg-surface-dark px-4 py-2 text-white`}
                >
                  페스티벌 기본정보·라인업·티켓 관리
                </Link>

                <Link
                  href="/admin/festivals"
                  className={`${typography.button} rounded-lg border border-line-strong px-4 py-2 text-ink-secondary`}
                >
                  페스티벌 목록
                </Link>
              </div>
            )}
          </header>

          <div className="space-y-8 p-6 sm:p-9">
            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className={`${typography.metaStrong} text-ink-muted`}>
                  기간
                </dt>

                <dd className={`${typography.value} mt-1 text-ink`}>
                  {formatFestivalPeriod(
                    festival.start_date,
                    festival.end_date,
                  )}
                </dd>
              </div>

              <div>
                <dt className={`${typography.metaStrong} text-ink-muted`}>
                  장소
                </dt>

                <dd className={`${typography.value} mt-1 text-ink`}>
                  {festival.location || "장소 확인 중"}
                </dd>
              </div>

              {festival.address && (
                <div>
                  <dt className={`${typography.metaStrong} text-ink-muted`}>
                    주소
                  </dt>

                  <dd className={`${typography.value} mt-1 text-ink`}>
                    {festival.address}
                  </dd>
                </div>
              )}

              {festival.region && (
                <div>
                  <dt className={`${typography.metaStrong} text-ink-muted`}>
                    지역
                  </dt>

                  <dd className={`${typography.value} mt-1 text-ink`}>
                    {festival.region}
                  </dd>
                </div>
              )}

              {festival.price_type && (
                <div>
                  <dt className={`${typography.metaStrong} text-ink-muted`}>
                    요금 구분
                  </dt>

                  <dd className={`${typography.value} mt-1 text-ink`}>
                    {festival.price_type === "free" && "무료"}
                    {festival.price_type === "paid" && "유료"}
                    {festival.price_type === "partial_free" && "부분 무료"}
                    {festival.price_type === "unknown" && "확인 필요"}
                  </dd>
                </div>
              )}

              {festival.price_info && (
                <div>
                  <dt className={`${typography.metaStrong} text-ink-muted`}>
                    가격 정보
                  </dt>

                  <dd className={`${typography.value} mt-1 text-ink`}>
                    {festival.price_info}
                  </dd>
                </div>
              )}
            </dl>

            <section>
              <h2 className={`${typography.metaStrong} text-ink-muted`}>
                축제 소개
              </h2>

              <p className={`${typography.value} mt-1 whitespace-pre-line leading-7 text-ink`}>
                {festival.description ||
                  "등록된 상세 설명이 없습니다."}
              </p>
            </section>

            {festivalArtists.length > 0 ? (
              festival.timetable_status === "unpublished" ? (
                <section>
                  <h2 className={`${typography.sectionTitle} text-ink`}>
                    출연진
                  </h2>

                  <p className={`${typography.label} mt-2 text-ink-tertiary`}>
                    이 페스티벌의 타임테이블은 아직 공개되지 않았습니다.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {uniqueArtists.map((artist) => artist ? (
                      <Link
                        key={artist.id}
                        href={`/artist/${artist.id}`}
                        className={`${typography.label} rounded-full border border-line bg-surface px-3 py-2 text-ink`}
                      >
                        {artist.name}
                      </Link>
                    ) : null)}
                  </div>
                </section>
              ) : (
                <FestivalTimetable
                  artistsByDateAndStage={artistsByDateAndStage}
                  artistCount={festivalArtists.length}
                  layout="page"
                />
              )
            ) : (
              <section>
                <h2 className={`${typography.sectionTitle} text-ink`}>
                  출연진
                </h2>

                <p className={`${typography.label} mt-2 text-ink-tertiary`}>
                  등록된 출연진 정보가 없습니다.
                </p>
              </section>
            )}

            {festival.program_info && (
              <section>
                <h2 className={`${typography.metaStrong} text-ink-muted`}>
                  프로그램
                </h2>

                <p className={`${typography.value} mt-1 whitespace-pre-line leading-7 text-ink`}>
                  {festival.program_info}
                </p>
              </section>
            )}


            {latestTicketRounds.length > 0 && (
              <section>
                <h2 className={`${typography.sectionTitle} text-ink`}>
                  티켓 안내
                </h2>

                <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
                  {latestTicketInfo && (
                    <div className="mt-3 rounded-xl bg-surface p-4">
                      <h3 className={`${typography.subsectionTitle} text-ink`}>
                        {latestTicketInfo.round_name}
                      </h3>

                      {latestOpenAt && (
                        <p className={`${typography.label} mt-2 text-ink-secondary`}>
                          {formatTicketOpenAt(latestOpenAt)}
                        </p>
                      )}

                      {latestTicketInfo.price_info && (
                        <p className={`${typography.bodyCompact} mt-2 whitespace-pre-line text-ink-secondary`}>
                          {latestTicketInfo.price_info}
                        </p>
                      )}
                    </div>
                  )}

                  {ticketLinks.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {ticketLinks.map((round) => (
                          <a
                            key={round.id}
                            href={round.ticket_url || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className={`${typography.button} rounded-xl bg-surface-dark px-4 py-2.5 text-white hover:bg-surface-dark/90`}
                          >
                            {round.ticket_platform || "예매하기"}
                          </a>
                        ))}
                    </div>
                  ) : null}
                </div>
              </section>
            )}

            {(festival.instagram_url || festival.official_url) && (
              <section>
                <h2 className={`${typography.metaStrong} text-ink-muted`}>
                  공식 링크
                </h2>

                <div className="mt-2 flex flex-col gap-3">
                  {festival.instagram_url && (
                    <a
                      href={festival.instagram_url}
                      target="_blank"
                      rel="noreferrer"
                      className={`${typography.button} flex w-full items-center justify-center rounded-xl border border-line px-4 py-2.5 text-ink-secondary hover:bg-surface-subtle`}
                    >
                      인스타그램
                    </a>
                  )}

                  {festival.official_url && (
                    <a
                      href={festival.official_url}
                      target="_blank"
                      rel="noreferrer"
                      className={`${typography.button} flex w-full items-center justify-center rounded-xl border border-line px-4 py-2.5 text-ink-secondary hover:bg-surface-subtle`}
                    >
                      공식 홈페이지
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </article>
    </main>
  );
}
