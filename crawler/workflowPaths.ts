export function formatCompactLocalDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${String(date.getFullYear()).slice(-2)}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

export function collectionDateFromFilename(filename: string, fallback: Date): string {
  const compact = filename.match(/^([0-9]{6})-(?:NOL|YES24|TICKETLINK)-crwal/i)?.[1];
  if (compact) return compact;
  const legacy = filename.match(/^nol-tickets-([0-9]{4})-([0-9]{2})-([0-9]{2})/i);
  if (legacy) return `${legacy[1].slice(-2)}${legacy[2]}${legacy[3]}`;
  return formatCompactLocalDate(fallback);
}
