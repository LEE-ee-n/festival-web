import FestivalDetailDrawer from "@/components/FestivalDetailDrawer";
import FestivalList from "@/components/FestivalList";
import FestivalPanelHeader from "@/components/festival/FestivalPanelHeader";
import type { Festival } from "@/lib/types";
import { useEffect, useRef } from "react";

type FestivalSidePanelProps = {
  isOpen: boolean;
  hasListContext: boolean;
  dateText: string;
  festivals: Festival[];
  selectedFestival: Festival | null;
  isLoading: boolean;
  onSelectFestival: (festival: Festival) => void;
  onBackToList: () => void;
  onClose: () => void;
};

export default function FestivalSidePanel({
  isOpen,
  hasListContext,
  dateText,
  festivals,
  selectedFestival,
  isLoading,
  onSelectFestival,
  onBackToList,
  onClose,
}: FestivalSidePanelProps) {
  const contentScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentScrollRef.current?.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, [selectedFestival]);

  const handleHeaderClose = () => {
    if (selectedFestival && hasListContext) {
      onBackToList();
      return;
    }

    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* 모바일 배경 */}
      <button
        type="button"
        aria-label="패널 닫기"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
      />

      {/* 모바일: 바텀시트 / PC: 오른쪽 패널 */}
      <aside className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-hidden rounded-t-3xl bg-white px-6 py-3 shadow-2xl lg:static lg:z-auto lg:max-h-none lg:rounded-none lg:shadow-sm">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-300 lg:hidden" />

        <FestivalPanelHeader
          title={selectedFestival ? "축제 상세정보" : "선택한 날짜"}
          onClose={handleHeaderClose}
        />

        <div
          key={selectedFestival?.id ?? "festival-list"}
          ref={contentScrollRef}
          className="max-h-[calc(85dvh-100px)] overflow-y-auto scrollbar-thin lg:max-h-[calc(100vh-8rem)]"
        >
          {selectedFestival ? (
            <FestivalDetailDrawer
              festivalId={selectedFestival.id}
              isOpen={true}
              onClose={onBackToList}
            />
          ) : (
            <FestivalList
              dateText={dateText}
              festivals={festivals}
              isLoading={isLoading}
              onSelect={onSelectFestival}
            />
          )}
        </div>
      </aside>
    </>
  );
}