import { useRef } from "react";

import { getArtistYoutubeSearchUrl } from "@/lib/artists/profileLinks";
import { validateArtistImageFile } from "@/lib/artists/artistImage";

type ArtistProfileFieldsProps = {
  artistName: string;
  imageUrl: string | null;
  imageFile: File | null;
  imagePreviewUrl: string;
  instagramUrl: string;
  featuredPlaylistUrl: string;
  onInstagramUrlChange: (value: string) => void;
  onFeaturedPlaylistUrlChange: (value: string) => void;
  onImageFileChange: (file: File | null) => void;
};

export default function ArtistProfileFields({
  artistName,
  imageUrl,
  imageFile,
  imagePreviewUrl,
  instagramUrl,
  featuredPlaylistUrl,
  onInstagramUrlChange,
  onFeaturedPlaylistUrlChange,
  onImageFileChange,
}: ArtistProfileFieldsProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-ink">프로필</h3>
          <p className="mt-1 text-sm text-ink-tertiary">
            YouTube 검색은 이름으로 자동 생성되고, 나머지는 입력한 링크만 표시됩니다.
          </p>
        </div>
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface">
          {imagePreviewUrl || imageUrl ? (
            // Artist image hosts are user-configurable.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreviewUrl || imageUrl || ""} alt={`${artistName} 로고`} className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs font-semibold text-ink-muted">로고 없음</span>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-line-strong bg-surface-subtle p-3">
        <label className="block text-sm font-semibold text-ink-secondary">
          로고 파일
          <input
            ref={imageInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="mt-2 block w-full text-sm font-normal text-ink-secondary"
            onChange={async (event) => {
              const file = event.target.files?.[0] ?? null;
              if (!file) {
                onImageFileChange(null);
                return;
              }

              try {
                await validateArtistImageFile(file);
                onImageFileChange(file);
              } catch (error) {
                onImageFileChange(null);
                event.target.value = "";
                window.alert(
                  error instanceof Error
                    ? error.message
                    : "아티스트 로고 파일을 확인해 주세요.",
                );
              }
            }}
          />
        </label>
        <p className="mt-2 text-xs text-ink-muted">
          {imageFile
            ? `선택: ${imageFile.name} → 저장 시 normalized_name.webp로 변환`
            : "JPG·PNG·WebP, 최대 5MB · 저장 시 최대 800px WebP로 자동 변환"}
        </p>
        {imageFile && (
          <button
            type="button"
            onClick={() => {
              onImageFileChange(null);
              if (imageInputRef.current) imageInputRef.current.value = "";
            }}
            className="mt-3 rounded-lg border border-line-strong bg-surface px-3 py-2 text-xs font-semibold text-ink-secondary"
          >
            선택한 로고 취소
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-ink-secondary">
          Instagram URL
          <input
            type="url"
            value={instagramUrl}
            onChange={(event) => onInstagramUrlChange(event.target.value)}
            placeholder="https://www.instagram.com/..."
            className="mt-2 w-full rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-sm font-normal text-ink outline-none focus:border-ink"
          />
        </label>
        <label className="text-sm font-semibold text-ink-secondary">
          추천 플레이리스트 URL
          <input
            type="url"
            value={featuredPlaylistUrl}
            onChange={(event) => onFeaturedPlaylistUrlChange(event.target.value)}
            placeholder="https://www.youtube.com/playlist?list=..."
            className="mt-2 w-full rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-sm font-normal text-ink outline-none focus:border-ink"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-muted">투명 PNG도 WebP 투명 배경을 유지합니다.</p>
        <a
          href={getArtistYoutubeSearchUrl(artistName)}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-line-strong bg-surface-subtle px-3 py-2 text-xs font-semibold text-ink-secondary"
        >
          YouTube 검색 열기
        </a>
      </div>
    </section>
  );
}
