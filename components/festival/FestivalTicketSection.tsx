import { Tag, Ticket } from "lucide-react";

import { useCurrentTimeAt } from "@/lib/hooks/useCurrentTimeAt";
import { getOpenTicketLinks } from "@/lib/festivals/ticketDisplay";
import type { FestivalTicketRound } from "@/lib/types";

type FestivalTicketSectionProps = {
  ticketRounds: FestivalTicketRound[];
  latestOpenAt: string | null;
  openAtText: string | null;
};

export default function FestivalTicketSection({
  ticketRounds,
  latestOpenAt,
  openAtText,
}: FestivalTicketSectionProps) {
  const currentTime = useCurrentTimeAt(latestOpenAt);

  if (ticketRounds.length === 0) {
    return null;
  }

  const ticketLinks = getOpenTicketLinks(
    ticketRounds,
    latestOpenAt,
    currentTime,
  );
  const ticketInfo = ticketRounds[0];

  return (
    <section>

      <h2 className="pt-6 flex items-center justify-center gap-2 text-sm font-bold text-slate-700">
        <Ticket size={16} />
        <span>티켓 안내</span>
      </h2>

      <div className="pt-3">
        <div className="pt-3">
          <h3 className="flex items-center gap-2 overflow-hidden rounded-xl bg-teal-100 px-3 py-3 text-sm font-bold text-slate-700">
            <Tag size={16} />
            <span>{ticketInfo.round_name}</span>
          </h3>

          {openAtText && (
            <p className="px-6 pt-2 text-sm font-semibold text-slate-700">
              {openAtText}
            </p>
          )}

          {ticketInfo.price_info && (
            <p className="whitespace-pre-line px-6 pt-2 text-sm leading-6 text-slate-700">
              {ticketInfo.price_info}
            </p>
          )}

          {ticketLinks.length > 0 && (
            <div
              className={[
                "mt-3 grid gap-3",
                ticketLinks.length === 1
                  ? "grid-cols-1"
                  : ticketLinks.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-3",
              ].join(" ")}
            >
              {ticketLinks.map((round) => (
                <a
                  key={round.id}
                  href={round.ticket_url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center rounded-xl py-3 bg-slate-800 text-center text-sm font-semibold text-white hover:bg-slate-700"
                >
                  {round.ticket_platform || "예매하기"}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
