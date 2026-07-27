type ErrorRecord = Record<string, unknown>;

function isErrorRecord(value: unknown): value is ErrorRecord {
  return typeof value === "object" && value !== null;
}

function readErrorText(
  error: ErrorRecord,
  key: string,
): string | null {
  const value = error[key];
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

export function getSupabaseErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (!isErrorRecord(error)) return fallback;

  const details = [
    readErrorText(error, "message"),
    readErrorText(error, "details"),
    readErrorText(error, "hint"),
    readErrorText(error, "code"),
  ].filter((value): value is string => value !== null);

  return details.length > 0 ? details.join(" / ") : fallback;
}
