import {
  ARTIST_IMAGE_BUCKET,
  convertArtistImageToWebp,
  getArtistImageFileName,
  getArtistImageStoragePath,
} from "@/lib/artists/artistImage";
import { supabase } from "@/lib/supabase/client";

export type PreparedArtistImageChange = {
  publicUrl: string;
  rollback: () => Promise<void>;
  finalize: () => Promise<string | null>;
};

async function downloadArtistImage(filePath: string) {
  const { data, error } = await supabase.storage
    .from(ARTIST_IMAGE_BUCKET)
    .download(filePath);
  if (error) throw error;
  return data;
}

async function prepareArtistImageWrite(
  filePath: string,
  webpFile: Blob,
  previousUrl: string,
): Promise<PreparedArtistImageChange> {
  const { data: existingFiles, error: listError } = await supabase.storage
    .from(ARTIST_IMAGE_BUCKET)
    .list("", { limit: 100, search: filePath });
  if (listError) throw listError;

  let previousCanonicalFile: Blob | null = null;
  if ((existingFiles ?? []).some((item) => item.name === filePath)) {
    previousCanonicalFile = await downloadArtistImage(filePath);
  }

  const { error: uploadError } = await supabase.storage
    .from(ARTIST_IMAGE_BUCKET)
    .upload(filePath, webpFile, {
      upsert: true,
      contentType: "image/webp",
      cacheControl: "3600",
    });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(ARTIST_IMAGE_BUCKET).getPublicUrl(filePath);
  const publicUrl = `${data.publicUrl}?v=${Date.now()}`;

  return {
    publicUrl,
    rollback: async () => {
      if (previousCanonicalFile) {
        const { error } = await supabase.storage
          .from(ARTIST_IMAGE_BUCKET)
          .upload(filePath, previousCanonicalFile, {
            upsert: true,
            contentType: "image/webp",
            cacheControl: "3600",
          });
        if (error) throw error;
        return;
      }

      const { error } = await supabase.storage
        .from(ARTIST_IMAGE_BUCKET)
        .remove([filePath]);
      if (error) throw error;
    },
    finalize: async () => {
      const oldPath = getArtistImageStoragePath(previousUrl);
      if (!oldPath || oldPath === filePath) return null;
      const { error } = await supabase.storage
        .from(ARTIST_IMAGE_BUCKET)
        .remove([oldPath]);
      return error?.message ?? null;
    },
  };
}

export async function prepareArtistImageUpload(
  normalizedName: string,
  file: File,
  previousUrl: string,
) {
  const filePath = getArtistImageFileName(normalizedName);
  const webpFile = await convertArtistImageToWebp(file, normalizedName);
  return prepareArtistImageWrite(filePath, webpFile, previousUrl);
}

export async function prepareArtistImageRename(
  normalizedName: string,
  previousUrl: string,
): Promise<PreparedArtistImageChange | null> {
  const previousPath = getArtistImageStoragePath(previousUrl);
  const nextPath = getArtistImageFileName(normalizedName);
  if (!previousPath || previousPath === nextPath) return null;

  const previousFile = await downloadArtistImage(previousPath);
  return prepareArtistImageWrite(nextPath, previousFile, previousUrl);
}

export async function removeArtistImageByUrl(url: string) {
  const filePath = getArtistImageStoragePath(url);
  if (!filePath) return null;

  const { error } = await supabase.storage
    .from(ARTIST_IMAGE_BUCKET)
    .remove([filePath]);
  return error?.message ?? null;
}
