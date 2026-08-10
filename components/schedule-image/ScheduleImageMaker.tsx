"use client";

import Link from "next/link";
import { LogIn, TriangleAlert } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import PersonalFeatureNotice from "@/components/access/PersonalFeatureNotice";
import { useServiceAccess } from "@/components/access/ServiceAccessProvider";
import ScheduleImageCanvas from "@/components/schedule-image/ScheduleImageCanvas";
import ScheduleImageColorSelector from "@/components/schedule-image/ScheduleImageColorSelector";
import ScheduleImageSaveControls from "@/components/schedule-image/ScheduleImageSaveControls";
import ScheduleImageStickerControls from "@/components/schedule-image/ScheduleImageStickerControls";
import { saveScheduleImage } from "@/components/schedule-image/downloadScheduleImage";
import {
  AUTH_RETURN_PATH_KEY,
  normalizeAuthReturnPath,
} from "@/lib/auth/authReturnPath";
import { useScheduleSelection } from "@/lib/hooks/useScheduleSelection";
import { buildScheduleImagePages } from "@/lib/schedule/scheduleImageLayout";
import {
  createRockCatSticker,
  type ScheduleImageSticker,
} from "@/lib/schedule/scheduleImageSticker";
import type { Festival, FestivalArtist } from "@/lib/types";
import type { FestivalCalendarColor } from "@/lib/types";
import { typography } from "@/lib/typography";

type ScheduleImageMakerProps = {
  festival: Festival;
  festivalArtists: FestivalArtist[];
};

function formatDateTab(date: string | null) {
  if (!date) return "날짜 미정";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00+09:00`));
}

function sanitizeFilename(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "_");
}

export default function ScheduleImageMaker({
  festival,
  festivalArtists,
}: ScheduleImageMakerProps) {
  const access = useServiceAccess();
  const svgRef = useRef<SVGSVGElement>(null);
  const scheduleSelection = useScheduleSelection(
    festivalArtists.map((item) => item.id),
  );
  const [activeDate, setActiveDate] = useState<string | null | undefined>();
  const [activePageKey, setActivePageKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState<FestivalCalendarColor>(
    festival.calendar_color ?? "purple",
  );
  const [stickersByPage, setStickersByPage] = useState<
    Record<string, ScheduleImageSticker[]>
  >({});
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  const selectedIds = useMemo(
    () =>
      new Set(
        festivalArtists
          .filter((item) => scheduleSelection.isSelected(item.id))
          .map((item) => item.id),
      ),
    [festivalArtists, scheduleSelection],
  );
  const allPages = useMemo(
    () => buildScheduleImagePages(festivalArtists, selectedIds),
    [festivalArtists, selectedIds],
  );
  const selectedDates = useMemo(
    () =>
      new Set(
        festivalArtists
          .filter((item) => selectedIds.has(item.id))
          .map((item) => item.performance_date),
      ),
    [festivalArtists, selectedIds],
  );
  const pages = allPages.filter((page) => selectedDates.has(page.performanceDate));
  const dates = [...new Set(pages.map((page) => page.performanceDate))];
  const resolvedDate = activeDate === undefined ? dates[0] : activeDate;
  const datePages = pages.filter((page) => page.performanceDate === resolvedDate);
  const activePage =
    datePages.find((page) => page.key === activePageKey) ?? datePages[0];
  const activeStickers = activePage
    ? (stickersByPage[activePage.key] ?? [])
    : [];
  const selectedSticker =
    activeStickers.find((sticker) => sticker.id === selectedStickerId) ?? null;

  function addSticker() {
    if (!activePage) return;

    const sticker = createRockCatSticker(crypto.randomUUID());
    setStickersByPage((current) => ({
      ...current,
      [activePage.key]: [...(current[activePage.key] ?? []), sticker],
    }));
    setSelectedStickerId(sticker.id);
  }

  function updateSticker(sticker: ScheduleImageSticker) {
    if (!activePage) return;

    setStickersByPage((current) => ({
      ...current,
      [activePage.key]: (current[activePage.key] ?? []).map((item) =>
        item.id === sticker.id ? sticker : item,
      ),
    }));
  }

  function deleteSelectedSticker() {
    if (!activePage || !selectedStickerId) return;

    setStickersByPage((current) => ({
      ...current,
      [activePage.key]: (current[activePage.key] ?? []).filter(
        (item) => item.id !== selectedStickerId,
      ),
    }));
    setSelectedStickerId(null);
  }

  function requestLogin() {
    const returnPath = normalizeAuthReturnPath(
      `/festival/${festival.id}/schedule-image`,
    );
    if (returnPath) {
      window.sessionStorage.setItem(AUTH_RETURN_PATH_KEY, returnPath);
    }
    window.location.href = "/login";
  }

  async function handleSave() {
    if (!svgRef.current || !activePage) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const datePart = activePage.performanceDate ?? "날짜미정";
      const pagePart = activePage.pageCount > 1
        ? `_${activePage.pageIndex + 1}of${activePage.pageCount}`
        : "";
      const filename = `${sanitizeFilename(festival.name)}_${datePart}${pagePart}.png`;
      await saveScheduleImage(svgRef.current, filename);
      setSaveMessage("이미지를 만들었습니다.");
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "이미지를 저장하지 못했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (scheduleSelection.isLoading) {
    return <p className="py-20 text-center text-sm text-ink-tertiary">내 일정을 불러오는 중입니다.</p>;
  }

  if (access.isAuthenticated && !access.isLoading && !access.hasPersonalServiceAccess) {
    return <PersonalFeatureNotice />;
  }

  if (!scheduleSelection.isAuthenticated) {
    return (
      <section className="rounded-3xl border border-line bg-surface p-8 text-center">
        <LogIn className="mx-auto h-7 w-7 text-ink-muted" aria-hidden="true" />
        <h2 className={`${typography.subsectionTitle} mt-4 text-ink`}>로그인이 필요합니다</h2>
        <p className={`${typography.bodyCompact} mt-2 text-ink-tertiary`}>선택한 공연을 불러와 개인 시간표 이미지를 만듭니다.</p>
        <button type="button" onClick={requestLogin} className={`${typography.button} mt-5 rounded-xl bg-surface-dark px-5 py-3 text-white`}>
          Google로 로그인
        </button>
      </section>
    );
  }

  if (selectedIds.size === 0 || !activePage) {
    return (
      <section className="rounded-3xl border border-line bg-surface p-8 text-center">
        <h2 className={`${typography.subsectionTitle} text-ink`}>선택한 공연이 없습니다</h2>
        <p className={`${typography.bodyCompact} mt-2 text-ink-tertiary`}>타임테이블에서 보고 싶은 아티스트를 먼저 선택해주세요.</p>
        <Link href={`/festival/${festival.id}`} className={`${typography.button} mt-5 inline-flex rounded-xl border border-line-strong px-5 py-3 text-ink-secondary`}>
          타임테이블로 돌아가기
        </Link>
      </section>
    );
  }

  const conflictCount = activePage.items.filter((item) => item.hasConflict).length;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <h2 className={`${typography.subsectionTitle} text-ink`}>이미지 구성</h2>
          <p className={`${typography.bodyCompact} mt-2 text-ink-tertiary`}>날짜별 9:16 이미지이며 한 장에 무대가 최대 3개 표시됩니다.</p>

          <div className="mt-5">
            <p className={`${typography.metaStrong} mb-2 text-ink-secondary`}>날짜</p>
            <div className="flex flex-wrap gap-2">
              {dates.map((date) => (
                <button
                  key={date ?? "undated"}
                  type="button"
                  onClick={() => {
                    setActiveDate(date);
                    setActivePageKey(null);
                    setSelectedStickerId(null);
                  }}
                  className={`${typography.button} rounded-full border px-4 py-2 ${resolvedDate === date ? "border-festival-purple bg-purple-50 text-festival-purple" : "border-line text-ink-secondary"}`}
                >
                  {formatDateTab(date)}
                </button>
              ))}
            </div>
          </div>

          {datePages.length > 1 && (
            <div className="mt-5">
              <p className={`${typography.metaStrong} mb-2 text-ink-secondary`}>무대 묶음</p>
              <div className="flex flex-wrap gap-2">
                {datePages.map((page) => (
                  <button
                    key={page.key}
                    type="button"
                    onClick={() => {
                      setActivePageKey(page.key);
                      setSelectedStickerId(null);
                    }}
                    className={`${typography.button} rounded-full border px-4 py-2 ${activePage.key === page.key ? "border-festival-purple bg-purple-50 text-festival-purple" : "border-line text-ink-secondary"}`}
                  >
                    {page.pageIndex + 1}/{page.pageCount} · {page.stages.join(" · ")}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ScheduleImageColorSelector
            value={accentColor}
            onChange={setAccentColor}
          />

          <ScheduleImageStickerControls
            stickerCount={activeStickers.length}
            selectedSticker={selectedSticker}
            onAdd={addSticker}
            onDelete={deleteSelectedSticker}
          />

          {conflictCount > 0 && (
            <div className="mt-5 flex gap-3 rounded-xl bg-orange-50 p-4 text-orange-800">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p className={typography.bodyCompact}>
                겹치는 일정이 {conflictCount}개 있습니다.
                <br />
                사진을 저장할 때는 느낌표가 표시되지 않습니다.
              </p>
            </div>
          )}

          <div className="mt-6 hidden lg:block">
            <ScheduleImageSaveControls
              isSaving={isSaving}
              message={saveMessage}
              onSave={() => void handleSave()}
            />
          </div>
        </section>
      </aside>

      <section>
        <div className="mx-auto w-full max-w-[540px] overflow-hidden rounded-[42px] border-[10px] border-ink bg-surface shadow-xl">
          <ScheduleImageCanvas
            ref={svgRef}
            festivalName={festival.name}
            location={festival.location}
            page={activePage}
            accentColor={accentColor}
            stickers={activeStickers}
            selectedStickerId={selectedStickerId}
            onStickerSelect={setSelectedStickerId}
            onStickerChange={updateSticker}
          />
        </div>
        <p className={`${typography.meta} mt-3 text-center text-ink-tertiary`}>미리보기와 동일한 1080 × 1920 PNG로 저장됩니다.</p>
        <div className="mt-5 lg:hidden">
          <ScheduleImageSaveControls
            isSaving={isSaving}
            message={saveMessage}
            onSave={() => void handleSave()}
          />
        </div>
      </section>
    </div>
  );
}
