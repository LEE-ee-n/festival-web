export function compactSearchText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "");
}

export function uniqueStrings(values) {
  return [
    ...new Map(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .map((value) => [compactSearchText(value), value]),
    ).values(),
  ];
}

export function findFestivalConnection(draftFestival, festivals) {
  const match = findExactFestivalIdentityMatch(draftFestival, festivals);
  if (match.status === "existing") {
    return { type: "update", festival: match.festival, possible: [match.festival] };
  }
  if (match.status === "new") {
    return { type: "new", festival: null, possible: [] };
  }
  return { type: "needs_review", festival: null, possible: [] };
}

export function compareLineup(draftArtists, existingArtistIds = []) {
  const existing = new Set(existingArtistIds.map(Number));
  return draftArtists.map((artist) => {
    const artistId = Number(artist.matched_artist_id);
    const explicitlyRemoved = artist.status === "cancelled";
    const comparison_status = explicitlyRemoved
      ? "remove_candidate"
      : Number.isInteger(artistId) && existing.has(artistId)
        ? "existing"
        : "add";
    return { ...artist, comparison_status };
  });
}

export function getAnnouncementRound(text) {
  const source = String(text || "");
  if (/최종|final/i.test(source)) return "final";
  const match = source.match(/(?:제\s*)?([1-9])\s*차/);
  if (match) return `round_${match[1]}`;
  return "unspecified";
}

export function normalizeDraftDates(draft) {
  const evidence = [
    draft.candidate?.raw_text,
    draft.festival?.name,
    draft.festival?.description,
    draft.festival?.program_info,
  ].join("\n");
  const years = [...new Set(evidence.match(/\b20\d{2}\b/g) || [])];
  const inferredYear = years.length === 1 ? years[0] : null;
  const normalize = (value) => {
    const text = String(value || "").trim();
    if (/^20\d{2}-\d{2}-\d{2}$/.test(text)) return text;
    if (inferredYear && /^\d{2}-\d{2}$/.test(text)) return `${inferredYear}-${text}`;
    return "";
  };
  draft.festival.start_date = normalize(draft.festival.start_date);
  draft.festival.end_date = normalize(draft.festival.end_date);
  draft.artists = draft.artists.map((artist) => ({
    ...artist,
    performance_date: normalize(artist.performance_date),
  }));
  return { inferredYear, hasCompleteFestivalDates: Boolean(draft.festival.start_date && draft.festival.end_date) };
}
import { findExactFestivalIdentityMatch } from "./festivalIdentity.js";
