export const FESTIVAL_THUMBNAIL_MAX_BYTES = 5 * 1024 * 1024;

export const FESTIVAL_THUMBNAIL_ACCEPT =
  ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

const allowedExtensions = new Set(["jpg", "jpeg", "png", "webp"]);
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function hasSupportedImageSignature(bytes: Uint8Array) {
  const isJpeg =
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const isWebp =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;

  return isJpeg || isPng || isWebp;
}

export async function validateFestivalThumbnailFile(file: File) {
  const extension = getFileExtension(file.name);

  if (
    !allowedExtensions.has(extension) ||
    !allowedMimeTypes.has(file.type.toLowerCase())
  ) {
    throw new Error("썸네일은 JPG, PNG, WebP 파일만 사용할 수 있습니다.");
  }

  if (file.size > FESTIVAL_THUMBNAIL_MAX_BYTES) {
    throw new Error("썸네일 파일은 5MB 이하여야 합니다.");
  }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  if (!hasSupportedImageSignature(header)) {
    throw new Error("파일 내용이 올바른 JPG, PNG 또는 WebP 이미지가 아닙니다.");
  }
}

export function validateFestivalThumbnailUrl(url: string) {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return;
  }

  let pathname: string;

  try {
    pathname = new URL(trimmedUrl).pathname;
  } catch {
    throw new Error("올바른 썸네일 URL을 입력하세요.");
  }

  const extension = getFileExtension(pathname);

  if (!allowedExtensions.has(extension)) {
    throw new Error("썸네일 URL은 JPG, PNG 또는 WebP 파일만 허용됩니다.");
  }
}

export function getFestivalThumbnailExtension(file: File) {
  if (file.type === "image/jpeg") {
    return "jpg";
  }

  if (file.type === "image/png") {
    return "png";
  }

  return "webp";
}
