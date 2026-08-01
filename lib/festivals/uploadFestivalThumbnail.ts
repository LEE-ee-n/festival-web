import { supabase } from "@/lib/supabase/client";
import {
  getFestivalThumbnailFileName,
  type FestivalThumbnailIdentity,
} from "@/lib/festivals/festivalThumbnailSync";
import { convertFestivalThumbnailToWebp } from "@/lib/festivals/thumbnailConversion";

function thumbnailPath(url: string) {
  const marker = "/festival-thumbnails/";
  try {
    const pathname = decodeURIComponent(new URL(url).pathname);
    const index = pathname.indexOf(marker);
    return index < 0 ? null : pathname.slice(index + marker.length);
  } catch {
    const index = url.indexOf(marker);
    return index < 0
      ? null
      : decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
  }
}

export async function removeFestivalThumbnailByUrl(url: string) {
  const path = thumbnailPath(url);
  if (!path) return;
  const { error } = await supabase.storage.from("festival-thumbnails").remove([path]);
  if (error) throw error;
}

export async function uploadFestivalThumbnail(
  festival: Pick<
    FestivalThumbnailIdentity,
    "id" | "normalized_name" | "start_date" | "end_date"
  >,
  file: File,
  previousUrl: string,
  metadata?: { sourceUrl?: string; note?: string },
) {
  const filePath = getFestivalThumbnailFileName(festival);
  if (!filePath) {
    throw new Error(
      "normalized_name과 시작일·종료일을 확인한 뒤 썸네일을 업로드하세요.",
    );
  }

  const webpFile = await convertFestivalThumbnailToWebp(file, filePath);
  const { data: existingFiles, error: listError } = await supabase.storage
    .from("festival-thumbnails")
    .list("", { limit: 100, search: filePath });
  if (listError) throw listError;

  let previousCanonicalFile: Blob | null = null;
  if ((existingFiles ?? []).some((item) => item.name === filePath)) {
    const { data, error } = await supabase.storage
      .from("festival-thumbnails")
      .download(filePath);
    if (error) throw error;
    previousCanonicalFile = data;
  }

  const { error: uploadError } = await supabase.storage
    .from("festival-thumbnails")
    .upload(filePath, webpFile, {
      upsert: true,
      contentType: "image/webp",
      cacheControl: "3600",
    });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("festival-thumbnails").getPublicUrl(filePath);
  const publicUrl = `${data.publicUrl}?v=${Date.now()}`;

  const { error: auditError } = await supabase.rpc("change_festival_thumbnail_with_audit", {
    p_festival_id: festival.id,
    p_new_url: publicUrl,
    p_source_url: metadata?.sourceUrl?.trim() || undefined,
    p_note: metadata?.note?.trim() || undefined,
  });

  if (auditError) {
    let rollbackErrorMessage = "";
    if (previousCanonicalFile) {
      const { error: rollbackError } = await supabase.storage
        .from("festival-thumbnails")
        .upload(
          filePath,
          previousCanonicalFile,
          {
            upsert: true,
            contentType: "image/webp",
            cacheControl: "3600",
          },
        );
      rollbackErrorMessage = rollbackError?.message ?? "";
    } else {
      const { error: rollbackError } = await supabase.storage
        .from("festival-thumbnails")
        .remove([filePath]);
      rollbackErrorMessage = rollbackError?.message ?? "";
    }

    if (rollbackErrorMessage) {
      throw new Error(
        `${auditError.message} 기존 썸네일 복원에도 실패했습니다: ${rollbackErrorMessage}`,
      );
    }
    throw auditError;
  }

  const oldPath = thumbnailPath(previousUrl);
  if (oldPath && oldPath !== filePath) {
    await supabase.storage.from("festival-thumbnails").remove([oldPath]);
  }
  return publicUrl;
}
