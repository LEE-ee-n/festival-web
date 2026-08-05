export type WebpConversionOptions = {
  maxEdge: number;
  quality: number;
  errorLabel: string;
  validateFile: (file: File) => Promise<void>;
};

export function getContainedImageOutputSize(
  width: number,
  height: number,
  maxEdge: number,
) {
  if (
    !Number.isFinite(width)
    || !Number.isFinite(height)
    || !Number.isFinite(maxEdge)
    || width <= 0
    || height <= 0
    || maxEdge <= 0
  ) {
    throw new Error("이미지 크기를 확인할 수 없습니다.");
  }

  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function convertImageToWebp(
  file: File,
  outputFileName: string,
  options: WebpConversionOptions,
) {
  await options.validateFile(file);

  const bitmap = await createImageBitmap(file);
  try {
    const outputSize = getContainedImageOutputSize(
      bitmap.width,
      bitmap.height,
      options.maxEdge,
    );
    const canvas = document.createElement("canvas");
    canvas.width = outputSize.width;
    canvas.height = outputSize.height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error(`${options.errorLabel} 변환 기능을 사용할 수 없습니다.`);
    }

    context.drawImage(bitmap, 0, 0, outputSize.width, outputSize.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error(`WebP ${options.errorLabel} 변환에 실패했습니다.`));
        },
        "image/webp",
        options.quality,
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
