export const SCHEDULE_IMAGE_STICKER_SIZE = {
  min: 80,
  max: 620,
  default: 260,
} as const;

export type ScheduleImageSticker = {
  id: string;
  source: "/stickers/rock-cat.png";
  label: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
};

export function createRockCatSticker(id: string): ScheduleImageSticker {
  return {
    id,
    source: "/stickers/rock-cat.png",
    label: "롹옹이",
    x: 540,
    y: 960,
    size: SCHEDULE_IMAGE_STICKER_SIZE.default,
    rotation: 0,
  };
}

export function clampStickerSize(size: number) {
  return Math.min(
    SCHEDULE_IMAGE_STICKER_SIZE.max,
    Math.max(SCHEDULE_IMAGE_STICKER_SIZE.min, size),
  );
}
