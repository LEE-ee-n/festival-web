export type TicketUrlAlertFestival = {
  end_date: string;
  id: number;
  name: string;
  price_type: string | null;
};

export type TicketUrlAlertRound = {
  festival_id: number;
  id: number;
  open_at: string | null;
  round_name: string;
  ticket_platform: string | null;
  ticket_url: string | null;
};

export type TicketUrlAlert = TicketUrlAlertRound & {
  festival_name: string;
};

function hasTicketUrl(ticketUrl: string | null) {
  return Boolean(ticketUrl?.trim());
}

export function getTicketUrlAlerts({
  festivals,
  now,
  ticketRounds,
  today,
}: {
  festivals: TicketUrlAlertFestival[];
  now: Date;
  ticketRounds: TicketUrlAlertRound[];
  today: string;
}): TicketUrlAlert[] {
  const alertFestivalNames = new Map(
    festivals
      .filter(
        (festival) =>
          festival.end_date >= today &&
          (festival.price_type === "paid" || festival.price_type === "partial_free"),
      )
      .map((festival) => [festival.id, festival.name]),
  );

  return ticketRounds
    .filter((ticketRound) => {
      if (!ticketRound.open_at || hasTicketUrl(ticketRound.ticket_url)) {
        return false;
      }

      return (
        alertFestivalNames.has(ticketRound.festival_id) &&
        new Date(ticketRound.open_at).getTime() > now.getTime()
      );
    })
    .map((ticketRound) => ({
      ...ticketRound,
      festival_name: alertFestivalNames.get(ticketRound.festival_id) ?? "",
    }))
    .sort(
      (left, right) =>
        new Date(left.open_at ?? 0).getTime() -
        new Date(right.open_at ?? 0).getTime(),
    );
}
