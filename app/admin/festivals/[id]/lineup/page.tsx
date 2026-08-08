"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import AdminBackLink from "@/components/admin/AdminBackLink";
import AdminNotice from "@/components/admin/AdminNotice";
import TimetableVisibilityToggle from "@/components/admin/TimetableVisibilityToggle";
import ArtistLineupTable from "./components/ArtistLineupTable";
import ArtistAddSection from "./components/ArtistAddSection";
import BasicInfoTab from "./components/BasicInfoTab";
import TicketTab from "./components/TicketTab";
import AuditHistoryTab from "./components/AuditHistoryTab";
import LineupWorkPanel from "./components/LineupWorkPanel";
import { useFestivalArtists } from "./hooks/useFestivalArtists";
import {
  useFestivalBasicInfo,
} from "./hooks/useFestivalBasicInfo";
import { useFestivalTickets } from "./hooks/useFestivalTickets";
import { getFestivalLineupData } from "@/lib/festivals/getFestivalLineupData";

type AdminTab = "basic" | "lineup" | "ticket" | "history";

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: "basic", label: "기본정보 관리" },
  { id: "lineup", label: "라인업 관리" },
  { id: "ticket", label: "티켓 관리" },
];

tabs.push({ id: "history", label: "변경 기록" });

export default function FestivalLineupAdminPage() {
  const params = useParams<{ id: string }>();
  const festivalId = Number(params.id);
  const [activeTab, setActiveTab] = useState<AdminTab>("lineup");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null,
  );
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!errorMessage) return;
    window.requestAnimationFrame(() => {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      errorRef.current?.focus({ preventScroll: true });
    });
  }, [errorMessage]);

  const basicInfo = useFestivalBasicInfo(
    festivalId,
    setErrorMessage,
  );
  const artists = useFestivalArtists(
    festivalId,
    setErrorMessage,
    basicInfo.startDate,
    basicInfo.endDate,
  );
  const tickets = useFestivalTickets(festivalId, setErrorMessage);

  const { initializeBasicInfo } = basicInfo;
  const { initializeArtists } = artists;
  const { initializeTickets } = tickets;

  useEffect(() => {
    let isCancelled = false;

    async function loadLineup() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await getFestivalLineupData(festivalId);

        if (isCancelled) {
          return;
        }

        initializeBasicInfo(data.festival);
        initializeArtists(data.lineup);
        initializeTickets(data.ticketRounds);
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "축제 관리 정보를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadLineup();

    return () => {
      isCancelled = true;
    };
  }, [
    festivalId,
    initializeArtists,
    initializeBasicInfo,
    initializeTickets,
  ]);

  return (
    <main className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <AdminBackLink
          href="/admin/festivals"
          label="← 페스티벌 관리로 돌아가기"
        />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink-secondary">
              관리자
            </p>
            <h1 className="mt-2 text-3xl font-bold text-ink">
              페스티벌 관리
            </h1>
            <p className="mt-2 text-ink-tertiary">
              {basicInfo.festivalName}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/festival-updates"
              className="rounded-xl bg-surface-dark px-4 py-2.5 text-sm font-semibold text-white"
            >
              기존 수정 작업함
            </Link>
            <Link
              href={`/festival/${festivalId}`}
              className="rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-sm font-semibold text-ink-secondary"
            >
              상세 페이지로 돌아가기
            </Link>
          </div>
        </div>

        <div className="mt-8 flex gap-2 border-b border-line">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "border-b-2 px-5 py-3 text-sm font-semibold",
                activeTab === tab.id
                  ? "border-surface-dark text-ink"
                  : "border-transparent text-ink-tertiary",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AdminNotice
          message={errorMessage}
          noticeRef={errorRef}
          className="mt-6"
        />

        {activeTab === "basic" && (
          <>
            <BasicInfoTab {...basicInfo.tabProps} />
          </>
        )}

        {activeTab === "lineup" && (
          <>
            <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-surface p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-ink">
                  타임테이블 공개 상태
                </h2>
                <p className="mt-1 text-sm text-ink-tertiary">
                  공개 상세 화면의 타임테이블 표시를 즉시 변경합니다.
                </p>
              </div>
              <TimetableVisibilityToggle
                value={basicInfo.timetableStatus}
                disabled={basicInfo.isSavingTimetableStatus}
                onChange={(value) => void basicInfo.saveTimetableStatus(value)}
              />
            </section>
            <LineupWorkPanel {...artists.workPanelProps} />
            <ArtistAddSection
              {...artists.addSectionProps}
              festivalStartDate={basicInfo.startDate}
              festivalEndDate={basicInfo.endDate}
            />
            <ArtistLineupTable
              {...artists.tableProps}
              isLoading={isLoading}
              festivalStartDate={basicInfo.startDate}
              festivalEndDate={basicInfo.endDate}
            />
            <button
              type="button"
              onClick={artists.workPanelProps.saveLineupWork}
              disabled={artists.workPanelProps.isSavingWork || artists.workPanelProps.pendingCount === 0}
              className="mt-8 w-full rounded-xl bg-surface-dark px-4 py-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {artists.workPanelProps.isSavingWork
                ? "저장 중..."
                : `미저장 변경사항 전체 저장 (${artists.workPanelProps.pendingCount}건)`}
            </button>
          </>
        )}

        {activeTab === "ticket" && (
          <>
            <TicketTab {...tickets.tabProps} />
          </>
        )}

        {activeTab === "history" && (
          <AuditHistoryTab festivalId={festivalId} />
        )}
      </div>
    </main>
  );
}
