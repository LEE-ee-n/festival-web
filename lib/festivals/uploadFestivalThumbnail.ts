import { supabase } from "@/lib/supabase/client";
import { getFestivalThumbnailExtension, validateFestivalThumbnailFile } from "@/lib/festivals/thumbnailValidation";
import type { CandidateSourceAsset } from "@/lib/types";

function thumbnailPath(url: string) {
  const marker = "/festival-thumbnails/";
  const index = url.indexOf(marker);
  return index < 0 ? null : decodeURIComponent(url.slice(index + marker.length));
}

export async function removeFestivalThumbnailByUrl(url: string) {
  const path = thumbnailPath(url);
  if (!path) return;
  const { error } = await supabase.storage.from("festival-thumbnails").remove([path]);
  if (error) throw error;
}

export async function promoteCandidatePoster(
  candidateId: number,
  asset: CandidateSourceAsset,
) {
  if (!asset.storage_path) return null;

  const { data: poster, error: downloadError } = await supabase.storage
    .from("festival-candidate-posters")
    .download(asset.storage_path);
  if (downloadError) throw downloadError;

  const finalPath = `candidate-${candidateId}/${Date.now()}.webp`;
  const { error: uploadError } = await supabase.storage
    .from("festival-thumbnails")
    .upload(finalPath, poster, {
      upsert: false,
      contentType: "image/webp",
    });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("festival-thumbnails")
    .getPublicUrl(finalPath);

  return {
    publicUrl: data.publicUrl,
    async rollback() {
      await supabase.storage.from("festival-thumbnails").remove([finalPath]);
    },
    async removeTemporary() {
      await supabase.storage
        .from("festival-candidate-posters")
        .remove([asset.storage_path as string]);
    },
  };
}

export async function uploadFestivalThumbnail(
  festivalId: string,
  file: File,
  previousUrl: string,
  metadata?: { sourceUrl?: string; note?: string },
) {
  await validateFestivalThumbnailFile(file);
  const extension = getFestivalThumbnailExtension(file);
  const filePath = `${festivalId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("festival-thumbnails")
    .upload(filePath, file, { upsert: false, contentType: file.type });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("festival-thumbnails").getPublicUrl(filePath);
  const publicUrl = data.publicUrl;

  const { error: auditError } = await supabase.rpc("change_festival_thumbnail_with_audit", {
    p_festival_id: Number(festivalId),
    p_new_url: publicUrl,
    p_source_url: metadata?.sourceUrl?.trim() || null,
    p_note: metadata?.note?.trim() || null,
  });

  if (auditError) {
    await supabase.storage.from("festival-thumbnails").remove([filePath]);
    throw auditError;
  }

  const oldPath = thumbnailPath(previousUrl);
  if (oldPath) await supabase.storage.from("festival-thumbnails").remove([oldPath]);
  return publicUrl;
}
