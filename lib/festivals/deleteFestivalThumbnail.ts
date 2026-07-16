import { supabase } from "@/lib/supabase/client";

export async function deleteFestivalThumbnail(
  festivalId: string,
  thumbnailUrl: string,
) {
  const bucketPath = "/festival-thumbnails/";
  const pathIndex = thumbnailUrl.indexOf(bucketPath);

  if (pathIndex !== -1) {
    const filePath = decodeURIComponent(
      thumbnailUrl.slice(pathIndex + bucketPath.length),
    );

    const { error: deleteError } = await supabase.storage
      .from("festival-thumbnails")
      .remove([filePath]);

    if (deleteError) {
      throw deleteError;
    }
  }

  const { error: updateError } = await supabase
    .from("festivals")
    .update({
      thumbnail_url: null,
    })
    .eq("id", festivalId);

  if (updateError) {
    throw updateError;
  }
}