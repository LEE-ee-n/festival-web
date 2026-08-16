"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Play, Star, Trash2 } from "lucide-react";
import GoogleDriveImage from "@/components/google-drive/GoogleDriveImage";
import GoogleDrivePickerButton from "@/components/google-drive/GoogleDrivePickerButton";
import GoogleDriveUploadButton from "@/components/google-drive/GoogleDriveUploadButton";
import FestivalMediaArtistFilter, {
  ALL_ARTISTS_FILTER,
  UNASSIGNED_ARTIST_FILTER,
} from "./FestivalMediaArtistFilter";
import FestivalMediaArtistSelector from "./FestivalMediaArtistSelector";
import FestivalMediaLightbox from "./FestivalMediaLightbox";
import {
  filterFestivalMedia,
  filterFestivalMediaByArtist,
  nextFeaturedImageOrder,
  type FestivalMediaFilter,
} from "@/lib/diaries/festivalMedia";
import type { FestivalRecordDetail, FestivalRecordMedia } from "@/lib/diaries/festivalRecordTypes";
import type { GoogleDrivePickedFile } from "@/lib/google-drive/types";
import { useFestivalRecordDetail } from "@/lib/hooks/useFestivalRecordDetail";
import { supabase } from "@/lib/supabase/client";
import { useServiceAccess } from "@/components/access/ServiceAccessProvider";

const PAGE_SIZE = 30;

export default function FestivalMediaAlbum({ recordId }: { recordId: number }) {
  const access = useServiceAccess();

  if (access.isLoading) return <p className="text-sm text-ink-muted">이용 권한을 확인하는 중...</p>;
  if (!access.hasGoogleDriveAccess) {
    return <p className="text-sm text-ink-muted">페이지를 찾을 수 없습니다.</p>;
  }

  return <AuthorizedFestivalMediaAlbum recordId={recordId} />;
}

function AuthorizedFestivalMediaAlbum({ recordId }: { recordId: number }) {
  const detail = useFestivalRecordDetail(recordId);

  if (detail.isLoading) return <p className="text-sm text-ink-muted">앨범을 불러오는 중...</p>;
  if (!detail.record) return <p className="text-sm text-red-600">앨범을 찾을 수 없습니다.</p>;

  return <FestivalMediaAlbumContent key={detail.record.id} record={detail.record} />;
}

function FestivalMediaAlbumContent({ record }: { record: FestivalRecordDetail }) {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<FestivalRecordMedia[]>(record.media);
  const [filter, setFilter] = useState<FestivalMediaFilter>("all");
  const [artistFilter, setArtistFilter] = useState(ALL_ARTISTS_FILTER);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(() => {
    const mediaId = Number(searchParams.get("media"));
    const index = record.media.findIndex((item) => item.id === mediaId);
    return index >= 0 ? index : null;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const typeFiltered = filterFestivalMedia(items, filter);
    if (artistFilter === ALL_ARTISTS_FILTER) return typeFiltered;
    if (artistFilter === UNASSIGNED_ARTIST_FILTER) {
      return filterFestivalMediaByArtist(typeFiltered, "unassigned");
    }

    const artistName = artistFilter.slice("artist:".length);
    const performanceIds = record.performances
      .filter((performance) => performance.artistName === artistName)
      .map((performance) => performance.recordPerformanceId);
    return filterFestivalMediaByArtist(typeFiltered, performanceIds);
  }, [artistFilter, filter, items, record.performances]);
  const visible = filtered.slice(0, visibleCount);

  async function addFiles(files: GoogleDrivePickedFile[]) {
    const fresh = files.filter((file) => !items.some(
      (item) => item.provider === "google_drive" && item.externalFileId === file.id,
    ));
    if (fresh.length === 0) return;

    setIsSaving(true);
    setMessage(null);
    const { data, error } = await supabase.from("user_festival_media").insert(fresh.map((file) => ({
      user_festival_diary_id: record.id,
      user_festival_performance_id: null,
      provider: "google_drive",
      external_file_id: file.id,
      external_file_name: file.name,
      mime_type: file.mimeType,
      file_size: file.sizeBytes,
      file_type: file.fileType,
      preview_url: `https://drive.google.com/file/d/${encodeURIComponent(file.id)}/preview`,
    }))).select("id, user_festival_performance_id, provider, external_file_id, external_file_name, mime_type, file_size, preview_url, file_type, featured_image_order, is_featured_video");

    if (error) {
      setMessage("미디어 연결에 실패했습니다.");
    } else {
      setItems((current) => [...current, ...(data ?? []).map((row) => ({
        id: row.id,
        recordPerformanceId: row.user_festival_performance_id,
        provider: row.provider,
        externalFileId: row.external_file_id,
        externalFileName: row.external_file_name,
        mimeType: row.mime_type,
        fileSize: row.file_size,
        previewUrl: row.preview_url,
        fileType: row.file_type,
        featuredImageOrder: row.featured_image_order,
        isFeaturedVideo: row.is_featured_video,
      }))]);
    }
    setIsSaving(false);
  }

  async function toggleFeatured(item: FestivalRecordMedia) {
    const enable = item.fileType === "image" ? item.featuredImageOrder === null : !item.isFeaturedVideo;
    if (enable && item.fileType === "image" && nextFeaturedImageOrder(items) === null) {
      setMessage("대표 사진은 최대 4장까지 선택할 수 있습니다.");
      return;
    }

    setIsSaving(true);
    setMessage(null);
    const { data, error } = await supabase.rpc("set_user_festival_media_featured", {
      p_media_id: item.id,
      p_featured: enable,
    });

    if (error) {
      setMessage(error.message || "대표 미디어 변경에 실패했습니다.");
    } else {
      const result = data as { featuredImageOrder?: number | null; isFeaturedVideo?: boolean } | null;
      setItems((current) => current.map((currentItem) => {
        if (item.fileType === "video" && currentItem.fileType === "video") {
          return { ...currentItem, isFeaturedVideo: currentItem.id === item.id ? enable : false };
        }
        if (currentItem.id !== item.id) return currentItem;
        return {
          ...currentItem,
          featuredImageOrder: item.fileType === "image"
            ? (enable ? result?.featuredImageOrder ?? nextFeaturedImageOrder(current) : null)
            : currentItem.featuredImageOrder,
        };
      }));
    }
    setIsSaving(false);
  }

  async function assignArtist(item: FestivalRecordMedia, recordPerformanceId: number | null) {
    setIsSaving(true);
    setMessage(null);
    const { error } = await supabase.from("user_festival_media")
      .update({ user_festival_performance_id: recordPerformanceId })
      .eq("id", item.id);

    if (error) {
      setMessage(error.message || "아티스트 연결에 실패했습니다.");
    } else {
      setItems((current) => current.map((value) => value.id === item.id
        ? { ...value, recordPerformanceId }
        : value));
    }
    setIsSaving(false);
  }

  async function remove(item: FestivalRecordMedia) {
    if (!window.confirm("일기에서 이 미디어 연결을 삭제할까요? Google Drive 원본은 삭제되지 않습니다.")) return;
    const { error } = await supabase.from("user_festival_media").delete().eq("id", item.id);
    if (error) setMessage("미디어 삭제에 실패했습니다.");
    else setItems((current) => current.filter((value) => value.id !== item.id));
  }

  return <div>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-black text-ink">전체 미디어</h1>
        <p className="mt-2 text-sm text-ink-tertiary">
          {record.festivalName} · 사진 {items.filter((item) => item.fileType === "image").length}
          {" · "}영상 {items.filter((item) => item.fileType === "video").length}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <GoogleDrivePickerButton disabled={isSaving} onPicked={(files) => void addFiles(files)} />
        <GoogleDriveUploadButton recordId={record.id} disabled={isSaving} onUploaded={(files) => void addFiles(files)} />
      </div>
    </div>

    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-2">
      {(["all", "image", "video"] as const).map((value) => <button
        key={value}
        type="button"
        onClick={() => { setFilter(value); setVisibleCount(PAGE_SIZE); setLightboxIndex(null); }}
        className={`rounded-full border px-4 py-2 text-sm ${filter === value ? "bg-ink-secondary text-white" : "border-line-strong"}`}
      >{value === "all" ? "전체" : value === "image" ? "사진" : "영상"}</button>)}
      </div>
      <FestivalMediaArtistFilter
        performances={record.performances}
        value={artistFilter}
        onChange={(value) => {
          setArtistFilter(value);
          setVisibleCount(PAGE_SIZE);
          setLightboxIndex(null);
        }}
      />
    </div>

    {message && <p role="alert" className="mt-4 text-sm text-red-600">{message}</p>}
    {visible.length === 0
      ? <div className="mt-8 rounded-2xl border border-dashed border-line-strong p-10 text-center text-sm text-ink-tertiary">Drive에서 사진이나 영상을 추가해 보세요.</div>
      : <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{visible.map((item) => {
        const itemIndex = filtered.findIndex((value) => value.id === item.id);
        const featured = item.featuredImageOrder !== null || item.isFeaturedVideo;
        return <article key={item.id} className="group min-w-0">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-muted">
            <button type="button" onClick={() => setLightboxIndex(itemIndex)} className="h-full w-full">
              {item.fileType === "image"
                ? <GoogleDriveImage mediaId={item.id} alt={item.externalFileName || "사진"} className="h-full w-full" />
                : <span className="flex h-full items-center justify-center bg-black text-white"><Play className="h-8 w-8 fill-current" /></span>}
            </button>
            <button type="button" disabled={isSaving} onClick={() => void toggleFeatured(item)} className={`absolute left-1.5 top-1.5 rounded-full p-1.5 ${featured ? "bg-amber-400 text-white" : "bg-black/55 text-white"}`} aria-label={featured ? "대표 해제" : "대표 선택"}>
              <Star className={`h-4 w-4 ${featured ? "fill-current" : ""}`} />
            </button>
            <button type="button" onClick={() => void remove(item)} className="absolute bottom-1.5 right-1.5 rounded-full bg-black/55 p-1.5 text-white opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label="삭제">
              <Trash2 className="h-4 w-4" />
            </button>
            {item.featuredImageOrder && <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">대표 {item.featuredImageOrder}</span>}
          </div>
          <div className="mt-2">
            <FestivalMediaArtistSelector
              performances={record.performances}
              value={item.recordPerformanceId}
              disabled={isSaving}
              onChange={(recordPerformanceId) => void assignArtist(item, recordPerformanceId)}
            />
          </div>
        </article>;
      })}</div>}

    {visibleCount < filtered.length && <button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} className="mx-auto mt-6 block rounded-xl border border-line-strong px-5 py-3 text-sm font-semibold">더 보기</button>}
    {lightboxIndex !== null && <FestivalMediaLightbox items={filtered} index={lightboxIndex} onChange={setLightboxIndex} onClose={() => setLightboxIndex(null)} />}
  </div>;
}
