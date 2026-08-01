const RESERVED_PATHS = new Set([
  "about",
  "accounts",
  "direct",
  "explore",
  "p",
  "reel",
  "reels",
  "stories",
]);

export function normalizeInstagramProfileUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";

  try {
    const url = new URL(value, "https://www.instagram.com/");
    if (url.hostname !== "instagram.com" && url.hostname !== "www.instagram.com") {
      return "";
    }

    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length !== 1) return "";
    const username = segments[0];
    if (!/^[A-Za-z0-9._]+$/.test(username)) return "";
    if (RESERVED_PATHS.has(username.toLowerCase())) return "";
    return `https://www.instagram.com/${username}/`;
  } catch {
    return "";
  }
}

export function findInstagramProfileUrl(candidates) {
  if (!Array.isArray(candidates)) return "";

  const ranked = candidates
    .map((candidate) => {
      const url = normalizeInstagramProfileUrl(candidate?.href);
      if (!url || candidate?.visible === false) return null;
      const username = new URL(url).pathname.split("/").filter(Boolean)[0];
      const label = typeof candidate?.text === "string"
        ? candidate.text.trim().replace(/^@/, "")
        : "";
      if (label.toLowerCase() !== username.toLowerCase()) return null;

      return {
        url,
        score: candidate?.hasMatchingProfileImage ? 2 : 1,
        top: Number.isFinite(candidate?.top) ? candidate.top : Number.MAX_SAFE_INTEGER,
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score || left.top - right.top);

  return ranked[0]?.url ?? "";
}
