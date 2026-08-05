const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com"]);
const PLAYLIST_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

function parseHttpsUrl(value: string, label: string): URL | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`${label} URL 형식이 올바르지 않습니다.`);
  }

  if (url.protocol !== "https:") {
    throw new Error(`${label} URL은 https 주소여야 합니다.`);
  }

  return url;
}

export function normalizeInstagramUrl(value: string): string | null {
  const url = parseHttpsUrl(value, "Instagram");
  if (!url) return null;

  if (!INSTAGRAM_HOSTS.has(url.hostname) || url.pathname === "/") {
    throw new Error("Instagram 공식 프로필 URL만 입력할 수 있습니다.");
  }

  return url.toString();
}

export function normalizeFeaturedPlaylistUrl(value: string): string | null {
  const url = parseHttpsUrl(value, "추천 플레이리스트");
  if (!url) return null;

  const playlistId = url.searchParams.get("list");
  const isPlaylistPath = url.pathname === "/playlist";
  const isWatchPath = url.pathname === "/watch";
  const isShortWatchPath = url.hostname === "youtu.be" && url.pathname !== "/";

  if (
    !PLAYLIST_HOSTS.has(url.hostname)
    || !playlistId
    || (!isPlaylistPath && !isWatchPath && !isShortWatchPath)
  ) {
    throw new Error(
      "YouTube 또는 YouTube Music 재생목록 URL만 입력할 수 있습니다.",
    );
  }

  const canonicalUrl = new URL("https://www.youtube.com/playlist");
  canonicalUrl.searchParams.set("list", playlistId);
  return canonicalUrl.toString();
}

export function getArtistYoutubeSearchUrl(artistName: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(artistName)}`;
}
