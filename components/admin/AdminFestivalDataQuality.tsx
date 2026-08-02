"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  createFestivalDataQualityReport,
  FESTIVAL_DATA_QUALITY_ISSUES,
  type FestivalDataQualityFestival,
  type FestivalDataQualityIssue,
} from "@/lib/festivals/festivalDataQuality";
import { supabase } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/errorMessage";

type SelectedIssue = "all" | FestivalDataQualityIssue;

export default function AdminFestivalDataQuality() {
  const [festivals, setFestivals] = useState<
    FestivalDataQualityFestival[]
  >([]);
  const [selectedIssue, setSelectedIssue] =
    useState<SelectedIssue>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let isCancelled = false;

    async function loadFestivals() {
      try {
        const { data, error } = await supabase
          .from("festivals")
          .select(`
            id,
            name,
            start_date,
            end_date,
            status,
            instagram_url,
            instagram_url_unavailable,
            official_url,
            official_url_unavailable,
            thumbnail_url,
            location,
            address,
            price_type
          `)
          .order("start_date", { ascending: true });

        if (error) throw error;

        if (!isCancelled) {
          setFestivals(data ?? []);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(getSupabaseErrorMessage(
            error,
            "데이터 점검 정보를 불러오지 못했습니다.",
          ));
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    void loadFestivals();

    return () => {
      isCancelled = true;
    };
  }, []);

  const report = useMemo(
    () => createFestivalDataQualityReport(festivals),
    [festivals],
  );
  const filteredItems = useMemo(
    () => selectedIssue === "all"
      ? report.items
      : report.items.filter((item) =>
          item.issues.includes(selectedIssue),
        ),
    [report.items, selectedIssue],
  );
  const issueLabels = useMemo(
    () => new Map(
      FESTIVAL_DATA_QUALITY_ISSUES.map((issue) => [
        issue.key,
        issue.label,
      ]),
    ),
    [],
  );

  return (
    <section className="mb-8 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-xl font-bold text-ink">데이터 점검</h2>
        <p className="mt-1 text-sm text-ink-tertiary">
          예정·진행 중 페스티벌의 누락 정보를 확인합니다.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-5 text-sm text-ink-tertiary">불러오는 중...</p>
      ) : errorMessage ? (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <button
              type="button"
              onClick={() => setSelectedIssue("all")}
              className={`rounded-xl border px-3 py-3 text-left ${
                selectedIssue === "all"
                  ? "border-ink bg-surface-subtle"
                  : "border-line bg-surface"
              }`}
            >
              <span className="block text-xs text-ink-tertiary">전체 확인 필요</span>
              <strong className="mt-1 block text-lg text-ink">{report.items.length}개</strong>
            </button>

            {FESTIVAL_DATA_QUALITY_ISSUES.map((issue) => (
              <button
                key={issue.key}
                type="button"
                onClick={() => setSelectedIssue(issue.key)}
                className={`rounded-xl border px-3 py-3 text-left ${
                  selectedIssue === issue.key
                    ? "border-ink bg-surface-subtle"
                    : "border-line bg-surface"
                }`}
              >
                <span className="block text-xs text-ink-tertiary">{issue.label}</span>
                <strong className="mt-1 block text-lg text-ink">{report.counts[issue.key]}개</strong>
              </button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <p className="mt-5 rounded-xl bg-surface-subtle p-4 text-sm text-ink-secondary">
              해당 조건에서 확인할 페스티벌이 없습니다.
            </p>
          ) : (
            <div className="mt-5 divide-y divide-line rounded-xl border border-line">
              {filteredItems.map((festival) => (
                <div
                  key={festival.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{festival.name}</p>
                    <p className="mt-1 text-xs text-ink-tertiary">
                      {festival.start_date === festival.end_date
                        ? festival.start_date
                        : `${festival.start_date} ~ ${festival.end_date}`}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {festival.issues.map((issue) => (
                        <span
                          key={issue}
                          className="rounded-md border border-line-strong px-2 py-1 text-xs text-ink-secondary"
                        >
                          {issueLabels.get(issue)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/admin/festivals/${festival.id}/lineup`}
                    className="shrink-0 rounded-lg border border-line-strong px-3 py-2 text-center text-xs font-semibold text-ink-secondary"
                  >
                    관리
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
