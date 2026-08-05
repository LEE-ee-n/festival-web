import { validateFestivalThumbnailFile } from "./thumbnailValidation.ts";
import {
  convertImageToWebp,
  getContainedImageOutputSize,
} from "../images/webpConversion.ts";

export const FESTIVAL_THUMBNAIL_MAX_EDGE = 1600;
export const FESTIVAL_THUMBNAIL_WEBP_QUALITY = 0.85;

export function getFestivalThumbnailOutputSize(
  width: number,
  height: number,
  maxEdge = FESTIVAL_THUMBNAIL_MAX_EDGE,
) {
  return getContainedImageOutputSize(width, height, maxEdge);
}

export async function convertFestivalThumbnailToWebp(
  file: File,
  outputFileName: string,
) {
  return convertImageToWebp(file, outputFileName, {
    maxEdge: FESTIVAL_THUMBNAIL_MAX_EDGE,
    quality: FESTIVAL_THUMBNAIL_WEBP_QUALITY,
    errorLabel: "썸네일",
    validateFile: validateFestivalThumbnailFile,
  });
}
