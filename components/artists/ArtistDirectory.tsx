"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ArtistDirectoryFilters from "@/components/artists/ArtistDirectoryFilters";
import ArtistDirectoryRow from "@/components/artists/ArtistDirectoryRow";
import Pagination from "@/components/common/Pagination";
import {
  AUTH_RETURN_PATH_KEY,
  normalizeAuthReturnPath,
} from "@/lib/auth/authReturnPath";
import {
  filterArtistDirectoryItems,
  paginateArtistDirectoryItems,
  sortArtistDirectoryItems,
  type ArtistDirectoryFilter,
  type ArtistDirectoryItem,
} from "@/lib/artists/artistDirectory";
import { useArtistDirectoryFavorites } from "@/lib/hooks/useArtistDirectoryFavorites";
import { typography } from "@/lib/typography";

type ArtistDirectoryProps = {
  artists: ArtistDirectoryItem[];
  initialPage: number;
};

export default function ArtistDirectory({ artists, initialPage }: ArtistDirectoryProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [initialFilter, setInitialFilter] =
    useState<ArtistDirectoryFilter>("all");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const favorites = useArtistDirectoryFavorites();
  const sortedArtists = useMemo(
    () => sortArtistDirectoryItems(artists),
    [artists],
  );
  const filteredArtists = useMemo(
    () => filterArtistDirectoryItems(
      sortedArtists,
      keyword,
      initialFilter,
      favoriteOnly ? favorites.favoriteIds : undefined,
    ),
    [favoriteOnly, favorites.favoriteIds, initialFilter, keyword, sortedArtists],
  );
  const pagination = useMemo(
    () => paginateArtistDirectoryItems(filteredArtists, initialPage),
    [filteredArtists, initialPage],
  );

  function resetPage() {
    if (initialPage !== 1) {
      router.replace("/artists", { scroll: false });
    }
  }

  function requestLogin() {
    const returnPath = normalizeAuthReturnPath(
      `${window.location.pathname}${window.location.search}`,
    );
    if (returnPath) {
      window.sessionStorage.setItem(AUTH_RETURN_PATH_KEY, returnPath);
    }
    window.location.href = "/login";
  }

  function handleFavoriteOnlyClick() {
    if (!favorites.isAuthenticated) {
      requestLogin();
      return;
    }
    setFavoriteOnly((current) => !current);
    resetPage();
  }

  return (
    <div className="mt-6">
      <ArtistDirectoryFilters
        keyword={keyword}
        onKeywordChange={(value) => {
          setKeyword(value);
          resetPage();
        }}
        initialFilter={initialFilter}
        onInitialFilterChange={(value) => {
          setInitialFilter(value);
          resetPage();
        }}
        favoriteOnly={favoriteOnly}
        onFavoriteOnlyClick={handleFavoriteOnlyClick}
        isFavoriteLoading={favorites.isLoading}
      />

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className={`${typography.metaStrong} text-ink-secondary`}>
          총 {filteredArtists.length.toLocaleString("ko-KR")}명
        </p>
        {(keyword || initialFilter !== "all" || favoriteOnly) && (
          <button
            type="button"
            onClick={() => {
              setKeyword("");
              setInitialFilter("all");
              setFavoriteOnly(false);
              resetPage();
            }}
            className={`${typography.metaStrong} text-ink-tertiary hover:text-ink`}
          >
            필터 초기화
          </button>
        )}
      </div>

      {favorites.errorMessage && (
        <p className="mt-3 text-sm font-medium text-red-600" role="alert">
          {favorites.errorMessage}
        </p>
      )}

      {filteredArtists.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line-strong px-5 py-16 text-center text-sm text-ink-tertiary">
          조건에 맞는 아티스트가 없습니다.
        </div>
      ) : (
        <ul className="mt-4 border-t border-line">
          {pagination.items.map((artist) => (
            <ArtistDirectoryRow
              key={artist.id}
              artist={artist}
              isFavorite={favorites.favoriteIds.has(artist.id)}
              isLoading={favorites.isLoading}
              isSaving={favorites.savingIds.has(artist.id)}
              onFavoriteClick={() => {
                if (!favorites.isAuthenticated) {
                  requestLogin();
                  return;
                }
                void favorites.toggle(artist.id);
              }}
            />
          ))}
        </ul>
      )}

      {filteredArtists.length > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          getPageHref={(targetPage) => targetPage === 1 ? "/artists" : `/artists?page=${targetPage}`}
          ariaLabel="아티스트 목록 페이지"
          className="mt-6"
        />
      )}
    </div>
  );
}
