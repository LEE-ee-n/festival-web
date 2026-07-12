"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { formatFestivalPeriod } from "@/lib/calendar";
import { supabase } from "@/lib/supabase/client";

type Artist = {
  id: number;
  name: string;
  image_url: string | null;
};

type FestivalSummary = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  location: string | null;
  region: string | null;
  status: string;
};

type ArtistFestivalRow = {
  performance_date: string | null;
  performance_time: string | null;
  stage_name: string | null;
  festivals:
    | FestivalSummary
    | FestivalSummary[]
    | null;
};

export default function ArtistDetailPage() {
  const params = useParams<{ id: string }>();
  const artistId = params.id;

  const [artist, setArtist] = useState<Artist | null>(null);
  const [festivalRows, setFestivalRows] = useState<
    ArtistFestivalRow[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    async function fetchArtist() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [artistResult, festivalsResult] =
          await Promise.all([
            supabase
              .from("artists")
              .select(`
                id,
                name,
                image_url
              `)
              .eq("id", artistId)
              .maybeSingle(),

            supabase
              .from("festival_artists")
              .select(`
                performance_date,
                performance_time,
                stage_name,
                festivals (
                  id,
                  name,
                  start_date,
                  end_date,
                  location,
                  region,
                  status
                )
              `)
              .eq("artist_id", artistId)
              .neq("status", "cancelled")
              .order("performance_date", {
                ascending: true,
                nullsFirst: false,
              }),
          ]);

        if (artistResult.error) {
          throw artistResult.error;
        }

        if (festivalsResult.error) {
          throw festivalsResult.error;
        }

        if (!artistResult.data) {
          throw new Error("아티스트를 찾을 수 없습니다.");
        }

        setArtist(artistResult.data as Artist);

        setFestivalRows(
          (festivalsResult.data || []) as unknown as ArtistFestivalRow[],
        );
      } catch (error) {
        console.error(error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "아티스트 정보를 불러오지 못했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (artistId) {
      void fetchArtist();
    }
  }, [artistId]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl animate-pulse rounded-3xl bg-white p-8 shadow-sm">
          <div className="h-8 w-1/2 rounded bg-slate-200" />
          <div className="mt-8 h-32 rounded bg-slate-100" />
        </div>
      </main>
    );
  }

  if (errorMessage || !artist) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            아티스트 정보를 표시할 수 없습니다.
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            {errorMessage}
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            달력으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← 달력으로 돌아가기
        </Link>

        <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 p-6 sm:p-9">
            <p className="text-sm font-semibold text-slate-400">
              아티스트
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {artist.name}
            </h1>
          </header>

          <div className="p-6 sm:p-9">
            <h2 className="text-lg font-bold text-slate-900">
              출연 페스티벌
            </h2>

            {festivalRows.length === 0 ? (
              <p className="mt-4 text-slate-500">
                등록된 출연 페스티벌이 없습니다.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {festivalRows.map((row, index) => {
                  const festival = Array.isArray(
                    row.festivals,
                  )
                    ? row.festivals[0]
                    : row.festivals;

                  if (!festival) {
                    return null;
                  }

                  return (
                    <Link
                      key={`${festival.id}-${index}`}
                      href={`/festival/${festival.id}`}
                      className="block rounded-2xl border border-slate-200 p-5 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      <h3 className="text-lg font-bold text-slate-900">
                        {festival.name}
                      </h3>

                      <p className="mt-2 text-sm font-medium text-slate-600">
                        {formatFestivalPeriod(
                          festival.start_date,
                          festival.end_date,
                        )}
                      </p>

                      {(festival.location ||
                        festival.region) && (
                        <p className="mt-1 text-sm text-slate-500">
                          {[festival.region, festival.location]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}

                      {(row.performance_date ||
                        row.performance_time ||
                        row.stage_name) && (
                        <p className="mt-3 text-sm text-slate-500">
                          {row.performance_date}

                          {row.performance_time &&
                            ` · ${row.performance_time.slice(0, 5)}`}

                          {row.stage_name &&
                            ` · ${row.stage_name}`}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </article>
    </main>
  );
}