"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { getGoogleDriveApiHeaders } from "@/lib/google-drive/clientAuth";

type DriveMedia = {
  id: number;
  externalFileId: string | null;
  externalFileName: string | null;
  previewUrl: string | null;
  fileType: string;
};

export default function GoogleDriveMediaPreview({ media, compact = false }: { media: DriveMedia; compact?: boolean }) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);

  useEffect(() => {
    if (media.fileType !== "image" || !media.externalFileId) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(`/api/google-drive/media/${media.id}/thumbnail`, {
          headers: await getGoogleDriveApiHeaders(),
        });
        if (!response.ok) throw new Error("Drive thumbnail request failed");
        objectUrl = URL.createObjectURL(await response.blob());
        if (!cancelled) setThumbnailUrl(objectUrl);
      } catch {
        if (!cancelled) setThumbnailFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [media.externalFileId, media.fileType, media.id]);

  useEffect(() => {
    if (media.fileType !== "video" || !media.externalFileId) return;
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(`/api/google-drive/media/${media.id}/video-metadata`, {
          headers: await getGoogleDriveApiHeaders(),
        });
        if (!response.ok) return;
        const metadata = await response.json() as { width?: number; height?: number };
        if (!cancelled && metadata.width && metadata.height) {
          setVideoAspectRatio(metadata.width / metadata.height);
        }
      } catch {
        // Drive 메타데이터를 읽지 못하면 기본 16:9 비율을 유지합니다.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [media.externalFileId, media.fileType, media.id]);

  if (!media.externalFileId || !media.previewUrl) return null;

  if (media.fileType === "video") {
    return (
      <div className="overflow-hidden rounded-xl border border-line bg-black sm:col-span-2">
        <iframe
          src={media.previewUrl}
          title={media.externalFileName || "Google Drive 영상"}
          className="block w-full"
          style={{ aspectRatio: videoAspectRatio }}
          allow="autoplay; fullscreen"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <a href={media.previewUrl} target="_blank" rel="noreferrer"
      className="group relative block overflow-hidden rounded-xl border border-line bg-surface-muted"
      aria-label={`${media.externalFileName || "Google Drive 사진"} 크게 보기`}>
      {thumbnailUrl
        ? <img src={thumbnailUrl} alt={media.externalFileName || "Google Drive 사진"}
          className={`w-full object-cover transition-transform group-hover:scale-[1.02] ${compact ? "aspect-square" : "aspect-[4/3]"}`}
          loading="lazy" />
        : <div className={`flex items-center justify-center px-4 text-center text-sm text-ink-muted ${compact ? "aspect-square" : "aspect-[4/3]"}`}>
          {thumbnailFailed ? "사진을 불러오지 못했습니다." : "사진 불러오는 중"}
        </div>}
      <ExternalLink className="absolute right-2 top-2 h-4 w-4 rounded bg-white/85 p-0.5 text-ink-secondary" />
    </a>
  );
}
