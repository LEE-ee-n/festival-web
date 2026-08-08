import type { FestivalTicketRound } from "@/lib/types";
import { typography } from "@/lib/typography";

type FestivalExternalLinkGroupProps = {
  ticketLinks?: FestivalTicketRound[];
  officialUrl?: string | null;
  instagramUrl?: string | null;
};

const linkClassName = `${typography.button} flex w-full items-center justify-center rounded-xl border border-line bg-white px-3 py-3 text-center text-ink-secondary hover:bg-surface-subtle`;

export default function FestivalExternalLinkGroup({
  ticketLinks = [],
  officialUrl,
  instagramUrl,
}: FestivalExternalLinkGroupProps) {
  if (ticketLinks.length === 0 && !officialUrl && !instagramUrl) return null;

  return (
    <section className="pt-8">
      {ticketLinks.length > 0 && (
        <div
          className={[
            "grid gap-3",
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
              className={linkClassName}
            >
              {round.ticket_platform || "예매하기"}
            </a>
          ))}
        </div>
      )}

      <div
        className={`flex flex-col gap-2 ${
          ticketLinks.length > 0 && (instagramUrl || officialUrl) ? "mt-3" : ""
        }`}
      >
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className={linkClassName}
          >
            인스타그램
          </a>
        )}
        {officialUrl && (
          <a
            href={officialUrl}
            target="_blank"
            rel="noreferrer"
            className={linkClassName}
          >
            공식 홈페이지
          </a>
        )}
      </div>
    </section>
  );
}
