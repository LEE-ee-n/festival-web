import {
  SCHEDULE_IMAGE_HEIGHT,
  SCHEDULE_IMAGE_WIDTH,
} from "@/lib/schedule/scheduleImageLayout";

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("이미지를 만들지 못했습니다."));
    }, "image/png");
  });
}

function loadSvgImage(svg: SVGSVGElement) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const serializedSvg = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([serializedSvg], {
      type: "image/svg+xml;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지 미리보기를 변환하지 못했습니다."));
    };
    image.src = objectUrl;
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}

export async function saveScheduleImage(
  svg: SVGSVGElement,
  filename: string,
) {
  const image = await loadSvgImage(svg);
  const canvas = document.createElement("canvas");
  canvas.width = SCHEDULE_IMAGE_WIDTH;
  canvas.height = SCHEDULE_IMAGE_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) throw new Error("이미지 저장 기능을 사용할 수 없습니다.");

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], filename, { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  downloadBlob(blob, filename);
}
