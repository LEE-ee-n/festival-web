export const AUTH_RETURN_PATH_KEY = "festibom-auth-return-path";

export function normalizeAuthReturnPath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  try {
    const url = new URL(value, "https://festibom.local");

    if (url.origin !== "https://festibom.local") return null;
    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
