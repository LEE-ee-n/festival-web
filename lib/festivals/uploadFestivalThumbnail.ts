import { supabase } from "@/lib/supabase/client";
import {
  getFestivalThumbnailExtension,
  validateFestivalThumbnailFile,
} from "@/lib/festivals/thumbnailValidation";

export async function uploadFestivalThumbnail(
  festivalId: string,
  file: File,
) {
  await validateFestivalThumbnailFile(file);

  const extension = getFestivalThumbnailExtension(file);

  const filePath = `${festivalId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("festival-thumbnails")
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from("festival-thumbnails")
    .getPublicUrl(filePath);

  return data.publicUrl;
}
