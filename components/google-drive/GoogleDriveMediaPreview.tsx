"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { getGoogleDriveApiHeaders } from "@/lib/google-drive/clientAuth";

type DriveMedia = { id: number; externalFileId: string | null; externalFileName: string | null; previewUrl: string | null; fileType: string };

export default function GoogleDriveMediaPreview({ media, compact = false, eager = false, videoAutoplay = false }: {
  media: DriveMedia; compact?: boolean; eager?: boolean; videoAutoplay?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement | HTMLAnchorElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(eager);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [playVideo, setPlayVideo] = useState(videoAutoplay);

  useEffect(() => {
    if (shouldLoad || !rootRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShouldLoad(true); observer.disconnect(); }
    }, { rootMargin: "240px" });
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad || media.fileType !== "image" || !media.externalFileId) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/google-drive/media/${media.id}/thumbnail?size=${compact ? 480 : 900}`, { headers: await getGoogleDriveApiHeaders() });
        if (!response.ok) throw new Error("Drive thumbnail request failed");
        objectUrl = URL.createObjectURL(await response.blob());
        if (!cancelled) setThumbnailUrl(objectUrl);
      } catch { if (!cancelled) setFailed(true); }
    })();
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [compact, media.externalFileId, media.fileType, media.id, shouldLoad]);

  if (!media.externalFileId || !media.previewUrl) return null;
  if (media.fileType === "video") return (
    <div ref={rootRef as React.RefObject<HTMLDivElement>} className="relative overflow-hidden rounded-xl bg-black">
      {playVideo ? <iframe src={`${media.previewUrl}${media.previewUrl.includes("?") ? "&" : "?"}autoplay=1`} title={media.externalFileName || "Google Drive 영상"} className="block aspect-video w-full" allow="autoplay; fullscreen" allowFullScreen /> :
        <button type="button" onClick={() => setPlayVideo(true)} className="flex aspect-video w-full items-center justify-center bg-black text-white" aria-label="영상 재생">
          <Play className="h-10 w-10 fill-current" />
        </button>}
      <a href={media.previewUrl} target="_blank" rel="noreferrer" className="absolute right-2 top-2 rounded bg-black/60 p-1.5 text-white" aria-label="Google Drive에서 열기"><ExternalLink className="h-4 w-4" /></a>
    </div>
  );

  return <a ref={rootRef as React.RefObject<HTMLAnchorElement>} href={media.previewUrl} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-xl bg-surface-muted">
    {thumbnailUrl ? <img src={thumbnailUrl} alt={media.externalFileName || "Google Drive 사진"} className={`w-full object-cover ${compact ? "aspect-square" : "aspect-[4/3]"}`} /> :
      <div className={`flex items-center justify-center p-3 text-center text-xs text-ink-muted ${compact ? "aspect-square" : "aspect-[4/3]"}`}>{failed ? "사진을 불러오지 못했습니다." : "사진 불러오는 중"}</div>}
    <ExternalLink className="absolute right-2 top-2 h-4 w-4 rounded bg-white/85 p-0.5 text-ink-secondary" />
  </a>;
}
