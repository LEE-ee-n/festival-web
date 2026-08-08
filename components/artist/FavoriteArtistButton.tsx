"use client";

import FavoriteToggleButton from "@/components/favorites/FavoriteToggleButton";
import {
  AUTH_RETURN_PATH_KEY,
  normalizeAuthReturnPath,
} from "@/lib/auth/authReturnPath";
import { useFavoriteArtist } from "@/lib/hooks/useFavoriteArtist";

type FavoriteArtistButtonProps = {
  artistId: number;
  artistName: string;
};

export default function FavoriteArtistButton({
  artistId,
  artistName,
}: FavoriteArtistButtonProps) {
  const favorite = useFavoriteArtist(artistId);

  function requestLogin() {
    const returnPath = normalizeAuthReturnPath(
      `${window.location.pathname}${window.location.search}`,
    );

    if (returnPath) {
      window.sessionStorage.setItem(AUTH_RETURN_PATH_KEY, returnPath);
    }

    window.location.href = "/login";
  }

  return (
    <div>
      <FavoriteToggleButton
        isActive={favorite.isFavorite}
        isLoading={favorite.isLoading}
        isSaving={favorite.isSaving}
        activeLabel="좋아하는 아티스트"
        inactiveLabel="좋아하는 아티스트"
        ariaLabel={`${artistName} ${favorite.isFavorite ? "좋아하는 아티스트에서 삭제" : "좋아하는 아티스트로 추가"}`}
        onClick={() => {
          if (!favorite.isAuthenticated) {
            requestLogin();
            return;
          }

          void favorite.toggle();
        }}
      />

      {favorite.errorMessage && (
        <p className="mt-2 text-xs font-medium text-red-600" role="alert">
          {favorite.errorMessage}
        </p>
      )}
    </div>
  );
}
