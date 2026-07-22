import { supabase } from "@/lib/supabase/client";

export async function deleteFestivalThumbnail(
  festivalId: string,
  thumbnailUrl: string,
  metadata?: { sourceUrl?: string; note?: string },
) {
  const { error } = await supabase.rpc("change_festival_thumbnail_with_audit", {
    p_festival_id: Number(festivalId),
    p_new_url: null,
    p_source_url: metadata?.sourceUrl?.trim() || null,
    p_note: metadata?.note?.trim() || null,
  });
  if (error) throw error;

  const marker = "/festival-thumbnails/";
  const index = thumbnailUrl.indexOf(marker);
  if (index >= 0) {
    const path = decodeURIComponent(thumbnailUrl.slice(index + marker.length));
    await supabase.storage.from("festival-thumbnails").remove([path]);
  }
}
