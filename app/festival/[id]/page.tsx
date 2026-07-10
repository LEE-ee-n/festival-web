"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { formatFestivalPeriod } from "@/lib/calendar";
import {
  categoryBadgeClasses,
  categoryLabels,
} from "@/lib/categories";
import { supabase } from "@/lib/supabase/client";
import type { Festival } from "@/lib/types";

export default function FestivalDetailPage() {
  const params = useParams<{ id: string }>();
  const festivalId = params.id;

  const [festival, setFestival] = useState<Festival | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    async function fetchFestival() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const { data, error } = await supabase
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
            ticket_url,
            ticket_platform,
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
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error("축제를 찾을 수 없습니다.");
        }

        setFestival(data as Festival);
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

    if (festivalId) {
      void fetchFestival();
    }
  }, [festivalId]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
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
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            축제 정보를 표시할 수 없습니다.
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
            <span
              className={[
                "inline-flex rounded-full border px-3 py-1 text-sm font-medium",
                categoryBadgeClasses[festival.category],
              ].join(" ")}
            >
              {categoryLabels[festival.category]}
            </span>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {festival.name}
            </h1>
          </header>

          <div className="space-y-8 p-6 sm:p-9">
            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-slate-400">
                  기간
                </dt>

                <dd className="mt-1 font-semibold text-slate-800">
                  {formatFestivalPeriod(
                    festival.start_date,
                    festival.end_date,
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-slate-400">
                  장소
                </dt>

                <dd className="mt-1 font-semibold text-slate-800">
                  {festival.location || "장소 확인 중"}
                </dd>
              </div>

              {festival.address && (
                <div>
                  <dt className="text-sm font-medium text-slate-400">
                    주소
                  </dt>

                  <dd className="mt-1 font-semibold text-slate-800">
                    {festival.address}
                  </dd>
                </div>
              )}

              {festival.region && (
                <div>
                  <dt className="text-sm font-medium text-slate-400">
                    지역
                  </dt>

                  <dd className="mt-1 font-semibold text-slate-800">
                    {festival.region}
                  </dd>
                </div>
              )}

              {festival.price_type && (
                <div>
                  <dt className="text-sm font-medium text-slate-400">
                    요금 구분
                  </dt>

                  <dd className="mt-1 font-semibold text-slate-800">
                    {festival.price_type === "free" && "무료"}
                    {festival.price_type === "paid" && "유료"}
                    {festival.price_type === "partial_free" && "부분 무료"}
                    {festival.price_type === "unknown" && "확인 필요"}
                  </dd>
                </div>
              )}

              {festival.price_info && (
                <div>
                  <dt className="text-sm font-medium text-slate-400">
                    가격 정보
                  </dt>

                  <dd className="mt-1 font-semibold text-slate-800">
                    {festival.price_info}
                  </dd>
                </div>
              )}
            </dl>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                축제 소개
              </h2>

              <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
                {festival.description ||
                  "등록된 상세 설명이 없습니다."}
              </p>
            </section>

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

            <section className="flex flex-wrap gap-3">
              {festival.official_url && (
                <a
                  href={festival.official_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  공식 홈페이지
                </a>
              )}

              {festival.ticket_url && (
                <a
                  href={festival.ticket_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  예매하기
                </a>
              )}
            </section>
          </div>
        </div>
      </article>
    </main>
  );
}