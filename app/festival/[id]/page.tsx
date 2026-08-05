import { notFound } from "next/navigation";

import FestivalDetailContent from "@/components/festival/FestivalDetailContent";
import { getPublicFestivalDetail } from "@/lib/festivals/getPublicFestivalDetail";

export const revalidate = 3600;

type FestivalDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FestivalDetailPage({
  params,
}: FestivalDetailPageProps) {
  const { id } = await params;
  const detail = await getPublicFestivalDetail(id);

  if (!detail) {
    notFound();
  }

  return (
    <FestivalDetailContent
      festival={detail.festival}
      festivalArtists={detail.festivalArtists}
      ticketRounds={detail.ticketRounds}
    />
  );
}
