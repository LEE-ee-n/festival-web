type TicketRoundTiming = {
  open_at: string | null;
};

type TicketRoundLink = {
  ticket_url: string | null;
};

export function getLatestTicketRoundGroup<T extends TicketRoundTiming>(
  ticketRounds: T[],
) {
  const latestOpenAt =
    ticketRounds
      .flatMap((round) => (round.open_at ? [round.open_at] : []))
      .sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime(),
      )[0] ?? null;

  const latestTicketRounds = latestOpenAt
    ? ticketRounds.filter((round) => round.open_at === latestOpenAt)
    : [];

  return {
    latestOpenAt,
    latestTicketRounds,
    ticketInfo: latestTicketRounds[0] ?? null,
  };
}

export function getOpenTicketLinks<T extends TicketRoundLink>(
  ticketRounds: T[],
  openAt: string | null,
  currentTime: number,
) {
  if (!openAt || new Date(openAt).getTime() > currentTime) {
    return [];
  }

  return ticketRounds.filter((round) => Boolean(round.ticket_url));
}
