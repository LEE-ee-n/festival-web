"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";

import {
  clampStickerSize,
  type ScheduleImageSticker,
} from "@/lib/schedule/scheduleImageSticker";

type StickerOperation = {
  type: "move" | "resize" | "rotate";
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startSticker: ScheduleImageSticker;
  svgWidth: number;
  svgHeight: number;
  startAngle?: number;
};

type ScheduleImageStickerLayerProps = {
  stickers: ScheduleImageSticker[];
  selectedId: string | null;
  accentColor: string;
  onSelect: (id: string | null) => void;
  onChange: (sticker: ScheduleImageSticker) => void;
};

function getPointerAngle(
  sticker: ScheduleImageSticker,
  clientX: number,
  clientY: number,
  rect: DOMRect,
) {
  const x = (clientX - rect.left) * (1080 / rect.width);
  const y = (clientY - rect.top) * (1920 / rect.height);
  return Math.atan2(y - sticker.y, x - sticker.x) * (180 / Math.PI);
}

export default function ScheduleImageStickerLayer({
  stickers,
  selectedId,
  accentColor,
  onSelect,
  onChange,
}: ScheduleImageStickerLayerProps) {
  const operationRef = useRef<StickerOperation | null>(null);

  function startOperation(
    event: ReactPointerEvent<SVGGElement>,
    sticker: ScheduleImageSticker,
    type: StickerOperation["type"],
  ) {
    event.preventDefault();
    event.stopPropagation();
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelect(sticker.id);
    operationRef.current = {
      type,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startSticker: sticker,
      svgWidth: rect.width,
      svgHeight: rect.height,
      startAngle:
        type === "rotate"
          ? getPointerAngle(sticker, event.clientX, event.clientY, rect)
          : undefined,
    };
  }

  function moveOperation(event: ReactPointerEvent<SVGGElement>) {
    const operation = operationRef.current;
    if (!operation || operation.pointerId !== event.pointerId) return;

    event.preventDefault();
    const deltaX =
      (event.clientX - operation.startClientX) * (1080 / operation.svgWidth);
    const deltaY =
      (event.clientY - operation.startClientY) * (1920 / operation.svgHeight);
    const sticker = operation.startSticker;

    if (operation.type === "move") {
      const halfSize = sticker.size / 2;
      onChange({
        ...sticker,
        x: Math.min(1080 - halfSize, Math.max(halfSize, sticker.x + deltaX)),
        y: Math.min(1920 - halfSize, Math.max(halfSize, sticker.y + deltaY)),
      });
      return;
    }

    if (operation.type === "resize") {
      onChange({
        ...sticker,
        size: clampStickerSize(sticker.size + Math.max(deltaX, deltaY) * 2),
      });
      return;
    }

    const svg = event.currentTarget.ownerSVGElement;
    if (!svg || operation.startAngle === undefined) return;
    const currentAngle = getPointerAngle(
      sticker,
      event.clientX,
      event.clientY,
      svg.getBoundingClientRect(),
    );
    onChange({
      ...sticker,
      rotation: sticker.rotation + currentAngle - operation.startAngle,
    });
  }

  function endOperation(event: ReactPointerEvent<SVGGElement>) {
    if (operationRef.current?.pointerId !== event.pointerId) return;
    operationRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <g>
      {stickers.map((sticker) => {
        const isSelected = sticker.id === selectedId;
        const halfSize = sticker.size / 2;

        return (
          <g
            key={sticker.id}
            transform={`translate(${sticker.x} ${sticker.y}) rotate(${sticker.rotation})`}
            onPointerDown={(event) => startOperation(event, sticker, "move")}
            onPointerMove={moveOperation}
            onPointerUp={endOperation}
            onPointerCancel={endOperation}
            style={{ cursor: "move", touchAction: "none" }}
          >
            <image
              href={sticker.source}
              x={-halfSize}
              y={-halfSize}
              width={sticker.size}
              height={sticker.size}
              preserveAspectRatio="xMidYMid meet"
            />

            {isSelected && (
              <g data-sticker-control="true">
                <rect
                  x={-halfSize}
                  y={-halfSize}
                  width={sticker.size}
                  height={sticker.size}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="5"
                  strokeDasharray="12 8"
                  pointerEvents="none"
                />
                <g
                  transform={`translate(${halfSize} ${halfSize})`}
                  onPointerDown={(event) => startOperation(event, sticker, "resize")}
                  style={{ cursor: "nwse-resize" }}
                >
                  <circle r="22" fill="#FFFFFF" stroke={accentColor} strokeWidth="6" />
                </g>
                <line
                  x1="0"
                  y1={-halfSize}
                  x2="0"
                  y2={-halfSize - 50}
                  stroke={accentColor}
                  strokeWidth="5"
                  pointerEvents="none"
                />
                <g
                  transform={`translate(0 ${-halfSize - 65})`}
                  onPointerDown={(event) => startOperation(event, sticker, "rotate")}
                  style={{ cursor: "grab" }}
                >
                  <circle r="22" fill="#FFFFFF" stroke={accentColor} strokeWidth="6" />
                </g>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}
