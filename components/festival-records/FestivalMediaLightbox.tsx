"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import GoogleDriveImage from "@/components/google-drive/GoogleDriveImage";
import type { FestivalRecordMedia } from "@/lib/diaries/festivalRecordTypes";

export default function FestivalMediaLightbox({ items, index, onChange, onClose }: {
  items: FestivalRecordMedia[]; index: number; onChange(index: number): void; onClose(): void;
}) {
  const item = items[index];
  const startX = useRef<number | null>(null);
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onChange((index - 1 + items.length) % items.length);
      if (event.key === "ArrowRight") onChange((index + 1) % items.length);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", keydown); };
  }, [index, items.length, onChange, onClose]);
  if (!item) return null;
  const previous = () => onChange((index - 1 + items.length) % items.length);
  const next = () => onChange((index + 1) % items.length);
  return <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white" role="dialog" aria-modal="true" aria-label="미디어 크게 보기"
    onPointerDown={(event) => { startX.current = event.clientX; }} onPointerUp={(event) => {
      if (startX.current === null) return;
      const distance = event.clientX - startX.current;
      if (Math.abs(distance) > 50) {
        if (distance > 0) previous();
        else next();
      }
      startX.current = null;
    }}>
    <div className="flex items-center justify-between p-4"><span className="text-sm">{index + 1} / {items.length}</span><div className="flex gap-3">{item.previewUrl && <a href={item.previewUrl} target="_blank" rel="noreferrer" aria-label="Google Drive에서 열기"><ExternalLink /></a>}<button type="button" onClick={onClose} aria-label="닫기"><X /></button></div></div>
    <div className="relative flex min-h-0 flex-1 items-center justify-center px-12 pb-6">
      {item.fileType === "video" && item.previewUrl ? <iframe src={item.previewUrl} title={item.externalFileName || "영상"} className="aspect-video max-h-full w-full max-w-5xl" allow="autoplay; fullscreen" allowFullScreen /> : <GoogleDriveImage mediaId={item.id} alt={item.externalFileName || "사진"} size={1200} eager className="h-full max-h-[80vh] w-full max-w-5xl [&_img]:object-contain" />}
      {items.length > 1 && <><button type="button" onClick={previous} className="absolute left-2 rounded-full bg-white/10 p-2" aria-label="이전"><ChevronLeft /></button><button type="button" onClick={next} className="absolute right-2 rounded-full bg-white/10 p-2" aria-label="다음"><ChevronRight /></button></>}
    </div>
  </div>;
}
