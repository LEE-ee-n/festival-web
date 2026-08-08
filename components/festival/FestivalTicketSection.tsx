import { Tag, Ticket } from "lucide-react";

import FestivalExternalLinkGroup from "@/components/festival/FestivalExternalLinkGroup";
import { getOpenTicketLinks } from "@/lib/festivals/ticketDisplay";
import { useCurrentTimeAt } from "@/lib/hooks/useCurrentTimeAt";
import type { FestivalTicketRound } from "@/lib/types";
import { typography } from "@/lib/typography";

type FestivalTicketSectionProps = {
  ticketRounds: FestivalTicketRound[];
  latestOpenAt: string | null;
  officialUrl?: string | null;
  instagramUrl?: string | null;
};

export default function FestivalTicketSection({
  ticketRounds,
  latestOpenAt,
  officialUrl,
  instagramUrl,
}: FestivalTicketSectionProps) {
  const currentTime = useCurrentTimeAt(latestOpenAt);

  if (ticketRounds.length === 0) return null;

  const ticketLinks = getOpenTicketLinks(
    ticketRounds,
    latestOpenAt,
    currentTime,
  );
  const ticketInfo = ticketRounds[0];

  return (
    <section>
      <h2
        className={`${typography.panelSectionTitle} flex items-center justify-center gap-2 pt-6 text-ink-secondary`}
      >
        <Ticket size={16} />
        <span>티켓 안내</span>
      </h2>

      <div className="pt-6">
        <h3
          className={`${typography.panelSectionTitle} inline-flex w-fit items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-ink-secondary`}
        >
          <Tag size={16} />
          <span>{ticketInfo.round_name}</span>
        </h3>

        {ticketInfo.price_info && (
          <p
            className={`${typography.bodyCompact} whitespace-pre-line px-6 pt-2 text-ink-secondary`}
          >
            {ticketInfo.price_info}
          </p>
        )}

        <div className="mt-6 border-b border-line" />

        <FestivalExternalLinkGroup
          ticketLinks={ticketLinks}
          officialUrl={officialUrl}
          instagramUrl={instagramUrl}
        />
      </div>
    </section>
  );
}
