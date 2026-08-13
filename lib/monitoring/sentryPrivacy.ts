import type { Breadcrumb, Event } from "@sentry/nextjs";

function stripUrlDetails(value: string | undefined) {
  if (!value) return value;

  try {
    const url = new URL(value, "https://festibom.local");
    return url.origin === "https://festibom.local"
      ? url.pathname
      : `${url.origin}${url.pathname}`;
  } catch {
    return value.replace(/[?#].*$/, "");
  }
}

export function sanitizeSentryEvent<T extends Event>(event: T): T {
  return {
    ...event,
    message: undefined,
    user: undefined,
    extra: undefined,
    logentry: undefined,
    exception: event.exception
      ? {
          values: event.exception.values?.map((exception) => ({
            ...exception,
            value: undefined,
          })),
        }
      : undefined,
    request: event.request
      ? {
          method: event.request.method,
          url: stripUrlDetails(event.request.url),
        }
      : undefined,
    breadcrumbs: event.breadcrumbs?.map((breadcrumb) => ({
      ...breadcrumb,
      data: undefined,
      message: undefined,
    })),
  } as T;
}

export function sanitizeSentryBreadcrumb(
  breadcrumb: Breadcrumb,
): Breadcrumb | null {
  if (
    breadcrumb.category === "console" ||
    breadcrumb.category?.startsWith("ui.input")
  ) {
    return null;
  }

  return {
    ...breadcrumb,
    data: undefined,
    message:
      breadcrumb.category === "navigation"
        ? stripUrlDetails(breadcrumb.message)
        : undefined,
  };
}
