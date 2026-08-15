/* eslint-disable @next/next/no-img-element */

import { ExternalLink } from "lucide-react";

type DriveMedia = {
  id: number;
  externalFileId: string | null;
  externalFileName: string | null;
  previewUrl: string | null;
  fileType: string;
};

export default function GoogleDriveMediaPreview({ media, compact = false }: { media: DriveMedia; compact?: boolean }) {
  if (!media.externalFileId || !media.previewUrl) return null;

  if (media.fileType === "video") {
    return (
      <div className="overflow-hidden rounded-xl border border-line bg-black sm:col-span-2">
        <iframe
          src={media.previewUrl}
          title={media.externalFileName || "Google Drive 영상"}
          className="block aspect-video w-full"
          allow="autoplay; fullscreen"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  const thumbnailUrl = `https://drive.google.com/thumbnail?id=${encodeURIComponent(media.externalFileId)}&sz=w1200`;
  return (
    <a href={media.previewUrl} target="_blank" rel="noreferrer"
      className="group relative block overflow-hidden rounded-xl border border-line bg-surface-muted"
      aria-label={`${media.externalFileName || "Google Drive 사진"} 크게 보기`}>
      <img src={thumbnailUrl} alt={media.externalFileName || "Google Drive 사진"}
        className={`w-full object-cover transition-transform group-hover:scale-[1.02] ${compact ? "aspect-square" : "aspect-[4/3]"}`}
        loading="lazy" />
      <ExternalLink className="absolute right-2 top-2 h-4 w-4 rounded bg-white/85 p-0.5 text-ink-secondary" />
    </a>
  );
}
