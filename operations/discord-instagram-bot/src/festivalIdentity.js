const NORMALIZED_NAME_PATTERN = /^[a-z0-9]+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const FESTIVAL_NAME_SIMILARITY_THRESHOLD = 0.5;

function cleanIdentity(input) {
  return {
    normalized_name: String(input?.normalized_name ?? "").trim(),
    start_date: String(input?.start_date ?? "").trim(),
    end_date: String(input?.end_date ?? "").trim(),
  };
}

function isValidIsoDate(value) {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function isCompleteFestivalIdentity(input) {
  const identity = cleanIdentity(input);
  return NORMALIZED_NAME_PATTERN.test(identity.normalized_name)
    && isValidIsoDate(identity.start_date)
    && isValidIsoDate(identity.end_date)
    && identity.start_date <= identity.end_date;
}

export function createFestivalIdentityKey(input) {
  const identity = cleanIdentity(input);
  if (!isCompleteFestivalIdentity(identity)) return null;
  return [identity.normalized_name, identity.start_date, identity.end_date].join("|");
}

export function findExactFestivalIdentityMatch(incoming, festivals) {
  const incomingKey = createFestivalIdentityKey(incoming);
  if (!incomingKey) return { status: "incomplete", festival: null };
  const matches = festivals.filter(
    (festival) => createFestivalIdentityKey(festival) === incomingKey,
  );
  if (matches.length === 0) return { status: "new", festival: null };
  if (matches.length > 1) return { status: "ambiguous", festival: null };
  return { status: "existing", festival: matches[0] };
}

export function normalizeComparableFestivalName(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/(?:19|20)\d{2}/g, "")
    .replace(/festival|페스티벌|축제/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function bigramCounts(value) {
  const counts = new Map();
  for (let index = 0; index < value.length - 1; index += 1) {
    const bigram = value.slice(index, index + 2);
    counts.set(bigram, (counts.get(bigram) ?? 0) + 1);
  }
  return counts;
}

export function calculateFestivalNameSimilarity(left, right) {
  const normalizedLeft = normalizeComparableFestivalName(left);
  const normalizedRight = normalizeComparableFestivalName(right);
  if (!normalizedLeft || !normalizedRight) return 0;
  if (normalizedLeft === normalizedRight) return 1;
  if (normalizedLeft.length === 1 || normalizedRight.length === 1) return 0;

  const leftCounts = bigramCounts(normalizedLeft);
  const rightCounts = bigramCounts(normalizedRight);
  let intersection = 0;
  for (const [bigram, count] of leftCounts) {
    intersection += Math.min(count, rightCounts.get(bigram) ?? 0);
  }
  return (2 * intersection) / (normalizedLeft.length + normalizedRight.length - 2);
}

function comparableNames(festival) {
  return [
    festival?.name,
    festival?.normalized_name,
    ...String(festival?.search_aliases ?? "").split(/[,\n]/),
  ]
    .map(normalizeComparableFestivalName)
    .filter(Boolean);
}

function startYear(value) {
  const match = String(value ?? "").match(/^((?:19|20)\d{2})-\d{2}-\d{2}$/);
  return match?.[1] ?? null;
}

export function findSimilarFestivalCandidates(
  incoming,
  festivals,
  threshold = FESTIVAL_NAME_SIMILARITY_THRESHOLD,
) {
  const incomingYear = startYear(incoming?.start_date);
  const incomingNames = comparableNames(incoming);
  if (!incomingYear || incomingNames.length === 0) return [];

  return festivals
    .filter((festival) => startYear(festival?.start_date) === incomingYear)
    .flatMap((festival) => {
      const festivalNames = comparableNames(festival);
      let best = null;
      for (const incomingName of incomingNames) {
        for (const existingName of festivalNames) {
          const shorterLength = Math.min(incomingName.length, existingName.length);
          const contains = shorterLength >= 3
            && (incomingName.includes(existingName) || existingName.includes(incomingName));
          const score = calculateFestivalNameSimilarity(incomingName, existingName);
          if (!best || score > best.score || (contains && !best.contains)) {
            best = { score, contains, incomingName, existingName };
          }
        }
      }
      if (!best || (!best.contains && best.score < threshold)) return [];
      return [{
        ...festival,
        similarity_score: best.score,
        similarity_reason: best.contains ? "name_contains" : "name_similarity",
        same_dates: incoming.start_date === festival.start_date
          && incoming.end_date === festival.end_date,
      }];
    })
    .sort((left, right) =>
      Number(right.same_dates) - Number(left.same_dates)
      || right.similarity_score - left.similarity_score
      || Number(left.id ?? 0) - Number(right.id ?? 0),
    );
}
