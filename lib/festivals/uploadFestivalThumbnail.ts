import { supabase } from "@/lib/supabase/client";

export async function uploadFestivalThumbnail(
  festivalId: string,
  file: File,
) {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있습니다.");
  }

  const extension = file.name.split(".").pop() || "webp";

  const filePath = `${festivalId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("festival-thumbnails")
    .upload(filePath, file, {
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from("festival-thumbnails")
    .getPublicUrl(filePath);

  return data.publicUrl;
}