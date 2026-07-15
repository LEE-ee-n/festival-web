import { Tag, Ticket } from "lucide-react";

type FestivalTicketRound = {
  id: number;
  round_name: string;
  price_info: string | null;
  ticket_url: string | null;
  ticket_platform: string | null;
};

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
  if (ticketRounds.length === 0) {
    return null;
  }

  const ticketLinks = ticketRounds.filter(
    (round) => round.ticket_url,
  );

  const isOpen =
    latestOpenAt !== null &&
    new Date(latestOpenAt).getTime() <= Date.now();

  return (
    <section>

      <h2 className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-slate-700">
        <Ticket size={16} />
        <span>티켓 안내</span>
      </h2>

      <div className="mt-3">
        <h3 className="flex items-center gap-2 px-3 overflow-hidden rounded-xl bg-teal-100 py-3 text-sm font-bold text-slate-700">
          <Tag size={16} />
          <span>{ticketRounds[0].round_name}</span>
        </h3>

        <div className="mt-3">
          {!isOpen && openAtText && (
            <p className="text-sm font-semibold text-slate-700">
              {openAtText}
            </p>
          )}

          {ticketRounds[0].price_info && (
            <p className="whitespace-pre-line text-sm px-6 leading-6 text-slate-700">
              {ticketRounds[0].price_info}
            </p>
          )}

          {isOpen && ticketLinks.length > 0 && (
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