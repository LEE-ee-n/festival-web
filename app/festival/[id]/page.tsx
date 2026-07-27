"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import FestivalTimetable from "@/components/festival/FestivalTimetable";
import { formatFestivalPeriod } from "@/lib/calendar";
import {
  categoryBadgeClasses,
  categoryLabels,
} from "@/lib/categories";
import { getCurrentAdminAccess } from "@/lib/auth/getCurrentAdminAccess";
import { useCurrentTimeAt } from "@/lib/hooks/useCurrentTimeAt";
import { useFestivalDetail } from "@/lib/hooks/useFestivalDetail";
import {
  getLatestTicketRoundGroup,
  getOpenTicketLinks,
} from "@/lib/festivals/ticketDisplay";
import { typography } from "@/lib/typography";

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

export default function FestivalDetailPage() {
  const params = useParams<{ id: string }>();
  const festivalId = params.id;

  const {
    festival,
    festivalArtists,
    ticketRounds,
    artistsByDateAndStage,
    isLoading,
    errorMessage,
  } = useFestivalDetail(festivalId);
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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white px-4 py-10">
        <div className="mx-auto max-w-3xl animate-pulse rounded-3xl bg-white p-8 shadow-sm">
          <div className="h-8 w-2/3 rounded bg-slate-200" />
          <div className="mt-6 h-5 w-1/2 rounded bg-slate-100" />
          <div className="mt-10 h-32 rounded bg-slate-100" />
        </div>
      </main>
    );
  }

  if (errorMessage || !festival) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className={`${typography.articleSectionTitle} text-slate-900`}>
            축제 정보를 표시할 수 없습니다.
          </h1>

          <p className={`${typography.body} mt-3 text-slate-500`}>
            {errorMessage}
          </p>

          <Link
            href="/"
            className={`${typography.button} mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-white`}
          >
            달력으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:py-12">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/"
          className={`${typography.metaStrong} text-slate-500 hover:text-slate-900`}
        >
          ← 달력으로 돌아가기
        </Link>

        <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 p-6 sm:p-9">
            <span
              className={[
                `${typography.metaStrong} inline-flex rounded-full border px-3 py-1`,
                categoryBadgeClasses[festival.category],
              ].join(" ")}
            >
              {categoryLabels[festival.category]}
            </span>

            <h1 className={`${typography.pageTitle} mt-5 text-slate-950`}>
              {festival.name}
            </h1>
            {isAdmin && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/admin/festivals/${festival.id}/lineup`}
                  className={`${typography.button} rounded-lg bg-slate-900 px-4 py-2 text-white`}
                >
                  페스티벌 기본정보·라인업·티켓 관리
                </Link>

                <Link
                  href="/admin/festivals"
                  className={`${typography.button} rounded-lg border border-slate-300 px-4 py-2 text-slate-700`}
                >
                  페스티벌 목록
                </Link>
              </div>
            )}
          </header>

          <div className="space-y-8 p-6 sm:p-9">
            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className={`${typography.metaStrong} text-slate-400`}>
                  기간
                </dt>

                <dd className={`${typography.value} mt-1 text-slate-800`}>
                  {formatFestivalPeriod(
                    festival.start_date,
                    festival.end_date,
                  )}
                </dd>
              </div>

              <div>
                <dt className={`${typography.metaStrong} text-slate-400`}>
                  장소
                </dt>

                <dd className={`${typography.value} mt-1 text-slate-800`}>
                  {festival.location || "장소 확인 중"}
                </dd>
              </div>

              {festival.address && (
                <div>
                  <dt className={`${typography.metaStrong} text-slate-400`}>
                    주소
                  </dt>

                  <dd className={`${typography.value} mt-1 text-slate-800`}>
                    {festival.address}
                  </dd>
                </div>
              )}

              {festival.region && (
                <div>
                  <dt className={`${typography.metaStrong} text-slate-400`}>
                    지역
                  </dt>

                  <dd className={`${typography.value} mt-1 text-slate-800`}>
                    {festival.region}
                  </dd>
                </div>
              )}

              {festival.price_type && (
                <div>
                  <dt className={`${typography.metaStrong} text-slate-400`}>
                    요금 구분
                  </dt>

                  <dd className={`${typography.value} mt-1 text-slate-800`}>
                    {festival.price_type === "free" && "무료"}
                    {festival.price_type === "paid" && "유료"}
                    {festival.price_type === "partial_free" && "부분 무료"}
                    {festival.price_type === "unknown" && "확인 필요"}
                  </dd>
                </div>
              )}

              {festival.price_info && (
                <div>
                  <dt className={`${typography.metaStrong} text-slate-400`}>
                    가격 정보
                  </dt>

                  <dd className={`${typography.value} mt-1 text-slate-800`}>
                    {festival.price_info}
                  </dd>
                </div>
              )}
            </dl>

            <section>
              <h2 className={`${typography.metaStrong} text-slate-400`}>
                축제 소개
              </h2>

              <p className={`${typography.value} mt-1 whitespace-pre-line leading-7 text-slate-800`}>
                {festival.description ||
                  "등록된 상세 설명이 없습니다."}
              </p>
            </section>

            {festivalArtists.length > 0 &&
              (festival.timetable_status === "unpublished" ? (
                <section>
                  <h2 className={`${typography.sectionTitle} text-slate-900`}>
                    출연진
                  </h2>

                  <p className={`${typography.label} mt-2 text-slate-500`}>
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
                        className={`${typography.label} rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-800`}
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
              ))}

            {festival.program_info && (
              <section>
                <h2 className={`${typography.metaStrong} text-slate-400`}>
                  프로그램
                </h2>

                <p className={`${typography.value} mt-1 whitespace-pre-line leading-7 text-slate-800`}>
                  {festival.program_info}
                </p>
              </section>
            )}


            {latestTicketRounds.length > 0 && (
              <section>
                <h2 className={`${typography.sectionTitle} text-slate-900`}>
                  티켓 안내
                </h2>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                  {latestTicketInfo && (
                    <div className="mt-3 rounded-xl bg-white p-4">
                      <h3 className={`${typography.subsectionTitle} text-slate-900`}>
                        {latestTicketInfo.round_name}
                      </h3>

                      {latestOpenAt && (
                        <p className={`${typography.label} mt-2 text-slate-700`}>
                          {formatTicketOpenAt(latestOpenAt)}
                        </p>
                      )}

                      {latestTicketInfo.price_info && (
                        <p className={`${typography.bodyCompact} mt-2 whitespace-pre-line text-slate-600`}>
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
                            className={`${typography.button} rounded-xl bg-slate-900 px-4 py-2.5 text-white hover:bg-slate-700`}
                          >
                            {round.ticket_platform || "예매하기"}
                          </a>
                        ))}
                    </div>
                  ) : null}
                </div>
              </section>
            )}

            <section className="flex flex-wrap gap-3">
              {festival.official_url && (
                <a
                  href={festival.official_url}
                  target="_blank"
                  rel="noreferrer"
                  className={`${typography.button} rounded-xl border border-slate-200 px-4 py-2.5 text-slate-700 hover:bg-slate-50`}
                >
                  공식 홈페이지
                </a>
              )}

              
            </section>
          </div>
        </div>
      </article>
    </main>
  );
}
