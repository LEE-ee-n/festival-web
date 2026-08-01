import { validateFestivalThumbnailFile } from "./thumbnailValidation.ts";

export const FESTIVAL_THUMBNAIL_MAX_EDGE = 1600;
export const FESTIVAL_THUMBNAIL_WEBP_QUALITY = 0.85;

export function getFestivalThumbnailOutputSize(
  width: number,
  height: number,
  maxEdge = FESTIVAL_THUMBNAIL_MAX_EDGE,
) {
  if (
    !Number.isFinite(width)
    || !Number.isFinite(height)
    || !Number.isFinite(maxEdge)
    || width <= 0
    || height <= 0
    || maxEdge <= 0
  ) {
    throw new Error("썸네일 이미지 크기를 확인할 수 없습니다.");
  }

  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function convertFestivalThumbnailToWebp(
  file: File,
  outputFileName: string,
) {
  await validateFestivalThumbnailFile(file);

  const bitmap = await createImageBitmap(file);
  try {
    const outputSize = getFestivalThumbnailOutputSize(
      bitmap.width,
      bitmap.height,
    );
    const canvas = document.createElement("canvas");
    canvas.width = outputSize.width;
    canvas.height = outputSize.height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("썸네일 변환 기능을 사용할 수 없습니다.");
    }

    context.drawImage(bitmap, 0, 0, outputSize.width, outputSize.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("WebP 썸네일 변환에 실패했습니다."));
        },
        "image/webp",
        FESTIVAL_THUMBNAIL_WEBP_QUALITY,
      );
    });

    if (blob.type !== "image/webp") {
      throw new Error("이 브라우저에서는 WebP 변환을 지원하지 않습니다.");
    }

    return new File([blob], outputFileName, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}
