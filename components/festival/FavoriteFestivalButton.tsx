"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

import { useServiceAccess } from "@/components/access/ServiceAccessProvider";
import {
  AUTH_RETURN_PATH_KEY,
  normalizeAuthReturnPath,
} from "@/lib/auth/authReturnPath";
import { useFavoriteFestival } from "@/lib/hooks/useFavoriteFestival";
import { typography } from "@/lib/typography";

export default function FavoriteFestivalButton({
  festivalId,
  festivalName,
}: {
  festivalId: number;
  festivalName: string;
}) {
  const router = useRouter();
  const favorite = useFavoriteFestival(festivalId);
  const access = useServiceAccess();
  const isLocked = access.isAuthenticated && !access.isLoading && !access.hasPersonalServiceAccess;

  function requestLogin() {
    const returnPath = normalizeAuthReturnPath(`${window.location.pathname}${window.location.search}`);
    if (returnPath) window.sessionStorage.setItem(AUTH_RETURN_PATH_KEY, returnPath);
    router.push("/login");
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        disabled={favorite.isLoading || favorite.isSaving || isLocked}
        aria-pressed={favorite.isFavorite}
        aria-label={`${festivalName} ${favorite.isFavorite ? "관심 페스티벌에서 해제" : "관심 페스티벌로 저장"}`}
        onClick={() => {
          if (!favorite.isAuthenticated) requestLogin();
          else void favorite.toggle();
        }}
        className={`${typography.button} inline-flex items-center gap-2 rounded-xl border border-line-strong px-4 py-2.5 text-ink-secondary disabled:opacity-50`}
      >
        <Heart className={`h-4 w-4 ${favorite.isFavorite ? "fill-red-500 text-red-500" : "text-ink-tertiary"}`} />
        {favorite.isSaving ? "저장 중" : favorite.isFavorite ? "관심 페스티벌" : "관심 페스티벌 추가"}
      </button>
      {isLocked && <p className="mt-1 text-xs font-medium text-amber-700">베타 이용권 필요</p>}
      {favorite.errorMessage && <p className="mt-2 text-xs font-medium text-red-600" role="alert">{favorite.errorMessage}</p>}
    </div>
  );
}
