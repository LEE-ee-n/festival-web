import { validateImageFile } from "../festivals/thumbnailValidation.ts";
import {
  convertImageToWebp,
  getContainedImageOutputSize,
} from "../images/webpConversion.ts";

export const ARTIST_IMAGE_MAX_EDGE = 800;
export const ARTIST_IMAGE_WEBP_QUALITY = 0.9;
export const ARTIST_IMAGE_BUCKET = "artist-images";

export function getArtistImageStoragePath(url: string) {
  const marker = `/${ARTIST_IMAGE_BUCKET}/`;
  try {
    const pathname = decodeURIComponent(new URL(url).pathname);
    const index = pathname.indexOf(marker);
    return index < 0 ? null : pathname.slice(index + marker.length);
  } catch {
    return null;
  }
}

export function getArtistImageFileName(normalizedName: string) {
  const trimmedName = normalizedName.trim();
  if (!/^[a-z0-9]+$/.test(trimmedName)) {
    throw new Error("normalized_name을 확인한 뒤 로고를 저장하세요.");
  }
  return `${trimmedName}.webp`;
}

export function getArtistImageOutputSize(width: number, height: number) {
  return getContainedImageOutputSize(width, height, ARTIST_IMAGE_MAX_EDGE);
}

export async function validateArtistImageFile(file: File) {
  return validateImageFile(file, "아티스트 로고");
}

export async function convertArtistImageToWebp(
  file: File,
  normalizedName: string,
) {
  return convertImageToWebp(file, getArtistImageFileName(normalizedName), {
    maxEdge: ARTIST_IMAGE_MAX_EDGE,
    quality: ARTIST_IMAGE_WEBP_QUALITY,
    errorLabel: "아티스트 로고",
    validateFile: validateArtistImageFile,
  });
}
