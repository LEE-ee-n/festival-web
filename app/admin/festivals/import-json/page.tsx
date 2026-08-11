"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import LegacyFestivalJsonUpdate from "./LegacyFestivalJsonUpdate";
import StagedFestivalUpdate from "./StagedFestivalUpdate";

function FestivalJsonUpdateContent() {
  const searchParams = useSearchParams();
  const festivalId = Number(searchParams.get("festivalId")) || null;
  const updateDraftId = Number(searchParams.get("updateDraftId")) || null;

  if (festivalId && updateDraftId) {
    return <StagedFestivalUpdate festivalId={festivalId} updateDraftId={updateDraftId} />;
  }

  return <LegacyFestivalJsonUpdate />;
}

export default function FestivalJsonUpdatePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-surface p-8">불러오는 중...</main>}>
      <FestivalJsonUpdateContent />
    </Suspense>
  );
}
