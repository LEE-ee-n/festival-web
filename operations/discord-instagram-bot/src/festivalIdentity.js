const NORMALIZED_NAME_PATTERN = /^[a-z0-9]+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
