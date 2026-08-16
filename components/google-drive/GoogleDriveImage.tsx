"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { getGoogleDriveApiHeaders, parseGoogleDriveApiError } from "@/lib/google-drive/clientAuth";

export default function GoogleDriveImage({ mediaId, alt, className, size = 480, eager = false }: {
  mediaId: number; alt: string; className?: string; size?: number; eager?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);
  const [url, setUrl] = useState<string | null>(null);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (visible || !ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "240px" });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);
  useEffect(() => {
    if (!visible) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    void (async () => {
      try {
        setFailureMessage(null);
        const response = await fetch(`/api/google-drive/media/${mediaId}/thumbnail?size=${size}`, {
          headers: await getGoogleDriveApiHeaders(),
          cache: "no-store",
        });
        if (!response.ok) throw new Error(await parseGoogleDriveApiError(response));
        const blob = await response.blob();
        if (!blob.type.startsWith("image/")) throw new Error("Drive response was not an image");
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setUrl(objectUrl);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Drive 이미지를 불러오지 못했습니다.";
        console.warn("Failed to load Google Drive image", { mediaId, message });
        if (!cancelled) setFailureMessage(message);
      }
    })();
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [attempt, mediaId, size, visible]);
  return <div ref={ref} className={className}>{url
    ? <img src={url} alt={alt} className="h-full w-full object-cover" />
    : failureMessage
      ? <button type="button" onClick={() => setAttempt((value) => value + 1)} className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-muted p-4 text-center text-xs text-ink-muted">
          <span>{failureMessage}</span>
          <span className="font-semibold text-ink">다시 불러오기</span>
        </button>
      : <div className="h-full w-full animate-pulse bg-surface-muted" />}</div>;
}
