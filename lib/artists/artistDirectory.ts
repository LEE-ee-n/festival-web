import { normalizePublicSearchText } from "../publicSearchLogic.ts";

export const KOREAN_INITIAL_FILTERS = [
  "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ",
  "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

const HANGUL_INITIALS = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

const BASE_INITIALS: Record<string, string> = {
  "ㄲ": "ㄱ",
  "ㄸ": "ㄷ",
  "ㅃ": "ㅂ",
  "ㅆ": "ㅅ",
  "ㅉ": "ㅈ",
};

export const ENGLISH_INITIAL_FILTERS =
  Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));

export type ArtistDirectoryFilter = "all" | "number" | string;

export type ArtistDirectoryItem = {
  id: number;
  name: string;
  normalizedName: string;
  imageUrl: string | null;
  aliases: string[];
};

export const ARTIST_DIRECTORY_PAGE_SIZE = 50;

export function parseArtistDirectoryPage(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const page = Number(rawValue);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function paginateArtistDirectoryItems(
  items: ArtistDirectoryItem[],
  page: number,
  pageSize = ARTIST_DIRECTORY_PAGE_SIZE,
) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const resolvedPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (resolvedPage - 1) * pageSize;

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    page: resolvedPage,
    totalPages,
  };
}

type ArtistNameGroup = {
  rank: number;
  key: string;
};

export function getArtistNameGroup(name: string): ArtistNameGroup {
  const firstCharacter = name.trim().normalize("NFKC").charAt(0);

  if (/\d/.test(firstCharacter)) {
    return { rank: 0, key: "number" };
  }

  const code = firstCharacter.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const initialIndex = Math.floor((code - 0xac00) / 588);
    const initial = HANGUL_INITIALS[initialIndex] ?? "";
    return { rank: 1, key: BASE_INITIALS[initial] ?? initial };
  }

  const standaloneInitialIndex = KOREAN_INITIAL_FILTERS.indexOf(
    firstCharacter as (typeof KOREAN_INITIAL_FILTERS)[number],
  );
  if (standaloneInitialIndex >= 0) {
    return { rank: 1, key: KOREAN_INITIAL_FILTERS[standaloneInitialIndex] };
  }

  if (/[a-z]/i.test(firstCharacter)) {
    return { rank: 2, key: firstCharacter.toUpperCase() };
  }

  return { rank: 3, key: "other" };
}

export function sortArtistDirectoryItems(items: ArtistDirectoryItem[]) {
  return [...items].sort((left, right) => {
    const leftGroup = getArtistNameGroup(left.name);
    const rightGroup = getArtistNameGroup(right.name);
    const rankDifference = leftGroup.rank - rightGroup.rank;

    if (rankDifference !== 0) return rankDifference;

    return left.name.localeCompare(right.name, "ko", {
      numeric: true,
      sensitivity: "base",
    });
  });
}

export function filterArtistDirectoryItems(
  items: ArtistDirectoryItem[],
  keyword: string,
  initialFilter: ArtistDirectoryFilter,
  favoriteIds?: ReadonlySet<number>,
) {
  const normalizedKeyword = normalizePublicSearchText(keyword);

  return items.filter((item) => {
    if (favoriteIds && !favoriteIds.has(item.id)) return false;

    if (
      initialFilter !== "all" &&
      getArtistNameGroup(item.name).key !== initialFilter
    ) {
      return false;
    }

    if (!normalizedKeyword) return true;

    return [item.name, item.normalizedName, ...item.aliases]
      .some((value) =>
        normalizePublicSearchText(value).includes(normalizedKeyword));
  });
}
