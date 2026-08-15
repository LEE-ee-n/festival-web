"use client";

import { useState } from "react";
import { ExternalLink, Image as ImageIcon, Trash2, Video } from "lucide-react";
import GoogleDrivePickerButton from "./GoogleDrivePickerButton";
import { supabase } from "@/lib/supabase/client";
import type { FestivalRecordPerformance } from "@/lib/diaries/festivalRecordTypes";
import type { GoogleDrivePickedFile } from "@/lib/google-drive/types";

type Media = FestivalRecordPerformance["media"][number];

export default function FestivalDriveMediaField({ recordPerformanceId, initialMedia }: { recordPerformanceId: number; initialMedia: Media[] }) {
  const [items, setItems] = useState(initialMedia);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function addFiles(files: GoogleDrivePickedFile[]) {
    const fresh = files.filter((file) => !items.some((item) => item.provider === "google_drive" && item.externalFileId === file.id));
    if (fresh.length === 0) return;
    setIsSaving(true); setErrorMessage(null);
    const { data, error } = await supabase.from("user_festival_media").insert(fresh.map((file) => ({
      user_festival_performance_id: recordPerformanceId, provider: "google_drive",
      external_file_id: file.id, external_file_name: file.name, mime_type: file.mimeType,
      file_size: file.sizeBytes, file_type: file.fileType,
      preview_url: `https://drive.google.com/file/d/${encodeURIComponent(file.id)}/preview`,
    }))).select("id, provider, external_file_id, external_file_name, mime_type, file_size, preview_url, file_type");
    if (error) setErrorMessage("Drive 파일 정보를 저장하지 못했습니다.");
    else setItems((current) => [...current, ...(data ?? []).map((row) => ({ id: row.id, provider: row.provider,
      externalFileId: row.external_file_id, externalFileName: row.external_file_name, mimeType: row.mime_type,
      fileSize: row.file_size, previewUrl: row.preview_url, fileType: row.file_type }))]);
    setIsSaving(false);
  }

  async function remove(id: number) {
    if (!window.confirm("이 일기에서 파일 연결을 삭제할까요? Google Drive 원본은 삭제되지 않습니다.")) return;
    const { error } = await supabase.from("user_festival_media").delete().eq("id", id);
    if (error) setErrorMessage("파일 연결을 삭제하지 못했습니다.");
    else setItems((current) => current.filter((item) => item.id !== id));
  }

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm font-semibold text-ink-secondary">사진 · 영상</span>
      <GoogleDrivePickerButton disabled={isSaving} onPicked={(files) => void addFiles(files)} />
    </div>
    {items.length > 0 && <ul className="divide-y divide-line rounded-xl border border-line">
      {items.map((item) => <li key={item.id} className="flex items-center gap-3 px-3 py-3">
        {item.fileType === "video" ? <Video className="h-4 w-4 shrink-0" /> : <ImageIcon className="h-4 w-4 shrink-0" />}
        <span className="min-w-0 flex-1 truncate text-sm text-ink-secondary">{item.externalFileName || "Drive 파일"}</span>
        {item.previewUrl && <a href={item.previewUrl} target="_blank" rel="noreferrer" aria-label="Drive 파일 열기"><ExternalLink className="h-4 w-4 text-ink-muted" /></a>}
        <button type="button" onClick={() => void remove(item.id)} aria-label="파일 연결 삭제"><Trash2 className="h-4 w-4 text-red-500" /></button>
      </li>)}
    </ul>}
    {errorMessage && <p role="alert" className="text-sm text-red-600">{errorMessage}</p>}
  </div>;
}
